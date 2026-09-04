'use client';
// app/(dashboard)/pipeline/page.tsx — Kanban stage management: add / reorder / rename / delete stages.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Trash2, Plus, GitCommit, CheckCircle2, XCircle } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface Stage {
  id: string;
  name: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
}
interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

export default function PipelinePage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('pipeline.manage');
  const [newName, setNewName] = useState('');

  const pipelines = useQuery({
    queryKey: ['pipelines-admin'],
    queryFn: async () =>
      unwrap<Pipeline[]>((await api.get('/pipelines')).data),
  });
  const pipeline = pipelines.data?.[0];
  const pid = pipeline?.id;
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['pipelines-admin'] });

  const add = useMutation({
    mutationFn: async (name: string) =>
      api.post(`/pipelines/${pid}/stages`, { name }),
    onSuccess: () => {
      setNewName('');
      invalidate();
    },
  });
  const patch = useMutation({
    mutationFn: async (v: { id: string; data: Partial<Stage> }) =>
      api.patch(`/pipelines/${pid}/stages/${v.id}`, v.data),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: async (stageIds: string[]) =>
      api.patch(`/pipelines/${pid}/stages/reorder`, { stageIds }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/pipelines/${pid}/stages/${id}`),
    onSuccess: invalidate,
    onError: () => alert(t('stage.deleteBlocked')),
  });

  const stages = pipeline?.stages ?? [];
  const move = (idx: number, dir: -1 | 1) => {
    const order = stages.map((s) => s.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    reorder.mutate(order);
  };

  return (
    <DashboardTemplate title="page.pipeline">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">{t('stage.hint')}</p>

        {pipelines.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <Card className="p-6">
            <div className="space-y-2.5">
              {stages.map((s, i) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 shadow-sm transition hover:border-slate-700"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-slate-400 tabular-nums">
                    {i + 1}
                  </span>

                  <input
                    defaultValue={s.name}
                    disabled={!manage}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== s.name) patch.mutate({ id: s.id, data: { name: v } });
                    }}
                    className="min-w-[12rem] flex-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 disabled:opacity-60"
                  />

                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={s.isWon}
                        disabled={!manage}
                        onChange={(e) =>
                          patch.mutate({ id: s.id, data: { isWon: e.target.checked } })
                        }
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <Badge tone="green" dot>{t('stage.won')}</Badge>
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={s.isLost}
                        disabled={!manage}
                        onChange={(e) =>
                          patch.mutate({ id: s.id, data: { isLost: e.target.checked } })
                        }
                        className="rounded border-slate-700 text-rose-500 focus:ring-rose-500/20"
                      />
                      <Badge tone="red" dot>{t('stage.lost')}</Badge>
                    </label>
                  </div>

                  {manage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || reorder.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                        title={t('stage.up')}
                        aria-label={t('stage.up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === stages.length - 1 || reorder.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                        title={t('stage.down')}
                        aria-label={t('stage.down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t('stage.deleteConfirm'))) remove.mutate(s.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {manage && (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/80 pt-4">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('stage.namePh')}
                  className="w-72 rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <Button
                  onClick={() => add.mutate(newName.trim())}
                  disabled={!newName.trim() || add.isPending}
                  loading={add.isPending}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('stage.add')}</span>
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardTemplate>
  );
}
