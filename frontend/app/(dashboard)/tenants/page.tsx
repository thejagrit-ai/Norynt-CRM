'use client';
// app/(dashboard)/tenants/page.tsx — SuperAdmin multi-tenant governance, provisioning & status management.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Building2,
  Globe,
  ShieldCheck,
  Power,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
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
  const [assigningTenantId, setAssigningTenantId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
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

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/tenants/${id}/status`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const assignUser = useMutation({
    mutationFn: async ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      api.post(`/tenants/${tenantId}/assign-user`, { userId }),
    onSuccess: () => {
      setAssigningTenantId(null);
      setAssignUserId('');
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const dataList = tenants.data ?? [];
  const totalCount = dataList.length;
  const activeCount = dataList.filter((t) => t.isActive).length;
  const suspendedCount = totalCount - activeCount;

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-brand-400 shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide">{r.name}</div>
            <div className="text-[11px] text-slate-300 font-mono">ID: {r.id.slice(0, 8)}...</div>
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: t('col.slug'),
      render: (r) => (
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-slate-300" />
          <span className="font-mono text-xs text-brand-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {r.slug}
          </span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: t('col.status'),
      render: (r) => (
        <Badge tone={r.isActive ? 'green' : 'red'} dot>
          {r.isActive ? t('s.active') : 'Suspended'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Provisioned',
      render: (r) => (
        <span className="text-xs text-slate-300">
          {new Date(r.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Governance Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={r.isActive ? 'secondary' : 'primary'}
            onClick={() => toggleStatus.mutate({ id: r.id, isActive: !r.isActive })}
            disabled={toggleStatus.isPending}
          >
            <Power className="h-3 w-3 mr-1" />
            <span>{r.isActive ? 'Freeze' : 'Activate'}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAssigningTenantId(assigningTenantId === r.id ? null : r.id)}
          >
            <UserPlus className="h-3 w-3 mr-1 text-slate-300" />
            <span>Assign User</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="Platform Multi-Tenancy & SaaS Governance"
      headerAction={
        <Button size="sm" onClick={() => setCreating((s) => !s)}>
          <Plus className="h-4 w-4" />
          <span>{creating ? t('common.cancel') : t('tenant.create')}</span>
        </Button>
      }
    >
      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4 flex items-center gap-4 bg-slate-900/60 border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-300">Total Provisioned</div>
            <div className="text-xl font-extrabold text-white">{totalCount} Tenants</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-emerald-950/20 border-emerald-900/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-400/80">Active Instances</div>
            <div className="text-xl font-extrabold text-emerald-300">{activeCount} Online</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-rose-950/20 border-rose-900/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-rose-400/80">Suspended Tenants</div>
            <div className="text-xl font-extrabold text-rose-300">{suspendedCount} Frozen</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-purple-950/20 border-purple-900/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-purple-400/80">Isolation Mode</div>
            <div className="text-xl font-extrabold text-purple-300">Enforced (RLS)</div>
          </div>
        </Card>
      </div>

      {/* Tenant User Assignment Panel */}
      {assigningTenantId && (
        <Card className="mb-6 p-5 border-brand-500/30 bg-slate-900/90 animate-slide-down">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-400" />
            Assign User to Tenant ({assigningTenantId})
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FormField
                id="assign-user-id"
                label="User ID (UUID)"
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
              />
            </div>
            <div className="pt-6 flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  assignUser.mutate({ tenantId: assigningTenantId, userId: assignUserId })
                }
                disabled={assignUser.isPending || !assignUserId}
                loading={assignUser.isPending}
              >
                Confirm Assignment
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAssigningTenantId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Provisioning Modal/Card */}
      {creating && (
        <Card className="mb-6 p-6 border-slate-800 bg-slate-900/90 animate-slide-down">
          <h3 className="text-base font-bold text-white mb-4">Provision New Tenant</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="t-name"
              label={t('field.name')}
              placeholder="e.g. Acme Enterprise Corp"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormField
              id="t-slug"
              label={t('tenant.slugLabel')}
              placeholder="e.g. acme-corp"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div className="mt-5 flex items-center gap-3">
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

      {/* Tenants Data Table */}
      {tenants.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={dataList}
          empty={t('common.empty')}
        />
      )}
    </DashboardTemplate>
  );
}
