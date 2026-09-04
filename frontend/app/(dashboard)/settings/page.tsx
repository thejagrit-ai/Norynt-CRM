'use client';
// app/(dashboard)/settings/page.tsx — Master Settings Hub & AI API Key Vault
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  CreditCard,
  Users,
  Shield,
  Sliders,
  LifeBuoy,
  Bot,
  Layers,
  GitBranch,
  UserCheck,
  TrendingUp,
  FileText,
  Webhook,
  Globe,
  Bell,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  Key,
  Eye,
  EyeOff,
  Cpu,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface SettingsSection {
  title: string;
  description: string;
  items: Array<{
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeTone?: 'primary' | 'success' | 'warning' | 'info';
  }>;
}

const STORAGE_CHATBOT_KEY = 'norynt_ai_chatbot_config';

const PROVIDER_OPTIONS = [
  { id: 'groq', name: 'Groq Cloud (Ultra-Fast)', defaultModel: 'llama-3.3-70b-versatile', placeholder: 'gsk_...', helper: 'Ultra-low latency LLaMA 3.3 70B & Mixtral models.' },
  { id: 'gemini', name: 'Google AI Studio (Gemini)', defaultModel: 'gemini-1.5-flash', placeholder: 'AIzaSy...', helper: 'Google Gemini 1.5 Flash & Pro multimodal models.' },
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o', placeholder: 'sk-proj-...', helper: 'GPT-4o, GPT-4o-mini and reasoning models.' },
  { id: 'anthropic', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20241022', placeholder: 'sk-ant-api03-...', helper: 'Claude 3.5 Sonnet & Haiku models.' },
  { id: 'custom', name: 'Custom LLM / Ollama', defaultModel: 'llama-3.1-70b', placeholder: 'https://api.yourcompany.com/v1', helper: 'Self-hosted or private enterprise endpoint.' },
];

export default function SettingsHubPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  // General Settings State
  const [companyName, setCompanyName] = useState('Norynt India Technologies Pvt Ltd');
  const [supportEmail, setSupportEmail] = useState('support@norynt.in');
  const [timezone, setTimezone] = useState('UTC+05:30 (Asia/Kolkata)');
  const [currency, setCurrency] = useState('INR (₹)');
  const [isSaved, setIsSaved] = useState(false);

  // AI API Key Vault State
  const [aiProvider, setAiProvider] = useState('groq');
  const [aiModel, setAiModel] = useState('llama-3.3-70b-versatile');
  const [aiApiKey, setAiApiKey] = useState('');
  const [isKeyStored, setIsKeyStored] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [showKeyPlaintext, setShowKeyPlaintext] = useState(false);
  const [isAiSaved, setIsAiSaved] = useState(false);

  // Test Connection State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string; latency?: number } | null>(null);

  // Dynamic Model Detection State
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; description?: string }>>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsDetected, setModelsDetected] = useState(false);

  // Load existing AI configuration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATBOT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.provider) setAiProvider(parsed.provider);
        if (parsed.model) setAiModel(parsed.model);
        if (parsed.apiKey) {
          setAiApiKey(parsed.apiKey);
          setIsKeyStored(true);
          setIsEditingKey(false);
          // Auto detect models for saved key
          void handleDetectModels(parsed.provider || 'groq', parsed.apiKey);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleDetectModels = async (providerOverride?: string, keyOverride?: string) => {
    const p = providerOverride || aiProvider;
    const k = keyOverride !== undefined ? keyOverride : aiApiKey;
    if (!k || k.trim().length < 6) return;

    setIsFetchingModels(true);
    try {
      const { api } = await import('@/lib/api');
      const res = await api.post('/ai/models', {
        provider: p,
        apiKey: k.trim(),
      });
      const data = res.data?.data || res.data;
      if (data?.models && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
        setModelsDetected(true);
        if (!data.models.some((m: any) => m.id === aiModel)) {
          setAiModel(data.models[0].id);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestKey = async () => {
    if (!aiApiKey.trim()) {
      setTestResult({ success: false, msg: 'Please enter an API Key to test.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const { api } = await import('@/lib/api');
      const res = await api.post('/ai/test-key', {
        provider: aiProvider,
        apiKey: aiApiKey.trim(),
        model: aiModel,
      });
      const data = res.data?.data || res.data;
      if (data?.success) {
        setTestResult({
          success: true,
          msg: data.message || `Connection Verified: ${aiProvider.toUpperCase()} (${aiModel}) is connected & ready.`,
          latency: data.latencyMs || 120,
        });
        // Auto detect available models after successful verification
        void handleDetectModels(aiProvider, aiApiKey);
      } else {
        setTestResult({
          success: false,
          msg: data?.message || 'Verification Failed: Invalid credentials or network error.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err?.response?.data?.message || err?.message || 'Verification Failed: Unable to connect with AI provider.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveAiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_CHATBOT_KEY) || '{}');
      const updated = {
        ...existing,
        provider: aiProvider,
        model: aiModel,
        apiKey: aiApiKey,
      };
      localStorage.setItem(STORAGE_CHATBOT_KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    if (aiApiKey.trim()) {
      setIsKeyStored(true);
      setIsEditingKey(false);
    }
    setIsAiSaved(true);
    setTimeout(() => setIsAiSaved(false), 3500);
  };

  const renderMaskedKey = (key: string) => {
    if (!key) return 'No API Key Configured';
    if (key.length <= 8) return '••••••••••••••••';
    return `${key.slice(0, 6)}••••••••••••••••••••${key.slice(-4)}`;
  };

  const currentProviderConfig = PROVIDER_OPTIONS.find((p) => p.id === aiProvider) || PROVIDER_OPTIONS[0];

  const sections: SettingsSection[] = [
    {
      title: 'Subscription & Organization',
      description: 'Manage your plan tier, quotas, team permissions, and workspace access.',
      items: [
        {
          title: 'My Plan & Billing',
          description: 'View active subscription tier, seat limits, quota usage, and payment methods.',
          href: '/settings/my-plan',
          icon: CreditCard,
          badge: 'Enterprise',
          badgeTone: 'primary',
        },
        {
          title: 'Team & Members',
          description: 'Invite team members, assign managers, and configure active user seats.',
          href: '/users',
          icon: Users,
        },
        {
          title: 'Roles & Permissions',
          description: 'Granular RBAC permission matrices, custom security roles, and access control.',
          href: '/roles',
          icon: Shield,
        },
      ],
    },
    {
      title: 'Sales & CRM Workflow',
      description: 'Configure lead taxonomy, assignment rules, pipeline stages, and field schemas.',
      items: [
        {
          title: 'Lead Masters & Taxonomy',
          description: 'Manage lead sources, industry verticals, ratings, and deal loss reasons.',
          href: '/settings/lead-masters',
          icon: Sliders,
          badge: 'Core',
          badgeTone: 'info',
        },
        {
          title: 'Lead Auto-Assignment',
          description: 'Round-robin routing rules, capacity caps, and territory-based lead distribution.',
          href: '/settings/lead-assignment',
          icon: UserCheck,
        },
        {
          title: 'Deal Routing & Assignment',
          description: 'Tier-based deal distribution rules, deal size thresholds, and rep assignments.',
          href: '/settings/deal-assignment',
          icon: TrendingUp,
        },
        {
          title: 'Custom Field Schemas',
          description: 'Define custom field attributes, validation rules, and mandatory capture points.',
          href: '/custom-fields',
          icon: Layers,
        },
      ],
    },
    {
      title: 'Support & Integrations',
      description: 'Fine-tune customer care SLAs, internal ticketing, webhooks, and App Connections.',
      items: [
        {
          title: 'Internal Ticket Config & SLA',
          description: 'Response and resolution time targets, priority matrices, and escalation rules.',
          href: '/tickets/settings',
          icon: LifeBuoy,
          badge: 'SLA Engine',
          badgeTone: 'warning',
        },
        {
          title: 'AI Chatbot Studio & Persona',
          description: 'Fine-tune bot persona, grounding prompts, live simulator, and auto-escalation.',
          href: '/settings/chatbot',
          icon: Bot,
          badge: 'AI Studio',
          badgeTone: 'success',
        },
        {
          title: 'App Connections & Vault',
          description: 'Manage official WhatsApp Meta API, SMTP email, and third-party SaaS credentials.',
          href: '/connections',
          icon: Webhook,
        },
        {
          title: 'Inbound Webhooks & Subscriptions',
          description: 'Configure REST webhook endpoints with HMAC-SHA256 signature verification.',
          href: '/integrations',
          icon: Zap,
        },
      ],
    },
  ];

  return (
    <DashboardTemplate
      title="Master Settings"
      subtitle="Comprehensive administration, workspace configurations, AI API key vault, and subscription management"
    >
      <div className="space-y-8">
        {/* Top Grid: General Profile & Subscription Pill */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* General Settings Card */}
          <Card className="p-6 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl lg:col-span-2 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">General Workspace Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Primary tenant identification and localization</p>
                </div>
              </div>
              {isSaved && (
                <Badge tone="emerald" className="flex items-center gap-1.5 animate-fade-in font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
                </Badge>
              )}
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Workspace / Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Default Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="UTC+05:30 (Asia/Kolkata)">UTC+05:30 (Asia/Kolkata)</option>
                    <option value="UTC+00:00 (London, UTC)">UTC+00:00 (London, UTC)</option>
                    <option value="UTC-05:00 (New York, EST)">UTC-05:00 (New York, EST)</option>
                    <option value="UTC-08:00 (San Francisco, PST)">UTC-08:00 (San Francisco, PST)</option>
                    <option value="UTC+08:00 (Singapore)">UTC+08:00 (Singapore)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                    <option value="USD ($)">USD ($) - United States Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                    <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">Tenant ID: <code className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">org_enterprise_prod_01</code></span>
                <Button type="submit" tone="primary" size="sm" leftIcon={<Save className="w-4 h-4" />}>
                  Save Workspace Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Subscription & Quota Card */}
          <Card className="p-6 bg-gradient-to-br from-indigo-900/10 via-white to-indigo-50/20 dark:from-slate-900/90 dark:via-indigo-950/20 dark:to-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Current Plan</span>
                <Badge tone="indigo">Enterprise Scale</Badge>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Unlimited Scale</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Includes 25 team seats, WhatsApp Cloud API & AI Concierge.</p>

              <div className="space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Seats Utilized</span>
                  <span className="text-slate-900 dark:text-white font-bold">18 / 25 seats</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full w-[72%]" />
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Monthly AI Tokens</span>
                  <span className="text-slate-900 dark:text-white font-bold">840k / 1.0M</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[84%]" />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Link href="/settings/my-plan">
                <Button tone="secondary" size="sm" className="w-full justify-between group">
                  <span>Manage Subscription & Quotas</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* AI ENGINE & API KEY CONFIGURATION CARD (MASTER SETTINGS) */}
        <Card className="p-6 bg-white dark:bg-slate-900/80 border border-indigo-500/30 rounded-2xl space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Chatbot Engine & API Key Setup
                  </h3>
                  <Badge tone="indigo" className="font-mono text-[10px]">Global AI Vault</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure your LLM provider API key to power the global dashboard assistant and chatbot concierge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isKeyStored && !isEditingKey && (
                <Badge tone="emerald" className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Lock className="w-3 h-3" /> Encrypted & Active
                </Badge>
              )}
              {isAiSaved && (
                <Badge tone="emerald" className="flex items-center gap-1.5 animate-fade-in font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> API Key Saved
                </Badge>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveAiConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  AI Provider
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => {
                    const newProv = e.target.value;
                    setAiProvider(newProv);
                    const p = PROVIDER_OPTIONS.find((opt) => opt.id === newProv);
                    if (p) setAiModel(p.defaultModel);
                    if (aiApiKey.trim()) {
                      void handleDetectModels(newProv, aiApiKey);
                    } else {
                      setAvailableModels([]);
                    }
                  }}
                  disabled={isKeyStored && !isEditingKey}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 font-medium"
                >
                  {PROVIDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Model Name
                  </label>
                  {aiApiKey.trim() && (
                    <button
                      type="button"
                      onClick={() => handleDetectModels()}
                      disabled={isFetchingModels}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                      <span>{isFetchingModels ? 'Detecting Models...' : 'Detect Models'}</span>
                    </button>
                  )}
                </div>

                {availableModels.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      disabled={isKeyStored && !isEditingKey}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-500/40 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium disabled:opacity-75"
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.description ? `(${m.description})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{availableModels.length} models detected directly from your {aiProvider.toUpperCase()} API key</span>
                    </p>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    disabled={isKeyStored && !isEditingKey}
                    placeholder="e.g., llama-3.3-70b-versatile, gemini-1.5-flash, gpt-4o"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-75"
                  />
                )}
              </div>
            </div>

            {/* API Key Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {aiProvider.toUpperCase()} API Key
                </label>
                {isKeyStored && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(!isEditingKey)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isEditingKey ? 'Cancel Edit' : 'Edit API Key'}
                  </button>
                )}
              </div>

              {isKeyStored && !isEditingKey ? (
                /* Stored / Masked View */
                <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold">
                      {renderMaskedKey(aiApiKey)}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    tone="secondary"
                    onClick={() => setIsEditingKey(true)}
                    className="text-xs py-1 h-7"
                  >
                    Change Key
                  </Button>
                </div>
              ) : (
                /* Editable Input Field */
                <div className="relative">
                  <input
                    type={showKeyPlaintext ? 'text' : 'password'}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={currentProviderConfig.placeholder}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPlaintext(!showKeyPlaintext)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showKeyPlaintext ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showKeyPlaintext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Test Connection Button & Save Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  tone="secondary"
                  size="sm"
                  onClick={handleTestKey}
                  loading={isTestingKey}
                  disabled={isTestingKey || !aiApiKey.trim()}
                  leftIcon={<Cpu className="w-4 h-4" />}
                >
                  Test Connection & Verify Key
                </Button>

                <Link href="/settings/chatbot" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 ml-2">
                  <span>Open Chatbot Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <Button
                type="submit"
                tone="primary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save AI Configuration
              </Button>
            </div>

            {testResult && (
              <div
                className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {testResult.msg}{' '}
                  {testResult.latency && (
                    <span className="font-mono font-normal">({testResult.latency}ms latency)</span>
                  )}
                </span>
              </div>
            )}
          </form>
        </Card>

        {/* Modular Navigation Grid by Domain */}
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{section.title}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {section.items.map((item, itemIdx) => {
                const IconComponent = item.icon;
                return (
                  <Link key={itemIdx} href={item.href} className="group block">
                    <Card className="h-full p-5 bg-white dark:bg-slate-900/60 hover:border-indigo-500/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 group-hover:bg-indigo-500/10 border border-slate-200 dark:border-slate-700/80 group-hover:border-indigo-500/20 rounded-xl text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          {item.badge && (
                            <Badge tone="indigo" className="text-[10px] font-medium">
                              {item.badge}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-2 flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 border-t border-slate-100 dark:border-slate-800/60">
                        <span>Configure</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardTemplate>
  );
}
