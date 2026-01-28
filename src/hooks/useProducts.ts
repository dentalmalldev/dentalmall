import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services';
import type { Product } from '@/types';

interface GetProductsParams {
  page?: number;
  limit?: number;
  category_id?: string;
  category_slug?: string;
  search?: string;
}

export const productKeys = {
  all: ['products'] as const,
  list: (params?: GetProductsParams) => ['products', 'list', params] as const,
  detail: (id: string) => ['products', id] as const,
};

export function useProducts(params?: GetProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) =>
      productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
