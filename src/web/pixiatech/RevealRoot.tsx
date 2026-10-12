'use client';

import { useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion, useRevealObserver } from '../pixiatech-hooks';
import { useCms } from '@/lib/site-web/cms-context';

/**
 * Root wrapper that observes every `[data-reveal="true"]` descendant and
 * toggles `.is-revealed` as it scrolls into view. Falls back to immediate
 * reveal under prefers-reduced-motion or when the CMS editor is active.
 */
export function RevealRoot({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const { isEditing } = useCms();

  useRevealObserver(rootRef, { immediate: reduced || isEditing, trigger: isEditing });

  return (
    <div ref={rootRef} className={className} style={style}>
      {children}
    </div>
  );
}
