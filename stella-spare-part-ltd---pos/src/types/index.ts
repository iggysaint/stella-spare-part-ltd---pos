export type ProductCategory = 
  | 'Engine'
  | 'Brakes'
  | 'Suspension'
  | 'Cooling'
  | 'Electrical'
  | 'Transmission'
  | 'Fuel'
  | 'Body/Van';

export type CompatibleVehicle = 
  | 'Mercedes-Benz Sprinter'
  | 'Toyota HiAce'
  | 'Hyundai Grace/H100'
  | 'Nissan Urvan'
  | 'General / Universal';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  sku?: string;
  compatible_vehicles: string[];
  description?: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstanding_balance: number;
  notes?: string;
  created_at: string;
}

export type PaymentMethod = 'CASH' | 'CREDIT';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: string;
  receipt_number: string;
  customer_id: string | null;
  customer_name: string | null;
  total_amount: number;
  discount_amount: number;
  payment_method: PaymentMethod;
  amount_received: number;
  amount_paid_now: number;
  change_given: number;
  outstanding_credit: number;
  notes?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  category?: ProductCategory;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type CreditTransactionType = 'CREDIT_SALE' | 'PAYMENT';

export interface CreditTransaction {
  id: string;
  customer_id: string;
  sale_id: string | null;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  payment_method: 'CASH' | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  phone_number: string;
  address: string;
  receipt_footer: string;
  receipt_paper_size: '58mm' | '80mm';
  currency_symbol: string;
}

export interface UserSession {
  id: string;
  name: string;
  isLoggedIn: boolean;
}
