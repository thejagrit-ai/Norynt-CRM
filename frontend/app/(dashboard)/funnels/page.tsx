'use client';
// app/(dashboard)/funnels/page.tsx — Marketing Conversion Funnels Builder
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GitFork,
  Plus,
  ArrowRight,
  TrendingDown,
  Users,
  Eye,
  Trash2,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Modal } from '@/components/molecules/Modal';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface FunnelStage {
  id: string;
  name: string;
  order: number;
  visitors: number;
  conversions: number;
  dropoffRate: number;
}

interface MarketingFunnel {
  id: string;
  name: string;
  description?: string;
  stages: FunnelStage[];
  createdAt: string;
}

export default function FunnelsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const funnels = useQuery({
    queryKey: ['marketing-funnels'],
    queryFn: async () => {
      const res = await api.get('/campaigns/funnels');
      return unwrap<MarketingFunnel[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['marketing-funnels'] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/campaigns/funnels', formData);
      invalidate();
      setCreating(false);
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create funnel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this funnel?')) return;
    try {
      await api.delete(`/campaigns/funnels/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete funnel');
    }
  };

  return (
    <DashboardTemplate
      title="Marketing Funnels"
      subtitle="Analyze conversion drop-off curves across multi-channel lead journeys"
      actions={
        <Button
          onClick={() => setCreating(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New Funnel
        </Button>
      }
    >
      {funnels.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (funnels.data || []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
          <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100 text-indigo-600 mb-4">
            <GitFork className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No conversion funnels created</h4>
          <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
            Create conversion funnels to track visitor velocity, qualification stages, and deal conversion rates from actual CRM activity.
          </p>
          <Button
            onClick={() => setCreating(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            tone="primary"
            className="mt-5"
          >
            New Funnel
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {(funnels.data || []).map((funnel) => {
            const firstStage = funnel.stages[0];
            const lastStage = funnel.stages[funnel.stages.length - 1];
            const overallConversion =
              firstStage?.visitors && lastStage?.conversions
                ? ((lastStage.conversions / firstStage.visitors) * 100).toFixed(2)
                : '0.00';

            return (
              <Card
                key={funnel.id}
                className="border-slate-200/90 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 text-lg">{funnel.name}</h3>
                      <Badge tone="indigo">Overall Win: {overallConversion}%</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {funnel.description || 'Full-funnel visitor to closed-won revenue progression.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(funnel.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                    title="Delete Funnel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Funnel Flow Stages */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
                  {funnel.stages.map((stage, idx) => {
                    const convRate =
                      stage.visitors > 0
                        ? ((stage.conversions / stage.visitors) * 100).toFixed(1)
                        : '0';

                    return (
                      <div
                        key={stage.id || idx}
                        className="relative rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                            <span className="font-mono font-semibold text-indigo-600">
                              Stage 0{idx + 1}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-medium">
                              {convRate}% conv
                            </span>
                          </div>

                          <h4 className="font-semibold text-slate-900 text-sm truncate mb-3">
                            {stage.name}
                          </h4>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Volume:</span>
                              <span className="font-semibold text-slate-800">
                                {stage.visitors.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Passed:</span>
                              <span className="font-semibold text-emerald-600">
                                {stage.conversions.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar Visualizer */}
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                              style={{ width: `${Math.min(100, Math.max(15, Number(convRate)))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Funnel Modal */}
      {creating && (
        <Modal
          title="New Conversion Funnel"
          description="Track conversion and dropoff across multi-stage customer journeys."
          onClose={() => setCreating(false)}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Funnel Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Enterprise Inbound Pipeline"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Brief context on customer touchpoints tracked in this funnel..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" tone="primary" disabled={submitting}>
                {submitting ? 'Creating…' : 'Generate Funnel'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
