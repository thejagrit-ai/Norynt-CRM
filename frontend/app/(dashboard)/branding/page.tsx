'use client';
// app/(dashboard)/branding/page.tsx — Redirected to Master Settings Hub.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BrandingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings');
  }, [router]);
  return null;
}
