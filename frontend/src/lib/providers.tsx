'use client';
// src/lib/providers.tsx — React Query + Auth + I18n + Theme + Sidebar providers.
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './theme';
import { SidebarProvider } from './sidebar';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 60 * 1000, // 1 minute staleTime for instant route transitions
            gcTime: 10 * 60 * 1000, // 10 minutes cache garbage collection
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
