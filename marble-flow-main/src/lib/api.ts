const BASE_URL = import.meta.env.VITE_API_URL || "";
const BILLING_API_URL = import.meta.env.VITE_BILLING_API_URL || "";

async function request<T = unknown>(path: string, options: RequestInit = {}, tokenOverride?: string): Promise<T> {
  const token = tokenOverride ?? localStorage.getItem("auth_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401 && !tokenOverride) {
    localStorage.removeItem("auth_token");
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function adminRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, localStorage.getItem("admin_token") ?? undefined);
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getTiles: () => request<any[]>("/api/tiles"),
  getLogs: () => request<any[]>("/api/logs"),
  getBillingProducts: () => request<{ id: string; name: string }[]>("/api/billing-products"),
  getBillingProductsFromBilling: () => {
    if (!BILLING_API_URL) throw new Error("Billing API URL not configured");
    return request<{ id: string; name: string }[]>(`${BILLING_API_URL}/api/items/public`);
  },

  addTile: (tile: Record<string, unknown>) =>
    request<any>("/api/tiles", { method: "POST", body: JSON.stringify(tile) }),
  updateStock: (id: string, quantity: number) =>
    request<any>(`/api/tiles/${id}/stock`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeStock: (id: string, quantity: number) =>
    request<any>(`/api/tiles/${id}/remove`, { method: "POST", body: JSON.stringify({ quantity }) }),

  // Public config (types, sizes, godowns)
  getConfig: () => request<{ types: string[]; sizes: string[]; godowns: string[] }>("/api/config"),

  // Admin API
  admin: {
    login: async (username: string, password: string) => {
      const res = await request<{ token: string; username: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (res.username !== "admin") throw new Error("Not an admin account");
      localStorage.setItem("admin_token", res.token);
      return res;
    },
    logout: () => localStorage.removeItem("admin_token"),

    getTypes:   () => adminRequest<{ id: string; value: string }[]>("/api/admin/types"),
    addType:    (value: string) => adminRequest<any>("/api/admin/types", { method: "POST", body: JSON.stringify({ value }) }),
    deleteType: (id: string) => adminRequest<any>(`/api/admin/types/${id}`, { method: "DELETE" }),

    getSizes:   () => adminRequest<{ id: string; value: string }[]>("/api/admin/sizes"),
    addSize:    (value: string) => adminRequest<any>("/api/admin/sizes", { method: "POST", body: JSON.stringify({ value }) }),
    deleteSize: (id: string) => adminRequest<any>(`/api/admin/sizes/${id}`, { method: "DELETE" }),

    getGodowns:   () => adminRequest<{ id: string; value: string }[]>("/api/admin/godowns"),
    addGodown:    (value: string) => adminRequest<any>("/api/admin/godowns", { method: "POST", body: JSON.stringify({ value }) }),
    deleteGodown: (id: string) => adminRequest<any>(`/api/admin/godowns/${id}`, { method: "DELETE" }),

    getUsers:    () => adminRequest<{ id: string; username: string }[]>("/api/admin/users"),
    addUser:     (username: string, password: string) => adminRequest<any>("/api/admin/users", { method: "POST", body: JSON.stringify({ username, password }) }),
    deleteUser:  (id: string) => adminRequest<any>(`/api/admin/users/${id}`, { method: "DELETE" }),
    changePassword: (id: string, password: string) => adminRequest<any>(`/api/admin/users/${id}/password`, { method: "PUT", body: JSON.stringify({ password }) }),

    triggerBackup: () => adminRequest<any>("/api/admin/backup", { method: "POST" }),
  },
};
