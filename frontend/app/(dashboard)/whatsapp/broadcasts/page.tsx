'use client';
// app/(dashboard)/whatsapp/broadcasts/page.tsx — Enterprise WhatsApp Mass Broadcast Campaigns
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Plus,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
  MessageSquare,
  Users,
  Calendar,
  Layers,
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
import { Modal } from '@/components/molecules/Modal';
import { WhatsAppNavHeader } from '@/components/molecules/WhatsAppNavHeader';

interface WhatsAppBroadcast {
  id: string;
  name: string;
  templateName: string;
  language: string;
  targetAudience: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  readCount?: number;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  bodyContent: string;
  headerContent?: string;
  footerContent?: string;
  status: string;
}

export default function WhatsAppBroadcastsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    templateName: '',
    targetAudience: 'Leads',
    language: 'en_US',
    scheduledAt: '',
    variables: {} as Record<string, string>,
  });

  const broadcasts = useQuery({
    queryKey: ['wa-broadcasts'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/broadcasts');
      return unwrap<WhatsAppBroadcast[]>(res.data);
    },
  });

  const templates = useQuery({
    queryKey: ['wa-templates'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/templates');
      return unwrap<WhatsAppTemplate[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['wa-broadcasts'] });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      setFormError(null);
      return api.post('/whatsapp/broadcasts', payload);
    },
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to create broadcast campaign.');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/whatsapp/broadcasts/${id}/send`);
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to dispatch broadcast.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/whatsapp/broadcasts/${id}`);
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete broadcast.');
    },
  });

  const openCreateModal = () => {
    const defaultTemplate = (templates.data || []).find((t) => t.status === 'APPROVED') || templates.data?.[0];
    setFormData({
      name: '',
      templateName: defaultTemplate?.name || '',
      targetAudience: 'Leads',
      language: defaultTemplate?.language || 'en_US',
      scheduledAt: '',
      variables: {},
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const selectedTpl = (templates.data || []).find((t) => t.name === formData.templateName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Campaign title is required.');
      return;
    }
    if (!formData.templateName.trim()) {
      setFormError('Please select a Meta HSM Template.');
      return;
    }

    createMutation.mutate(formData);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge tone="green">Completed</Badge>;
      case 'PROCESSING':
        return <Badge tone="amber">Processing</Badge>;
      case 'SCHEDULED':
        return <Badge tone="indigo">Scheduled</Badge>;
      case 'FAILED':
        return <Badge tone="rose">Failed</Badge>;
      default:
        return <Badge tone="gray">{status || 'Draft'}</Badge>;
    }
  };

  return (
    <DashboardTemplate
      title="WhatsApp Broadcasts"
      subtitle="Deliver high-throughput official Meta HSM template broadcasts to segmented customer lists"
      actions={
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
          className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-sm"
        >
          New Broadcast
        </Button>
      }
    >
      <WhatsAppNavHeader />
      {broadcasts.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (broadcasts.data || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-4">
            <Radio className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No WhatsApp broadcasts yet</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create your first mass broadcast campaign to deliver personalized HSM template notifications directly to your CRM audiences.
          </p>
          <Button
            onClick={openCreateModal}
            tone="primary"
            className="mt-5"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create First Broadcast
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 p-0 shadow-sm backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Campaign Name</th>
                  <th className="px-4 py-3.5">Template</th>
                  <th className="px-4 py-3.5">Target Audience</th>
                  <th className="px-4 py-3.5 text-center">Total</th>
                  <th className="px-4 py-3.5 text-center">Sent</th>
                  <th className="px-4 py-3.5 text-center">Delivered</th>
                  <th className="px-4 py-3.5 text-center">Read</th>
                  <th className="px-4 py-3.5 text-center">Failed</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Scheduled / Sent Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {(broadcasts.data || []).map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {b.name}
                    </td>
                    <td className="px-4 py-4">
                      <code className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                        {b.templateName}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {b.targetAudience}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-slate-900 dark:text-white">
                      {b.totalCount}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {b.successCount}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {b.successCount}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-400">
                      {b.readCount !== undefined ? b.readCount : '—'}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-rose-500">
                      {b.failedCount}
                    </td>
                    <td className="px-4 py-4">{renderStatusBadge(b.status)}</td>
                    <td className="px-4 py-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {b.sentAt
                        ? new Date(b.sentAt).toLocaleString()
                        : b.scheduledAt
                        ? `Scheduled: ${new Date(b.scheduledAt).toLocaleString()}`
                        : new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status !== 'COMPLETED' && (
                          <Button
                            size="sm"
                            tone="primary"
                            onClick={() => {
                              if (confirm(`Dispatch broadcast "${b.name}" to ${b.targetAudience} now?`)) {
                                sendMutation.mutate(b.id);
                              }
                            }}
                            loading={sendMutation.isPending}
                            leftIcon={<Send className="h-3 w-3" />}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs py-1 h-7"
                          >
                            Send
                          </Button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete broadcast "${b.name}"?`)) {
                              deleteMutation.mutate(b.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Delete broadcast"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Global Shared Modal for Creating Broadcast */}
      {modalOpen && (
        <Modal
          title="New WhatsApp Broadcast Campaign"
          description="Configure audience targeting, template parameters, and dispatch schedule."
          onClose={closeModal}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Q3 VIP Product Launch Announcement"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta HSM Template <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                >
                  {(templates.data || []).map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                  {(!templates.data || templates.data.length === 0) && (
                    <option value="">No templates available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Audience Source <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Leads">All Qualified Leads</option>
                  <option value="Contacts">All Active Contacts</option>
                  <option value="Segments">Audience Segments</option>
                  <option value="Lead Groups">Lead Groups</option>
                  <option value="Manual Numbers">Manual Numbers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Time (Optional — Leave blank for manual/instant dispatch)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Live Message Bubble Preview */}
            {selectedTpl && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Message Preview ({selectedTpl.name})
                </label>
                <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/30 p-4 text-xs shadow-inner">
                  {selectedTpl.headerContent && (
                    <p className="font-bold text-slate-200 mb-1 border-b border-emerald-800/20 pb-1">
                      {selectedTpl.headerContent}
                    </p>
                  )}
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedTpl.bodyContent}</p>
                  {selectedTpl.footerContent && (
                    <p className="mt-2 text-[10px] text-slate-500 italic">
                      {selectedTpl.footerContent}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" tone="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                tone="primary"
                disabled={createMutation.isPending}
                loading={createMutation.isPending}
              >
                Create Campaign
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
