'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function FloatingPaths({ position = 1 }: { position?: 1 | -1 }) {
  const reduceMotion = useReducedMotion();
  const paths = Array.from({ length: 32 }, (_, index) => ({
    id: index,
    d: `M-${380 - index * 5 * position} -${189 + index * 6}C-${380 - index * 5 * position} -${189 + index * 6} -${312 - index * 5 * position} ${216 - index * 6} ${152 - index * 5 * position} ${343 - index * 6}C${616 - index * 5 * position} ${470 - index * 6} ${684 - index * 5 * position} ${875 - index * 6} ${684 - index * 5 * position} ${875 - index * 6}`,
    width: 0.6 + index * 0.035,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" preserveAspectRatio="xMidYMid slice">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.012}
            initial={{ pathLength: 0.25, opacity: 0.35 }}
            animate={reduceMotion ? { pathLength: 1, opacity: 0.4 } : { pathLength: 1, pathOffset: [0, 1, 0], opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 18 + (path.id % 8) * 1.5, repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        ))}
      </svg>
    </div>
  );
}
