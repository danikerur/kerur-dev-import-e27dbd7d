import type { InventoryRow } from '../types/inventory';
import { supabase } from './supabase';
import { normalizeText, normalizeSize, extractSizeFromVariant } from './normalizers';
import type { Warehouse } from '../types/inventory';

export async function fetchInventory(): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('v_inventory')
    .select('*')
    .order('product_name', { ascending: true })
    .order('size_label', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as InventoryRow[];
}

// עדכון/יצירת שורת מלאי עבור וריאנט ספציפי (UPSERT אל public.inventory_balances)
export async function updateInventoryRow(
  variant_id: string,
  patch: Partial<Pick<InventoryRow, 'on_hand' | 'on_order_from_supplier'>>
): Promise<void> {
  const { error } = await supabase
    .from('inventory_balances')
    .upsert({ variant_id, ...patch }, { onConflict: 'variant_id' });
  if (error) throw new Error(error.message);
}

// טוען תמונות מוצרים לפי מזהים
export async function fetchProductsByIds(productIds: string[]): Promise<Record<string, string | null>> {
  if (!productIds || productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('products')
    .select('id, image_url')
    .in('id', productIds);
  if (error) throw new Error(error.message);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) {
    map[(row as any).id as string] = ((row as any).image_url as string) ?? null;
  }
  return map;
}

// קטגוריות עבור מוצרים לפי מזהים
export async function fetchProductCategoryIds(productIds: string[]): Promise<Record<string, string | null>> {
  if (!productIds || productIds.length === 0) return {};
  const { data, error } = await supabase
    .from('products')
    .select('id, category_id')
    .in('id', productIds);
  if (error) throw new Error(error.message);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) {
    map[(row as any).id as string] = ((row as any).category_id as string) ?? null;
  }
  return map;
}

export type Category = { id: string; name: string; parent_id: string | null };

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, parent_id');
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

// Warehouses list for selector
export async function fetchWarehousesList(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Warehouse[];
}

// Load warehouse inventory rows for a specific warehouse
export type WarehouseInventoryRow = {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  product_size: {
    length?: number | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

export async function fetchWarehouseInventoryByWarehouse(warehouseId: string): Promise<WarehouseInventoryRow[]> {
  if (!warehouseId) return [];
  const { data, error } = await supabase
    .from('warehouse_inventory')
    .select('id, warehouse_id, product_id, quantity, product_size')
    .eq('warehouse_id', warehouseId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as WarehouseInventoryRow[];
}

export async function upsertWarehouseInventoryQuantity(
  warehouseId: string,
  productId: string,
  size: { length?: number | null; width?: number | null; height?: number | null },
  quantity: number
): Promise<void> {
  // Ensure numeric or null values
  const payload = {
    warehouse_id: warehouseId,
    product_id: productId,
    product_size: {
      length: typeof size.length === 'number' ? size.length : size.length ?? null,
      width: typeof size.width === 'number' ? size.width : size.width ?? null,
      height: typeof size.height === 'number' ? size.height : size.height ?? null,
    },
    quantity,
  };
  const { error } = await supabase
    .from('warehouse_inventory')
    // Use unique generated column inventory_key for conflict target (added via migration)
    .upsert(payload as any, { onConflict: 'inventory_key' });
  if (error) throw new Error(error.message);
}

// חישוב שמור ללקוחות לפי הזמנות פעילות (Draft/Confirmed)
export async function fetchReservedCounts(): Promise<Record<string, number>> {
  // 1) קח הזמנות פעילות
  const { data: orders, error: ordersError } = await supabase
    .from('customer_order')
    .select('id, status')
    .in('status', ['Draft', 'Confirmed']);
  if (ordersError) throw new Error(ordersError.message);
  const orderIds = (orders ?? []).map((o: any) => o.id as string);
  if (orderIds.length === 0) return {};

  // 2) טען פריטי הזמנה עבור הזמנות אלו
  const { data: items, error: itemsError } = await supabase
    .from('customer_order_items')
    .select('order_id, product_name, variant, qty')
    .in('order_id', orderIds);
  if (itemsError) throw new Error(itemsError.message);

  // 3) קיבוץ לפי warehouse_id + product_name + size (מתוך variant JSON)
  //    חשוב: נספור רק פריטים עם warehouse_id מוגדר כדי לא להפחית מכל המחסנים
  const result: Record<string, number> = {};

  for (const it of items ?? []) {
    const productName = normalizeText((it as any).product_name as string);
    const qty = Number((it as any).qty) || 0;
    // שלוף warehouse_id מתוך variant JSON (אם קיים)
    let warehouseId: string | null = null;
    const rawVariant = (it as any).variant as string | null | undefined;
    if (rawVariant) {
      try {
        const meta = JSON.parse(rawVariant);
        if (meta && typeof meta === 'object') {
          if (typeof meta.warehouse_id === 'string' && meta.warehouse_id.trim().length > 0) {
            warehouseId = meta.warehouse_id.trim();
          }
        }
      } catch { }
    }
    // אם אין מחסן — אל תוריד ממחסנים כלל (נתון לא מוקצה)
    if (!warehouseId) {
      continue;
    }
    let size = extractSizeFromVariant(rawVariant);
    if (!size) {
      size = normalizeSize((it as any).product_name as string);
    }
    const key = `${warehouseId}__${productName}__${size}`;
    result[key] = (result[key] ?? 0) + qty;
  }
  return result;
}

export type ReservedDetail = {
  order_id: string;
  status: string;
  customer_name?: string | null;
  qty: number;
  product_name: string;
  size: string;
  created_at?: string;
  expected_delivery_date?: string | null;
  total_amount?: number | null;
};

export async function fetchReservedDetails(
  productName: string,
  sizeLabel: string,
  warehouseId?: string,
): Promise<ReservedDetail[]> {
  // helpers have to be duplicated here to keep single import surface
  const normalizeName = (name?: string | null) => (name ?? '').trim().toLowerCase();
  const normalizeSize = (raw?: string | null) => {
    if (!raw) return '';
    const text = String(raw);
    const cleaned = text
      .replace(/[×✕*X]/g, 'x')
      .replace(/[\s\u200e\u200f\u202A-\u202E]/g, '');
    const nums = cleaned.split(/[^\\d.]+/).filter(Boolean);
    if (nums && nums.length >= 2) {
      return nums
        .slice(0, 3)
        .map((n) => Number(n))
        .sort((a, b) => a - b)
        .map((n) => String(n))
        .join('x');
    }
    return cleaned.toLowerCase();
  };

  const invName = normalizeName(productName);
  const invSize = normalizeSize(sizeLabel);
  const invKey = `${invName}__${invSize}`;
  try {
    console.log('[inventory] reserved-details start', { productName, sizeLabel, invName, invSize, invKey });
  } catch { }

  // 1) active orders with customer join
  type OrderRow = {
    id: string;
    status: string;
    created_at: string;
    expected_delivery_date?: string | null;
    total_amount?: number | null;
    customers?: { name?: string | null } | null
  };
  const { data: orders, error: ordersError } = await supabase
    .from('customer_order')
    .select('id, status, created_at, expected_delivery_date, total_amount, customers:customers ( name )')
    .in('status', ['Draft', 'Confirmed']);
  if (ordersError) throw new Error(ordersError.message);
  const orderIds = (orders ?? []).map((o: any) => o.id);
  if (orderIds.length === 0) return [];
  const orderById = new Map<string, OrderRow>();
  (orders ?? []).forEach((o: any) => orderById.set(o.id, o as OrderRow));
  try {
    console.log('[inventory] reserved-details orders', { count: orderIds.length });
  } catch { }

  // 2) items for those orders; we keep broad product filter then narrow locally
  type ItemRow = { order_id: string; product_name: string; variant: string | null; qty: number };
  const { data: items, error: itemsError } = await supabase
    .from('customer_order_items')
    .select('order_id, product_name, variant, qty')
    .in('order_id', orderIds);
  if (itemsError) throw new Error(itemsError.message);
  try {
    console.log('[inventory] reserved-details items', { count: (items ?? []).length });
    console.log('[inventory] reserved-details items raw sample', (items ?? []).slice(0, 5));
  } catch { }

  const simplify = (s: string) => s.replace(/[^א-תa-z0-9]/gi, '').trim();
  const invSimple = simplify(invName);
  const result: ReservedDetail[] = [];

  for (const it of (items ?? []) as ItemRow[]) {
    const itemName = normalizeName(it.product_name);
    const rawVariant = it.variant;
    // סינון לפי warehouseId אם הועבר
    if (warehouseId) {
      try {
        const meta = rawVariant ? JSON.parse(rawVariant) : null;
        const vWh = meta && typeof meta === 'object' ? (typeof meta.warehouse_id === 'string' ? meta.warehouse_id : null) : null;
        if (!vWh || vWh !== warehouseId) {
          continue;
        }
      } catch {
        // אם ה-variant לא קריא כ-JSON, דלג כשיש דרישת מחסן
        continue;
      }
    }
    let size = extractSizeFromVariant(rawVariant);
    if (!size) {
      size = normalizeSize(it.product_name);
    }
    const itemKey = `${itemName}__${size}`;

    // match primarily by size (to avoid missing due to subtle name variations)
    const nameMatch = simplify(itemName).includes(invSimple) || invSimple.includes(simplify(itemName));
    try {
      console.log('[inventory] reserved-details item', {
        order_id: it.order_id,
        itemName,
        rawVariant,
        size,
        itemKey,
        nameMatch,
        invKey,
        invSize,
        invName,
      });
    } catch { }
    if (size === invSize) {
      const o = orderById.get(it.order_id);
      result.push({
        order_id: it.order_id,
        status: o?.status ?? '',
        customer_name: o?.customers?.name ?? null,
        qty: Number(it.qty) || 0,
        product_name: it.product_name,
        size,
        created_at: o?.created_at,
        expected_delivery_date: o?.expected_delivery_date ?? null,
        total_amount: o?.total_amount ?? null,
      });
    }
  }

  // Fallback: אם לא נמצאו התאמות בשם, נסה התאמה לפי מידה בלבד + דמיון מילולי קל בשם (למקרה של מקפים/מילים נוספות)
  if (result.length === 0) {
    const tokenScore = (a: string, b: string) => {
      const ta = new Set(a.split(/[^א-ת0-9]+/).filter(Boolean));
      const tb = new Set(b.split(/[^א-ת0-9]+/).filter(Boolean));
      let inter = 0;
      for (const t of ta) if (tb.has(t)) inter++;
      return inter;
    };
    const doorType = (s: string): 'open' | 'slide' | null => {
      const t = s.toLowerCase();
      if (t.includes('פתיחה')) return 'open';
      if (t.includes('הזזה')) return 'slide';
      return null;
    };
    const invDoor = doorType(invName);
    for (const it of (items ?? []) as ItemRow[]) {
      // סינון לפי מחסן אם נדרש
      if (warehouseId) {
        const rawVariant = it.variant;
        try {
          const meta = rawVariant ? JSON.parse(rawVariant) : null;
          const vWh = meta && typeof meta === 'object' ? (typeof meta.warehouse_id === 'string' ? meta.warehouse_id : null) : null;
          if (!vWh || vWh !== warehouseId) {
            continue;
          }
        } catch {
          continue;
        }
      }
      const itemName = normalizeName(it.product_name);
      let size = extractSizeFromVariant(it.variant);
      if (!size) size = normalizeSize(it.product_name);
      if (size !== invSize) continue;
      // דרישת דמיון מילולי בסיסי, ותאימות בסוג הדלת (פתיחה/הזזה) אם ניתן לזהות
      if (tokenScore(itemName, invName) < 2) continue;
      const itemDoor = doorType(itemName);
      if (invDoor && itemDoor && invDoor !== itemDoor) continue;
      const o = orderById.get(it.order_id);
      result.push({
        order_id: it.order_id,
        status: o?.status ?? '',
        customer_name: o?.customers?.name ?? null,
        qty: Number(it.qty) || 0,
        product_name: it.product_name,
        size,
        created_at: o?.created_at,
        expected_delivery_date: o?.expected_delivery_date ?? null,
        total_amount: o?.total_amount ?? null,
      });
    }
    try {
      console.log('[inventory] reserved-details fallback result', { count: result.length });
    } catch { }
  }

  // Fallback אחרון: אם עדיין לא נמצאה התאמה – הצג לפי מידה בלבד (בלי בדיקת שם).
  if (result.length === 0) {
    for (const it of (items ?? []) as ItemRow[]) {
      if (warehouseId) {
        const rawVariant = it.variant;
        try {
          const meta = rawVariant ? JSON.parse(rawVariant) : null;
          const vWh = meta && typeof meta === 'object' ? (typeof meta.warehouse_id === 'string' ? meta.warehouse_id : null) : null;
          if (!vWh || vWh !== warehouseId) {
            continue;
          }
        } catch {
          continue;
        }
      }
      let size = extractSizeFromVariant(it.variant);
      if (!size) size = normalizeSize(it.product_name);
      if (size !== invSize) continue;
      const o = orderById.get(it.order_id);
      result.push({
        order_id: it.order_id,
        status: o?.status ?? '',
        customer_name: o?.customers?.name ?? null,
        qty: Number(it.qty) || 0,
        product_name: it.product_name,
        size,
        created_at: o?.created_at,
        expected_delivery_date: o?.expected_delivery_date ?? null,
        total_amount: o?.total_amount ?? null,
      });
    }
    try {
      console.log('[inventory] reserved-details final fallback by size', { count: result.length });
    } catch { }
  }

  try {
    console.log('[inventory] reserved-details done', { resultCount: result.length, sample: result.slice(0, 5) });
  } catch { }
  return result;
}
