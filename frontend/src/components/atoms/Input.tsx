// src/components/atoms/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  children?: never;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className = '', children, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-950/90 ${className}`}
        {...rest}
      />
    );
  },
);
