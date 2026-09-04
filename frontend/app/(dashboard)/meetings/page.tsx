'use client';
// app/(dashboard)/meetings/page.tsx — Meeting calendar and event schedules with start/end datetime picker.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CrudFormModal, CrudField } from '@/components/organisms/CrudFormModal';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

interface Meeting {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
}

const FIELDS: CrudField[] = [
  { key: 'title', label: 'field.subject', required: true },
  { key: 'startsAt', label: 'field.startsAt', type: 'datetime', required: true },
  { key: 'endsAt', label: 'field.endsAt', type: 'datetime', required: true },
  { key: 'location', label: 'field.location' },
  { key: 'notes', label: 'field.notes', type: 'textarea' },
];

const toLocal = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
};
const fmt = (iso: string) => new Date(iso).toLocaleString();

export default function MeetingsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const meetings = useQuery({
    queryKey: ['meetings'],
    queryFn: async () =>
      unwrap<Meeting[]>(
        (await api.get('/meetings', { params: { limit: 50 } })).data,
      ),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['meetings'] });

  const columns: Column<Meeting>[] = [
    {
      key: 'title',
      header: t('field.subject'),
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-purple-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white">{r.title}</div>
            {r.notes && (
              <div className="text-[11px] text-slate-400 line-clamp-1">{r.notes}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'startsAt',
      header: t('field.startsAt'),
      render: (r) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>{fmt(r.startsAt)}</span>
        </span>
      ),
    },
    {
      key: 'endsAt',
      header: t('field.endsAt'),
      render: (r) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-600" />
          <span>{fmt(r.endsAt)}</span>
        </span>
      ),
    },
    {
      key: 'location',
      header: t('field.location'),
      render: (r) =>
        r.location ? (
          <span className="flex items-center gap-1 text-xs text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-rose-400" />
            <span>{r.location}</span>
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.meetings"
      headerAction={
        can('meeting.create') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newMeeting')}</span>
          </Button>
        )
      }
    >
      {meetings.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={meetings.data ?? []}
          empty={t('common.empty')}
          onRowClick={can('meeting.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <CrudFormModal
          title={t('m.newMeeting')}
          fields={FIELDS}
          submitLabel={t('common.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await api.post('/meetings', v);
            invalidate();
          }}
        />
      )}

      {editing && (
        <CrudFormModal
          title={t('m.editMeeting')}
          fields={FIELDS}
          initial={{
            title: editing.title,
            startsAt: toLocal(editing.startsAt),
            endsAt: toLocal(editing.endsAt),
            location: editing.location ?? '',
            notes: editing.notes ?? '',
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api.patch(`/meetings/${editing.id}`, v);
            invalidate();
          }}
          onDelete={
            can('meeting.delete')
              ? async () => {
                  await api.delete(`/meetings/${editing.id}`);
                  invalidate();
                }
              : undefined
          }
        />
      )}
    </DashboardTemplate>
  );
}
