'use client';
// app/(dashboard)/quotes/page.tsx — Quote & CPQ builder with multi-currency lines, actions & WhatsApp delivery.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Check, X, FileText, MessageSquare, Trash2, Layers } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { WhatsAppSendModal } from '@/components/organisms/WhatsAppSendModal';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import { FormField } from '@/components/molecules/FormField';
import { Label } from '@/components/atoms/Label';

interface Product {
  id: string;
  name: string;
  unitPrice: string;
}
interface Quote {
  id: string;
  number: string | null;
  customerName: string;
  status: string;
  total: string;
  currency: string;
}
interface LineItem {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'amber' | 'indigo';
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'gray',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  EXPIRED: 'amber',
  CONVERTED: 'indigo',
};

export default function QuotesPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [waQuote, setWaQuote] = useState<Quote | null>(null);
  const [creating, setCreating] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [taxRate, setTaxRate] = useState('20');
  const [lines, setLines] = useState<LineItem[]>([
    { productId: '', description: '', quantity: '1', unitPrice: '' },
  ]);

  const quotes = useQuery({
    queryKey: ['quotes'],
    queryFn: async () =>
      unwrap<Quote[]>((await api.get('/quotes', { params: { limit: 50 } })).data),
  });

  const products = useQuery({
    queryKey: ['products-for-quote'],
    enabled: can('quote.create'),
    queryFn: async () =>
      unwrap<Product[]>(
        (await api.get('/products', { params: { limit: 100, active: true } }))
          .data,
      ),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['quotes'] });

  const create = useMutation({
    mutationFn: async () =>
      api.post('/quotes', {
        customerName,
        taxRate,
        lineItems: lines.map((l) => ({
          productId: l.productId || undefined,
          description: l.description || undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice || undefined,
        })),
      }),
    onSuccess: () => {
      setCustomerName('');
      setLines([
        { productId: '', description: '', quantity: '1', unitPrice: '' },
      ]);
      setCreating(false);
      refresh();
    },
  });

  const action = useMutation({
    mutationFn: async (p: { id: string; verb: string }) =>
      api.post(`/quotes/${p.id}/${p.verb}`),
    onSuccess: refresh,
  });

  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/quotes/${id}`),
    onSuccess: refresh,
  });

  const setLine = (i: number, patch: Partial<LineItem>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const columns: Column<Quote>[] = [
    {
      key: 'number',
      header: t('col.number'),
      render: (r) => (
        <span className="font-mono text-xs font-bold text-white">
          {r.number ?? '—'}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: t('col.customer'),
      render: (r) => <span className="font-medium text-slate-200">{r.customerName}</span>,
    },
    {
      key: 'total',
      header: t('col.amount'),
      render: (r) => (
        <span className="font-bold text-white tabular-nums">
          {r.total} {r.currency}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('col.status'),
      render: (r) => (
        <Badge tone={STATUS_TONE[r.status] ?? 'gray'} dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('col.action'),
      render: (r) => (
        <div className="flex items-center gap-1.5">
          {r.status === 'DRAFT' && can('quote.send') && (
            <Button
              variant="secondary"
              size="sm"
              className="py-1 px-2.5 text-xs"
              onClick={() => action.mutate({ id: r.id, verb: 'send' })}
            >
              <Send className="h-3 w-3" />
              <span>{t('act.send')}</span>
            </Button>
          )}
          {r.status === 'SENT' && can('quote.send') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="py-1 px-2.5 text-xs text-emerald-400"
                onClick={() => action.mutate({ id: r.id, verb: 'accept' })}
              >
                <Check className="h-3 w-3" />
                <span>{t('act.accept')}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="py-1 px-2 text-xs text-rose-400"
                onClick={() => action.mutate({ id: r.id, verb: 'reject' })}
              >
                <X className="h-3 w-3" />
                <span>{t('act.reject')}</span>
              </Button>
            </>
          )}
          {(r.status === 'SENT' || r.status === 'ACCEPTED') &&
            can('quote.convert') && (
              <Button
                size="sm"
                className="py-1 px-2.5 text-xs"
                onClick={() => action.mutate({ id: r.id, verb: 'convert' })}
              >
                <FileText className="h-3 w-3" />
                <span>{t('act.invoice')}</span>
              </Button>
            )}
          {can('whatsapp.send') && r.status !== 'DRAFT' && (
            <Button
              variant="ghost"
              size="sm"
              className="py-1 px-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => setWaQuote(r)}
            >
              <MessageSquare className="h-3 w-3" />
              <span>{t('wa.sendVia')}</span>
            </Button>
          )}
          {r.status !== 'CONVERTED' && can('quote.delete') && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
              onClick={() => {
                if (confirm(t('q.confirmDelete'))) del.mutate(r.id);
              }}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.quotes"
      headerAction={
        can('quote.create') && (
          <Button
            size="sm"
            onClick={() => setCreating((s) => !s)}
          >
            <Plus className="h-4 w-4" />
            <span>{creating ? t('common.cancel') : t('q.create')}</span>
          </Button>
        )
      }
    >
      {creating && (
        <Card className="mb-6 p-6 animate-slide-down">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="q-cust"
              label={t('q.customerName')}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <FormField
              id="q-tax"
              label={t('q.taxRate')}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>

          <div className="space-y-2 mb-4">
            <Label>{t('q.items')}</Label>
            {lines.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-2 sm:grid-cols-12 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5"
              >
                <select
                  className="rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none sm:col-span-4"
                  value={l.productId}
                  onChange={(e) => {
                    const p = products.data?.find(
                      (x) => x.id === e.target.value,
                    );
                    setLine(i, {
                      productId: e.target.value,
                      description: p?.name ?? l.description,
                      unitPrice: p?.unitPrice ?? l.unitPrice,
                    });
                  }}
                >
                  <option value="" className="bg-slate-900">{t('q.product')}</option>
                  {products.data?.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900">
                      {p.name} ({p.unitPrice})
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none sm:col-span-4"
                  placeholder={t('q.description')}
                  value={l.description}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none sm:col-span-2"
                  placeholder={t('q.quantity')}
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none sm:col-span-2"
                  placeholder={t('q.unitPrice')}
                  value={l.unitPrice}
                  onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setLines([
                  ...lines,
                  {
                    productId: '',
                    description: '',
                    quantity: '1',
                    unitPrice: '',
                  },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('btn.addItem')}</span>
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !customerName}
              loading={create.isPending}
            >
              {t('q.create')}
            </Button>
            {create.isError && (
              <span className="text-xs font-medium text-rose-400">{t('common.error')}</span>
            )}
          </div>
        </Card>
      )}

      {quotes.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={quotes.data ?? []}
          empty={t('common.empty')}
        />
      )}

      {waQuote && (
        <WhatsAppSendModal
          initialBody={t('wa.quoteMsg')
            .replace('{name}', waQuote.customerName)
            .replace('{number}', waQuote.number ?? '—')
            .replace('{total}', waQuote.total)
            .replace('{currency}', waQuote.currency)}
          onClose={() => setWaQuote(null)}
        />
      )}
    </DashboardTemplate>
  );
}
