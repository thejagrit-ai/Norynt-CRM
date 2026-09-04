'use client';
// app/login/page.tsx — Executive Split-Screen Authentication Experience for Norynt CRM.
// - Left Panel: High-Impact Dark Enterprise Showcase with CRM analytics dashboards & value propositions.
// - Right Panel: Clean, modern authentication area with centered login card and footer.

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/organisms/LoginForm';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Instant redirect if user already has an active session
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 selection:bg-brand-500/20 selection:text-brand-900 dark:selection:text-brand-100">
      
      {/* ========================================================================= */}
      {/* 1. LEFT PANEL: Executive CRM Showcase Banner (Desktop Only)               */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:block lg:w-[50%] xl:w-[52%] min-h-screen overflow-hidden bg-[#060d1c] select-none">
        {/* Crisp HQ Executive Showcase Banner with the Real Norynt Mark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-hero-banner-hq.png"
          alt="Norynt CRM Platform"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT PANEL: Polished Authentication Experience                        */}
      {/* ========================================================================= */}
      <div className="relative flex-1 min-h-screen flex flex-col justify-between items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 bg-[#f8fafc] dark:bg-[#070b12] overflow-x-hidden">
        
        {/* Subtle Ambient Radial Lighting Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
          <div className="absolute -top-20 -left-20 w-[340px] h-[340px] bg-sky-200/40 dark:bg-sky-950/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-[360px] h-[360px] bg-indigo-200/35 dark:bg-indigo-950/20 blur-3xl rounded-full" />
        </div>

        {/* Top spacer for clean vertical centering */}
        <div className="h-2 sm:h-4 w-full shrink-0" aria-hidden="true" />

        {/* Main Centered Login Card */}
        <main className="relative z-10 my-auto flex w-full items-center justify-center py-6 sm:py-8 animate-fade-in">
          <LoginForm />
        </main>

        {/* Clean Split Footer */}
        <footer className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 pb-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 select-none shrink-0 border-t border-slate-200/60 dark:border-slate-800/60">
          <div>
            <span>© 2026 Norynt CRM. All rights reserved.</span>
          </div>
          <div>
            <span>Developed by </span>
            <a
              href="https://www.norynt.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400 transition-colors underline-offset-2 hover:underline"
            >
              Norynt
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
