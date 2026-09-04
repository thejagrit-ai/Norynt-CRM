// src/components/atoms/Spinner.tsx
import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

export function Spinner({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: SpinnerSize;
}) {
  return (
    <div className="relative inline-flex items-center justify-center" role="status" aria-label="Loading">
      <div
        className={`animate-spin rounded-full border-brand-500/20 border-t-brand-500 ${sizeMap[size]} ${className}`}
      />
      <div
        className={`absolute animate-pulse rounded-full bg-brand-500/10 blur-sm ${sizeMap[size]}`}
      />
    </div>
  );
}
