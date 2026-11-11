import { User } from 'firebase/auth';
import type { MyCredit } from '@/types';

export const creditService = {
  /** The signed-in user's balance and unseen credit additions. */
  getMine: async (user: User): Promise<MyCredit> => {
    const token = await user.getIdToken();
    const response = await fetch('/api/credit', { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Failed to fetch credit');
    return response.json();
  },

  /** The customer closed the congratulation modal for these additions. */
  markSeen: async (user: User, ids: string[]): Promise<void> => {
    const token = await user.getIdToken();
    const response = await fetch('/api/credit/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to mark credit as seen');
  },
};
