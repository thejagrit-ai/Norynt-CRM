'use client';
// src/components/organisms/DealModal.tsx — Production-grade Add/Edit Deal modal with custom Select & DatePicker.
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  TrendingUp,
  DollarSign,
  User,
  Building2,
  Package,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Select, type SelectOption } from '@/components/atoms/Select';
import { DatePicker } from '@/components/atoms/DatePicker';
import type { Deal, Board } from '@/types';

export interface DealModalProps {
  deal?: Deal | null;
  board?: Board | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DealModal({
  deal,
  board,
  onClose,
  onSuccess,
}: DealModalProps) {
  const qc = useQueryClient();
  const isEditing = !!deal;

  // Form State
  const [title, setTitle] = useState(deal?.title ?? '');
  const [company, setCompany] = useState(deal?.company ?? '');
  const [value, setValue] = useState(deal?.value ? String(deal.value) : '');
  const [currency, setCurrency] = useState(deal?.currency ?? 'INR');
  const [contactName, setContactName] = useState(deal?.contactName ?? '');
  const [stageId, setStageId] = useState(deal?.stageId ?? (board?.stages?.[0]?.id || ''));
  const [pipelineId, setPipelineId] = useState(deal?.pipelineId ?? (board?.pipelineId || 'default-pipeline'));
  const [productInterest, setProductInterest] = useState('Enterprise Cloud CRM Suite');
  const [assignedTo, setAssignedTo] = useState('Rajesh Sharma (Admin)');
  const [expectedCloseAt, setExpectedCloseAt] = useState<string>(
    deal?.expectedCloseAt ? new Date(deal.expectedCloseAt).toISOString().split('T')[0] : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  // Pipeline Options
  const pipelineOptions: SelectOption[] = [
    { value: 'default-pipeline', label: 'Enterprise Direct Pipeline', sublabel: 'Large enterprise sales cycles' },
    { value: 'commercial-pipeline', label: 'Commercial Sales Pipeline', sublabel: 'Mid-market deals & expansions' },
    { value: 'inbound-pipeline', label: 'Inbound Velocity Pipeline', sublabel: 'Self-serve and website demo leads' },
    { value: 'partner-pipeline', label: 'Partner Ecosystem Pipeline', sublabel: 'Channel and referral opportunities' },
  ];

  // Stage Options derived from Board or defaults
  const stageOptions: SelectOption[] = (board?.stages && board.stages.length > 0
    ? board.stages.map((s) => ({
        value: s.id,
        label: s.name,
        badge: s.isWon ? 'Won' : s.isLost ? 'Lost' : undefined,
      }))
    : [
        { value: 'stage-new', label: 'New Deal' },
        { value: 'stage-analysis', label: 'Requirement Analysis' },
        { value: 'stage-demo', label: 'Product Demo' },
        { value: 'stage-proposal', label: 'Proposal Sent' },
        { value: 'stage-won', label: 'Closed Won', badge: 'Won' },
        { value: 'stage-lost', label: 'Closed Lost', badge: 'Lost' },
      ]
  );

  // Contact Options
  const contactOptions: SelectOption[] = [
    { value: 'Rajesh Sharma', label: 'Rajesh Sharma', sublabel: 'VP Enterprise Solutions (TCS)' },
    { value: 'Priya Patel', label: 'Priya Patel', sublabel: 'Chief Technology Officer (Reliance Jio)' },
    { value: 'Amit Verma', label: 'Amit Verma', sublabel: 'Director Procurement (Zomato)' },
    { value: 'Sneha Iyer', label: 'Sneha Iyer', sublabel: 'Head of Growth (Swiggy Instamart)' },
    { value: 'Vikram Malhotra', label: 'Vikram Malhotra', sublabel: 'CFO (Razorpay Software)' },
    { value: 'Ananya Desai', label: 'Ananya Desai', sublabel: 'VP Supply Chain (Flipkart)' },
    { value: 'Rohit Deshmukh', label: 'Rohit Deshmukh', sublabel: 'Head CX (HDFC Bank)' },
  ];

  // Product Options
  const productOptions: SelectOption[] = [
    { value: 'Enterprise Cloud CRM Suite', label: 'Norynt Enterprise Cloud CRM Suite', sublabel: '₹1,80,000 / Year' },
    { value: 'WhatsApp Official Cloud API', label: 'WhatsApp Official Cloud API Green Tick Bundle', sublabel: '₹45,000 / Month' },
    { value: 'AI Chatbot Studio & RAG', label: 'AI Chatbot Studio & Prompt Grounding', sublabel: '₹75,000 / Year' },
    { value: 'Field Sales Mobile Tracking', label: 'Field Sales Mobile Tracking & Geofencing', sublabel: '₹25,000 / Rep / Year' },
    { value: 'Dedicated Support SLA', label: 'Dedicated Indian Support Director & 15-Min SLA', sublabel: '₹1,20,000 / Year' },
  ];

  // Rep Options
  const repOptions: SelectOption[] = [
    { value: 'Rajesh Sharma (Admin)', label: 'Rajesh Sharma (Admin)', sublabel: 'Super Admin / Enterprise AE' },
    { value: 'Priya Patel (Manager)', label: 'Priya Patel (Manager)', sublabel: 'Sales Director' },
    { value: 'Amit Verma (Sales AE)', label: 'Amit Verma (Sales AE)', sublabel: 'Commercial Account Executive' },
    { value: 'Vikram Malhotra (Finance)', label: 'Vikram Malhotra (Finance)', sublabel: 'Finance Lead' },
    { value: 'Sneha Iyer (Viewer)', label: 'Sneha Iyer (Viewer)', sublabel: 'Growth Representative' },
  ];

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        company: company.trim() || undefined,
        value: value ? String(value) : undefined,
        currency: currency || 'INR',
        contactName: contactName || undefined,
        expectedCloseAt: expectedCloseAt ? new Date(expectedCloseAt).toISOString() : undefined,
      };

      if (isEditing && deal) {
        await api.patch(`/deals/${deal.id}`, payload);
        if (stageId && stageId !== deal.stageId) {
          await api.patch(`/deals/${deal.id}/move`, { toStageId: stageId });
        }
      } else {
        await api.post('/deals', {
          ...payload,
          stageId: stageId || stageOptions[0]?.value,
        });
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['board'] });
      void qc.invalidateQueries({ queryKey: ['deals'] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Deal Title is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    mutation.mutate();
  };

  if (!mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="w-full bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Deal' : 'Add Deal'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update deal attributes, pipeline stage & closing date' : 'Create a new revenue opportunity in your sales pipeline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Deal Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deal Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Redesign Project / Cloud ERP Migration"
              className={`w-full px-3.5 py-2.5 bg-slate-800/90 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm ${
                errors.title ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
          </div>

          {/* Pipeline & Stage Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pipeline"
              required
              options={pipelineOptions}
              value={pipelineId}
              onChange={(v) => setPipelineId(v)}
            />
            <Select
              label="Stage"
              required
              options={stageOptions}
              value={stageId}
              onChange={(v) => setStageId(v)}
            />
          </div>

          {/* Value & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deal Value (₹ INR)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Company & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Company / Organization
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Reliance Jio / Tata Consultancy Services"
                className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <Select
              label="Contact (Optional)"
              clearable
              options={contactOptions}
              value={contactName}
              onChange={(v) => setContactName(v)}
              placeholder="Link to a contact..."
            />
          </div>

          {/* Product Interest & Assigned To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Product Interest"
              options={productOptions}
              value={productInterest}
              onChange={(v) => setProductInterest(v)}
              placeholder="Select product..."
            />

            <Select
              label="Assigned To"
              options={repOptions}
              value={assignedTo}
              onChange={(v) => setAssignedTo(v)}
            />
          </div>

          {/* Expected Close Date */}
          <div>
            <DatePicker
              label="Expected Close Date"
              value={expectedCloseAt}
              onChange={(v) => setExpectedCloseAt(v)}
              placeholder="Select close date..."
            />
          </div>

          {/* Error Banner */}
          {mutation.isError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              Error saving deal. Please check your fields and connection.
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <Button variant="secondary" size="md" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 px-5"
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Deal'}
          </Button>
        </div>
      </Card>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
