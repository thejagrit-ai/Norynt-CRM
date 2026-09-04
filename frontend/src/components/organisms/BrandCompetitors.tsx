'use client';
// src/components/organisms/BrandCompetitors.tsx — competitor tracking and AI suggestion importer.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, ExternalLink, Trash2, Globe, Building2 } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Spinner } from '../atoms/Spinner';
import type { Competitor } from '@/types';

export function BrandCompetitors({ brandId }: { brandId: string }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('brand.manage');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');

  const list = useQuery({
    queryKey: ['competitors', brandId],
    queryFn: async () =>
      unwrap<Competitor[]>(
        (await api.get(`/brands/${brandId}/competitors`)).data,
      ),
  });
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['competitors', brandId] });

  const add = useMutation({
    mutationFn: async () =>
      api.post(`/brands/${brandId}/competitors`, {
        name: name.trim(),
        domain: domain.trim() || undefined,
      }),
    onSuccess: () => {
      setName('');
      setDomain('');
      invalidate();
    },
  });
  const importAi = useMutation({
    mutationFn: async () =>
      unwrap<{ added: number }>(
        (await api.post(`/brands/${brandId}/competitors/import-suggested`))
          .data,
      ),
    onSuccess: (r) => {
      alert(`${r.added} ${t('comp.imported')}`);
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/competitors/${id}`),
    onSuccess: invalidate,
  });

  return (
    <Card className="p-6">
      {manage && (
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-800/80 pb-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('comp.name')}
            className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={t('comp.domain')}
            className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
          />
          <Button
            onClick={() => add.mutate()}
            disabled={add.isPending || !name.trim()}
            loading={add.isPending}
          >
            <Plus className="h-4 w-4" />
            <span>{t('comp.add')}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => importAi.mutate()}
            disabled={importAi.isPending}
            loading={importAi.isPending}
          >
            <Sparkles className="h-4 w-4 text-brand-400" />
            <span>{t('comp.import')}</span>
          </Button>
        </div>
      )}

      {list.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : (list.data ?? []).length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
          {t('comp.empty')}
        </div>
      ) : (
        <div className="space-y-2.5">
          {(list.data ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs transition hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{c.name}</span>
                    <Badge tone={c.source === 'manual' ? 'gray' : 'green'} dot>
                      {c.source === 'manual' ? t('comp.manual') : t('comp.ai')}
                    </Badge>
                  </div>
                  {c.domain && (
                    <a
                      href={
                        c.domain.startsWith('http') ? c.domain : `https://${c.domain}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-slate-400 hover:text-brand-400"
                    >
                      <Globe className="h-3 w-3" />
                      <span>{c.domain}</span>
                    </a>
                  )}
                </div>
              </div>

              {manage && (
                <button
                  type="button"
                  onClick={() => remove.mutate(c.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                  title={t('common.delete')}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
