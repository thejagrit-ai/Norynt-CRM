import React from 'react';
import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from './authUtils';
import styles from './auth.module.css';

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

export function passwordLevel(pw: string): number {
  if (!pw) return 0;
  const passed = PASSWORD_RULES.filter((r) => r.test(pw)).length;
  return passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
}

export function PasswordStrength({ value, id }: { value: string; id: string }) {
  const level = passwordLevel(value);
  return (
    <>
      <div aria-live="polite">
        <div className={styles.meter} data-level={level} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className={styles.meterLabel}>
          <span>{value ? STRENGTH_LABEL[level] : 'Use all five of these:'}</span>
        </div>
      </div>
      <ul id={id} className={styles.rules}>
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.id} className={ok ? styles.met : undefined}>
              {ok ? <Check size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
              {r.label}
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                {ok ? ' (done)' : ' (needed)'}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
