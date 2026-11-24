'use client';

import { useEffect, useState } from 'react';

interface PreloaderProps {
  ready: boolean;
  onComplete: () => void;
}

export function Preloader({ ready, onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setProgress(100);
      setExiting(true);
      const t = window.setTimeout(onComplete, 120);
      return () => window.clearTimeout(t);
    }

    let raf = 0;
    const start = performance.now();
    const minDuration = 480;

    const step = (now: number) => {
      const elapsed = now - start;
      const basePct = Math.min(92, (elapsed / minDuration) * 92);
      const targetPct = ready ? Math.min(100, (elapsed / minDuration) * 100) : basePct;

      setProgress(targetPct);

      if (ready && elapsed >= minDuration) {
        setProgress(100);
        setExiting(true);
        window.setTimeout(onComplete, 280);
        return;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ready, onComplete]);

  // 3 segmented capsule bars for Pixiatech preloader
  const barWidths = [
    Math.min(100, Math.max(0, (progress / 33.33) * 100)),
    Math.min(100, Math.max(0, ((progress - 33.33) / 33.33) * 100)),
    Math.min(100, Math.max(0, ((progress - 66.66) / 33.34) * 100)),
  ];

  return (
    <div
      aria-hidden={exiting}
      className={`absolute inset-0 z-20 flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        exiting ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-2" aria-label="Chargement Pixiatech">
        {barWidths.map((fill, idx) => (
          <div
            key={idx}
            className="h-[5px] w-12 overflow-hidden rounded-full bg-white/15"
          >
            <div
              className="h-full rounded-full bg-white transition-[width] duration-75 ease-linear"
              style={{ width: `${fill}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
