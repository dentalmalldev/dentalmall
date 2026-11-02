import { User } from 'firebase/auth';
import type { FavoriteCartResult, FavoriteItem } from '@/types';

async function getAuthHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const favoritesService = {
  getFavorites: async (user: User): Promise<FavoriteItem[]> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/favorites', { method: 'GET', headers });

    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }

    return response.json();
  },

  addFavorite: async (user: User, productId: string): Promise<void> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add favorite');
    }
  },

  removeFavorite: async (user: User, productId: string): Promise<void> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch(`/api/favorites/${productId}`, { method: 'DELETE', headers });

    if (!response.ok) {
      throw new Error('Failed to remove favorite');
    }
  },

  addAllToCart: async (user: User, productIds: string[]): Promise<FavoriteCartResult[]> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/favorites/add-to-cart', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_ids: productIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to add favorites to cart');
    }

    const data: { results: FavoriteCartResult[] } = await response.json();
    return data.results;
  },
};
