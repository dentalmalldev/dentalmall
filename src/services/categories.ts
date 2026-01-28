import type { Category } from '@/types';
import { api } from './api';

export const categoriesService = {
  getAll: () => api.get<Category[]>('/categories'),

  getById: (id: string) => api.get<Category>(`/categories/${id}`),

  create: (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<Category>('/categories', data),

  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/categories/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/categories/${id}`),
};
