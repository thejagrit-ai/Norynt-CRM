// src/components/atoms/Card.tsx
import React from 'react';

export function Card({
  children,
  className = '',
  hoverable = false,
  glass = false,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glass?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        glass
          ? 'border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:shadow-glass-dark'
          : 'border-slate-200/90 bg-white shadow-card dark:border-slate-800/80 dark:bg-slate-900/90'
      } ${
        hoverable
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-md dark:hover:border-slate-700 dark:hover:shadow-card-hover'
          : ''
      } ${className}`}
    >
      {/* Subtle top inner light highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent dark:via-white/10" />
      {children}
    </div>
  );
}
