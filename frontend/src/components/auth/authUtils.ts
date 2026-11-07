import axios from 'axios';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_RULES = [
  { id: 'len', label: '10+ characters', test: (v: string) => v.length >= 10 },
  { id: 'lower', label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { id: 'upper', label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'num', label: 'A number', test: (v: string) => /\d/.test(v) },
  { id: 'sym', label: 'A symbol', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase();
}

export function validateEmail(v: string): string | null {
  const e = v.trim();
  if (!e) return 'Enter your work email.';
  if (!EMAIL_RE.test(e)) return 'Enter a valid email, like name@company.com.';
  return null;
}

/** Turns an API failure into a message a person can act on. */
export function describeAuthError(
  err: unknown,
  ctx: 'login' | 'register' | 'otp' | 'reset',
): { message: string; status?: number } {
  if (!axios.isAxiosError(err)) {
    return { message: 'Something went wrong. Please try again.' };
  }
  const status = err.response?.status;
  const data = err.response?.data as
    | { message?: string; code?: string; details?: unknown; error?: { message?: string } }
    | undefined;

  if (!err.response) {
    return {
      message: 'Can’t reach the server. Check your internet connection and try again.',
    };
  }
  if (status === 429) {
    return { status, message: 'Too many attempts. Wait a minute, then try again.' };
  }
  if (ctx === 'login' && status === 401) {
    return { status, message: 'That email and password don’t match. Check both and try again.' };
  }
  if (ctx === 'login' && status === 403) {
    return { status, message: 'Verify your email address to sign in.' };
  }
  if (ctx === 'register' && status === 409) {
    return { status, message: 'An account with this email already exists.' };
  }
  if (status === 400 && Array.isArray(data?.details) && data.details.length) {
    return { status, message: String(data.details[0]) };
  }
  if (status && status >= 500) {
    return { status, message: 'The server hit a problem. Try again in a moment.' };
  }
  const raw = data?.message || data?.error?.message;
  return {
    status,
    message:
      typeof raw === 'string' && raw.length < 160
        ? raw
        : ctx === 'login'
          ? 'Couldn’t sign you in. Try again.'
          : ctx === 'register'
            ? 'Couldn’t create your account. Try again.'
            : 'That didn’t work. Try again.',
  };
}
