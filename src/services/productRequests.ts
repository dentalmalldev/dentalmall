import { User } from 'firebase/auth';
import { shrinkForUpload } from '@/lib/images/shrinkForUpload';
import type { ProductRequestItemInput } from '@/lib/validations/product-request';
import type { MyProductRequestItem } from '@/types';

export interface CreateProductRequestData {
  phone_number?: string;
  items: ProductRequestItemInput[];
}

export const productRequestsService = {
  /** The signed-in user's requested products, newest first. */
  getMine: async (user: User): Promise<MyProductRequestItem[]> => {
    const token = await user.getIdToken();
    const response = await fetch('/api/product-requests', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product requests');
    }

    return response.json();
  },

  uploadPhoto: async (user: User, file: File): Promise<string> => {
    const token = await user.getIdToken();
    const body = new FormData();
    body.append('file', await shrinkForUpload(file), file.name);

    const response = await fetch('/api/product-requests/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }

    const data: { url: string } = await response.json();
    return data.url;
  },

  /** Throws an Error whose message is the API's error code (e.g. `rate_limited`). */
  create: async (user: User, data: CreateProductRequestData): Promise<void> => {
    const token = await user.getIdToken();

    const response = await fetch('/api/product-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send request');
    }
  },
};
