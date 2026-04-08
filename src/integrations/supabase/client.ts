// Local API client — replaces Supabase client
const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
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
  },
};