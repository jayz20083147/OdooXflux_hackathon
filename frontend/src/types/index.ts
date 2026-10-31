export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: 'admin' | 'staff' | 'customer';
  phone?: string;
  is_verified: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  product_type: string;
  sales_price: number;
  cost_price: number;
  notes?: string;
  sku?: string;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  variant_name: string;
  price_adjustment: number;
  description?: string;
}

export interface Plan {
  id: number;
  name: string;
  product_id: number;
  cost: number;
  billing_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minimum_quantity: number;
  start_date?: string;
  end_date?: string;
  lifecycle_type: string;
  notes?: string;
}

export interface Subscription {
  id: number;
  subscription_number: string;
  customer_id: number;
  plan_id: number;
  start_date: string;
  expiry_date?: string;
  status: 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed' | 'paused';
  payment_terms?: string;
  notes?: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  subscription_id: number;
  customer_id: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'confirmed' | 'paid' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  payment_method: string;
  amount: number;
  payment_date: string;
  reference_number?: string;
  notes?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
