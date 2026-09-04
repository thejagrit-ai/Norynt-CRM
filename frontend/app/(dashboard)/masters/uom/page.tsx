'use client';
// app/(dashboard)/masters/uom/page.tsx — Units of Measure Master
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  Plus,
  Trash2,
  Edit2,
  Box,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  precision: number;
  isActive: boolean;
}

export default function UomMasterPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UnitOfMeasure | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    precision: 0,
  });

  const uoms = useQuery({
    queryKey: ['uom-masters'],
    queryFn: async () => {
      const res = await api.get('/masters/uom');
      return unwrap<UnitOfMeasure[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['uom-masters'] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/masters/uom/${editing.id}`, formData);
      } else {
        await api.post('/masters/uom', formData);
      }
      invalidate();
      setCreating(false);
      setEditing(null);
      setFormData({ code: '', name: '', symbol: '', precision: 0 });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save UOM');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Unit of Measure?')) return;
    try {
      await api.delete(`/masters/uom/${id}`);
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete UOM');
    }
  };

  const openEdit = (uom: UnitOfMeasure) => {
    setEditing(uom);
    setFormData({
      code: uom.code,
      name: uom.name,
      symbol: uom.symbol || '',
      precision: uom.precision,
    });
    setCreating(true);
  };

  return (
    <DashboardTemplate
      title="Units of Measure (UOM)"
      subtitle="Standardized packaging, time, and quantity measurement units for product catalog items"
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormData({ code: '', name: '', symbol: '', precision: 0 });
            setCreating(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New Unit
        </Button>
      }
    >
      {uoms.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(uoms.data || []).map((uom) => (
            <Card
              key={uom.id}
              className="flex flex-col justify-between border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                      {uom.code}
                    </span>
                    <h3 className="font-semibold text-white text-base">{uom.name}</h3>
                  </div>
                  <Badge tone="green">Active</Badge>
                </div>

                <div className="mt-4 space-y-1 rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Symbol / Abbreviation:</span>
                    <span className="font-semibold text-white">{uom.symbol || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Decimal Precision:</span>
                    <span className="font-semibold text-white">{uom.precision} places</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-3">
                <Button size="sm" tone="secondary" onClick={() => openEdit(uom)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <button
                  onClick={() => handleDelete(uom.id)}
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
                {editing ? 'Edit Unit of Measure' : 'Create Unit of Measure'}
              </h2>
              <button onClick={() => setCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Unit Code (e.g. PCS, KG, HRS)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., BOX"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white uppercase placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cartons / Boxes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    placeholder="bx"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Decimal Places</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={formData.precision}
                    onChange={(e) => setFormData({ ...formData, precision: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button type="button" tone="secondary" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" tone="primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editing ? 'Update Unit' : 'Save Unit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}
