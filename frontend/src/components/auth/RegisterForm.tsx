'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { describeAuthError, normalizeEmail, validateEmail } from './authUtils';
import styles from './auth.module.css';

type Field = 'firstName' | 'lastName' | 'email';
type Errors = Partial<Record<Field, string | null>>;

function validate(f: Record<Field, string>): Errors {
  return {
    firstName: f.firstName.trim() ? null : 'Enter your first name.',
    lastName: f.lastName.trim() ? null : 'Enter your last name.',
    email: validateEmail(f.email),
  };
}

/** Step 1 of signup: no password here. You choose it after proving you own the email. */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({ firstName: '', lastName: '', email: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function set(field: Field, v: string) {
    const next = { ...values, [field]: v };
    setValues(next);
    setFormError(null);
    if (field === 'email') setEmailTaken(false);
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validate(next)[field] }));
  }

  function blur(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validate(values)[field] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const all = validate(values);
    setErrors(all);
    setTouched({ firstName: true, lastName: true, email: true });
    setFormError(null);

    const firstBad = (['firstName', 'lastName', 'email'] as Field[]).find((k) => all[k]);
    if (firstBad) {
      formRef.current?.querySelector<HTMLInputElement>(`#reg-${firstBad}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const clean = normalizeEmail(values.email);
      await register({ email: clean, firstName: values.firstName.trim(), lastName: values.lastName.trim() });
      router.push(`/verify-email?email=${encodeURIComponent(clean)}&from=register`);
    } catch (err) {
      const { message, status } = describeAuthError(err, 'register');
      if (status === 409) {
        setEmailTaken(true);
        setErrors((x) => ({ ...x, email: message }));
        formRef.current?.querySelector<HTMLInputElement>('#reg-email')?.focus();
      } else {
        setFormError(message);
      }
      setBusy(false);
    }
  }

  const err = (f: Field) => errors[f] ?? null;
  const inputProps = (f: Field, id: string) => ({
    id,
    name: f,
    className: styles.input,
    value: values[f],
    disabled: busy,
    'aria-invalid': !!err(f),
    'aria-describedby': err(f) ? `${id}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(f, e.target.value),
    onBlur: () => blur(f),
  });
  const fieldError = (f: Field, id: string) =>
    err(f) && (
      <p id={`${id}-error`} role="alert" className={styles.fieldError}>
        <AlertCircle size={14} aria-hidden="true" />
        <span>
          {err(f)}
          {f === 'email' && emailTaken && (
            <>
              {' '}
              <Link href={`/login?email=${encodeURIComponent(normalizeEmail(values.email))}`}>Sign in instead</Link>
            </>
          )}
        </span>
      </p>
    );

  return (
    <>
      <div className={styles.heading}>
        <h1>Create your account</h1>
        <p>Enter your name and work email. We’ll send a code to confirm it, then you choose a password.</p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className={styles.form} noValidate aria-busy={busy}>
        {formError && (
          <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{formError}</p>
          </div>
        )}

        <div className={styles.row2}>
          <div className={styles.field}>
            <label htmlFor="reg-firstName">First name</label>
            <input {...inputProps('firstName', 'reg-firstName')} autoComplete="given-name" autoFocus />
            {fieldError('firstName', 'reg-firstName')}
          </div>
          <div className={styles.field}>
            <label htmlFor="reg-lastName">Last name</label>
            <input {...inputProps('lastName', 'reg-lastName')} autoComplete="family-name" />
            {fieldError('lastName', 'reg-lastName')}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="reg-email">Work email</label>
          <input
            {...inputProps('email', 'reg-email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@company.com"
          />
          {fieldError('email', 'reg-email')}
        </div>

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" />
              Sending code…
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className={styles.alt}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
