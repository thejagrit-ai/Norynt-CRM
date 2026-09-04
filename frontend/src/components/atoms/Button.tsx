// src/components/atoms/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
type Size = 'sm' | 'md' | 'lg';

const styles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-brand-500/20 hover:shadow-glow hover:-translate-y-0.5 border border-brand-400/30 active:scale-[0.98]',
  secondary:
    'bg-slate-800/90 text-slate-200 border border-slate-700/80 hover:bg-slate-700/90 hover:text-white shadow-sm hover:-translate-y-0.5 active:scale-[0.98]',
  outline:
    'bg-transparent text-slate-300 border border-slate-700 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-300 active:scale-[0.98]',
  ghost:
    'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/20 hover:shadow-glow-rose hover:-translate-y-0.5 border border-rose-400/30 active:scale-[0.98]',
  glass:
    'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 hover:border-white/30 shadow-glass active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium gap-1.5',
  md: 'px-4 py-2 text-sm font-medium gap-2',
  lg: 'px-5 py-2.5 text-base font-semibold gap-2.5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  tone?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant,
  tone = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  children,
  ...rest
}: Props) {
  const activeVariant = variant || tone || 'primary';

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${styles[activeVariant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
