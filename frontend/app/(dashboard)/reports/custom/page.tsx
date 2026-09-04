'use client';
// app/(dashboard)/reports/custom/page.tsx — Custom Interactive Report Builder & Analytics
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Plus,
  Play,
  Download,
  Trash2,
  Calendar,
  Filter,
  PieChart,
  Layers,
  FileSpreadsheet,
  X,
  Sparkles,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface CustomReportDef {
  id: string;
  name: string;
  description?: string;
  entity: string;
  metrics: string[];
  groupBy?: string;
  dateRange?: string;
  chartType: string;
}

interface ReportResult {
  entity: string;
  groupBy: string;
  totalRecords: number;
  data: Array<{ label: string; count: number; value: number }>;
  generatedAt: string;
}

export default function CustomReportsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [selectedEntity, setSelectedEntity] = useState('DEAL');
  const [selectedGroupBy, setSelectedGroupBy] = useState('status');
  const [selectedDateRange, setSelectedDateRange] = useState('this_month');
  const [creating, setCreating] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');

  const savedReports = useQuery({
    queryKey: ['custom-reports-list'],
    queryFn: async () => {
      const res = await api.get('/reports/custom');
      return unwrap<CustomReportDef[]>(res.data);
    },
  });

  const queryResult = useQuery({
    queryKey: ['custom-report-exec', selectedEntity, selectedGroupBy, selectedDateRange],
    queryFn: async () => {
      const res = await api.post('/reports/custom/execute', {
        entity: selectedEntity,
        groupBy: selectedGroupBy,
        dateRange: selectedDateRange,
      });
      return unwrap<ReportResult>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['custom-reports-list'] });

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;
    try {
      await api.post('/reports/custom', {
        name: reportName,
        description: reportDesc,
        entity: selectedEntity,
        groupBy: selectedGroupBy,
        dateRange: selectedDateRange,
      });
      invalidate();
      setCreating(false);
      setReportName('');
      setReportDesc('');
      alert('Report definition saved successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save report');
    }
  };

  const handleDeleteSaved = async (id: string) => {
    if (!confirm('Delete this saved report?')) return;
    try {
      await api.delete(`/reports/custom/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete report');
    }
  };

  const exportCsv = () => {
    const data = queryResult.data?.data || [];
    if (data.length === 0) return alert('No data to export');

    const headers = ['Category', 'Record Count', 'Aggregated Value'];
    const rows = data.map((d) => [d.label, d.count, d.value]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedEntity.toLowerCase()}_custom_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxVal = Math.max(
    ...(queryResult.data?.data || []).map((d) => d.count),
    1,
  );

  return (
    <DashboardTemplate
      title="Custom Report Builder"
      subtitle="Ad-hoc dimension aggregation and analytics across Deals, Leads, Invoices, and Tickets"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={exportCsv} leftIcon={<Download className="h-4 w-4" />} tone="secondary">
            Export CSV
          </Button>
          <Button
            onClick={() => setCreating(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            tone="primary"
          >
            Save Report Template
          </Button>
        </div>
      }
    >
      {/* Query Control Bar */}
      <Card className="border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              1. Primary Entity
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                if (e.target.value === 'LEAD') setSelectedGroupBy('channel');
                else if (e.target.value === 'TICKET') setSelectedGroupBy('priority');
                else setSelectedGroupBy('status');
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
            >
              <option value="DEAL">Deals & Opportunities</option>
              <option value="LEAD">Leads Intake</option>
              <option value="INVOICE">Invoices & Billing</option>
              <option value="TICKET">Support Tickets</option>
              <option value="CONTACT">Contacts & Stakeholders</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              2. Group Dimension By
            </label>
            <select
              value={selectedGroupBy}
              onChange={(e) => setSelectedGroupBy(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
            >
              <option value="status">Status</option>
              <option value="channel">Channel / Intake</option>
              <option value="priority">Priority</option>
              <option value="currency">Currency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              3. Time Horizon
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
            >
              <option value="this_month">Current Month</option>
              <option value="this_quarter">Current Quarter (Q3)</option>
              <option value="this_year">Year to Date (2026)</option>
              <option value="all_time">All Time Historical</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Interactive Visualization Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-lg">
                {selectedEntity} Distribution by {selectedGroupBy.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-400">
                Total Records Analyzed: {queryResult.data?.totalRecords || 0}
              </p>
            </div>
            <Badge tone="indigo">Live Computed</Badge>
          </div>

          {queryResult.isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              {(queryResult.data?.data || []).map((item, idx) => {
                const pct = ((item.count / maxVal) * 100).toFixed(0);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.label}</span>
                      <div className="flex items-center gap-3">
                        {item.value > 0 && (
                          <span className="text-indigo-400 font-mono">
                            ${Number(item.value).toLocaleString()}
                          </span>
                        )}
                        <span className="font-bold text-white font-mono">{item.count} items</span>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, Number(pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {(!queryResult.data?.data || queryResult.data.data.length === 0) && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No records found matching this criterion.
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Saved Reports Templates Column */}
        <Card className="border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-base mb-1">Preset Report Templates</h4>
            <p className="text-xs text-slate-400 mb-4">Click to load pre-configured parameters</p>

            <div className="space-y-2.5">
              {(savedReports.data || []).map((sr) => (
                <div
                  key={sr.id}
                  onClick={() => {
                    setSelectedEntity(sr.entity);
                    if (sr.groupBy) setSelectedGroupBy(sr.groupBy);
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <h5 className="font-semibold text-white text-xs group-hover:text-indigo-300 transition">
                      {sr.name}
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      {sr.entity} · Grouped by {sr.groupBy}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSaved(sr.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Save Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Save Custom Report</h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Report Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Invoices Q3 Payment Status Breakdown"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Notes or business objectives tracked..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" tone="primary">
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
