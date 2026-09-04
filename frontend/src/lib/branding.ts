'use client';
// src/lib/branding.ts — Brand (logo + app name) query with session-level caching.
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from './api';

export interface Branding {
  appName: string | null;
  logo: string | null;
}

export function useBranding() {
  return useQuery({
    queryKey: ['branding'],
    queryFn: async () => unwrap<Branding>((await api.get('/branding')).data),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
