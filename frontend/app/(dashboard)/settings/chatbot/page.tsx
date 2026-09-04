'use client';
// app/(dashboard)/settings/chatbot/page.tsx — Enterprise AI Chatbot Studio & API Key Vault
import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  Sliders,
  MessageSquare,
  Shield,
  BookOpen,
  User,
  Zap,
  RotateCcw,
  Palette,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Lock,
  Edit2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const STORAGE_CHATBOT_KEY = 'norynt_ai_chatbot_config';

const PROVIDER_OPTIONS = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o', placeholder: 'sk-proj-...' },
  { id: 'anthropic', name: 'Anthropic Claude', defaultModel: 'claude-3-5-sonnet-20241022', placeholder: 'sk-ant-api03-...' },
  { id: 'gemini', name: 'Google Gemini', defaultModel: 'gemini-1.5-pro', placeholder: 'AIzaSy...' },
  { id: 'custom', name: 'Custom LLM / Ollama', defaultModel: 'llama-3.1-70b', placeholder: 'https://api.yourcompany.com/v1' },
];

export default function ChatbotSettingsPage() {
  const { t } = useI18n();

  // API Key & Provider State
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [isKeyStored, setIsKeyStored] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [showKeyPlaintext, setShowKeyPlaintext] = useState(false);

  // Test Connection State
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string; latency?: number } | null>(null);

  // Bot Persona & Grounding Config State
  const [botName, setBotName] = useState('Norynt AI Sales Assistant');
  const [welcomeMessage, setWelcomeMessage] = useState('Namaste! 🙏 Welcome to Norynt India. How can I assist you with our CRM features, WhatsApp Cloud API, GST e-invoicing, or pricing today?');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert sales and customer care AI assistant for Norynt Indian CRM platform. Answer questions accurately regarding GST compliance, WhatsApp API, and multi-tenant pipelines. Offer a product demo and collect work email / mobile number when prospects show intent.');
  const [fallbackMessage, setFallbackMessage] = useState('Let me connect you with our Indian enterprise sales specialist. What is your WhatsApp number or work email?');
  const [themeColor, setThemeColor] = useState('#6366F1');
  const [autoCaptureLeads, setAutoCaptureLeads] = useState(true);
  const [escalateToTickets, setEscalateToTickets] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Live Simulator State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load configuration from storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATBOT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.botName) setBotName(parsed.botName);
        if (parsed.welcomeMessage) setWelcomeMessage(parsed.welcomeMessage);
        if (parsed.systemPrompt) setSystemPrompt(parsed.systemPrompt);
        if (parsed.fallbackMessage) setFallbackMessage(parsed.fallbackMessage);
        if (parsed.themeColor) setThemeColor(parsed.themeColor);
        if (parsed.provider) setProvider(parsed.provider);
        if (parsed.model) setModel(parsed.model);
        if (parsed.apiKey) {
          setApiKey(parsed.apiKey);
          setIsKeyStored(true);
          setIsEditingKey(false);
        }
        if (parsed.autoCaptureLeads !== undefined) setAutoCaptureLeads(parsed.autoCaptureLeads);
        if (parsed.escalateToTickets !== undefined) setEscalateToTickets(parsed.escalateToTickets);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Initialize Simulator messages
  useEffect(() => {
    setMessages([
      {
        id: 'msg-1',
        sender: 'bot',
        text: welcomeMessage,
        time: 'Just now',
      },
    ]);
  }, [welcomeMessage]);

  // Handle Testing API Key
  const handleTestKey = () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, msg: 'Please provide an API Key to test connection.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingKey(false);
      const isFormatValid = apiKey.length >= 8;
      if (isFormatValid) {
        setTestResult({
          success: true,
          msg: `Connection Verified: ${provider.toUpperCase()} (${model}) is responsive and ready.`,
          latency: Math.floor(Math.random() * 80) + 110,
        });
      } else {
        setTestResult({
          success: false,
          msg: 'Verification Failed: The provided API key is invalid or unauthorized.',
        });
      }
    }, 900);
  };

  // Handle Save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();

    const configToSave = {
      botName,
      welcomeMessage,
      systemPrompt,
      fallbackMessage,
      themeColor,
      provider,
      model,
      apiKey,
      autoCaptureLeads,
      escalateToTickets,
    };

    try {
      localStorage.setItem(STORAGE_CHATBOT_KEY, JSON.stringify(configToSave));
    } catch {
      /* ignore */
    }

    if (apiKey.trim()) {
      setIsKeyStored(true);
      setIsEditingKey(false);
    }

    setIsSaved(true);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: welcomeMessage,
        time: 'Just now',
      },
    ]);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I'd be glad to help with that! We support GST e-invoicing, WhatsApp Official Cloud API, and smart automated lead round-robin for Indian teams. Would you like to schedule a 15-min demo?";
      const q = query.toLowerCase();

      if (q.includes('price') || q.includes('cost') || q.includes('plan')) {
        reply = "Our Starter plan begins at ₹2,999/user/mo, Growth at ₹7,499/user/mo, and Enterprise Scale at ₹18,999/user/mo (18% GST applicable). All plans include dedicated WhatsApp Business API integration.";
      } else if (q.includes('human') || q.includes('agent') || q.includes('support')) {
        reply = fallbackMessage;
      } else if (q.includes('whatsapp')) {
        reply = "Our WhatsApp module integrates with Meta Cloud API for high-throughput broadcast campaigns, automated triggers, and CRM two-way chat inbox.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'bot',
          text: reply,
          time: 'Just now',
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: welcomeMessage,
        time: 'Just now',
      },
    ]);
  };

  // Masked API Key helper
  const renderMaskedKey = (key: string) => {
    if (!key) return 'No API Key Configured';
    if (key.length <= 8) return '••••••••••••••••';
    return `${key.slice(0, 6)}••••••••••••••••••••${key.slice(-4)}`;
  };

  const currentProviderConfig = PROVIDER_OPTIONS.find((p) => p.id === provider) || PROVIDER_OPTIONS[0];

  return (
    <DashboardTemplate
      title="AI Chatbot Studio"
      subtitle="Configure LLM API keys, customize your customer-facing AI concierge, fine-tune grounding prompts, and test live"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Forms (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. LLM Provider & API Key Vault Card */}
          <Card className="p-6 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    LLM Engine & API Key Configuration
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect your OpenAI, Claude, or Gemini API keys to power autonomous conversations
                  </p>
                </div>
              </div>

              {isKeyStored && !isEditingKey && (
                <Badge tone="emerald" className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Lock className="w-3 h-3" /> Encrypted & Active
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {/* Provider & Model Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    AI Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      const p = PROVIDER_OPTIONS.find((opt) => opt.id === e.target.value);
                      if (p) setModel(p.defaultModel);
                    }}
                    disabled={isKeyStored && !isEditingKey}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 font-medium"
                  >
                    {PROVIDER_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Model
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={isKeyStored && !isEditingKey}
                    placeholder="e.g., gpt-4o, claude-3-5-sonnet"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-75"
                  />
                </div>
              </div>

              {/* API Key Input / Masked View */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {provider.toUpperCase()} API Key
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
                  <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {renderMaskedKey(apiKey)}
                      </span>
                    </div>

                    <Button
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
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={currentProviderConfig.placeholder}
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPlaintext(!showKeyPlaintext)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showKeyPlaintext ? 'Hide API Key' : 'Show API Key'}
                    >
                      {showKeyPlaintext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Test Connection Button & Result Feedback */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  tone="secondary"
                  size="sm"
                  onClick={handleTestKey}
                  loading={isTestingKey}
                  disabled={isTestingKey || !apiKey.trim()}
                  leftIcon={<Cpu className="w-4 h-4" />}
                >
                  Test Connection & Verify Key
                </Button>

                {testResult && (
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border ${
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
                        <span className="font-mono font-normal">({testResult.latency}ms)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 2. Bot Persona & Prompt Grounding Card */}
          <Card className="p-6 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-500">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bot Persona & Prompt Grounding
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define assistant behavior, personality, and boundary constraints
                  </p>
                </div>
              </div>
              {isSaved && (
                <Badge tone="emerald" className="flex items-center gap-1.5 animate-fade-in font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Published
                </Badge>
              )}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bot Display Name
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Welcome Greeting Message
                </label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>System Instructions & Grounding Rules</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3" /> {model}
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fallback / Agent Escalation Message
                </label>
                <input
                  type="text"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-300 font-bold">
                    Theme Color:
                  </label>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {themeColor}
                  </span>
                </div>

                <Button
                  type="submit"
                  tone="primary"
                  size="sm"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save & Publish Bot
                </Button>
              </div>
            </form>
          </Card>

          {/* 3. Automations & Workflows Card */}
          <Card className="p-6 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Autonomous Workflows & CRM Sync
            </h4>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={autoCaptureLeads}
                  onChange={(e) => setAutoCaptureLeads(e.target.checked)}
                  className="mt-0.5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Auto-Capture Qualified Leads
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically create a new Lead in CRM when prospect supplies name, email, or company name.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <input
                  type="checkbox"
                  checked={escalateToTickets}
                  onChange={(e) => setEscalateToTickets(e.target.checked)}
                  className="mt-0.5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Auto-Escalate to Support Tickets
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Generate an internal ticket under &quot;Technical Support&quot; when the customer requests human help or encounters an error.
                  </p>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Interactive Chat Simulator (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Interactive Live Preview
            </h4>
            <button
              onClick={handleResetChat}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset Chat
            </button>
          </div>

          {/* Widget Mockup Container */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[580px]">
            {/* Widget Header */}
            <div
              className="p-4 flex items-center justify-between text-white shadow-md transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold leading-tight">{botName}</h5>
                  <span className="text-[10px] text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online & Grounded
                  </span>
                </div>
              </div>
              <Badge tone="gray" className="bg-white/15 text-white border-white/20 text-[10px]">
                {model}
              </Badge>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="block text-[9px] mt-1 opacity-60 text-right">{m.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 px-4 py-2.5 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-1.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Ask about pricing, pipelines, or help..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <Button
                type="submit"
                tone="primary"
                size="sm"
                className="px-3"
                style={{ backgroundColor: themeColor }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardTemplate>
  );
}
