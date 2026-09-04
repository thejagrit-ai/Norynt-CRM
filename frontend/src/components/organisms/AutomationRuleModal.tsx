'use client';
// src/components/organisms/AutomationRuleModal.tsx — automation rule builder with trigger/action builder.
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';

export interface RuleAction {
  type: 'create_activity' | 'send_email' | 'send_whatsapp' | 'log';
  note?: string;
  template?: string;
  to?: string;
}
export interface Rule {
  id: string;
  name: string;
  trigger: string;
  isActive: boolean;
  conditions: { field: string; equals: string } | null;
  actions: RuleAction[];
}

const TRIGGERS = [
  'deal.created',
  'deal.moved',
  'lead.created',
  'invoice.paid',
  'invoice.issued',
];
const ACTION_TYPES: RuleAction['type'][] = [
  'create_activity',
  'send_email',
  'send_whatsapp',
  'log',
];

export function AutomationRuleModal({
  rule,
  onClose,
  onSaved,
}: {
  rule: Rule | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isNew = rule === null;
  const [name, setName] = useState(rule?.name ?? '');
  const [trigger, setTrigger] = useState(rule?.trigger ?? TRIGGERS[0]);
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [condField, setCondField] = useState(rule?.conditions?.field ?? '');
  const [condEquals, setCondEquals] = useState(rule?.conditions?.equals ?? '');
  const [actions, setActions] = useState<RuleAction[]>(
    rule?.actions?.length ? rule.actions : [{ type: 'create_activity', note: '' }],
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setAction = (i: number, patch: Partial<RuleAction>) =>
    setActions(actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const buildActions = () =>
    actions.map((a) => {
      if (a.type === 'send_email')
        return { type: a.type, template: a.template || undefined, to: a.to || undefined };
      if (a.type === 'send_whatsapp')
        return { type: a.type, note: a.note || undefined, to: a.to || undefined };
      return { type: a.type, note: a.note || undefined };
    });

  const conditions = () =>
    condField.trim() && condEquals.trim()
      ? { field: condField.trim(), equals: condEquals.trim() }
      : undefined;

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        await api.post('/automation/rules', {
          name: name.trim(),
          trigger,
          conditions: conditions(),
          actions: buildActions(),
        });
      } else {
        await api.patch(`/automation/rules/${rule.id}`, {
          isActive,
          conditions: conditions(),
          actions: buildActions(),
        });
      }
      onSaved();
      onClose();
    } catch {
      setErr(t('common.error') || 'Unable to save automation rule.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!rule) return;
    if (!confirm(`${t('common.delete') || 'Delete'}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await api.delete(`/automation/rules/${rule.id}`);
      onSaved();
      onClose();
    } catch {
      setErr(t('common.error') || 'Unable to delete automation rule.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? (t('auto.newTitle') || 'New Automation Rule') : `${t('auto.editPrefix') || 'Edit'}: ${rule.name}`}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="ar-name"
          label={`${t('field.name') || 'Rule Name'} ${isNew ? '*' : (t('cf.immutable') || '(immutable)')}`}
          value={name}
          disabled={!isNew}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Label>
            {t('auto.trigger') || 'Trigger Event'} {isNew ? '*' : (t('cf.immutable') || '(immutable)')}
          </Label>
          <select
            value={trigger}
            disabled={!isNew}
            onChange={(e) => setTrigger(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100"
          >
            {TRIGGERS.map((tr) => (
              <option key={tr} value={tr} className="bg-white dark:bg-slate-900">
                {tr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isNew && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-950/60">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
            <span>{t('common.active') || 'Active'}</span>
            <Badge tone={isActive ? 'green' : 'gray'} dot>
              {isActive ? (t('auto.ruleActive') || 'Rule Active') : (t('auto.ruleInactive') || 'Rule Inactive')}
            </Badge>
          </label>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Label>{t('auto.condition') || 'Conditions (Optional)'}</Label>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="ar-cf"
            label={t('auto.field') || 'Field Name'}
            placeholder={t('auto.condFieldPh') || 'e.g. status'}
            value={condField}
            onChange={(e) => setCondField(e.target.value)}
          />
          <FormField
            id="ar-ce"
            label={t('auto.equals') || 'Equals Value'}
            placeholder={t('auto.condEqualsPh') || 'e.g. WON'}
            value={condEquals}
            onChange={(e) => setCondEquals(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Label>{t('auto.actions') || 'Actions'}</Label>
        {actions.map((a, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 shadow-sm space-y-2.5 dark:border-slate-800/80 dark:bg-slate-950/60"
          >
            <div className="flex items-center justify-between gap-2">
              <select
                value={a.type}
                onChange={(e) =>
                  setAction(i, { type: e.target.value as RuleAction['type'] })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200"
              >
                {ACTION_TYPES.map((at) => (
                  <option key={at} value={at} className="bg-white dark:bg-slate-900">
                    {at}
                  </option>
                ))}
              </select>
              {actions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => setActions(actions.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t('auto.remove') || 'Remove'}</span>
                </Button>
              )}
            </div>

            {a.type === 'send_email' ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder={t('auto.templatePh') || 'Template name (e.g. deal.won)'}
                  value={a.template ?? ''}
                  onChange={(e) => setAction(i, { template: e.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder={t('auto.toPh') || 'Recipient email'}
                  value={a.to ?? ''}
                  onChange={(e) => setAction(i, { to: e.target.value })}
                />
              </div>
            ) : a.type === 'send_whatsapp' ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder={(t('wa.message') || 'Message') + ' — {{firstName}}…'}
                  value={a.note ?? ''}
                  onChange={(e) => setAction(i, { note: e.target.value })}
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder={t('auto.sendWhatsappHint') || 'Phone number'}
                  value={a.to ?? ''}
                  onChange={(e) => setAction(i, { to: e.target.value })}
                />
              </div>
            ) : (
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder={t('auto.notePh') || 'Log note'}
                value={a.note ?? ''}
                onChange={(e) => setAction(i, { note: e.target.value })}
              />
            )}
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setActions([...actions, { type: 'log', note: '' }])}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('auto.addAction') || 'Add Action'}</span>
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
        <div className="flex gap-2">
          <Button
            disabled={busy || (isNew && !name.trim())}
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
