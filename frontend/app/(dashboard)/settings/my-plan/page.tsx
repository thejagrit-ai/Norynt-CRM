'use client';
// app/(dashboard)/settings/my-plan/page.tsx — Plan & Quotas Management
import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Bot,
  Database,
  Shield,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface QuotaItem {
  name: string;
  used: number;
  max: number;
  unit: string;
  icon: React.ElementType;
  percentage: number;
}

export default function MyPlanPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanModal, setSelectedPlanModal] = useState<string | null>(null);

  const quotas: QuotaItem[] = [
    { name: 'Team Member Seats', used: 18, max: 25, unit: 'seats', icon: Users, percentage: 72 },
    { name: 'Total Contacts Managed', used: 48200, max: 100000, unit: 'contacts', icon: Database, percentage: 48 },
    { name: 'WhatsApp HSM Broadcasts', used: 12450, max: 25000, unit: 'msgs / mo', icon: MessageSquare, percentage: 50 },
    { name: 'AI Chatbot & Assist Tokens', used: 840000, max: 1000000, unit: 'tokens / mo', icon: Bot, percentage: 84 },
    { name: 'Document & Media Storage', used: 14.2, max: 50, unit: 'GB', icon: Layers, percentage: 28 },
    { name: 'Sales Pipelines & Funnels', used: 8, max: 15, unit: 'active', icon: TrendingUp, percentage: 53 },
  ];

  const plans = [
    {
      id: 'starter',
      name: 'Starter Suite',
      priceMonthly: 3499,
      priceYearly: 2999,
      description: 'Ideal for early-stage Indian startups getting started with CRM & sales.',
      features: [
        'Up to 5 Team Seats',
        '10,000 Total Contacts',
        'Basic Lead & Deal Tracking',
        'Email Campaigns (5,000/mo)',
        'Standard Email Support',
      ],
      current: false,
    },
    {
      id: 'growth',
      name: 'Growth Accelerate',
      priceMonthly: 8999,
      priceYearly: 7499,
      description: 'Full omni-channel marketing, WhatsApp broadcasts & automation funnels.',
      features: [
        'Up to 15 Team Seats',
        '50,000 Total Contacts',
        'WhatsApp HSM Broadcasts (10k/mo)',
        'Marketing Funnels & Warmup',
        'Internal Tickets & SLA',
        'Priority 24/7 Chat Support',
      ],
      current: false,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Scale',
      priceMonthly: 22999,
      priceYearly: 18999,
      description: 'Dedicated instance, unlimited custom fields, AI Studio & custom reports.',
      features: [
        'Up to 25 Team Seats (Expandable)',
        '100,000+ Total Contacts',
        'WhatsApp Business API Unlimited',
        'AI Chatbot Studio & RAG Bot',
        'Advanced Deal & Lead Routing Rules',
        'Dedicated Indian Account Manager',
        '99.99% SLA Uptime Guarantee',
      ],
      current: true,
    },
  ];

  const invoices = [
    { id: 'INV-2026-IND-01', date: 'Aug 01, 2026', amount: '₹2,27,988.00', status: 'Paid', plan: 'Enterprise (Annual + 18% GST)' },
    { id: 'INV-2025-IND-01', date: 'Aug 01, 2025', amount: '₹2,27,988.00', status: 'Paid', plan: 'Enterprise (Annual + 18% GST)' },
    { id: 'INV-2024-IND-01', date: 'Aug 01, 2024', amount: '₹89,988.00', status: 'Paid', plan: 'Growth (Annual + 18% GST)' },
  ];

  return (
    <DashboardTemplate
      title="My Plan & Quotas"
      subtitle="Manage your subscription tier, track real-time resource utilization, and review invoices"
    >
      <div className="space-y-8">
        {/* Active Plan Banner */}
        <Card className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64 text-indigo-400" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="primary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 px-3 py-1 text-xs">
                  Active Subscription
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Renews on Aug 01, 2027
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Enterprise Scale Plan</h2>
              <p className="text-sm text-slate-300 max-w-2xl">
                Your workspace is powered by our top-tier enterprise infrastructure with unlimited automation flows, dedicated AI inference, and priority SLA.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedPlanModal('manage')}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Billing Details
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-indigo-600 hover:bg-indigo-500"
                onClick={() => setSelectedPlanModal('seats')}
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Add Extra Seats
              </Button>
            </div>
          </div>
        </Card>

        {/* Real-time Resource Quotas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Resource Utilization & Quota Meters</h3>
              <p className="text-xs text-slate-400">Current billing cycle consumption across all active modules</p>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> Resets in 26 days
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotas.map((quota, idx) => {
              const IconComp = quota.icon;
              const isWarning = quota.percentage >= 80;
              return (
                <Card key={idx} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <Badge variant={isWarning ? 'warning' : 'secondary'} className="text-[11px]">
                      {quota.percentage}% used
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white">{quota.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="text-white font-medium">{typeof quota.used === 'number' && quota.used > 1000 ? quota.used.toLocaleString() : quota.used}</span> / {typeof quota.max === 'number' && quota.max > 1000 ? quota.max.toLocaleString() : quota.max} {quota.unit}
                    </p>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWarning ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${quota.percentage}%` }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Plan Comparison & Tiers */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h3 className="text-xl font-bold text-white">Compare Workspace Plans</h3>
            <p className="text-xs text-slate-400">Upgrade or adjust your subscription tier anytime. Prorated billing applies instantly.</p>

            {/* Billing Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
                  billingCycle === 'monthly' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
              return (
                <Card
                  key={plan.id}
                  className={`p-6 rounded-3xl flex flex-col justify-between transition-all duration-200 ${
                    plan.current
                      ? 'bg-slate-900/90 border-2 border-indigo-500/80 shadow-xl shadow-indigo-500/10 relative'
                      : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow">
                      Current Plan
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="text-3xl font-extrabold text-white">₹{price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-400">/ user / mo</span>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-2.5">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Features included:</span>
                      <ul className="space-y-2">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="text-xs text-slate-300 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-4">
                    {plan.current ? (
                      <Button variant="secondary" size="md" className="w-full" disabled>
                        Active Plan
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={() => setSelectedPlanModal(plan.name)}
                      >
                        Switch to {plan.name}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Payment Method & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Payment Card */}
          <Card className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Primary Payment Method
            </h4>
            <div className="p-4 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-[10px]">
                  VISA
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Visa ending in 4242</p>
                  <p className="text-[10px] text-slate-400">Expires 09/2028</p>
                </div>
              </div>
              <Badge variant="success" className="text-[10px]">Default</Badge>
            </div>
            <Button variant="secondary" size="sm" className="w-full">
              Update Payment Method
            </Button>
          </Card>

          {/* Invoice History */}
          <Card className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Invoice & Payment History
              </h4>
              <span className="text-xs text-slate-400">Past 12 Months</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5 font-medium">Invoice #</th>
                    <th className="pb-2.5 font-medium">Billing Period</th>
                    <th className="pb-2.5 font-medium">Plan Tier</th>
                    <th className="pb-2.5 font-medium">Amount</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono font-medium text-white">{inv.id}</td>
                      <td className="py-3 text-slate-400">{inv.date}</td>
                      <td className="py-3">{inv.plan}</td>
                      <td className="py-3 font-semibold text-white">{inv.amount}</td>
                      <td className="py-3">
                        <Badge variant="success" className="text-[10px]">{inv.status}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-slate-400 hover:text-primary transition p-1 inline-flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Modal for Upgrade/Details */}
        {selectedPlanModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Manage Subscription</h3>
                <button
                  onClick={() => setSelectedPlanModal(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are managing request for <strong className="text-white">{selectedPlanModal}</strong>. Your account manager will confirm the changes and update your active seats and billing terms.
              </p>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <span>All changes take effect immediately with zero downtime or data loss.</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setSelectedPlanModal(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => setSelectedPlanModal(null)}>
                  Confirm Request
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardTemplate>
  );
}
