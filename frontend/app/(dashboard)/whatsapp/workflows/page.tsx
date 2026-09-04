'use client';
// app/(dashboard)/whatsapp/workflows/page.tsx — Enterprise WhatsApp Automation & Workflows
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch,
  Plus,
  Trash2,
  Edit2,
  Zap,
  MessageSquare,
  Tag,
  UserCheck,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  AlertCircle,
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

interface WorkflowAction {
  type: 'SEND_TEXT' | 'SEND_TEMPLATE' | 'SEND_QUICK_REPLY' | 'ASSIGN_AGENT' | 'CHANGE_STATUS' | 'ADD_TAG';
  text?: string;
  templateName?: string;
  quickReplyShortcut?: string;
  agentId?: string;
  status?: string;
  tag?: string;
}

interface Workflow {
  id: string;
  name: string;
  trigger: 'WHATSAPP_KEYWORD' | 'WHATSAPP_INBOUND' | 'WHATSAPP_LEAD_CREATED';
  conditions?: {
    keyword?: string;
    firstMessageOnly?: boolean;
    [key: string]: any;
  };
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TRIGGER_OPTIONS = [
  {
    id: 'WHATSAPP_KEYWORD',
    name: 'Keyword Match',
    description: 'Triggers when an incoming message contains a specific keyword or phrase',
    icon: Zap,
  },
  {
    id: 'WHATSAPP_INBOUND',
    name: 'First Incoming Message',
    description: 'Triggers when a customer messages your WhatsApp business for the first time',
    icon: MessageSquare,
  },
  {
    id: 'WHATSAPP_LEAD_CREATED',
    name: 'Lead / Contact Created',
    description: 'Triggers automatically when a new CRM lead or contact record is registered',
    icon: UserCheck,
  },
];

const ACTION_TYPE_OPTIONS = [
  { id: 'SEND_TEXT', label: 'Send Text Message', icon: MessageSquare },
  { id: 'SEND_TEMPLATE', label: 'Send Approved HSM Template', icon: FileText },
  { id: 'SEND_QUICK_REPLY', label: 'Send Canned Quick Reply', icon: Zap },
  { id: 'ASSIGN_AGENT', label: 'Assign to Agent', icon: UserCheck },
  { id: 'CHANGE_STATUS', label: 'Change Lead / Chat Status', icon: CheckCircle2 },
  { id: 'ADD_TAG', label: 'Add Contact Tag', icon: Tag },
];

export default function WhatsAppWorkflowsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    trigger: 'WHATSAPP_KEYWORD' as Workflow['trigger'],
    keyword: '',
    actions: [
      {
        type: 'SEND_TEXT' as WorkflowAction['type'],
        text: '',
        templateName: '',
        quickReplyShortcut: '',
        agentId: '',
        status: 'QUALIFIED',
        tag: '',
      },
    ],
  });

  const workflows = useQuery({
    queryKey: ['wa-workflows'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/workflows');
      return unwrap<Workflow[]>(res.data);
    },
  });

  const templates = useQuery({
    queryKey: ['wa-templates'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/templates');
      return unwrap<any[]>(res.data);
    },
  });

  const quickReplies = useQuery({
    queryKey: ['wa-quick-replies'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/quick-replies');
      return unwrap<any[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['wa-workflows'] });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/whatsapp/workflows/${id}/toggle`);
      return res.data;
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to toggle workflow');
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/whatsapp/workflows/${id}`);
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete workflow');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingWorkflow) {
        await api.patch(`/whatsapp/workflows/${editingWorkflow.id}`, payload);
      } else {
        await api.post('/whatsapp/workflows', payload);
      }
    },
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to save workflow');
    },
  });

  const openCreateModal = () => {
    setEditingWorkflow(null);
    setFormData({
      name: '',
      trigger: 'WHATSAPP_KEYWORD',
      keyword: '',
      actions: [
        {
          type: 'SEND_TEXT',
          text: '',
          templateName: (templates.data?.[0]?.name) || '',
          quickReplyShortcut: (quickReplies.data?.[0]?.shortcut) || '',
          agentId: '',
          status: 'QUALIFIED',
          tag: 'WhatsApp Lead',
        },
      ],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (wf: Workflow) => {
    setEditingWorkflow(wf);
    setFormData({
      name: wf.name,
      trigger: wf.trigger,
      keyword: wf.conditions?.keyword || '',
      actions: Array.isArray(wf.actions) && wf.actions.length > 0
        ? wf.actions.map(a => ({
            type: a.type || 'SEND_TEXT',
            text: a.text || '',
            templateName: a.templateName || '',
            quickReplyShortcut: a.quickReplyShortcut || '',
            agentId: a.agentId || '',
            status: a.status || 'QUALIFIED',
            tag: a.tag || '',
          }))
        : [{ type: 'SEND_TEXT', text: '', templateName: '', quickReplyShortcut: '', agentId: '', status: 'QUALIFIED', tag: '' }],
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingWorkflow(null);
    setFormError(null);
  };

  const handleAddAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          type: 'SEND_TEXT',
          text: '',
          templateName: (templates.data?.[0]?.name) || '',
          quickReplyShortcut: (quickReplies.data?.[0]?.shortcut) || '',
          agentId: '',
          status: 'QUALIFIED',
          tag: '',
        },
      ],
    }));
  };

  const handleRemoveAction = (index: number) => {
    if (formData.actions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const next = [...prev.actions];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, actions: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Workflow name is required.');
      return;
    }

    if (formData.trigger === 'WHATSAPP_KEYWORD' && !formData.keyword.trim()) {
      setFormError('Keyword is required for Keyword Match trigger.');
      return;
    }

    if (formData.actions.length === 0) {
      setFormError('At least one action is required.');
      return;
    }

    for (let i = 0; i < formData.actions.length; i++) {
      const act = formData.actions[i];
      if (act.type === 'SEND_TEXT' && !act.text?.trim()) {
        setFormError(`Action #${i + 1}: Message text is required for Send Text.`);
        return;
      }
      if (act.type === 'SEND_TEMPLATE' && !act.templateName?.trim()) {
        setFormError(`Action #${i + 1}: Template selection is required.`);
        return;
      }
      if (act.type === 'SEND_QUICK_REPLY' && !act.quickReplyShortcut?.trim()) {
        setFormError(`Action #${i + 1}: Quick Reply shortcut is required.`);
        return;
      }
      if (act.type === 'ADD_TAG' && !act.tag?.trim()) {
        setFormError(`Action #${i + 1}: Tag name is required.`);
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      trigger: formData.trigger,
      conditions: {
        keyword: formData.trigger === 'WHATSAPP_KEYWORD' ? formData.keyword.trim().toLowerCase() : undefined,
      },
      actions: formData.actions,
    };

    saveMutation.mutate(payload);
  };

  const renderTriggerBadge = (trigger: Workflow['trigger']) => {
    switch (trigger) {
      case 'WHATSAPP_KEYWORD':
        return <Badge tone="amber">Keyword Match</Badge>;
      case 'WHATSAPP_INBOUND':
        return <Badge tone="indigo">First Inbound</Badge>;
      case 'WHATSAPP_LEAD_CREATED':
        return <Badge tone="emerald">Lead Created</Badge>;
      default:
        return <Badge tone="gray">{trigger}</Badge>;
    }
  };

  return (
    <DashboardTemplate
      title="WhatsApp Workflows"
      subtitle="Automate WhatsApp auto-replies, keyword triggers, chatbots, and lead routing rules"
      actions={
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          New Workflow
        </Button>
      }
    >
      {workflows.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (workflows.data || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 mb-4">
            <GitBranch className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No WhatsApp workflows yet</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create automated auto-responders, template triggers, keyword dispatchers, and CRM routing workflows for your WhatsApp customer interactions.
          </p>
          <Button
            onClick={openCreateModal}
            tone="primary"
            className="mt-5"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create First Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(workflows.data || []).map((wf) => (
            <Card
              key={wf.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition hover:border-brand-500/40"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 shrink-0">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {wf.name}
                      </h3>
                      {renderTriggerBadge(wf.trigger)}
                      <Badge tone={wf.isActive ? 'green' : 'gray'}>
                        {wf.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>
                        Trigger:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {wf.trigger === 'WHATSAPP_KEYWORD'
                            ? `Contains "${wf.conditions?.keyword || ''}"`
                            : wf.trigger === 'WHATSAPP_INBOUND'
                            ? 'First message received'
                            : 'New CRM Lead created'}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Updated {new Date(wf.updatedAt || wf.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions summary pill stream */}
                <div className="flex flex-wrap items-center gap-2 pl-12">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Actions:
                  </span>
                  {(wf.actions || []).map((act, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {act.type === 'SEND_TEXT' && <MessageSquare className="h-3 w-3 text-brand-400" />}
                      {act.type === 'SEND_TEMPLATE' && <FileText className="h-3 w-3 text-teal-400" />}
                      {act.type === 'SEND_QUICK_REPLY' && <Zap className="h-3 w-3 text-amber-400" />}
                      {act.type === 'ASSIGN_AGENT' && <UserCheck className="h-3 w-3 text-indigo-400" />}
                      {act.type === 'CHANGE_STATUS' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                      {act.type === 'ADD_TAG' && <Tag className="h-3 w-3 text-purple-400" />}
                      <span className="font-medium">
                        {act.type === 'SEND_TEXT' && (act.text ? `Send: "${act.text.slice(0, 20)}..."` : 'Send Text')}
                        {act.type === 'SEND_TEMPLATE' && `HSM: ${act.templateName || 'Template'}`}
                        {act.type === 'SEND_QUICK_REPLY' && `Reply: ${act.quickReplyShortcut || 'Quick'}`}
                        {act.type === 'ASSIGN_AGENT' && `Assign: ${act.agentId || 'Agent'}`}
                        {act.type === 'CHANGE_STATUS' && `Status: ${act.status}`}
                        {act.type === 'ADD_TAG' && `Tag: ${act.tag}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {/* Active Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate(wf.id)}
                  disabled={toggleMutation.isPending}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    wf.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle workflow activation"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      wf.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                <button
                  onClick={() => openEditModal(wf)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition"
                  title="Edit Workflow"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete workflow "${wf.name}"?`)) {
                      deleteMutation.mutate(wf.id);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition"
                  title="Delete Workflow"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Global Shared Modal for Create / Edit Workflow */}
      {modalOpen && (
        <Modal
          title={editingWorkflow ? 'Edit WhatsApp Workflow' : 'Create WhatsApp Workflow'}
          description="Build enterprise automation rules, auto-replies, and assignment logic."
          onClose={closeModal}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Workflow Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Inbound Pricing Auto-Responder & Routing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Trigger Event <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TRIGGER_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = formData.trigger === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, trigger: opt.id as Workflow['trigger'] })}
                      className={`flex flex-col text-left p-3 rounded-xl border transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 text-brand-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {opt.name}
                        </span>
                      </div>
                      <p className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Configuration (e.g. keyword input) */}
            {formData.trigger === 'WHATSAPP_KEYWORD' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-700 dark:text-amber-300">
                  Target Keyword or Phrase <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., pricing, demo, quote, support"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Matches when customer message body contains this keyword (case-insensitive).
                </p>
              </div>
            )}

            {/* Action Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Execution Actions ({formData.actions.length}) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="flex items-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-400"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Action
                </button>
              </div>

              {formData.actions.map((act, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-500">
                        {index + 1}
                      </span>
                      <select
                        value={act.type}
                        onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        {ACTION_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAction(index)}
                        className="text-slate-400 hover:text-rose-500 transition"
                        title="Remove Action"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Action Specific Fields */}
                  {act.type === 'SEND_TEXT' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Outbound Message Body
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Hello! Thanks for reaching out. An agent will contact you shortly."
                        value={act.text}
                        onChange={(e) => handleActionChange(index, 'text', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {act.type === 'SEND_TEMPLATE' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Select Approved Meta HSM Template
                      </label>
                      <select
                        value={act.templateName}
                        onChange={(e) => handleActionChange(index, 'templateName', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        {(templates.data || []).map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.category} - {t.status})
                          </option>
                        ))}
                        {(!templates.data || templates.data.length === 0) && (
                          <option value="">No templates found</option>
                        )}
                      </select>
                    </div>
                  )}

                  {act.type === 'SEND_QUICK_REPLY' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Select Canned Quick Reply
                      </label>
                      <select
                        value={act.quickReplyShortcut}
                        onChange={(e) => handleActionChange(index, 'quickReplyShortcut', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                      >
                        {(quickReplies.data || []).map((qr) => (
                          <option key={qr.id} value={qr.shortcut}>
                            {qr.shortcut} - {qr.title}
                          </option>
                        ))}
                        {(!quickReplies.data || quickReplies.data.length === 0) && (
                          <option value="">No quick replies found</option>
                        )}
                      </select>
                    </div>
                  )}

                  {act.type === 'ASSIGN_AGENT' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Agent Identifier / Email
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., sales@company.com or agent ID"
                        value={act.agentId}
                        onChange={(e) => handleActionChange(index, 'agentId', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {act.type === 'CHANGE_STATUS' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Target Status
                      </label>
                      <select
                        value={act.status}
                        onChange={(e) => handleActionChange(index, 'status', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="QUALIFIED">Qualified</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="CLOSED">Closed / Resolved</option>
                      </select>
                    </div>
                  )}

                  {act.type === 'ADD_TAG' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., VIP, High Intent, WhatsApp Lead"
                        value={act.tag}
                        onChange={(e) => handleActionChange(index, 'tag', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" tone="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                tone="primary"
                disabled={saveMutation.isPending}
                loading={saveMutation.isPending}
              >
                {editingWorkflow ? 'Update Workflow' : 'Save Workflow'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
