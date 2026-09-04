'use client';
// src/components/organisms/CrudFormModal.tsx — generic reusable CRUD form modal with light/dark theme & validation.
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Textarea } from '../atoms/Textarea';
import { PhoneNumberField } from '../atoms/PhoneNumberField';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';

export interface CrudField {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'phone'
    | 'number'
    | 'select'
    | 'date'
    | 'datetime'
    | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export function CrudFormModal({
  title,
  fields,
  initial = {},
  submitLabel,
  onClose,
  onSubmit,
  onDelete,
}: {
  title: string;
  fields: CrudField[];
  initial?: Record<string, string>;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of fields) o[f.key] = initial[f.key] ?? '';
    return o;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const missing = fields.some((f) => f.required && !vals[f.key]?.trim());

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, string> = {};
      for (const f of fields) {
        let v = (vals[f.key] ?? '').trim();
        if (!v) continue;
        if (f.type === 'datetime') v = new Date(v).toISOString();
        payload[f.key] = v;
      }
      await onSubmit(payload);
      onClose();
    } catch {
      setErr(t('common.error') || 'An error occurred.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this record?')) return;
    setBusy(true);
    setErr(null);
    try {
      await onDelete();
      onClose();
    } catch {
      setErr(t('common.error') || 'An error occurred.');
    } finally {
      setBusy(false);
    }
  };

  const inputType = (t?: CrudField['type']) =>
    t === 'datetime'
      ? 'datetime-local'
      : t === 'date'
        ? 'date'
        : t === 'email'
          ? 'email'
          : t === 'password'
            ? 'password'
            : 'text';

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            {f.type === 'select' ? (
              <div>
                <Label>
                  {t(f.label) || f.label}
                  {f.required ? ' *' : ''}
                </Label>
                <select
                  value={vals[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:focus:bg-slate-950/90"
                >
                  <option value="" className="bg-white dark:bg-slate-900">— select —</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value} className="bg-white dark:bg-slate-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : f.type === 'textarea' ? (
              <div>
                <Label>
                  {t(f.label) || f.label}
                  {f.required ? ' *' : ''}
                </Label>
                <Textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={vals[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ) : f.type === 'phone' ? (
              <PhoneNumberField
                id={`cf-${f.key}`}
                label={(t(f.label) || f.label) + (f.required ? ' *' : '')}
                value={vals[f.key]}
                onChange={(v) => set(f.key, v)}
              />
            ) : (
              <FormField
                id={`cf-${f.key}`}
                label={(t(f.label) || f.label) + (f.required ? ' *' : '')}
                type={inputType(f.type)}
                placeholder={f.placeholder}
                value={vals[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button
            disabled={busy || missing}
            loading={busy}
            onClick={submit}
          >
            {submitLabel ?? (t('common.save') || 'Save')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        {onDelete && (
          <Button variant="danger" disabled={busy} onClick={del}>
            {t('common.delete') || 'Delete'}
          </Button>
        )}
      </div>
      {err && <p className="mt-3 text-xs font-medium text-rose-500 dark:text-rose-400">{err}</p>}
    </Modal>
  );
}
