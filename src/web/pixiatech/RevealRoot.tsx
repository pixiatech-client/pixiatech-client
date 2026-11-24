'use client';

import { useRef, type ReactNode } from 'react';
import { useRevealObserver } from '../pixiatech-hooks';

/**
 * Root wrapper: every `[data-reveal="true"]` descendant is marked visible on mount.
 * No IntersectionObserver, no scroll-linked reveal. CMS fields and text keys stay untouched.
 */
export function RevealRoot({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useRevealObserver(rootRef, { immediate: true });

  return (
    <div ref={rootRef} className={className} style={style}>
      {children}
    </div>
  );
}
