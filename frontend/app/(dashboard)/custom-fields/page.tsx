'use client';
// app/(dashboard)/custom-fields/page.tsx — Schema extension builder with low-code custom attributes.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sliders, Hash, Type, Calendar, CheckSquare } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CustomFieldModal, FieldDef } from '@/components/organisms/CustomFieldModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

export default function CustomFieldsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FieldDef | null>(null);
  const manage = can('custom_field.manage');

  const defs = useQuery({
    queryKey: ['custom-fields'],
    queryFn: async () =>
      unwrap<FieldDef[]>((await api.get('/custom-fields')).data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['custom-fields'] });

  const columns: Column<FieldDef>[] = [
    {
      key: 'entity',
      header: t('col.entity'),
      render: (r) => <Badge tone="indigo">{r.entity}</Badge>,
    },
    {
      key: 'key',
      header: t('col.key'),
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-white bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
          {r.key}
        </span>
      ),
    },
    {
      key: 'label',
      header: t('col.label'),
      render: (r) => <span className="font-medium text-slate-200">{r.label}</span>,
    },
    {
      key: 'type',
      header: t('col.type'),
      render: (r) => <Badge tone="sky">{r.type}</Badge>,
    },
    {
      key: 'required',
      header: t('col.required'),
      render: (r) =>
        r.required ? (
          <Badge tone="amber" dot>
            {t('s.yes')}
          </Badge>
        ) : (
          <span className="text-slate-500">—</span>
        ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.customFields"
      headerAction={
        manage && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newField')}</span>
          </Button>
        )
      }
    >
      {defs.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={defs.data ?? []}
          empty={t('common.empty')}
          onRowClick={manage ? setEditing : undefined}
        />
      )}

      {creating && (
        <CustomFieldModal def={null} onClose={() => setCreating(false)} onSaved={invalidate} />
      )}
      {editing && (
        <CustomFieldModal def={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
      )}
    </DashboardTemplate>
  );
}
