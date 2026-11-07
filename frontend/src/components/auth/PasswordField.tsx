'use client';
import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import styles from './auth.module.css';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  error?: string | null;
  describedBy?: string;
  disabled?: boolean;
  /** Extra content shown on the label row (e.g. "Forgot password?"). */
  labelAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  autoComplete,
  placeholder,
  error,
  describedBy,
  disabled,
  labelAction,
  children,
}: Props) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const errId = `${id}-error`;
  const described = [error ? errId : null, describedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id}>{label}</label>
        {labelAction}
      </div>
      <div className={styles.inputWrap}>
        <input
          id={id}
          name={id}
          className={`${styles.input} ${styles.hasToggle}`}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setCaps(false);
            onBlur?.();
          }}
          onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          disabled={disabled}
        >
          {show ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
        </button>
      </div>
      {caps && (
        <p className={styles.capsNote} role="status">
          <TriangleAlert size={14} aria-hidden="true" /> Caps Lock is on.
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className={styles.fieldError}>
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {children}
    </div>
  );
}
