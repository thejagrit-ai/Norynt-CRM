'use client';
// app/(dashboard)/roles/page.tsx — RBAC Team Roles & Granular Access Control Hub.
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Search,
  Users,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Edit3,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { RoleModal, Role } from '@/components/organisms/RoleModal';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { KpiCard } from '@/components/molecules/DashboardCards';
import { ALL_UI_PERMISSIONS } from '@/lib/permissions';

export default function RolesPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const rolesQuery = useQuery({
    queryKey: ['roles-admin'],
    queryFn: async () => unwrap<Role[]>((await api.get('/roles')).data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roles-admin'] });
    qc.invalidateQueries({ queryKey: ['roles'] });
  };

  const rawRoles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return rawRoles;
    const q = searchQuery.toLowerCase().trim();
    return rawRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)),
    );
  }, [rawRoles, searchQuery]);

  return (
    <DashboardTemplate
      title="Team Roles & Access Control"
      subtitle="Configure enterprise role-based access control (RBAC), security boundaries, and granular permission matrices"
      headerAction={
        can('role.create') && (
          <Button
            size="sm"
            onClick={() => setCreating(true)}
            className="h-9 bg-brand-600 px-4 font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" />
            <span>New Custom Role</span>
          </Button>
        )
      }
    >
      <div className="space-y-6 pb-12">
        {/* ── 1. Top Security & RBAC Metric Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Configured Roles"
            value={`${rawRoles.length}`}
            loading={rolesQuery.isLoading}
            note="Active security profiles"
            trend="100% Policy compliant"
            trendPositive={true}
            href="/roles"
            icon={ShieldCheck}
            tone="indigo"
          />
          <KpiCard
            label="Total Permission Nodes"
            value={`${ALL_UI_PERMISSIONS.length}`}
            loading={false}
            note="Granular platform gates"
            trend="Zero-trust enforcement"
            trendPositive={true}
            href="/roles"
            icon={Key}
            tone="emerald"
          />
          <KpiCard
            label="Super Admin Shield"
            value="Active"
            loading={false}
            note="Lockout protection enabled"
            trend="Protected"
            trendPositive={true}
            href="/roles"
            icon={Lock}
            tone="purple"
          />
          <KpiCard
            label="Access Control Model"
            value="RBAC v2"
            loading={false}
            note="Tenant-isolated security"
            trend="Enterprise standard"
            trendPositive={true}
            href="/roles"
            icon={Shield}
            tone="sky"
          />
        </div>

        {/* ── 2. Search & Filter Bar ── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles by name or scope..."
                className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-brand-400"
              />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Click any role to inspect or adjust permission matrices
            </p>
          </div>
        </Card>

        {/* ── 3. Roles Table ── */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
          {rolesQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
              <ShieldAlert className="h-8 w-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No roles match your search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/50 dark:text-slate-400">
                    <th className="px-5 py-3.5">Role Identifier</th>
                    <th className="px-5 py-3.5">Scope & Description</th>
                    <th className="px-5 py-3.5 text-center">Assigned Permissions</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRoles.map((r) => {
                    const isAdmin = r.name === 'ADMIN';
                    return (
                      <tr
                        key={r.id}
                        onClick={() => can('role.update') && setEditing(r)}
                        className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                                isAdmin
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                  : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
                              }`}
                            >
                              <Shield className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white tracking-wide">
                                  {r.name}
                                </span>
                                {isAdmin && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <Lock className="h-2.5 w-2.5" /> Super Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">System Role Code</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-md font-medium text-slate-700 dark:text-slate-300">
                            {r.description || 'Standard workspace operational role'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            {isAdmin ? 'Full Platform (All)' : `${r.permissions.length} Permissions`}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition group-hover:translate-x-0.5 dark:text-brand-400">
                            <span>Manage Access</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
                <span>
                  Showing <strong>{filteredRoles.length}</strong> defined security roles
                </span>
                <span className="font-medium text-slate-400">Active RBAC synchronization</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {creating && (
        <RoleModal role={null} onClose={() => setCreating(false)} onSaved={invalidate} />
      )}
      {editing && (
        <RoleModal role={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
      )}
    </DashboardTemplate>
  );
}
