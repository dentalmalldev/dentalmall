import type { Category } from '@/types';
import { api } from './api';

export const categoriesService = {
  getAll: () => api.get<Category[]>('/categories'),

  getById: (id: string) => api.get<Category>(`/categories/${id}`),
};
