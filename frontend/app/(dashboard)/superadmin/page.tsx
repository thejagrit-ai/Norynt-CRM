'use client';
// app/(dashboard)/superadmin/page.tsx — Governance & Multi-Tenant SaaS Control Center Dashboard.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Key,
  Lock,
  RefreshCw,
  TrendingUp,
  Server,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entityName: string;
  createdAt: string;
}

export default function SuperAdminDashboardPage() {
  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => unwrap<any[]>((await api.get('/tenants')).data),
  });

  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => unwrap<AuditLog[]>((await api.get('/audit-logs')).data),
  });

  const forecastQuery = useQuery({
    queryKey: ['reports-forecast'],
    queryFn: async () => unwrap<any>((await api.get('/reports/forecast')).data),
  });

  const tenants = tenantsQuery.data ?? [];
  const logs = auditLogsQuery.data ?? [];
  const forecast = forecastQuery.data ?? { pipelineValue: 0, weightedForecast: 0 };

  const activeTenantsCount = tenants.filter((t: any) => t.isActive).length;

  return (
    <DashboardTemplate
      title="SuperAdmin SaaS Governance Control Center"
      headerAction={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              tenantsQuery.refetch();
              auditLogsQuery.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            <span>Sync Live Telemetry</span>
          </Button>
        </div>
      }
    >
      {/* SuperAdmin Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Lock className="h-3.5 w-3.5" />
            Cross-Tenant Master Administration
          </div>
          <h2 className="text-xl font-extrabold text-white">Norynt CRM Master Control Engine</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Centralized multi-tenant instance provisioning, real-time security audit log monitoring, and global cross-tenant telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs font-mono text-slate-200">
            Node: <span className="text-emerald-400 font-bold">PRODUCTION_HEALTHY</span>
          </div>
        </div>
      </div>

      {/* Cross-Tenant Telemetry Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Registered Tenants</span>
            <Building2 className="h-4 w-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{tenants.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {activeTenantsCount} Active Instances
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Security Audit Trail</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{logs.length}</div>
          <div className="text-[11px] text-purple-400 mt-1">Append-Only Security Stream</div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Global Pipeline Value</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            ${Number(forecast.pipelineValue ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Aggregated Cross-Tenant</div>
        </Card>

        <Card className="p-5 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Platform Isolation</span>
            <Key className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">JWT Scope</div>
          <div className="text-[11px] text-indigo-400 mt-1">Automatic Middleware RLS</div>
        </Card>
      </div>

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenants Direct Provisioner */}
        <Card className="p-6 lg:col-span-1 border-slate-800 bg-slate-900/60">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-400" />
            Tenants Quick Directory
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Active instances currently provisioned in PostgreSQL `norynt_crm`.
          </p>

          {tenantsQuery.isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No tenants found</div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {tenants.map((t: any) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{t.name}</div>
                    <div className="font-mono text-[10px] text-brand-400">{t.slug}</div>
                  </div>
                  <Badge tone={t.isActive ? 'green' : 'red'}>
                    {t.isActive ? 'Active' : 'Frozen'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Real-time Security Audit Stream */}
        <Card className="p-6 lg:col-span-2 border-slate-800 bg-slate-900/60">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-purple-400" />
            Real-Time Platform Security Audit Stream
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Live mutation events recorded by system actors across all company tenants.
          </p>

          {auditLogsQuery.isLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No audit logs recorded</div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                      {log.action}
                    </span>
                    <span className="text-slate-200 font-medium">{log.entityName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{log.actorEmail || 'System'}</span>
                    <span className="text-slate-600">|</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardTemplate>
  );
}
