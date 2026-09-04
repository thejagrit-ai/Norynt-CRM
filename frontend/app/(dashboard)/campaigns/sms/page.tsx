'use client';
// app/(dashboard)/campaigns/sms/page.tsx — SMS Campaigns Management (Matching Reference Screenshot 3)
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Smartphone,
  Plus,
  Send,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { SmsCampaignWizardModal } from '@/components/organisms/SmsCampaignWizardModal';
import { Modal } from '@/components/molecules/Modal';

interface SmsCampaign {
  id: string;
  name: string;
  senderId: string;
  message: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'COMPLETED' | 'CANCELLED';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export default function SmsCampaignsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewingCampaign, setPreviewingCampaign] = useState<SmsCampaign | null>(null);
  const pageSize = 10;

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-sms'],
    queryFn: async () => {
      const res = await api.get('/campaigns/sms');
      return unwrap<SmsCampaign[]>(res.data);
    },
  });

  const allCampaigns = useMemo(() => campaignsQuery.data || [], [campaignsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/sms/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['campaigns-sms'] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/campaigns/sms/${id}/send`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['campaigns-sms'] });
    },
  });

  const filteredCampaigns = useMemo(() => {
    return allCampaigns.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.message || '').toLowerCase().includes(q)
      );
    });
  }, [allCampaigns, searchQuery]);

  const totalResults = filteredCampaigns.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage, pageSize]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardTemplate
      title="SMS Campaigns"
      subtitle="Create and send bulk SMS campaigns to your audience"
      actions={
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsWizardOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Campaign
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Table Container (Matching Screenshot 3) */}
        {/* Table Container */}
        <Card className="p-0 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-5 font-semibold">CAMPAIGN</th>
                  <th className="py-4 px-5 font-semibold">STATUS</th>
                  <th className="py-4 px-5 font-semibold">RECIPIENTS</th>
                  <th className="py-4 px-5 font-semibold">SENT</th>
                  <th className="py-4 px-5 font-semibold">CREATED</th>
                  <th className="py-4 px-5 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-600">
                {paginatedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                      <p className="text-sm font-semibold text-slate-800">No SMS campaigns found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click &quot;New Campaign&quot; above to create your first broadcast.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCampaigns.map((camp) => {
                    const isCompleted =
                      camp.status === 'COMPLETED' || camp.status === 'SENT';
                    const isSending = camp.status === 'SENDING';
                    const isScheduled = camp.status === 'SCHEDULED';

                    return (
                      <tr
                        key={camp.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => setPreviewingCampaign(camp)}
                      >
                        {/* CAMPAIGN NAME */}
                        <td className="py-4 px-5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {camp.name}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isSending
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isScheduled
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-500'
                                  : isSending
                                  ? 'bg-blue-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{camp.status.toLowerCase()}</span>
                          </span>
                        </td>

                        {/* RECIPIENTS */}
                        <td className="py-4 px-5 font-semibold text-slate-800">
                          {camp.totalRecipients || camp.sentCount || 1}
                        </td>

                        {/* SENT */}
                        <td className="py-4 px-5 font-semibold text-slate-800">
                          {camp.sentCount}
                        </td>

                        {/* CREATED */}
                        <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                          {formatDate(camp.createdAt)}
                        </td>

                        {/* ACTIONS */}
                        <td
                          className="py-4 px-5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === camp.id ? null : camp.id)
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === camp.id && (
                              <div
                                className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewingCampaign(camp);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Message</span>
                                </button>
                                {!isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sendMutation.mutate(camp.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Dispatch Now</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteMutation.mutate(camp.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Campaign</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
            <div>
              Showing{' '}
              <strong className="text-slate-800">
                {totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(currentPage * pageSize, totalResults)}
              </strong>{' '}
              of <strong className="text-slate-800">{totalResults}</strong> results
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* 4-Step SMS Wizard Modal */}
        {isWizardOpen && (
          <SmsCampaignWizardModal onClose={() => setIsWizardOpen(false)} />
        )}

        {/* Preview Details Modal */}
        {previewingCampaign && (
          <Modal
            title={previewingCampaign.name}
            description={`Sender ID: ${previewingCampaign.senderId}`}
            onClose={() => setPreviewingCampaign(null)}
            maxWidth="max-w-md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {previewingCampaign.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sent / Delivered</span>
                  <span className="font-semibold text-white">
                    {previewingCampaign.sentCount} sent
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created Date</span>
                  <span className="font-semibold text-white">
                    {formatDate(previewingCampaign.createdAt)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1.5">SMS Message Body</span>
                <p className="text-xs font-mono text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
                  {previewingCampaign.message}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <Button tone="secondary" onClick={() => setPreviewingCampaign(null)}>
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
