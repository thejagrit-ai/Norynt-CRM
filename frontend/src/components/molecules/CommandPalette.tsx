'use client';
// src/components/molecules/CommandPalette.tsx — Spotlight command center (⌘K) with omnisearch, i18n & Portal.
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Briefcase,
  Users,
  Building2,
  CheckSquare,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  Settings,
  LayoutDashboard,
  Kanban,
  X,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface SearchResults {
  query: string;
  deals: { id: string; title: string; company: string | null; value: string | null; status: string }[];
  contacts: { id: string; firstName: string; lastName: string; email: string | null }[];
  companies: { id: string; name: string; domain: string | null }[];
  tasks: { id: string; title: string; status: string; priority: string }[];
  tickets: { id: string; number: string; subject: string; priority: string }[];
  leads: { id: string; firstName: string; lastName: string; companyName: string | null }[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenQuickCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCreate: (type: string) => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          onClose();
        }
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = orig;
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setQuery('');
      setResults(null);
      setAiAnswer(null);
    }
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: query } });
        setResults(unwrap<SearchResults>(res.data));
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAskAi = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.post('/ai/query', { prompt: query });
      const data = unwrap<{ answer: string }>(res.data);
      setAiAnswer(data.answer);
    } catch {
      setAiAnswer(t('ai.errGeneric') || 'AI analysis temporarily unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const quickActions = [
    { label: t('btn.newDeal') || t('qc.deal') || 'New Deal', type: 'deal', icon: <Briefcase className="h-4 w-4 text-brand-500" /> },
    { label: t('tasks.quickAddBtn') || t('qc.task') || 'New Task', type: 'task', icon: <CheckSquare className="h-4 w-4 text-emerald-500" /> },
    { label: t('btn.newLead') || t('qc.lead') || 'New Lead', type: 'lead', icon: <Users className="h-4 w-4 text-sky-500" /> },
    { label: t('tickets.title') || t('qc.ticket') || 'New Ticket', type: 'ticket', icon: <LifeBuoy className="h-4 w-4 text-amber-500" /> },
  ];

  const navLinks = [
    { label: t('nav.dashboard') || 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4 text-slate-400" /> },
    { label: t('nav.deals') || 'Deals', path: '/deals', icon: <Kanban className="h-4 w-4 text-brand-500" /> },
    { label: t('nav.tasks') || 'Tasks', path: '/tasks', icon: <CheckSquare className="h-4 w-4 text-emerald-500" /> },
    { label: t('nav.tickets') || 'Tickets', path: '/tickets', icon: <LifeBuoy className="h-4 w-4 text-amber-500" /> },
    { label: t('nav.contacts') || 'Contacts', path: '/contacts', icon: <Users className="h-4 w-4 text-sky-500" /> },
    { label: t('nav.companies') || 'Companies', path: '/companies', icon: <Building2 className="h-4 w-4 text-purple-500" /> },
    { label: t('nav.invoices') || 'Invoices', path: '/invoices', icon: <Receipt className="h-4 w-4 text-rose-500" /> },
    { label: t('nav.quotes') || 'Quotes', path: '/quotes', icon: <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> },
    { label: t('nav.masterSettings') || 'Settings', path: '/settings', icon: <Settings className="h-4 w-4 text-slate-400" /> },
  ];

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95 dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10 animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Search Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-5 w-5 text-brand-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) handleAskAi();
            }}
            placeholder={t('palette.searchPh') || 'Search everything or ask AI... (Press Enter to query AI)'}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500"
          />
          {loading && <Spinner size="sm" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                setAiAnswer(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* AI Answer Box */}
        {aiLoading && (
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-brand-50/50 p-4 text-xs font-semibold text-brand-700 dark:border-slate-800 dark:bg-brand-950/30 dark:text-brand-300">
            <Sparkles className="h-4 w-4 animate-pulse text-brand-500" />
            <span>{t('palette.askAiLoading') || 'Synthesizing response across CRM records...'}</span>
          </div>
        )}
        {aiAnswer && (
          <div className="shrink-0 border-b border-slate-100 bg-brand-50/60 p-4 space-y-1 dark:border-slate-800 dark:bg-brand-950/40">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Norynt AI Insights:</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed dark:text-slate-200">{aiAnswer}</p>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Ask AI Banner */}
          {query.trim().length >= 2 && !aiAnswer && (
            <button
              onClick={handleAskAi}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-brand-200 bg-brand-50/60 hover:bg-brand-100/60 text-left transition dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-medium text-brand-900 dark:text-brand-200">
                  {t('palette.askAi') || 'Ask AI'}: <strong className="font-bold">&ldquo;{query}&rdquo;</strong>
                </span>
              </div>
              <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">Enter ↵</span>
            </button>
          )}

          {/* Real-time Search Results */}
          {results && (
            <div className="space-y-3">
              {results.deals.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.deals') || 'Deals'}
                  </p>
                  <div className="space-y-1">
                    {results.deals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => navigate('/deals')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Kanban className="h-3.5 w-3.5 text-brand-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{d.title}</span>
                          {d.company && <span className="text-[11px] text-slate-400">({d.company})</span>}
                        </div>
                        {d.value && <Badge tone="indigo">{d.value}</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.contacts.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.contacts') || 'Contacts'}
                  </p>
                  <div className="space-y-1">
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate('/contacts')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="h-3.5 w-3.5 text-sky-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">
                            {c.firstName} {c.lastName}
                          </span>
                        </div>
                        {c.email && <span className="text-[11px] text-slate-400">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.companies.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.companies') || 'Companies'}
                  </p>
                  <div className="space-y-1">
                    {results.companies.map((co) => (
                      <button
                        key={co.id}
                        onClick={() => navigate('/companies')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-3.5 w-3.5 text-purple-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{co.name}</span>
                        </div>
                        {co.domain && <span className="text-[11px] text-slate-400">{co.domain}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.tasks') || 'Tasks'}
                  </p>
                  <div className="space-y-1">
                    {results.tasks.map((tk) => (
                      <button
                        key={tk.id}
                        onClick={() => navigate('/tasks')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">{tk.title}</span>
                        </div>
                        <Badge tone="gray">{tk.status}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.tickets.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.tickets') || 'Tickets'}
                  </p>
                  <div className="space-y-1">
                    {results.tickets.map((tkt) => (
                      <button
                        key={tkt.id}
                        onClick={() => navigate('/tickets')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <LifeBuoy className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">
                            #{tkt.number} — {tkt.subject}
                          </span>
                        </div>
                        <Badge tone="amber">{tkt.priority}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.leads.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('nav.leads') || 'Leads'}
                  </p>
                  <div className="space-y-1">
                    {results.leads.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => navigate('/leads')}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="h-3.5 w-3.5 text-sky-500" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200">
                            {l.firstName} {l.lastName}
                          </span>
                        </div>
                        {l.companyName && <span className="text-[11px] text-slate-400">({l.companyName})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!query && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('palette.quickActions') || 'Quick Actions'}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {quickActions.map((qa) => (
                  <button
                    key={qa.type}
                    onClick={() => {
                      onClose();
                      onOpenQuickCreate(qa.type);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:bg-slate-800/60 text-left transition text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {qa.icon}
                    <span>{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {!query && (
            <div>
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('palette.navigation') || 'Navigation'}
              </p>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {navLinks.map((nl) => (
                  <button
                    key={nl.path}
                    onClick={() => navigate(nl.path)}
                    className="flex items-center gap-2 p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    {nl.icon}
                    <span className="truncate">{nl.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
