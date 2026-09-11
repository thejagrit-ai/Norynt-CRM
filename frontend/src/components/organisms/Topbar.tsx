'use client';
// src/components/organisms/Topbar.tsx — Enterprise Top Header & User Account Menu.
// Clean UI/UX, responsive layout, dedicated Profile & Logout menu, Live status, Theme, i18n & Notifications.
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  LogOut,
  Menu,
  Plus,
  Sun,
  Moon,
  Bell,
  User,
  ChevronDown,
  Check,
  Kanban,
  Users,
  UserCheck,
  Building2,
  CheckSquare,
  LifeBuoy,
  Receipt,
  FileSpreadsheet,
  Package,
  Calendar,
  Tags,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useSidebar } from '@/lib/sidebar';
import { Button } from '../atoms/Button';
import { Spinner } from '../atoms/Spinner';
import { Badge } from '../atoms/Badge';
import { UniversalQuickCreateModal } from '../molecules/UniversalQuickCreateModal';

interface SearchResults {
  query: string;
  deals: { id: string; title: string; company: string | null; value?: string | number | null; status: string }[];
  contacts: { id: string; firstName: string; lastName: string; email: string | null }[];
  companies: { id: string; name: string; domain: string | null }[];
  tasks: { id: string; title: string; status: string; priority: string }[];
  tickets: { id: string; number: string; subject: string; priority: string }[];
  leads: { id: string; firstName: string; lastName: string; companyName: string | null }[];
  invoices?: { id: string; number: string | null; customerName: string; status: string }[];
  quotes?: { id: string; number: string | null; customerName: string; status: string }[];
  products?: { id: string; name: string; sku: string | null; active: boolean }[];
  meetings?: { id: string; title: string; startsAt: string; location: string | null }[];
  brands?: { id: string; name: string; sector: string | null }[];
  users?: { id: string; firstName: string; lastName: string; email: string }[];
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang, languages } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleCollapse, openMobile } = useSidebar();
  const router = useRouter();

  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateType, setQuickCreateType] = useState('deal');

  // Inline Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or ⌘K focuses topbar search input directly
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchDropdownOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query fetching
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get('/search', { params: { q: searchQuery.trim() } });
        setSearchResults(unwrap<SearchResults>(res.data));
        setSearchDropdownOpen(true);
      } catch {
        setSearchResults(null);
      } finally {
        setSearchLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchDropdownOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const navigateTo = (path: string) => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const handleOpenQuickCreate = (type: string) => {
    setQuickCreateType(type);
    setQuickCreateOpen(true);
  };

  // Dynamic user data
  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.email?.split('@')[0] || 'User';

  const primaryRole = user?.roles?.[0] ?? 'MEMBER';
  const roleLabel =
    primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).toLowerCase();

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/90">
        {/* Left: Global Sidebar Toggle & Inline Search Bar */}
        <div className="flex items-center gap-3">
          {/* Mobile Drawer Open Button (Hidden on Desktop to avoid duplicate toggles) */}
          <button
            type="button"
            onClick={() => {
              if (onMenuClick) onMenuClick();
              else openMobile();
            }}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:border-brand-500/40 hover:bg-brand-50/60 hover:text-brand-600 transition-all shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500/40 dark:hover:bg-slate-800 dark:hover:text-brand-300"
            title="Open Mobile Navigation Drawer"
            aria-label="Open Mobile Navigation Drawer"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>

          {/* Live Inline Search Bar & Autocomplete Popover */}
          <div className="relative" ref={searchContainerRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="group flex items-center gap-2.5 w-48 sm:w-72 md:w-80 rounded-xl border border-slate-200 bg-slate-50/90 py-1.5 px-3 text-xs sm:text-sm text-slate-500 focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10 transition shadow-xs dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400 dark:focus-within:border-brand-500 dark:focus-within:bg-slate-900"
            >
              <Search className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0 dark:text-slate-500 dark:group-hover:text-brand-400" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchDropdownOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setSearchDropdownOpen(true);
                }}
                placeholder={t('topbar.search') || 'Search anything...'}
                aria-label="Search CRM"
                className="min-w-0 flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {searchLoading && <Spinner size="sm" />}
              {searchQuery && !searchLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                    setSearchDropdownOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {!searchQuery && (
                <kbd className="hidden sm:inline-flex items-center rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  ⌘K
                </kbd>
              )}
            </form>

            {/* Live Inline Search Autocomplete Dropdown */}
            {searchDropdownOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 md:w-[440px] max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 custom-scrollbar">
                {searchResults && (
                  <div className="space-y-3">
                    {/* DEALS */}
                    {searchResults.deals && searchResults.deals.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Deals</p>
                        <div className="space-y-1">
                          {searchResults.deals.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => navigateTo('/deals')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Kanban className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{d.title}</span>
                              </div>
                              <Badge tone="indigo">{d.status}</Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CONTACTS */}
                    {searchResults.contacts && searchResults.contacts.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Contacts</p>
                        <div className="space-y-1">
                          {searchResults.contacts.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => navigateTo('/contacts')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
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
                    {searchResults.leads && searchResults.leads.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Leads</p>
                        <div className="space-y-1">
                          {searchResults.leads.map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => navigateTo('/leads')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <UserCheck className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                                  {l.firstName} {l.lastName}
                                </span>
                              </div>
                              {l.companyName && <span className="text-[11px] text-slate-400 truncate shrink-0">({l.companyName})</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COMPANIES */}
                    {searchResults.companies && searchResults.companies.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Companies</p>
                        <div className="space-y-1">
                          {searchResults.companies.map((co) => (
                            <button
                              key={co.id}
                              type="button"
                              onClick={() => navigateTo('/companies')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{co.name}</span>
                              </div>
                              {co.domain && <span className="text-[11px] text-slate-400 truncate shrink-0">{co.domain}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TASKS */}
                    {searchResults.tasks && searchResults.tasks.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tasks</p>
                        <div className="space-y-1">
                          {searchResults.tasks.map((tk) => (
                            <button
                              key={tk.id}
                              type="button"
                              onClick={() => navigateTo('/tasks')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">{tk.title}</span>
                              </div>
                              <Badge tone="gray">{tk.status}</Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TICKETS */}
                    {searchResults.tickets && searchResults.tickets.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tickets</p>
                        <div className="space-y-1">
                          {searchResults.tickets.map((tkt) => (
                            <button
                              key={tkt.id}
                              type="button"
                              onClick={() => navigateTo('/tickets')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <LifeBuoy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
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
                    {searchResults.invoices && searchResults.invoices.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Invoices</p>
                        <div className="space-y-1">
                          {searchResults.invoices.map((inv) => (
                            <button
                              key={inv.id}
                              type="button"
                              onClick={() => navigateTo('/invoices')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Receipt className="h-3.5 w-3.5 text-rose-500 shrink-0" />
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
                    {searchResults.quotes && searchResults.quotes.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quotes</p>
                        <div className="space-y-1">
                          {searchResults.quotes.map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => navigateTo('/quotes')}
                              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
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
                  </div>
                )}

                {/* Footer / Full search link */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => navigateTo(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                    className="w-full text-left font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-between p-1 rounded-lg"
                  >
                    <span>See full results for &ldquo;{searchQuery}&rdquo;</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Button */}
          <Button
            size="sm"
            onClick={() => handleOpenQuickCreate('deal')}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md shadow-brand-500/20 px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold">{t('topbar.quickCreate')}</span>
          </Button>

          {/* Live Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold tracking-wide">Live</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Change Language"
              aria-label="Change Language"
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="hidden sm:inline text-xs">{currentLangObj.name.split(' ')[0]}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Select Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium transition ${
                      lang === l.code
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </span>
                    {lang === l.code && <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => setNotifMenuOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="py-2 space-y-2">
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 transition">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      CRM System Operational
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      All pipeline webhooks and automated queues are active.
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Account Capsule / Avatar Button & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1.5 pr-2.5 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shadow-xs"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="hidden md:flex flex-col min-w-0">
                <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight max-w-[110px]">
                  {displayName}
                </span>
                <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Clean User Dropdown (Profile + Logout ONLY) */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email}
                    </p>
                    <span className="mt-1 inline-flex items-center rounded-md bg-brand-50 px-1.5 py-0.5 text-[9.5px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-500/20">
                      {primaryRole}
                    </span>
                  </div>
                </div>

                {/* Dropdown Navigation: ONLY Profile & Logout */}
                <div className="pt-1.5 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('topbar.logout') || 'Log Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <UniversalQuickCreateModal
        isOpen={quickCreateOpen}
        initialType={quickCreateType}
        onClose={() => setQuickCreateOpen(false)}
      />
    </>
  );
}

