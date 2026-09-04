'use client';
// app/(dashboard)/brands/[id]/page.tsx — Brand Intelligence workspace with 360° radar, AI enrichment & dynamic tabs.
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Activity, Users, Flame, LineChart, DollarSign, Building, Globe } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { BrandCompetitors } from '@/components/organisms/BrandCompetitors';
import { BrandAdRadar } from '@/components/organisms/BrandAdRadar';
import { BrandTrends } from '@/components/organisms/BrandTrends';
import { BrandPrices } from '@/components/organisms/BrandPrices';
import { Brand360 } from '@/components/organisms/Brand360';
import type { Brand } from '@/types';

function Chips({ items, tone = 'gray' }: { items: string[]; tone?: 'gray' | 'blue' | 'green' | 'amber' }) {
  if (!items?.length) return <span className="text-xs text-slate-500">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((x) => (
        <Badge key={x} tone={tone}>
          {x}
        </Badge>
      ))}
    </div>
  );
}

export default function BrandDetailPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<
    'g360' | 'profile' | 'competitors' | 'ads' | 'trends' | 'prices'
  >('g360');
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);

  const brand = useQuery({
    queryKey: ['brand', id],
    queryFn: async () => unwrap<Brand>((await api.get(`/brands/${id}`)).data),
  });

  const enrich = useMutation({
    mutationFn: async () =>
      unwrap<{ aiUsed: boolean }>(
        (await api.post(`/brands/${id}/enrich`)).data,
      ),
    onSuccess: (r) => {
      setEnrichMsg(r.aiUsed ? t('brand.enriched') : t('brand.enrichFallback'));
      qc.invalidateQueries({ queryKey: ['brand', id] });
    },
  });

  const b = brand.data;
  const row = (label: string, value: React.ReactNode) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-800/80 py-3 text-xs">
      <span className="font-semibold text-slate-400">{label}</span>
      <span className="sm:col-span-2 text-slate-200">{value}</span>
    </div>
  );

  const tabs: { key: typeof tab; label: string; icon: React.ReactNode }[] = [
    { key: 'g360', label: t('brand.tab360'), icon: <Activity className="h-4 w-4" /> },
    { key: 'profile', label: t('brand.profile'), icon: <Building className="h-4 w-4" /> },
    { key: 'competitors', label: t('brand.tabCompetitors'), icon: <Users className="h-4 w-4" /> },
    { key: 'ads', label: t('brand.tabAds'), icon: <Flame className="h-4 w-4" /> },
    { key: 'trends', label: t('brand.tabTrends'), icon: <LineChart className="h-4 w-4" /> },
    { key: 'prices', label: t('brand.tabPrices'), icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <DashboardTemplate title={b ? `${t('page.brand')}: ${b.name}` : 'page.brand'}>
      {brand.isLoading || !b ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation Pill Bar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1.5 backdrop-blur-md shadow-card">
            {tabs.map((tb) => {
              const active = tab === tb.key;
              return (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setTab(tb.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  {tb.icon}
                  <span>{tb.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          {tab === 'g360' && <Brand360 brandId={id} />}

          {tab === 'profile' && (
            <Card className="p-6">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">
                    {b.name}
                  </h3>
                  {b.aiEnriched && (
                    <Badge tone="green" dot>
                      AI Enriched
                    </Badge>
                  )}
                </div>
                {can('brand.manage') && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => enrich.mutate()}
                      disabled={enrich.isPending}
                      loading={enrich.isPending}
                    >
                      <Sparkles className="h-4 w-4 text-brand-400" />
                      <span>{t('brand.enrich')}</span>
                    </Button>
                    {enrichMsg && (
                      <span className="text-xs font-semibold text-emerald-400">
                        {enrichMsg}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                {row(t('brand.sector'), b.sector ?? '—')}
                {row(t('brand.niche'), b.niche ?? '—')}
                {row(t('brand.audience'), b.targetAudience ?? '—')}
                {row(t('brand.priceBand'), b.priceBand ?? '—')}
                {row(t('brand.description'), b.description ?? '—')}
                {row(t('brand.markets'), <Chips items={b.markets} tone="blue" />)}
                {row(t('brand.keywords'), <Chips items={b.keywords} tone="gray" />)}
                {row(
                  t('brand.competitors'),
                  <Chips items={b.answers?.knownCompetitors ?? []} tone="amber" />,
                )}
                {row(
                  t('brand.suggestedCompetitors'),
                  <Chips
                    items={b.answers?.suggestedCompetitors ?? []}
                    tone="green"
                  />,
                )}
                {row(
                  t('brand.adSearchTerms'),
                  <Chips items={b.answers?.adSearchTerms ?? []} tone="blue" />,
                )}
              </div>
            </Card>
          )}

          {tab === 'competitors' && <BrandCompetitors brandId={id} />}
          {tab === 'ads' && <BrandAdRadar brandId={id} />}
          {tab === 'trends' && <BrandTrends brandId={id} />}
          {tab === 'prices' && <BrandPrices brandId={id} />}
        </div>
      )}
    </DashboardTemplate>
  );
}
