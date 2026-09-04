'use client';
// app/(dashboard)/tickets/settings/page.tsx — Internal Ticket Configuration & SLA Policies
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Shield,
  Bell,
  Users,
  Sliders,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

interface SlaPolicy {
  id: string;
  name: string;
  priority: string;
  responseMins: number;
  resolveMins: number;
  escalateMins?: number;
  notifyManager: boolean;
  isActive: boolean;
}

const defaultSlas: SlaPolicy[] = [
  {
    id: 'sla-1',
    name: 'Critical Incident SLA',
    priority: 'URGENT',
    responseMins: 15,
    resolveMins: 120,
    escalateMins: 60,
    notifyManager: true,
    isActive: true,
  },
  {
    id: 'sla-2',
    name: 'High Priority Customer Care',
    priority: 'HIGH',
    responseMins: 60,
    resolveMins: 480,
    escalateMins: 240,
    notifyManager: true,
    isActive: true,
  },
  {
    id: 'sla-3',
    name: 'Standard Inquiries',
    priority: 'MEDIUM',
    responseMins: 240,
    resolveMins: 1440,
    escalateMins: 720,
    notifyManager: false,
    isActive: true,
  },
  {
    id: 'sla-4',
    name: 'Low Priority / Feature Request',
    priority: 'LOW',
    responseMins: 720,
    resolveMins: 2880,
    escalateMins: 1440,
    notifyManager: false,
    isActive: true,
  },
];

export default function TicketSettingsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [slas, setSlas] = useState<SlaPolicy[]>(defaultSlas);
  const [showModal, setShowModal] = useState(false);
  const [editingSla, setEditingSla] = useState<SlaPolicy | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [responseMins, setResponseMins] = useState(60);
  const [resolveMins, setResolveMins] = useState(480);
  const [escalateMins, setEscalateMins] = useState(240);
  const [notifyManager, setNotifyManager] = useState(true);

  // Ticket Categories
  const [categories, setCategories] = useState([
    { id: 'cat-1', name: 'Technical & Bug Reports', defaultPriority: 'HIGH', team: 'Engineering Support' },
    { id: 'cat-2', name: 'Billing & Invoice Disputes', defaultPriority: 'MEDIUM', team: 'Finance Team' },
    { id: 'cat-3', name: 'Account Access & Security', defaultPriority: 'URGENT', team: 'Security Ops' },
    { id: 'cat-4', name: 'Product Feedback & Feature Request', defaultPriority: 'LOW', team: 'Product Team' },
  ]);

  const handleOpenModal = (sla?: SlaPolicy) => {
    if (sla) {
      setEditingSla(sla);
      setName(sla.name);
      setPriority(sla.priority);
      setResponseMins(sla.responseMins);
      setResolveMins(sla.resolveMins);
      setEscalateMins(sla.escalateMins || 0);
      setNotifyManager(sla.notifyManager);
    } else {
      setEditingSla(null);
      setName('');
      setPriority('HIGH');
      setResponseMins(60);
      setResolveMins(480);
      setEscalateMins(240);
      setNotifyManager(true);
    }
    setShowModal(true);
  };

  const handleSaveSla = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSla) {
      setSlas((prev) =>
        prev.map((s) =>
          s.id === editingSla.id
            ? { ...s, name, priority, responseMins, resolveMins, escalateMins, notifyManager }
            : s
        )
      );
    } else {
      const newPolicy: SlaPolicy = {
        id: `sla-${Date.now()}`,
        name,
        priority,
        responseMins,
        resolveMins,
        escalateMins,
        notifyManager,
        isActive: true,
      };
      setSlas((prev) => [...prev, newPolicy]);
    }
    setShowModal(false);
  };

  const toggleSlaActive = (id: string) => {
    setSlas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const deleteSla = (id: string) => {
    setSlas((prev) => prev.filter((s) => s.id !== id));
  };

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(mins % 60 === 0 ? 0 : 1);
    return `${hrs} hours`;
  };

  return (
    <DashboardTemplate
      title="Internal Ticket Config & SLAs"
      subtitle="Configure response targets, resolution times, priority matrices, and auto-escalation workflows"
      actions={
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add SLA Policy
        </Button>
      }
    >
      <div className="space-y-8">
        {/* SLA Matrix Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Active SLA Performance Policies</h3>
              <p className="text-xs text-slate-400">Guaranteed response and resolution timers calculated against business calendar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {slas.map((policy) => {
              const badgeColor =
                policy.priority === 'URGENT'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : policy.priority === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : policy.priority === 'MEDIUM'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-700/40 text-slate-300 border-slate-600/40';

              return (
                <Card
                  key={policy.id}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                    policy.isActive
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/30 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                        {policy.priority}
                      </span>
                      <button
                        onClick={() => toggleSlaActive(policy.id)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition ${
                          policy.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {policy.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">{policy.name}</h4>
                    </div>

                    <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> 1st Response:
                        </span>
                        <span className="font-semibold text-white">{formatTime(policy.responseMins)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Resolution:
                        </span>
                        <span className="font-semibold text-white">{formatTime(policy.resolveMins)}</span>
                      </div>
                      {policy.escalateMins && (
                        <div className="flex items-center justify-between text-[11px] text-amber-400 pt-1 border-t border-slate-700/60">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Auto-Escalate:
                          </span>
                          <span>{formatTime(policy.escalateMins)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                    <button
                      onClick={() => handleOpenModal(policy)}
                      className="text-slate-400 hover:text-primary transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteSla(policy.id)}
                      className="text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Ticket Categories & Routing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Support Categories & Escalation Teams
                </h4>
                <p className="text-xs text-slate-400">Classify incoming tickets and auto-assign to designated departments</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">{cat.name}</p>
                    <p className="text-[11px] text-slate-400">Assigned Team: <span className="text-indigo-300 font-medium">{cat.team}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px]">
                      Default: {cat.defaultPriority}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Operating Calendar & Business Hours */}
          <Card className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Business Hours & Calendar
            </h4>
            <p className="text-xs text-slate-400">SLA clocks pause during off-hours unless set to 24/7 Support.</p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-white">Work Week</span>
                <p className="text-[11px] text-slate-400">Monday – Friday (09:00 AM – 06:00 PM EST)</p>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-white">Urgent Incident Override</span>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 24/7/365 On-Call Pager Enabled
                </p>
              </div>
            </div>

            <Button variant="secondary" size="sm" className="w-full">
              Edit Business Calendar
            </Button>
          </Card>
        </div>

        {/* Modal for SLA Policy */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingSla ? 'Edit SLA Policy' : 'Create New SLA Policy'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSla} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Policy Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. VIP Response Tier"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority Tier</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Response Target (Mins)</label>
                    <input
                      type="number"
                      required
                      value={responseMins}
                      onChange={(e) => setResponseMins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Resolution Target (Mins)</label>
                    <input
                      type="number"
                      required
                      value={resolveMins}
                      onChange={(e) => setResolveMins(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Auto-Escalate If Unresolved (Mins)</label>
                  <input
                    type="number"
                    value={escalateMins}
                    onChange={(e) => setEscalateMins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="notifyMgr"
                    checked={notifyManager}
                    onChange={(e) => setNotifyManager(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-primary"
                  />
                  <label htmlFor="notifyMgr" className="text-xs text-slate-300">
                    Send Manager Alert on SLA Warning (75% elapsed)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    Save SLA Policy
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
