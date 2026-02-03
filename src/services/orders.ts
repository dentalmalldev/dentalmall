import { User } from 'firebase/auth';
import { Order } from '@/types';

async function getAuthHeaders(user: User): Promise<HeadersInit> {
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const ordersService = {
  getOrders: async (user: User): Promise<Order[]> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch('/api/orders', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  },

  getOrder: async (user: User, orderId: string): Promise<Order> => {
    const headers = await getAuthHeaders(user);
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  },
};
