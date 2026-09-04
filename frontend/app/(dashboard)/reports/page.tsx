'use client';
// app/(dashboard)/reports/page.tsx — Executive Analytics Command Center with live charts & performance rankings with full i18n.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Target,
  PieChart as PieIcon,
  Receipt,
  Users,
  Package,
  GitCommit,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { StatCard } from '@/components/molecules/StatCard';
import { Spinner } from '@/components/atoms/Spinner';
import { BarChart, DonutChart, HBarList } from '@/components/molecules/Charts';

interface PipelineReport {
  stages: { stageId: string; name: string; openCount: number; openValue: string }[];
}
interface RevenueRow {
  month: string;
  invoiced: string;
  paid: string;
}
interface OwnerRow {
  ownerId: string | null;
  name: string | null;
  wonValue: string;
  wonCount: number;
  winRate: number;
}
interface ProductRow {
  productId: string;
  name: string;
  revenue: string;
  quantity: string;
}
interface WonLostRow {
  month: string;
  wonCount: number;
  lostCount: number;
}

const num = (s: string | number | undefined) => Number(s ?? 0);
const money = (n: number) => n.toLocaleString();
const shortMonth = (m: string) => m.slice(2);

export default function ReportsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const financial = can('invoice.read_financial');

  const pipelineId = useQuery({
    queryKey: ['report-pipelineId'],
    queryFn: async () => {
      const res = await api.get('/deals', { params: { limit: 1 } });
      return unwrap<{ pipelineId?: string }[]>(res.data)[0]?.pipelineId ?? null;
    },
  });

  const pipeline = useQuery({
    queryKey: ['report-pipeline', pipelineId.data],
    enabled: !!pipelineId.data,
    queryFn: async () =>
      unwrap<PipelineReport>(
        (await api.get('/reports/pipeline', { params: { pipelineId: pipelineId.data } })).data,
      ),
  });

  const forecast = useQuery({
    queryKey: ['report-forecast'],
    queryFn: async () =>
      unwrap<{ openCount: number; openValue: string; weightedForecast: string }>(
        (await api.get('/reports/forecast')).data,
      ),
  });

  const summary = useQuery({
    queryKey: ['report-deals-summary'],
    queryFn: async () =>
      unwrap<Record<string, { count: number; value: string }>>(
        (await api.get('/reports/deals/summary')).data,
      ),
  });

  const wonLost = useQuery({
    queryKey: ['report-won-lost'],
    queryFn: async () =>
      unwrap<{ winRate: number; months: WonLostRow[] }>(
        (await api.get('/reports/deals/won-lost', { params: { months: 6 } })).data,
      ),
  });

  const byOwner = useQuery({
    queryKey: ['report-by-owner'],
    queryFn: async () =>
      unwrap<OwnerRow[]>((await api.get('/reports/sales/by-owner')).data),
  });

  const topProducts = useQuery({
    queryKey: ['report-top-products'],
    queryFn: async () =>
      unwrap<ProductRow[]>(
        (await api.get('/reports/products/top', { params: { limit: 8 } })).data,
      ),
  });

  const revenue = useQuery({
    queryKey: ['report-revenue'],
    enabled: financial,
    queryFn: async () =>
      unwrap<{ months: RevenueRow[] }>(
        (await api.get('/reports/revenue/monthly', { params: { months: 12 } })).data,
      ),
  });

  const invoices = useQuery({
    queryKey: ['report-invoices'],
    enabled: financial,
    queryFn: async () =>
      unwrap<{ totalInvoiced: string; totalPaid: string; outstanding: string }>(
        (await api.get('/reports/invoices/summary')).data,
      ),
  });

  return (
    <DashboardTemplate title="page.reports">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('rep.openDeals')}
          value={forecast.data?.openCount ?? '…'}
          hint={`${t('rep.valuePrefix')}: ${forecast.data?.openValue ?? '—'}`}
          icon={<Target className="h-5 w-5" />}
          tone="indigo"
          trend={{ value: t('rep.openDeals'), positive: true }}
        />
        <StatCard
          label={t('rep.forecast')}
          value={forecast.data?.weightedForecast ?? '…'}
          hint={t('rep.forecastHint')}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="emerald"
          trend={{ value: t('rep.forecast'), positive: true }}
        />
        <StatCard
          label={t('rep.winRate')}
          value={wonLost.data ? `%${wonLost.data.winRate}` : '…'}
          hint={`${t('rep.won')}: ${wonLost.data?.months.reduce((a, m) => a + m.wonCount, 0) ?? '—'}`}
          icon={<PieIcon className="h-5 w-5" />}
          tone="sky"
          trend={{ value: t('rep.winRate'), positive: true }}
        />
        {financial && (
          <StatCard
            label={t('rep.outstanding')}
            value={invoices.data?.outstanding ?? '…'}
            hint={`${t('rep.invoicedPrefix')}: ${invoices.data?.totalInvoiced ?? '—'}`}
            icon={<Receipt className="h-5 w-5" />}
            tone="amber"
            trend={{ value: t('rep.outstanding'), positive: false }}
          />
        )}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart (financial) */}
        {financial && (
          <Card className="p-5 sm:p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('rep.revenueTitle')}
                </h3>
                <p className="text-xs text-slate-400">{t('rep.invoiced')}</p>
              </div>
            </div>
            {revenue.isLoading ? (
              <div className="flex h-44 items-center justify-center">
                <Spinner size="md" />
              </div>
            ) : (
              <BarChart
                labels={(revenue.data?.months ?? []).map((m) => shortMonth(m.month))}
                series={[
                  { name: t('rep.invoiced'), color: '#6366f1' },
                  { name: t('rep.paid'), color: '#10b981' },
                ]}
                values={[
                  (revenue.data?.months ?? []).map((m) => num(m.invoiced)),
                  (revenue.data?.months ?? []).map((m) => num(m.paid)),
                ]}
                format={money}
                height={170}
              />
            )}
          </Card>
        )}

        {/* Won vs Lost Monthly Trend */}
        <Card className="p-5 sm:p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('rep.wonLostTitle')}
              </h3>
              <p className="text-xs text-slate-400">{t('rep.wonLostTitle')}</p>
            </div>
          </div>
          {wonLost.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <BarChart
              labels={(wonLost.data?.months ?? []).map((m) => shortMonth(m.month))}
              series={[
                { name: t('rep.won'), color: '#10b981' },
                { name: t('rep.lost'), color: '#f43f5e' },
              ]}
              values={[
                (wonLost.data?.months ?? []).map((m) => m.wonCount),
                (wonLost.data?.months ?? []).map((m) => m.lostCount),
              ]}
              height={170}
            />
          )}
        </Card>

        {/* Deals Status Distribution Donut */}
        <Card className="p-5 sm:p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t('rep.statusTitle')}
              </h3>
              <p className="text-xs text-slate-400">{t('rep.statusTitle')}</p>
            </div>
          </div>
          {summary.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <DonutChart
              data={[
                { label: t('rep.open'), value: summary.data?.OPEN?.count ?? 0, color: '#38bdf8' },
                { label: t('rep.won'), value: summary.data?.WON?.count ?? 0, color: '#10b981' },
                { label: t('rep.lost'), value: summary.data?.LOST?.count ?? 0, color: '#f43f5e' },
              ]}
            />
          )}
        </Card>

        {/* Sales Rep Leaderboard */}
        <Card className="p-5 sm:p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('rep.byOwnerTitle')}
            </h3>
          </div>
          {byOwner.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <HBarList
              color="#6366f1"
              empty={t('common.empty')}
              data={(byOwner.data ?? []).map((o) => ({
                label: o.name ?? t('rep.unassigned'),
                value: num(o.wonValue),
                sub: `%${o.winRate}`,
              }))}
              format={money}
            />
          )}
        </Card>

        {/* Top Products Ranking */}
        <Card className="p-5 sm:p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('rep.topProductsTitle')}
            </h3>
          </div>
          {topProducts.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <HBarList
              color="#f59e0b"
              empty={t('common.empty')}
              data={(topProducts.data ?? []).map((p) => ({
                label: p.name,
                value: num(p.revenue),
                sub: `${num(p.quantity)} ${t('rep.qty')}`,
              }))}
              format={money}
            />
          )}
        </Card>

        {/* Pipeline Stage Distribution */}
        <Card className="p-5 sm:p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('rep.pipelineTitle')}
            </h3>
          </div>
          {pipeline.isLoading ? (
            <div className="flex h-44 items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : (
            <HBarList
              color="#a855f7"
              empty={t('common.empty')}
              data={(pipeline.data?.stages ?? []).map((s) => ({
                label: s.name,
                value: s.openCount,
                sub: s.openValue,
              }))}
            />
          )}
        </Card>
      </div>
    </DashboardTemplate>
  );
}
