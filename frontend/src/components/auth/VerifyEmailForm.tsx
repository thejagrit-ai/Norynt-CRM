'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { OtpInput } from './OtpInput';
import { PasswordField } from './PasswordField';
import { PasswordStrength } from './PasswordStrength';
import { useCountdown } from './useCountdown';
import { PASSWORD_RULES, describeAuthError } from './authUtils';
import styles from './auth.module.css';

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const from = params.get('from');

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const { left, restart } = useCountdown(from === 'register' ? 60 : 0);
  const sentOnce = useRef(false);

  // Signing in with an unverified account: send a fresh code automatically.
  useEffect(() => {
    if (!email) {
      router.replace('/register');
      return;
    }
    if (from === 'login' && !sentOnce.current) {
      sentOnce.current = true;
      void resend(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resend(auto = false) {
    if (resending) return;
    setResending(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification', { email });
      restart(60);
      setNotice(auto ? 'We sent a new code to your email.' : 'New code sent. Check your inbox.');
    } catch (err) {
      setError(describeAuthError(err, 'otp').message);
    } finally {
      setResending(false);
    }
  }

  async function verify() {
    if (busy) return;
    const next: typeof pwErrors = {};
    if (!password) next.password = 'Create a password.';
    else if (!PASSWORD_RULES.every((r) => r.test(password)))
      next.password = 'Your password doesn’t meet every requirement below.';
    if (!confirm) next.confirm = 'Re-enter your password.';
    else if (confirm !== password) next.confirm = 'The passwords don’t match.';
    setPwErrors(next);
    setError(null);
    if (code.length !== 6) {
      setError('Enter all 6 digits from your email.');
      return;
    }
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.post('/auth/complete-registration', { email, otp: code, newPassword: password });
      router.replace(`/login?verified=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(describeAuthError(err, 'otp').message);
      setCode('');
      setBusy(false);
    }
  }

  if (!email) return null;

  return (
    <>
      <Link href="/register" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </Link>
      <div className={styles.heading}>
        <h1>Confirm your email</h1>
        <p>
          We sent a 6-digit code to <span className={styles.emailChip}>{email}</span>. It expires in 10
          minutes. Enter it below and choose your password.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
        noValidate
        aria-busy={busy}
      >
        {notice && !error && (
          <div className={`${styles.banner} ${styles.bannerOk}`} role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <p>{notice}</p>
          </div>
        )}
        {error && (
          <div className={`${styles.banner} ${styles.bannerError}`} role="alert" id="otp-error">
            <AlertCircle size={18} aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          invalid={!!error}
          disabled={busy}
          autoFocus
          describedBy={error ? 'otp-error' : undefined}
        />

        <PasswordField
          id="verify-password"
          label="Create a password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (pwErrors.password) setPwErrors((x) => ({ ...x, password: undefined }));
          }}
          autoComplete="new-password"
          placeholder="Choose a password"
          error={pwErrors.password}
          describedBy="verify-rules"
          disabled={busy}
        >
          <PasswordStrength value={password} id="verify-rules" />
        </PasswordField>

        <PasswordField
          id="verify-confirm"
          label="Confirm password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            if (pwErrors.confirm) setPwErrors((x) => ({ ...x, confirm: undefined }));
          }}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={pwErrors.confirm}
          disabled={busy}
        />

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" /> Creating account…
            </>
          ) : (
            <>
              <MailCheck size={19} aria-hidden="true" /> Confirm and create account
            </>
          )}
        </button>

        <div className={styles.resendRow}>
          Didn’t get it?
          {left > 0 ? (
            <span>Resend in {left}s</span>
          ) : (
            <button type="button" className={styles.linkBtn} onClick={() => void resend()} disabled={resending}>
              {resending ? 'Sending…' : 'Send a new code'}
            </button>
          )}
        </div>
        <p className={styles.hint}>Check your spam folder too. Wrong address? Go back and register again.</p>
      </form>
    </>
  );
}
