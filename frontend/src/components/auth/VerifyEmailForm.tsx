'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { OtpInput } from './OtpInput';
import { useCountdown } from './useCountdown';
import { describeAuthError } from './authUtils';
import styles from './auth.module.css';

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const from = params.get('from');

  const [code, setCode] = useState('');
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

  async function verify(value: string) {
    if (busy) return;
    if (value.length !== 6) {
      setError('Enter all 6 digits from your email.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { email, otp: value });
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
        <h1>Check your email</h1>
        <p>
          We sent a 6-digit code to <span className={styles.emailChip}>{email}</span>. It expires in 10
          minutes.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void verify(code);
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
          onComplete={(v) => void verify(v)}
          invalid={!!error}
          disabled={busy}
          autoFocus
          describedBy={error ? 'otp-error' : undefined}
        />

        <button type="submit" className={styles.submit} disabled={busy || code.length !== 6}>
          {busy ? (
            <>
              <Loader2 size={19} className={styles.spin} aria-hidden="true" /> Verifying…
            </>
          ) : (
            <>
              <MailCheck size={19} aria-hidden="true" /> Verify email
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
