// src/components/atoms/Badge.tsx
import React from 'react';

const tones: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  gray: {
    bg: 'bg-slate-500/10 dark:bg-slate-400/10',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/20 dark:border-slate-400/20',
    dot: 'bg-slate-400',
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/20 dark:border-emerald-400/20',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/20 dark:border-emerald-400/20',
    dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  },
  red: {
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/20 dark:border-rose-400/20',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/20 dark:border-rose-400/20',
    dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  },
  blue: {
    bg: 'bg-sky-500/10 dark:bg-sky-400/10',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/20 dark:border-sky-400/20',
    dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-400/10',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/20 dark:border-sky-400/20',
    dot: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/20 dark:border-amber-400/20',
    dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  },
  indigo: {
    bg: 'bg-brand-500/10 dark:bg-brand-400/10',
    text: 'text-brand-700 dark:text-brand-300',
    border: 'border-brand-500/20 dark:border-brand-400/20',
    dot: 'bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]',
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/20 dark:border-purple-400/20',
    dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]',
  },
};

const toneAliases: Record<string, string> = {
  success: 'green',
  warning: 'amber',
  danger: 'red',
  error: 'red',
  primary: 'indigo',
  info: 'blue',
  secondary: 'gray',
};

export interface BadgeProps {
  children: React.ReactNode;
  tone?: keyof typeof tones | string;
  variant?: keyof typeof tones | string;
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  tone,
  variant,
  dot = false,
  className = '',
}: BadgeProps) {
  const rawTone = tone || variant || 'gray';
  const resolvedKey = toneAliases[rawTone] || rawTone;
  const currentTone = tones[resolvedKey] || tones.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide backdrop-blur-sm transition-colors ${currentTone.bg} ${currentTone.text} ${currentTone.border} ${className}`}
    >
      {dot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${currentTone.dot}`} />
      )}
      {children}
    </span>
  );
}
