'use client';
// src/components/organisms/WhatsAppWebhookModal.tsx — Enterprise WhatsApp Meta Cloud API & Inbound Webhook Configuration Assistant
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Webhook,
  Key,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Server,
  Zap,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { Modal } from '../molecules/Modal';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Spinner } from '../atoms/Spinner';

interface Connection {
  id: string;
  provider: string;
  providerName: string;
  category: string;
  label: string | null;
  status: string;
  secretFields: string[];
  config: Record<string, any>;
}

export function WhatsAppWebhookModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'test' | 'guide'>('setup');

  // Form State
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('crm_wa_verify_' + Math.random().toString(36).substring(2, 10));

  // Simulation & Test State
  const [testTokenInput, setTestTokenInput] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [simPhone, setSimPhone] = useState('+1 (555) 234-5678');
  const [simMessage, setSimMessage] = useState('Hello! I would like to know more about your CRM pricing.');
  const [simResult, setSimResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Queries
  const conns = useQuery({
    queryKey: ['connections'],
    queryFn: async () => unwrap<Connection[]>((await api.get('/connections')).data),
  });

  const waConn = (conns.data ?? []).find((c) => c.provider === 'whatsapp');

  useEffect(() => {
    if (waConn) {
      if (waConn.config?.phoneNumberId) {
        setPhoneNumberId(String(waConn.config.phoneNumberId));
      }
    }
  }, [waConn]);

  // Derived Callback URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-crm-domain.com';
  const callbackUrl = `${origin}/api/v1/webhooks/whatsapp`;

  const copyToClipboard = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const generateRandomToken = () => {
    const random = 'crm_wa_token_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    setVerifyToken(random);
  };

  // Mutations
  const saveCredentials = useMutation({
    mutationFn: async () => {
      const secrets: Record<string, string> = {};
      const config: Record<string, string> = {
        phoneNumberId: phoneNumberId.trim(),
      };

      if (accessToken.trim()) secrets.accessToken = accessToken.trim();
      if (appSecret.trim()) secrets.appSecret = appSecret.trim();
      if (verifyToken.trim()) secrets.verifyToken = verifyToken.trim();

      if (waConn) {
        return api.patch(`/connections/${waConn.id}`, { secrets, config });
      } else {
        return api.post('/connections', {
          provider: 'whatsapp',
          secrets,
          config,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['wa-status'] });
      alert('WhatsApp Business credentials & Webhook settings vaulted successfully.');
    },
    onError: (err: any) => {
      alert(`Save failed: ${err.response?.data?.message || err.message}`);
    },
  });

  const testWebhook = useMutation({
    mutationFn: async () => {
      const res = await api.post('/whatsapp/test-webhook', {
        token: testTokenInput.trim() || verifyToken.trim(),
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      setTestResult({ ok: data.ok, message: data.message });
    },
    onError: (err: any) => {
      setTestResult({
        ok: false,
        message: err.response?.data?.message || 'Verification challenge test failed.',
      });
    },
  });

  const simulateInbound = useMutation({
    mutationFn: async () => {
      const res = await api.post('/whatsapp/simulate-inbound', {
        phone: simPhone,
        body: simMessage,
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      setSimResult({
        ok: true,
        message: `Inbound message received & processed successfully from ${simPhone}. Check Live Inbox!`,
      });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
      qc.invalidateQueries({ queryKey: ['wa-thread'] });
    },
    onError: (err: any) => {
      setSimResult({
        ok: false,
        message: err.response?.data?.message || 'Failed to simulate inbound message.',
      });
    },
  });

  return (
    <Modal
      title="WhatsApp Meta Cloud API & Inbound Webhook Center"
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-800/80 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
              activeTab === 'setup'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            ⚙️ Credentials & Webhook
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
              activeTab === 'test'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🧪 Test & Simulation Bench
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            📖 Step-by-Step Meta Guide
          </button>
        </div>

        {/* ── TAB 1: SETUP ── */}
        {activeTab === 'setup' && (
          <div className="space-y-4">
            {/* Live Webhook Endpoint Callout */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Meta Inbound Webhook Callback URL
                  </span>
                </div>
                <Badge tone="emerald" dot>
                  Live Endpoint
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <code className="flex-1 overflow-x-auto rounded-xl border border-emerald-500/20 bg-slate-950/80 p-2.5 font-mono text-xs text-emerald-300">
                  {callbackUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(callbackUrl, 'callbackUrl')}
                  className="shrink-0 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                >
                  {copiedField === 'callbackUrl' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Paste this Callback URL in Meta for Developers &rarr; WhatsApp &rarr; Configuration &rarr; Webhook, and subscribe to <strong>messages</strong>.
              </p>
            </div>

            {/* Credentials Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  System User / Permanent Access Token <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showAccessToken ? 'text' : 'password'}
                    placeholder={waConn ? '•••••••••••• (Leave blank to keep vaulted token)' : 'EAAG...'}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="104928374829103"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  App Secret (HMAC-SHA256 Signature)
                </label>
                <div className="relative mt-1">
                  <input
                    type={showAppSecret ? 'text' : 'password'}
                    placeholder={waConn ? '•••••••••••• (Keep current)' : 'From App Settings -> Basic'}
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAppSecret(!showAppSecret)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAppSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Verify Token (hub.verify_token)
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomToken}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate Secure Token</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="my_secure_verify_token"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(verifyToken, 'verifyToken')}
                    className="shrink-0 text-xs font-bold"
                  >
                    {copiedField === 'verifyToken' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AES-256-GCM encrypted vaulting ensures tokens are securely stored.
              </span>
              <Button
                onClick={() => saveCredentials.mutate()}
                disabled={saveCredentials.isPending || (!phoneNumberId && !waConn)}
                loading={saveCredentials.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Save WhatsApp Credentials</span>
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 2: TEST & LIVE SIMULATION ── */}
        {activeTab === 'test' && (
          <div className="space-y-5">
            {/* Section A: Challenge Verification Test */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Verify Meta Webhook Challenge
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tests if your Verify Token matches the server vault and responds with 200 OK challenge response.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => testWebhook.mutate()}
                  disabled={testWebhook.isPending}
                  loading={testWebhook.isPending}
                  className="bg-brand-600 text-white font-bold"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Run Verification Test</span>
                </Button>
              </div>

              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                    testResult.ok
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            {/* Section B: Inbound Message Simulator */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  2. Simulate Inbound WhatsApp Message
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Simulate an incoming message from a customer to test end-to-end webhook pipeline, CRM lead linking, and workflow auto-replies.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Sender Phone Number
                  </label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Message Body
                  </label>
                  <input
                    type="text"
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  onClick={() => simulateInbound.mutate()}
                  disabled={simulateInbound.isPending || !simPhone || !simMessage}
                  loading={simulateInbound.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch Simulated Inbound Message</span>
                </Button>
              </div>

              {simResult && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                    simResult.ok
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {simResult.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{simResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: STEP-BY-STEP META GUIDE ── */}
        {activeTab === 'guide' && (
          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">1</span>
                <span>Create Meta App</span>
              </div>
              <p className="pl-7 text-[11px] text-slate-500 dark:text-slate-400">
                Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-brand-500 underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="h-3 w-3 inline" /></a> &rarr; My Apps &rarr; Create App &rarr; Select <strong>Business</strong> app type.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">2</span>
                <span>Add WhatsApp Product & Copy Phone Number ID</span>
              </div>
              <p className="pl-7 text-[11px] text-slate-500 dark:text-slate-400">
                Inside your app dashboard, add <strong>WhatsApp</strong>. In <em>API Setup</em>, copy your <strong>Phone Number ID</strong> and paste it into the CRM configuration tab.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">3</span>
                <span>Generate Permanent System User Token</span>
              </div>
              <p className="pl-7 text-[11px] text-slate-500 dark:text-slate-400">
                Go to Meta Business Settings &rarr; System Users &rarr; Generate Token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> scopes.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">4</span>
                <span>Configure Webhook Callback & Verify Token</span>
              </div>
              <p className="pl-7 text-[11px] text-slate-500 dark:text-slate-400">
                In WhatsApp &rarr; Configuration, set Callback URL to <code>{callbackUrl}</code> and enter the same <strong>Verify Token</strong>. Click <em>Verify and Save</em>, then manage webhook fields and subscribe to <code>messages</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
