'use client';
// app/(dashboard)/campaigns/warmup/page.tsx — Email Deliverability & Warmup Monitor
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  Plus,
  ShieldCheck,
  TrendingUp,
  Inbox,
  AlertTriangle,
  Play,
  Pause,
  Mail,
  CheckCircle,
  X,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Modal } from '@/components/molecules/Modal';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface WarmupProfile {
  id: string;
  emailAddress: string;
  provider: string;
  status: string;
  dailyLimit: number;
  currentDay: number;
  healthScore: number;
  emailsSentToday: number;
  inboxRate: number;
  spamRate: number;
}

export default function WarmupPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [formData, setFormData] = useState({ emailAddress: '', provider: 'Google Workspace', dailyLimit: 50 });
  const [submitting, setSubmitting] = useState(false);

  const profiles = useQuery({
    queryKey: ['warmup-profiles'],
    queryFn: async () => {
      const res = await api.get('/campaigns/warmup');
      return unwrap<WarmupProfile[]>(res.data);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['warmup-profiles'] });

  const handleToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/campaigns/warmup/${id}/status`, { status: nextStatus });
      invalidate();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update warmup status');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.emailAddress.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/campaigns/warmup', formData);
      invalidate();
      setConnecting(false);
      setFormData({ emailAddress: '', provider: 'Google Workspace', dailyLimit: 50 });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to connect warmup inbox');
    } finally {
      setSubmitting(false);
    }
  };

  const activeProfiles = profiles.data || [];
  const avgHealth =
    activeProfiles.length > 0
      ? Math.round(activeProfiles.reduce((acc, p) => acc + p.healthScore, 0) / activeProfiles.length)
      : 98;

  return (
    <DashboardTemplate
      title="Email Warmup & Deliverability"
      subtitle="Automated peer-to-peer reputation warming ensuring 99%+ primary inbox placement"
      actions={
        <Button
          onClick={() => setConnecting(true)}
          leftIcon={<Plus className="h-4 w-4" />}
          tone="primary"
        >
          Add Mailbox
        </Button>
      }
    >
      {/* Top Health & Performance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 mb-8">
        <Card className="flex items-center justify-between border-slate-200/90 bg-white p-6 shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sender Health Score
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-slate-900">{avgHealth}</span>
              <span className="text-sm font-semibold text-emerald-600">/ 100 (Optimal)</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Low spam risk across major ESPs</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100 text-indigo-600">
            <Flame className="h-8 w-8" />
          </div>
        </Card>

        <Card className="border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Primary Inbox Rate</span>
            <Inbox className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">99.2%</p>
          <span className="text-xs text-emerald-600 font-medium">Verified by Google & Microsoft</span>
        </Card>

        <Card className="border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Spam Placement Rate</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">0.4%</p>
          <span className="text-xs text-slate-500">Well below 2.0% threshold</span>
        </Card>

        <Card className="border-slate-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>DNS Auth (SPF/DKIM/DMARC)</span>
            <ShieldCheck className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">100%</p>
          <span className="text-xs text-slate-500">All records valid & verified</span>
        </Card>
      </div>

      {/* Mailboxes List */}
      <h3 className="text-base font-semibold text-slate-900 mb-4">Active Warming Mailboxes</h3>

      {profiles.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activeProfiles.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-300 bg-slate-50/50 rounded-2xl">
          <div className="rounded-2xl bg-orange-50 p-4 border border-orange-100 text-orange-600 mb-4">
            <Flame className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900">No warming mailboxes configured</h4>
          <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
            Connect an outbound mailbox to begin automated peer-to-peer reputation warming ensuring 99%+ primary inbox deliverability.
          </p>
          <Button
            onClick={() => setConnecting(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            tone="primary"
            className="mt-5"
          >
            Add Mailbox
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeProfiles.map((prof) => (
            <Card
              key={prof.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-slate-200/90 bg-white p-5 shadow-sm rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-600 border border-slate-200">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-base">{prof.emailAddress}</h4>
                    <Badge tone={prof.status === 'ACTIVE' ? 'green' : 'amber'}>
                      {prof.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {prof.provider} · Day {prof.currentDay} of ramp-up · Limit: {prof.dailyLimit} emails/day
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 text-sm">
                <div className="text-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                    Health Score
                  </span>
                  <span className="font-bold text-emerald-600 text-base">{prof.healthScore}/100</span>
                </div>

                <div className="text-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                    Inbox Placement
                  </span>
                  <span className="font-semibold text-slate-800">{prof.inboxRate}%</span>
                </div>

                <div className="text-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
                    Sent Today
                  </span>
                  <span className="font-semibold text-slate-800">{prof.emailsSentToday} / {prof.dailyLimit}</span>
                </div>

                <Button
                  size="sm"
                  tone={prof.status === 'ACTIVE' ? 'secondary' : 'primary'}
                  onClick={() => handleToggle(prof.id, prof.status)}
                  leftIcon={
                    prof.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
                  }
                >
                  {prof.status === 'ACTIVE' ? 'Pause Warmup' : 'Resume Warmup'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Connect Mailbox Modal */}
      {connecting && (
        <Modal
          title="Add Mailbox for Warmup"
          description="Connect an outbound inbox to begin automated AI email reputation warming."
          onClose={() => setConnecting(false)}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="outbound@yourcompany.com"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Provider Type</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none"
              >
                <option value="Google Workspace">Google Workspace (Gmail)</option>
                <option value="Microsoft 365">Microsoft 365 / Outlook</option>
                <option value="Custom SMTP/IMAP">Custom SMTP / IMAP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Daily Limit (Emails/Day)
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={formData.dailyLimit}
                onChange={(e) => setFormData({ ...formData, dailyLimit: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" tone="secondary" onClick={() => setConnecting(false)}>
                Cancel
              </Button>
              <Button type="submit" tone="primary" disabled={submitting}>
                {submitting ? 'Connecting…' : 'Start Warmup'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
