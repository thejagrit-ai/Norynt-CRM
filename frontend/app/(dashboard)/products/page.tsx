'use client';
// app/(dashboard)/products/page.tsx — Product catalogue directory with pricing, tax rate & inventory items.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Tag, Layers } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CrudFormModal, CrudField } from '@/components/organisms/CrudFormModal';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

interface Product {
  id: string;
  sku: string | null;
  name: string;
  description?: string | null;
  unitPrice: string;
  currency: string;
  taxRate: string;
  active: boolean;
}

const FIELDS: CrudField[] = [
  { key: 'name', label: 'field.name', required: true },
  { key: 'sku', label: 'field.sku' },
  { key: 'unitPrice', label: 'field.unitPrice', type: 'number', required: true, placeholder: '1000.00' },
  { key: 'currency', label: 'field.currency', placeholder: 'TRY' },
  { key: 'taxRate', label: 'field.taxRate', type: 'number', placeholder: '20' },
  { key: 'description', label: 'field.description', type: 'textarea' },
];

export default function ProductsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const products = useQuery({
    queryKey: ['products'],
    queryFn: async () =>
      unwrap<Product[]>(
        (await api.get('/products', { params: { limit: 50 } })).data,
      ),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] });

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: t('col.product'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white">{r.name}</div>
            {r.description && (
              <div className="text-[11px] text-slate-400 line-clamp-1">{r.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      header: t('col.sku'),
      render: (r) =>
        r.sku ? (
          <span className="font-mono text-xs text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
            {r.sku}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'unitPrice',
      header: t('col.unitPrice'),
      render: (r) => (
        <span className="font-bold text-white tabular-nums">
          {r.unitPrice} {r.currency}
        </span>
      ),
    },
    {
      key: 'taxRate',
      header: t('col.taxRate'),
      render: (r) => (
        <span className="text-slate-300 tabular-nums">%{r.taxRate}</span>
      ),
    },
    {
      key: 'active',
      header: t('col.status'),
      render: (r) => (
        <Badge tone={r.active ? 'green' : 'gray'} dot>
          {r.active ? t('s.active') : t('s.passive')}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.products"
      headerAction={
        can('product.create') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newProduct')}</span>
          </Button>
        )
      }
    >
      {products.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={products.data ?? []}
          empty={t('common.empty')}
          onRowClick={can('product.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <CrudFormModal
          title={t('m.newProduct')}
          fields={FIELDS}
          submitLabel={t('common.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await api.post('/products', v);
            invalidate();
          }}
        />
      )}

      {editing && (
        <CrudFormModal
          title={t('m.editProduct')}
          fields={FIELDS}
          initial={{
            name: editing.name,
            sku: editing.sku ?? '',
            unitPrice: editing.unitPrice,
            currency: editing.currency,
            taxRate: editing.taxRate,
            description: editing.description ?? '',
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api.patch(`/products/${editing.id}`, v);
            invalidate();
          }}
          onDelete={
            can('product.delete')
              ? async () => {
                  await api.delete(`/products/${editing.id}`);
                  invalidate();
                }
              : undefined
          }
        />
      )}
    </DashboardTemplate>
  );
}
