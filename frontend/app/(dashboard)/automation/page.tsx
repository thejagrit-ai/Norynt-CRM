'use client';
// app/(dashboard)/automation/page.tsx — No-code automation workflow rules & event triggers.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap, PlayCircle, Layers } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import {
  AutomationRuleModal,
  Rule,
} from '@/components/organisms/AutomationRuleModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

export default function AutomationPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const manage = can('automation.manage');

  const rules = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () =>
      unwrap<Rule[]>(
        (await api.get('/automation/rules', { params: { limit: 50 } })).data,
      ),
  });
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['automation-rules'] });

  const columns: Column<Rule>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-bold text-slate-900">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'trigger',
      header: t('col.trigger'),
      render: (r) => <Badge tone="blue">{r.trigger}</Badge>,
    },
    {
      key: 'actions',
      header: t('col.actions'),
      render: (r) => (
        <span className="text-xs text-slate-600 font-medium">
          {r.actions?.length ?? 0} {t('common.countSuffix')}
        </span>
      ),
    },
    {
      key: 'active',
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
      title="page.automation"
      headerAction={
        manage && (
          <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus className="h-4 w-4" />}>
            {t('btn.newRule')}
          </Button>
        )
      }
    >
      {rules.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rules.data ?? []}
          empty={t('common.empty')}
          onRowClick={manage ? setEditing : undefined}
        />
      )}

      {creating && (
        <AutomationRuleModal
          rule={null}
          onClose={() => setCreating(false)}
          onSaved={invalidate}
        />
      )}
      {editing && (
        <AutomationRuleModal
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
    </DashboardTemplate>
  );
}
