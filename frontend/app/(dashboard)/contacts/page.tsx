'use client';
// app/(dashboard)/contacts/page.tsx — Contact relationship directory with company linking & full CRUD.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Phone, Building2, MessageSquare } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CrudFormModal, CrudField } from '@/components/organisms/CrudFormModal';
import { WhatsAppSendModal } from '@/components/organisms/WhatsAppSendModal';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import type { Company, Contact } from '@/types';

export default function ContactsPage() {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [waTarget, setWaTarget] = useState<Contact | null>(null);

  const contacts = useQuery({
    queryKey: ['contacts'],
    queryFn: async () =>
      unwrap<Contact[]>(
        (await api.get('/contacts', { params: { limit: 50 } })).data,
      ),
  });

  const companies = useQuery({
    queryKey: ['companies-options'],
    enabled: can('company.read'),
    queryFn: async () =>
      unwrap<Company[]>(
        (await api.get('/companies', { params: { limit: 100 } })).data,
      ),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contacts'] });

  const fields: CrudField[] = [
    { key: 'firstName', label: 'field.firstName', required: true },
    { key: 'lastName', label: 'field.lastName', required: true },
    { key: 'email', label: 'field.email', type: 'email' },
    { key: 'phone', label: 'field.phone', type: 'phone' },
    { key: 'title', label: 'field.title' },
    {
      key: 'companyId',
      label: 'field.company',
      type: 'select',
      options: (companies.data ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    },
  ];

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: t('col.name'),
      render: (r) => (
        <span className="font-semibold text-white">
          {r.firstName} {r.lastName}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('col.phone') || 'Phone',
      render: (r) =>
        r.phone ? (
          <span className="flex items-center gap-1 font-mono text-xs text-slate-300">
            <Phone className="h-3 w-3 text-slate-500" />
            <span>{r.phone}</span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'email',
      header: t('col.email'),
      render: (r) =>
        r.email ? (
          <span className="flex items-center gap-1 text-slate-300">
            <Mail className="h-3.5 w-3.5 text-slate-500" />
            <span>{r.email}</span>
          </span>
        ) : (
          '—'
        ),
    },
    { key: 'title', header: t('col.title'), render: (r) => r.title ?? '—' },
    {
      key: 'company',
      header: t('col.company'),
      render: (r) =>
        r.company?.name ? (
          <span className="flex items-center gap-1.5 text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-brand-400" />
            <span>{r.company.name}</span>
          </span>
        ) : (
          '—'
        ),
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
        </div>
      ),
    },
  ];

  return (
    <DashboardTemplate
      title="page.contacts"
      headerAction={
        can('contact.create') && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            <span>{t('btn.newContact')}</span>
          </Button>
        )
      }
    >
      {contacts.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={contacts.data ?? []}
          empty={t('common.empty')}
          onRowClick={can('contact.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <CrudFormModal
          title={t('m.newContact')}
          fields={fields}
          submitLabel={t('common.create')}
          onClose={() => setCreating(false)}
          onSubmit={async (v) => {
            await api.post('/contacts', v);
            invalidate();
          }}
        />
      )}

      {editing && (
        <CrudFormModal
          title={t('m.editContact')}
          fields={fields}
          initial={{
            firstName: editing.firstName,
            lastName: editing.lastName,
            email: editing.email ?? '',
            phone: editing.phone ?? '',
            title: editing.title ?? '',
            companyId: editing.companyId ?? '',
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api.patch(`/contacts/${editing.id}`, v);
            invalidate();
          }}
          onDelete={
            can('contact.delete')
              ? async () => {
                  await api.delete(`/contacts/${editing.id}`);
                  invalidate();
                }
              : undefined
          }
        />
      )}

      {waTarget && (
        <WhatsAppSendModal
          initialPhone={waTarget.phone ?? ''}
          initialBody={`Hello ${waTarget.firstName}, thank you for connecting with us.`}
          contactId={waTarget.id}
          onClose={() => setWaTarget(null)}
        />
      )}
    </DashboardTemplate>
  );
}
