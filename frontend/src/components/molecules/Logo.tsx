'use client';
// Shared product wordmark with an optional administrator-managed override.
import React from 'react';
import { useBranding } from '@/lib/branding';

export function Logo({
  size = 32,
  textClass = 'text-base text-white font-bold tracking-tight',
}: {
  size?: number;
  textClass?: string;
}) {
  const { data } = useBranding();
  const name = data?.appName || 'Norynt CRM';

  if (data?.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={data.logo}
        alt={name}
        style={{ height: size, width: 'auto' }}
        className="block max-w-[180px] object-contain transition-transform duration-200 hover:scale-[1.02]"
      />
    );
  }

  return (
    <span className="norynt-brand inline-flex max-w-full items-center gap-2.5">
      <span className="norynt-brand__mark" style={{ height: size, width: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/norynt-crm-mark.png" alt={name} className="h-full w-full object-contain" />
        <span className="norynt-brand__glint" />
      </span>
      <span className={`norynt-brand__copy flex flex-col leading-none ${textClass}`}>
        <span className="norynt-brand__name" style={{ fontSize: Math.max(13, Math.round(size * 0.54)) }}>
          Norynt
        </span>
        <span
          className="norynt-brand__subline mt-1 font-semibold tracking-[0.28em] text-brand-300"
          style={{ fontSize: Math.max(8, Math.round(size * 0.24)) }}
        >
          CRM
        </span>
      </span>
    </span>
  );
}
