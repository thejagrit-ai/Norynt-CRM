'use client';
// app/(dashboard)/masters/tnc-sets/page.tsx — Terms & Conditions Sets Master
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface TermsConditionSet {
  id: string;
  title: string;
  type: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function TncSetsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TermsConditionSet | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'QUOTATION',
    content: '',
    isDefault: false,
  });

  const tncSets = useQuery({
    queryKey: ['tnc-sets'],
    queryFn: async () => {
      const res = await api.get('/masters/tnc-sets');
      return unwrap<TermsConditionSet[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tnc-sets'] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/masters/tnc-sets/${editing.id}`, formData);
      } else {
        await api.post('/masters/tnc-sets', formData);
      }
      invalidate();
      setCreating(false);
      setEditing(null);
      setFormData({ title: '', type: 'QUOTATION', content: '', isDefault: false });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save T&C set');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Terms & Conditions set?')) return;
    try {
      await api.delete(`/masters/tnc-sets/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete T&C set');
    }
  };

  const openEdit = (set: TermsConditionSet) => {
    setEditing(set);
    setFormData({
      title: set.title,
      type: set.type,
      content: set.content,
      isDefault: set.isDefault,
    });
    setCreating(true);
  };

  return (
    <DashboardTemplate
      title="Terms & Conditions Sets"
      subtitle="Preset clauses and legal boilerplate automatically attached to customer Quotations & Invoices"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormData({ title: '', type: 'QUOTATION', content: '', isDefault: false });
            setCreating(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New T&C Set
        </Button>
      }
    >
      {tncSets.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(tncSets.data || []).map((set) => (
            <Card
              key={set.id}
              className="flex flex-col justify-between border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-indigo-400" />
                    <h3 className="font-bold text-white text-base">{set.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="indigo">{set.type}</Badge>
                    {set.isDefault && <Badge tone="green">Default</Badge>}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                  {set.content}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-3">
                <Button size="sm" tone="secondary" onClick={() => openEdit(set)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <button
                  onClick={() => handleDelete(set.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editing ? 'Edit T&C Set' : 'Create Terms & Conditions Set'}
              </h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Set Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Enterprise Payment & SLA Terms"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Document Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="QUOTATION">Quotation (CPQ)</option>
                  <option value="INVOICE">Invoice & Billing</option>
                  <option value="GENERAL">General Contract / Agreement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Terms & Conditions Clauses
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="1. Payment terms...\n2. Delivery and fulfillment...\n3. Validity period..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Set as default set for this document type</span>
              </label>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" tone="primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Update Set' : 'Save Set'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
