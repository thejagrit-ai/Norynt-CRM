'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
import {
  PASSWORD_RULES,
  describeAuthError,
  normalizeEmail,
  validateEmail,
} from './authUtils';
import styles from './auth.module.css';

type Field = 'firstName' | 'lastName' | 'email' | 'password' | 'confirm';
type Errors = Partial<Record<Field, string | null>>;

function validate(f: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (!f.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (!f.lastName.trim()) errors.lastName = 'Enter your last name.';
  errors.email = validateEmail(f.email);
  if (!f.password) errors.password = 'Create a password.';
  else if (!PASSWORD_RULES.every((r) => r.test(f.password)))
    errors.password = 'Your password doesn’t meet every requirement below.';
  if (!f.confirm) errors.confirm = 'Re-enter your password.';
  else if (f.confirm !== f.password) errors.confirm = 'The passwords don’t match.';
  return errors;
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });
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
    // Re-check a field only after the person has left it once; keep confirm in sync live.
    if (touched[field] || (field === 'password' && touched.confirm)) {
      const all = validate(next);
      setErrors((e) => ({
        ...e,
        [field]: touched[field] ? all[field] : e[field],
        ...(field === 'password' && touched.confirm ? { confirm: all.confirm } : {}),
      }));
    }
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
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirm: true });
    setFormError(null);

    const firstBad = (['firstName', 'lastName', 'email', 'password', 'confirm'] as Field[]).find(
      (k) => all[k],
    );
    if (firstBad) {
      const id = firstBad === 'confirm' ? 'reg-confirm' : `reg-${firstBad}`;
      formRef.current?.querySelector<HTMLInputElement>(`#${id}`)?.focus();
      return;
    }

    setBusy(true);
    try {
      const clean = normalizeEmail(values.email);
      await register({
        email: clean,
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });
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
              <Link href={`/login?email=${encodeURIComponent(normalizeEmail(values.email))}`}>
                Sign in instead
              </Link>
            </>
          )}
        </span>
      </p>
    );

  return (
    <>
      <div className={styles.heading}>
        <h1>Create your account</h1>
        <p>Takes about a minute. We’ll email you a code to confirm your address.</p>
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

        <PasswordField
          id="reg-password"
          label="Password"
          value={values.password}
          onChange={(v) => set('password', v)}
          onBlur={() => blur('password')}
          autoComplete="new-password"
          placeholder="Create a password"
          error={err('password')}
          describedBy="reg-rules"
          disabled={busy}
        >
          <PasswordStrength value={values.password} id="reg-rules" />
        </PasswordField>

        <PasswordField
          id="reg-confirm"
          label="Confirm password"
          value={values.confirm}
          onChange={(v) => set('confirm', v)}
          onBlur={() => blur('confirm')}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={err('confirm')}
          disabled={busy}
        />

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className={styles.alt}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </>
  );
}
