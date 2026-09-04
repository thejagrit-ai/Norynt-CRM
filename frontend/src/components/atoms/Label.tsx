// src/components/atoms/Label.tsx
import React, { LabelHTMLAttributes } from 'react';

export function Label({
  className = '',
  children,
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}
