export type Role = 'USER' | 'ADMIN' | 'CLINIC';

export type ClinicRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

export interface Category {
  id: string;
  name: string;
  name_ka: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
  children?: Category[];
  products?: Product[];
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
  sku: string;
  stock: number;
  images: string[];
  category_id: string;
  category?: Category;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
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
  images: string[];
  manufacturer: string | null;
  stock: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product: CartProduct;
}
