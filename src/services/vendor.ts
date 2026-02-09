import { User } from 'firebase/auth';
import { Product, PaginatedResponse, Order } from '@/types';

async function getAuthHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export interface VendorDashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  outOfStockProducts: number;
  recentOrders: number;
}

export interface VendorProductPricingUpdate {
  price?: number;
  sale_price?: number | null;
  discount_percent?: number | null;
  variants?: {
    id: string;
    price?: number;
    sale_price?: number | null;
    discount_percent?: number | null;
  }[];
}

export const vendorService = {
  getDashboardStats: async (
    user: User,
    vendorId?: string
  ): Promise<VendorDashboardStats> => {
    const headers = await getAuthHeaders(user);
    const params = vendorId ? `?vendor_id=${vendorId}` : '';
    const response = await fetch(`/api/vendor/dashboard${params}`, { headers });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
  },

  getProducts: async (
    user: User,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      vendor_id?: string;
    }
  ): Promise<PaginatedResponse<Product>> => {
    const headers = await getAuthHeaders(user);
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.vendor_id) searchParams.set('vendor_id', params.vendor_id);

    const query = searchParams.toString();
    const response = await fetch(
      `/api/vendor/products${query ? `?${query}` : ''}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vendor products');
    }

    return response.json();
  },

  updateProductPricing: async (
    user: User,
    productId: string,
    data: VendorProductPricingUpdate
  ): Promise<Product> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch(`/api/vendor/products/${productId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product pricing');
    }

    return response.json();
  },

  getOrders: async (
    user: User,
    status?: string,
    vendorId?: string
  ): Promise<Order[]> => {
    const headers = await getAuthHeaders(user);
    const searchParams = new URLSearchParams();

    if (status) searchParams.set('status', status);
    if (vendorId) searchParams.set('vendor_id', vendorId);

    const query = searchParams.toString();
    const response = await fetch(
      `/api/vendor/orders${query ? `?${query}` : ''}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch vendor orders');
    }

    return response.json();
  },
};
