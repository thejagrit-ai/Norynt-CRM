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
  Package,
  Calendar,
  Tags,
  Swords,
  UserCog,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface SearchResults {
  query: string;
  deals: { id: string; title: string; company: string | null; value?: string | number | null; status: string }[];
  contacts: { id: string; firstName: string; lastName: string; email: string | null; phone?: string | null }[];
  companies: { id: string; name: string; domain: string | null }[];
  tasks: { id: string; title: string; status: string; priority: string }[];
  tickets: { id: string; number: string; subject: string; priority: string; status?: string }[];
  leads: { id: string; firstName: string; lastName: string; companyName: string | null; status?: string }[];
  invoices?: { id: string; number: string | null; customerName: string; status: string }[];
  quotes?: { id: string; number: string | null; customerName: string; status: string }[];
  products?: { id: string; name: string; sku: string | null; active: boolean }[];
  meetings?: { id: string; title: string; startsAt: string; location: string | null }[];
  brands?: { id: string; name: string; sector: string | null; niche: string | null }[];
  competitors?: { id: string; name: string; domain: string | null }[];
  users?: { id: string; firstName: string; lastName: string; email: string; isActive: boolean }[];
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenQuickCreate,
  initialQuery = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickCreate: (type: string) => void;
  initialQuery?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(initialQuery);
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
      if (initialQuery) {
        setQuery(initialQuery);
      }
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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
  }, [isOpen, onClose, initialQuery]);

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

  const handleFullSearch = () => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const hasAnyResults = results && (
    (results.deals?.length || 0) > 0 ||
    (results.contacts?.length || 0) > 0 ||
    (results.companies?.length || 0) > 0 ||
    (results.leads?.length || 0) > 0 ||
    (results.tasks?.length || 0) > 0 ||
    (results.tickets?.length || 0) > 0 ||
    (results.invoices?.length || 0) > 0 ||
    (results.quotes?.length || 0) > 0 ||
    (results.products?.length || 0) > 0 ||
    (results.meetings?.length || 0) > 0 ||
    (results.brands?.length || 0) > 0 ||
    (results.competitors?.length || 0) > 0 ||
    (results.users?.length || 0) > 0
  );

  const quickActions = [
    { label: t('btn.newDeal') || 'New Deal', type: 'deal', icon: <Briefcase className="h-4 w-4 text-brand-500" /> },
    { label: t('tasks.quickAddBtn') || 'New Task', type: 'task', icon: <CheckSquare className="h-4 w-4 text-emerald-500" /> },
    { label: t('btn.newLead') || 'New Lead', type: 'lead', icon: <UserCheck className="h-4 w-4 text-sky-500" /> },
    { label: t('tickets.title') || 'New Ticket', type: 'ticket', icon: <LifeBuoy className="h-4 w-4 text-amber-500" /> },
  ];

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-4 w-4 text-slate-400" /> },
    { label: 'Deals', path: '/deals', icon: <Kanban className="h-4 w-4 text-brand-500" /> },
    { label: 'Leads', path: '/leads', icon: <UserCheck className="h-4 w-4 text-sky-500" /> },
    { label: 'Contacts', path: '/contacts', icon: <Users className="h-4 w-4 text-blue-500" /> },
    { label: 'Companies', path: '/companies', icon: <Building2 className="h-4 w-4 text-purple-500" /> },
    { label: 'Tasks', path: '/tasks', icon: <CheckSquare className="h-4 w-4 text-emerald-500" /> },
    { label: 'Tickets', path: '/tickets', icon: <LifeBuoy className="h-4 w-4 text-amber-500" /> },
    { label: 'Invoices', path: '/invoices', icon: <Receipt className="h-4 w-4 text-rose-500" /> },
    { label: 'Quotes', path: '/quotes', icon: <FileSpreadsheet className="h-4 w-4 text-indigo-500" /> },
    { label: 'Products', path: '/products', icon: <Package className="h-4 w-4 text-violet-500" /> },
    { label: 'Meetings', path: '/meetings', icon: <Calendar className="h-4 w-4 text-orange-500" /> },
    { label: 'Settings', path: '/settings', icon: <Settings className="h-4 w-4 text-slate-400" /> },
  ];

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 sm:pt-20 p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/95 dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10 animate-fade-scale"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-5 w-5 text-brand-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  handleFullSearch();
                } else if (query.trim()) {
                  handleAskAi();
                }
              }
            }}
            placeholder="Search deals, contacts, companies, invoices, tickets... or ask AI"
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
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        {/* AI Answer / Loading Box */}
        {aiLoading && (
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-brand-50/50 p-4 text-xs font-semibold text-brand-700 dark:border-slate-800 dark:bg-brand-950/30 dark:text-brand-300">
            <Sparkles className="h-4 w-4 animate-pulse text-brand-500" />
            <span>Synthesizing intelligence across CRM records...</span>
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

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Ask AI & Full Search Banners */}
          {query.trim().length >= 2 && !aiAnswer && (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleAskAi}
                className="flex-1 w-full flex items-center justify-between p-3 rounded-xl border border-brand-200 bg-brand-50/60 hover:bg-brand-100/60 text-left transition dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span className="text-xs font-medium text-brand-900 dark:text-brand-200 truncate">
                    Ask AI: <strong className="font-bold">&ldquo;{query}&rdquo;</strong>
                  </span>
                </div>
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 shrink-0">Enter ↵</span>
              </button>

              <button
                onClick={handleFullSearch}
                className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                <span>Full Search Page</span>
              </button>
            </div>
          )}

          {/* Real-time Categorized Search Results */}
          {results && (
            <div className="space-y-4">
              {!hasAnyResults && !loading && (
                <div className="py-8 text-center">
                  <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No matching record found</p>
                  <p className="text-xs text-slate-400 mt-1">Try querying a deal title, contact email, company name, ticket # or invoice.</p>
                </div>
              )}

              {/* DEALS */}
              {results.deals && results.deals.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deals</p>
                  <div className="space-y-1">
                    {results.deals.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => navigate('/deals')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Kanban className="h-4 w-4 text-brand-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{d.title}</span>
                          {d.company && <span className="text-[11px] text-slate-400 truncate">({d.company})</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {d.value && <Badge tone="indigo">₹{Number(d.value).toLocaleString()}</Badge>}
                          <Badge tone="gray">{d.status}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTACTS */}
              {results.contacts && results.contacts.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Contacts</p>
                  <div className="space-y-1">
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate('/contacts')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Users className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            {c.firstName} {c.lastName}
                          </span>
                        </div>
                        {c.email && <span className="text-[11px] text-slate-400 truncate shrink-0">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LEADS */}
              {results.leads && results.leads.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Leads</p>
                  <div className="space-y-1">
                    {results.leads.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => navigate('/leads')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserCheck className="h-4 w-4 text-sky-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            {l.firstName} {l.lastName}
                          </span>
                          {l.companyName && <span className="text-[11px] text-slate-400 truncate">({l.companyName})</span>}
                        </div>
                        {l.status && <Badge tone="sky">{l.status}</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COMPANIES */}
              {results.companies && results.companies.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Companies</p>
                  <div className="space-y-1">
                    {results.companies.map((co) => (
                      <button
                        key={co.id}
                        onClick={() => navigate('/companies')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{co.name}</span>
                        </div>
                        {co.domain && <span className="text-[11px] text-slate-400 shrink-0">{co.domain}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TASKS */}
              {results.tasks && results.tasks.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tasks</p>
                  <div className="space-y-1">
                    {results.tasks.map((tk) => (
                      <button
                        key={tk.id}
                        onClick={() => navigate('/tasks')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{tk.title}</span>
                        </div>
                        <Badge tone="gray">{tk.status}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TICKETS */}
              {results.tickets && results.tickets.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Support Tickets</p>
                  <div className="space-y-1">
                    {results.tickets.map((tkt) => (
                      <button
                        key={tkt.id}
                        onClick={() => navigate('/tickets')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <LifeBuoy className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            #{tkt.number} — {tkt.subject}
                          </span>
                        </div>
                        <Badge tone="amber">{tkt.priority}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* INVOICES */}
              {results.invoices && results.invoices.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoices</p>
                  <div className="space-y-1">
                    {results.invoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => navigate('/invoices')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Receipt className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            {inv.number || 'Invoice'} ({inv.customerName})
                          </span>
                        </div>
                        <Badge tone="rose">{inv.status}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUOTES */}
              {results.quotes && results.quotes.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quotes</p>
                  <div className="space-y-1">
                    {results.quotes.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => navigate('/quotes')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileSpreadsheet className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            {q.number || 'Quote'} ({q.customerName})
                          </span>
                        </div>
                        <Badge tone="indigo">{q.status}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCTS */}
              {results.products && results.products.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Products</p>
                  <div className="space-y-1">
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigate('/products')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Package className="h-4 w-4 text-violet-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{p.name}</span>
                        </div>
                        {p.sku && <span className="text-[11px] text-slate-400 font-mono shrink-0">SKU: {p.sku}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MEETINGS */}
              {results.meetings && results.meetings.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Meetings</p>
                  <div className="space-y-1">
                    {results.meetings.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => navigate('/meetings')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Calendar className="h-4 w-4 text-orange-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{m.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">{new Date(m.startsAt).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BRANDS & COMPETITORS */}
              {((results.brands && results.brands.length > 0) || (results.competitors && results.competitors.length > 0)) && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Brands & Competitors</p>
                  <div className="space-y-1">
                    {(results.brands || []).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => navigate('/brands')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Tags className="h-4 w-4 text-pink-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{b.name}</span>
                        </div>
                        {b.sector && <Badge tone="purple">{b.sector}</Badge>}
                      </button>
                    ))}
                    {(results.competitors || []).map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => navigate('/brands')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Swords className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{comp.name}</span>
                        </div>
                        {comp.domain && <span className="text-[11px] text-slate-400 shrink-0">{comp.domain}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TEAM MEMBERS */}
              {results.users && results.users.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Team Members</p>
                  <div className="space-y-1">
                    {results.users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => navigate('/users')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserCog className="h-4 w-4 text-slate-500 shrink-0" />
                          <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                            {u.firstName} {u.lastName}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate shrink-0">{u.email}</span>
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
                Quick Actions
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
                Quick Navigation
              </p>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {navLinks.map((nl) => (
                  <button
                    key={nl.path}
                    onClick={() => navigate(nl.path)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-medium text-slate-600 dark:text-slate-300"
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

