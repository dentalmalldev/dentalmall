import type { Product, ProductListResponse, ProductFacets } from '@/types';
import { api } from './api';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category_id?: string;
  category_slug?: string;
  vendor_id?: string;
  search?: string;
  // Shop filters
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  vendors?: string[];
  availability?: string;
  onSale?: boolean;
  hasVariants?: boolean;
  sort?: string;
}

export interface GetFacetsParams {
  category_id?: string;
  category_slug?: string;
  vendor_id?: string;
  search?: string;
}

function buildProductQuery(params?: GetProductsParams): string {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.category_id) sp.set('category_id', params.category_id);
  if (params?.category_slug) sp.set('category_slug', params.category_slug);
  if (params?.vendor_id) sp.set('vendor_id', params.vendor_id);
  if (params?.search) sp.set('search', params.search);
  if (params?.minPrice !== undefined) sp.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== undefined) sp.set('maxPrice', String(params.maxPrice));
  (params?.brands || []).forEach((b) => sp.append('brand', b));
  (params?.vendors || []).forEach((v) => sp.append('vendor', v));
  if (params?.availability && params.availability !== 'all') sp.set('availability', params.availability);
  if (params?.onSale) sp.set('onSale', 'true');
  if (params?.hasVariants) sp.set('hasVariants', 'true');
  if (params?.sort && params.sort !== 'newest') sp.set('sort', params.sort);
  return sp.toString();
}

export const productsService = {
  getAll: (params?: GetProductsParams) => {
    const query = buildProductQuery(params);
    return api.get<ProductListResponse>(`/products${query ? `?${query}` : ''}`);
  },

  getFacets: (params: GetFacetsParams) => {
    const sp = new URLSearchParams();
    if (params.category_id) sp.set('category_id', params.category_id);
    if (params.category_slug) sp.set('category_slug', params.category_slug);
    if (params.vendor_id) sp.set('vendor_id', params.vendor_id);
    if (params.search) sp.set('search', params.search);
    const query = sp.toString();
    return api.get<ProductFacets>(`/products/facets${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Product>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/products/${id}`),
};
