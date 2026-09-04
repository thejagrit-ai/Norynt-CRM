'use client';
// src/components/organisms/LoginForm.tsx
// Substantial, Premium Enterprise SaaS authentication card for Norynt CRM.
// Features expanded scale, robust typography hierarchy, 52px inputs, brand gradients,
// functional eye password reveal, OAuth SSO helpers, and trust credentials.

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const LS_REMEMBER_KEY = 'norynt_crm_remember_email';

// High-fidelity Google SVG Icon
const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

// High-fidelity Microsoft SVG Icon
const MicrosoftIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 23 23" fill="currentColor" aria-hidden="true">
    <rect x="0" y="0" width="11" height="11" fill="#F25022" />
    <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
    <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
    <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
  </svg>
);

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
      'To reset your password, please contact your Norynt CRM administrator or IT support team.'
    );
  }

  function handleOAuthClick(provider: string) {
    setInfoMessage(
      `${provider} Single Sign-On is managed through your organization's identity provider. Please sign in using your standard credentials or contact IT support.`
    );
  }

  return (
    <div className="relative w-full max-w-[480px] sm:max-w-[510px] rounded-[24px] bg-white dark:bg-[#0e1626] p-8 sm:p-11 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200/90 dark:border-slate-800/90 transition-all">
      
      {/* Subtle Top Ambient Edge Highlight */}
      <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

      {/* 1. Norynt Branding Header */}
      <div className="flex flex-col items-center text-center">
        {/* Norynt Logo Mark */}
        <div className="flex h-15 w-15 items-center justify-center rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/90 p-2.5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 mb-2.5 transition-transform hover:scale-105">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/norynt-crm-mark.png"
            alt="Norynt"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Norynt Wordmark & CRM Module Tag */}
        <div className="flex flex-col items-center leading-none">
          <span className="text-[22px] sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Norynt
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-brand-600 dark:text-brand-400 mt-1">
            CRM
          </span>
        </div>

        {/* Welcome Back & Extended Supporting Context */}
        <h1 className="mt-6 text-2xl sm:text-[27px] font-bold text-slate-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          Sign in to your Norynt CRM account
        </p>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          Access your workspace and manage your customer relationships.
        </p>
      </div>

      {/* 2. Main Substantial Authentication Form */}
      <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
        {/* Email Address Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-[13px] font-semibold text-slate-700 dark:text-slate-200"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="admin@crm.dev"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
                if (error) setError(null);
              }}
              required
              disabled={busy}
              className={`w-full h-[52px] rounded-xl border py-2.5 pl-12 pr-4 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${
                emailError
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-brand-500/15'
              }`}
            />
          </div>
          {emailError && (
            <p className="text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-[13px] font-semibold text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 dark:text-slate-500">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="•••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (error) setError(null);
              }}
              required
              disabled={busy}
              className={`w-full h-[52px] rounded-xl border py-2.5 pl-12 pr-12 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${
                passwordError
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-brand-500/15'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={busy}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {passwordError && (
            <p className="text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1.5 mt-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{passwordError}</span>
            </p>
          )}
        </div>

        {/* Remember Me Option */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={busy}
              className="h-4.5 w-4.5 rounded-md border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500/20 transition cursor-pointer"
            />
            <span className="text-[13px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition font-medium">
              Remember me
            </span>
          </label>
        </div>

        {/* Informational Message Banner */}
        {infoMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 p-3.5 text-xs text-sky-700 dark:text-sky-300 animate-slide-down">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-sky-500" />
            <div className="leading-relaxed">{infoMessage}</div>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400 animate-slide-down">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Substantial Sign In Button */}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-[52px] rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:via-indigo-500 hover:to-brand-600 active:scale-[0.99] font-semibold text-[15px] text-white shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2.5"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* 3. Divider: Or Continue With */}
      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <span className="relative bg-white dark:bg-[#0e1626] px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
          or continue with
        </span>
      </div>

      {/* 4. Secondary Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3.5 select-none">
        <button
          type="button"
          onClick={() => handleOAuthClick('Google')}
          disabled={busy}
          className="h-[48px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer disabled:opacity-60"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthClick('Microsoft')}
          disabled={busy}
          className="h-[48px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer disabled:opacity-60"
        >
          <MicrosoftIcon />
          <span>Microsoft</span>
        </button>
      </div>

      {/* 5. Enterprise Security Trust Indicator */}
      <div className="mt-7 flex items-center gap-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 p-3 select-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div className="text-left leading-tight">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Enterprise-grade security
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Your data is protected with secure authentication.
          </div>
        </div>
      </div>
    </div>
  );
}
