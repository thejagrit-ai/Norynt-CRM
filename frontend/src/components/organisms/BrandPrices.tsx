'use client';
// src/components/organisms/BrandPrices.tsx — competitor product pricing radar, CSV importer & trend history.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, ExternalLink, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Textarea } from '../atoms/Textarea';
import { Spinner } from '../atoms/Spinner';

interface Product {
  id: string;
  name: string;
  url: string | null;
  price: string;
  currency: string;
  prices: { price: string; capturedAt: string }[];
}

export function BrandPrices({ brandId }: { brandId: string }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('brand.manage');
  const [csv, setCsv] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ['products', brandId],
    queryFn: async () =>
      unwrap<Product[]>((await api.get(`/brands/${brandId}/products`)).data),
  });

  const imp = useMutation({
    mutationFn: async () =>
      unwrap<{ created: number; updated: number }>(
        (await api.post(`/brands/${brandId}/products/import-csv`, { csv }))
          .data,
      ),
    onSuccess: (r) => {
      setMsg(`${r.created + r.updated} ${t('price.imported')}`);
      setCsv('');
      qc.invalidateQueries({ queryKey: ['products', brandId] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', brandId] }),
  });

  const renderTrend = (p: Product) => {
    if (p.prices.length < 2) return null;
    const latest = Number(p.prices[0].price);
    const prev = Number(p.prices[1].price);
    if (latest < prev) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-emerald-400 font-semibold" title="Price Dropped">
          <TrendingDown className="h-3.5 w-3.5" />
        </span>
      );
    }
    if (latest > prev) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-rose-400 font-semibold" title="Price Increased">
          <TrendingUp className="h-3.5 w-3.5" />
        </span>
      );
    }
    return <Minus className="h-3.5 w-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {manage && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <UploadCloud className="h-4 w-4 text-brand-400" />
            <h4 className="text-sm font-bold text-white tracking-tight">
              {t('price.importTitle')}
            </h4>
          </div>
          <p className="mb-3 text-xs text-slate-400">{t('price.note')}</p>
          <Textarea
            rows={4}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`${t('price.csvHint')}\nOversized T-Shirt,299.90,TRY,https://competitor.com/x`}
            className="font-mono text-xs mb-3"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => imp.mutate()}
              disabled={imp.isPending || csv.trim().length < 3}
              loading={imp.isPending}
            >
              {t('price.import')}
            </Button>
            {msg && <span className="text-xs font-semibold text-emerald-400">{msg}</span>}
            {imp.isError && (
              <span className="text-xs font-medium text-rose-400">{t('common.error')}</span>
            )}
          </div>
        </Card>
      )}

      {products.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : (products.data ?? []).length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
          {t('price.empty')}
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-800/80 bg-slate-900/90 shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800/80 bg-slate-950/70 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">{t('col.product')}</th>
                <th className="px-5 py-3.5">{t('col.price')}</th>
                <th className="px-5 py-3.5">{t('price.history')}</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(products.data ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5 text-slate-200">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200 hover:underline"
                      >
                        <span>{p.name}</span>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </a>
                    ) : (
                      <span className="font-semibold text-white">{p.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-200">
                    <div className="flex items-center gap-2 tabular-nums font-bold">
                      <span>{p.price} {p.currency}</span>
                      {renderTrend(p)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 tabular-nums">
                    {p.prices.length} records
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {manage && (
                      <button
                        type="button"
                        onClick={() => del.mutate(p.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5 ml-auto" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
