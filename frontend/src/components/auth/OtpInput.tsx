'use client';
import React, { useEffect, useRef } from 'react';
import styles from './auth.module.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Called once all 6 digits are present. */
  onComplete?: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
}

const LEN = 6;

/** Six single-digit boxes with paste, backspace and arrow-key support. */
export function OtpInput({ value, onChange, onComplete, invalid, disabled, autoFocus, describedBy }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function commit(next: string, focusIndex?: number) {
    const clean = next.replace(/\D/g, '').slice(0, LEN);
    onChange(clean);
    if (focusIndex !== undefined) refs.current[Math.min(focusIndex, LEN - 1)]?.focus();
    if (clean.length === LEN) onComplete?.(clean);
  }

  function onInput(i: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    // Typing (1 digit) replaces the box; autofill / paste (many digits) fills forward.
    const chars = value.padEnd(LEN, ' ').split('');
    digits.split('').forEach((d, k) => {
      if (i + k < LEN) chars[i + k] = d;
    });
    commit(chars.join('').replace(/ /g, ''), i + digits.length);
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) commit(value.slice(0, i) + value.slice(i + 1), i);
      else if (i > 0) commit(value.slice(0, i - 1) + value.slice(i), i - 1);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < LEN - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <div className={styles.otp} role="group" aria-label="6-digit verification code">
      {Array.from({ length: LEN }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={styles.otpBox}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={LEN}
          value={value[i] ?? ''}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${LEN}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            if (text) commit(text, text.replace(/\D/g, '').length);
          }}
        />
      ))}
    </div>
  );
}
