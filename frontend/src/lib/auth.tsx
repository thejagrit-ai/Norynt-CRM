'use client';
// src/lib/auth.tsx — Centralized authentication context with request deduplication & clean session lifecycle.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken, unwrap } from './api';
import type { AuthUser, LoginResponse } from '@/types';

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  MANAGER: [
    'user.read', 'deal.create', 'deal.read', 'deal.update', 'deal.delete', 'deal.move',
    'invoice.read', 'integration.read', 'integration.manage', 'company.create', 'company.read',
    'company.update', 'company.delete', 'contact.create', 'contact.read', 'contact.update',
    'contact.delete', 'lead.create', 'lead.read', 'lead.update', 'lead.delete', 'lead.convert',
    'lead_form.read', 'lead_form.manage', 'pipeline.read', 'pipeline.manage', 'whatsapp.send',
    'whatsapp.read', 'brand.read', 'brand.manage', 'meeting.create', 'meeting.read',
    'meeting.update', 'meeting.delete', 'task.create', 'task.read', 'task.update',
    'task.delete', 'ticket.create', 'ticket.read', 'ticket.update', 'ticket.delete',
    'customer_360.read', 'approval.read', 'approval.manage', 'automation.read',
    'automation.manage', 'custom_field.read', 'custom_field.manage', 'ai.use',
    'product.create', 'product.read', 'product.update', 'product.delete',
    'quote.create', 'quote.read', 'quote.update', 'quote.delete', 'quote.send',
    'quote.convert', 'data.export', 'data.import', 'data.merge',
  ],
  SALES: [
    'deal.create', 'deal.read', 'deal.update', 'deal.move', 'lead.create', 'lead.read',
    'lead.update', 'lead.convert', 'lead_form.read', 'pipeline.read', 'whatsapp.send',
    'whatsapp.read', 'brand.read', 'brand.manage', 'meeting.create', 'meeting.read',
    'meeting.update', 'meeting.delete', 'task.create', 'task.read', 'task.update',
    'task.delete', 'customer_360.read', 'approval.read', 'invoice.read', 'company.create',
    'company.read', 'contact.create', 'contact.read', 'contact.update', 'custom_field.read',
    'ai.use', 'product.read', 'quote.create', 'quote.read', 'quote.update', 'quote.send',
    'quote.convert', 'data.export',
  ],
  SUPPORT: [
    'ticket.create', 'ticket.read', 'ticket.update', 'ticket.delete', 'contact.read',
    'company.read', 'customer_360.read', 'task.create', 'task.read', 'task.update',
    'whatsapp.read', 'whatsapp.send',
  ],
  FINANCE: [
    'invoice.create', 'invoice.read', 'invoice.update', 'invoice.delete',
    'invoice.read_financial', 'product.read', 'quote.read', 'quote.convert',
  ],
  VIEWER: [
    'user.read', 'role.read', 'deal.read', 'invoice.read', 'company.read',
    'contact.read', 'lead.read', 'lead_form.read', 'pipeline.read', 'meeting.read',
    'task.read', 'ticket.read', 'customer_360.read', 'custom_field.read',
    'product.read', 'quote.read',
  ],
};

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  can: (perm: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const inFlightLoad = useRef<Promise<AuthUser | null> | null>(null);

  // Single authoritative /auth/me loader with concurrency deduplication
  const loadMe = useCallback(async (): Promise<AuthUser | null> => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    if (inFlightLoad.current) {
      return inFlightLoad.current;
    }

    inFlightLoad.current = (async () => {
      try {
        const res = await api.get('/auth/me');
        const userData = unwrap<AuthUser>(res.data);
        setUser(userData);
        return userData;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          setToken(null);
          setUser(null);
        }
        return null;
      } finally {
        setLoading(false);
        inFlightLoad.current = null;
      }
    })();

    return inFlightLoad.current;
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const res = await api.post('/auth/login', { email, password });
      const data = unwrap<LoginResponse>(res.data);

      setToken(data.accessToken);

      // Derive fallback permissions from role if not explicitly provided
      const rolePermissions = (data.user.roles || []).flatMap((r) => DEFAULT_ROLE_PERMISSIONS[r] || []);
      const userPermissions = data.user.permissions && data.user.permissions.length > 0
        ? data.user.permissions
        : (data.user.roles?.includes('ADMIN') ? ['*'] : rolePermissions);

      const authenticatedUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: (data.user as any).firstName || '',
        lastName: (data.user as any).lastName || '',
        roles: data.user.roles || [],
        permissions: userPermissions,
        tenantId: data.user.tenantId,
      };

      setUser(authenticatedUser);
      setLoading(false);
      return authenticatedUser;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
      queryClient.clear();
    }
  }, [queryClient]);

  const userPermsSet = useMemo(() => {
    if (!user) return new Set<string>();
    const set = new Set<string>(user.permissions || []);
    if (user.roles?.includes('ADMIN') || set.has('*')) {
      set.add('*');
    }
    for (const r of user.roles || []) {
      for (const p of DEFAULT_ROLE_PERMISSIONS[r] || []) {
        set.add(p);
      }
    }
    return set;
  }, [user]);

  const can = useCallback(
    (perm: string): boolean => {
      if (!user) return false;
      if (userPermsSet.has('*')) return true;
      return userPermsSet.has(perm);
    },
    [user, userPermsSet],
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser: loadMe, can }),
    [user, loading, login, logout, loadMe, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
