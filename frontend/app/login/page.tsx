'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/organisms/LoginForm';
import { FloatingPaths } from '@/components/atoms/FloatingPaths';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <main className="norynt-login grid min-h-screen w-full overflow-x-hidden bg-[#f5f7fb] text-slate-950 selection:bg-indigo-200 lg:fixed lg:inset-0 lg:h-screen lg:min-h-0 lg:grid-cols-[1.08fr_0.92fr] lg:overflow-hidden dark:bg-[#070b12] dark:text-white">
      <section className="login-showcase relative hidden h-full overflow-hidden border-r border-white/10 bg-[#080d1a] p-12 text-white lg:flex lg:flex-col xl:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(99,102,241,0.32),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(14,165,233,0.18),transparent_34%)]" />
        <div className="absolute inset-0 text-indigo-300/80">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-[#080d1a]/30" />

        <div className="relative z-10 flex items-center gap-3 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/10 p-2 shadow-lg shadow-indigo-950/40 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/norynt-crm-mark.png" alt="Norynt" className="h-full w-full object-contain" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-white">NORYNT</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-300">CRM</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-2xl py-10">
          <span className="inline-flex rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200 backdrop-blur">
            Revenue command center
          </span>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-7xl">
            Build relationships.<br />Close with clarity.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
            Keep your pipeline, customers, conversations, and revenue moving together in one focused workspace.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <p className="text-2xl font-semibold text-white">360°</p>
              <p className="mt-1 text-xs text-slate-400">Customer view</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <p className="text-2xl font-semibold text-white">Live</p>
              <p className="mt-1 text-xs text-slate-400">Sales pipeline</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <p className="text-2xl font-semibold text-white">One</p>
              <p className="mt-1 text-xs text-slate-400">Focused workspace</p>
            </div>
          </div>
        </div>

        <blockquote className="relative z-10 max-w-lg border-l-2 border-indigo-400 pl-5 text-sm leading-6 text-slate-300">
          “Norynt gives our team the context to move faster and serve every customer better.”
          <footer className="mt-2 font-mono text-xs font-semibold text-white">— Sales Operations</footer>
        </blockquote>
      </section>

      <section className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden overflow-y-auto px-5 py-6 sm:px-10 lg:h-full lg:min-h-0 lg:overflow-y-hidden lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <div className="absolute -right-32 -top-56 h-[680px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_68%)]" />
          <div className="absolute -bottom-52 -left-32 h-[600px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.09),transparent_68%)]" />
        </div>

        <div className="relative z-10 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/norynt-crm-mark.png" alt="Norynt" className="h-7 w-7 object-contain" />
          <span className="font-bold tracking-tight">NORYNT CRM</span>
          </div>
          <button type="button" onClick={() => router.push('/')} aria-label="Back to home" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200/70">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="relative z-10 my-auto flex w-full items-center justify-center py-8">
          <LoginForm />
        </div>

        <footer className="relative z-10 flex w-full flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[11px] text-slate-500 sm:flex-row dark:border-slate-800/70 dark:text-slate-400">
          <span>© 2026 Norynt CRM. All rights reserved.</span>
          <span>
            Developed by{' '}
            <a href="https://www.norynt.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-800 underline-offset-2 transition-colors hover:text-indigo-600 hover:underline dark:text-slate-200">
              Norynt
            </a>
          </span>
        </footer>
      </section>
    </main>
  );
}
