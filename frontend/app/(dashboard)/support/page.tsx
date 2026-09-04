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
        return <Rocket className="h-6 w-6 text-indigo-400" />;
      case 'sales & pipelines':
        return <Kanban className="h-6 w-6 text-emerald-400" />;
      case 'billing & payments':
        return <Receipt className="h-6 w-6 text-amber-400" />;
      default:
        return <HelpCircle className="h-6 w-6 text-blue-400" />;
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
      {/* Hero Search */}
      <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 p-8 border border-slate-800/80 mb-8 backdrop-blur-xl text-center">
        <h2 className="text-2xl font-bold text-white mb-2">How can we assist you today?</h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
          Search across platform guides, integration tutorials, and CRM documentation.
        </p>

        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, e.g. pipeline stages, invoice payment, webhook HMAC…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/90 pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 shadow-2xl focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Grid */}
      <h3 className="text-base font-semibold text-white mb-4">Documentation Categories</h3>

      {categories.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(categories.data || []).map((cat) => (
            <Card
              key={cat.id}
              className="flex flex-col justify-between border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl"
            >
              <div>
                <div className="rounded-xl bg-slate-800/80 w-12 h-12 flex items-center justify-center mb-4">
                  {getCategoryIcon(cat.name)}
                </div>
                <h4 className="font-bold text-white text-lg mb-1">{cat.name}</h4>
                <p className="text-xs text-slate-400 mb-4">{cat.description}</p>

                <div className="space-y-2 border-t border-slate-800/60 pt-3">
                  {(cat.articles || []).slice(0, 3).map((art) => (
                    <button
                      key={art.id}
                      onClick={() => openArticle(art.id)}
                      className="w-full text-left flex items-center justify-between text-xs text-slate-300 hover:text-indigo-400 py-1 transition group"
                    >
                      <span className="truncate pr-2">{art.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Articles List */}
      <h3 className="text-base font-semibold text-white mb-4">
        {searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended Articles & Guides'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(articles.data || []).map((art) => (
          <Card
            key={art.id}
            onClick={() => openArticle(art.id)}
            className="cursor-pointer border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-xl hover:border-indigo-500/40 transition flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">{art.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{art.content}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
          </Card>
        ))}
      </div>

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <Badge tone="indigo">{selectedArticle.category?.name || 'Guide'}</Badge>
                <h2 className="text-xl font-bold text-white mt-1.5">{selectedArticle.title}</h2>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedArticle.content}
            </div>

            <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-500">
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
