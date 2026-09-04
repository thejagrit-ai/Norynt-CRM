'use client';
// app/embed/[publicKey]/page.tsx — Public lead capture widget for third-party iframe embeds.
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { IntlPhoneInput } from '@/components/molecules/IntlPhoneInput';
import type { LeadFormField } from '@/types';

interface PublicConfig {
  name: string;
  fields: LeadFormField[];
  buttonColor: string;
  buttonLabel: string;
  successMessage: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

function validateField(f: LeadFormField, raw: string): string | null {
  const value = (raw ?? '').trim();
  const label = f.label || f.key;
  const msg = (fallback: string) => f.errorMessage || fallback;
  if (value === '') return f.required ? msg(`${label} is required.`) : null;
  const type = f.type ?? 'text';
  if (type === 'email' && !EMAIL_RE.test(value))
    return msg(`${label} must be a valid email address.`);
  if (type === 'phone' && !E164_RE.test(value))
    return msg(`${label} must be a valid international phone number.`);
  if (type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return msg(`${label} must be a number.`);
    if (f.min != null && n < f.min) return msg(`${label} must be at least ${f.min}.`);
    if (f.max != null && n > f.max)
      return msg(`${label} must be at most ${f.max}.`);
  }
  if (f.minLength != null && value.length < f.minLength)
    return msg(`${label} must be at least ${f.minLength} characters.`);
  if (f.maxLength != null && value.length > f.maxLength)
    return msg(`${label} must be at most ${f.maxLength} characters.`);
  if (f.pattern) {
    try {
      if (!new RegExp(f.pattern).test(value))
        return msg(`${label} does not match the required format.`);
    } catch {
      /* pass */
    }
  }
  return null;
}

export default function EmbedFormPage({
  params,
}: {
  params: { publicKey: string };
}) {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(
    'idle',
  );

  useEffect(() => {
    fetch(`/api/v1/public/lead-forms/${params.publicKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setCfg(j.data as PublicConfig))
      .catch(() => setNotFound(true));
  }, [params.publicKey]);

  const setVal = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg) return;
    const next: Record<string, string> = {};
    for (const f of cfg.fields) {
      const err = validateField(f, values[f.key] ?? '');
      if (err) next[f.key] = err;
    }
    setErrors(next);
    setServerErr(null);
    if (Object.keys(next).length > 0) return;

    setState('sending');
    try {
      const res = await fetch(
        `/api/v1/public/lead-forms/${params.publicKey}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        setServerErr(j?.error?.message ?? t('embed.error'));
        setState('idle');
        return;
      }
      const redirect = j?.data?.redirectUrl as string | null;
      if (redirect) {
        const target = /^https?:\/\//i.test(redirect)
          ? redirect
          : `https://${redirect}`;
        window.location.href = target;
        return;
      }
      setState('done');
    } catch {
      setState('error');
    }
  };

  if (notFound) {
    return (
      <main className="p-8 text-center text-xs text-slate-400 font-medium">
        {t('embed.notFound')}
      </main>
    );
  }
  if (!cfg) {
    return <main className="p-8 text-center text-xs text-slate-500">Loading…</main>;
  }
  if (state === 'done') {
    return (
      <main className="flex flex-col items-center justify-center p-8 text-center space-y-3 min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-slate-100">
          {cfg.successMessage || t('embed.thanks')}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6 font-sans">
      <h1 className="mb-5 text-base font-bold tracking-tight text-slate-100">{cfg.name}</h1>
      <form onSubmit={submit} noValidate className="space-y-4">
        {cfg.fields.map((f) => {
          const err = errors[f.key];
          const border = err
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-700/80 focus:border-indigo-500 focus:ring-indigo-500/20';
          return (
            <div key={f.key} className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                {f.label}
                {f.required && <span className="text-rose-400 font-bold"> *</span>}
              </label>
              {f.type === 'phone' ? (
                <IntlPhoneInput
                  value={values[f.key] ?? ''}
                  onChange={(v) => setVal(f.key, v)}
                  defaultCountry={f.defaultCountry}
                  required={f.required}
                  placeholder={f.placeholder}
                  invalid={!!err}
                />
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  required={f.required}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  className={`w-full rounded-xl border ${border} bg-slate-950/70 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition duration-200 focus:ring-2`}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : (f.type ?? 'text')}
                  required={f.required}
                  placeholder={f.placeholder}
                  maxLength={f.type === 'number' ? undefined : f.maxLength}
                  min={f.type === 'number' ? f.min : undefined}
                  max={f.type === 'number' ? f.max : undefined}
                  value={values[f.key] ?? ''}
                  onChange={(e) => setVal(f.key, e.target.value)}
                  className={`w-full rounded-xl border ${border} bg-slate-950/70 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition duration-200 focus:ring-2`}
                />
              )}
              {f.helpText && !err && (
                <p className="text-[11px] text-slate-400">{f.helpText}</p>
              )}
              {err && <p className="text-[11px] font-medium text-rose-400">{err}</p>}
            </div>
          );
        })}
        {serverErr && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-semibold">
            {serverErr}
          </div>
        )}
        {state === 'error' && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 font-semibold">
            {t('embed.error')}
          </div>
        )}
        <button
          type="submit"
          disabled={state === 'sending'}
          style={{ backgroundColor: cfg.buttonColor || '#6366f1' }}
          className="w-full rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {state === 'sending'
            ? t('embed.sending')
            : cfg.buttonLabel || t('embed.send')}
        </button>
      </form>
    </main>
  );
}
