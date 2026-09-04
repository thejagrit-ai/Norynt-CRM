'use client';
// src/components/organisms/LeadFormModal.tsx — lead intake form designer & embed/webhook share drawer.
import React, { useState } from 'react';
import { Copy, Check, Settings, Trash2, Plus, RefreshCw, KeyRound, Code, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { COUNTRIES } from '@/lib/countries';
import { Modal } from '../molecules/Modal';
import { FormField } from '../molecules/FormField';
import { Textarea } from '../atoms/Textarea';
import { Button } from '../atoms/Button';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import type { LeadForm, LeadFormField } from '@/types';

const FIELD_TYPES = ['text', 'email', 'tel', 'phone', 'textarea', 'number'];

function CopyRow({
  value,
  label,
  copyText,
  copiedText,
  mono,
}: {
  value: string;
  label: string;
  copyText: string;
  copiedText: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-3 space-y-1">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 truncate rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200 ${
            mono ? 'font-mono' : ''
          }`}
          title={value}
        >
          {value}
        </code>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 text-xs py-2 px-3"
          onClick={() => {
            void navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">{copiedText}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>{copyText}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function LeadFormModal({
  form,
  onClose,
  onSaved,
}: {
  form: LeadForm | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isNew = form === null;
  const [name, setName] = useState(form?.name ?? '');
  const [fields, setFields] = useState<LeadFormField[]>(
    form?.fields ?? [
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
  );
  const [buttonColor, setButtonColor] = useState(form?.buttonColor ?? '#4f46e5');
  const [buttonLabel, setButtonLabel] = useState(form?.buttonLabel ?? 'Submit');
  const [successMessage, setSuccessMessage] = useState(
    form?.successMessage ?? '',
  );
  const [redirectUrl, setRedirectUrl] = useState(form?.redirectUrl ?? '');
  const [isActive, setIsActive] = useState(form?.isActive ?? true);
  const [openSettings, setOpenSettings] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<LeadForm | null>(null);
  const [secret, setSecret] = useState<string | null>(form?.secret ?? null);

  const setField = (i: number, patch: Partial<LeadFormField>) =>
    setFields(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const setNum = (i: number, k: 'min' | 'max' | 'minLength' | 'maxLength', v: string) => {
    const n = v === '' ? undefined : Number(v);
    setField(i, { [k]: Number.isNaN(n) ? undefined : n });
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (isNew) {
        const res = await api.post('/lead-forms', {
          name: name.trim(),
          fields,
          buttonColor,
          buttonLabel: buttonLabel.trim(),
          successMessage: successMessage.trim() || undefined,
          redirectUrl: redirectUrl.trim() || undefined,
        });
        const createdForm = res.data.data as LeadForm;
        setCreated(createdForm);
        setSecret(createdForm.secret ?? null);
        onSaved();
      } else {
        await api.patch(`/lead-forms/${form.id}`, {
          name: name.trim(),
          fields,
          buttonColor,
          buttonLabel: buttonLabel.trim(),
          successMessage: successMessage.trim() || undefined,
          redirectUrl: redirectUrl.trim() || undefined,
          isActive,
        });
        onSaved();
        onClose();
      }
    } catch {
      setErr(t('common.error') || 'Failed to save lead form.');
    } finally {
      setBusy(false);
    }
  };

  const shareForm = created ?? (isNew ? null : form);

  const reveal = async () => {
    if (!form) return;
    const res = await api.get(`/lead-forms/${form.id}/secret`);
    setSecret(res.data.data.secret as string);
  };
  const rotate = async () => {
    if (!form) return;
    if (!confirm(t('lf.rotateConfirm') || 'Rotate webhook secret key?')) return;
    const res = await api.post(`/lead-forms/${form.id}/rotate-secret`);
    setSecret(res.data.data.secret as string);
  };

  return (
    <Modal
      title={isNew ? (t('lf.newTitle') || 'New Lead Intake Form') : `${t('lf.editPrefix') || 'Edit Form'}: ${form.name}`}
      onClose={onClose}
    >
      {created && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t('lf.secretOnce') || 'Form created successfully. Copy your embed snippet or webhook URL below.'}
        </div>
      )}

      {!created && (
        <div className="space-y-4">
          <FormField
            id="lf-name"
            label={`${t('field.name') || 'Form Title'} *`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-2">
            <Label>{t('lf.fields') || 'Form Fields'}</Label>
            {fields.map((f, i) => {
              const type = f.type ?? 'text';
              const isNumber = type === 'number';
              const isText = ['text', 'textarea', 'tel', 'email'].includes(type);
              const open = openSettings === i;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2 dark:border-slate-800/80 dark:bg-slate-950/60"
                >
                  <div className="grid grid-cols-12 items-center gap-2">
                    <input
                      className="col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
                      placeholder={t('lf.fieldKey') || 'Field Key'}
                      value={f.key}
                      onChange={(e) => setField(i, { key: e.target.value })}
                    />
                    <input
                      className="col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100"
                      placeholder={t('lf.fieldLabel') || 'Field Label'}
                      value={f.label}
                      onChange={(e) => setField(i, { label: e.target.value })}
                    />
                    <select
                      className="col-span-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-200"
                      value={type}
                      onChange={(e) => setField(i, { type: e.target.value })}
                    >
                      {FIELD_TYPES.map((tp) => (
                        <option key={tp} value={tp} className="bg-white dark:bg-slate-900">
                          {tp === 'phone' ? (t('lf.typePhone') || 'Phone') : tp}
                        </option>
                      ))}
                    </select>
                    <label className="col-span-2 flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!f.required}
                        onChange={(e) =>
                          setField(i, { required: e.target.checked })
                        }
                        className="rounded border-slate-300 bg-white text-brand-600 dark:border-slate-700 dark:bg-slate-900"
                      />
                      <span>{t('lf.fieldRequired') || 'Required'}</span>
                    </label>
                    <button
                      type="button"
                      className={`col-span-1 flex h-7 w-7 items-center justify-center rounded-lg ${
                        open ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                      }`}
                      onClick={() => setOpenSettings(open ? null : i)}
                      aria-label={t('lf.settings') || 'Settings'}
                      title={t('lf.settings') || 'Settings'}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="col-span-1 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500"
                      onClick={() =>
                        setFields(fields.filter((_, idx) => idx !== i))
                      }
                      aria-label={t('auto.remove') || 'Remove'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {open && (
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900/80 animate-slide-down">
                      <div className="col-span-2">
                        <Label>{t('lf.placeholder') || 'Placeholder Text'}</Label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                          value={f.placeholder ?? ''}
                          onChange={(e) =>
                            setField(i, { placeholder: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>{t('lf.helpText') || 'Help Text / Description'}</Label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                          value={f.helpText ?? ''}
                          onChange={(e) =>
                            setField(i, { helpText: e.target.value })
                          }
                        />
                      </div>

                      {isNumber && (
                        <>
                          <div>
                            <Label>{t('lf.min') || 'Min Value'}</Label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                              value={f.min ?? ''}
                              onChange={(e) => setNum(i, 'min', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>{t('lf.max') || 'Max Value'}</Label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                              value={f.max ?? ''}
                              onChange={(e) => setNum(i, 'max', e.target.value)}
                            />
                          </div>
                        </>
                      )}

                      {isText && (
                        <>
                          <div>
                            <Label>{t('lf.minLength') || 'Min Length'}</Label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                              value={f.minLength ?? ''}
                              onChange={(e) =>
                                setNum(i, 'minLength', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label>{t('lf.maxLength') || 'Max Length'}</Label>
                            <input
                              type="number"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                              value={f.maxLength ?? ''}
                              onChange={(e) =>
                                setNum(i, 'maxLength', e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}

                      {type === 'phone' && (
                        <div className="col-span-2">
                          <Label>{t('lf.defaultCountry') || 'Default Country'}</Label>
                          <select
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-200"
                            value={f.defaultCountry ?? 'IN'}
                            onChange={(e) =>
                              setField(i, { defaultCountry: e.target.value })
                            }
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.iso2} value={c.iso2} className="bg-white dark:bg-slate-900">
                                {c.flag} {c.name} (+{c.dial})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="col-span-2">
                        <Label>{t('lf.errorMessage') || 'Validation Error Message'}</Label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 dark:border-slate-700/80 dark:bg-slate-950 dark:text-slate-100"
                          placeholder={t('lf.errorMessagePh') || 'Invalid input message...'}
                          value={f.errorMessage ?? ''}
                          onChange={(e) =>
                            setField(i, {
                              errorMessage: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFields([
                  ...fields,
                  { key: '', label: '', type: 'text', required: false },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('lf.addField') || 'Add Field'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('lf.buttonColor') || 'Button Color'}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="h-10 w-12 rounded-xl border border-slate-200 bg-white cursor-pointer dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 outline-none dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-200"
                />
              </div>
            </div>
            <FormField
              id="lf-btn"
              label={t('lf.buttonLabel') || 'Submit Button Label'}
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
            />
          </div>

          <div>
            <Label>{t('lf.successMessage') || 'Custom Success Message'}</Label>
            <Textarea
              rows={2}
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
            />
          </div>

          <div>
            <FormField
              id="lf-redirect"
              label={t('lf.redirectUrl') || 'Post-Submission Redirect URL'}
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
            />
          </div>

          {!isNew && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-950/60">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
                />
                <span>{t('common.active') || 'Active Status'}</span>
                <Badge tone={isActive ? 'green' : 'gray'} dot>
                  {isActive ? (t('lf.formActive') || 'Form Active') : (t('lf.formInactive') || 'Form Inactive')}
                </Badge>
              </label>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <div className="flex gap-2">
              <Button disabled={busy || !name.trim()} loading={busy} onClick={save}>
                {isNew ? (t('common.create') || 'Create Form') : (t('common.save') || 'Save Changes')}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                {t('common.cancel') || 'Cancel'}
              </Button>
            </div>
            {err && <span className="text-xs font-medium text-rose-500 dark:text-rose-400">{err}</span>}
          </div>
        </div>
      )}

      {/* Share / Embed Panel */}
      {shareForm && (
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800/80">
          {!shareForm.isActive && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              {t('lf.inactive') || 'This form is currently inactive. Submissions will be rejected until activated.'}
            </div>
          )}

          <CopyRow
            label={t('lf.embedTitle') || 'Embed HTML Code'}
            value={`<iframe src="${origin}/embed/${shareForm.publicKey}" style="width:100%;max-width:480px;height:560px;border:0" loading="lazy"></iframe>`}
            copyText={t('lf.copy') || 'Copy'}
            copiedText={t('lf.copied') || 'Copied'}
            mono
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('lf.embedHint') || 'Paste this iframe into your landing page or website.'}
          </p>

          <CopyRow
            label={t('lf.webhookTitle') || 'Direct API / Webhook Endpoint'}
            value={`${origin}/api/v1/webhooks/leads/${shareForm.publicKey}`}
            copyText={t('lf.copy') || 'Copy'}
            copiedText={t('lf.copied') || 'Copied'}
            mono
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('lf.webhookHint') || 'Send JSON payloads directly from server-side scripts or third-party webhooks.'}
          </p>

          {secret ? (
            <CopyRow
              label={t('lf.secret') || 'Webhook Signing Secret'}
              value={secret}
              copyText={t('lf.copy') || 'Copy'}
              copiedText={t('lf.copied') || 'Copied'}
              mono
            />
          ) : (
            <Button variant="secondary" size="sm" onClick={reveal}>
              <KeyRound className="h-3.5 w-3.5" />
              <span>{t('lf.reveal') || 'Reveal Webhook Secret'}</span>
            </Button>
          )}

          {!isNew && (
            <Button variant="ghost" size="sm" onClick={rotate} className="ml-2">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('lf.rotate') || 'Rotate Secret'}</span>
            </Button>
          )}

          {created && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <Button onClick={onClose}>{t('common.done') || 'Done'}</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
