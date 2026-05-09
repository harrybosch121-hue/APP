const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.reload();
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getTiles: () => request<any[]>('/api/tiles'),
  getLogs: () => request<any[]>('/api/logs'),
  getBillingProducts: () => request<{ id: string; name: string }[]>('/api/billing-products'),

  addTile: (tile: Record<string, unknown>) =>
    request<any>('/api/tiles', { method: 'POST', body: JSON.stringify(tile) }),

  updateStock: (id: string, quantity: number) =>
    request<any>(`/api/tiles/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeStock: (id: string, quantity: number) =>
    request<any>(`/api/tiles/${id}/remove`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    }),
};
