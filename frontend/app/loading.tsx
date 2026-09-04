'use client';
// app/loading.tsx — Next.js Global Route Suspense Loading Screen.
import { LoadingScreen } from '@/components/organisms/LoadingScreen';

export default function Loading() {
  return <LoadingScreen label="Loading..." />;
}
