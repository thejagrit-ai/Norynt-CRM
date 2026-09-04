'use client';
// app/(dashboard)/tickets/page.tsx — Enterprise Customer Support & Helpdesk Workspace with full i18n.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  Plus,
  Send,
  User,
  Building2,
  X,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Ticket, Paginated } from '@/types';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/molecules/Modal';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';

export default function TicketsPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', filterStatus],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (filterStatus !== 'ALL') params.status = filterStatus;
      const res = await api.get('/tickets', { params });
      return unwrap<Paginated<Ticket>>(res.data);
    },
  });

  const { data: ticketDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['ticket-detail', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return null;
      const res = await api.get(`/tickets/${selectedTicket.id}`);
      return unwrap<Ticket>(res.data);
    },
    enabled: !!selectedTicket?.id,
  });

  const addMessage = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api.post(`/tickets/${id}/messages`, { body }),
    onSuccess: () => {
      setReplyText('');
      refetchDetail();
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tickets/${id}`, { status }),
    onSuccess: () => {
      refetchDetail();
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const tickets = data?.data ?? [];

  const openCount = tickets.filter((tk) => tk.status === 'OPEN').length;
  const urgentCount = tickets.filter((tk) => tk.priority === 'URGENT' || tk.priority === 'HIGH').length;
  const resolvedCount = tickets.filter((tk) => tk.status === 'RESOLVED' || tk.status === 'CLOSED').length;

  return (
    <DashboardTemplate title={t('page.tickets')}>
      <div className="space-y-6">

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('tickets.total')}</p>
          <p className="text-2xl font-black text-white mt-1">{tickets.length}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{t('tickets.open')}</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{openCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">{t('tickets.urgent')}</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{urgentCount}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{t('tickets.resolved')}</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: t('tickets.tabAll') },
          { key: 'OPEN', label: t('tickets.tabOpen') },
          { key: 'PENDING', label: t('tickets.tabPending') },
          { key: 'RESOLVED', label: t('tickets.tabResolved') },
          { key: 'CLOSED', label: t('tickets.tabClosed') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterStatus === tab.key
                ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20">
          <LifeBuoy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">{t('tickets.empty')}</h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-brand-500/50 cursor-pointer transition group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 text-amber-400 shrink-0">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-400">{ticket.number}</span>
                    <span className="text-sm font-semibold text-slate-100 truncate">{ticket.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    {ticket.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {ticket.company.name}
                      </span>
                    )}
                    {ticket.contact && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.contact.firstName} {ticket.contact.lastName}
                      </span>
                    )}
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <Badge tone={ticket.status === 'RESOLVED' ? 'green' : ticket.status === 'OPEN' ? 'amber' : 'gray'}>
                  {ticket.status}
                </Badge>
                <Badge tone={ticket.priority === 'URGENT' ? 'red' : ticket.priority === 'HIGH' ? 'amber' : 'gray'}>
                  {ticket.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Details & Chat Modal */}
      {selectedTicket && (
        <Modal
          title={`#${selectedTicket.number} — ${selectedTicket.subject}`}
          onClose={() => setSelectedTicket(null)}
          maxWidth="max-w-2xl"
          footer={
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyText.trim()) return;
                addMessage.mutate({ id: selectedTicket.id, body: replyText });
              }}
              className="flex items-center gap-2.5"
            >
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('tickets.replyPlaceholder') || 'Type a reply...'}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
              />
              <Button size="sm" type="submit" loading={addMessage.isPending}>
                <Send className="h-3.5 w-3.5" />
                <span>{t('tickets.replyBtn') || 'Reply'}</span>
              </Button>
            </form>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Status:
              </span>
              <select
                value={ticketDetail?.status ?? selectedTicket.status}
                onChange={(e) =>
                  updateStatus.mutate({ id: selectedTicket.id, status: e.target.value })
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
              >
                <option value="OPEN">{t('tickets.tabOpen') || 'Open'}</option>
                <option value="PENDING">{t('tickets.tabPending') || 'Pending'}</option>
                <option value="RESOLVED">{t('tickets.tabResolved') || 'Resolved'}</option>
                <option value="CLOSED">{t('tickets.tabClosed') || 'Closed'}</option>
              </select>
            </div>

            {/* Ticket Initial Description */}
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{t('tickets.descTitle') || 'Initial Description'}</span>
                <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap dark:text-slate-200">
                {selectedTicket.description}
              </p>
            </div>

            {/* Conversation Stream */}
            <div className="space-y-3">
              {ticketDetail?.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl space-y-1 ${
                    msg.senderType === 'AGENT'
                      ? 'border border-brand-500/20 bg-brand-50/50 dark:bg-brand-950/20 ml-6'
                      : 'border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className={msg.senderType === 'AGENT' ? 'text-brand-600 dark:text-brand-300 font-bold' : ''}>
                      {msg.senderType === 'AGENT' ? 'Support Agent' : 'Customer'}
                    </span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed dark:text-slate-200">{msg.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
      </div>
    </DashboardTemplate>
  );
}
