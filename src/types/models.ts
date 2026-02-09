export type Role = 'USER' | 'ADMIN' | 'CLINIC' | 'VENDOR';

export type ClinicRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type VendorRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  user_id: string;
  clinic_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicRequest {
  id: string;
  user_id: string;
  clinic_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  status: ClinicRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
  };
}

export interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorRequest {
  id: string;
  user_id: string;
  company_name: string;
  identification_number: string;
  email: string;
  description: string | null;
  city: string;
  address: string;
  phone_number: string;
  status: VendorRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: Role;
  };
}

export interface Category {
  id: string;
  name: string;
  name_ka: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
  parent?: Category;
  children?: Category[];
  products?: Product[];
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  url: string;
  filename: string;
  original_name: string;
  type: string;
  size: number | null;
  product_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  name_ka: string;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  name_ka: string;
  description: string | null;
  description_ka: string | null;
  manufacturer: string | null;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  sku: string;
  stock: number;
  category_id: string;
  category?: Category;
  vendor_id: string | null;
  vendor?: Vendor;
  media?: Media[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'INVOICE_SENT' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string;
  address?: Address;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  subtotal: string;
  discount: string;
  delivery_fee: string;
  total: string;
  notes: string | null;
  invoice_url: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CheckoutOrderData {
  addressId: string;
  address: Address | null;
  paymentMethod: string;
  notes: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  variant_id: string | null;
  variant?: ProductVariant;
  variant_name: string | null;
  quantity: number;
  price: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CartProduct {
  id: string;
  name: string;
  name_ka: string;
  price: string;
  sale_price: string | null;
  discount_percent: number | null;
  media?: Media[];
  manufacturer: string | null;
  stock: number;
  variants?: ProductVariant[];
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  variant?: ProductVariant;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: CartProduct;
}

export interface Address {
  id: string;
  user_id: string;
  city: string;
  address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Order status email types
export interface OrderStatusEmailData {
  orderNumber: string;
  customerName: string;
  changedField: 'status' | 'payment_status';
  newStatus: string;
  invoiceUrl: string | null;
}

// Invoice types for email
export interface InvoiceOrderItem {
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  address: {
    city: string;
    address: string;
  };
  items: InvoiceOrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  orderDate: string;
  paymentMethod: string;
}
