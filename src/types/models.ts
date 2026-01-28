export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
  updated_at: string;
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
