'use client';
// src/components/organisms/Brand360.tsx — 360° Brand Intelligence with signal cards & AI Growth Playbook.
import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Users, Flame, Package, DollarSign, ArrowRight } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { StatCard } from '../molecules/StatCard';
import { Spinner } from '../atoms/Spinner';
import { Badge } from '../atoms/Badge';

interface Signals {
  competitors: number;
  savedAds: number;
  products: number;
  avgPrice: number | null;
}
interface Playbook {
  aiUsed: boolean;
  positioning: string;
  pricingInsight: string;
  nextActions: string[];
  adAngles: string[];
  contentIdeas: string[];
}

export function Brand360({ brandId }: { brandId: string }) {
  const { t } = useI18n();

  const signals = useQuery({
    queryKey: ['signals', brandId],
    queryFn: async () =>
      unwrap<Signals>((await api.get(`/brands/${brandId}/signals`)).data),
  });

  const playbook = useMutation({
    mutationFn: async () =>
      unwrap<Playbook>((await api.post(`/brands/${brandId}/playbook`)).data),
  });

  const s = signals.data;
  const p = playbook.data;

  const section = (title: string, items: string[], badgeTone: 'indigo' | 'emerald' | 'amber') =>
    items.length > 0 ? (
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {title}
          </h4>
          <Badge tone={badgeTone}>{items.length} Suggestions</Badge>
        </div>
        <ul className="space-y-1.5 pl-1 text-xs text-slate-300">
          {items.map((x, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-400 font-bold shrink-0">→</span>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Brand Signals Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label={t('g.competitors')}
          value={s?.competitors ?? '…'}
          icon={<Users className="h-5 w-5" />}
          tone="indigo"
        />
        <StatCard
          label={t('g.savedAds')}
          value={s?.savedAds ?? '…'}
          icon={<Flame className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label={t('g.products')}
          value={s?.products ?? '…'}
          icon={<Package className="h-5 w-5" />}
          tone="sky"
        />
        <StatCard
          label={t('g.avgPrice')}
          value={s?.avgPrice != null ? `${s.avgPrice.toFixed(0)} TRY` : '—'}
          icon={<DollarSign className="h-5 w-5" />}
          tone="emerald"
        />
      </div>

      {/* AI Playbook Generator */}
      <Card className="p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span>AI Growth & Positioning Playbook</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes competitors, prices, and ad trends to generate strategic recommendations
            </p>
          </div>

          <Button
            onClick={() => playbook.mutate()}
            disabled={playbook.isPending}
            loading={playbook.isPending}
          >
            <Sparkles className="h-4 w-4" />
            <span>{t('g.generate')}</span>
          </Button>
        </div>

        {playbook.isPending && (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {p && (
          <div className="space-y-4 animate-fade-in border-t border-slate-800/80 pt-4">
            {!p.aiUsed && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                {t('g.aiOff')}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('g.positioning')}
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {p.positioning}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('g.pricing')}
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {p.pricingInsight}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {section(t('g.nextActions'), p.nextActions, 'emerald')}
              {section(t('g.adAngles'), p.adAngles, 'indigo')}
              {section(t('g.contentIdeas'), p.contentIdeas, 'amber')}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
