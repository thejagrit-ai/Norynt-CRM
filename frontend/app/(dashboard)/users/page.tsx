'use client';
// app/(dashboard)/users/page.tsx — Team members directory with role badges, status toggle & user modal.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Mail, Shield } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CrudFormModal, CrudField } from '@/components/organisms/CrudFormModal';
import { UserEditModal } from '@/components/organisms/UserEditModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import type { User } from '@/types';

const CREATE_FIELDS: CrudField[] = [
  { key: 'email', label: 'field.email', type: 'email', required: true },
  {
    key: 'password',
    label: 'field.password',
    type: 'password',
    required: true,
    placeholder: 'min 10, strong',
  },
  { key: 'firstName', label: 'field.firstName', required: true },
  { key: 'lastName', label: 'field.lastName', required: true },
];

export default function UsersPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () =>
      unwrap<User[]>((await api.get('/users', { params: { limit: 50 } })).data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-700 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
            {r.firstName?.[0]?.toUpperCase()}
            {r.lastName?.[0]?.toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-white">
              {r.firstName} {r.lastName}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('col.email'),
      render: (r) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Mail className="h-3.5 w-3.5 text-slate-500" />
          <span>{r.email}</span>
        </span>
      ),
    },
    {
      key: 'roles',
      header: t('col.roles'),
      render: (r) => (
        <div className="flex flex-wrap gap-1.5">
          {r.roles.map((role) => (
            <Badge key={role} tone="indigo">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'active',
      header: t('col.status'),
      render: (r) =>
        r.isActive ? (
          <Badge tone="green" dot>{t('s.active')}</Badge>
        ) : (
          <Badge tone="red" dot>{t('s.passive')}</Badge>
        ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.users"
      headerAction={
        can('user.create') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newUser')}</span>
          </Button>
        )
      }
    >
      {users.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={users.data ?? []}
          empty={t('common.empty')}
          onRowClick={can('user.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <CrudFormModal
          title={t('m.newUser')}
          fields={CREATE_FIELDS}
          submitLabel={t('common.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await api.post('/users', v);
            invalidate();
          }}
        />
      )}

      {editing && (
        <UserEditModal
          user={editing}
          onClose={() => setEditing(null)}
          onChanged={invalidate}
        />
      )}
    </DashboardTemplate>
  );
}
