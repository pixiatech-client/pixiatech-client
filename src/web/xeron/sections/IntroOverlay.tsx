'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../xeron-hooks';

/**
 * Page-load intro overlay that mirrors xeron.co's fixed black layer.
 * Draws an igniting pixel-field on a canvas, then fades the overlay away.
 */
export function IntroOverlay() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => setDone(true), 250);
      return () => clearTimeout(t);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let start = 0;
    const DURATION = 2100;

    const draw = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / DURATION);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);

      const cols = 24;
      const rows = Math.max(10, Math.round((h / w) * 24));
      const cw = w / cols;
      const ch = h / rows;

      // pixels ignite from an expanding ring
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const cx = i + 0.5;
          const cy = j + 0.5;
          const dist = Math.hypot((cx - cols / 2) / cols, (cy - rows / 2) / rows) * 2;
          const ignite = Math.max(0, Math.min(1, (t * 1.35 - dist) * 2.4));
          if (ignite <= 0) continue;
          const flicker = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now / 90 + dist * 40));
          const alpha = ignite * flicker;
          const size = cw * (0.28 + 0.5 * ignite);
          ctx.fillStyle = `rgba(195,249,16,${(alpha * 0.75).toFixed(3)})`;
          ctx.fillRect(cx * cw - size / 2, cy * ch - size / 2, size, size);
          ctx.fillStyle = `rgba(245,244,240,${(alpha * 0.55).toFixed(3)})`;
          ctx.fillRect(cx * cw - size / 4, cy * ch - size / 4, size / 2, size / 2);
        }
      }

      if (t < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        setDone(true);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <div
      className="intro-overlay"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: '#050505',
        pointerEvents: 'none',
        opacity: done ? 0 : 1,
        transition: 'opacity .8s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        width={reduced ? 0 : 1920}
        height={reduced ? 0 : 1080}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
