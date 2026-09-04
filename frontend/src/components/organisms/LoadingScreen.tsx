'use client';
// src/components/organisms/LoadingScreen.tsx — Professional Enterprise Global Loader.
// Minimalist, high-performance, elegant circular dual-track spinner without tacky logos or orbital clutter.
import React from 'react';

export function LoadingScreen({
  label = 'Loading workspace...',
  fullScreen = true,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        fullScreen
          ? 'fixed inset-0 z-[9999] h-screen w-screen bg-slate-50/80 dark:bg-slate-950/90 backdrop-blur-md transition-colors'
          : 'h-full w-full py-12'
      }`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* Subtle background ambient light */}
      <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/15" />

      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Professional Dual-Ring Spinner */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          {/* Track Ring */}
          <div className="absolute h-12 w-12 rounded-full border-[3px] border-slate-200/80 dark:border-slate-800/80" />
          
          {/* Animated Gradient Active Ring */}
          <div className="absolute h-12 w-12 animate-spin rounded-full border-[3px] border-transparent border-t-brand-600 border-r-indigo-500 dark:border-t-brand-500 dark:border-r-indigo-400 [animation-duration:0.8s]" />
          
          {/* Inner Pulsing Core */}
          <div className="h-2 w-2 animate-pulse rounded-full bg-brand-600 dark:bg-brand-400" />
        </div>

        {/* Minimal Typography */}
        {label && (
          <p className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 animate-pulse">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
