import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services';

export const categoryKeys = {
  all: ['categories'] as const,
  detail: (id: string) => ['categories', id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoriesService.getAll,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoriesService.getById(id),
    enabled: !!id,
  });
}
