'use client';
// app/(dashboard)/connections/page.tsx — Enterprise Admin Configuration Center.
// Payment Gateways (India-First: Razorpay, Cashfree, PayU, PhonePe + Stripe), SMTP Server Delivery, and App Connectors Vault.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Key,
  RefreshCw,
  Trash2,
  Plug,
  CreditCard,
  Mail,
  Send,
  Sliders,
  DollarSign,
  Globe,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Modal } from '@/components/molecules/Modal';
import { FormField } from '@/components/molecules/FormField';

interface ProviderField {
  key: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder?: string;
  type?: string;
  options?: { label: string; value: string }[];
}

interface ProviderDef {
  key: string;
  name: string;
  category: string;
  authType: string;
  available: boolean;
  testable: boolean;
  defaultCurrency?: string;
  fields: ProviderField[];
}

interface Connection {
  id: string;
  provider: string;
  providerName: string;
  category: string;
  label: string | null;
  status: string;
  secretFields: string[];
}

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  hasPassword: boolean;
  from: string;
  fromName: string;
  replyTo: string;
  driver: string;
}

interface PaymentSettings {
  defaultProvider: string;
  defaultCurrency: string;
  defaultCountry: string;
  mode: 'test' | 'live';
  activeProviders: any[];
}

export default function ConnectionsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const manage = can('integration.manage');

  const [activeTab, setActiveTab] = useState<'payments' | 'smtp' | 'apps'>('payments');
  const [connecting, setConnecting] = useState<ProviderDef | null>(null);
  const [disconnecting, setDisconnecting] = useState<Connection | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Live Mode Confirmation
  const [pendingLiveConfirm, setPendingLiveConfirm] = useState(false);

  // SMTP state
  const [smtpForm, setSmtpForm] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
    fromName: 'Norynt CRM',
    replyTo: '',
  });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Payment settings state
  const [defaultProvider, setDefaultProvider] = useState('razorpay');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [defaultCountry, setDefaultCountry] = useState('IN');
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>('test');

  // Queries
  const catalog = useQuery({
    queryKey: ['conn-catalog'],
    queryFn: async () =>
      unwrap<{ cryptoReady: boolean; providers: ProviderDef[] }>(
        (await api.get('/connections/catalog')).data,
      ),
    staleTime: 60_000,
  });

  const conns = useQuery({
    queryKey: ['connections'],
    queryFn: async () => unwrap<Connection[]>((await api.get('/connections')).data),
    staleTime: 30_000,
  });

  const paymentSettings = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () =>
      unwrap<PaymentSettings>((await api.get('/payments/settings')).data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (paymentSettings.data) {
      setDefaultProvider(paymentSettings.data.defaultProvider || 'razorpay');
      setDefaultCurrency(paymentSettings.data.defaultCurrency || 'INR');
      setDefaultCountry(paymentSettings.data.defaultCountry || 'IN');
      setPaymentMode(paymentSettings.data.mode || 'test');
    }
  }, [paymentSettings.data]);

  const smtpSettings = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () =>
      unwrap<SmtpSettings>((await api.get('/email/settings')).data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (smtpSettings.data) {
      setSmtpForm({
        host: smtpSettings.data.host || '',
        port: smtpSettings.data.port || 587,
        secure: smtpSettings.data.secure || false,
        user: smtpSettings.data.user || '',
        pass: '',
        from: smtpSettings.data.from || '',
        fromName: smtpSettings.data.fromName || 'Norynt CRM',
        replyTo: smtpSettings.data.replyTo || '',
      });
    }
  }, [smtpSettings.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['connections'] });
    qc.invalidateQueries({ queryKey: ['payment-settings'] });
    qc.invalidateQueries({ queryKey: ['smtp-settings'] });
  };

  // Mutations
  const savePaymentConfig = useMutation({
    mutationFn: async () => {
      return api.post('/payments/settings', {
        defaultProvider,
        defaultCurrency,
        defaultCountry,
        mode: paymentMode,
      });
    },
    onSuccess: () => {
      invalidate();
      alert('Market & payment configurations saved successfully.');
    },
  });

  const saveSmtpConfig = useMutation({
    mutationFn: async () => {
      return api.post('/email/settings', smtpForm);
    },
    onSuccess: () => {
      invalidate();
      alert('SMTP settings saved successfully.');
    },
  });

  const testSmtpConnection = useMutation({
    mutationFn: async () => {
      return (await api.post('/email/settings/test-connection', smtpForm)).data;
    },
    onSuccess: (res: any) => {
      setSmtpTestResult({ ok: res.success, message: res.message });
    },
    onError: (err: any) => {
      setSmtpTestResult({ ok: false, message: err.response?.data?.message || err.message });
    },
  });

  const sendTestEmail = useMutation({
    mutationFn: async (recipient: string) => {
      return (await api.post('/email/settings/send-test', { to: recipient })).data;
    },
    onSuccess: (res: any) => {
      alert(res.message || 'Test email dispatched successfully.');
      setTestEmailModal(false);
      setTestRecipient('');
    },
    onError: (err: any) => {
      alert(`Test email delivery failed: ${err.response?.data?.message || err.message}`);
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      const p = connecting!;
      const secrets: Record<string, string> = {};
      const config: Record<string, string> = {};
      for (const f of p.fields) {
        const v = form[f.key] ?? '';
        if (f.secret) {
          if (v.trim()) secrets[f.key] = v.trim();
        } else {
          config[f.key] = v.trim();
        }
      }
      const existing = (conns.data ?? []).find((c) => c.provider === p.key);
      if (existing) {
        await api.patch(`/connections/${existing.id}`, { secrets, config });
      } else {
        await api.post('/connections', { provider: p.key, secrets, config });
      }
    },
    onSuccess: () => {
      setConnecting(null);
      setForm({});
      setTestResult(null);
      invalidate();
    },
    onError: (err: any) => {
      alert(`Configuration failed: ${err.response?.data?.message || err.message}`);
    },
  });

  const testProvider = useMutation({
    mutationFn: async (id: string) =>
      unwrap<{ ok: boolean; message: string }>((await api.post(`/connections/${id}/test`)).data),
    onSuccess: (r) => {
      setTestResult(r);
      alert(r.message);
    },
    onError: (err: any) => {
      alert(`Connection test failed: ${err.response?.data?.message || err.message}`);
    },
  });

  const disconnect = useMutation({
    mutationFn: async (id: string) => api.delete(`/connections/${id}`),
    onSuccess: () => {
      setDisconnecting(null);
      invalidate();
    },
  });

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenConfigure = (p: ProviderDef) => {
    setConnecting(p);
    const existing = (conns.data ?? []).find((c) => c.provider === p.key);
    if (existing && (existing as any).config) {
      const initial: Record<string, string> = {};
      Object.entries((existing as any).config).forEach(([k, v]) => {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          initial[k] = String(v);
        }
      });
      setForm(initial);
    } else {
      setForm({});
    }
  };

  const paymentProviders = (catalog.data?.providers ?? []).filter((p) => p.category === 'payments');
  const appProviders = (catalog.data?.providers ?? []).filter((p) => p.category !== 'payments');

  return (
    <DashboardTemplate title="Connections & Provider Settings">
      <div className="w-full space-y-6 pb-8">
        {/* ── Sub Navigation Tabs ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'payments'
                  ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payments (India & Global)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('smtp')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'smtp'
                  ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>SMTP & Email Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apps')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'apps'
                  ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Plug className="h-4 w-4" />
              <span>App Connectors & Vault</span>
            </button>
          </div>

          <Link
            href="/connections/guide"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
          >
            <BookOpen className="h-4 w-4" />
            <span>Setup & Webhooks Guide</span>
          </Link>
        </div>

        {/* ── TAB 1: PAYMENTS SETTINGS (INDIA FIRST) ── */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Global Market Configuration Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/80">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">Default Payment Market</span>
                    <Badge tone="emerald">India 🇮🇳 Default</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Configure default gateway, operating currency (INR ₹), and environment mode.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => savePaymentConfig.mutate()}
                    disabled={savePaymentConfig.isPending || !manage}
                    className="bg-brand-600 font-bold text-white shadow-md shadow-brand-500/20"
                  >
                    Save Market Settings
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Gateway Provider</label>
                  <select
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="razorpay">Razorpay (India - UPI, Cards, Netbanking)</option>
                    <option value="cashfree">Cashfree Payments (India)</option>
                    <option value="payu">PayU India</option>
                    <option value="phonepe">PhonePe PG</option>
                    <option value="stripe">Stripe (International)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="AED">AED (د.إ) — UAE Dirham</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Country Region</label>
                  <select
                    value={defaultCountry}
                    onChange={(e) => setDefaultCountry(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Environment Mode</label>
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950/60">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('test')}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
                        paymentMode === 'test'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      Sandbox / Test
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingLiveConfirm(true)}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
                        paymentMode === 'live'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      Production Live
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paymentProviders.map((p) => {
                const conn = (conns.data ?? []).find((c) => c.provider === p.key);
                const connected = conn?.status === 'connected';
                const isDefault = defaultProvider === p.key;

                return (
                  <div
                    key={p.key}
                    className={`flex flex-col justify-between rounded-2xl border bg-white/95 p-5 shadow-sm backdrop-blur-md transition hover:shadow-md dark:bg-slate-900/80 ${
                      isDefault
                        ? 'border-brand-500/50 ring-2 ring-brand-500/20 dark:border-brand-500/60'
                        : 'border-slate-200/80 dark:border-slate-800/90'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                            <p className="text-[11px] text-slate-400">Currency: {p.defaultCurrency || 'INR'}</p>
                          </div>
                        </div>
                        {isDefault && <Badge tone="indigo">Active Default</Badge>}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Badge tone={connected ? 'emerald' : 'gray'} dot>
                          {connected ? 'Configured & Connected' : 'Not Configured'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/70">
                      {connected ? (
                        <div className="flex w-full items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setConnecting(p);
                              setForm({});
                            }}
                            disabled={!manage}
                            className="text-xs font-bold"
                          >
                            Update Keys
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testProvider.mutate(conn.id)}
                            disabled={testProvider.isPending}
                            className="text-xs font-bold"
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDisconnecting(conn)}
                            disabled={disconnect.isPending || !manage}
                            className="text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setConnecting(p);
                            setForm({});
                          }}
                          disabled={!manage}
                          className="w-full bg-brand-600 text-xs font-bold text-white shadow-sm"
                        >
                          Configure Keys
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: SMTP & EMAIL CONFIGURATION ── */}
        {activeTab === 'smtp' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/80">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">SMTP Email Delivery Settings</h2>
                    <Badge tone="indigo">Driver: {smtpSettings.data?.driver || 'smtp'}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Configure your outbound transactional email server for invoice alerts, notifications, and password resets.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testSmtpConnection.mutate()}
                    disabled={testSmtpConnection.isPending || !manage}
                    className="border-slate-200 text-xs font-bold dark:border-slate-800"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testSmtpConnection.isPending ? 'animate-spin' : ''}`} />
                    <span>Test Handshake</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTestEmailModal(true)}
                    disabled={!manage}
                    className="border-slate-200 text-xs font-bold dark:border-slate-800"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Test Email</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveSmtpConfig.mutate()}
                    disabled={saveSmtpConfig.isPending || !manage}
                    className="bg-brand-600 font-bold text-white shadow-md shadow-brand-500/20"
                  >
                    Save SMTP Settings
                  </Button>
                </div>
              </div>

              {smtpTestResult && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
                    smtpTestResult.ok
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                  }`}
                >
                  {smtpTestResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                  <span>{smtpTestResult.message}</span>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField id="smtp-host" label="SMTP Host / Server" required>
                  <input
                    id="smtp-host"
                    type="text"
                    placeholder="smtp.gmail.com / smtp.sendgrid.net"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                </FormField>

                <FormField id="smtp-port" label="Port" required>
                  <input
                    id="smtp-port"
                    type="number"
                    placeholder="587 / 465"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                </FormField>

                <FormField id="smtp-secure" label="Security Encryption">
                  <select
                    id="smtp-secure"
                    value={smtpForm.secure ? 'ssl' : 'tls'}
                    onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.value === 'ssl' })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  >
                    <option value="tls">STARTTLS / TLS (Port 587 / 25)</option>
                    <option value="ssl">SSL (Port 465)</option>
                  </select>
                </FormField>

                <FormField id="smtp-user" label="SMTP Username / API User">
                  <input
                    id="smtp-user"
                    type="text"
                    placeholder="user@domain.com / apikey"
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                </FormField>

                <FormField
                  id="smtp-pass"
                  label={`SMTP Password ${smtpSettings.data?.hasPassword ? '(Vaulted)' : ''}`}
                >
                  <div className="relative mt-1.5">
                    <input
                      id="smtp-pass"
                      type={showSmtpPassword ? 'text' : 'password'}
                      placeholder={smtpSettings.data?.hasPassword ? '•••••••••••• (Leave blank to keep current)' : 'Enter SMTP password'}
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>

                <FormField id="smtp-from" label="Sender From Email" required>
                  <input
                    id="smtp-from"
                    type="email"
                    placeholder="crm@yourcompany.com"
                    value={smtpForm.from}
                    onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: APP CONNECTORS & VAULT ── */}
        {activeTab === 'apps' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appProviders.map((p) => {
              const conn = (conns.data ?? []).find((c) => c.provider === p.key);
              const connected = conn?.status === 'connected';

              return (
                <div
                  key={p.key}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur-md transition hover:shadow-md dark:border-slate-800/90 dark:bg-slate-900/80"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Plug className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                        <p className="text-[11px] text-slate-400">{p.category}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Badge tone={connected ? 'emerald' : 'gray'} dot>
                        {connected ? 'Active Connection' : 'Not Connected'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/70">
                    {connected ? (
                      <div className="flex w-full items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenConfigure(p)}
                          className="text-xs font-bold"
                        >
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testProvider.mutate(conn.id)}
                          disabled={testProvider.isPending}
                          className="text-xs font-bold"
                        >
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDisconnecting(conn)}
                          disabled={disconnect.isPending || !manage}
                          className="text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleOpenConfigure(p)}
                        disabled={!manage}
                        className="w-full bg-brand-600 text-xs font-bold text-white shadow-sm"
                      >
                        Connect Provider
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Configure Provider Modal ── */}
      {connecting && (
        <Modal
          title={`Configure ${connecting.name}`}
          onClose={() => {
            setConnecting(null);
            setVisibleSecrets({});
          }}
        >
          <div className="space-y-4">
            {connecting.key === 'whatsapp' && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Meta Inbound Webhook Callback URL</span>
                  <Badge tone="emerald">Live</Badge>
                </div>
                <code className="block break-all bg-slate-950/80 p-2 rounded text-[11px] font-mono text-emerald-300 border border-emerald-500/20">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/whatsapp` : '/api/v1/webhooks/whatsapp'}
                </code>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Set this URL in Meta for Developers &rarr; WhatsApp &rarr; Configuration &rarr; Webhook, and match the Verify Token below.
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your credentials for <strong className="text-slate-900 dark:text-white">{connecting.name}</strong>. Secret keys are encrypted with AES-256-GCM and securely vaulted on the backend.
            </p>

            {connecting.fields.map((f) => {
              const isVisible = visibleSecrets[f.key] || false;
              const isConnected = (conns.data ?? []).some((c) => c.provider === connecting.key);

              return (
                <FormField key={f.key} id={`field-${f.key}`} label={f.label} required={f.required && !isConnected}>
                  {f.type === 'select' && f.options ? (
                    <select
                      id={`field-${f.key}`}
                      value={form[f.key] || f.options[0]?.value}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                    >
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        id={`field-${f.key}`}
                        type={f.secret && !isVisible ? 'password' : 'text'}
                        placeholder={
                          isConnected && f.secret
                            ? '•••••••••••• (Leave blank to keep existing secret)'
                            : f.placeholder || f.label
                        }
                        value={form[f.key] || ''}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                      />
                      {f.secret && (
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility(f.key)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  )}
                </FormField>
              );
            })}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConnecting(null);
                  setVisibleSecrets({});
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
                className="bg-brand-600 text-white shadow-sm"
              >
                {connect.isPending ? 'Saving...' : 'Save & Encrypt Keys'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Disconnect Confirmation Modal ── */}
      {disconnecting && (
        <Modal
          title={`Disconnect ${disconnecting.providerName}`}
          onClose={() => setDisconnecting(null)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Are you sure you want to disconnect this integration?</p>
                <p className="mt-1">
                  Vaulted credentials for {disconnecting.providerName} will be safely revoked. Historical payment and invoice records will remain intact.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDisconnecting(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => disconnect.mutate(disconnecting.id)}
                disabled={disconnect.isPending}
                className="bg-rose-600 text-white shadow-sm hover:bg-rose-500"
              >
                {disconnect.isPending ? 'Disconnecting...' : 'Confirm Disconnect'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Production Live Mode Confirmation Modal ── */}
      {pendingLiveConfirm && (
        <Modal
          title="Enable Live Production Payments?"
          onClose={() => setPendingLiveConfirm(false)}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Caution: Production Live Mode</p>
                <p className="mt-1">
                  You are switching payment processing to <strong>Production Live Mode</strong>. Real monetary transactions, bank card debits, and UPI transfers will be executed. Ensure production gateway credentials are valid.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPendingLiveConfirm(false)}>
                Stay in Sandbox / Test
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPaymentMode('live');
                  setPendingLiveConfirm(false);
                }}
                className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
              >
                Confirm Live Mode
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Send Test Email Modal ── */}
      {testEmailModal && (
        <Modal
          title="Send Test Verification Email"
          onClose={() => setTestEmailModal(false)}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter an email address to receive a real-time SMTP test payload and verify delivery headers.
            </p>

            <FormField id="testRecipient" label="Recipient Email Address" required>
              <input
                id="testRecipient"
                type="email"
                placeholder="you@yourdomain.com"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTestEmailModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => sendTestEmail.mutate(testRecipient)}
                disabled={!testRecipient || sendTestEmail.isPending}
                className="bg-brand-600 text-white shadow-sm"
              >
                {sendTestEmail.isPending ? 'Dispatching...' : 'Dispatch Test Email'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardTemplate>
  );
}
