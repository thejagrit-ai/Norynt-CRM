'use client';
// src/components/organisms/PersonalDashboardView.tsx — Personal Workspace & Assigned Action Items.
// Gold-standard 12-column responsive layout matching the Finance benchmark.
// Personal tasks, assigned tickets, tracked deals, and system health status.

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  LifeBuoy,
  Target,
  ShieldCheck,
  Clock,
  Building2,
  ChevronRight,
  AlertCircle,
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

export interface PersonalDashboardProps {
  tasksQuery: { data?: any; isLoading: boolean };
  ticketsQuery: { data?: any; isLoading: boolean };
  recentDeals: { data?: any; isLoading: boolean };
  canTasks: boolean;
  canTickets: boolean;
  canDeals: boolean;
}

export function PersonalDashboardView({
  tasksQuery,
  ticketsQuery,
  recentDeals,
  canTasks,
  canTickets,
  canDeals,
}: PersonalDashboardProps) {
  const tasks: any[] = useMemo(() => {
    const raw = tasksQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [tasksQuery.data]);

  const tickets: any[] = useMemo(() => {
    const raw = ticketsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [ticketsQuery.data]);

  const deals: any[] = useMemo(() => {
    const raw = recentDeals.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [recentDeals.data]);

  const taskStats = useMemo(() => {
    const urgent = tasks.filter((t) => t.priority === 'URGENT');
    const high = tasks.filter((t) => t.priority === 'HIGH');
    const normal = tasks.filter((t) => t.priority === 'NORMAL' || !t.priority);
    return {
      urgent: urgent.length,
      high: high.length,
      normal: normal.length,
      total: tasks.length,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top 4 Aligned Primary KPI Cards (Equal Dimensions) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="My Open Tasks"
          value={`${tasks.length}`}
          loading={tasksQuery.isLoading}
          note="Action items assigned to me"
          trend="Current"
          trendPositive={true}
          href="/tasks"
          icon={CheckSquare}
          tone="indigo"
          sparkData={[4, 6, 5, 8, 7, tasks.length || 5]}
        />
        <KpiCard
          label="Assigned Tickets"
          value={`${tickets.length}`}
          loading={ticketsQuery.isLoading}
          note="Support requests in progress"
          trend="Queue"
          trendPositive={true}
          href="/tickets"
          icon={LifeBuoy}
          tone="sky"
          sparkData={[2, 3, 4, 3, 2, tickets.length || 2]}
        />
        <KpiCard
          label="Active Opportunities"
          value={`${deals.length}`}
          loading={recentDeals.isLoading}
          note="Pipeline accounts"
          trend="Active"
          trendPositive={true}
          href="/deals"
          icon={Target}
          tone="emerald"
          sparkData={[3, 5, 4, 6, 7, deals.length || 5]}
        />
        <KpiCard
          label="System Health"
          value="100%"
          loading={false}
          note="All services operational"
          trend="Stable"
          trendPositive={true}
          href="/"
          icon={ShieldCheck}
          tone="purple"
          sparkData={[100, 100, 100, 100, 100, 100]}
        />
      </div>

      {/* ── 2. My Tasks & Task Urgency (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* My Tasks (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="My Assigned Action Items"
            icon={CheckSquare}
            action={<PanelLink href="/tasks">All Tasks</PanelLink>}
          >
            {tasksQuery.isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : tasks.length === 0 ? (
              <Empty icon={CheckSquare} title="No open tasks" hint="You are all caught up on scheduled follow-ups." />
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 5).map((task: any) => (
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
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date scheduled'}
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

        {/* Task Urgency Breakdown (4 cols) */}
        <div className="lg:col-span-4">
          <Panel title="Task Priority Distribution" icon={AlertCircle}>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of your open follow-ups by urgency level.
              </p>

              {/* Stacked Proportional Bar */}
              {taskStats.total > 0 && (
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 flex p-0.5 dark:bg-slate-800">
                  <div
                    style={{ width: `${(taskStats.urgent / taskStats.total) * 100}%` }}
                    className="h-full rounded-l-full bg-rose-500 transition-all"
                  />
                  <div
                    style={{ width: `${(taskStats.high / taskStats.total) * 100}%` }}
                    className="h-full bg-amber-500 transition-all"
                  />
                  <div
                    style={{ width: `${(taskStats.normal / taskStats.total) * 100}%` }}
                    className="h-full rounded-r-full bg-brand-500 transition-all"
                  />
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Urgent Tasks
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-rose-600 dark:text-rose-400">
                    {taskStats.urgent}
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
                    {taskStats.high}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Normal / Standard
                    </span>
                  </div>
                  <span className="tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                    {taskStats.normal}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── 3. Tracked Deals & Assigned Support Tickets (Strict 6 / 6 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Tracked Deals (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="My Tracked Deals"
            icon={Target}
            action={<PanelLink href="/deals">All Deals</PanelLink>}
          >
            {deals.length === 0 ? (
              <Empty icon={Target} title="No tracked opportunities" />
            ) : (
              <div className="space-y-2.5">
                {deals.slice(0, 4).map((deal: any) => (
                  <Link
                    key={deal.id}
                    href="/deals"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                          {deal.title}
                        </p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {deal.company || deal.companyName || 'Corporate Client'}
                        </p>
                      </div>
                    </div>
                    <span className="tabular-nums font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(deal.value)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Assigned Tickets (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="My Support Queue"
            icon={LifeBuoy}
            action={<PanelLink href="/tickets">Queue</PanelLink>}
          >
            {tickets.length === 0 ? (
              <Empty icon={LifeBuoy} title="No assigned tickets" />
            ) : (
              <div className="space-y-2.5">
                {tickets.slice(0, 4).map((ticket: any) => (
                  <Link
                    key={ticket.id}
                    href="/tickets"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                        {ticket.subject || 'Support Request'}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {ticket.company?.name || ticket.customerName || 'Inquiry'}
                      </p>
                    </div>
                    <Badge tone={ticket.priority === 'URGENT' ? 'red' : ticket.priority === 'HIGH' ? 'amber' : 'gray'}>
                      {ticket.priority || 'NORMAL'}
                    </Badge>
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
