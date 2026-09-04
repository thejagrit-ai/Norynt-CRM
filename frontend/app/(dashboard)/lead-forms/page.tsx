'use client';
// app/(dashboard)/lead-forms/page.tsx — Lead intake forms & embedded landing widget manager.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FormInput, CheckCircle2, Copy } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { LeadFormModal } from '@/components/organisms/LeadFormModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import type { LeadForm } from '@/types';

export default function LeadFormsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LeadForm | null>(null);
  const manage = can('lead_form.manage');

  const forms = useQuery({
    queryKey: ['lead-forms'],
    queryFn: async () =>
      unwrap<LeadForm[]>((await api.get('/lead-forms')).data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['lead-forms'] });

  const columns: Column<LeadForm>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-brand-400">
            <FormInput className="h-4 w-4" />
          </div>
          <span className="font-bold text-white">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'submitCount',
      header: t('col.submissions'),
      render: (r) => (
        <span className="font-semibold text-slate-200 tabular-nums">
          {r.submitCount} submissions
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
      title="page.leadForms"
      headerAction={
        manage && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newForm')}</span>
          </Button>
        )
      }
    >
      {forms.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={forms.data ?? []}
          empty={t('common.empty')}
          onRowClick={manage ? setEditing : undefined}
        />
      )}

      {creating && (
        <LeadFormModal
          form={null}
          onClose={() => setCreating(false)}
          onSaved={invalidate}
        />
      )}
      {editing && (
        <LeadFormModal
          form={editing}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
    </DashboardTemplate>
  );
}
