'use client';
// app/(dashboard)/tenants/page.tsx — Platform multi-tenant instance management & provisioning.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Globe, Shield } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import { FormField } from '@/components/molecules/FormField';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export default function TenantsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });

  const tenants = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => unwrap<Tenant[]>((await api.get('/tenants')).data),
  });

  const create = useMutation({
    mutationFn: async () => api.post('/tenants', form),
    onSuccess: () => {
      setForm({ name: '', slug: '' });
      setCreating(false);
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-brand-400">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-bold text-white">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      header: t('col.slug'),
      render: (r) => (
        <span className="font-mono text-xs text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
          {r.slug}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: t('col.status'),
      render: (r) => (
        <Badge tone={r.isActive ? 'green' : 'gray'} dot>
          {r.isActive ? t('s.active') : t('s.passive')}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.tenants"
      headerAction={
        <Button size="sm" onClick={() => setCreating((s) => !s)}>
          <Plus className="h-4 w-4" />
          <span>{creating ? t('common.cancel') : t('tenant.create')}</span>
        </Button>
      }
    >
      {creating && (
        <Card className="mb-6 p-6 animate-slide-down">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="t-name"
              label={t('field.name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormField
              id="t-slug"
              label={t('tenant.slugLabel')}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.name || !form.slug}
              loading={create.isPending}
            >
              {t('tenant.create')}
            </Button>
            {create.isError && (
              <span className="text-xs font-medium text-rose-400">
                {t('tenant.createError')}
              </span>
            )}
          </div>
        </Card>
      )}

      {tenants.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={tenants.data ?? []}
          empty={t('common.empty')}
        />
      )}
    </DashboardTemplate>
  );
}
