'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Already signed in: go straight to the workspace.
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  return (
    <AuthShell switchText="New to Norynt?" switchLabel="Create an account" switchHref="/register">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
