// src/components/molecules/FormField.tsx — Flexible form field wrapper with support for both self-contained inputs and custom children.
import React, { InputHTMLAttributes, ReactNode } from 'react';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children?: ReactNode;
}

export function FormField({
  label,
  id,
  error,
  hint,
  required,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
      {children ? (
        children
      ) : (
        <Input
          id={id}
          className={`${error ? '!border-rose-500/80 !focus:ring-rose-500/20' : ''} ${className}`}
          {...rest}
        />
      )}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="text-[11px] font-medium text-rose-400">{error}</p>}
    </div>
  );
}
