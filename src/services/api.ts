const API_BASE = '/api';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => fetcher<T>(url),
  post: <T>(url: string, data: unknown) =>
    fetcher<T>(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    fetcher<T>(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(url: string) => fetcher<T>(url, { method: 'DELETE' }),
};
