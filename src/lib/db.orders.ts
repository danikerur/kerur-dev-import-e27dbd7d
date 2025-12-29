import { supabase } from './supabase';
import {
  Customer,
  CustomerOrderListItem,
  CustomerOrder,
  CustomerOrderItem,
  NewOrderItemInput,
  OrderStatus,
  OrderWithItems,
  OrderProductOption,
} from '../types/orders';

const CUSTOMER_FIELDS = 'id, name, phone, address';
const ORDER_FIELDS =
  'id, customer_id, status, expected_delivery_date, total_amount, notes, created_at, updated_at';
const ORDER_ITEM_FIELDS =
  'id, order_id, product_name, variant, qty, unit_price';

const mapNullableString = (value?: string | null): string | null =>
  value === undefined ? null : value;

export interface CreateCustomerInput {
  name: string;
  phone?: string;
}

export async function createCustomer({
  name,
  phone,
}: CreateCustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name,
      phone: phone ?? null,
    })
    .select<typeof CUSTOMER_FIELDS, Customer>(CUSTOMER_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('הלקוח לא נשמר');
  }

  return data;
}

export async function fetchCustomers(query?: string): Promise<Customer[]> {
  let request = supabase
    .from('customers')
    .select<typeof CUSTOMER_FIELDS, Customer>(CUSTOMER_FIELDS)
    .order('name', { ascending: true });

  if (query && query.trim().length > 0) {
    request = request.ilike('name', `%${query.trim()}%`);
  }

  const { data, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export interface CreateOrderDraftInput {
  customer_id?: string | null;
  expected_delivery_date?: string | null;
  notes?: string | null;
}

export async function createOrderDraft({
  customer_id,
  expected_delivery_date,
  notes,
}: CreateOrderDraftInput): Promise<CustomerOrder> {
  const { data, error } = await supabase
    .from('customer_order')
    .insert([
      {
        customer_id: customer_id ?? null,
        expected_delivery_date: expected_delivery_date ?? null,
        notes: mapNullableString(notes),
        status: 'Draft',
      },
    ])
    .select<typeof ORDER_FIELDS, CustomerOrder>(ORDER_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('ההזמנה לא נמצאה לאחר יצירת הטיוטה');
  }

  return data;
}

export async function getOrderById(order_id: string): Promise<OrderWithItems> {
  const { data: order, error: orderError } = await supabase
    .from('customer_order')
    .select<typeof ORDER_FIELDS, CustomerOrder>(ORDER_FIELDS)
    .eq('id', order_id)
    .single();

  if (orderError) {
    throw new Error(orderError.details || orderError.message);
  }

  if (!order) {
    throw new Error('ההזמנה לא נמצאה');
  }

  const [{ data: items, error: itemsError }, customer] = await Promise.all([
    supabase
      .from('customer_order_items')
      .select<typeof ORDER_ITEM_FIELDS, CustomerOrderItem>(ORDER_ITEM_FIELDS)
      .eq('order_id', order_id)
      .order('id', { ascending: true }),
    (async () => {
      if (!order.customer_id) {
        return null;
      }
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select<typeof CUSTOMER_FIELDS, Customer>(CUSTOMER_FIELDS)
        .eq('id', order.customer_id)
        .single();

      if (customerError) {
        console.error('שגיאה בטעינת פרטי לקוח', customerError);
        return null;
      }

      return customerData ?? null;
    })(),
  ]);

  if (itemsError) {
    throw new Error(itemsError.details || itemsError.message);
  }

  return {
    order: {
      ...order,
      customer,
    },
    items: items ?? [],
  };
}

export async function fetchCustomerOrders(): Promise<CustomerOrderListItem[]> {
  type Row = CustomerOrder & {
    customers?: Customer | null;
    customer_order_items?: { product_name: string; variant?: string | null }[] | null;
  };

  const { data, error } = await supabase
    .from('customer_order')
    .select<string, Row>(
      `${ORDER_FIELDS}, customers:customers ( ${CUSTOMER_FIELDS} ), customer_order_items ( product_name, variant )`,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status,
    expected_delivery_date: r.expected_delivery_date,
    total_amount: r.total_amount,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    customer: r.customers ?? null,
    items: (r.customer_order_items ?? [])?.map((i) => ({
      product_name: i.product_name,
      variant: i.variant ?? undefined,
    })),
  }));
}

export async function searchProductsForOrder(
  query?: string,
  limit = 40,
): Promise<OrderProductOption[]> {
  let request = supabase
    .from('products')
    .select<string, OrderProductOption>('id, name, product_code, supplier, image_url, options_type, dimensions')
    .order('name', { ascending: true })
    .limit(limit);

  if (query && query.trim().length > 0) {
    const term = `%${query.trim()}%`;
    request = request.or(
      `name.ilike.${term},product_code.ilike.${term},supplier.ilike.${term}`,
    );
  }

  const { data, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function addOrderItems(
  order_id: string,
  items: NewOrderItemInput[],
): Promise<CustomerOrderItem[]> {
  const payload = items.map((item) => ({
    order_id,
    product_name: item.product_name,
    variant: mapNullableString(item.variant),
    qty: item.qty,
    unit_price: item.unit_price,
  }));

  const { data, error } = await supabase
    .from('customer_order_items')
    .insert(payload)
    .select<typeof ORDER_ITEM_FIELDS, CustomerOrderItem>(ORDER_ITEM_FIELDS);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

type UpdateOrderItemPatch = Partial<
  Pick<CustomerOrderItem, 'product_name' | 'variant' | 'qty' | 'unit_price'>
>;

export async function updateOrderItem(
  item_id: string,
  patch: UpdateOrderItemPatch,
): Promise<CustomerOrderItem> {
  if (Object.keys(patch).length === 0) {
    throw new Error('לא הועברו שדות לעדכון');
  }

  const { data: existingItem, error: loadError } = await supabase
    .from('customer_order_items')
    .select<typeof ORDER_ITEM_FIELDS, CustomerOrderItem>(ORDER_ITEM_FIELDS)
    .eq('id', item_id)
    .single();

  if (loadError) {
    throw new Error(loadError.message);
  }

  if (!existingItem) {
    throw new Error('פריט לא נמצא');
  }

  const { data, error } = await supabase
    .from('customer_order_items')
    .update({
      ...patch,
      variant:
        patch.variant === undefined
          ? existingItem.variant
          : mapNullableString(patch.variant),
    })
    .eq('id', item_id)
    .select<typeof ORDER_ITEM_FIELDS, CustomerOrderItem>(ORDER_ITEM_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('הפריט לא נמצא לאחר העדכון');
  }

  return data;
}

export async function deleteOrderItem(item_id: string): Promise<void> {
  const { error } = await supabase
    .from('customer_order_items')
    .delete()
    .eq('id', item_id);

  if (error) {
    throw new Error(error.message);
  }
}

type UpdateOrderPatch = Partial<
  Pick<CustomerOrder, 'customer_id' | 'expected_delivery_date' | 'notes'>
>;

export async function updateOrder(
  order_id: string,
  patch: UpdateOrderPatch,
): Promise<CustomerOrder> {
  if (Object.keys(patch).length === 0) {
    const { data, error } = await supabase
      .from('customer_order')
      .select<typeof ORDER_FIELDS, CustomerOrder>(ORDER_FIELDS)
      .eq('id', order_id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('ההזמנה לא נמצאה');
    }

    return data;
  }

  const payload: Record<string, unknown> = {};

  if (patch.customer_id !== undefined) {
    payload.customer_id = patch.customer_id || null;
  }

  if (patch.expected_delivery_date !== undefined) {
    payload.expected_delivery_date = patch.expected_delivery_date || null;
  }

  if (patch.notes !== undefined) {
    payload.notes = mapNullableString(patch.notes);
  }

  const { data, error } = await supabase
    .from('customer_order')
    .update(payload)
    .eq('id', order_id)
    .select<typeof ORDER_FIELDS, CustomerOrder>(ORDER_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('ההזמנה לא נמצאה לאחר העדכון');
  }

  return data;
}

export async function setOrderStatus(
  order_id: string,
  status: OrderStatus,
): Promise<CustomerOrder> {
  const { data, error } = await supabase
    .from('customer_order')
    .update({ status })
    .eq('id', order_id)
    .select<typeof ORDER_FIELDS, CustomerOrder>(ORDER_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('ההזמנה לא נמצאה לאחר עדכון הסטטוס');
  }

  // Upon fulfillment - decrement warehouse inventory quantities per item
  if (status === 'Fulfilled') {
    try {
      // Load items for this order
      type ItemRow = { id: string; product_name: string; variant: string | null; qty: number };
      const { data: items, error: itemsError } = await supabase
        .from('customer_order_items')
        .select<string, ItemRow>('id, product_name, variant, qty')
        .eq('order_id', order_id);
      if (itemsError) {
        // Don't fail the whole call; log and continue
        console.error('[orders] fulfill: failed loading items', itemsError);
      } else {
        // Helpers
        const parseVariant = (variant?: string | null): { model?: string; size?: string; warehouse_id?: string } => {
          if (!variant) return {};
          try {
            const meta = JSON.parse(variant);
            if (meta && typeof meta === 'object') {
              return {
                model: typeof meta.model === 'string' ? meta.model : undefined,
                size: typeof meta.size === 'string' ? meta.size : undefined,
                warehouse_id: typeof meta.warehouse_id === 'string' ? meta.warehouse_id : undefined,
              };
            }
          } catch {}
          return {};
        };
        const parseSizeDims = (size?: string | null): { width?: number | null; height?: number | null; length?: number | null } => {
          if (!size) return { width: null, height: null, length: null };
          const nums = String(size).replace(/[×✕*X]/g, 'x').split(/[^\d.]+/).filter(Boolean).slice(0, 3);
          const [w, h, l] = nums.map((n) => Number(n)).map((n) => (Number.isFinite(n) ? n : null));
          return { width: w ?? null, height: h ?? null, length: l ?? null };
        };

        for (const it of items ?? []) {
          const meta = parseVariant(it.variant);
          const whId = meta.warehouse_id;
          const productCode = meta.model;
          const dims = parseSizeDims(meta.size);
          const qty = Number(it.qty) || 0;
          if (!whId || !productCode || qty <= 0) {
            continue;
          }
          // Find product by product_code
          const { data: prodRows, error: prodError } = await supabase
            .from('products')
            .select('id')
            .eq('product_code', productCode)
            .limit(1);
          if (prodError || !prodRows || prodRows.length === 0) {
            console.warn('[orders] fulfill: product not found by code', { productCode });
            continue;
          }
          const productId = (prodRows[0] as any).id as string;

          // Load inventory rows for this product and warehouse; pick the one matching dimensions
          type InvRow = { id: string; quantity: number; product_size: { width?: number | null; height?: number | null; length?: number | null } | null };
          const { data: invRows, error: invError } = await supabase
            .from('warehouse_inventory')
            .select<string, InvRow>('id, quantity, product_size')
            .eq('warehouse_id', whId)
            .eq('product_id', productId);
          if (invError || !invRows || invRows.length === 0) {
            console.warn('[orders] fulfill: inventory row not found', { whId, productId, productCode });
            continue;
          }

          const matchRow = (() => {
            const w = dims.width ?? null;
            const h = dims.height ?? null;
            const l = dims.length ?? null;
            // If no size provided, prefer single row; otherwise exact match
            if (w === null && h === null && l === null) {
              return invRows.length === 1 ? invRows[0] : null;
            }
            return invRows.find((r) => {
              const ps = r.product_size || {};
              const rw = (ps.width ?? null) as number | null;
              const rh = (ps.height ?? null) as number | null;
              const rl = (ps.length ?? null) as number | null;
              return (rw ?? null) === w && (rh ?? null) === h && (rl ?? null) === l;
            }) || null;
          })();

          if (!matchRow) {
            console.warn('[orders] fulfill: no matching inventory dimensions', { whId, productId, dims });
            continue;
          }

          const newQuantity = Math.max(0, Number(matchRow.quantity || 0) - qty);
          const { error: updateError } = await supabase
            .from('warehouse_inventory')
            .update({ quantity: newQuantity })
            .eq('id', matchRow.id);
          if (updateError) {
            console.error('[orders] fulfill: failed to update inventory quantity', { id: matchRow.id, updateError });
          }
        }
      }
    } catch (e) {
      console.error('[orders] fulfill: unexpected error when decrementing inventory', e);
    }
  }

  return data;
}

export async function deleteOrder(order_id: string): Promise<void> {
  // מחיקה בטוחה: קודם כל הפריטים, ואז ההזמנה
  const { error: itemsError } = await supabase
    .from('customer_order_items')
    .delete()
    .eq('order_id', order_id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const { error: orderError } = await supabase
    .from('customer_order')
    .delete()
    .eq('id', order_id);

  if (orderError) {
    throw new Error(orderError.message);
  }
}
