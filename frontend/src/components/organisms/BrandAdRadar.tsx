'use client';
// src/components/organisms/BrandAdRadar.tsx — Meta Ad Library radar with dark-glass cards & saved inspirations.
import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Bookmark, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Spinner } from '../atoms/Spinner';
import { Label } from '../atoms/Label';

interface Ad {
  adArchiveId: string;
  pageName: string | null;
  body: string | null;
  snapshotUrl: string | null;
  startTime: string | null;
  platforms: string[];
}
interface SavedAd {
  id: string;
  pageName: string | null;
  body: string | null;
  snapshotUrl: string | null;
}

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

export function BrandAdRadar({ brandId }: { brandId: string }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('brand.manage');
  const [country, setCountry] = useState('TR');
  const [terms, setTerms] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [results, setResults] = useState<Ad[] | null>(null);
  const [usedTerms, setUsedTerms] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const saved = useQuery({
    queryKey: ['saved-ads', brandId],
    queryFn: async () =>
      unwrap<SavedAd[]>(
        (await api.get(`/brands/${brandId}/ad-radar/saved`)).data,
      ),
  });

  const search = useMutation({
    mutationFn: async () =>
      unwrap<{ ads: Ad[]; terms: string[] }>(
        (
          await api.post(`/brands/${brandId}/ad-radar/search`, {
            country: country.toUpperCase(),
            searchTerms: terms ? list(terms) : undefined,
            activeStatus: activeOnly ? 'ACTIVE' : 'ALL',
          })
        ).data,
      ),
    onSuccess: (r) => {
      setResults(r.ads);
      setUsedTerms(r.terms);
      setErr(null);
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? t('ar.connectHint');
      setErr(msg);
      setResults(null);
    },
  });

  const save = useMutation({
    mutationFn: async (ad: Ad) =>
      api.post(`/brands/${brandId}/ad-radar/save`, {
        adArchiveId: ad.adArchiveId,
        pageName: ad.pageName ?? undefined,
        body: ad.body ?? undefined,
        snapshotUrl: ad.snapshotUrl ?? undefined,
        startTime: ad.startTime ?? undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-ads', brandId] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/ad-radar/saved/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-ads', brandId] }),
  });

  return (
    <div className="space-y-6">
      {/* Search Radar Card */}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="ar-country">{t('ar.country')}</Label>
            <input
              id="ar-country"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              maxLength={2}
              className="w-16 rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-2 text-center text-sm font-bold text-slate-100 outline-none focus:border-brand-500"
            />
          </div>
          <div className="min-w-[16rem] flex-1">
            <Label htmlFor="ar-terms">{t('ar.terms')}</Label>
            <input
              id="ar-terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="streetwear, oversize tee..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500/20"
            />
            <span>{t('ar.active')}</span>
          </label>
          <Button
            onClick={() => search.mutate()}
            disabled={search.isPending}
            loading={search.isPending}
          >
            <Search className="h-4 w-4" />
            <span>{t('ar.search')}</span>
          </Button>
        </div>

        <p className="text-xs text-slate-500">{t('ar.scopeNote')}</p>
        {err && <p className="mt-3 text-xs font-medium text-amber-400">{err}</p>}
        {results && (
          <p className="mt-2 text-xs text-slate-400">
            {t('ar.usedTerms')}: <span className="text-slate-200 font-semibold">{usedTerms.join(', ')}</span>
          </p>
        )}
      </Card>

      {/* Ad Results */}
      {search.isPending ? (
        <div className="flex h-44 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : results && results.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-400">
          {t('ar.noResults')}
        </Card>
      ) : results ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {results.map((ad) => (
            <Card key={ad.adArchiveId} className="flex flex-col p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  {ad.pageName ?? '—'}
                </span>
                <div className="flex items-center gap-1">
                  {ad.platforms?.map((p) => (
                    <Badge key={p} tone="blue">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <p className="flex-1 whitespace-pre-wrap text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {ad.body ?? '—'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                {ad.startTime ? (
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Calendar className="h-3 w-3" />
                    <span>{ad.startTime}</span>
                  </span>
                ) : <span />}

                <div className="flex items-center gap-2">
                  {ad.snapshotUrl && (
                    <a
                      href={ad.snapshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 text-xs font-semibold"
                    >
                      <span>{t('ar.viewOnMeta')}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {manage && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => save.mutate(ad)}
                      className="py-1 px-2.5 text-xs"
                    >
                      <Bookmark className="h-3 w-3" />
                      <span>{t('ar.save')}</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Saved Ads Showcase */}
      {(saved.data ?? []).length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-brand-400" />
            <h4 className="text-sm font-bold text-white tracking-tight">
              {t('ar.savedTitle')}
            </h4>
          </div>
          <div className="space-y-2">
            {(saved.data ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-bold text-white shrink-0">
                    {s.pageName ?? '—'}
                  </span>
                  <span className="truncate text-slate-400">{s.body}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {s.snapshotUrl && (
                    <Link
                      href={s.snapshotUrl}
                      target="_blank"
                      className="text-brand-400 hover:text-brand-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}
                  {manage && (
                    <button
                      type="button"
                      onClick={() => del.mutate(s.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
