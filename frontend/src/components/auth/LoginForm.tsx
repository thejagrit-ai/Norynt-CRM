'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { PasswordField } from './PasswordField';
import { describeAuthError, normalizeEmail, validateEmail } from './authUtils';
import styles from './auth.module.css';

const LS_REMEMBER_KEY = 'norynt_crm_remember_email';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const notice =
    params.get('reset') === '1'
      ? 'Password updated. Sign in with your new password.'
      : params.get('verified') === '1'
        ? 'Email confirmed. Sign in to open your workspace.'
        : null;

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);

  // Restore remembered email (unless we arrived with one from registration).
  useEffect(() => {
    let focusPassword = false;
    try {
      const saved = localStorage.getItem(LS_REMEMBER_KEY);
      if (saved && !params.get('email')) {
        setEmail(saved);
        setRemember(true);
        focusPassword = true;
      }
    } catch {
      /* storage unavailable */
    }
    if (params.get('email')) focusPassword = true;
    if (focusPassword) passwordRef.current?.querySelector('input')?.focus();
    else emailRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const eErr = validateEmail(email);
    const pErr = password ? null : 'Enter your password.';
    setEmailError(eErr);
    setPasswordError(pErr);
    setFormError(null);
    if (eErr) return emailRef.current?.focus();
    if (pErr) return passwordRef.current?.querySelector('input')?.focus();

    setBusy(true);
    try {
      const clean = normalizeEmail(email);
      await login(clean, password);
      try {
        if (remember) localStorage.setItem(LS_REMEMBER_KEY, clean);
        else localStorage.removeItem(LS_REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      router.replace('/');
    } catch (err) {
      const { status, message } = describeAuthError(err, 'login');
      if (status === 403) {
        router.push(`/verify-email?email=${encodeURIComponent(normalizeEmail(email))}&from=login`);
        return;
      }
      setFormError(message);
      setPassword('');
      passwordRef.current?.querySelector('input')?.focus();
      setBusy(false);
    }
  }

  return (
    <>
      <div className={styles.heading}>
        <h1>Sign in</h1>
        <p>Welcome back. Enter your details to open your workspace.</p>
      </div>

      <form onSubmit={onSubmit} className={styles.form} noValidate aria-busy={busy}>
        {notice && !formError && (
          <div className={`${styles.banner} ${styles.bannerOk}`} role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <p>{notice}</p>
          </div>
        )}
        {formError && (
          <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{formError}</p>
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="login-email">Work email</label>
          <input
            ref={emailRef}
            id="login-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@company.com"
            className={styles.input}
            value={email}
            disabled={busy}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'login-email-error' : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
              if (formError) setFormError(null);
            }}
            onBlur={() => email && setEmailError(validateEmail(email))}
          />
          {emailError && (
            <p id="login-email-error" role="alert" className={styles.fieldError}>
              <AlertCircle size={14} aria-hidden="true" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        <div ref={passwordRef}>
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (passwordError) setPasswordError(null);
              if (formError) setFormError(null);
            }}
            autoComplete="current-password"
            placeholder="Your password"
            error={passwordError}
            disabled={busy}
            labelAction={
              <Link
                href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(normalizeEmail(email))}` : ''}`}
                className={styles.linkBtn}
                style={{ textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            }
          />
        </div>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            disabled={busy}
          />
          Remember my email on this device
        </label>

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className={styles.alt}>
        New to Norynt? <Link href="/register">Create an account</Link>
      </p>
    </>
  );
}
