'use client';
// app/(dashboard)/integrations/page.tsx — Outbound webhook event subscriptions & real-time delivery logs.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Webhook as WebhookIcon, Send, RefreshCw, Trash2, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Label } from '@/components/atoms/Label';

const EVENTS = ['deal.created', 'deal.moved', 'invoice.issued', 'invoice.paid'];

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  secret?: string;
}
interface Delivery {
  id: string;
  event: string;
  status: string;
  attempts: number;
  createdAt: string;
}

export default function IntegrationsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('integration.manage');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const hooks = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () =>
      unwrap<Webhook[]>((await api.get('/integrations/webhooks')).data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['webhooks'] });

  const create = useMutation({
    mutationFn: async () =>
      unwrap<Webhook>(
        (await api.post('/integrations/webhooks', { url, events })).data,
      ),
    onSuccess: (data) => {
      setNewSecret(data.secret ?? null);
      setUrl('');
      setEvents([]);
      invalidate();
    },
  });
  const test = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/integrations/webhooks/${id}/test`),
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/integrations/webhooks/${id}`),
    onSuccess: invalidate,
  });

  const deliveries = useQuery({
    queryKey: ['webhook-deliveries', openId],
    enabled: !!openId,
    queryFn: async () =>
      unwrap<Delivery[]>(
        (await api.get(`/integrations/webhooks/${openId}/deliveries`)).data,
      ),
  });

  const toggleEvent = (e: string) =>
    setEvents((s) => (s.includes(e) ? s.filter((x) => x !== e) : [...s, e]));

  return (
    <DashboardTemplate title="page.integrations">
      <div className="space-y-6">
        {/* Info Banner */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1.5">
            <WebhookIcon className="h-4 w-4 text-brand-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t('wh.howTitle')}
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{t('wh.howBody')}</p>
          <p className="mt-2 text-xs text-slate-400">{t('wh.inboundNote')}</p>
        </Card>

        {/* Create Webhook */}
        {manage && (
          <Card className="p-6 space-y-4">
            <div>
              <Label htmlFor="wh-url">{t('wh.url')}</Label>
              <input
                id="wh-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhooks/crm"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <Label>{t('wh.events')}</Label>
              <div className="flex flex-wrap gap-2.5 mt-1">
                {EVENTS.map((e) => {
                  const selected = events.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleEvent(e)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono transition ${
                        selected
                          ? 'border-brand-500/50 bg-brand-500/15 text-brand-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-brand-400' : 'bg-slate-600'}`} />
                      <span>{e}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => create.mutate()}
                disabled={
                  create.isPending || !url.trim() || events.length === 0
                }
                loading={create.isPending}
              >
                <Plus className="h-4 w-4" />
                <span>{t('common.create')}</span>
              </Button>
              {create.isError && (
                <span className="text-xs font-medium text-rose-400">{t('common.error')}</span>
              )}
            </div>

            {newSecret && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                <p className="font-semibold text-emerald-300">
                  {t('wh.secretOnce')}
                </p>
                <code className="break-all font-mono text-[11px] text-emerald-200 block bg-slate-950/60 p-2 rounded border border-emerald-500/20">
                  {newSecret}
                </code>
              </div>
            )}
          </Card>
        )}

        {/* Webhook List */}
        {hooks.isLoading ? (
          <div className="flex h-44 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (hooks.data ?? []).length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            {t('common.empty')}
          </Card>
        ) : (
          <div className="space-y-3">
            {(hooks.data ?? []).map((h) => (
              <Card key={h.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <code className="font-mono text-xs text-white break-all flex-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    {h.url}
                  </code>
                  <Badge tone={h.isActive ? 'green' : 'gray'} dot>
                    {h.isActive ? t('s.active') : t('s.passive')}
                  </Badge>

                  {manage && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="py-1 px-2.5 text-xs"
                        onClick={() => test.mutate(h.id)}
                        disabled={test.isPending}
                      >
                        <Send className="h-3 w-3" />
                        <span>{t('wh.test')}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="py-1 px-2.5 text-xs text-slate-300 hover:text-white"
                        onClick={() => setOpenId(openId === h.id ? null : h.id)}
                      >
                        <span>{t('wh.deliveries')}</span>
                      </Button>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                        onClick={() => {
                          if (confirm(t('wh.deleteConfirm'))) remove.mutate(h.id);
                        }}
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {h.events.map((e) => (
                    <Badge key={e} tone="blue">
                      {e}
                    </Badge>
                  ))}
                </div>

                {openId === h.id && (
                  <div className="mt-3 border-t border-slate-800/80 pt-3">
                    {deliveries.isLoading ? (
                      <Spinner size="sm" />
                    ) : (deliveries.data ?? []).length === 0 ? (
                      <p className="text-xs text-slate-500">
                        {t('wh.noDeliveries')}
                      </p>
                    ) : (
                      <ul className="space-y-1.5 text-xs">
                        {(deliveries.data ?? []).map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/40 px-3 py-2 text-slate-300"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                tone={
                                  d.status === 'SUCCESS'
                                    ? 'green'
                                    : d.status === 'FAILED'
                                      ? 'red'
                                      : 'amber'
                                }
                                dot
                              >
                                {d.status}
                              </Badge>
                              <code className="font-mono text-[11px] text-slate-200">{d.event}</code>
                            </div>
                            <span className="text-slate-500 text-[11px] tabular-nums">
                              {d.attempts} attempts · {new Date(d.createdAt).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
}
