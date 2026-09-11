'use client';
// app/(dashboard)/support/page.tsx — Knowledge Base & Customer Support Portal
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LifeBuoy,
  Search,
  BookOpen,
  Rocket,
  Kanban,
  Receipt,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  X,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';

interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  articles?: Array<{ id: string; title: string; slug: string; viewCount: number }>;
}

interface Article {
  id: string;
  title: string;
  content: string;
  category?: { name: string };
  viewCount: number;
}

export default function SupportPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const res = await api.get('/support/categories');
      return unwrap<FaqCategory[]>(res.data);
    },
  });

  const articles = useQuery({
    queryKey: ['support-articles', searchQuery],
    queryFn: async () => {
      const res = await api.get('/support/articles', { params: { q: searchQuery } });
      return unwrap<Article[]>(res.data);
    },
  });

  const openArticle = async (id: string) => {
    try {
      const res = await api.get(`/support/articles/${id}`);
      setSelectedArticle(unwrap<Article>(res.data));
    } catch {
      alert('Failed to load article');
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'getting started':
        return <Rocket className="h-6 w-6 text-brand-600 dark:text-indigo-400" />;
      case 'sales & pipelines':
        return <Kanban className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'billing & payments':
        return <Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
      default:
        return <HelpCircle className="h-6 w-6 text-brand-500 dark:text-blue-400" />;
    }
  };

  return (
    <DashboardTemplate
      title="Help & Support Portal"
      subtitle="Comprehensive knowledge base guides, technical documentation, and ticketing help desk"
      actions={
        <Link href="/tickets">
          <Button tone="primary" leftIcon={<LifeBuoy className="h-4 w-4" />}>
            Open Support Ticket
          </Button>
        </Link>
      }
    >
      {/* Hero Search Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500/10 via-indigo-500/5 to-purple-500/10 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/90 p-8 border border-brand-500/20 dark:border-slate-800 shadow-sm text-center mb-8 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/10 rounded-full blur-3xl" />

        <h2 className="relative text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          How can we assist you today?
        </h2>
        <p className="relative text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto mb-6 font-medium">
          Search across platform guides, integration tutorials, and CRM documentation.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search keywords, e.g. pipeline stages, invoice payment, webhook HMAC…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-12 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-lg focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Category Grid */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Documentation Categories</h3>

      {categories.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(categories.data || []).map((cat) => (
            <Card
              key={cat.id}
              hoverable
              className="flex flex-col justify-between p-6"
            >
              <div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 w-12 h-12 flex items-center justify-center mb-4">
                  {getCategoryIcon(cat.name)}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{cat.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{cat.description}</p>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/60 pt-3">
                  {(cat.articles || []).slice(0, 3).map((art) => (
                    <button
                      key={art.id}
                      onClick={() => openArticle(art.id)}
                      className="w-full text-left flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 py-1 transition group"
                    >
                      <span className="truncate pr-2">{art.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Articles List */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
        {searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Articles & Guides'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(articles.data || []).map((art) => (
          <Card
            key={art.id}
            hoverable
            onClick={() => openArticle(art.id)}
            className="p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-lg bg-brand-500/10 p-2.5 text-brand-600 dark:text-brand-400 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{art.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{art.content}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          </Card>
        ))}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <Badge tone="indigo">{selectedArticle.category?.name || 'Guide'}</Badge>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">{selectedArticle.title}</h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedArticle.content}
            </div>

            <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Was this guide helpful? (Views: {selectedArticle.viewCount})
              </span>
              <Button tone="secondary" onClick={() => setSelectedArticle(null)}>
                Close Reader
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardTemplate>
  );
}

