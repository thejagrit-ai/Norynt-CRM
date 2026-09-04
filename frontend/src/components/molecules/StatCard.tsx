// src/components/molecules/StatCard.tsx
import React from 'react';
import { Card } from '../atoms/Card';

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  tone = 'indigo',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}) {
  const toneGlows = {
    indigo: 'from-brand-500/10 to-transparent text-brand-400 border-brand-500/20',
    emerald: 'from-emerald-500/10 to-transparent text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-transparent text-amber-400 border-amber-500/20',
    rose: 'from-rose-500/10 to-transparent text-rose-400 border-rose-500/20',
    sky: 'from-sky-500/10 to-transparent text-sky-400 border-sky-500/20',
  };

  return (
    <Card hoverable className="group relative p-5">
      {/* Top right subtle background glow gradient */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80 ${toneGlows[tone]}`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="tabular-nums mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-slate-800/80 shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${toneGlows[tone]}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
              trend.positive !== false
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {trend.positive !== false ? '↑' : '↓'} {trend.value}
          </span>
        )}
        {hint && (
          <p className="truncate text-xs font-medium text-slate-400">
            {hint}
          </p>
        )}
      </div>
    </Card>
  );
}
