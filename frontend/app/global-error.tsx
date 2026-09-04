'use client';
// app/global-error.tsx — Root-level global error boundary.
import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100 font-sans">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 mb-4">
            <AlertOctagon className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">System Error</h1>
          <p className="mt-2 text-xs text-slate-400">
            A critical error occurred while loading the application.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-brand-500"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
