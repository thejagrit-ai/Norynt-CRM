'use client';
// src/components/atoms/LoginBackground.tsx — Cinematic video background with fallback and reduced motion safety.

import React, { useEffect, useRef, useState } from 'react';

export function LoginBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Detect prefers-reduced-motion preference dynamically
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {reducedMotion ? (
        /* Ambient fallback gradient when motion reduction is requested */
        <div className="absolute inset-0 bg-slate-950 bg-gradient-to-br from-slate-950 via-indigo-950/40 to-purple-950/40" />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-85"
          >
            <source src="/videos/login-background.mp4" type="video/mp4" />
          </video>
          {/* Subtle color overlay to maximize card contrast & readability */}
          <div className="absolute inset-0 bg-slate-950/50 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
        </>
      )}
    </div>
  );
}
