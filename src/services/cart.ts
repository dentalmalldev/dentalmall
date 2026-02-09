import { User } from 'firebase/auth';
import { CartItem } from '@/types';

async function getAuthHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const cartService = {
  getCart: async (user: User): Promise<CartItem[]> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/cart', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart');
    }

    return response.json();
  },

  addToCart: async (user: User, productId: string, quantity: number = 1, variantId?: string): Promise<CartItem> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId, variant_id: variantId || null, quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }

    return response.json();
  },

  updateQuantity: async (user: User, cartItemId: string, quantity: number): Promise<CartItem> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });

    if (!response.ok) {
      throw new Error('Failed to update cart item');
    }

    return response.json();
  },

  removeFromCart: async (user: User, cartItemId: string): Promise<void> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to remove item from cart');
    }
  },

  clearCart: async (user: User): Promise<void> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/cart', {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
  },
};
