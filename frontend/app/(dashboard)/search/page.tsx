'use client';
// app/(dashboard)/search/page.tsx — Global omnisearch results across deals, contacts & companies.
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Briefcase, Users, Building2, ChevronRight, Mail, Globe } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';

interface SearchResult {
  query: string;
  deals: { id: string; title: string; company: string | null; status: string }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  }[];
  companies: { id: string; name: string; domain: string | null }[];
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';

  const res = useQuery({
    queryKey: ['search', q],
    enabled: q.trim().length >= 2,
    queryFn: async () =>
      unwrap<SearchResult>(
        (await api.get('/search', { params: { q } })).data,
      ),
  });

  return (
    <DashboardTemplate title="page.search">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <Search className="h-4 w-4 text-brand-400" />
        <span>Search Query: <strong className="text-white">&ldquo;{q}&rdquo;</strong></span>
      </div>

      {res.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          <Section
            title="Deals"
            icon={<Briefcase className="h-4 w-4 text-brand-400" />}
            empty="No matching deals found"
            count={res.data?.deals.length ?? 0}
          >
            {res.data?.deals.map((d) => (
              <Link
                key={d.id}
                href="/deals"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition group"
              >
                <div>
                  <span className="font-semibold text-white group-hover:text-brand-300 transition">{d.title}</span>
                  {d.company && (
                    <span className="text-xs text-slate-400 block">{d.company}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{d.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </Link>
            ))}
          </Section>

          <Section
            title="Contacts"
            icon={<Users className="h-4 w-4 text-sky-400" />}
            empty="No matching contacts found"
            count={res.data?.contacts.length ?? 0}
          >
            {res.data?.contacts.map((c) => (
              <Link
                key={c.id}
                href="/contacts"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition group"
              >
                <div>
                  <span className="font-semibold text-white group-hover:text-brand-300 transition">
                    {c.firstName} {c.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {c.email && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Mail className="h-3 w-3 text-slate-500" />
                      <span>{c.email}</span>
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </Link>
            ))}
          </Section>

          <Section
            title="Companies"
            icon={<Building2 className="h-4 w-4 text-emerald-400" />}
            empty="No matching companies found"
            count={res.data?.companies.length ?? 0}
          >
            {res.data?.companies.map((c) => (
              <Link
                key={c.id}
                href="/companies"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition group"
              >
                <div>
                  <span className="font-semibold text-white group-hover:text-brand-300 transition">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {c.domain && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Globe className="h-3 w-3 text-slate-500" />
                      <span>{c.domain}</span>
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </Link>
            ))}
          </Section>
        </div>
      )}
    </DashboardTemplate>
  );
}

function Section({
  title,
  icon,
  empty,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.some(Boolean) && arr.flat().filter(Boolean).length > 0;
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
        </div>
        <Badge tone={count > 0 ? 'indigo' : 'gray'}>{count} Result</Badge>
      </div>
      {hasItems ? (
        <div className="space-y-1">{children}</div>
      ) : (
        <p className="py-4 text-center text-xs text-slate-500">{empty}</p>
      )}
    </Card>
  );
}
