'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <AuthShell switchText="Already verified? " switchLabel="Sign in" switchHref="/login">
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
