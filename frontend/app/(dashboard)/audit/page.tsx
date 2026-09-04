'use client';
// app/(dashboard)/audit/page.tsx — Enterprise Audit & Security Console.
// Single-line compact log view with comprehensive right-side slideover drawer inspector.

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Clock,
  UserCheck,
  Activity,
  Search,
  Download,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Shield,
  Layers,
  ArrowRight,
  Globe,
  Terminal,
  X,
  ChevronRight,
  Copy,
  Check,
  FileJson,
  User,
  Hash,
  Laptop,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Card } from '@/components/atoms/Card';

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  path: string | null;
  statusCode: number;
  ip: string | null;
  userAgent: string | null;
  before: any;
  after: any;
  metadata: any;
  createdAt: string;
}

export default function AuditPage() {
  const { t } = useI18n();
  const { can } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch Audit Stats
  const statsQuery = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () =>
      unwrap<{ total: number; past24h: number; criticalActions: number }>(
        (await api.get('/audit-logs/stats')).data,
      ),
  });

  // Fetch Audit Logs (Handling transform interceptor envelope: res.data = { success: true, data: items, meta: ... })
  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, search, selectedEntity, selectedAction],
    queryFn: async () => {
      const res = await api.get('/audit-logs', {
        params: {
          page,
          limit: 25,
          q: search || undefined,
          entity: selectedEntity === 'ALL' ? undefined : selectedEntity,
          action: selectedAction === 'ALL' ? undefined : selectedAction,
        },
      });
      // res.data.data is the array of logs, res.data.meta is pagination
      const items: AuditLog[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      const meta = res.data?.meta || { total: items.length, page: 1, limit: 25, totalPages: 1 };
      return { items, meta };
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      const res = await api.get('/audit-logs/export', {
        params: {
          format,
          entity: selectedEntity === 'ALL' ? undefined : selectedEntity,
          action: selectedAction === 'ALL' ? undefined : selectedAction,
        },
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const actionTone = (action: string, status: number) => {
    if (status >= 400 || action.includes('FAILED') || action.includes('DELETE')) return 'red';
    if (action.includes('POST') || action.includes('CREATE') || action.includes('PAYMENT_SUCCESS')) return 'emerald';
    if (action.includes('UPDATE') || action.includes('PATCH') || action.includes('PUT')) return 'indigo';
    return 'gray';
  };

  const logs = logsQuery.data?.items || [];
  const meta = logsQuery.data?.meta;

  return (
    <DashboardTemplate
      title="Audit & Activity Ledger"
      subtitle="Immutable enterprise audit trail, security telemetry, actor attribution, and forensic inspection"
    >
      <div className="w-full space-y-6 pb-12">
        {/* ── 1. Top 3 Metric Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Audit Events
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              {statsQuery.isLoading ? '...' : (statsQuery.data?.total || logs.length || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Immutable enterprise activity trail</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Events in Past 24h
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {statsQuery.isLoading ? '...' : (statsQuery.data?.past24h || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Real-time user & system interactions</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Security & Critical Events
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
              {statsQuery.isLoading ? '...' : (statsQuery.data?.criticalActions || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Deletions, failed logins & modifications</p>
          </div>
        </div>

        {/* ── 2. Search & Filter Bar ── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by actor, email, action, entity, IP or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950/60 dark:text-white dark:focus:border-brand-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
                >
                  <option value="ALL">All Entities</option>
                  <option value="AUTH">Authentication (Login/Logout)</option>
                  <option value="DEALS">Sales Deals</option>
                  <option value="INVOICES">Invoices & Billing</option>
                  <option value="PAYMENTS">Payments</option>
                  <option value="USERS">Users & Team</option>
                  <option value="ROLES">RBAC Roles</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="TASKS">Tasks</option>
                  <option value="TICKETS">Tickets</option>
                </select>

                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300"
                >
                  <option value="ALL">All Actions</option>
                  <option value="POST">POST / Create</option>
                  <option value="PATCH">PATCH / Modify</option>
                  <option value="DELETE">DELETE / Remove</option>
                  <option value="PAYMENT_SUCCESS">Payment Success</option>
                  <option value="AUTH_SUCCESS">Auth Success</option>
                  <option value="AUTH_FAILED">Auth Failed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logsQuery.refetch()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Refresh logs"
              >
                <RefreshCw className={`h-4 w-4 ${logsQuery.isFetching ? 'animate-spin' : ''}`} />
              </button>

              <Button
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={() => handleExport('csv')}
                className="h-10 border-slate-200 text-xs font-bold dark:border-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={exporting}
                onClick={() => handleExport('json')}
                className="h-10 border-slate-200 text-xs font-bold dark:border-slate-800"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>JSON</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* ── 3. Single-Line High Density Logs Table ── */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
          {logsQuery.isLoading ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <p className="text-xs font-medium text-slate-400">Loading audit records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">No audit records found</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Try adjusting your search query or entity filters to see activity logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/40 dark:text-slate-400">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Action & Entity</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Client IP</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const dateStr = new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`group cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-50/60 dark:bg-brand-950/30'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{dateStr}</span>
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <User className="h-3 w-3" />
                            </div>
                            <span className="truncate font-bold text-slate-900 dark:text-white max-w-[150px]">
                              {log.actorEmail || 'System'}
                            </span>
                          </div>
                        </td>

                        {/* Action & Entity */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Badge tone={actionTone(log.action, log.statusCode)}>
                              {log.action}
                            </Badge>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {log.entity}
                            </span>
                          </div>
                        </td>

                        {/* One-Line Description */}
                        <td className="px-4 py-3">
                          <p className="truncate max-w-sm text-slate-600 dark:text-slate-300">
                            {log.description || `${log.action} executed on ${log.entity}`}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${
                              log.statusCode < 400
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                log.statusCode < 400 ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {log.statusCode}
                          </span>
                        </td>

                        {/* IP */}
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-400">
                          {log.ip || '127.0.0.1'}
                        </td>

                        {/* Detail Link */}
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-500/20 dark:hover:text-brand-300"
                          >
                            <span>Detail</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/30 dark:text-slate-400">
                  <span>
                    Showing page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> ({meta.total} events)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Slide-Over Drawer for Complete Log Inspection ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setSelectedLog(null)}
            aria-hidden="true"
          />

          {/* Slidebar / Drawer Container */}
          <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-200/90 bg-white text-slate-900 shadow-2xl backdrop-blur-2xl dark:border-slate-800/90 dark:bg-slate-950 dark:text-white animate-slide-in">
            {/* Drawer Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      Audit Event Details
                    </h3>
                    <Badge tone={actionTone(selectedLog.action, selectedLog.statusCode)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <p className="truncate font-mono text-[11px] text-slate-400">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(selectedLog.id, 'event-id')}
                  title="Copy Event ID"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  {copiedId === 'event-id' ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body Scrollable */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6 text-xs">
              {/* Event Meta Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Actor Email</span>
                  <p className="mt-0.5 truncate font-bold text-slate-900 dark:text-white">
                    {selectedLog.actorEmail || 'System Background Worker'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Role / Scope</span>
                  <p className="mt-0.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                    {selectedLog.actorRole || 'SYSTEM'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Entity & Record ID</span>
                  <p className="mt-0.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.entity} {selectedLog.entityId ? `(#${selectedLog.entityId})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Timestamp</span>
                  <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                    {new Date(selectedLog.createdAt).toISOString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">HTTP Status & Path</span>
                  <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.statusCode} · {selectedLog.path || '/api/v1/...'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Client IP</span>
                  <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.ip || '127.0.0.1'}
                  </p>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
                  <span className="text-[10px] font-bold uppercase text-slate-400">User Agent</span>
                  <p className="mt-0.5 line-clamp-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {selectedLog.userAgent || 'Mozilla/5.0 CRM Client'}
                  </p>
                </div>
              </div>

              {/* Description Box */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <span className="text-[10px] font-bold uppercase text-slate-400">Action Summary</span>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {selectedLog.description || `${selectedLog.action} on ${selectedLog.entity}`}
                </p>
              </div>

              {/* State Before vs After Diff Viewer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    State Payload & Modifications
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Secrets Redacted</span>
                </div>

                {selectedLog.before && (
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase text-rose-500">
                      State Before (Prior Values)
                    </span>
                    <pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-rose-300 custom-scrollbar">
                      {JSON.stringify(selectedLog.before, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.after && (
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase text-emerald-500">
                      State After (Updated Values)
                    </span>
                    <pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-emerald-300 custom-scrollbar">
                      {JSON.stringify(selectedLog.after, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && !selectedLog.before && !selectedLog.after && (
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                      Event Metadata Payload
                    </span>
                    <pre className="max-h-48 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 custom-scrollbar">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {!selectedLog.before && !selectedLog.after && !selectedLog.metadata && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/40">
                    No state payload mutation attached to this read event.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'json-copy')}
                className="text-xs font-bold"
              >
                <FileJson className="h-3.5 w-3.5" />
                <span>{copiedId === 'json-copy' ? 'Copied JSON!' : 'Copy Full JSON'}</span>
              </Button>

              <Button size="sm" onClick={() => setSelectedLog(null)} className="font-bold">
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
