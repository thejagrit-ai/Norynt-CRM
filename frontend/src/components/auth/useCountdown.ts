'use client';
import { useCallback, useEffect, useState } from 'react';

/** Counts down from `start` seconds; call restart() to begin again. */
export function useCountdown(start = 0) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const restart = useCallback((s = 60) => setLeft(s), []);
  return { left, restart };
}
