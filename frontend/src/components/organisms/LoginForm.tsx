'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import styles from './LoginForm.module.css';

const LS_REMEMBER_KEY = 'norynt_crm_remember_email';

export function LoginForm() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Safe load of remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(LS_REMEMBER_KEY);
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function validate(): boolean {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setError(null);
    setInfoMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError(t('login.error.emptyEmail') || 'Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError(t('login.error.emptyEmail') || 'Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError(t('login.error.emptyPassword') || 'Password is required.');
      isValid = false;
    }

    return isValid;
  }

  async function handleLogin() {
    if (busy) return;
    setError(null);
    setInfoMessage(null);
    setEmailError(null);
    setPasswordError(null);
    setBusy(true);

    try {
      await login(email.trim(), password);

      // Persist email only if rememberMe is enabled
      try {
        if (rememberMe) {
          localStorage.setItem(LS_REMEMBER_KEY, email.trim());
        } else {
          localStorage.removeItem(LS_REMEMBER_KEY);
        }
      } catch {
        /* ignore */
      }

      router.replace('/');
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError(
          t('login.error.rateLimit') ||
            'Too many login attempts. Please wait a moment before trying again.',
        );
      } else if (err?.response?.status === 401) {
        setError(
          t('login.error.invalid') ||
            'Invalid email or password. Please check your credentials.',
        );
      } else if (err?.response?.status === 403) {
        setError('This account is disabled or inactive. Please contact your administrator.');
      } else {
        const rawMsg =
          axios.isAxiosError(err) && err.response?.data?.error?.message
            ? err.response.data.error.message
            : null;

        if (
          rawMsg &&
          typeof rawMsg === 'string' &&
          !rawMsg.includes('Prisma') &&
          !rawMsg.includes('TypeError') &&
          !rawMsg.includes('Exception')
        ) {
          setError(rawMsg);
        } else {
          setError(
            t('login.error.network') ||
              'Unable to sign in right now. Please check your connection and try again.',
          );
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await handleLogin();
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    setInfoMessage(
      'To reset your password, please contact your Norynt CRM administrator or IT support.'
    );
  }

  function handleNeedHelp(e: React.MouseEvent) {
    e.preventDefault();
    setInfoMessage(
      'Need assistance? Reach out to your CRM workspace administrator or contact support@norynt.app.'
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.heading}>
        <span className={styles.kicker}><Lock size={12} aria-hidden="true" /> YOUR WORKSPACE AWAITS</span>
        <h1>Welcome back<span>.</span></h1>
        <p>Sign in and pick up where you left off.</p>
      </div>
      <form onSubmit={onSubmit} className={styles.form} noValidate aria-busy={busy}>
        <div className={styles.field}>
          <label htmlFor="login-email">Work email</label>
          <div className={styles.inputWrap}>
            <Mail size={18} className={styles.icon} aria-hidden="true" />
            <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@company.com"
              value={email} required disabled={busy} aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); if (error) setError(null); }} />
          </div>
          {emailError && <p id="email-error" role="alert" className={styles.fieldError}><AlertCircle size={13} aria-hidden="true" />{emailError}</p>}
        </div>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="login-password">Password</label>
            <button type="button" onClick={handleForgotPassword} className={styles.textButton}>Forgot password?</button>
          </div>
          <div className={styles.inputWrap}>
            <Lock size={18} className={styles.icon} aria-hidden="true" />
            <input id="login-password" name="password" type={showPassword ? 'text' : 'password'}
              autoComplete="current-password" placeholder="Enter your password"
              value={password} required disabled={busy} aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); if (error) setError(null); }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}
              disabled={busy} className={styles.passwordToggle}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && <p id="password-error" role="alert" className={styles.fieldError}><AlertCircle size={13} aria-hidden="true" />{passwordError}</p>}
        </div>
        <label className={styles.remember}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={busy} />
          <span>Remember my email</span>
        </label>
        {infoMessage && <div className={styles.info} role="status"><Info size={17} aria-hidden="true" /><p>{infoMessage}</p></div>}
        {error && <div className={styles.error} role="alert"><AlertCircle size={17} aria-hidden="true" /><p>{error}</p></div>}
        <button type="submit" disabled={busy} className={styles.submit}>
          {busy ? <><Loader2 size={18} className={styles.spinner} aria-hidden="true" /><span>Signing in...</span></>
            : <><span>Sign in to workspace</span><ArrowRight size={18} aria-hidden="true" /></>}
        </button>
      </form>
      <div className={styles.cardFooter}>
        <span>Having trouble signing in?</span>
        <button type="button" onClick={handleNeedHelp} className={styles.textButton}>Get help <ArrowRight size={13} aria-hidden="true" /></button>
      </div>
    </div>
  );
}
