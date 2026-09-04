'use client';
// app/(dashboard)/settings/deal-assignment/page.tsx — Deal Assignment & Pipeline Routing
import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  ArrowRight,
  DollarSign,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  GitBranch,
  Sliders,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface DealRule {
  id: string;
  name: string;
  pipeline: string;
  minAmount: number;
  maxAmount?: number;
  assignedTeam: string;
  reps: string[];
  maxCapacityPerRep: number;
  isActive: boolean;
}

const initialDealRules: DealRule[] = [
  {
    id: 'deal-rule-1',
    name: 'Enterprise Strategic Accounts (> ₹50,00,000)',
    pipeline: 'Enterprise Direct Pipeline',
    minAmount: 5000000,
    maxAmount: undefined,
    assignedTeam: 'Enterprise Strategic AE Squad',
    reps: ['Rajesh Sharma', 'Amit Verma'],
    maxCapacityPerRep: 12,
    isActive: true,
  },
  {
    id: 'deal-rule-2',
    name: 'Mid-Market Commercial Deals (₹10L – ₹50L)',
    pipeline: 'Standard Sales Pipeline',
    minAmount: 1000000,
    maxAmount: 5000000,
    assignedTeam: 'Commercial Mid-Market Team',
    reps: ['Priya Patel', 'Rohit Deshmukh'],
    maxCapacityPerRep: 25,
    isActive: true,
  },
  {
    id: 'deal-rule-3',
    name: 'Velocity SMB Indian Growth (< ₹10,00,000)',
    pipeline: 'Inbound Velocity Pipeline',
    minAmount: 0,
    maxAmount: 1000000,
    assignedTeam: 'Velocity Inside Sales',
    reps: ['Sneha Iyer', 'Vikram Malhotra'],
    maxCapacityPerRep: 40,
    isActive: true,
  },
  {
    id: 'deal-rule-4',
    name: 'Partner & Channel Ecosystem (> ₹5,00,000)',
    pipeline: 'Partner Ecosystem',
    minAmount: 500000,
    maxAmount: undefined,
    assignedTeam: 'Channel Partnerships',
    reps: ['Arjun Kapoor'],
    maxCapacityPerRep: 20,
    isActive: true,
  },
];

export default function DealAssignmentPage() {
  const { t } = useI18n();

  const [rules, setRules] = useState<DealRule[]>(initialDealRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DealRule | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPipeline, setFormPipeline] = useState('Standard Sales Pipeline');
  const [formMinAmount, setFormMinAmount] = useState(10000);
  const [formMaxAmount, setFormMaxAmount] = useState<number | undefined>(50000);
  const [formTeam, setFormTeam] = useState('Commercial Mid-Market');
  const [formReps, setFormReps] = useState('David Miller, Alex Rivera');
  const [formCapacity, setFormCapacity] = useState(25);

  const handleOpenModal = (rule?: DealRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormName(rule.name);
      setFormPipeline(rule.pipeline);
      setFormMinAmount(rule.minAmount);
      setFormMaxAmount(rule.maxAmount);
      setFormTeam(rule.assignedTeam);
      setFormReps(rule.reps.join(', '));
      setFormCapacity(rule.maxCapacityPerRep);
    } else {
      setEditingRule(null);
      setFormName('');
      setFormPipeline('Standard Sales Pipeline');
      setFormMinAmount(10000);
      setFormMaxAmount(50000);
      setFormTeam('Commercial Mid-Market');
      setFormReps('David Miller, Alex Rivera');
      setFormCapacity(25);
    }
    setShowModal(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    const repList = formReps.split(',').map((r) => r.trim()).filter(Boolean);

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: formName,
                pipeline: formPipeline,
                minAmount: Number(formMinAmount),
                maxAmount: formMaxAmount ? Number(formMaxAmount) : undefined,
                assignedTeam: formTeam,
                reps: repList,
                maxCapacityPerRep: Number(formCapacity),
              }
            : r
        )
      );
    } else {
      const newRule: DealRule = {
        id: `deal-rule-${Date.now()}`,
        name: formName,
        pipeline: formPipeline,
        minAmount: Number(formMinAmount),
        maxAmount: formMaxAmount ? Number(formMaxAmount) : undefined,
        assignedTeam: formTeam,
        reps: repList,
        maxCapacityPerRep: Number(formCapacity),
        isActive: true,
      };
      setRules((prev) => [...prev, newRule]);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <DashboardTemplate
      title="Deal Assignment & Routing"
      subtitle="Value-tiered routing, pipeline stage triggers, rep capacity throttling, and AE matching"
      actions={
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Deal Route
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3.5">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Deals Routed</p>
              <h4 className="text-xl font-bold text-white">₹4.82 Cr Pipeline</h4>
            </div>
          </Card>

          <Card className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Rep Load Balance</p>
              <h4 className="text-xl font-bold text-white">Optimal (64% Avg)</h4>
            </div>
          </Card>

          <Card className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Connected Pipelines</p>
              <h4 className="text-xl font-bold text-white">4 Pipelines</h4>
            </div>
          </Card>
        </div>

        {/* Rule cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Deal Routing & Capacity Matrix</h3>
              <p className="text-xs text-slate-400">When deals are created or converted from qualified leads, they route based on value and pipeline.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  rule.isActive
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/30 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                          <DollarSign className="w-4 h-4" />
                        </span>
                        <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 pl-8">Pipeline: <span className="text-indigo-300 font-medium">{rule.pipeline}</span></p>
                    </div>

                    <button
                      onClick={() => toggleActive(rule.id)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${
                        rule.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Deal Value Filter:</span>
                      <span className="font-semibold text-white">
                        ₹{rule.minAmount.toLocaleString('en-IN')} {rule.maxAmount ? `– ₹${rule.maxAmount.toLocaleString('en-IN')}` : '+'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Target Team:</span>
                      <span className="font-medium text-indigo-300">{rule.assignedTeam}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Max Active Deals / Rep:</span>
                      <span className="font-semibold text-amber-400">{rule.maxCapacityPerRep} deals</span>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                      <span className="text-[11px] text-slate-400 block">Assigned Account Execs:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {rule.reps.map((rep, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-slate-700/70 border border-slate-600/70 text-[11px] text-slate-200"
                          >
                            {rep}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 flex items-center justify-between border-t border-slate-800 text-xs">
                  <button
                    onClick={() => handleOpenModal(rule)}
                    className="text-slate-400 hover:text-primary transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal for Deal Route */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingRule ? 'Edit Deal Route' : 'Create Deal Route'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRule} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Enterprise Strategic Deals"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Sales Pipeline</label>
                  <select
                    value={formPipeline}
                    onChange={(e) => setFormPipeline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="Enterprise Direct Pipeline">Enterprise Direct Pipeline</option>
                    <option value="Standard Sales Pipeline">Standard Sales Pipeline</option>
                    <option value="Inbound Velocity Pipeline">Inbound Velocity Pipeline</option>
                    <option value="Partner Ecosystem">Partner Ecosystem</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Min Value ($)</label>
                    <input
                      type="number"
                      required
                      value={formMinAmount}
                      onChange={(e) => setFormMinAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Max Value ($ or blank)</label>
                    <input
                      type="number"
                      value={formMaxAmount || ''}
                      onChange={(e) => setFormMaxAmount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Team Name</label>
                  <input
                    type="text"
                    required
                    value={formTeam}
                    onChange={(e) => setFormTeam(e.target.value)}
                    placeholder="e.g. Enterprise AE Squad"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Account Reps (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={formReps}
                    onChange={(e) => setFormReps(e.target.value)}
                    placeholder="Sarah Jenkins, Marcus Sterling"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Concurrent Deals / Rep</label>
                  <input
                    type="number"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Deal Route
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
}
