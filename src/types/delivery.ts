export interface Driver {
  id: string;
  full_name: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Dimension {
  id: string;
  length: number;
  width: number;
  height: number;
  product_code?: string;
  model?: string;
}

export interface Product {
  id: string;
  name: string;
  specifications: {
    length: number;
    width: number;
    height: number;
  };
  dimensions?: Dimension[];
  image_url?: string | null;
  options_type?: string;
}

export interface SelectedProduct {
  id: string;
  product: Product;
  quantity: number;
  selectedDimensionIndex?: number;
  selectedVariation?: any;
}

export interface SelectedCustomer {
  id: string;
  customer: Customer;
  products: SelectedProduct[];
  delivery_price: number;
  notes: string;
  order: number;
  distance?: number;
}

export interface DeliveryProduct {
  id: string;
  product_id: string;
  quantity: number;
  dimension_index?: number;
  product: Product;
  product_size?: any;
}

export interface DeliveryCustomer {
  id: string;
  customer_id: string;
  delivery_price: number;
  notes: string;
  address: string;
  order: number;
  customer: Customer;
  products: DeliveryProduct[];
}

export interface Delivery {
  id: string;
  driver_id: string | null;
  delivery_date: string | null;
  status: 'planned' | 'completed' | 'canceled';
  created_at: string;
  driver?: Driver;
  customers: DeliveryCustomer[];
}

export interface MonthGroup {
  month: string;
  year: number;
  deliveries: Delivery[];
}
