'use client';
// src/components/molecules/Charts.tsx — modern SVG chart primitives with gradient fills & animations.
import React, { useId, useState } from 'react';

export interface Series {
  name: string;
  color: string;
}

function Legend({ series }: { series: Series[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
      {series.map((s) => (
        <span
          key={s.name}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 backdrop-blur-sm shadow-sm"
        >
          <span
            className="inline-block h-2 w-2 rounded-full shadow-[0_0_6px_currentColor]"
            style={{ backgroundColor: s.color, color: s.color }}
          />
          <span className="text-slate-200">{s.name}</span>
        </span>
      ))}
    </div>
  );
}

// Grouped vertical bar chart (multi-series, gradient fill).
export function BarChart({
  labels,
  series,
  values,
  height = 180,
  format = (n) => String(n),
}: {
  labels: string[];
  series: Series[];
  values: number[][]; // values[seriesIndex][labelIndex]
  height?: number;
  format?: (n: number) => string;
}) {
  const chartId = useId().replace(/:/g, '');
  const [hoveredIdx, setHoveredIdx] = useState<{ label: number; series: number } | null>(null);

  const flat = values.flat();
  const max = Math.max(1, ...flat);
  const g = labels.length || 1;
  const s = series.length || 1;
  const groupW = 100 / g;
  const pad = groupW * 0.18;
  const barArea = groupW * 0.64;
  const barW = barArea / s;

  return (
    <div className="w-full">
      <Legend series={series} />
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height }}
          role="img"
          className="overflow-visible"
        >
          <defs>
            {series.map((ser, j) => (
              <linearGradient
                key={ser.name}
                id={`bar-grad-${chartId}-${j}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={ser.color} stopOpacity="1" />
                <stop offset="100%" stopColor={ser.color} stopOpacity="0.4" />
              </linearGradient>
            ))}
          </defs>

          {/* Background grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1 2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1 2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="1 2" />
          <line x1="0" y1="99" x2="100" y2="99" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

          {labels.map((_, i) =>
            series.map((ser, j) => {
              const v = values[j]?.[i] ?? 0;
              const h = (v / max) * 90;
              const x = i * groupW + pad + j * barW;
              const isHovered = hoveredIdx?.label === i && hoveredIdx?.series === j;

              return (
                <rect
                  key={`${i}-${j}`}
                  x={x}
                  y={100 - h}
                  width={barW * 0.88}
                  height={Math.max(1, h)}
                  fill={`url(#bar-grad-${chartId}-${j})`}
                  rx="1"
                  className="transition-all duration-300 hover:brightness-125 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 4px ${ser.color})` : undefined,
                  }}
                  onMouseEnter={() => setHoveredIdx({ label: i, series: j })}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <title>{`${ser.name} (${labels[i]}): ${format(v)}`}</title>
                </rect>
              );
            }),
          )}
        </svg>
      </div>
      <div className="mt-2 flex text-[11px] font-medium text-slate-400">
        {labels.map((l) => (
          <span key={l} className="flex-1 truncate text-center">
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
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg viewBox="0 0 36 36" style={{ width: 130, height: 130 }} role="img" className="rotate-[-90deg]">
          <circle
            cx="18"
            cy="18"
            r={R}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="3.8"
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
                strokeWidth="3.8"
                strokeDasharray={`${frac} ${100 - frac}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:brightness-125 cursor-pointer"
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
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total</span>
          <span className="text-base font-bold text-white tabular-nums">{total}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 text-xs">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}80` }}
              />
              <span className="font-medium text-slate-200">{d.label}</span>
            </div>
            <div className="flex items-center gap-1.5 tabular-nums">
              <span className="font-semibold text-white">{format(d.value)}</span>
              <span className="text-slate-400 text-[10px]">
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
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
        {empty ?? '—'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = Math.min(100, Math.max(3, (d.value / max) * 100));
        return (
          <div key={d.label} className="group flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-300 group-hover:text-white transition-colors truncate max-w-[65%]">
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                  {i + 1}
                </span>
                <span className="truncate" title={d.label}>
                  {d.label}
                </span>
              </span>
              <span className="tabular-nums font-semibold text-slate-200">
                {format(d.value)}
                {d.sub ? <span className="ml-1 text-[11px] font-normal text-slate-400">· {d.sub}</span> : ''}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:brightness-125"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}99 0%, ${color} 100%)`,
                  boxShadow: `0 0 8px ${color}60`,
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
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-grad-${chartId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
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
    <div className="space-y-3">
      {stages.map((s, idx) => {
        const stageColor = s.color || defaultColors[idx % defaultColors.length];
        const widthPct = Math.min(100, Math.max(12, (s.value / maxVal) * 100));
        const dealPct = ((s.count / totalDeals) * 100).toFixed(0);

        return (
          <div key={s.name} className="group flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: stageColor, boxShadow: `0 0 6px ${stageColor}` }}
                />
                <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{s.name}</span>
                <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                  {s.count} deals ({dealPct}%)
                </span>
              </div>
              <span className="tabular-nums font-bold text-emerald-400">{format(s.value)}</span>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 group-hover:brightness-125"
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${stageColor}99 0%, ${stageColor} 100%)`,
                  boxShadow: `0 0 8px ${stageColor}50`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

