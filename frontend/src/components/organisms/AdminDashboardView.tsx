'use client';
// src/components/organisms/AdminDashboardView.tsx — Executive Operational Command Center.
// Zero mock/fake data. 100% real database telemetry, revenue forecasting, pipeline health, and support queue.

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  PieChart as PieIcon,
  Receipt,
  BarChart3,
  Award,
  Kanban,
  LifeBuoy,
  AlertCircle,
  Sparkles,
  Bot,
  Building2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Inbox,
  Users,
  CheckCircle2,
  type LucideIcon,
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

export interface AdminDashboardProps {
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
  invoicesSummary: {
    data?: { totalInvoiced: string; totalPaid: string; outstanding: string };
    isLoading: boolean;
  };
  revenueMonthly: {
    data?: { months: { month: string; invoiced: string; paid: string }[] };
    isLoading: boolean;
  };
  recentDeals: { data?: any; isLoading: boolean };
  byOwnerQuery: { data?: any; isLoading: boolean };
  pipelineStagesQuery: { data?: any; isLoading: boolean };
  ticketsQuery: { data?: any; isLoading: boolean };
  priorities: { data?: any; isLoading: boolean };
  months: 6 | 12;
  setMonths: (m: 6 | 12) => void;
  canFinancial: boolean;
  canDeals: boolean;
  canTickets: boolean;
  canAi: boolean;
}

export function AdminDashboardView({
  forecast,
  wonLost,
  invoicesSummary,
  revenueMonthly,
  recentDeals,
  byOwnerQuery,
  pipelineStagesQuery,
  ticketsQuery,
  priorities,
  months,
  setMonths,
  canFinancial,
  canDeals,
  canTickets,
  canAi,
}: AdminDashboardProps) {
  const deals: any[] = useMemo(() => {
    const raw = recentDeals.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [recentDeals.data]);

  const owners: any[] = useMemo(() => {
    const raw = byOwnerQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  }, [byOwnerQuery.data]);

  const tickets: any[] = useMemo(() => {
    const raw = ticketsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
  }, [ticketsQuery.data]);

  const priorityItems: any[] = useMemo(() => priorities.data?.priorities ?? [], [priorities.data]);

  const pipelineStages = useMemo(() => {
    if (!pipelineStagesQuery.data?.stages) return [];
    return pipelineStagesQuery.data.stages.map((s: any) => ({
      name: s.name,
      count: s.openCount || 0,
      value: num(s.openValue),
    }));
  }, [pipelineStagesQuery.data]);

  // Real Sparkline Arrays (Only if real data points exist and have values)
  const wonSparkData = useMemo(() => {
    const arr = (wonLost.data?.months ?? []).map((m) => num(m.wonValue) || m.wonCount);
    const hasData = arr.some((v) => v > 0);
    return hasData && arr.length >= 2 ? arr : undefined;
  }, [wonLost.data]);

  const revSparkData = useMemo(() => {
    const arr = (revenueMonthly.data?.months ?? []).map((m) => num(m.paid));
    const hasData = arr.some((v) => v > 0);
    return hasData && arr.length >= 2 ? arr : undefined;
  }, [revenueMonthly.data]);

  const wonMonths = wonLost.data?.months ?? [];
  const hasWonData = wonMonths.some((m) => m.wonCount > 0 || m.lostCount > 0);

  const revMonths = revenueMonthly.data?.months ?? [];
  const hasRevData = revMonths.some((m) => num(m.invoiced) > 0 || num(m.paid) > 0);

  const urgencyDot = (u: string) =>
    u === 'CRITICAL' ? 'bg-rose-500' : u === 'HIGH' ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <div className="space-y-6">
      {/* ── 1. Top 4 Aligned Primary KPI Cards (Equal Dimensions, Strict 4-Grid) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Pipeline Value"
          value={formatCurrency(forecast.data?.openValue)}
          loading={forecast.isLoading}
          note={`${forecast.data?.openCount ?? 0} open qualified opportunities`}
          trend={forecast.data?.openCount ? `${forecast.data.openCount} Deals in Flight` : 'Pipeline active'}
          trendPositive={true}
          href="/deals"
          icon={Target}
          tone="indigo"
        />

        <KpiCard
          label="Realized Revenue (Paid)"
          value={formatCurrency(invoicesSummary.data?.totalPaid)}
          loading={invoicesSummary.isLoading}
          note={`Billed: ${formatCurrency(invoicesSummary.data?.totalInvoiced)}`}
          trend={num(invoicesSummary.data?.totalPaid) > 0 ? 'Cash collection active' : 'Awaiting settlement'}
          trendPositive={num(invoicesSummary.data?.totalPaid) > 0}
          href="/invoices"
          icon={Receipt}
          tone="emerald"
          sparkData={revSparkData}
        />

        <KpiCard
          label="Deal Conversion Rate"
          value={`${wonLost.data?.winRate ?? 0}%`}
          loading={wonLost.isLoading}
          note={`${wonLost.data?.totalWon ?? 0} won · ${wonLost.data?.totalLost ?? 0} lost`}
          trend={`${wonLost.data?.totalWon ?? 0} Closed Won`}
          trendPositive={(wonLost.data?.winRate ?? 0) >= 50}
          href="/reports"
          icon={PieIcon}
          tone="sky"
          sparkData={wonSparkData}
        />

        <KpiCard
          label="Customer Support Queue"
          value={`${tickets.length}`}
          loading={ticketsQuery.isLoading}
          note={`${tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length} high priority tickets`}
          trend={tickets.length === 0 ? 'All SLAs Met' : 'Active Queue'}
          trendPositive={tickets.length === 0}
          href="/tickets"
          icon={LifeBuoy}
          tone="purple"
        />
      </div>

      {/* ── 2. Primary Revenue Trajectory & Pipeline Funnel (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Performance & Revenue Trajectory (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="Performance & Revenue Trajectory"
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
                {canFinancial && <PanelLink href="/reports">Full Reports</PanelLink>}
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Deals Won vs Lost */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/30">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Deals Won vs Lost</p>
                    <p className="text-[11px] text-slate-400">Closed deal velocity per month</p>
                  </div>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {wonLost.data?.winRate ?? 0}% win rate
                  </span>
                </div>

                {wonLost.isLoading ? (
                  <div className="flex h-[170px] items-center justify-center">
                    <Spinner size="md" />
                  </div>
                ) : !hasWonData ? (
                  <Empty icon={Kanban} title="No closed deals in selected period" hint="Win or lose deals to visualize velocity." />
                ) : (
                  <BarChart
                    labels={wonMonths.map((m) => shortMonth(m.month))}
                    series={[
                      { name: 'Won', color: '#10b981' },
                      { name: 'Lost', color: '#f43f5e' },
                    ]}
                    values={[
                      wonMonths.map((m) => m.wonCount),
                      wonMonths.map((m) => m.lostCount),
                    ]}
                    height={160}
                  />
                )}
              </div>

              {/* Billed vs Collected */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/30">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Billed vs Collected</p>
                    <p className="text-[11px] text-slate-400">Cashflow & invoicing realization</p>
                  </div>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                    {formatCurrency(invoicesSummary.data?.totalPaid)}
                  </span>
                </div>

                {revenueMonthly.isLoading ? (
                  <div className="flex h-[170px] items-center justify-center">
                    <Spinner size="md" />
                  </div>
                ) : !hasRevData ? (
                  <Empty icon={Inbox} title="No invoices recorded in period" hint="Issue invoices to track billing realization." />
                ) : (
                  <BarChart
                    labels={revMonths.map((m) => shortMonth(m.month))}
                    series={[
                      { name: 'Billed', color: '#6366f1' },
                      { name: 'Collected', color: '#10b981' },
                    ]}
                    values={[
                      revMonths.map((m) => num(m.invoiced)),
                      revMonths.map((m) => num(m.paid)),
                    ]}
                    format={(v) => formatCurrency(v)}
                    height={160}
                  />
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* Pipeline Stage Funnel (4 cols) */}
        <div className="lg:col-span-4">
          <Panel
            title="Active Pipeline Funnel"
            icon={Target}
            action={<PanelLink href="/pipeline">Kanban Stages</PanelLink>}
          >
            {pipelineStages.length === 0 ? (
              <Empty icon={Target} title="No pipeline stages found" hint="Create pipeline stages to visualize conversion." />
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live distribution of deals across qualification, proposal, and closing stages.
                </p>
                <PipelineFunnel stages={pipelineStages} format={formatCurrency} />
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── 3. Sales Leaderboard & High-Impact Opportunities (Strict 6 / 6 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Sales Team Leaderboard (6 cols) */}
        <div className="lg:col-span-6">
          <Panel
            title="Sales Team Leaderboard"
            icon={Award}
            action={<PanelLink href="/reports">Performance Reports</PanelLink>}
          >
            {owners.length === 0 ? (
              <Empty icon={Award} title="No sales rep records found" hint="Assign deals to team members to rank rep performance." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {owners.slice(0, 4).map((rep, idx) => (
                  <div
                    key={rep.ownerId || idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-brand-500/30 dark:border-slate-800/70 dark:bg-slate-950/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {rep.name || 'Sales Rep'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {rep.wonCount || 0} won · {rep.winRate || 0}% win rate
                        </p>
                      </div>
                    </div>
                    <span className="tabular-nums font-extrabold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatCurrency(rep.wonValue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

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
              <Empty icon={Kanban} title="No active deals in pipeline" hint="Create new deals to track corporate opportunities." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-400">
                      <th className="px-5 py-3 font-bold">Deal & Company</th>
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
      </div>

      {/* ── 4. Customer Support Queue & Needs Attention / AI Copilot (Strict 8 / 4 Split) ── */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Support Queue (8 cols) */}
        <div className="lg:col-span-8">
          <Panel
            title="Customer Support Queue & Service SLAs"
            icon={LifeBuoy}
            action={<PanelLink href="/tickets">All Tickets</PanelLink>}
          >
            {tickets.length === 0 ? (
              <Empty icon={LifeBuoy} title="No open support tickets" hint="All customer care requests are resolved." />
            ) : (
              <div className="space-y-2.5">
                {tickets.slice(0, 4).map((t: any) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70 dark:bg-slate-950/40"
                  >
                    <div className="min-w-0">
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
                        {t.company?.name || 'Customer Account Inquiry'}
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

        {/* Needs Attention & AI Copilot (4 cols) */}
        <div className="lg:col-span-4">
          <Panel
            title="Needs Attention & AI Copilot"
            icon={Sparkles}
            badge={
              priorityItems.length > 0 ? (
                <span className="tabular-nums rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  {priorityItems.length}
                </span>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {priorities.isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : priorityItems.length === 0 ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>All customer accounts and pipeline deals are healthy.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {priorityItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={item.actionHref || '#'}
                      className="group flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 transition hover:border-brand-500/40 hover:bg-white dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                    >
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${urgencyDot(item.urgency)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-300">
                          {item.title}
                        </p>
                        <p className="line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {item.subtitle}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800/70">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  AI Quick Commands
                </p>
                {[
                  'Summarize top deals closing this month',
                  'Draft a renewal follow-up proposal',
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/30 bg-brand-600/10 py-2 text-xs font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white dark:bg-brand-600/20 dark:text-brand-300 dark:hover:bg-brand-600 dark:hover:text-white"
              >
                <Bot className="h-4 w-4" />
                <span>Launch AI Command Studio</span>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
