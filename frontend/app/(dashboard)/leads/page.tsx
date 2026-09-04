'use client';
// app/(dashboard)/leads/page.tsx — Unqualified Leads management with channel filters, WhatsApp & conversion.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, MessageSquare, ArrowRightLeft, Search } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CrudFormModal, CrudField } from '@/components/organisms/CrudFormModal';
import { ConvertLeadModal } from '@/components/organisms/ConvertLeadModal';
import { WhatsAppSendModal } from '@/components/organisms/WhatsAppSendModal';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Card } from '@/components/atoms/Card';
import type { UnqualifiedLead } from '@/types';

const tone: Record<string, 'gray' | 'blue' | 'green' | 'amber' | 'red'> = {
  NEW: 'blue',
  WORKING: 'amber',
  QUALIFIED: 'green',
  UNQUALIFIED: 'red',
  CONVERTED: 'gray',
};

const channelTone: Record<string, 'gray' | 'blue' | 'green' | 'amber' | 'red'> =
  {
    MANUAL: 'gray',
    IMPORT: 'amber',
    FORM: 'green',
    WEBHOOK: 'blue',
    API: 'gray',
  };

const CHANNELS = ['MANUAL', 'IMPORT', 'FORM', 'WEBHOOK', 'API'] as const;
const channelKey: Record<string, string> = {
  MANUAL: 'lead.chManual',
  IMPORT: 'lead.chImport',
  FORM: 'lead.chForm',
  WEBHOOK: 'lead.chWebhook',
  API: 'lead.chApi',
};

const BASE: CrudField[] = [
  { key: 'firstName', label: 'field.firstName', required: true },
  { key: 'lastName', label: 'field.lastName', required: true },
  { key: 'email', label: 'field.email', type: 'email' },
  { key: 'phone', label: 'field.phone', type: 'phone' },
  { key: 'companyName', label: 'field.companyName' },
  { key: 'source', label: 'field.source', placeholder: 'WEB / REFERRAL / EVENT' },
];

const STATUS_FIELD: CrudField = {
  key: 'status',
  label: 'field.status',
  type: 'select',
  options: ['NEW', 'WORKING', 'QUALIFIED', 'UNQUALIFIED'].map((s) => ({
    value: s,
    label: s,
  })),
};

export default function LeadsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UnqualifiedLead | null>(null);
  const [converting, setConverting] = useState<UnqualifiedLead | null>(null);
  const [waTarget, setWaTarget] = useState<UnqualifiedLead | null>(null);
  const [fChannel, setFChannel] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fSource, setFSource] = useState('');

  const leads = useQuery({
    queryKey: ['leads', fChannel, fStatus, fSource],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 50 };
      if (fChannel) params.channel = fChannel;
      if (fStatus) params.status = fStatus;
      if (fSource) params.source = fSource;
      return unwrap<UnqualifiedLead[]>(
        (await api.get('/leads', { params })).data,
      );
    },
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['leads'] });

  const columns: Column<UnqualifiedLead>[] = [
    { key: 'name', header: t('col.name'), render: (r) => <span className="font-semibold text-white">{r.firstName} {r.lastName}</span> },
    { key: 'company', header: t('col.company'), render: (r) => r.companyName ?? '—' },
    { key: 'source', header: t('col.source'), render: (r) => <span className="text-xs text-slate-400 font-mono">{r.source ?? '—'}</span> },
    {
      key: 'channel',
      header: t('col.channel'),
      render: (r) => (
        <Badge tone={channelTone[r.channel] ?? 'gray'}>
          {t(channelKey[r.channel] ?? 'lead.chManual')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('col.status'),
      render: (r) => <Badge tone={tone[r.status]} dot>{r.status}</Badge>,
    },
    {
      key: 'action',
      header: '',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {can('whatsapp.send') && r.phone && (
            <Button
              variant="outline"
              size="sm"
              className="py-1 px-2.5 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={(e) => {
                e.stopPropagation();
                setWaTarget(r);
              }}
            >
              <MessageSquare className="h-3 w-3" />
              <span>WhatsApp</span>
            </Button>
          )}
          {can('lead.convert') && r.status !== 'CONVERTED' && (
            <Button
              variant="secondary"
              size="sm"
              className="py-1 px-2.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setConverting(r);
              }}
            >
              <ArrowRightLeft className="h-3 w-3" />
              <span>{t('act.convert')}</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.leads"
      headerAction={
        can('lead.create') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newLead')}</span>
          </Button>
        )
      }
    >
      {/* Search & Filter Bar */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Filter className="h-3.5 w-3.5 text-brand-400" />
            <span>Filters:</span>
          </div>

          <select
            value={fChannel}
            onChange={(e) => setFChannel(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
            aria-label={t('lead.filterChannel')}
          >
            <option value="" className="bg-slate-900">
              {t('lead.filterChannel')}: {t('common.all')}
            </option>
            {CHANNELS.map((c) => (
              <option key={c} value={c} className="bg-slate-900">
                {t(channelKey[c])}
              </option>
            ))}
          </select>

          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500"
            aria-label={t('field.status')}
          >
            <option value="" className="bg-slate-900">
              {t('field.status')}: {t('common.all')}
            </option>
            {['NEW', 'WORKING', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'].map(
              (s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s}
                </option>
              ),
            )}
          </select>

          <div className="relative">
            <input
              value={fSource}
              onChange={(e) => setFSource(e.target.value)}
              placeholder={t('lead.filterSource')}
              className="rounded-xl border border-slate-700/80 bg-slate-950/80 py-1.5 pl-3 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-brand-500"
            />
          </div>

          {(fChannel || fStatus || fSource) && (
            <button
              type="button"
              onClick={() => {
                setFChannel('');
                setFStatus('');
                setFSource('');
              }}
              className="text-xs text-slate-400 hover:text-white underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      {/* Leads Table */}
      {leads.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={leads.data ?? []}
          empty={t('common.empty')}
          onRowClick={can('lead.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <CrudFormModal
          title={t('m.newLead')}
          fields={BASE}
          submitLabel={t('common.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await api.post('/leads', v);
            invalidate();
          }}
        />
      )}

      {editing && (
        <CrudFormModal
          title={t('m.editLead')}
          fields={[...BASE, STATUS_FIELD]}
          initial={{
            firstName: editing.firstName,
            lastName: editing.lastName,
            email: editing.email ?? '',
            phone: editing.phone ?? '',
            companyName: editing.companyName ?? '',
            source: editing.source ?? '',
            status: editing.status,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api.patch(`/leads/${editing.id}`, v);
            invalidate();
          }}
          onDelete={
            can('lead.delete')
              ? async () => {
                  await api.delete(`/leads/${editing.id}`);
                  invalidate();
                }
              : undefined
          }
        />
      )}

      {converting && (
        <ConvertLeadModal
          lead={converting}
          onClose={() => setConverting(null)}
          onConverted={invalidate}
        />
      )}

      {waTarget && (
        <WhatsAppSendModal
          initialPhone={waTarget.phone ?? ''}
          leadId={waTarget.id}
          onClose={() => setWaTarget(null)}
        />
      )}
    </DashboardTemplate>
  );
}
