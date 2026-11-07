'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { OtpInput } from './OtpInput';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
import { useCountdown } from './useCountdown';
import { PASSWORD_RULES, describeAuthError, normalizeEmail, validateEmail } from './authUtils';
import styles from './auth.module.css';

export function ForgotPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ code?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { left, restart } = useCountdown(0);
  const emailRef = useRef<HTMLInputElement>(null);

  async function requestCode(e?: React.FormEvent, isResend = false) {
    e?.preventDefault();
    if (busy) return;
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return emailRef.current?.focus();
    setBusy(true);
    setFormError(null);
    try {
      await api.post('/auth/forgot-password', { email: normalizeEmail(email) });
      restart(60);
      setNotice(isResend ? 'New code sent. Check your inbox.' : null);
      setStep('reset');
    } catch (e2) {
      setFormError(describeAuthError(e2, 'reset').message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (code.length !== 6) next.code = 'Enter all 6 digits from your email.';
    if (!password) next.password = 'Create a new password.';
    else if (!PASSWORD_RULES.every((r) => r.test(password)))
      next.password = 'Your password doesn’t meet every requirement below.';
    if (!confirm) next.confirm = 'Re-enter your new password.';
    else if (confirm !== password) next.confirm = 'The passwords don’t match.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const clean = normalizeEmail(email);
      await api.post('/auth/reset-password', { email: clean, otp: code, newPassword: password });
      router.replace(`/login?reset=1&email=${encodeURIComponent(clean)}`);
    } catch (e2) {
      setFormError(describeAuthError(e2, 'reset').message);
      setCode('');
      setBusy(false);
    }
  }

  const banner = (
    <>
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
    </>
  );

  if (step === 'email') {
    return (
      <>
        <Link href="/login" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
        </Link>
        <div className={styles.heading}>
          <h1>Forgot your password?</h1>
          <p>Enter your work email and we’ll send you a 6-digit code to reset it.</p>
        </div>
        <form onSubmit={requestCode} className={styles.form} noValidate aria-busy={busy}>
          {banner}
          <div className={styles.field}>
            <label htmlFor="fp-email">Work email</label>
            <input
              ref={emailRef}
              id="fp-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              placeholder="name@company.com"
              className={styles.input}
              value={email}
              disabled={busy}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'fp-email-error' : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
            />
            {emailError && (
              <p id="fp-email-error" role="alert" className={styles.fieldError}>
                <AlertCircle size={14} aria-hidden="true" />
                <span>{emailError}</span>
              </p>
            )}
          </div>
          <button type="submit" className={styles.submit} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={19} className={styles.spin} aria-hidden="true" /> Sending code…
              </>
            ) : (
              'Send reset code'
            )}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <button type="button" className={`${styles.backLink} ${styles.linkBtn}`} onClick={() => setStep('email')}>
        <ArrowLeft size={16} aria-hidden="true" /> Use a different email
      </button>
      <div className={styles.heading}>
        <h1>Set a new password</h1>
        <p>
          If <span className={styles.emailChip}>{normalizeEmail(email)}</span> has an account, a code is on its
          way. It expires in 10 minutes.
        </p>
      </div>
      <form onSubmit={resetPassword} className={styles.form} noValidate aria-busy={busy}>
        {banner}
        <div className={styles.field}>
          <span className={styles.labelText} id="fp-code-label">6-digit code</span>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              if (errors.code) setErrors((x) => ({ ...x, code: undefined }));
            }}
            invalid={!!errors.code}
            disabled={busy}
            autoFocus
            describedBy={errors.code ? 'fp-code-error' : undefined}
          />
          {errors.code && (
            <p id="fp-code-error" role="alert" className={styles.fieldError}>
              <AlertCircle size={14} aria-hidden="true" />
              <span>{errors.code}</span>
            </p>
          )}
          <div className={styles.resendRow}>
            Didn’t get it?
            {left > 0 ? (
              <span>Resend in {left}s</span>
            ) : (
              <button type="button" className={styles.linkBtn} onClick={() => void requestCode(undefined, true)} disabled={busy}>
                Send a new code
              </button>
            )}
          </div>
        </div>

        <PasswordField
          id="fp-password"
          label="New password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
          }}
          autoComplete="new-password"
          placeholder="Create a new password"
          error={errors.password}
          describedBy="fp-rules"
          disabled={busy}
        >
          <PasswordStrength value={password} id="fp-rules" />
        </PasswordField>

        <PasswordField
          id="fp-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            if (errors.confirm) setErrors((x) => ({ ...x, confirm: undefined }));
          }}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          error={errors.confirm}
          disabled={busy}
        />

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" /> Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </>
  );
}
