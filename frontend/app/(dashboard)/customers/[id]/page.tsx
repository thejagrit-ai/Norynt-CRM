'use client';
// app/(dashboard)/customers/[id]/page.tsx — Unified Customer 360 Profile & Chronological Timeline with full i18n.
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  User,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  CheckSquare,
  LifeBuoy,
  MessageSquare,
  Calendar,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Customer360Data } from '@/types';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

export default function Customer360Page() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const id = String(params?.id ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-360', id],
    queryFn: async () => {
      const res = await api.get(`/customer-360/${id}`);
      return unwrap<Customer360Data>(res.data);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-slate-400">{t('common.empty')}</p>
        <Button size="sm" onClick={() => router.back()}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const isCompany = data.identity.type === 'COMPANY';
  const customerName = isCompany
    ? data.identity.data.name
    : `${data.identity.data.firstName} ${data.identity.data.lastName}`;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{t('common.back')}</span>
      </button>

      {/* Customer Header & Identity Card */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-md space-y-4 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-xl shadow-lg shadow-brand-500/20">
              {isCompany ? <Building2 className="h-7 w-7" /> : <User className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{customerName}</h1>
                <Badge tone={isCompany ? 'blue' : 'green'}>{isCompany ? t('col.company') : t('qc.contact')}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isCompany ? data.identity.data.industry ?? '—' : data.identity.data.title ?? '—'}
              </p>
            </div>
          </div>

          {/* AI Health Score Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-brand-500/30 bg-brand-950/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('c360.healthScore')}</span>
                <span className="text-xs font-black text-emerald-400">%{data.intelligence.healthScore}</span>
              </div>
              <p className="text-xs text-brand-200 font-medium max-w-sm mt-0.5">
                {data.intelligence.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue & Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('c360.totalInvoiced')}</span>
            <p className="text-base font-black text-white mt-0.5">{data.revenue.totalInvoiced.toLocaleString()} TRY</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">{t('c360.totalPaid')}</span>
            <p className="text-base font-black text-emerald-400 mt-0.5">{data.revenue.totalPaid.toLocaleString()} TRY</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] font-bold text-amber-400 uppercase">{t('c360.openPipeline')}</span>
            <p className="text-base font-black text-amber-400 mt-0.5">{data.revenue.openDealsValue.toLocaleString()} TRY</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[10px] font-bold text-rose-400 uppercase">{t('c360.outstanding')}</span>
            <p className="text-base font-black text-rose-400 mt-0.5">{data.revenue.outstanding.toLocaleString()} TRY</p>
          </div>
        </div>
      </div>

      {/* Main Content: Timeline & Associated Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unified Chronological Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('c360.timelineTitle')}
            </h3>
            <span className="text-xs text-slate-500">{data.timeline.length} {t('common.countSuffix')}</span>
          </div>

          {data.timeline.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
              {t('c360.emptyTimeline')}
            </div>
          ) : (
            <div className="space-y-3">
              {data.timeline.map((evt) => {
                const iconMap: Record<string, any> = {
                  WHATSAPP: <MessageSquare className="h-4 w-4 text-emerald-400" />,
                  DEAL_ACTIVITY: <Briefcase className="h-4 w-4 text-brand-400" />,
                  MEETING: <Calendar className="h-4 w-4 text-sky-400" />,
                  TASK: <CheckSquare className="h-4 w-4 text-amber-400" />,
                  INVOICE: <Receipt className="h-4 w-4 text-rose-400" />,
                  QUOTE: <FileSpreadsheet className="h-4 w-4 text-indigo-400" />,
                  TICKET: <LifeBuoy className="h-4 w-4 text-purple-400" />,
                };

                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-3.5 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {iconMap[evt.type] ?? <Briefcase className="h-4 w-4 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{evt.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Active Deals & Tasks */}
        <div className="space-y-6">
          {/* Active Deals */}
          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('c360.activeDeals')}</h4>
            {data.deals.length === 0 ? (
              <p className="text-xs text-slate-500">{t('common.empty')}</p>
            ) : (
              <div className="space-y-2">
                {data.deals.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{d.title}</span>
                      <Badge tone="blue">{d.status}</Badge>
                    </div>
                    <span className="text-xs text-brand-400 font-semibold">{d.value ?? 0} {d.currency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('c360.activeTasks')}</h4>
            {data.tasks.length === 0 ? (
              <p className="text-xs text-slate-500">{t('common.empty')}</p>
            ) : (
              <div className="space-y-2">
                {data.tasks.map((tItem) => (
                  <div key={tItem.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{tItem.title}</span>
                      <Badge tone={tItem.status === 'DONE' ? 'green' : 'amber'}>{tItem.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
