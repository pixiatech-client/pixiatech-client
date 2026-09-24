'use client';

import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../xeron-hooks';

const SPECS = [
  { n: '01', label: 'MOTION UNIT — 248.5 MM', active: true },
  { n: '02', label: 'LINEAR GUIDE RAIL' },
  { n: '03', label: 'MOTION CONTROLLER' },
  { n: '04', label: 'QUICK-LOCK SYSTEM' },
  { n: '05', label: 'DIE-CAST CABINET' },
];

const STATS = [
  { v: '248.5 × 248.5', k: 'MOTION UNIT · MM' },
  { v: '500 × 500', k: 'CABINET · MM' },
  { v: '1.5 mm', k: 'MODULE GAP' },
  { v: 'Quick-Lock', k: 'TOOL-FREE INSTALL' },
  { v: 'Die-Cast', k: 'ALUMINIUM CABINET' },
];

/**
 * 04 / FEATURED — SPKI-250 KINETIC.
 * Interactive kinetic-canvas on the left, cabinet section diagram + spec list
 * on the right, stats band underneath.
 */
export function FeaturedSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let mx = 0.5;
    let my = 0.5;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const root = canvas.parentElement;
    const onMove = (e: MouseEvent) => {
      const rect = (root ?? canvas).getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width;
      my = (e.clientY - rect.top) / rect.height;
    };
    window.addEventListener('mousemove', onMove);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;

      // 3D-ish "depth layers" of LED modules
      const layers = 3;
      const par = mx - 0.5;
      const parY = my - 0.5;
      for (let L = 0; L < layers; L++) {
        const depth = (L - (layers - 1) / 2) * 0.12;
        const offX = par * (10 + L * 9) + Math.sin(t * 0.5 + L) * 4;
        const offY = parY * (6 + L * 6) + Math.cos(t * 0.4 + L) * 4;
        const alpha = 0.34 - L * 0.09;

        // perspective offset for deeper layers
        const scale = 1 - Math.abs(depth) * 0.4;
        const xOff = offX * scale;
        const yOff = offY * scale * 0.6;

        // vertical zig-zag columns of modules in depth
        const cols = 4;
        const rows = 3;
        const gap = Math.min(w, h) * 0.3;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const cellX = w * 0.5 + (c - (cols - 1) / 2) * gap + xOff;
            const cellY = h * 0.5 + (r - (rows - 1) / 2) * gap * 0.7 + yOff;
            const cellW = gap * 0.82 * scale;
            const cellH = gap * 0.62 * scale;
            const zWave = Math.sin(t * 1.2 + c * 1.7 + r * 2.3) * (0.35 + (c % 2)) * 24 * scale;

            // extruded body
            ctx.fillStyle = '#0e0e0d';
            ctx.fillRect(cellX - cellW / 2, cellY - cellH / 2, cellW, cellH);
            ctx.strokeStyle = '#1f1f1f';
            ctx.lineWidth = 1;
            ctx.strokeRect(cellX - cellW / 2, cellY - cellH / 2, cellW, cellH);

            // Z-extrusion
            ctx.strokeStyle = 'rgba(245,244,240,0.08)';
            ctx.beginPath();
            ctx.moveTo(cellX - cellW / 2, cellY - cellH / 2);
            ctx.lineTo(cellX - cellW / 2 - zWave * 0.18, cellY - cellH / 2 - zWave);
            ctx.moveTo(cellX + cellW / 2, cellY - cellH / 2);
            ctx.lineTo(cellX + cellW / 2 - zWave * 0.18, cellY - cellH / 2 - zWave);
            ctx.stroke();

            // pixel grid inside
            const pCols = 6;
            const pRows = 4;
            for (let i = 0; i < pCols; i++) {
              for (let j = 0; j < pRows; j++) {
                const px = cellX - cellW / 2 + (cellW * (i + 0.5)) / pCols - zWave * 0.09;
                const py = cellY - cellH / 2 + (cellH * (j + 0.5)) / pRows - zWave * 0.1;
                const on = Math.sin(i * 3 + j * 5 + t * 2 + c * 2) > 0.1;
                if (!on) continue;
                const s = Math.min(cellW / pCols, cellH / pRows) * 0.55;
                ctx.fillStyle = i % 3 === 0 ? `rgba(195,249,16,${alpha + 0.25})` : `rgba(245,244,240,${alpha + 0.3})`;
                ctx.fillRect(px - s / 2, py - s / 2, s, s);
              }
            }
          }
        }
      }

      // crosshair center mark
      ctx.strokeStyle = 'rgba(245,244,240,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5 - 30);
      ctx.lineTo(w * 0.5, h * 0.5 + 30);
      ctx.moveTo(w * 0.5 - 30, h * 0.5);
      ctx.lineTo(w * 0.5 + 30, h * 0.5);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [reduced]);

  return (
    <section id="featured" className="theme-dark sec-lg" style={{ background: 'var(--black-3)', borderTop: '1px solid var(--dark-line)' }}>
      <div className="wrap">
        <div style={{ fontSize: 11, letterSpacing: '.24em', color: 'var(--dark-muted)', marginBottom: 36 }}>
          04 / FEATURED — SPKI-250 KINETIC
        </div>
        <h2 className="h-featured" style={{ margin: '0 0 70px', lineHeight: 1.02, letterSpacing: '-.025em', maxWidth: 1100 }}>
          The screen moves.
          <br />
          Depth becomes
          <br />
          <span style={{ color: 'var(--muted)' }}>part of the image.</span>
        </h2>

        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: 'clamp(40px,5vw,88px)',
            alignItems: 'start',
          }}
        >
          <div
            className="kin-stage"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#0A0A09',
              border: '1px solid var(--dark-line)',
              height: 'min(64vh,620px)',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
            />
            <div style={{ position: 'absolute', left: 22, bottom: 20, fontSize: 10.5, letterSpacing: '.22em', color: '#7A7A76', pointerEvents: 'none' }}>
              KINETIC LED — MODULES IN MOTION
            </div>
          </div>

          <div>
            {/* Cabinet section diagram */}
            <svg style={{ width: '100%', height: 'auto', display: 'block' }} viewBox="0 0 560 320" fill="none">
              <rect x="150" y="36" width="220" height="130" stroke="#2a2a2a" strokeWidth="1" />
              <line x1="150" y1="166" x2="98" y2="166" stroke="#2a2a2a" />
              <line x1="370" y1="166" x2="470" y2="166" stroke="#2a2a2a" />
              <line x1="98" y1="166" x2="98" y2="220" stroke="#2a2a2a" />
              <line x1="370" y1="166" x2="370" y2="220" stroke="#2a2a2a" />
              <text x="186" y="28" fill="#7A7A76" fontSize="9" letterSpacing="2">
                05 — DIE-CAST CABINET
              </text>
              <text x="300" y="192" fill="#7A7A76" fontSize="9" letterSpacing="2">
                500 × 500 MM
              </text>
              <rect x="196" y="56" width="128" height="90" stroke="#3a3a3a" />
              <line x1="70" y1="130" x2="140" y2="130" stroke="#5A5A56" />
              <line x1="420" y1="130" x2="496" y2="130" stroke="#5A5A56" />
              <circle cx="70" cy="130" r="4" stroke="#5A5A56" />
              <circle cx="496" cy="130" r="4" stroke="#5A5A56" />
              <text x="52" y="116" fill="#7A7A76" fontSize="9" letterSpacing="1.5">
                02
              </text>
              <rect x="226" y="80" width="68" height="42" stroke="#C3F910" />
              <line x1="260" y1="122" x2="260" y2="166" stroke="#3a3a3a" strokeDasharray="3 3" />
              <text x="275" y="144" fill="#7A7A76" fontSize="9" letterSpacing="1.5">
                248.5 MM
              </text>
              <rect x="232" y="86" width="56" height="30" fill="rgba(195,249,16,.12)" />
              <text x="238" y="106" fill="#C3F910" fontSize="8" letterSpacing="1.5">
                03
              </text>
              <circle cx="260" cy="56" r="5" stroke="#3a3a3a" />
              <line x1="260" y1="56" x2="260" y2="76" stroke="#3a3a3a" strokeDasharray="2 2" />
              <text x="272" y="60" fill="#7A7A76" fontSize="9" letterSpacing="1.5">
                01
              </text>
              <line x1="140" y1="130" x2="196" y2="130" stroke="#3a3a3a" strokeDasharray="2 2" />
              <text x="150" y="122" fill="#7A7A76" fontSize="9" letterSpacing="1.5">
                04
              </text>
              <text x="70" y="252" fill="#7A7A76" fontSize="9" letterSpacing="2">
                Z-AXIS TRAVEL — SIDE VIEW
              </text>
              <line x1="70" y1="268" x2="496" y2="268" stroke="#3a3a3a" />
            </svg>

            {/* spec rows */}
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28, borderTop: '1px solid var(--dark-line)' }}>
              {SPECS.map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 18,
                    padding: '15px 4px',
                    borderBottom: '1px solid var(--dark-line)',
                    cursor: 'default',
                  }}
                >
                  <span style={{ fontSize: 11, letterSpacing: '.14em', color: s.active ? '#C3F910' : '#3A3A3A', minWidth: 22 }}>
                    {s.n}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      letterSpacing: '.1em',
                      fontWeight: 600,
                      color: s.active ? '#F5F4F0' : '#5A5A56',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* stats band */}
        <div className="kin-stats" style={{ display: 'grid', gap: 1, background: 'var(--dark-line)', border: '1px solid var(--dark-line)', marginTop: 72, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          {STATS.map((s) => (
            <div key={s.k} style={{ background: 'var(--black-3)', padding: '26px 24px' }}>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{s.v}</div>
              <div style={{ fontSize: 11, letterSpacing: '.2em', color: 'var(--dark-muted)', marginTop: 8 }}>{s.k}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--dark-muted)', marginTop: 16 }}>
          Large-format, lightweight indoor kinetic LED — 4-in-1 motion units on industrial linear guide rails, engineered
          for large-scale and elevated installations.
        </div>
      </div>
    </section>
  );
}