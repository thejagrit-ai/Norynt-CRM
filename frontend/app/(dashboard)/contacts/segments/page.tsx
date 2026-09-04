'use client';
// app/(dashboard)/contacts/segments/page.tsx — Contact Segments Builder
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Filter, Trash2, Edit2, CheckCircle2, Sliders, X } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/molecules/Modal';

interface ContactSegment {
  id: string;
  name: string;
  description?: string;
  filterRules: Array<{ field: string; operator: string; value: string }>;
  matchedContactsCount?: number;
  createdAt: string;
}

export default function SegmentsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ContactSegment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: [{ field: 'roleType', operator: 'equals', value: 'DECISION_MAKER' }],
  });

  const segments = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const res = await api.get('/segments');
      return unwrap<ContactSegment[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['segments'] });

  const handleAddRule = () => {
    setFormData({
      ...formData,
      rules: [...formData.rules, { field: 'roleType', operator: 'equals', value: 'CHAMPION' }],
    });
  };

  const handleRemoveRule = (index: number) => {
    setFormData({
      ...formData,
      rules: formData.rules.filter((_, i) => i !== index),
    });
  };

  const handleRuleChange = (index: number, key: string, value: string) => {
    const nextRules = [...formData.rules];
    nextRules[index] = { ...nextRules[index], [key]: value };
    setFormData({ ...formData, rules: nextRules });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        filterRules: formData.rules,
      };
      if (editing) {
        await api.patch(`/segments/${editing.id}`, payload);
      } else {
        await api.post('/segments', payload);
      }
      invalidate();
      setCreating(false);
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        rules: [{ field: 'roleType', operator: 'equals', value: 'DECISION_MAKER' }],
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save segment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact segment?')) return;
    try {
      await api.delete(`/segments/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete segment');
    }
  };

  const openEdit = (seg: ContactSegment) => {
    setEditing(seg);
    setFormData({
      name: seg.name,
      description: seg.description || '',
      rules: Array.isArray(seg.filterRules) && seg.filterRules.length > 0
        ? seg.filterRules
        : [{ field: 'roleType', operator: 'equals', value: 'DECISION_MAKER' }],
    });
    setCreating(true);
  };

  return (
    <DashboardTemplate
      title="Contact Segments"
      subtitle="Define dynamic audience criteria to target specific stakeholder roles and companies"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormData({
              name: '',
              description: '',
              rules: [{ field: 'roleType', operator: 'equals', value: 'DECISION_MAKER' }],
            });
            setCreating(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          Create Segment
        </Button>
      }
    >
      {segments.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(segments.data || []).map((seg) => (
            <Card
              key={seg.id}
              className="flex flex-col justify-between border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white text-base">{seg.name}</h3>
                  <Badge tone="indigo">
                    <Users className="mr-1 h-3 w-3 inline" />
                    {seg.matchedContactsCount ?? 0} Matched
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {seg.description || 'Dynamic filter targeting contacts matching active rules.'}
                </p>

                <div className="mt-4 space-y-1.5 rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Criteria Rules:
                  </span>
                  {(Array.isArray(seg.filterRules) ? seg.filterRules : []).map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="text-indigo-400 font-mono">{rule.field}</span>
                      <span className="text-slate-500">{rule.operator}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-white">{rule.value}</span>
                    </div>
                  ))}
                  {(!seg.filterRules || (seg.filterRules as any[]).length === 0) && (
                    <p className="text-xs text-slate-500 italic">Matches all active contacts</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-4">
                <Button size="sm" tone="secondary" onClick={() => openEdit(seg)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <button
                  onClick={() => handleDelete(seg.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}

          {(!segments.data || segments.data.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <Sliders className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">No Contact Segments defined</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                Build saved filters and audience segments based on role type, title, or organization.
              </p>
              <Button
                className="mt-4"
                tone="primary"
                onClick={() => setCreating(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Create First Segment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {creating && (
        <Modal
          title={editing ? 'Edit Segment' : 'Create Contact Segment'}
          description="Define dynamic audience criteria to target specific stakeholder roles"
          onClose={() => setCreating(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Segment Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Key Decision Makers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Audience definition or campaign target..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-400">Filter Conditions</label>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add Condition
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-slate-950 p-2.5 border border-slate-800">
                    <select
                      value={rule.field}
                      onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      <option value="roleType">Role Type</option>
                      <option value="company">Company</option>
                      <option value="title">Job Title</option>
                      <option value="email">Email</option>
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="starts_with">Starts With</option>
                    </select>

                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                      placeholder="Value..."
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                    />

                    {formData.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" tone="primary" disabled={submitting}>
                {submitting ? 'Saving…' : editing ? 'Update Segment' : 'Create Segment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
