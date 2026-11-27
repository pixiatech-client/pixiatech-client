'use client';

import { useCallback, useEffect, useState } from 'react';
import { PixiaLogoStage } from './PixiaLogoStage';

const STORAGE_KEY = 'pixiatech-intro';

/**
 * Overlay plein écran du site : montre la scène architecturale une fois par
 * visiteur, puis se retire en fondu sans toucher aux timings de l'animation.
 */
export function PixiaLogoStageOverlay() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      let seen = false;
      try {
        seen = localStorage.getItem(STORAGE_KEY) === '1';
      } catch {}
      const hasHash = window.location.hash.length > 1;
      setVisible(!seen && !hasHash);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setLeaving(true);
    window.dispatchEvent(new Event('pixiatech-intro-done'));
    window.setTimeout(() => setVisible(false), 520);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black transition-opacity duration-500 ease-out"
      style={{ opacity: leaving ? 0 : 1 }}
      aria-hidden={leaving}
    >
      <PixiaLogoStage onComplete={handleComplete} />
    </div>
  );
}
