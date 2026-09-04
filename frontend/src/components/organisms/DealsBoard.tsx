'use client';
// src/components/organisms/DealsBoard.tsx — Kanban board with stage metrics, value sums, and 3D deal cards.
import React, { useState } from 'react';
import { Badge } from '../atoms/Badge';
import type { Board, Deal } from '@/types';
import { Building2, DollarSign } from 'lucide-react';

function stageTone(stage: { isWon: boolean; isLost: boolean }) {
  if (stage.isWon) return 'green' as const;
  if (stage.isLost) return 'red' as const;
  return 'indigo' as const;
}

export function DealsBoard({
  board,
  onSelect,
  onMove,
}: {
  board: Board;
  onSelect?: (deal: Deal) => void;
  onMove?: (dealId: string, toStageId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const drop = (stageId: string) => {
    if (dragId && onMove) onMove(dragId, stageId);
    setDragId(null);
    setOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
      {board.stages.map((stage) => {
        // Calculate total amount in stage
        const stageTotal = stage.deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
        const hasTotal = stageTotal > 0;
        const curr = stage.deals.find((d) => d.currency)?.currency || 'TRY';

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              if (onMove) {
                e.preventDefault();
                setOverStage(stage.id);
              }
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={() => drop(stage.id)}
            className={`w-80 shrink-0 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 shadow-card transition-all duration-200 ${
              overStage === stage.id
                ? 'border-brand-500/50 bg-brand-950/20 ring-2 ring-brand-500/30'
                : ''
            }`}
          >
            {/* Stage Column Header */}
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] ${
                    stage.isWon
                      ? 'bg-emerald-500 text-emerald-500'
                      : stage.isLost
                        ? 'bg-rose-500 text-rose-500'
                        : 'bg-brand-500 text-brand-500'
                  }`}
                />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {stage.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {hasTotal && (
                  <span className="tabular-nums text-xs font-semibold text-slate-400">
                    {stageTotal.toLocaleString()} {curr}
                  </span>
                )}
                <Badge tone={stageTone(stage)} dot>
                  {stage.deals.length}
                </Badge>
              </div>
            </div>

            {/* Stage Cards Container */}
            <div className="min-h-[140px] space-y-2.5">
              {stage.deals.map((deal) => (
                <div
                  key={deal.id}
                  draggable={!!onMove}
                  onDragStart={() => setDragId(deal.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onSelect?.(deal)}
                  className={`group cursor-pointer relative overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/95 p-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-card-hover ${
                    dragId === deal.id ? 'opacity-40 scale-95' : ''
                  }`}
                >
                  {/* Top line highlight */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <p className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                    {deal.title}
                  </p>

                  {deal.company && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{deal.company}</span>
                    </div>
                  )}

                  {deal.value && (
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-emerald-400">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="tabular-nums font-bold">
                          {Number(deal.value).toLocaleString()} {deal.currency}
                        </span>
                      </div>
                      {deal.contactName && (
                        <span className="truncate max-w-[100px] text-[11px] text-slate-500">
                          {deal.contactName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {stage.deals.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-900/20 text-center text-xs text-slate-500">
                  Stage is empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
