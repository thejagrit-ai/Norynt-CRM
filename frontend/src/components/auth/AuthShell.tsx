import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PipelineBoard } from './PipelineBoard';
import styles from './auth.module.css';

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/login" className={`${styles.brand} ${className ?? ''}`} aria-label="Norynt CRM">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/norynt-crm-mark.png" alt="" width={34} height={34} />
      <span>Norynt CRM</span>
    </Link>
  );
}

/** Brand panel. A div, not an aside: globals.css restyles every `html.light aside` as the dashboard sidebar. */
function Panel() {
  return (
    <div className={styles.panel}>
      <Brand />
      <div className={styles.pitch}>
        <h2>Every lead, deal and follow-up, in one place.</h2>
        <p>Track your pipeline, keep customer history together, and always know what to do next.</p>
        <ul className={styles.points}>
          {['See every deal by stage', 'Keep contacts and notes together', 'Send quotes and invoices'].map((t) => (
            <li key={t}>
              <span><Check size={16} strokeWidth={3} /></span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <PipelineBoard />
    </div>
  );
}

export function AuthShell({
  children,
  switchText,
  switchLabel,
  switchHref,
}: {
  children: React.ReactNode;
  switchText: string;
  switchLabel: string;
  switchHref: string;
}) {
  return (
    <div className={styles.shell}>
      <Panel />
      <main className={styles.main}>
        <Brand className={styles.mobileBrand} />
        <p className={styles.topLink}>
          {switchText}
          <Link href={switchHref}>{switchLabel}</Link>
        </p>
        <div className={styles.formWrap}>{children}</div>
        <p className={styles.foot}>Norynt CRM</p>
      </main>
    </div>
  );
}
