'use client';
// src/components/templates/DashboardTemplate.tsx — Enterprise layout shell with streamlined headers, zero wasted whitespace & responsive drawer integration.
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useSidebar } from '@/lib/sidebar';
import { LoadingScreen } from '../organisms/LoadingScreen';
import { Sidebar } from '../organisms/Sidebar';
import { Topbar } from '../organisms/Topbar';
import { GlobalAIChatbot } from '../organisms/GlobalAIChatbot';

export function DashboardTemplate({
  title,
  subtitle,
  headerAction,
  actions,
  hideHeader = false,
  children,
}: {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  actions?: React.ReactNode;
  hideHeader?: boolean;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const { openMobile } = useSidebar();

  const titleText = title.startsWith('page.') || title.startsWith('nav.') ? t(title) : title;
  const actionButton = actions || headerAction;

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Persistent / Responsive Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={openMobile} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-7 py-5 w-full custom-scrollbar">
          <div className="w-full max-w-none space-y-5">
            {!hideHeader && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800/60">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {titleText}
                  </h1>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-normal line-clamp-1">
                      {subtitle}
                    </p>
                  )}
                </div>

                {actionButton && (
                  <div className="flex items-center gap-2 shrink-0">{actionButton}</div>
                )}
              </div>
            )}

            {hideHeader && actionButton && (
              <div className="flex items-center justify-end gap-2">{actionButton}</div>
            )}

            <div className="w-full space-y-5">{children}</div>

            {/* Global Software Footer */}
            <footer className="pt-8 pb-4 mt-8 border-t border-slate-200/80 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 select-none">
              <p className="flex items-center gap-1.5 font-medium">
                <span>Developed by</span>
                <a
                  href="https://www.norynt.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors underline-offset-2 hover:underline"
                >
                  Norynt
                </a>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Enterprise CRM & Telemetry Platform · &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Global AI Chatbot Floating Assistant for all RBAC accounts */}
      <GlobalAIChatbot />
    </div>
  );
}
