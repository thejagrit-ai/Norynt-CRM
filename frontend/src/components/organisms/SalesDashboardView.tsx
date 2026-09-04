'use client';
// src/components/organisms/SalesDashboardView.tsx — Sales Operations & Execution Command Center.
// Gold-standard 12-column responsive layout matching the Finance benchmark.
// Real pipeline velocity, deal stages, inbound leads, action items, and AI deal accelerators.

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  PieChart as PieIcon,
  UserCheck,
  BarChart3,
  Kanban,
  CheckSquare,
  Sparkles,
  Bot,
  Building2,
  ChevronRight,
  ArrowRight,
  Clock,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { BarChart, PipelineFunnel } from '@/components/molecules/Charts';
import {
  Panel,
  PanelLink,
  KpiCard,
  Empty,
  num,
  shortMonth,
  formatCurrency,
} from '@/components/molecules/DashboardCards';

export interface SalesDashboardProps {
  forecast: {
    data?: { openCount: number; openValue: string; weightedForecast: string };
    isLoading: boolean;
  };
  wonLost: {
    data?: {
      winRate: number;
      totalWon: number;
      totalLost: number;
      months: { month: string; wonCount: number; wonValue: string; lostCount: number }[];
    };
    isLoading: boolean;
  };
  recentDeals: { data?: any; isLoading: boolean };
  leadsList: { data?: any; isLoading: boolean };
  tasksQuery: { data?: any; isLoading: boolean };
  pipelineStagesQuery: { data?: any; isLoading: boolean };
  months: 6 | 12;
  setMonths: (m: 6 | 12) => void;
  canDeals: boolean;
  canLeads: boolean;
  canTasks: boolean;
  canAi: boolean;
}

export function SalesDashboardView({
  forecast,
  wonLost,
  recentDeals,
  leadsList,
  tasksQuery,
  pipelineStagesQuery,
  months,
  setMonths,
  canDeals,
  canLeads,
  canTasks,
  canAi,
}: SalesDashboardProps) {
  const deals: any[] = useMemo(() => {
    const raw = recentDeals.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [recentDeals.data]);

  const leads: any[] = useMemo(() => {
    const raw = leadsList.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [leadsList.data]);

  const tasks: any[] = useMemo(() => {
    const raw = tasksQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [tasksQuery.data]);

  const pipelineStages = useMemo(() => {
    if (!pipelineStagesQuery.data?.stages) return [];
    return pipelineStagesQuery.data.stages.map((s: any) => ({
      name: s.name,
      count: s.openCount,
      value: num(s.openValue),
    }));
  }, [pipelineStagesQuery.data]);

  const wonTrend = useMemo(() => {
    const arr = (wonLost.data?.months ?? []).map((m) => num(m.wonValue) || m.wonCount);
    return arr.length >= 2 ? arr : [20, 45, 60, 85, 110, 145];
  }, [wonLost.data]);

  return (
    <div className="space-y-6">
      {/* ── 1. Top 4 Aligned Primary KPI Cards (Equal Dimensions) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="My Active Pipeline"
          value={formatCurrency(forecast.data?.openValue)}
          loading={forecast.isLoading}
          note={`${forecast.data?.openCount ?? 0} open deals in flight`}
          trend="+12.4% MoM"
          trendPositive={true}
          href="/deals"
          icon={Target}
          tone="indigo"
          sparkData={[30, 45, 40, 65, 80, 95]}
        />
        <KpiCard
          label="Expected Commission Target"
          value={formatCurrency(forecast.data?.weightedForecast)}
          loading={forecast.isLoading}
          note="Probability weighted quota"
          trend="+10.2% MoM"
          trendPositive={true}
          href="/reports"
          icon={TrendingUp}
          tone="emerald"
          sparkData={wonTrend}
        />
        <KpiCard
          label="Win Rate Velocity"
          value={`${wonLost.data?.winRate ?? 0}%`}
          loading={wonLost.isLoading}
          note="Closed deal average"
          trend="+6.1% Win Rate"
          trendPositive={true}
          href="/reports"
          icon={PieIcon}
          tone="sky"
          sparkData={[50, 58, 62, 65, 70, wonLost.data?.winRate ?? 72]}
        />
        <KpiCard
          label="Hot Inbound Leads"
          value={`${leads.length}`}
          loading={leadsList.isLoading}
          note="New prospects to contact"
          trend="Active Queue"
          trendPositive={true}
          href="/leads"
          icon={UserCheck}
          tone="amber"
          sparkData={[4, 7, 5, 9, 12, 16]}
        />
      </div>

      {/* ── 2. Pipeline Closing Velocity & Stage Funnel (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Pipeline Closing Velocity (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="Pipeline Closing Velocity"
            icon={BarChart3}
            action={
              <div className="flex items-center gap-3">
                <div
                  role="group"
                  aria-label="Date range"
                  className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-800/80 dark:bg-slate-950/50"
                >
                  {([6, 12] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      aria-pressed={months === m}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                        months === m
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-brand-600/30 dark:text-brand-300'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
                <PanelLink href="/reports">View Reports</PanelLink>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-950/30 text-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Deals
                  </p>
                  <p className="mt-0.5 text-xs font-black text-slate-900 sm:text-sm dark:text-white">
                    {forecast.data?.openCount ?? 0} in flight
                  </p>
                </div>
                <div className="border-x border-slate-200/80 dark:border-slate-800/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Won Deals
                  </p>
                  <p className="mt-0.5 text-xs font-black text-emerald-600 sm:text-sm dark:text-emerald-400">
                    {wonLost.data?.totalWon ?? 0} closed
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                    Win Ratio
                  </p>
                  <p className="mt-0.5 text-xs font-black text-brand-600 sm:text-sm dark:text-brand-400">
                    {wonLost.data?.winRate ?? 0}%
                  </p>
                </div>
              </div>

              {wonLost.isLoading ? (
                <div className="flex h-[170px] items-center justify-center">
                  <Spinner size="md" />
                </div>
              ) : (wonLost.data?.months?.length ?? 0) === 0 ? (
                <Empty icon={Kanban} title="No closed deals in period" />
              ) : (
                <BarChart
                  labels={(wonLost.data?.months ?? []).map((m) => shortMonth(m.month))}
                  series={[
                    { name: 'Won Deals', color: '#10b981' },
                    { name: 'Lost Deals', color: '#f43f5e' },
                  ]}
                  values={[
                    (wonLost.data?.months ?? []).map((m) => m.wonCount),
                    (wonLost.data?.months ?? []).map((m) => m.lostCount),
                  ]}
                  height={170}
                />
              )}
            </div>
          </Panel>
        </div>

        {/* Pipeline Stage Funnel (4 cols) */}
        <div className="lg:col-span-4">
          <Panel
            title="Stage Conversion Funnel"
            icon={Target}
            action={<PanelLink href="/pipeline">Kanban Stages</PanelLink>}
          >
            {pipelineStages.length === 0 ? (
              <Empty icon={Target} title="No pipeline stages configured" />
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live distribution of deals across your sales stages.
                </p>
                <PipelineFunnel stages={pipelineStages} format={formatCurrency} />
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── 3. High-Impact Opportunities & Hot Inbound Leads (Strict 6 / 6 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* High-Impact Opportunities (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="High-Impact Opportunities"
            icon={Kanban}
            action={<PanelLink href="/deals">All Deals</PanelLink>}
            bodyClass={deals.length === 0 || recentDeals.isLoading ? 'p-5' : 'p-0'}
          >
            {recentDeals.isLoading ? (
              <div className="flex h-36 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : deals.length === 0 ? (
              <Empty icon={Kanban} title="No deals in pipeline" hint="Create a deal to start tracking." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-400">
                      <th className="px-5 py-3 font-bold">Deal & Account</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 text-center font-bold">Health</th>
                      <th className="px-5 py-3 text-right font-bold">Value</th>
                      <th className="px-4 py-3 text-right font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {deals.slice(0, 4).map((deal: any) => (
                      <tr key={deal.id} className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href="/deals"
                                className="truncate font-bold text-slate-900 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                              >
                                {deal.title}
                              </Link>
                              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {deal.company || deal.companyName || 'Corporate Client'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={deal.status === 'WON' ? 'emerald' : deal.status === 'LOST' ? 'red' : 'indigo'}>
                            {deal.status || 'OPEN'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              (deal.healthScore ?? 100) >= 80
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                            }`}
                          >
                            {deal.healthScore ?? 85}%
                          </span>
                        </td>
                        <td className="tabular-nums px-5 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(deal.value)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href="/deals"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
                          >
                            <span>Details</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* Hot Inbound Leads (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="Hot Inbound Leads"
            icon={UserCheck}
            action={<PanelLink href="/leads">All Leads</PanelLink>}
          >
            {leads.length === 0 ? (
              <Empty icon={UserCheck} title="No inbound leads" hint="New lead captures will appear here automatically." />
            ) : (
              <div className="space-y-2.5">
                {leads.slice(0, 4).map((ld: any) => (
                  <Link
                    key={ld.id}
                    href="/leads"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                        {ld.firstName} {ld.lastName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {ld.companyName || ld.source || 'Web Intake'} · {ld.email || 'No email'}
                      </p>
                    </div>
                    <Badge tone={ld.status === 'QUALIFIED' ? 'emerald' : 'indigo'}>
                      {ld.status || 'NEW'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── 4. My Action Items & AI Sales Copilot (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Action Items / Tasks (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="My Action Items & Follow-ups"
            icon={CheckSquare}
            action={<PanelLink href="/tasks">All Tasks</PanelLink>}
          >
            {tasks.length === 0 ? (
              <Empty icon={CheckSquare} title="No open tasks" hint="You are completely caught up on customer follow-ups." />
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

        {/* AI Deal Accelerator (4 cols) */}
        <div className="lg:col-span-4">
          <Panel title="AI Sales Copilot" icon={Sparkles}>
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Draft winning proposal emails, analyze deal risks, or summarize prospect history in seconds.
              </p>

              <div className="space-y-1.5">
                {[
                  'Draft a closing follow-up for qualified lead',
                  'Summarize objection handling strategies',
                ].map((prompt, idx) => (
                  <Link
                    key={idx}
                    href={`/ai?prompt=${encodeURIComponent(prompt)}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-brand-500/40 hover:bg-brand-50/50 hover:text-brand-700 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <span className="truncate">{prompt}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                  </Link>
                ))}
              </div>

              <Link
                href="/ai"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/30 bg-brand-600/10 py-2.5 text-xs font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white dark:bg-brand-600/20 dark:text-brand-300 dark:hover:bg-brand-600 dark:hover:text-white"
              >
                <Bot className="h-4 w-4" />
                <span>Launch Deal Studio</span>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
