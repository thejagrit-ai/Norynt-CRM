'use client';
// app/page.tsx — Unified Enterprise RBAC Dashboard System.
// Perfectly aligned, role-tailored dashboards for Admin, Finance, Sales, Manager, Support, and Personal workspaces.
// Zero empty space, zero overlapping sidebar, real backend data, and request-deduplicated architecture.

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Target,
  Plus,
  DollarSign,
  LifeBuoy,
  RefreshCw,
  CalendarDays,
  Award,
  Layers,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Button } from '@/components/atoms/Button';
import { UniversalQuickCreateModal } from '@/components/molecules/UniversalQuickCreateModal';
import { AdminDashboardView } from '@/components/organisms/AdminDashboardView';
import { SalesDashboardView } from '@/components/organisms/SalesDashboardView';
import { ManagerDashboardView } from '@/components/organisms/ManagerDashboardView';
import { FinanceDashboardView } from '@/components/organisms/FinanceDashboardView';
import { SupportDashboardView } from '@/components/organisms/SupportDashboardView';
import { PersonalDashboardView } from '@/components/organisms/PersonalDashboardView';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

type DashboardRoleView = 'admin' | 'manager' | 'sales' | 'finance' | 'support' | 'personal';

/* ────────────────────────── Main Dashboard Page ────────────────────────── */

export default function DashboardPage() {
  const { can, user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const queryClient = useQueryClient();

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [months, setMonths] = useState<6 | 12>(6);

  // Permission flags (RBAC)
  const canDeals = can('deal.read');
  const canFinancial = can('invoice.read_financial');
  const canInvoices = can('invoice.read') || canFinancial;
  const canLeads = can('lead.read');
  const canTasks = can('task.read');
  const canTickets = can('ticket.read');
  const canAi = can('ai.use');

  // Role detection
  const primaryRole = useMemo<DashboardRoleView>(() => {
    if (!user) return 'personal';
    const roles = user.roles || [];
    if (roles.includes('ADMIN')) return 'admin';
    if (roles.includes('MANAGER')) return 'manager';
    if (roles.includes('FINANCE')) return 'finance';
    if (roles.includes('SALES')) return 'sales';
    if (roles.includes('SUPPORT')) return 'support';
    return 'personal';
  }, [user]);

  const [activeRoleView, setActiveRoleView] = useState<DashboardRoleView>('admin');

  // Synchronize active view when user loads
  useEffect(() => {
    if (!authLoading && user) {
      setActiveRoleView(primaryRole);
    }
  }, [authLoading, user, primaryRole]);

  // Client time mount
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const todayStr = useMemo(() => {
    if (!now) return '';
    try {
      return new Intl.DateTimeFormat(lang || 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch {
      return now.toDateString();
    }
  }, [now, lang]);

  const greeting = useMemo(() => {
    if (!now) return 'Welcome back';
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  /* ────────────────────────── RBAC-Gated & Deduplicated Queries ────────────────────────── */

  const forecast = useQuery({
    queryKey: ['dash-forecast'],
    enabled: canDeals && !authLoading && !!user && activeRoleView !== 'finance' && activeRoleView !== 'support' && activeRoleView !== 'personal',
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<{ openCount: number; openValue: string; weightedForecast: string }>(
        (await api.get('/reports/forecast')).data,
      ),
  });

  const wonLost = useQuery({
    queryKey: ['dash-won-lost', months],
    enabled: canDeals && !authLoading && !!user && activeRoleView !== 'finance' && activeRoleView !== 'support' && activeRoleView !== 'personal',
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<{
        winRate: number;
        totalWon: number;
        totalLost: number;
        months: { month: string; wonCount: number; wonValue: string; lostCount: number }[];
      }>((await api.get('/reports/deals/won-lost', { params: { months } })).data),
  });

  const invoicesSummary = useQuery({
    queryKey: ['dash-invoices-summary'],
    enabled: canFinancial && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'manager' || activeRoleView === 'finance'),
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<{ totalInvoiced: string; totalPaid: string; outstanding: string }>(
        (await api.get('/reports/invoices/summary')).data,
      ),
  });

  const revenueMonthly = useQuery({
    queryKey: ['dash-revenue-monthly', months],
    enabled: canFinancial && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'manager' || activeRoleView === 'finance'),
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<{ months: { month: string; invoiced: string; paid: string }[] }>(
        (await api.get('/reports/revenue/monthly', { params: { months } })).data,
      ),
  });

  const recentDeals = useQuery({
    queryKey: ['dash-recent-deals'],
    enabled: canDeals && !authLoading && !!user && activeRoleView !== 'finance' && activeRoleView !== 'support',
    staleTime: 60_000,
    queryFn: async () => unwrap<any>((await api.get('/deals', { params: { limit: 8 } })).data),
  });

  const byOwnerQuery = useQuery({
    queryKey: ['dash-by-owner'],
    enabled: canDeals && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'manager'),
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<
        {
          ownerId: string | null;
          name: string | null;
          wonCount: number;
          wonValue: string;
          openCount: number;
          openValue: string;
          winRate: number;
        }[]
      >((await api.get('/reports/sales/by-owner')).data),
  });

  const pipelinesQuery = useQuery({
    queryKey: ['dash-pipelines-list'],
    enabled: canDeals && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'manager' || activeRoleView === 'sales'),
    staleTime: 5 * 60_000,
    queryFn: async () => unwrap<any[]>((await api.get('/pipelines')).data),
  });

  const defaultPipelineId = useMemo(() => {
    const list = pipelinesQuery.data || [];
    return list.find((p: any) => p.isDefault)?.id || list[0]?.id;
  }, [pipelinesQuery.data]);

  const pipelineStagesQuery = useQuery({
    queryKey: ['dash-pipeline-stages', defaultPipelineId],
    enabled: Boolean(defaultPipelineId),
    staleTime: 60_000,
    queryFn: async () => {
      return unwrap<{
        pipelineId: string;
        stages: { stageId: string; name: string; position: number; openCount: number; openValue: string }[];
      }>((await api.get('/reports/pipeline', { params: { pipelineId: defaultPipelineId } })).data);
    },
  });

  const invoicesList = useQuery({
    queryKey: ['dash-invoices-list'],
    enabled: canInvoices && !authLoading && !!user && activeRoleView === 'finance',
    staleTime: 60_000,
    queryFn: async () => unwrap<any>((await api.get('/invoices', { params: { limit: 20 } })).data),
  });

  const leadsList = useQuery({
    queryKey: ['dash-leads-list'],
    enabled: canLeads && !authLoading && !!user && activeRoleView === 'sales',
    staleTime: 60_000,
    queryFn: async () => unwrap<any>((await api.get('/leads', { params: { limit: 6 } })).data),
  });

  const tasksQuery = useQuery({
    queryKey: ['dash-tasks'],
    enabled: canTasks && !authLoading && !!user && activeRoleView !== 'finance',
    staleTime: 60_000,
    queryFn: async () => unwrap<any>((await api.get('/tasks', { params: { limit: 6 } })).data),
  });

  const ticketsQuery = useQuery({
    queryKey: ['dash-tickets'],
    enabled: canTickets && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'support' || activeRoleView === 'manager' || activeRoleView === 'personal'),
    staleTime: 60_000,
    queryFn: async () => unwrap<any>((await api.get('/tickets', { params: { limit: 6 } })).data),
  });

  const priorities = useQuery({
    queryKey: ['dash-priorities'],
    enabled: canAi && !authLoading && !!user && (activeRoleView === 'admin' || activeRoleView === 'manager'),
    staleTime: 60_000,
    queryFn: async () =>
      unwrap<{ priorities: any[] }>((await api.get('/ai/priorities', { params: { limit: 5 } })).data),
  });

  const refreshing =
    forecast.isFetching || wonLost.isFetching || invoicesSummary.isFetching || recentDeals.isFetching || tasksQuery.isFetching;

  const refreshAll = () =>
    void queryClient.invalidateQueries({
      predicate: (q) => typeof q.queryKey[0] === 'string' && q.queryKey[0].startsWith('dash-'),
    });

  const roleBadgeLabel = useMemo(() => {
    switch (activeRoleView) {
      case 'admin':
        return 'Executive Overview';
      case 'manager':
        return 'Commercial Director';
      case 'sales':
        return 'Sales Operations';
      case 'finance':
        return 'Finance Operations';
      case 'support':
        return 'Customer Success';
      default:
        return 'Personal Workspace';
    }
  }, [activeRoleView]);

  return (
    <DashboardTemplate title="Command Center" hideHeader>
      <div className="w-full space-y-6 pb-8">
        {/* ── Top Hero Banner ── */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-brand-50/50 p-6 shadow-sm dark:border-slate-800/90 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/95 dark:to-brand-950/60 dark:shadow-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-600/15" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-600/10" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
                  {roleBadgeLabel}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  <span suppressHydrationWarning>{todayStr || 'Today'}</span>
                </p>
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {greeting},{' '}
                <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-indigo-300">
                  {user?.firstName || user?.email?.split('@')[0] || 'Team'}
                </span>
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                {activeRoleView === 'admin' && 'Complete operational telemetry, revenue realization, and company pipeline status.'}
                {activeRoleView === 'sales' && 'Your active deals, revenue opportunities, lead conversion, and urgent follow-ups.'}
                {activeRoleView === 'finance' && 'Cash collection, outstanding receivables, billing velocity, and invoice management.'}
                {activeRoleView === 'manager' && 'Team closing velocity, revenue forecasts, sales rep quotas, and coaching insights.'}
                {activeRoleView === 'support' && 'SLA response times, active customer queue, urgent support items, and resolutions.'}
                {activeRoleView === 'personal' && 'Your assigned CRM tasks, customer accounts, and scheduled meetings.'}
              </p>
            </div>

            {/* Actions: Refresh & Quick Create */}
            <div className="flex items-center gap-2.5">

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshAll}
                  disabled={refreshing}
                  title="Refresh metrics"
                  aria-label="Refresh metrics"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                <Button
                  size="sm"
                  onClick={() => setQuickCreateOpen(true)}
                  className="h-9 bg-brand-600 px-3.5 font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Quick Create</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Active Role-Specific Dashboard Views ── */}
        {activeRoleView === 'admin' && (
          <AdminDashboardView
            forecast={forecast}
            wonLost={wonLost}
            invoicesSummary={invoicesSummary}
            revenueMonthly={revenueMonthly}
            recentDeals={recentDeals}
            byOwnerQuery={byOwnerQuery}
            pipelineStagesQuery={pipelineStagesQuery}
            ticketsQuery={ticketsQuery}
            priorities={priorities}
            months={months}
            setMonths={setMonths}
            canFinancial={canFinancial}
            canDeals={canDeals}
            canTickets={canTickets}
            canAi={canAi}
          />
        )}

        {activeRoleView === 'sales' && (
          <SalesDashboardView
            forecast={forecast}
            wonLost={wonLost}
            recentDeals={recentDeals}
            leadsList={leadsList}
            tasksQuery={tasksQuery}
            pipelineStagesQuery={pipelineStagesQuery}
            months={months}
            setMonths={setMonths}
            canDeals={canDeals}
            canLeads={canLeads}
            canTasks={canTasks}
            canAi={canAi}
          />
        )}

        {activeRoleView === 'manager' && (
          <ManagerDashboardView
            forecast={forecast}
            wonLost={wonLost}
            invoicesSummary={invoicesSummary}
            revenueMonthly={revenueMonthly}
            recentDeals={recentDeals}
            byOwnerQuery={byOwnerQuery}
            pipelineStagesQuery={pipelineStagesQuery}
            tasksQuery={tasksQuery}
            priorities={priorities}
            months={months}
            setMonths={setMonths}
            canFinancial={canFinancial}
            canDeals={canDeals}
            canTasks={canTasks}
            canAi={canAi}
          />
        )}

        {activeRoleView === 'finance' && (
          <FinanceDashboardView
            invoicesSummary={invoicesSummary}
            revenueMonthly={revenueMonthly}
            invoicesList={invoicesList}
            months={months}
            setMonths={setMonths}
            canFinancial={canFinancial}
          />
        )}

        {activeRoleView === 'support' && (
          <SupportDashboardView
            ticketsQuery={ticketsQuery}
            tasksQuery={tasksQuery}
            canTickets={canTickets}
            canTasks={canTasks}
          />
        )}

        {activeRoleView === 'personal' && (
          <PersonalDashboardView
            tasksQuery={tasksQuery}
            ticketsQuery={ticketsQuery}
            recentDeals={recentDeals}
            canTasks={canTasks}
            canTickets={canTickets}
            canDeals={canDeals}
          />
        )}
      </div>

      <UniversalQuickCreateModal
        isOpen={quickCreateOpen}
        onClose={() => {
          setQuickCreateOpen(false);
          refreshAll();
        }}
      />
    </DashboardTemplate>
  );
}
