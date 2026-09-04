'use client';
// app/(dashboard)/settings/lead-assignment/page.tsx — Lead Auto-Assignment & Round-Robin Engine
import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  Globe,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  triggerSource: string;
  triggerTerritory?: string;
  method: 'ROUND_ROBIN' | 'WEIGHTED' | 'DIRECT';
  assignees: Array<{ name: string; weight?: number; avatar?: string }>;
  isActive: boolean;
  routedCount: number;
}

const initialRules: AssignmentRule[] = [
  {
    id: 'rule-1',
    name: 'India High-Intent Website Inbound',
    priority: 1,
    triggerSource: 'Website Demo Request',
    triggerTerritory: 'India & South Asia',
    method: 'ROUND_ROBIN',
    assignees: [
      { name: 'Rajesh Sharma', weight: 50 },
      { name: 'Amit Verma', weight: 50 },
    ],
    isActive: true,
    routedCount: 542,
  },
  {
    id: 'rule-2',
    name: 'WhatsApp Cloud Business Leads (+91)',
    priority: 2,
    triggerSource: 'WhatsApp Inbound',
    triggerTerritory: 'Pan-India Metros',
    method: 'ROUND_ROBIN',
    assignees: [
      { name: 'Priya Patel', weight: 34 },
      { name: 'Sneha Iyer', weight: 33 },
      { name: 'Vikram Malhotra', weight: 33 },
    ],
    isActive: true,
    routedCount: 1120,
  },
  {
    id: 'rule-3',
    name: 'South Region Tech Summit Referrals',
    priority: 3,
    triggerSource: 'Partner / Referral',
    triggerTerritory: 'Bengaluru & Hyderabad',
    method: 'WEIGHTED',
    assignees: [
      { name: 'Rohit Deshmukh', weight: 60 },
      { name: 'Kavita Reddy', weight: 40 },
    ],
    isActive: true,
    routedCount: 235,
  },
  {
    id: 'rule-4',
    name: 'Pan-India Default Catch-All Routing',
    priority: 4,
    triggerSource: 'Any Unmatched Source',
    triggerTerritory: 'All India',
    method: 'ROUND_ROBIN',
    assignees: [
      { name: 'General Indian Inbound Pool (8 Reps)', weight: 100 },
    ],
    isActive: true,
    routedCount: 1840,
  },
];

export default function LeadAssignmentPage() {
  const { t } = useI18n();

  const [rules, setRules] = useState<AssignmentRule[]>(initialRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSource, setFormSource] = useState('Website Demo Request');
  const [formTerritory, setFormTerritory] = useState('All Regions');
  const [formMethod, setFormMethod] = useState<'ROUND_ROBIN' | 'WEIGHTED' | 'DIRECT'>('ROUND_ROBIN');
  const [formAssigneeNames, setFormAssigneeNames] = useState('Sarah Jenkins, David Miller');

  const handleOpenModal = (rule?: AssignmentRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormName(rule.name);
      setFormSource(rule.triggerSource);
      setFormTerritory(rule.triggerTerritory || 'All Regions');
      setFormMethod(rule.method);
      setFormAssigneeNames(rule.assignees.map((a) => a.name).join(', '));
    } else {
      setEditingRule(null);
      setFormName('');
      setFormSource('Website Demo Request');
      setFormTerritory('All Regions');
      setFormMethod('ROUND_ROBIN');
      setFormAssigneeNames('Sarah Jenkins, David Miller');
    }
    setShowModal(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeList = formAssigneeNames
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ name, weight: Math.round(100 / (formAssigneeNames.split(',').length || 1)) }));

    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: formName,
                triggerSource: formSource,
                triggerTerritory: formTerritory,
                method: formMethod,
                assignees: assigneeList,
              }
            : r
        )
      );
    } else {
      const newRule: AssignmentRule = {
        id: `rule-${Date.now()}`,
        name: formName,
        priority: rules.length + 1,
        triggerSource: formSource,
        triggerTerritory: formTerritory,
        method: formMethod,
        assignees: assigneeList,
        isActive: true,
        routedCount: 0,
      };
      setRules((prev) => [...prev, newRule]);
    }
    setShowModal(false);
  };

  const toggleRuleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newRules = [...rules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRules.length) return;

    const temp = newRules[index];
    newRules[index] = newRules[targetIndex];
    newRules[targetIndex] = temp;

    // re-index priorities
    newRules.forEach((r, idx) => {
      r.priority = idx + 1;
    });

    setRules(newRules);
  };

  return (
    <DashboardTemplate
      title="Lead Auto-Assignment Rules"
      subtitle="Automated round-robin distribution, capacity balancing, and condition-based lead routing"
      actions={
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Routing Rule
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Active Routing Rules</p>
              <h4 className="text-lg font-bold text-white">{rules.filter((r) => r.isActive).length} Rules</h4>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Leads Routed (Month)</p>
              <h4 className="text-lg font-bold text-white">2,718 Leads</h4>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Assignment Latency</p>
              <h4 className="text-lg font-bold text-white">1.14s</h4>
            </div>
          </Card>

          <Card className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Distribution Balance</p>
              <h4 className="text-lg font-bold text-white">99.4%</h4>
            </div>
          </Card>
        </div>

        {/* Rule Execution Order List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Rule Execution Priority Order</h3>
              <p className="text-xs text-slate-400">Leads are evaluated top-down against criteria. First matching rule executes assignment.</p>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule, index) => (
              <Card
                key={rule.id}
                className={`p-5 rounded-2xl border transition-all ${
                  rule.isActive
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/30 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Priority + Title + Criteria */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {rule.priority}
                      </span>
                      <div className="flex flex-col">
                        <button
                          disabled={index === 0}
                          onClick={() => movePriority(index, 'up')}
                          className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === rules.length - 1}
                          onClick={() => movePriority(index, 'down')}
                          className="text-slate-500 hover:text-white disabled:opacity-20 p-0.5"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-semibold text-white">{rule.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">
                          {rule.method === 'ROUND_ROBIN' ? 'Round-Robin' : rule.method === 'WEIGHTED' ? 'Weighted' : 'Direct'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>Source: <strong className="text-slate-300">{rule.triggerSource}</strong></span>
                        <span>•</span>
                        <span>Territory: <strong className="text-slate-300">{rule.triggerTerritory}</strong></span>
                        <span>•</span>
                        <span>Routed: <strong className="text-indigo-400 font-mono">{rule.routedCount} leads</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Assignees */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rule.assignees.map((a, aIdx) => (
                      <span
                        key={aIdx}
                        className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span>{a.name}</span>
                        {a.weight && <span className="text-[10px] text-slate-500">({a.weight}%)</span>}
                      </span>
                    ))}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-end lg:self-center">
                    <button
                      onClick={() => toggleRuleActive(rule.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                        rule.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(rule)}
                      className="p-1.5 text-slate-400 hover:text-primary transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal for Rule */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-lg w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingRule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
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
                    placeholder="e.g. US Enterprise Inbound"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Lead Source</label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Website Demo Request">Website Demo Request</option>
                      <option value="WhatsApp Inbound">WhatsApp Inbound</option>
                      <option value="Google Ads (SEM)">Google Ads (SEM)</option>
                      <option value="Partner / Referral">Partner / Referral</option>
                      <option value="Any Unmatched Source">Any Unmatched Source (Catch-All)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Territory / Region</label>
                    <select
                      value={formTerritory}
                      onChange={(e) => setFormTerritory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="All Regions">All Regions (Global)</option>
                      <option value="United States & Canada">United States & Canada</option>
                      <option value="EMEA / Europe">EMEA / Europe</option>
                      <option value="APAC / Asia-Pacific">APAC / Asia-Pacific</option>
                      <option value="LATAM">LATAM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Distribution Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'ROUND_ROBIN', label: 'Round Robin' },
                      { key: 'WEIGHTED', label: 'Weighted Load' },
                      { key: 'DIRECT', label: 'Direct Pool' },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setFormMethod(m.key as any)}
                        className={`py-2 text-xs font-medium rounded-xl border transition ${
                          formMethod === m.key
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assignee Reps (Comma separated names)
                  </label>
                  <input
                    type="text"
                    required
                    value={formAssigneeNames}
                    onChange={(e) => setFormAssigneeNames(e.target.value)}
                    placeholder="Sarah Jenkins, David Miller, Alex Rivera"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leads will be assigned in cyclic order to these available reps.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save Assignment Rule
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
