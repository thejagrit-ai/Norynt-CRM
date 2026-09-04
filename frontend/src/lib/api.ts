// src/lib/api.ts — Axios instance + token & locale interceptor. /api proxy to backend.
import axios from 'axios';

const TOKEN_KEY = 'crm_access_token';
const LANG_KEY = 'crm_lang';

export const api = axios.create({ baseURL: '/api/v1' });

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getLocale(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(LANG_KEY) || 'en';
}

// Attach access token and locale headers to every outgoing request
api.interceptors.request.use((config) => {
  const token = getToken();
  const locale = getLocale();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers['Accept-Language'] = locale;
  config.headers['x-locale'] = locale;

  return config;
});

// Clear token on 401 unauthorized (except during login attempts)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginReq = err?.config?.url?.includes('/auth/login');
    if (err?.response?.status === 401 && !isLoginReq && typeof window !== 'undefined') {
      setToken(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// Standard envelope { success, data, meta } -> data unwrap helper
export function unwrap<T>(payload: { data: T }): T {
  return payload.data;
}
