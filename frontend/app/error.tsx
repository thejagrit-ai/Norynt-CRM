'use client';
// app/error.tsx — Resilient error boundary preserving layout and branding.
import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/10 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {error.message || 'An unexpected rendering error occurred. The application state has been preserved.'}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-brand-500"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          <span>Go to Command Center</span>
        </Link>
      </div>
    </div>
  );
}
