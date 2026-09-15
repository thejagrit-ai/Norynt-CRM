'use client';
// app/(dashboard)/whatsapp/page.tsx — Enterprise WhatsApp Omnichannel Conversational Inbox
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  UserCheck,
  ShieldAlert,
  Search,
  Zap,
  FileText,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  RefreshCw,
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
import { WhatsAppWebhookModal } from '@/components/organisms/WhatsAppWebhookModal';
import { Plus, User } from 'lucide-react';

interface Conversation {
  phone: string;
  lastBody: string;
  lastAt: string;
  lastDirection: string;
  count: number;
  leadId: string | null;
  contactId: string | null;
}

interface Message {
  id: string;
  direction: 'IN' | 'OUT';
  body: string;
  status: string;
  createdAt: string;
}

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  body: string;
  category: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  headerType: string;
  headerContent?: string;
  bodyContent: string;
  footerContent?: string;
  buttons?: Array<{ type: string; text: string; url?: string }>;
  status: string;
}

export default function WhatsAppInboxPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickReplyPopover, setShowQuickReplyPopover] = useState(false);
  const [quickReplyFilter, setQuickReplyFilter] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState<string | null>(null);

  // New Chat & Setup Modals
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries
  const status = useQuery({
    queryKey: ['wa-status'],
    queryFn: async () =>
      unwrap<{ connected: boolean; phoneNumberId?: string; businessAccountId?: string }>(
        (await api.get('/whatsapp/status')).data,
      ),
  });

  const conversations = useQuery({
    queryKey: ['wa-conversations'],
    queryFn: async () =>
      unwrap<Conversation[]>((await api.get('/whatsapp/conversations')).data),
    refetchInterval: 12_000,
  });

  const thread = useQuery({
    queryKey: ['wa-thread', selectedPhone],
    enabled: !!selectedPhone,
    queryFn: async () =>
      unwrap<Message[]>((await api.get(`/whatsapp/thread/${selectedPhone}`)).data),
    refetchInterval: 8_000,
  });

  const quickReplies = useQuery({
    queryKey: ['wa-quick-replies'],
    queryFn: async () =>
      unwrap<QuickReply[]>((await api.get('/whatsapp/quick-replies')).data),
  });

  const templates = useQuery({
    queryKey: ['wa-templates'],
    queryFn: async () =>
      unwrap<WhatsAppTemplate[]>((await api.get('/whatsapp/templates')).data),
  });

  // Auto scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.data]);

  // Handle composer input & Quick Reply '/' detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReply(val);

    if (val.startsWith('/')) {
      setShowQuickReplyPopover(true);
      setQuickReplyFilter(val.slice(1).toLowerCase());
    } else {
      setShowQuickReplyPopover(false);
    }
  };

  const insertQuickReply = (qr: QuickReply) => {
    setReply(qr.body);
    setShowQuickReplyPopover(false);
    inputRef.current?.focus();
  };

  // Mutations
  const sendMutation = useMutation({
    mutationFn: async (payload: { to: string; body: string }) => {
      setSendError(null);
      const res = await api.post('/whatsapp/send', payload);
      return res.data;
    },
    onSuccess: () => {
      setReply('');
      qc.invalidateQueries({ queryKey: ['wa-thread', selectedPhone] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
    onError: (err: any) => {
      setSendError(err?.response?.data?.message || 'Failed to dispatch WhatsApp message.');
    },
  });

  const sendTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !selectedPhone) return;
      // Interpolate variables into template body
      let resolvedBody = selectedTemplate.bodyContent;
      Object.entries(templateVars).forEach(([key, val]) => {
        resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || `[${key}]`);
      });

      return api.post('/whatsapp/send', {
        to: selectedPhone,
        body: resolvedBody,
        templateName: selectedTemplate.name,
      });
    },
    onSuccess: () => {
      setTemplateModalOpen(false);
      setSelectedTemplate(null);
      setTemplateVars({});
      qc.invalidateQueries({ queryKey: ['wa-thread', selectedPhone] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Failed to send template message.');
    },
  });

  // Filter conversations
  const filteredConversations = (conversations.data || []).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.phone.toLowerCase().includes(q) ||
      c.lastBody.toLowerCase().includes(q)
    );
  });

  // Filter quick replies in popover
  const filteredQuickReplies = (quickReplies.data || []).filter((qr) => {
    if (!quickReplyFilter) return true;
    return (
      qr.shortcut.toLowerCase().includes(quickReplyFilter) ||
      qr.title.toLowerCase().includes(quickReplyFilter) ||
      qr.body.toLowerCase().includes(quickReplyFilter)
    );
  });

  // Helper to open template modal
  const openTemplateSender = () => {
    const defaultTpl = (templates.data || []).find((t) => t.status === 'APPROVED') || templates.data?.[0];
    if (defaultTpl) {
      setSelectedTemplate(defaultTpl);
      // parse variables e.g. {{1}}, {{2}}
      const matches = defaultTpl.bodyContent.match(/\{\{(\d+)\}\}/g) || [];
      const initVars: Record<string, string> = {};
      matches.forEach((m) => {
        const num = m.replace(/[\{\}]/g, '');
        initVars[num] = '';
      });
      setTemplateVars(initVars);
    }
    setTemplateModalOpen(true);
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplate(tpl);
    const matches = tpl.bodyContent.match(/\{\{(\d+)\}\}/g) || [];
    const initVars: Record<string, string> = {};
    matches.forEach((m) => {
      const num = m.replace(/[\{\}]/g, '');
      initVars[num] = '';
    });
    setTemplateVars(initVars);
  };

  return (
    <DashboardTemplate
      title="WhatsApp Omnichannel Hub"
      subtitle="Official Meta Cloud API live messaging, automated workflows, and verified webhooks"
      actions={
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setNewChatModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Button>

          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ['wa-conversations'] });
              if (selectedPhone) qc.invalidateQueries({ queryKey: ['wa-thread', selectedPhone] });
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
            title="Refresh conversations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <WhatsAppNavHeader onOpenSetup={() => setSetupModalOpen(true)} />

      {/* Connection Notice banner if disconnected */}
      {status.data && !status.data.connected && (
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Meta WhatsApp Cloud API Configuration Required</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Connect your Meta App Token & Phone Number ID to send and receive live customer chats.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSetupModalOpen(true)}
            className="shrink-0 font-bold underline text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white"
          >
            Configure Connection & Webhook →
          </button>
        </div>
      )}

      {conversations.isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[42rem] max-h-[calc(100vh-14rem)]">
          {/* Left Panel: Conversation List */}
          <div
            className={`lg:col-span-4 xl:col-span-4 flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-sm ${
              selectedPhone ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Header & Search */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Inbox ({(conversations.data || []).length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewChatModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Chat</span>
                  </button>
                  <Badge tone="gray">Realtime</Badge>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search phone or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No conversations yet</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                    Inbound customer WhatsApp messages will appear here in real-time.
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = selectedPhone === c.phone;
                  return (
                    <button
                      key={c.phone}
                      type="button"
                      onClick={() => setSelectedPhone(c.phone)}
                      className={`w-full rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? 'bg-brand-500/10 border border-brand-500/30 shadow-sm'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            +{c.phone}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.lastAt
                            ? new Date(c.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pl-9">
                        <p className="flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {c.lastDirection === 'OUT' ? '↗ ' : '↘ '}
                          {c.lastBody || 'Message'}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.leadId && <Badge tone="emerald">Lead</Badge>}
                          {c.contactId && <Badge tone="indigo">Contact</Badge>}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Thread */}
          <div
            className={`lg:col-span-8 xl:col-span-8 flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-sm ${
              !selectedPhone ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {!selectedPhone ? (
              <div className="m-auto flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 mb-4">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Select a conversation to start messaging
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Review customer chat history, dispatch HSM templates, or use canned quick replies.
                </p>
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPhone(null)}
                      className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-xs">
                      WA
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          +{selectedPhone}
                        </span>
                        <Badge tone="emerald" dot>Live Session</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Official Meta WhatsApp Cloud API Stream
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      tone="secondary"
                      onClick={openTemplateSender}
                      leftIcon={<FileText className="h-3.5 w-3.5" />}
                    >
                      Send HSM
                    </Button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                  {thread.isLoading ? (
                    <div className="flex h-48 items-center justify-center">
                      <Spinner size="md" />
                    </div>
                  ) : (thread.data || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
                      <p className="text-xs">No messages recorded in this conversation yet.</p>
                    </div>
                  ) : (
                    (thread.data || []).map((m) => {
                      const isOut = m.direction === 'OUT';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                              isOut
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.body}</p>

                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${
                                isOut ? 'text-emerald-100' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isOut && (
                                <span>
                                  {m.status === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-cyan-200 inline" />
                                  ) : m.status === 'delivered' ? (
                                    <CheckCheck className="h-3 w-3 text-emerald-200 inline" />
                                  ) : m.status === 'failed' ? (
                                    <span className="text-rose-200 font-bold">Failed</span>
                                  ) : (
                                    <Check className="h-3 w-3 text-emerald-200 inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Reply Auto-Complete Popover */}
                {showQuickReplyPopover && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-lg">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Quick Replies (Type to filter)</span>
                      <button
                        onClick={() => setShowQuickReplyPopover(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕ Esc
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 mt-1">
                      {filteredQuickReplies.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          <p>No quick replies configured for this query.</p>
                          <Link
                            href="/whatsapp/quick-replies"
                            className="text-brand-500 underline font-bold mt-1 inline-block"
                          >
                            Create Quick Reply →
                          </Link>
                        </div>
                      ) : (
                        filteredQuickReplies.map((qr) => (
                          <button
                            key={qr.id}
                            type="button"
                            onClick={() => insertQuickReply(qr)}
                            className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                                {qr.shortcut}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {qr.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              {qr.body}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Send Error Notice */}
                {sendError && (
                  <div className="flex items-center justify-between px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-xs text-rose-500">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{sendError}</span>
                    </div>
                    <button onClick={() => setSendError(null)} className="font-bold">
                      ✕
                    </button>
                  </div>
                )}

                {/* Composer Footer */}
                {can('whatsapp.send') && (
                  <div className="border-t border-slate-200 dark:border-slate-800/80 p-3 bg-white dark:bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        value={reply}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowQuickReplyPopover(false);
                          }
                          if (e.key === 'Enter' && reply.trim() && !sendMutation.isPending && !showQuickReplyPopover) {
                            sendMutation.mutate({ to: selectedPhone, body: reply });
                          }
                        }}
                        placeholder="Type a message... (Type / for quick replies)"
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-brand-500"
                      />

                      <Button
                        onClick={() => sendMutation.mutate({ to: selectedPhone, body: reply })}
                        disabled={sendMutation.isPending || !reply.trim()}
                        loading={sendMutation.isPending}
                        tone="primary"
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* HSM Template Sender Modal */}
      {templateModalOpen && (
        <Modal
          title="Send WhatsApp HSM Template"
          description="Dispatch an official pre-approved Meta HSM template to this active thread."
          onClose={() => setTemplateModalOpen(false)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Approved Template
              </label>
              <select
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const tpl = (templates.data || []).find((t) => t.id === e.target.value);
                  if (tpl) handleSelectTemplate(tpl);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                {(templates.data || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category} - {t.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <>
                {/* Template Variables */}
                {Object.keys(templateVars).length > 0 && (
                  <div className="space-y-2.5 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5">
                    <label className="block text-xs font-bold text-teal-700 dark:text-teal-300">
                      Template Parameters / Variables
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.keys(templateVars).map((varKey) => (
                        <div key={varKey}>
                          <label className="block text-[11px] font-mono text-slate-500 mb-1">
                            Variable &#123;&#123;{varKey}&#125;&#125;
                          </label>
                          <input
                            type="text"
                            placeholder={`Value for {{${varKey}}}`}
                            value={templateVars[varKey] || ''}
                            onChange={(e) =>
                              setTemplateVars({ ...templateVars, [varKey]: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Bubble Preview */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Live Preview</label>
                  <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/30 p-4 text-xs shadow-inner">
                    {selectedTemplate.headerContent && (
                      <p className="font-bold text-slate-200 mb-1.5 border-b border-emerald-800/20 pb-1">
                        {selectedTemplate.headerContent}
                      </p>
                    )}
                    <p className="text-slate-300 whitespace-pre-wrap">
                      {selectedTemplate.bodyContent.replace(
                        /\{\{(\d+)\}\}/g,
                        (_, num) => templateVars[num] || `{{${num}}}`,
                      )}
                    </p>
                    {selectedTemplate.footerContent && (
                      <p className="mt-2 text-[10px] text-slate-500 italic">
                        {selectedTemplate.footerContent}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" tone="secondary" onClick={() => setTemplateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                tone="primary"
                onClick={() => sendTemplateMutation.mutate()}
                disabled={sendTemplateMutation.isPending || !selectedTemplate}
                loading={sendTemplateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                Dispatch Template
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Conversation Modal */}
      {newChatModalOpen && (
        <Modal
          title="Start New WhatsApp Conversation"
          onClose={() => {
            setNewChatModalOpen(false);
            setNewChatPhone('');
            setNewChatMessage('');
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000 or 919876543210"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enter phone number with country code (e.g. +919876543210, +15551234567).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Initial Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Type your message..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                tone="secondary"
                onClick={() => {
                  setNewChatModalOpen(false);
                  setNewChatPhone('');
                  setNewChatMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!newChatPhone.trim() || !newChatMessage.trim()) return;
                  try {
                    await sendMutation.mutateAsync({
                      to: newChatPhone.trim(),
                      body: newChatMessage.trim(),
                    });
                    setSelectedPhone(newChatPhone.replace(/[^\d]/g, ''));
                    setNewChatModalOpen(false);
                    setNewChatPhone('');
                    setNewChatMessage('');
                  } catch {}
                }}
                disabled={sendMutation.isPending || !newChatPhone.trim() || !newChatMessage.trim()}
                loading={sendMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send & Open Chat</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Webhook & Setup Modal */}
      {setupModalOpen && (
        <WhatsAppWebhookModal onClose={() => setSetupModalOpen(false)} />
      )}
    </DashboardTemplate>
  );
}
