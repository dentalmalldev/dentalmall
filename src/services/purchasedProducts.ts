import { User } from 'firebase/auth';
import type { PurchasedProductsPage } from '@/types';

export const purchasedProductsService = {
  getPage: async (user: User, cursor: string | null): Promise<PurchasedProductsPage> => {
    const token = await user.getIdToken();
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const response = await fetch(`/api/purchased-products${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch purchased products');
    }

    return response.json();
  },
};
