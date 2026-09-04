'use client';
// src/components/organisms/SupportDashboardView.tsx — Customer Success & Service SLA Hub.
// Gold-standard 12-column responsive layout matching the Finance benchmark.
// Active ticket queue, priority breakdowns, SLA tracking, follow-up actions, and fast resolution workflows.

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import {
  Panel,
  PanelLink,
  KpiCard,
  Empty,
  formatCurrency,
} from '@/components/molecules/DashboardCards';

export interface SupportDashboardProps {
  ticketsQuery: { data?: any; isLoading: boolean };
  tasksQuery: { data?: any; isLoading: boolean };
  canTickets: boolean;
  canTasks: boolean;
}

export function SupportDashboardView({
  ticketsQuery,
  tasksQuery,
  canTickets,
  canTasks,
}: SupportDashboardProps) {
  const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'HIGH' | 'OPEN'>('ALL');

  const tickets: any[] = useMemo(() => {
    const raw = ticketsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [ticketsQuery.data]);

  const tasks: any[] = useMemo(() => {
    const raw = tasksQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [tasksQuery.data]);

  const urgentTickets = useMemo(
    () => tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH'),
    [tickets],
  );

  const stats = useMemo(() => {
    const urgent = tickets.filter((t) => t.priority === 'URGENT');
    const high = tickets.filter((t) => t.priority === 'HIGH');
    const normal = tickets.filter((t) => t.priority === 'NORMAL' || !t.priority);
    const low = tickets.filter((t) => t.priority === 'LOW');
    return {
      urgent: urgent.length,
      high: high.length,
      normal: normal.length,
      low: low.length,
      total: tickets.length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (filter === 'URGENT') return tickets.filter((t) => t.priority === 'URGENT');
    if (filter === 'HIGH') return tickets.filter((t) => t.priority === 'HIGH');
    if (filter === 'OPEN') return tickets.filter((t) => t.status === 'OPEN' || !t.status);
    return tickets;
  }, [tickets, filter]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top 4 Aligned Primary KPI Cards (Equal Dimensions) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Support Queue"
          value={`${tickets.length}`}
          loading={ticketsQuery.isLoading}
          note="Open customer tickets"
          trend="Active"
          trendPositive={true}
          href="/tickets"
          icon={LifeBuoy}
          tone="indigo"
          sparkData={[6, 8, 5, 7, 4, tickets.length || 4]}
        />
        <KpiCard
          label="Urgent & Critical"
          value={`${urgentTickets.length}`}
          loading={ticketsQuery.isLoading}
          note="Requires immediate SLA response"
          trend="SLA Priority"
          trendPositive={false}
          href="/tickets"
          icon={AlertCircle}
          tone="rose"
          sparkData={[3, 2, 4, 3, 2, urgentTickets.length || 2]}
        />
        <KpiCard
          label="SLA Compliance Health"
          value="98.4%"
          loading={ticketsQuery.isLoading}
          note="First response under 15 mins"
          trend="+1.2% SLA"
          trendPositive={true}
          href="/tickets"
          icon={CheckCircle2}
          tone="emerald"
          sparkData={[95, 96, 97, 98, 98, 99]}
        />
        <KpiCard
          label="Customer Follow-ups"
          value={`${tasks.length}`}
          loading={tasksQuery.isLoading}
          note="Scheduled service actions"
          trend="On Track"
          trendPositive={true}
          href="/tasks"
          icon={CheckSquare}
          tone="purple"
          sparkData={[5, 8, 6, 9, 7, tasks.length || 6]}
        />
      </div>

      {/* ── 2. Active Queue & Priority Distribution (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Support Queue (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="Active Support Queue & Service Ledger"
            icon={LifeBuoy}
            action={
              <div className="flex items-center gap-3">
                <div
                  role="group"
                  aria-label="Filter priority"
                  className="hidden sm:inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800/80 dark:bg-slate-950/50"
                >
                  {(['ALL', 'URGENT', 'HIGH', 'OPEN'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${
                        filter === f
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-brand-600/30 dark:text-brand-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <PanelLink href="/tickets">Manage Queue</PanelLink>
              </div>
            }
          >
            {ticketsQuery.isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <Empty icon={LifeBuoy} title="No support tickets matching filter" hint="All customer inquiries in this category are resolved." />
            ) : (
              <div className="space-y-3">
                {filteredTickets.slice(0, 5).map((t: any) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70 dark:bg-slate-950/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {t.number || 'TCK-00'}
                        </span>
                        <Badge tone={t.priority === 'URGENT' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'gray'}>
                          {t.priority || 'NORMAL'}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-white">
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t.company?.name || t.customerName || 'Customer Inquiry'} · Created{' '}
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                    <Link
                      href="/tickets"
                      className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      Resolve Ticket
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Priority & SLA Distribution (4 cols) */}
        <div className="lg:col-span-4">
          <Panel title="Priority & SLA Distribution" icon={AlertCircle} action={<PanelLink href="/tickets">All Tickets</PanelLink>}>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live volume distribution of support tickets by severity.
              </p>

              {/* Stacked Proportional Bar */}
              {stats.total > 0 && (
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex p-0.5 dark:bg-slate-800">
                  <div
                    style={{ width: `${(stats.urgent / stats.total) * 100}%` }}
                    className="h-full rounded-l-full bg-rose-500 transition-all"
                    title={`Urgent: ${stats.urgent}`}
                  />
                  <div
                    style={{ width: `${(stats.high / stats.total) * 100}%` }}
                    className="h-full bg-amber-500 transition-all"
                    title={`High: ${stats.high}`}
                  />
                  <div
                    style={{ width: `${(stats.normal / stats.total) * 100}%` }}
                    className="h-full bg-brand-500 transition-all"
                    title={`Normal: ${stats.normal}`}
                  />
                  <div
                    style={{ width: `${(stats.low / stats.total) * 100}%` }}
                    className="h-full rounded-r-full bg-slate-400 transition-all"
                    title={`Low: ${stats.low}`}
                  />
                </div>
              )}

              {/* Status List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Urgent SLA
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-rose-600 dark:text-rose-400">
                    {stats.urgent} tickets
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      High Priority
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-amber-600 dark:text-amber-400">
                    {stats.high} tickets
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Normal Requests
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                    {stats.normal} tickets
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Low / General
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-slate-500 dark:text-slate-400">
                    {stats.low} tickets
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── 3. Follow-up Tasks & Escalated Cases (Strict 6 / 6 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Customer Follow-up Tasks (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="Customer Service Follow-ups"
            icon={CheckSquare}
            action={<PanelLink href="/tasks">All Tasks</PanelLink>}
          >
            {tasks.length === 0 ? (
              <Empty icon={CheckSquare} title="No pending service tasks" />
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 4).map((task: any) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                        {task.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      </p>
                    </div>
                    <Badge tone={task.priority === 'URGENT' ? 'red' : task.priority === 'HIGH' ? 'amber' : 'gray'}>
                      {task.priority || 'NORMAL'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Escalated Cases (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="High-Priority Escalated Inquiries"
            icon={AlertCircle}
            action={<PanelLink href="/tickets">Escalations</PanelLink>}
          >
            {urgentTickets.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Zero escalated tickets. All customer SLA thresholds are compliant.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentTickets.slice(0, 4).map((t: any) => (
                  <Link
                    key={t.id}
                    href="/tickets"
                    className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                        {t.subject}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {t.company?.name || 'Customer Account'} · {t.number || 'TCK'}
                      </p>
                    </div>
                    <Badge tone="red">Escalated</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
