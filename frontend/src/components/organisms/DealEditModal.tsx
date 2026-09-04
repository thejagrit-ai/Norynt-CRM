'use client';
// src/components/organisms/DealEditModal.tsx — deal editor and stage relocation modal with light/dark theme.
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { PhoneNumberField } from '../atoms/PhoneNumberField';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';
import type { Board, Deal } from '@/types';

export function DealEditModal({
  deal,
  board,
  onClose,
}: {
  deal: Deal;
  board: Board;
  onClose: () => void;
}) {
  const { can } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: deal.title ?? '',
    company: deal.company ?? '',
    value: deal.value ?? '',
    currency: deal.currency ?? 'INR',
    contactName: deal.contactName ?? '',
    email: deal.email ?? '',
    phone: deal.phone ?? '',
  });
  const [stageId, setStageId] = useState(deal.stageId);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['board'] });
    onClose();
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { title: form.title.trim() };
      if (form.company.trim()) payload.company = form.company.trim();
      if (form.contactName.trim()) payload.contactName = form.contactName.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.value.trim()) {
        payload.value = form.value.trim();
        payload.currency = form.currency || 'INR';
      }
      await api.patch(`/deals/${deal.id}`, payload);
      if (stageId !== deal.stageId) {
        await api.patch(`/deals/${deal.id}/move`, { toStageId: stageId });
      }
    },
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/deals/${deal.id}`);
    },
    onSuccess: refresh,
  });

  return (
    <Modal title={t('deal.editTitle') || 'Edit Deal Opportunity'} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="e-title"
          label={`${t('field.subject') || 'Deal Title'} *`}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <FormField
          id="e-company"
          label={t('field.company') || 'Company'}
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
        />
        <FormField
          id="e-value"
          label={t('field.value') || 'Value'}
          placeholder="50000"
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
        />
        <FormField
          id="e-currency"
          label={t('field.currency') || 'Currency'}
          maxLength={3}
          value={form.currency}
          onChange={(e) => set('currency', e.target.value.toUpperCase())}
        />
        <FormField
          id="e-contact"
          label={t('field.contactName') || 'Contact Person'}
          value={form.contactName}
          onChange={(e) => set('contactName', e.target.value)}
        />
        <FormField
          id="e-email"
          label={t('field.email') || 'Email'}
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
        <PhoneNumberField
          id="e-phone"
          label={t('field.phone') || 'Phone'}
          value={form.phone}
          onChange={(v) => set('phone', v)}
        />
        <div>
          <Label>{t('field.stage') || 'Pipeline Stage'}</Label>
          <select
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:bg-slate-950/90"
          >
            {board.stages.map((s) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button
            disabled={!form.title.trim() || save.isPending}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {t('common.save') || 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        {can('deal.delete') && (
          <Button
            variant="danger"
            disabled={remove.isPending}
            loading={remove.isPending}
            onClick={() => {
              if (confirm(`${t('common.delete') || 'Delete'}?`)) {
                remove.mutate();
              }
            }}
          >
            {t('common.delete') || 'Delete'}
          </Button>
        )}
      </div>

      {(save.isError || remove.isError) && (
        <p className="mt-3 text-xs font-medium text-rose-500 dark:text-rose-400">
          {t('common.error') || 'Operation failed.'}
        </p>
      )}
    </Modal>
  );
}
