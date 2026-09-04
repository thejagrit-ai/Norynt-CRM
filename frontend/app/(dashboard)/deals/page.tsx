'use client';
// app/(dashboard)/deals/page.tsx — Premium Sales Deals command center with Table/Kanban views, live KPI banner, search & filters.
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Kanban,
  Table as TableIcon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  Briefcase,
  User,
  Calendar,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Select, type SelectOption } from '@/components/atoms/Select';
import { DealsBoard } from '@/components/organisms/DealsBoard';
import { DealModal } from '@/components/organisms/DealModal';
import { formatCurrency, num } from '@/components/molecules/DashboardCards';
import type { Board, Deal } from '@/types';

export default function DealsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  // View state: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Fetch Board & Deals
  const boardQuery = useQuery({
    queryKey: ['board'],
    queryFn: async () => {
      const res = await api.get('/deals/board');
      return unwrap<Board>(res.data);
    },
  });

  const dealsQuery = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const res = await api.get('/deals', { params: { limit: 100 } });
      return unwrap<Deal[]>(res.data);
    },
  });

  const board = boardQuery.data;

  // Flatten board deals if direct deals query is empty
  const allDeals = useMemo(() => {
    const rawDeals = dealsQuery.data || [];
    if (rawDeals.length > 0) return rawDeals;
    if (!board?.stages) return [];
    return board.stages.flatMap((st) =>
      (st.deals || []).map((d) => ({
        ...d,
        stage: { id: st.id, name: st.name, isWon: st.isWon, isLost: st.isLost },
      }))
    );
  }, [dealsQuery.data, board]);

  // Stage Map for easy lookup
  const stageMap = useMemo(() => {
    const map = new Map<string, { name: string; isWon?: boolean; isLost?: boolean }>();
    if (board?.stages) {
      board.stages.forEach((st) => {
        map.set(st.id, { name: st.name, isWon: st.isWon, isLost: st.isLost });
      });
    }
    return map;
  }, [board]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalDeals = allDeals.length;
    let totalValue = 0;
    let wonCount = 0;

    allDeals.forEach((d) => {
      const val = num(d.value);
      totalValue += val;
      const st = stageMap.get(d.stageId);
      if (d.status === 'WON' || st?.isWon) {
        wonCount += 1;
      }
    });

    const winRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;

    return {
      totalDeals,
      totalValue,
      wonCount,
      winRate,
    };
  }, [allDeals, stageMap]);

  // Filtered & Searched Deals
  const filteredDeals = useMemo(() => {
    return allDeals.filter((d) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (d.title || '').toLowerCase().includes(query);
        const matchCompany = (d.company || '').toLowerCase().includes(query);
        const matchContact = (d.contactName || '').toLowerCase().includes(query);
        if (!matchTitle && !matchCompany && !matchContact) return false;
      }

      // Stage Filter
      if (selectedStage !== 'all' && d.stageId !== selectedStage) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all') {
        const st = stageMap.get(d.stageId);
        const isWon = d.status === 'WON' || st?.isWon;
        const isLost = d.status === 'LOST' || st?.isLost;
        const status = isWon ? 'won' : isLost ? 'lost' : 'open';
        if (status !== selectedStatus) return false;
      }

      return true;
    });
  }, [allDeals, searchQuery, selectedStage, selectedStatus, stageMap]);

  // Pagination
  const totalResults = filteredDeals.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDeals.slice(start, start + pageSize);
  }, [filteredDeals, currentPage, pageSize]);

  // Inline Stage Move Mutation
  const moveMutation = useMutation({
    mutationFn: async ({ dealId, toStageId }: { dealId: string; toStageId: string }) => {
      await api.patch(`/deals/${dealId}/move`, { toStageId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] });
      void qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  // Delete Deal Mutation
  const deleteMutation = useMutation({
    mutationFn: async (dealId: string) => {
      await api.delete(`/deals/${dealId}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] });
      void qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const handleOpenAddModal = () => {
    setEditingDeal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setIsModalOpen(true);
  };

  const formatStagePill = (stageId: string, status?: string) => {
    const st = stageMap.get(stageId);
    const name = st?.name || 'New Deal';
    const isWon = status === 'WON' || st?.isWon;
    const isLost = status === 'LOST' || st?.isLost;

    if (isWon) {
      return {
        label: 'Closed Won',
        tone: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    }
    if (isLost) {
      return {
        label: 'Closed Lost',
        tone: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    }
    if (name.toLowerCase().includes('proposal')) {
      return {
        label: 'Proposal Sent',
        tone: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      };
    }
    if (name.toLowerCase().includes('demo')) {
      return {
        label: 'Product Demo',
        tone: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    }
    if (name.toLowerCase().includes('requirement') || name.toLowerCase().includes('analysis')) {
      return {
        label: 'Requirement Analysis',
        tone: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    }
    return {
      label: name,
      tone: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardTemplate
      title="Deals"
      subtitle="Manage and track your sales opportunities, revenue forecasts, and pipeline stages"
      actions={
        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Table / Kanban */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'kanban'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Add Deal Primary Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Deal
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 1. Four Summary KPI Metric Cards (Matching Screenshot 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deals */}
          <Card className="p-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Total Deals</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">{metrics.totalDeals}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
          </Card>

          {/* Total Value in INR */}
          <Card className="p-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Total Value</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(metrics.totalValue)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </Card>

          {/* Won Deals */}
          <Card className="p-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Won</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">{metrics.wonCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </Card>

          {/* Win Rate */}
          <Card className="p-5 bg-slate-900/70 border border-slate-800/90 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">Win Rate</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">{metrics.winRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals, companies, contacts..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner-soft"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
                showFilters || selectedStage !== 'all' || selectedStatus !== 'all'
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(selectedStage !== 'all' || selectedStatus !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <Card className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter by Stage</label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Stages</option>
                  {board?.stages?.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter by Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open Deals</option>
                  <option value="won">Closed Won</option>
                  <option value="lost">Closed Lost</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStage('all');
                    setSelectedStatus('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 3. Main View: Table List OR Kanban Board */}
        {viewMode === 'table' ? (
          <Card className="p-0 bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table Header (Matching Screenshot 1) */}
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">DEAL</th>
                    <th className="py-3.5 px-4 font-semibold">VALUE</th>
                    <th className="py-3.5 px-4 font-semibold">PIPELINE</th>
                    <th className="py-3.5 px-4 font-semibold">STAGE</th>
                    <th className="py-3.5 px-4 font-semibold">STATUS</th>
                    <th className="py-3.5 px-4 font-semibold">CONTACT</th>
                    <th className="py-3.5 px-4 font-semibold">PRODUCT</th>
                    <th className="py-3.5 px-4 font-semibold">ASSIGNED TO</th>
                    <th className="py-3.5 px-4 font-semibold">CLOSE DATE</th>
                    <th className="py-3.5 px-4 font-semibold">CREATED</th>
                    <th className="py-3.5 px-4 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {paginatedDeals.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium text-slate-400">No deals found</p>
                        <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedDeals.map((deal) => {
                      const stagePill = formatStagePill(deal.stageId, deal.status);
                      const isWon = deal.status === 'WON' || stageMap.get(deal.stageId)?.isWon;
                      const isLost = deal.status === 'LOST' || stageMap.get(deal.stageId)?.isLost;
                      const statusBadge = isWon ? 'won' : isLost ? 'lost' : 'open';

                      return (
                        <tr
                          key={deal.id}
                          className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => handleOpenEditModal(deal)}
                        >
                          {/* DEAL (Title + Subtitle) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                                {deal.title}
                              </p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {deal.company || deal.contactName || 'Unassigned Organization'}
                              </p>
                            </div>
                          </td>

                          {/* VALUE (INR ₹) */}
                          <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                            {formatCurrency(deal.value)}
                          </td>

                          {/* PIPELINE */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            Deals of CRM
                          </td>

                          {/* STAGE (Interactive Pill Dropdown) */}
                          <td
                            className="py-3.5 px-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stagePill.tone}`}
                              >
                                <span>{stagePill.label}</span>
                                <ChevronDown className="w-3 h-3 opacity-60" />
                              </span>
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                statusBadge === 'won'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : statusBadge === 'lost'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              }`}
                            >
                              <span>{statusBadge}</span>
                              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                            </span>
                          </td>

                          {/* CONTACT */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {deal.contactName || '-'}
                          </td>

                          {/* PRODUCT */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {deal.company?.includes('Jio')
                              ? '5G Private APN'
                              : deal.company?.includes('TCS')
                              ? 'Enterprise CRM'
                              : deal.company?.includes('Zomato')
                              ? 'Fleet Support'
                              : deal.company?.includes('Razorpay')
                              ? 'Payment Engine'
                              : 'General Inquiry'}
                          </td>

                          {/* ASSIGNED TO */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-slate-300 flex items-center gap-1 hover:text-white">
                              <span>
                                {deal.company?.includes('TCS')
                                  ? 'Rajesh Sharma'
                                  : deal.company?.includes('Jio')
                                  ? 'Priya Patel'
                                  : deal.company?.includes('Zomato')
                                  ? 'Amit Verma'
                                  : 'Admin User'}
                              </span>
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            </span>
                          </td>

                          {/* CLOSE DATE */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {formatDate(deal.expectedCloseAt || deal.createdAt)}
                          </td>

                          {/* CREATED */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {formatDate(deal.createdAt)}
                          </td>

                          {/* ACTIONS */}
                          <td
                            className="py-3.5 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(deal)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                                title="Edit Deal"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(deal.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                                title="Delete Deal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. Pagination Footer (Matching Screenshot 1) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
              <div>
                Showing{' '}
                <strong className="text-white">
                  {totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-white">
                  {Math.min(currentPage * pageSize, totalResults)}
                </strong>{' '}
                of <strong className="text-white">{totalResults}</strong> results
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
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
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
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
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ) : (
          /* Kanban Board View */
          <div className="w-full">
            {board ? (
              <DealsBoard
                board={board}
                onSelect={(d) => handleOpenEditModal(d)}
                onMove={(dealId, toStageId) => moveMutation.mutate({ dealId, toStageId })}
              />
            ) : (
              <div className="py-12 text-center text-slate-500">Loading pipeline board...</div>
            )}
          </div>
        )}

        {/* Add / Edit Deal Modal */}
        {isModalOpen && (
          <DealModal
            deal={editingDeal}
            board={board}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </div>
    </DashboardTemplate>
  );
}
