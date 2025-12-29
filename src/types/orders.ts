export type OrderStatus = 'Draft' | 'Confirmed' | 'Fulfilled' | 'Cancelled';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface CustomerOrder {
  id: string;
  customer_id: string;
  status: OrderStatus;
  expected_delivery_date?: string | null;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  product_name: string;
  variant?: string | null;
  qty: number;
  unit_price: number;
  total_price?: number;
}

export interface NewOrderItemInput {
  product_name: string;
  variant?: string;
  qty: number;
  unit_price: number;
}

export interface OrderWithItems {
  order: CustomerOrder & { customer?: Customer | null };
  items: CustomerOrderItem[];
}

export interface CustomerOrderListItem extends CustomerOrder {
  customer?: Customer | null;
  items?: Array<{
    product_name: string;
    variant?: string | null;
  }>;
}

export interface OrderProductOption {
  id: string;
  name: string;
  product_code?: string | null;
  supplier?: string | null;
  image_url?: string | null;
  options_type?: string | null;
  dimensions?: Array<{
    product_code?: string | null;
    model?: string | null;
    height?: number | null;
    width?: number | null;
    depth?: number | null;
  }> | null;
}
