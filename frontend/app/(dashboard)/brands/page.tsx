'use client';
// app/(dashboard)/brands/page.tsx — Brand Radar directory with AI niche classification & onboarding trigger.
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Radar, Layers } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { BrandWizardModal } from '@/components/organisms/BrandWizardModal';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import type { Brand } from '@/types';

export default function BrandsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const brands = useQuery({
    queryKey: ['brands'],
    queryFn: async () =>
      unwrap<Brand[]>((await api.get('/brands')).data),
  });

  const columns: Column<Brand>[] = [
    {
      key: 'name',
      header: t('brand.name'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-brand-400">
            <Radar className="h-4 w-4" />
          </div>
          <span className="font-bold text-white">{r.name}</span>
        </div>
      ),
    },
    { key: 'sector', header: t('col.sector'), render: (r) => r.sector ?? '—' },
    { key: 'niche', header: t('col.niche'), render: (r) => r.niche ?? '—' },
    {
      key: 'ai',
      header: '',
      render: (r) =>
        r.aiEnriched ? (
          <Badge tone="green" dot>
            AI Powered
          </Badge>
        ) : null,
    },
  ];

  return (
    <DashboardTemplate
      title="page.brands"
      headerAction={
        can('brand.manage') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('brand.new')}</span>
          </Button>
        )
      }
    >
      {brands.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={brands.data ?? []}
          empty={t('common.empty')}
          onRowClick={(r) => router.push(`/brands/${r.id}`)}
        />
      )}

      {creating && (
        <BrandWizardModal
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ['brands'] });
            router.push(`/brands/${id}`);
          }}
        />
      )}
    </DashboardTemplate>
  );
}
