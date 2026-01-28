import type { Product, PaginatedResponse } from '@/types';
import { api } from './api';

interface GetProductsParams {
  page?: number;
  limit?: number;
  category_id?: string;
  category_slug?: string;
  search?: string;
}

export const productsService = {
  getAll: (params?: GetProductsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.category_id) searchParams.set('category_id', params.category_id);
    if (params?.category_slug) searchParams.set('category_slug', params.category_slug);
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return api.get<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Product>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/products/${id}`),
};
