'use client';

import React, { useEffect, useRef } from 'react';

export function OrbCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    let isMounted = true;

    // Check for prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    import('webgl-fluid')
      .then((mod) => {
        if (!isMounted || !canvasRef.current) return;
        const WebGLFluid = (mod.default || mod) as (
          canvas: HTMLCanvasElement,
          options?: Record<string, unknown>
        ) => void;

        try {
          // Exact configuration from helloshivam.com
          WebGLFluid(canvasRef.current, {
            IMMEDIATE: true,
            TRIGGER: 'hover',
            SIM_RESOLUTION: 128,
            DYE_RESOLUTION: 512,
            CAPTURE_RESOLUTION: 512,
            DENSITY_DISSIPATION: 2.5,
            VELOCITY_DISSIPATION: 0.8,
            PRESSURE: 0.8,
            PRESSURE_ITERATIONS: 20,
            CURL: 0,
            SPLAT_RADIUS: 0.25,
            SPLAT_FORCE: 3000,
            SHADING: true,
            COLORFUL: true,
            COLOR_UPDATE_SPEED: 10,
            PAUSED: false,
            BACK_COLOR: { r: 0, g: 0, b: 0 },
            TRANSPARENT: false,
            BLOOM: true,
            BLOOM_ITERATIONS: 8,
            BLOOM_RESOLUTION: 256,
            BLOOM_INTENSITY: 0.8,
            BLOOM_THRESHOLD: 0.6,
            BLOOM_SOFT_KNEE: 0.7,
            SUNRAYS: true,
            SUNRAYS_RESOLUTION: 196,
            SUNRAYS_WEIGHT: 1,
          });
        } catch (err) {
          console.warn('[WebGLFluid] Init error:', err);
        }
      })
      .catch((err) => {
        console.warn('[WebGLFluid] Failed to load module:', err);
      });

    // Forward mousemove events from parent footer container to canvas when hovering over
    // links or buttons so the fluid doesn't stop when cursor is over text.
    const forwardPointer = (e: MouseEvent) => {
      const c = canvasRef.current;
      if (!c || e.target === c) return;
      const rect = c.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      try {
        const evt = new MouseEvent('mousemove', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: false,
          cancelable: true,
        });
        Object.defineProperty(evt, 'offsetX', { get: () => offsetX, configurable: true });
        Object.defineProperty(evt, 'offsetY', { get: () => offsetY, configurable: true });
        c.dispatchEvent(evt);
      } catch {
        // Fallback
      }
    };

    const forwardMouseDown = (e: MouseEvent) => {
      const c = canvasRef.current;
      if (!c || e.target === c) return;
      const rect = c.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      try {
        const evt = new MouseEvent('mousedown', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: false,
          cancelable: true,
        });
        Object.defineProperty(evt, 'offsetX', { get: () => offsetX, configurable: true });
        Object.defineProperty(evt, 'offsetY', { get: () => offsetY, configurable: true });
        c.dispatchEvent(evt);
      } catch {
        // Fallback
      }
    };

    parent.addEventListener('mousemove', forwardPointer, { passive: true });
    parent.addEventListener('mousedown', forwardMouseDown, { passive: true });

    return () => {
      isMounted = false;
      parent.removeEventListener('mousemove', forwardPointer);
      parent.removeEventListener('mousedown', forwardMouseDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'auto',
      }}
    />
  );
}
