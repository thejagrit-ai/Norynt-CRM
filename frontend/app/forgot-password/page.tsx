'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <AuthShell switchText="Remembered it? " switchLabel="Sign in" switchHref="/login">
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
