'use client';
// src/components/organisms/ConvertLeadModal.tsx — lead conversion modal with prefilled deal details.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { PhoneNumberField } from '../atoms/PhoneNumberField';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';
import type { UnqualifiedLead } from '@/types';

interface Stage {
  id: string;
  name: string;
}
interface Pipeline {
  id: string;
  isDefault: boolean;
  stages: Stage[];
}

export function ConvertLeadModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: UnqualifiedLead;
  onClose: () => void;
  onConverted: () => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const [form, setForm] = useState({
    title: fullName,
    company: lead.companyName ?? '',
    value: '',
    currency: 'INR',
    contactName: fullName,
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    stageId: '',
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const pipelines = useQuery({
    queryKey: ['pipelines-convert'],
    queryFn: async () =>
      unwrap<Pipeline[]>((await api.get('/pipelines')).data),
  });
  const pipeline =
    pipelines.data?.find((p) => p.isDefault) ?? pipelines.data?.[0];
  const stages = pipeline?.stages ?? [];

  const convert = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {};
      if (form.title.trim() && form.title.trim() !== fullName)
        payload.title = form.title.trim();
      if (form.company.trim()) payload.company = form.company.trim();
      if (form.contactName.trim() && form.contactName.trim() !== fullName)
        payload.contactName = form.contactName.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.value.trim()) {
        payload.value = form.value.trim();
        payload.currency = form.currency || 'INR';
      }
      if (form.stageId) payload.stageId = form.stageId;
      await api.post(`/leads/${lead.id}/convert`, payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['leads'] });
      onConverted();
      onClose();
    },
  });

  return (
    <Modal title={t('lead.convertTitle') || 'Convert Lead to Deal'} onClose={onClose}>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        {t('lead.convertHint') || 'Convert this qualified lead into an active sales opportunity and contact.'}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="cv-title"
          label={t('field.subject') || 'Deal Title'}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <FormField
          id="cv-company"
          label={t('field.company') || 'Company'}
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
        />
        <FormField
          id="cv-value"
          label={t('field.value') || 'Value'}
          placeholder="50000"
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
        />
        <FormField
          id="cv-currency"
          label={t('field.currency') || 'Currency'}
          maxLength={3}
          value={form.currency}
          onChange={(e) => set('currency', e.target.value.toUpperCase())}
        />
        <FormField
          id="cv-contact"
          label={t('field.contactName') || 'Contact Name'}
          value={form.contactName}
          onChange={(e) => set('contactName', e.target.value)}
        />
        <FormField
          id="cv-email"
          label={t('field.email') || 'Email'}
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
        <PhoneNumberField
          id="cv-phone"
          label={t('field.phone') || 'Phone Number'}
          value={form.phone}
          onChange={(v) => set('phone', v)}
        />
        <div>
          <Label>{t('field.stage') || 'Pipeline Stage'}</Label>
          <select
            value={form.stageId}
            onChange={(e) => set('stageId', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:bg-slate-950/90"
          >
            {stages.map((s, i) => (
              <option key={s.id} value={i === 0 ? '' : s.id} className="bg-white dark:bg-slate-900">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <Button
          disabled={convert.isPending || !form.title.trim()}
          loading={convert.isPending}
          onClick={() => convert.mutate()}
        >
          {t('act.convert') || 'Convert to Deal'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel') || 'Cancel'}
        </Button>
        {convert.isError && (
          <span className="text-xs font-medium text-rose-500 dark:text-rose-400">
            {t('common.error') || 'Conversion failed.'}
          </span>
        )}
      </div>
    </Modal>
  );
}
