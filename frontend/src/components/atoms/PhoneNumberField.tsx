'use client';
// src/components/atoms/PhoneNumberField.tsx — International Phone Input with Light/Dark Mode.
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import { Label } from './Label';

export function PhoneNumberField({
  id,
  label,
  value,
  onChange,
  defaultCountry = 'IN',
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: any;
}) {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 shadow-sm transition-all duration-200 focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700/80 dark:bg-slate-950/60 dark:focus-within:bg-slate-950/90">
        <PhoneInput
          id={id}
          international
          defaultCountry={defaultCountry}
          value={value || undefined}
          onChange={(v) => onChange(v ?? '')}
          numberInputProps={{
            className:
              'w-full border-0 bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500',
          }}
        />
      </div>
    </div>
  );
}
