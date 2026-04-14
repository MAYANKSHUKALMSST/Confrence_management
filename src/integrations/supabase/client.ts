// Local API client — replaces Supabase client
const API_BASE = '/api';

function getToken(): string | null {
  // Tokens are now stored in HttpOnly cookies; no client‑side access
  return null;
}

export function setToken(token: string) {
  // No‑op: token is managed by HttpOnly cookie set by server
}

export function clearToken() {
  // No‑op: clearing cookie handled by server logout endpoint
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include', // send HttpOnly cookie
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.error || `Request failed (${res.status})` };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

export const api = {
  auth: {
    signUp: (body: { email: string; password: string; full_name: string; department: string }) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

    signIn: (body: { email: string; password: string }) =>
      request('/auth/signin', { method: 'POST', body: JSON.stringify(body) }),

    getSession: () =>
      request('/auth/session'),
    logout: () =>
      request('/auth/logout', { method: 'POST' }),
  },

  bookings: {
    list: () => request('/bookings'),

    listConfirmed: (from?: string, to?: string) => {
      const params = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
      return request(`/bookings/confirmed${params}`);
    },

    create: (booking: {
      room: string;
      title: string;
      department: string;
      attendees: string;
      start_time: string;
      end_time: string;
    }) => request('/bookings', { method: 'POST', body: JSON.stringify(booking) }),

    updateStatus: (id: string, status: string) =>
      request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    update: (id: string, booking: {
      room: string;
      title: string;
      department: string;
      attendees: string;
      start_time: string;
      end_time: string;
    }) => request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(booking) }),

    delete: (id: string) => request(`/bookings/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request('/notifications'),

    markAsRead: (id: string) =>
      request(`/notifications/${id}/read`, { method: 'PATCH' }),

    markAllAsRead: () =>
      request('/notifications/read-all', { method: 'PATCH' }),
  },

  profiles: {
    get: (id: string) => request(`/profiles/${id}`),
    update: (id: string, data: any) => request(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  emailSettings: {
    get: () => request('/email-settings'),
    update: (settings: { smtp_host: string; smtp_port: number; email: string; app_password?: string }) =>
      request('/email-settings', { method: 'POST', body: JSON.stringify(settings) }),
    delete: () => request('/email-settings', { method: 'DELETE' }),
    test: (settings: { smtp_host: string; smtp_port: number; email: string; app_password?: string }) =>
      request('/email-settings/test', { method: 'POST', body: JSON.stringify(settings) }),
  },

  rooms: {
    list: () => request('/rooms'),
    create: (room: any) => request('/rooms', { method: 'POST', body: JSON.stringify(room) }),
    update: (id: string, room: any) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(room) }),
    delete: (id: string) => request(`/rooms/${id}`, { method: 'DELETE' }),
  },

  analytics: {
    get: () => request('/analytics'),
  },
  users: {
    list: () => request('/users'),
    create: (user: any) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
    changePassword: (id: string, password: string) =>
      request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
    updateRole: (id: string, role: string) =>
      request(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  },
};