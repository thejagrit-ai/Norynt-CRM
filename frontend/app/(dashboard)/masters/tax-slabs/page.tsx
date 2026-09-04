'use client';
// app/(dashboard)/masters/tax-slabs/page.tsx — Tax Slabs Master Management
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Percent,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Check,
  X,
  Receipt,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface TaxSlab {
  id: string;
  name: string;
  rate: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  isDefault: boolean;
  isActive: boolean;
}

export default function TaxSlabsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaxSlab | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    isDefault: false,
  });

  const slabs = useQuery({
    queryKey: ['tax-slabs'],
    queryFn: async () => {
      const res = await api.get('/masters/tax-slabs');
      return unwrap<TaxSlab[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tax-slabs'] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/masters/tax-slabs/${editing.id}`, formData);
      } else {
        await api.post('/masters/tax-slabs', formData);
      }
      invalidate();
      setCreating(false);
      setEditing(null);
      setFormData({ name: '', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, isDefault: false });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save tax slab');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tax slab?')) return;
    try {
      await api.delete(`/masters/tax-slabs/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete tax slab');
    }
  };

  const openEdit = (slab: TaxSlab) => {
    setEditing(slab);
    setFormData({
      name: slab.name,
      rate: Number(slab.rate),
      cgstRate: Number(slab.cgstRate || 0),
      sgstRate: Number(slab.sgstRate || 0),
      igstRate: Number(slab.igstRate || 0),
      isDefault: slab.isDefault,
    });
    setCreating(true);
  };

  return (
    <DashboardTemplate
      title="Tax Slabs Master"
      subtitle="Define statutory GST, VAT, and sales tax rate tiers applied across CPQ quotes and invoices"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormData({ name: '', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, isDefault: false });
            setCreating(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New Tax Slab
        </Button>
      }
    >
      {slabs.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(slabs.data || []).map((slab) => (
            <Card
              key={slab.id}
              className="flex flex-col justify-between border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white text-base">{slab.name}</h3>
                  {slab.isDefault && <Badge tone="green">Default</Badge>}
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{Number(slab.rate)}%</span>
                  <span className="text-xs text-slate-400">Total Tax Rate</span>
                </div>

                <div className="mt-4 space-y-1 rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>CGST:</span>
                    <span className="font-semibold text-white">{Number(slab.cgstRate || 0)}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SGST:</span>
                    <span className="font-semibold text-white">{Number(slab.sgstRate || 0)}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IGST:</span>
                    <span className="font-semibold text-white">{Number(slab.igstRate || 0)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-3">
                <Button size="sm" tone="secondary" onClick={() => openEdit(slab)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <button
                  onClick={() => handleDelete(slab.id)}
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
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">
                {editing ? 'Edit Tax Slab' : 'Create Tax Slab'}
              </h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Slab Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., GST 18% (Standard)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Total Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cgstRate}
                    onChange={(e) => setFormData({ ...formData, cgstRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">SGST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sgstRate}
                    onChange={(e) => setFormData({ ...formData, sgstRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Set as default rate for new products</span>
              </label>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" tone="primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Update Slab' : 'Save Slab'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
