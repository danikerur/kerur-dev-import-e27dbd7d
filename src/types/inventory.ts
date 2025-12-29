export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  updated_at: string;
  display_order?: number | null;
  product_size?: {
    length: number;
    width: number;
    height: number;
    product_code?: string;
  };
  product: {
    id: string;
    name: string;
    product_code: string | null;
    supplier: string | null;
    image_url: string | null;
    specifications: {
      length: number;
      width: number;
      height: number;
    };
    dimensions?: Array<{
      id: string;
      length: number;
      width: number;
      height: number;
      product_code?: string;
    }>;
  };
}

export interface InventoryProduct {
  id: string;
  product_code: string | null;
  name: string;
  supplier: string | null;
  image_url: string | null;
  created_at: string;
}

// Inventory tracking view row (public.v_inventory)
export type InventoryRow = {
  product_id: string;
  product_name: string;
  variant_id: string;
  size_label: string | null;
  width: number | null;
  height: number | null;
  length: number | null;
  on_hand: number;
  on_order_from_supplier: number;
  reserved_for_customers: number;
  available_now: number;
};
