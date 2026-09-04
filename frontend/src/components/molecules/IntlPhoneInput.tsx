'use client';
// src/components/molecules/IntlPhoneInput.tsx — refined international phone input with flag picker and light/dark theme.
import React, { useMemo } from 'react';
import { COUNTRIES, findCountry, splitE164, toE164 } from '@/lib/countries';

export function IntlPhoneInput({
  value,
  onChange,
  defaultCountry = 'IN',
  required,
  placeholder,
  invalid,
  id,
}: {
  value: string;
  onChange: (e164: string) => void;
  defaultCountry?: string;
  required?: boolean;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}) {
  const parts = useMemo(
    () => splitE164(value, defaultCountry),
    [value, defaultCountry],
  );
  const country = findCountry(parts.iso2);

  const setCountry = (iso2: string) => {
    const c = findCountry(iso2);
    onChange(toE164(c.dial, parts.national));
  };
  const setNational = (national: string) => {
    onChange(toE164(country.dial, national));
  };

  const border = invalid
    ? '!border-rose-500/80 focus-within:!ring-rose-500/20'
    : 'border-slate-200 dark:border-slate-700/80 focus-within:border-brand-500 focus-within:ring-brand-500/20';

  return (
    <div className={`flex items-stretch gap-2`}>
      <select
        aria-label="country"
        value={country.iso2}
        onChange={(e) => setCountry(e.target.value)}
        className={`w-32 shrink-0 rounded-xl border ${border} bg-slate-50 px-2.5 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-950/80 dark:text-slate-200`}
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso2} value={c.iso2} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-200">
            {c.flag} +{c.dial} ({c.name})
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        required={required}
        placeholder={placeholder ?? '98765 43210'}
        value={parts.national}
        onChange={(e) => setNational(e.target.value)}
        className={`w-full rounded-xl border ${border} bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-950/90`}
      />
    </div>
  );
}
