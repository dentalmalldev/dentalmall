import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services';
import type { GetProductsParams, GetFacetsParams } from '@/services/products';

export const productKeys = {
  all: ['products'] as const,
  list: (params?: GetProductsParams) => ['products', 'list', params] as const,
  facets: (params?: GetFacetsParams) => ['products', 'facets', params] as const,
  detail: (id: string) => ['products', id] as const,
};

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params),
  });
}

export function useProductFacets(params: GetFacetsParams) {
  return useQuery({
    queryKey: productKeys.facets(params),
    queryFn: () => productsService.getFacets(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
}
