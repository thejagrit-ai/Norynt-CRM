'use client';

import { useEffect } from 'react';
import { ArrowUpRight, Layers3, Users, Workflow } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LoginForm } from '@/components/organisms/LoginForm';
import styles from './login.module.css';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.glowOne} />
        <div className={styles.glowTwo} />
        <div className={styles.orbitOne} />
        <div className={styles.orbitTwo} />
      </div>
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="Norynt CRM home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/norynt-crm-mark.png" alt="" width="38" height="38" />
          <span>Norynt<span className={styles.brandTag}>CRM</span></span>
        </a>
      </header>
      <div className={styles.content}>
        <section className={styles.intro} aria-labelledby="login-intro">
          <div className={styles.eyebrow}><span /> A little clarity. A lot of possibility.</div>
          <h2 id="login-intro">Great relationships.<br /><span>Better business.</span></h2>
          <p>Your people, your pipeline, your next big opportunity.<br className={styles.desktopBreak} /> Bring it all together in Norynt.</p>
          <div className={styles.features}>
            <span><Users size={16} /> Customer connections</span>
            <span><Workflow size={16} /> Clearer pipelines</span>
            <span><Layers3 size={16} /> One workspace</span>
          </div>
          <div className={styles.orbitArt} aria-hidden="true">
            <div className={styles.artRing} />
            <div className={styles.artRingInner} />
            <div className={styles.artCore}><Layers3 size={28} strokeWidth={1.5} /></div>
            <span className={styles.artDotOne} />
            <span className={styles.artDotTwo} />
            <span className={styles.artLabel}>Everything, connected.</span>
          </div>
        </section>
        <section className={styles.formArea} aria-label="Sign in to Norynt CRM">
          <LoginForm />
          <p className={styles.accessNote}>New to this workspace? Contact your administrator.</p>
        </section>
      </div>
      <footer className={styles.footer}>
        <span>&copy; {new Date().getFullYear()} Norynt CRM</span>
        <a href="https://www.norynt.app" target="_blank" rel="noopener noreferrer">Made by Norynt <ArrowUpRight size={13} /></a>
      </footer>
    </main>
  );
}
