'use client';
// src/components/molecules/DashboardCards.tsx — Shared Enterprise Dashboard Cards & Atoms.
// Gold-standard UI primitives matching the Finance Dashboard benchmark:
// Aligned 12-column responsive grid components, subtle ambient gradients, top highlight lines,
// equal-height flex containers, and accessible light/dark theme styling.

import React from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { Sparkline } from '@/components/molecules/Charts';

/* ────────────────────────── Helpers & Formatters ────────────────────────── */

export function num(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

export function shortMonth(m: string): string {
  const parts = m.split('-');
  return parts.length === 2 ? `${parts[1]}/${parts[0].slice(2)}` : m;
}

export function formatCurrency(v: string | number | null | undefined): string {
  const n = num(v);
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export type Tone = 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'sky';

export const TONE_STYLES: Record<Tone, {
  well: string;
  text: string;
  glow: string;
  sparkline: string;
  accentBorder: string;
  topLine: string;
}> = {
  indigo: {
    well: 'bg-brand-500/10 border-brand-500/25 dark:bg-brand-500/15',
    text: 'text-brand-600 dark:text-brand-400',
    glow: 'from-brand-500/20 via-brand-500/5 to-transparent',
    sparkline: '#6366f1',
    accentBorder: 'hover:border-brand-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-brand-500 to-transparent',
  },
  emerald: {
    well: 'bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    sparkline: '#10b981',
    accentBorder: 'hover:border-emerald-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent',
  },
  amber: {
    well: 'bg-amber-500/10 border-amber-500/25 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
    sparkline: '#f59e0b',
    accentBorder: 'hover:border-amber-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-amber-500 to-transparent',
  },
  purple: {
    well: 'bg-purple-500/10 border-purple-500/25 dark:bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'from-purple-500/20 via-purple-500/5 to-transparent',
    sparkline: '#a855f7',
    accentBorder: 'hover:border-purple-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-purple-500 to-transparent',
  },
  rose: {
    well: 'bg-rose-500/10 border-rose-500/25 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'from-rose-500/20 via-rose-500/5 to-transparent',
    sparkline: '#f43f5e',
    accentBorder: 'hover:border-rose-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-rose-500 to-transparent',
  },
  sky: {
    well: 'bg-sky-500/10 border-sky-500/25 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    glow: 'from-sky-500/20 via-sky-500/5 to-transparent',
    sparkline: '#0284c7',
    accentBorder: 'hover:border-sky-500/50',
    topLine: 'bg-gradient-to-r from-transparent via-sky-500 to-transparent',
  },
};

/* ────────────────────────── Reusable Panel Card ────────────────────────── */

export function Panel({
  title,
  icon: Icon,
  badge,
  action,
  children,
  bodyClass = 'p-5',
}: {
  title: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-slate-800/90 dark:bg-slate-900/80 dark:shadow-card dark:hover:border-slate-700/80">
      <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />}
          <h2 className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {badge}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

/* ────────────────────────── Sub-link Header Action ────────────────────────── */

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
    >
      <span>{children}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/* ────────────────────────── Empty State Block ────────────────────────── */

export function Empty({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      {hint && <p className="max-w-[24rem] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

/* ────────────────────────── Error / Retry Block ────────────────────────── */

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

/* ────────────────────────── KPI Metric Card ────────────────────────── */

export function KpiCard({
  label,
  value,
  loading,
  note,
  trend,
  trendPositive = true,
  href,
  icon: Icon,
  tone = 'indigo',
  sparkData,
}: {
  label: string;
  value: string;
  loading?: boolean;
  note: string;
  trend?: string;
  trendPositive?: boolean;
  href: string;
  icon: LucideIcon;
  tone?: Tone;
  sparkData?: number[];
}) {
  const style = TONE_STYLES[tone];

  return (
    <Link
      href={href}
      className={`group relative flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800/90 dark:bg-slate-900/85 dark:shadow-card ${style.accentBorder}`}
    >
      {/* Top subtle ambient highlight border */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 opacity-60 transition-opacity duration-300 group-hover:opacity-100 ${style.topLine}`}
      />

      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-75 ${style.glow}`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tabular-nums text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {loading ? <span className="text-slate-300 dark:text-slate-600">—</span> : value}
            </span>
          </div>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-110 ${style.well} ${style.text}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/70">
        <div className="flex min-w-0 items-center gap-1.5">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                trendPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
              }`}
            >
              {trendPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          )}
          <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{note}</span>
        </div>

        {sparkData && sparkData.length > 1 && (
          <div className="shrink-0">
            <Sparkline data={sparkData} color={style.sparkline} width={70} height={24} />
          </div>
        )}
      </div>
    </Link>
  );
}
