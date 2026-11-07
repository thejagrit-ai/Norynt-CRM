'use client';
import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Board2D } from './Board2D';
import styles from './auth.module.css';

const Scene3D = dynamic(() => import('./PipelineScene3D'), {
  ssr: false,
  loading: () => <div className={styles.scene} aria-hidden="true" />,
});

/** 3D pipeline scene on desktop; flat board if WebGL is unavailable. Skipped entirely on small screens. */
export function PipelineBoard() {
  const [mode, setMode] = useState<'pending' | '3d' | '2d' | 'none'>('pending');

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 981px)').matches;
    setMode(wide ? '3d' : 'none');
  }, []);

  const fallback = useCallback(() => setMode('2d'), []);

  if (mode === '3d') return <Scene3D onUnsupported={fallback} />;
  if (mode === '2d') return <div aria-hidden="true"><Board2D /></div>;
  return <div className={styles.scene} aria-hidden="true" style={mode === 'none' ? { display: 'none' } : undefined} />;
}
