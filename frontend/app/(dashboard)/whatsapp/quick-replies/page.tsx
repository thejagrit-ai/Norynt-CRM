'use client';
// app/(dashboard)/whatsapp/quick-replies/page.tsx — Chat Canned Responses & Quick Replies
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Check,
  Search,
  AlertCircle,
  MessageSquare,
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

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

export default function QuickRepliesPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    shortcut: '/support',
    title: '',
    body: '',
    category: 'General',
  });

  const replies = useQuery({
    queryKey: ['wa-quick-replies'],
    queryFn: async () => {
      const res = await api.get('/whatsapp/quick-replies');
      return unwrap<QuickReply[]>(res.data);
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['wa-quick-replies'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      setFormError(null);
      if (editing) {
        return api.patch(`/whatsapp/quick-replies/${editing.id}`, payload);
      } else {
        return api.post('/whatsapp/quick-replies', payload);
      }
    },
    onSuccess: () => {
      invalidate();
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to save quick reply shortcut.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/whatsapp/quick-replies/${id}`);
    },
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to delete quick reply.');
    },
  });

  const openCreateModal = () => {
    setEditing(null);
    setFormData({
      shortcut: '/',
      title: '',
      body: '',
      category: 'General',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (qr: QuickReply) => {
    setEditing(qr);
    setFormData({
      shortcut: qr.shortcut,
      title: qr.title,
      body: qr.body,
      category: qr.category || 'General',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let cleanShortcut = formData.shortcut.trim();
    if (!cleanShortcut.startsWith('/')) {
      cleanShortcut = `/${cleanShortcut}`;
    }

    if (cleanShortcut.length < 2) {
      setFormError('Shortcut must be at least 2 characters starting with / (e.g., /pricing).');
      return;
    }

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    if (!formData.body.trim()) {
      setFormError('Canned message body is required.');
      return;
    }

    saveMutation.mutate({
      ...formData,
      shortcut: cleanShortcut,
    });
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredReplies = (replies.data || []).filter((qr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      qr.shortcut.toLowerCase().includes(q) ||
      qr.title.toLowerCase().includes(q) ||
      qr.body.toLowerCase().includes(q) ||
      qr.category.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardTemplate
      title="Quick Replies"
      subtitle="Keyboard shortcuts and canned responses for fast agent resolution in WhatsApp chats"
      actions={
        <Button
          onClick={openCreateModal}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
          className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-sm"
        >
          New Quick Reply
        </Button>
      }
    >
      <WhatsAppNavHeader />
      {/* Search Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search shortcuts, titles, or canned bodies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {replies.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (replies.data || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-12 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No quick replies configured</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create keyboard shortcuts (e.g. <code className="text-amber-500 font-mono font-bold">/pricing</code>) to enable lightning-fast agent answers in the WhatsApp inbox.
          </p>
          <Button
            onClick={openCreateModal}
            tone="primary"
            className="mt-5"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create First Quick Reply
          </Button>
        </div>
      ) : filteredReplies.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No quick replies match your search query &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReplies.map((qr) => (
            <Card
              key={qr.id}
              className="flex flex-col justify-between border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 p-5 backdrop-blur-xl transition hover:border-brand-500/40 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                    {qr.shortcut}
                  </span>
                  <Badge tone="gray">{qr.category}</Badge>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-3">
                  {qr.title}
                </h3>

                <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/80 font-sans leading-relaxed whitespace-pre-wrap">
                  {qr.body}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
                <button
                  onClick={() => copyText(qr.id, qr.body)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold"
                >
                  {copiedId === qr.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Snippet
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(qr)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete quick reply "${qr.shortcut}"?`)) {
                        deleteMutation.mutate(qr.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Global Shared Modal for Create / Edit Quick Reply */}
      {modalOpen && (
        <Modal
          title={editing ? 'Edit Quick Reply' : 'Create Quick Reply'}
          description="Define a slash shortcut trigger and reusable canned reply."
          onClose={closeModal}
          maxWidth="max-w-lg"
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
                Shortcut Trigger (e.g. /pricing, /intro, /hours) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="/shortcut"
                value={formData.shortcut}
                onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Title / Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Enterprise Pricing Table"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g., Sales, Support, Onboarding"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Canned Message Body <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Text to auto-insert when shortcut is typed..."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
              />
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
                {editing ? 'Update Quick Reply' : 'Save Quick Reply'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
