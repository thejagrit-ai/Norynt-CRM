'use client';
// src/components/organisms/CustomFieldModal.tsx — custom field schema builder with light/dark theme support.
import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';

export interface FieldDef {
  id: string;
  entity: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
}

const ENTITIES = ['DEAL', 'CONTACT', 'COMPANY', 'LEAD'];
const TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'];

export function CustomFieldModal({
  def,
  onClose,
  onSaved,
}: {
  def: FieldDef | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isNew = def === null;
  const [entity, setEntity] = useState(def?.entity ?? 'DEAL');
  const [key, setKey] = useState(def?.key ?? '');
  const [label, setLabel] = useState(def?.label ?? '');
  const [type, setType] = useState(def?.type ?? 'TEXT');
  const [options, setOptions] = useState((def?.options ?? []).join('\n'));
  const [required, setRequired] = useState(def?.required ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const optionList = () =>
    options
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/custom-fields', {
          entity,
          key: key.trim(),
          label: label.trim(),
          type,
          options: type === 'SELECT' ? optionList() : [],
          required,
        });
      } else {
        await api.patch(`/custom-fields/${def.id}`, {
          label: label.trim(),
          options: def.type === 'SELECT' ? optionList() : [],
          required,
        });
      }
      onSaved();
      onClose();
    } catch {
      setErr(t('common.error') || 'An error occurred.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!def) return;
    if (!confirm(`${t('common.delete') || 'Delete'}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/custom-fields/${def.id}`);
      onSaved();
      onClose();
    } catch {
      setErr(t('common.error') || 'An error occurred.');
    } finally {
      setBusy(false);
    }
  };

  const showOptions = (isNew ? type : def?.type) === 'SELECT';

  return (
    <Modal
      title={isNew ? (t('cf.newTitle') || 'New Custom Field') : `${t('cf.editPrefix') || 'Edit'}: ${def.key}`}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>
            {t('cf.entity') || 'Target Entity'} {isNew ? '*' : (t('cf.immutable') || '(immutable)')}
          </Label>
          <select
            value={entity}
            disabled={!isNew}
            onChange={(e) => setEntity(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100"
          >
            {ENTITIES.map((x) => (
              <option key={x} value={x} className="bg-white dark:bg-slate-900">
                {x}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id="cf-key"
          label={`${t('cf.key') || 'Field Key'} ${isNew ? '*' : (t('cf.immutable') || '(immutable)')}`}
          placeholder={t('cf.keyPh') || 'e.g. renewalDate'}
          value={key}
          disabled={!isNew}
          onChange={(e) => setKey(e.target.value)}
        />
        <FormField
          id="cf-label"
          label={`${t('cf.label') || 'Display Label'} *`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div>
          <Label>
            {t('cf.type') || 'Field Type'} {isNew ? '*' : (t('cf.immutable') || '(immutable)')}
          </Label>
          <select
            value={type}
            disabled={!isNew}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100"
          >
            {TYPES.map((x) => (
              <option key={x} value={x} className="bg-white dark:bg-slate-900">
                {x}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showOptions && (
        <div className="mt-4">
          <Label>{t('cf.options') || 'Select Options (one per line)'}</Label>
          <Textarea
            rows={3}
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={'SMB\nENTERPRISE'}
          />
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-950/60">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <span>{t('cf.requiredField') || 'Mandatory Required Field'}</span>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button
            disabled={busy || (isNew && (!key.trim() || !label.trim()))}
            loading={busy}
            onClick={save}
          >
            {t('common.save') || 'Save'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
        </div>
        {!isNew && (
          <Button variant="danger" disabled={busy} loading={busy} onClick={del}>
            {t('common.delete') || 'Delete'}
          </Button>
        )}
      </div>
      {err && <p className="mt-3 text-xs font-medium text-rose-500 dark:text-rose-400">{err}</p>}
    </Modal>
  );
}
