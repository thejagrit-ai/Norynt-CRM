'use client';
// app/(dashboard)/search/page.tsx — Global omnisearch results across deals, contacts & companies.
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Briefcase,
  Users,
  Building2,
  ChevronRight,
  Mail,
  Globe,
  CheckSquare,
  LifeBuoy,
  UserRound,
  Receipt,
  FileSpreadsheet,
  Package,
  CalendarDays,
  Tags,
  Swords,
} from 'lucide-react';
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
  tasks: { id: string; title: string; status: string; priority: string }[];
  tickets: { id: string; number: string; subject: string; status: string; priority: string }[];
  leads: { id: string; firstName: string; lastName: string; companyName: string | null; status: string }[];
  invoices: { id: string; number: string | null; customerName: string; status: string }[];
  quotes: { id: string; number: string | null; customerName: string; status: string }[];
  products: { id: string; name: string; sku: string | null; active: boolean }[];
  meetings: { id: string; title: string; startsAt: string; location: string | null }[];
  brands: { id: string; name: string; sector: string | null; niche: string | null }[];
  competitors: { id: string; name: string; domain: string | null }[];
  users: { id: string; firstName: string; lastName: string; email: string; isActive: boolean }[];
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

            <Section title="Leads" icon={<Users className="h-4 w-4 text-cyan-400" />} empty="No matching leads found" count={res.data?.leads.length ?? 0}>
              {res.data?.leads.map((l) => (
                <ResultLink key={l.id} href="/leads" title={`${l.firstName} ${l.lastName}`} subtitle={l.companyName} status={l.status} />
              ))}
            </Section>

            <Section title="Tasks" icon={<CheckSquare className="h-4 w-4 text-emerald-400" />} empty="No matching tasks found" count={res.data?.tasks.length ?? 0}>
              {res.data?.tasks.map((task) => (
                <ResultLink key={task.id} href="/tasks" title={task.title} subtitle={task.priority} status={task.status} />
              ))}
            </Section>

            <Section title="Tickets" icon={<LifeBuoy className="h-4 w-4 text-amber-400" />} empty="No matching tickets found" count={res.data?.tickets.length ?? 0}>
              {res.data?.tickets.map((ticket) => (
                <ResultLink key={ticket.id} href="/tickets" title={`#${ticket.number} - ${ticket.subject}`} subtitle={ticket.priority} status={ticket.status} />
              ))}
            </Section>

            <Section title="Invoices" icon={<Receipt className="h-4 w-4 text-rose-400" />} empty="No matching invoices found" count={res.data?.invoices.length ?? 0}>
              {res.data?.invoices.map((invoice) => (
                <ResultLink key={invoice.id} href="/invoices" title={invoice.number || 'Draft invoice'} subtitle={invoice.customerName} status={invoice.status} />
              ))}
            </Section>

            <Section title="Quotes" icon={<FileSpreadsheet className="h-4 w-4 text-indigo-400" />} empty="No matching quotes found" count={res.data?.quotes.length ?? 0}>
              {res.data?.quotes.map((quote) => (
                <ResultLink key={quote.id} href="/quotes" title={quote.number || 'Draft quote'} subtitle={quote.customerName} status={quote.status} />
              ))}
            </Section>

            <Section title="Products" icon={<Package className="h-4 w-4 text-violet-400" />} empty="No matching products found" count={res.data?.products.length ?? 0}>
              {res.data?.products.map((product) => (
                <ResultLink key={product.id} href="/products" title={product.name} subtitle={product.sku} status={product.active ? 'Active' : 'Inactive'} />
              ))}
            </Section>

            <Section title="Meetings" icon={<CalendarDays className="h-4 w-4 text-orange-400" />} empty="No matching meetings found" count={res.data?.meetings.length ?? 0}>
              {res.data?.meetings.map((meeting) => (
                <ResultLink key={meeting.id} href="/meetings" title={meeting.title} subtitle={meeting.location || new Date(meeting.startsAt).toLocaleString()} />
              ))}
            </Section>

            <Section title="Brands" icon={<Tags className="h-4 w-4 text-pink-400" />} empty="No matching brands found" count={res.data?.brands.length ?? 0}>
              {res.data?.brands.map((brand) => (
                <ResultLink key={brand.id} href="/brands" title={brand.name} subtitle={brand.sector || brand.niche} />
              ))}
            </Section>

            <Section title="Competitors" icon={<Swords className="h-4 w-4 text-red-400" />} empty="No matching competitors found" count={res.data?.competitors.length ?? 0}>
              {res.data?.competitors.map((competitor) => (
                <ResultLink key={competitor.id} href="/brands" title={competitor.name} subtitle={competitor.domain} />
              ))}
            </Section>

            <Section title="Users" icon={<UserRound className="h-4 w-4 text-slate-400" />} empty="No matching users found" count={res.data?.users.length ?? 0}>
              {res.data?.users.map((member) => (
                <ResultLink key={member.id} href="/users" title={`${member.firstName} ${member.lastName}`} subtitle={member.email} status={member.isActive ? 'Active' : 'Inactive'} />
              ))}
            </Section>
        </div>
      )}
    </DashboardTemplate>
  );
}

function ResultLink({
  href,
  title,
  subtitle,
  status,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  status?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl p-3 transition hover:bg-slate-800/40 group"
    >
      <div className="min-w-0">
        <span className="block truncate font-semibold text-white group-hover:text-brand-300 transition">{title}</span>
        {subtitle && <span className="block truncate text-xs text-slate-400">{subtitle}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {status && <Badge tone="blue">{status}</Badge>}
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition" />
      </div>
    </Link>
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
