'use client';
// app/login/page.tsx — Polished Enterprise SaaS Authentication Experience for Norynt CRM.
// Features a rich static ambient background with subtle pattern grid, ambient lighting,
// contextual enterprise accents, and a prominently scaled centered login card.

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, BarChart3, Users, Zap, CheckCircle2 } from 'lucide-react';
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
    <div className="relative flex min-h-screen w-full flex-col justify-between items-center overflow-x-hidden bg-[#f8fafc] dark:bg-[#070b12] text-slate-900 dark:text-slate-100 selection:bg-brand-500/20 selection:text-brand-900 dark:selection:text-brand-100 px-4 py-8 sm:px-6 sm:py-10">
      
      {/* 1. Subtle Enterprise Static Grid Background */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(#6366f1 0.75px, transparent 0.75px), radial-gradient(#94a3b8 0.75px, #f8fafc 0.75px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* 2. Soft Ambient Gradient Aura & Lighting (Static, no video, no moving particles) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Top ambient glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-indigo-200/45 via-brand-100/25 to-transparent dark:from-brand-950/40 dark:via-indigo-950/20 dark:to-transparent blur-3xl rounded-full opacity-80" />
        
        {/* Central warm backlight directly behind the login card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] bg-gradient-to-tr from-brand-100/35 via-sky-100/30 to-purple-100/30 dark:from-brand-950/20 dark:via-sky-950/15 dark:to-purple-950/15 blur-3xl rounded-full opacity-70" />

        {/* Bottom subtle accent glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-slate-200/30 via-indigo-50/20 to-transparent dark:from-slate-900/30 dark:to-transparent blur-3xl rounded-full opacity-60" />
      </div>

      {/* 3. Tasteful Ambient CRM Context Elements (Desktop only, faint decorative depth) */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block overflow-hidden select-none" aria-hidden="true">
        {/* Top-Left Ambient Pill */}
        <div className="absolute top-[18%] left-[8%] xl:left-[12%] flex items-center gap-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 px-4 py-2.5 shadow-sm backdrop-blur-md opacity-75">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">360° Lead Intelligence</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Enterprise Relationship Hub</div>
          </div>
        </div>

        {/* Top-Right Ambient Pill */}
        <div className="absolute top-[22%] right-[8%] xl:right-[12%] flex items-center gap-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 px-4 py-2.5 shadow-sm backdrop-blur-md opacity-75">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">Real-Time Pipeline Analytics</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Predictive Revenue Growth</div>
          </div>
        </div>

        {/* Bottom-Left Ambient Pill */}
        <div className="absolute bottom-[20%] left-[9%] xl:left-[13%] flex items-center gap-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 px-4 py-2.5 shadow-sm backdrop-blur-md opacity-75">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">Automated Workflows</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Multi-Channel WhatsApp & Email</div>
          </div>
        </div>

        {/* Bottom-Right Ambient Pill */}
        <div className="absolute bottom-[18%] right-[9%] xl:right-[13%] flex items-center gap-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 px-4 py-2.5 shadow-sm backdrop-blur-md opacity-75">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">SOC-2 Type II Certified</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Bank-Grade Encryption</div>
          </div>
        </div>
      </div>

      {/* Main Authoritative Centered Login Card */}
      <main className="relative z-10 my-auto flex w-full items-center justify-center py-4 sm:py-6">
        <LoginForm />
      </main>

      {/* Polished Bottom Footer */}
      <footer className="relative z-10 w-full text-center py-3 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 select-none shrink-0">
        <span>Developed by </span>
        <a
          href="https://www.norynt.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-slate-800 hover:text-brand-600 dark:text-slate-200 dark:hover:text-brand-400 transition-colors underline-offset-2 hover:underline"
        >
          Norynt
        </a>
      </footer>
    </div>
  );
}
