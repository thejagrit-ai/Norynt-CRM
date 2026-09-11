'use client';
// src/components/molecules/Charts.tsx — High-performance, responsive CRM chart primitives with rich tooltips, gradient bars, and theme adaptation.
import React, { useId, useState } from 'react';

export interface Series {
  name: string;
  color: string;
}

function Legend({ series }: { series: Series[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-medium">
      {series.map((s) => (
        <span
          key={s.name}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-900/60 px-3 py-1 text-slate-700 dark:text-slate-300 shadow-xs"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shadow-xs"
            style={{ backgroundColor: s.color }}
          />
          <span className="font-semibold text-xs">{s.name}</span>
        </span>
      ))}
    </div>
  );
}

// Modern grouped column bar chart with Y-axis scale, rich hover tooltips & responsive alignment.
export function BarChart({
  labels,
  series,
  values,
  height = 190,
  format = (n) => String(n),
}: {
  labels: string[];
  series: Series[];
  values: number[][]; // values[seriesIndex][labelIndex]
  height?: number;
  format?: (n: number) => string;
}) {
  const [hoveredLabelIdx, setHoveredLabelIdx] = useState<number | null>(null);

  const flat = values.flat();
  const maxVal = Math.max(1, ...flat);

  // Generate 3 clean Y-axis ticks
  const yTicks = [maxVal, Math.round(maxVal / 2), 0];

  return (
    <div className="w-full select-none">
      <Legend series={series} />

      {/* Chart Main Layout: Y-Axis Ticks + Column Area */}
      <div className="flex items-stretch gap-2.5">
        {/* Y-Axis Value Ticks */}
        <div
          className="flex flex-col justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums shrink-0 py-1 text-right min-w-[36px]"
          style={{ height }}
        >
          {yTicks.map((tick, idx) => (
            <span key={idx} className="leading-none truncate">
              {format(tick)}
            </span>
          ))}
        </div>

        {/* Chart Canvas Area */}
        <div className="relative flex-1 flex flex-col justify-end" style={{ height }}>
          {/* Background Horizontal Grid Guidelines */}
          <div className="absolute inset-x-0 top-1 bottom-1 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-dashed border-slate-200/80 dark:border-slate-800/80 w-full" />
            <div className="border-b border-dashed border-slate-200/80 dark:border-slate-800/80 w-full" />
            <div className="border-b border-slate-200 dark:border-slate-800 w-full" />
          </div>

          {/* Columns Flex Container */}
          <div className="relative z-10 flex h-full items-end justify-between gap-1 sm:gap-2 px-1">
            {labels.map((label, i) => {
              const isHovered = hoveredLabelIdx === i;

              return (
                <div
                  key={label}
                  className="relative flex-1 flex h-full flex-col justify-end items-center group cursor-pointer"
                  onMouseEnter={() => setHoveredLabelIdx(i)}
                  onMouseLeave={() => setHoveredLabelIdx(null)}
                >
                  {/* Floating Glassmorphic Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-30 min-w-[140px] rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-1.5 mb-2 text-center tracking-wide">
                        {label}
                      </p>
                      <div className="space-y-1.5">
                        {series.map((ser, j) => {
                          const val = values[j]?.[i] ?? 0;
                          return (
                            <div key={ser.name} className="flex items-center justify-between text-[11px] gap-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: ser.color }}
                                />
                                <span className="text-slate-600 dark:text-slate-400 font-semibold truncate">
                                  {ser.name}:
                                </span>
                              </div>
                              <span className="font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0">
                                {format(val)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Column Highlight Backdrop */}
                  <div
                    className={`absolute inset-x-0.5 bottom-0 top-0 rounded-xl transition-all duration-200 ${
                      isHovered
                        ? 'bg-slate-100/90 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700/80 shadow-xs'
                        : 'bg-transparent'
                    }`}
                  />

                  {/* Side-by-Side Series Bar Columns */}
                  <div className="relative z-10 flex items-end justify-center gap-1 sm:gap-1.5 w-full h-full pb-1 px-1">
                    {series.map((ser, j) => {
                      const val = values[j]?.[i] ?? 0;
                      const heightPct = val > 0 ? Math.max(8, Math.round((val / maxVal) * 100)) : 4;

                      return (
                        <div
                          key={ser.name}
                          className="relative flex-1 max-w-[28px] rounded-t-lg transition-all duration-300 ease-out group-hover:brightness-110 shadow-xs"
                          style={{
                            height: `${heightPct}%`,
                            background: `linear-gradient(180deg, ${ser.color} 0%, ${ser.color}d0 100%)`,
                            boxShadow: isHovered ? `0 0 10px ${ser.color}40` : undefined,
                          }}
                        >
                          {/* Top Highlight Sheen Cap */}
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/40 rounded-t-lg" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-Axis Month Labels */}
      <div className="mt-2.5 flex items-center pl-[44px]">
        {labels.map((l, i) => (
          <span
            key={l}
            className={`flex-1 text-center text-xs font-bold truncate transition-colors ${
              hoveredLabelIdx === i
                ? 'text-brand-600 dark:text-brand-400 font-extrabold scale-105'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// Donut chart — bright segments with center total.
export function DonutChart({
  data,
  format = (n) => String(n),
}: {
  data: { label: string; value: number; color: string }[];
  format?: (n: number) => string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  let offset = 0;
  const R = 15.915; // circumference = 100

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 select-none">
      <div className="relative shrink-0">
        <svg viewBox="0 0 36 36" style={{ width: 135, height: 135 }} role="img" className="rotate-[-90deg]">
          <circle
            cx="18"
            cy="18"
            r={R}
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800/60"
            strokeWidth="4"
          />
          {data.map((d) => {
            const frac = (d.value / total) * 100;
            const seg = (
              <circle
                key={d.label}
                cx="18"
                cy="18"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth="4"
                strokeDasharray={`${frac} ${100 - frac}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:brightness-110 cursor-pointer"
              >
                <title>{`${d.label}: ${format(d.value)} (${((d.value / total) * 100).toFixed(1)}%)`}</title>
              </circle>
            );
            offset += frac;
            return seg;
          })}
        </svg>
        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total</span>
          <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">{total}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 text-xs w-full">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/50 px-3 py-2 transition hover:border-brand-500/30"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shadow-xs"
                style={{ backgroundColor: d.color }}
              />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{d.label}</span>
            </div>
            <div className="flex items-center gap-1.5 tabular-nums">
              <span className="font-extrabold text-slate-900 dark:text-white">{format(d.value)}</span>
              <span className="text-slate-400 text-[10px] font-medium">
                ({((d.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bar list (ranked: salesperson/product) — gradient meter bars.
export function HBarList({
  data,
  color = '#6366f1',
  format = (n) => String(n),
  empty,
}: {
  data: { label: string; value: number; sub?: string }[];
  color?: string;
  format?: (n: number) => string;
  empty?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
        {empty ?? '—'}
      </div>
    );
  }

  return (
    <div className="space-y-3.5 select-none">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(4, (d.value / max) * 100));
        return (
          <div key={d.label} className="group flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[65%]">
                <span className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {i + 1}
                </span>
                <span className="truncate" title={d.label}>
                  {d.label}
                </span>
              </span>
              <span className="tabular-nums font-black text-slate-900 dark:text-slate-100">
                {format(d.value)}
                {d.sub ? <span className="ml-1 text-[11px] font-normal text-slate-400">· {d.sub}</span> : ''}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/50 dark:border-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                  boxShadow: `0 0 8px ${color}40`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mini Sparkline component for KPI cards and inline metric charts
export function Sparkline({
  data,
  color = '#6366f1',
  width = 90,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const chartId = useId().replace(/:/g, '');
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = height - pad - ((d - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const firstPt = points[0].split(',');
  const lastPt = points[points.length - 1].split(',');
  const areaD = `${pathD} L ${lastPt[0]},${height} L ${firstPt[0]},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible select-none">
      <defs>
        <linearGradient id={`spark-grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${chartId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r="2.5" fill={color} className="animate-pulse" />
    </svg>
  );
}

// Visual Pipeline Stage Funnel
export function PipelineFunnel({
  stages,
  format = (n) => String(n),
}: {
  stages: { name: string; count: number; value: number; color?: string }[];
  format?: (n: number) => string;
}) {
  const maxVal = Math.max(1, ...stages.map((s) => s.value));
  const totalDeals = stages.reduce((acc, s) => acc + s.count, 0) || 1;

  const defaultColors = ['#6366f1', '#38bdf8', '#a855f7', '#f59e0b', '#10b981', '#f43f5e'];

  return (
    <div className="space-y-3.5 select-none">
      {stages.map((s, idx) => {
        const stageColor = s.color || defaultColors[idx % defaultColors.length];
        const widthPct = Math.min(100, Math.max(12, (s.value / maxVal) * 100));
        const dealPct = ((s.count / totalDeals) * 100).toFixed(0);

        return (
          <div key={s.name} className="group flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: stageColor }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                  {s.name}
                </span>
                <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  {s.count} deals ({dealPct}%)
                </span>
              </div>
              <span className="tabular-nums font-black text-slate-900 dark:text-emerald-400 shrink-0">{format(s.value)}</span>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200/60 dark:border-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${stageColor}cc 0%, ${stageColor} 100%)`,
                  boxShadow: `0 0 10px ${stageColor}40`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


