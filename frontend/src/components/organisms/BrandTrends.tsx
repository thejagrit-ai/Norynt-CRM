'use client';
// src/components/organisms/BrandTrends.tsx — SerpAPI Google Trends visualization & keyword interest timelines.
import React, { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TrendingUp, LineChart, Globe } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { BarChart } from '../molecules/Charts';
import { Label } from '../atoms/Label';

interface TrendPoint {
  date: string;
  points: Record<string, number>;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const RANGES: { key: string; label: string; points: number | null }[] = [
  { key: '3m', label: '3M', points: 13 },
  { key: '6m', label: '6M', points: 26 },
  { key: '12m', label: '12M', points: 52 },
  { key: 'all', label: 'All', points: null },
];

export function BrandTrends({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [geo, setGeo] = useState('TR');
  const [range, setRange] = useState('all');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [data, setData] = useState<{
    keywords: string[];
    timeline: TrendPoint[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchTrends = useMutation({
    mutationFn: async () =>
      unwrap<{ keywords: string[]; timeline: TrendPoint[] }>(
        (await api.post(`/brands/${brandId}/trends`, { geo: geo.toUpperCase() }))
          .data,
      ),
    onSuccess: (r) => {
      setData(r);
      setErr(null);
      setHidden(new Set());
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? t('trend.connectHint');
      setErr(msg);
      setData(null);
    },
  });

  const colorOf = (k: string) =>
    COLORS[(data?.keywords.indexOf(k) ?? 0) % COLORS.length];

  const timeline = useMemo(() => {
    if (!data) return [];
    const n = RANGES.find((r) => r.key === range)?.points;
    return n ? data.timeline.slice(-n) : data.timeline;
  }, [data, range]);

  const visible = (data?.keywords ?? []).filter((k) => !hidden.has(k));

  const stats = useMemo(() => {
    const m: Record<string, { avg: number; peak: number }> = {};
    for (const k of data?.keywords ?? []) {
      const vals = timeline.map((p) => p.points[k] ?? 0);
      const peak = vals.length ? Math.max(...vals) : 0;
      const avg = vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
      m[k] = { avg, peak };
    }
    return m;
  }, [data, timeline]);

  const toggle = (k: string) =>
    setHidden((s) => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <div className="space-y-6">
      {/* Query Bar */}
      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="bt-geo">{t('trend.geo')}</Label>
            <input
              id="bt-geo"
              value={geo}
              onChange={(e) => setGeo(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-16 rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-center text-sm font-bold text-slate-100 outline-none focus:border-brand-500"
            />
          </div>
          <Button
            onClick={() => fetchTrends.mutate()}
            disabled={fetchTrends.isPending}
            loading={fetchTrends.isPending}
          >
            <TrendingUp className="h-4 w-4" />
            <span>{t('trend.fetch')}</span>
          </Button>
        </div>
        {err && <p className="mt-3 text-xs font-medium text-amber-400">{err}</p>}
      </Card>

      {fetchTrends.isPending ? (
        <div className="flex h-44 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : data && data.timeline.length > 0 ? (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-brand-400" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                {t('trend.title')}
                <span className="ml-2 font-normal text-xs text-slate-400">
                  · {geo.toUpperCase()} · (0–100 Relative Interest Index)
                </span>
              </h4>
            </div>

            {/* Range Toggles */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    range === r.key
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.key === 'all' ? t('trend.rangeAll') || 'All' : r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword Series Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((k) => {
              const off = hidden.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    off
                      ? 'border-slate-800 bg-slate-950/40 text-slate-500 opacity-60'
                      : 'border-slate-700/80 bg-slate-900/90 text-slate-200 shadow-sm'
                  }`}
                  title={off ? t('trend.showSeries') : t('trend.hideSeries')}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: off ? '#64748b' : colorOf(k),
                      boxShadow: off ? undefined : `0 0 6px ${colorOf(k)}`,
                    }}
                  />
                  <span>{k}</span>
                  <span className="text-[11px] text-slate-400">
                    · Ort: {stats[k]?.avg} · Zirve: {stats[k]?.peak}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('trend.allHidden')}
            </div>
          ) : (
            <BarChart
              labels={timeline.map((p) => p.date)}
              series={visible.map((k) => ({ name: k, color: colorOf(k) }))}
              values={visible.map((k) => timeline.map((p) => p.points[k] ?? 0))}
              height={220}
            />
          )}

          {/* Explanatory Callout */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              {t('trend.explainTitle')}{' '}
            </span>
            {t('trend.explain')}
          </div>
        </Card>
      ) : data ? (
        <Card className="p-8 text-center text-xs text-slate-400">
          {t('trend.empty')}
        </Card>
      ) : null}
    </div>
  );
}
