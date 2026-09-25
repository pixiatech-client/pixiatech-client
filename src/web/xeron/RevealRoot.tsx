'use client';

import { useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion, useRevealObserver } from '../xeron-hooks';

/**
 * Root wrapper that observes every `[data-reveal="true"]` descendant and
 * toggles `.is-revealed` as it scrolls into view. Falls back to immediate
 * reveal under prefers-reduced-motion.
 */
export function RevealRoot({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  useRevealObserver(rootRef, { immediate: reduced });

  return (
    <div ref={rootRef} className={className} style={style}>
      {children}
    </div>
  );
}
