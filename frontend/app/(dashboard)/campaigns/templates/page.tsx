'use client';
// app/(dashboard)/campaigns/templates/page.tsx — Template Library (Matching Reference Screenshot 5)
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Mail,
  Smartphone,
  Trash2,
  Edit2,
  Eye,
  X,
  Copy,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Modal } from '@/components/molecules/Modal';
import { Spinner } from '@/components/atoms/Spinner';

interface MessageTemplate {
  id: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  createdAt: string;
}

export default function CampaignTemplatesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [creating, setCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<MessageTemplate | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
    category: string;
    subject: string;
    content: string;
  }>({
    name: '',
    channel: 'EMAIL',
    category: 'Marketing',
    subject: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ['campaign-templates'],
    queryFn: async () => {
      const res = await api.get('/campaigns/templates');
      return unwrap<MessageTemplate[]>(res.data);
    },
  });

  const allTemplates = templatesQuery.data || [];
  const currentTemplates = allTemplates.filter((t) => t.channel === activeTab);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/templates/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['campaign-templates'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      channel: activeTab,
      category: 'Marketing',
      subject: '',
      content: '',
    });
    setCreating(true);
  };

  const handleOpenEdit = (t: MessageTemplate) => {
    setEditingTemplate(t);
    setFormData({
      name: t.name,
      channel: t.channel,
      category: t.category,
      subject: t.subject || '',
      content: t.content,
    });
    setCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;
    setSubmitting(true);
    try {
      if (editingTemplate) {
        await api.patch(`/campaigns/templates/${editingTemplate.id}`, formData);
      } else {
        await api.post('/campaigns/templates', formData);
      }
      void qc.invalidateQueries({ queryKey: ['campaign-templates'] });
      setCreating(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInsertToken = (token: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + ` {{${token}}}`,
    }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardTemplate
      title="Templates"
      subtitle="Manage email and SMS templates for your campaigns"
      actions={
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Template
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Dual Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('EMAIL')}
            className={`flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider transition border-b-2 -mb-2 ${
              activeTab === 'EMAIL'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SMS')}
            className={`flex items-center gap-2 pb-2 text-xs font-semibold tracking-wider transition border-b-2 -mb-2 ${
              activeTab === 'SMS'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>SMS Templates</span>
          </button>
        </div>

        {/* Templates Grid */}
        {templatesQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTemplates.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 border border-dashed border-slate-300 rounded-3xl bg-slate-50/50">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
                <p className="text-sm font-semibold text-slate-800">No {activeTab} templates found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click &quot;Create Template&quot; to build reusable content.
                </p>
              </div>
            ) : (
              currentTemplates.map((tpl) => (
                <Card
                  key={tpl.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition"
                >
                  <div>
                    {/* Header: Icon + Title + Category */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5">
                        {tpl.channel === 'EMAIL' ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                          {tpl.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tpl.category || 'General'}
                        </p>
                      </div>
                    </div>

                    {/* Template Content Box with Variable Highlighting */}
                    <div className="mt-3.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed line-clamp-3 select-all">
                      {tpl.content}
                    </div>
                  </div>

                  {/* Footer: Date + Action Buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(tpl.createdAt)}</span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewingTemplate(tpl)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tpl)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create / Edit Template Modal */}
        {creating && (
          <Modal
            title={editingTemplate ? 'Edit Template' : 'Create Template'}
            description="Build personalized campaign templates with dynamic customer attributes"
            onClose={() => setCreating(false)}
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome Onboarding Mail / Flash Discount SMS"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Channel
                  </label>
                  <select
                    value={formData.channel}
                    onChange={(e) =>
                      setFormData({ ...formData, channel: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {formData.channel === 'EMAIL' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Welcome to Norynt, {{firstName}}!"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Personalization Variable Chips */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Insert Variables:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { token: 'lead.name', label: 'Lead Name' },
                    { token: 'firstName', label: 'First Name' },
                    { token: 'companyName', label: 'Company' },
                    { token: 'email', label: 'Email' },
                    { token: 'phone', label: 'Phone' },
                  ].map((chip) => (
                    <button
                      key={chip.token}
                      type="button"
                      onClick={() => handleInsertToken(chip.token)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-mono transition"
                    >
                      + {`{{${chip.token}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Template Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Draft your personalized message template here..."
                  className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-blue-500 transition shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 shadow-sm"
                >
                  {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Live Preview Modal */}
        {previewingTemplate && (
          <Modal
            title={previewingTemplate.name}
            description={`Channel: ${previewingTemplate.channel} · Category: ${previewingTemplate.category}`}
            onClose={() => setPreviewingTemplate(null)}
            maxWidth="max-w-lg"
          >
            <div className="space-y-4 text-xs">
              {previewingTemplate.subject && (
                <div>
                  <span className="text-slate-500 uppercase font-semibold">Subject</span>
                  <p className="text-sm font-bold text-white bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1">
                    {previewingTemplate.subject}
                  </p>
                </div>
              )}

              <div>
                <span className="text-slate-500 uppercase font-semibold">Body Preview</span>
                <div className="mt-1 rounded-2xl bg-slate-950 p-4 border border-slate-800 text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                  {previewingTemplate.content}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setPreviewingTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardTemplate>
  );
}
