'use client';
// app/(dashboard)/whatsapp/templates/page.tsx — Meta WhatsApp HSM Template Manager
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Plus,
  Trash2,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertCircle,
  FileText,
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

interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT';
  headerContent?: string;
  bodyContent: string;
  footerContent?: string;
  buttons?: TemplateButton[];
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export default function WhatsAppTemplatesPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING' as WhatsAppTemplate['category'],
    language: 'en_US',
    headerType: 'NONE' as WhatsAppTemplate['headerType'],
    headerContent: '',
    bodyContent: 'Hi {{1}}, thank you for contacting us! We are excited to share your order update: {{2}}.',
    footerContent: 'Reply STOP to opt out',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Chat with Sales', url: '', phoneNumber: '' },
    ] as TemplateButton[],
  });

  const templates = useQuery({
    queryKey: ['wa-templates-mgmt'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/templates');
      return unwrap<WhatsAppTemplate[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['wa-templates-mgmt'] });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      setFormError(null);
      return api.post('/whatsapp/templates', payload);
    },
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to submit template to Meta.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/whatsapp/templates/${id}`);
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete template.');
    },
  });

  const openCreateModal = () => {
    setFormData({
      name: '',
      category: 'MARKETING',
      language: 'en_US',
      headerType: 'NONE',
      headerContent: '',
      bodyContent: 'Hi {{1}}, thank you for connecting with us!',
      footerContent: 'Reply STOP to opt out',
      buttons: [{ type: 'QUICK_REPLY', text: 'Chat with Agent', url: '', phoneNumber: '' }],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError(null);
  };

  const handleAddButton = () => {
    if (formData.buttons.length >= 3) return;
    setFormData((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: 'New Button', url: '', phoneNumber: '' }],
    }));
  };

  const handleRemoveButton = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== idx),
    }));
  };

  const handleButtonChange = (idx: number, field: string, value: any) => {
    setFormData((prev) => {
      const next = [...prev.buttons];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, buttons: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formData.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanName || !/^[a-z0-9_]+$/.test(cleanName)) {
      setFormError('Template identifier must be lowercase snake_case (e.g. order_update_v1).');
      return;
    }

    if (!formData.bodyContent.trim()) {
      setFormError('Template body text is required.');
      return;
    }

    // Validate buttons
    for (let i = 0; i < formData.buttons.length; i++) {
      const btn = formData.buttons[i];
      if (!btn.text.trim()) {
        setFormError(`Button #${i + 1} text is required.`);
        return;
      }
      if (btn.type === 'URL' && (!btn.url || !btn.url.startsWith('http'))) {
        setFormError(`Button #${i + 1} must have a valid URL starting with http:// or https://`);
        return;
      }
      if (btn.type === 'PHONE_NUMBER' && !btn.phoneNumber) {
        setFormError(`Button #${i + 1} must have a phone number.`);
        return;
      }
    }

    createMutation.mutate({
      ...formData,
      name: cleanName,
    });
  };

  const renderStatusBadge = (status: WhatsAppTemplate['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Badge tone="green">Approved</Badge>;
      case 'REJECTED':
        return <Badge tone="rose">Rejected</Badge>;
      default:
        return <Badge tone="amber">Pending Approval</Badge>;
    }
  };

  return (
    <DashboardTemplate
      title="WhatsApp Templates"
      subtitle="Create and manage message templates with dynamic variables and interactive button actions"
      actions={
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New Template
        </Button>
      }
    >
      {templates.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (templates.data || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-12 text-center backdrop-blur-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-500 mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No WhatsApp templates yet</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create high-converting Meta-compliant message templates with interactive quick replies and URL actions.
          </p>
          <Button
            onClick={openCreateModal}
            tone="primary"
            className="mt-5"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(templates.data || []).map((tpl) => (
            <Card
              key={tpl.id}
              className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition hover:border-teal-500/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {tpl.name}
                    </span>
                  </div>
                  {renderStatusBadge(tpl.status)}
                </div>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/30 p-4 text-xs shadow-inner">
                  {tpl.headerContent && (
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1.5 border-b border-emerald-200 dark:border-emerald-800/20 pb-1">
                      {tpl.headerContent}
                    </p>
                  )}
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {tpl.bodyContent}
                  </p>
                  {tpl.footerContent && (
                    <p className="mt-2 text-[10px] text-slate-500 italic">
                      {tpl.footerContent}
                    </p>
                  )}

                  {/* Buttons Mockup */}
                  {Array.isArray(tpl.buttons) && tpl.buttons.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-emerald-200 dark:border-emerald-800/30 pt-2">
                      {tpl.buttons.map((btn, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white dark:bg-emerald-900/40 text-emerald-800 dark:text-teal-300 font-semibold text-[11px] border border-emerald-300/80 dark:border-teal-500/20 shadow-sm"
                        >
                          {btn.type === 'PHONE_NUMBER' && <Phone className="h-2.5 w-2.5 mr-1" />}
                          {btn.text}
                          {btn.type === 'URL' && <ExternalLink className="h-2.5 w-2.5 ml-1" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Category: <strong className="text-slate-700 dark:text-slate-300">{tpl.category}</strong>
                  </span>
                  <span>
                    Lang: <strong className="text-slate-700 dark:text-slate-300">{tpl.language}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(tpl.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete template "${tpl.name}"?`)) {
                      deleteMutation.mutate(tpl.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Delete Template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <Modal
          title="Create WhatsApp HSM Template"
          description="Build a pre-approved Meta WhatsApp Cloud API template with variable placeholders."
          onClose={closeModal}
          maxWidth="max-w-2xl"
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
                Template Identifier (lowercase, underscores only) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., order_confirmation_v1"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication (OTP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="en_US">English (US)</option>
                  <option value="hi_IN">Hindi (IN)</option>
                  <option value="tr_TR">Turkish (TR)</option>
                  <option value="es_ES">Spanish (ES)</option>
                  <option value="de_DE">German (DE)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Header Text (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Order Confirmation"
                value={formData.headerContent}
                onChange={(e) => setFormData({ ...formData, headerContent: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Body Text <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
                  Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for variables
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={formData.bodyContent}
                onChange={(e) => setFormData({ ...formData, bodyContent: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Footer Text (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Reply STOP to opt out"
                value={formData.footerContent}
                onChange={(e) => setFormData({ ...formData, footerContent: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Interactive Button Builder */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Action Buttons ({formData.buttons.length}/3)
                </label>
                {formData.buttons.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add Button
                  </button>
                )}
              </div>

              {formData.buttons.map((btn, bIdx) => (
                <div
                  key={bIdx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2.5 text-xs"
                >
                  <select
                    value={btn.type}
                    onChange={(e) => handleButtonChange(bIdx, 'type', e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="QUICK_REPLY">Quick Reply</option>
                    <option value="URL">Visit Website (URL)</option>
                    <option value="PHONE_NUMBER">Call Phone</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Button Label"
                    value={btn.text}
                    onChange={(e) => handleButtonChange(bIdx, 'text', e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />

                  {btn.type === 'URL' && (
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={btn.url}
                      onChange={(e) => handleButtonChange(bIdx, 'url', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  )}

                  {btn.type === 'PHONE_NUMBER' && (
                    <input
                      type="tel"
                      required
                      placeholder="+123456789"
                      value={btn.phoneNumber}
                      onChange={(e) => handleButtonChange(bIdx, 'phoneNumber', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveButton(bIdx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Live Preview */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">Real-time Bubble Preview</label>
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/30 p-4 text-xs shadow-inner">
                {formData.headerContent && (
                  <p className="font-bold text-slate-200 mb-1.5 border-b border-emerald-800/20 pb-1">
                    {formData.headerContent}
                  </p>
                )}
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {formData.bodyContent || 'Template body text...'}
                </p>
                {formData.footerContent && (
                  <p className="mt-2 text-[10px] text-slate-500 italic">
                    {formData.footerContent}
                  </p>
                )}
                {formData.buttons.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-emerald-800/30 pt-2">
                    {formData.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center py-1.5 rounded-lg bg-emerald-900/40 text-teal-300 font-semibold text-[11px] border border-teal-500/20"
                      >
                        {b.text || 'Button'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
                Submit for Approval
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
