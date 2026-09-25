'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../../xeron-translations';
import { usePrefersReducedMotion } from '../../xeron-hooks';
import { useCms } from '@/lib/site-web/cms-context';
import { useSectionStyle } from '../../cms/useSectionStyle';

const PRESETS = [0.7, 0.9, 1.2, 1.5, 1.8, 2.5, 2.9, 3.9, 4.8, 6.6, 10];
const MIN = 0.7;
const MAX = 10;

function pixelsPerM2(pitch: number) {
  const mm = pitch === 0 ? 1 : pitch;
  return Math.round(Math.pow(1000 / mm, 2)).toLocaleString('en-US');
}

interface PitchSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

/**
 * 07 / PIXEL PITCH — interactive pitch slider + simulated LED color spectrum canvas
 * and viewing distance ruler with silhouette icon. Direct mirror of xeron.co.
 */
export const PitchSection: React.FC<PitchSectionProps> = ({
  lang = 'FR',
  onOpenConsultation,
}) => {
  const reduced = usePrefersReducedMotion();
  const [pitch, setPitch] = useState<number>(1.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.pitch as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);

  const t = {
    eyebrow: lang === 'FR' ? '07 / PAS DE PIXEL' : '07 / PIXEL PITCH',
    titleLine1: lang === 'FR' ? 'À quelle distance' : 'How close should',
    titleLine2: lang === 'FR' ? 'devez-vous vous placer ?' : 'you get?',
    desc:
      lang === 'FR'
        ? "Un pas de pixel plus fin → vision rapprochée et densité maximale. Un pas plus large → distances d'observation accrues et grands formats efficients."
        : 'Smaller pixel pitch → closer viewing and higher pixel density. Larger pitch → longer viewing distances and efficient large-format installations.',
    unit: lang === 'FR' ? 'mm pas de pixel' : 'mm pixel pitch',
    pixelsLabel: 'PIXELS / M²',
    typicalLabel: lang === 'FR' ? 'UTILISATION TYPIQUE' : 'TYPICAL USE',
    cta: lang === 'FR' ? 'TROUVER LE BON PAS DE PIXEL →' : 'FIND THE RIGHT PIXEL PITCH →',
    simLabel: lang === 'FR' ? 'SURFACE LED — SIMULATION' : 'LED SURFACE — SIMULATED',
    minViewingLabel: lang === 'FR' ? 'DISTANCE MIN. DE VISION *' : 'MIN. VIEWING DISTANCE *',
    display: lang === 'FR' ? 'ÉCRAN' : 'DISPLAY',
    disclaimer:
      lang === 'FR'
        ? "* Règle d'usage empirique de l'industrie — pour orientation préalable, non contractuelle pour l'ingénierie finale."
        : '* Approximate industry rule of thumb — for product discovery, not final engineering.',
  };

  const getTypicalUse = (p: number) => {
    if (p <= 0.9) return lang === 'FR' ? 'Salle de crise critique' : 'Command center / Studio';
    if (p <= 1.5) return lang === 'FR' ? 'Corporate lobby' : 'Corporate lobby';
    if (p <= 2.5) return lang === 'FR' ? 'Auditorium & Retail luxe' : 'Auditorium & Luxury retail';
    if (p <= 3.9) return lang === 'FR' ? 'DOOH intérieur & Événementiel' : 'Indoor DOOH & Events';
    return lang === 'FR' ? 'Grand format & Façade' : 'Large-format & Stadium';
  };

  // High-fidelity chromatic LED dot matrix simulation (Matches Image 2)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;

    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Compute spacing based on selected pitch
    // 0.7mm -> dense fine grid, 10mm -> sparse chunky dots
    const pitchRatio = (pitch - MIN) / (MAX - MIN); // 0 at 0.7, 1 at 10
    const step = 5 + pitchRatio * 18; // px distance between LEDs on screen
    const dotRadius = Math.max(1.2, step * 0.36);

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, w, h);

    // Draw cabinet seam grid (subtle module divisions)
    const cabinetW = w / 4;
    const cabinetH = h / 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let cx = cabinetW; cx < w; cx += cabinetW) {
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
    }
    for (let cy = cabinetH; cy < h; cy += cabinetH) {
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    }

    // Chromatic spectral field:
    // Bottom-left: rich amber/orange/red
    // Center-top: intense cyan / electric blue
    // Right: vibrant emerald / yellow-green into purple
    for (let y = step / 2; y < h; y += step) {
      const ny = y / h; // 0..1
      for (let x = step / 2; x < w; x += step) {
        const nx = x / w; // 0..1

        // Smooth multidimensional color blend
        // Red component: high on bottom-left, mid-right
        const r = Math.round(
          Math.min(255, Math.max(10, 230 * (1 - nx * 0.7) * (0.3 + 0.7 * ny) + 180 * Math.pow(nx, 2.5) * (1 - ny)))
        );
        // Green component: high on upper-center and right
        const g = Math.round(
          Math.min(255, Math.max(10, 210 * Math.sin(nx * Math.PI) * (1 - ny * 0.4) + 160 * nx * (1 - ny)))
        );
        // Blue component: high on center and upper-left
        const b = Math.round(
          Math.min(255, Math.max(20, 255 * Math.pow(Math.sin((nx + 0.2) * 2.8), 2) * (1 - ny * 0.3) + 70))
        );

        // Soft LED glow on larger pitch
        if (dotRadius > 2.5) {
          ctx.fillStyle = `rgba(${r},${g},${b},0.12)`;
          ctx.beginPath();
          ctx.arc(x, y, dotRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core LED diode
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Diode highlight pinpoint
        if (dotRadius > 2.2) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.beginPath();
          ctx.arc(x - dotRadius * 0.25, y - dotRadius * 0.25, dotRadius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Top-right status red LED indicator (like on real LED cabinets)
    ctx.fillStyle = '#ff3311';
    ctx.beginPath();
    ctx.arc(w - 24, 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33cc55';
    ctx.beginPath();
    ctx.arc(w - 14, 20, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [pitch, reduced]);

  // Marker calculation for ruler: 0.7m -> ~10%, 10m -> 96%
  const markerLeftPercent = Math.min(94, Math.max(8, ((pitch - 0.5) / 10) * 88 + 8));

  return (
    <section
      id="pitch"
      className="theme-light sec-lg"
      style={{
        position: 'relative',
        background: '#f5f4f0',
        color: '#111110',
        paddingTop: 'clamp(90px, 12vh, 150px)',
        paddingBottom: 'clamp(90px, 12vh, 150px)',
        paddingLeft: 0,
        paddingRight: 0,
        borderTop: '1px solid #e5e4de',
        borderBottom: '1px solid #e5e4de',
        ...cms.section,
      }}
    >
      {cms.hasOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: cms.overlayColor,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1520, margin: '0 auto', padding: '0 clamp(16px, 3.5vw, 64px)' }}>
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.24em',
            color: '#8A8880',
            marginBottom: 36,
            fontFamily: 'monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {t.eyebrow}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))',
            gap: 'clamp(40px, 5vw, 88px)',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Title, Explanations, Interactive Slider & Presets */}
          <div>
            <h2
              style={{
                fontSize: 'clamp(38px, 4.4vw, 76px)',
                fontWeight: 900,
                letterSpacing: '-.03em',
                lineHeight: 1.04,
                color: '#111110',
                margin: '0 0 24px',
                ...cms.title,
              }}
            >
              {t.titleLine1}
              <br />
              {t.titleLine2}
            </h2>

            <p
              style={{
                margin: '0 0 48px',
                maxWidth: 480,
                fontSize: 16.5,
                lineHeight: 1.6,
                color: '#4A4A46',
                fontWeight: 400,
              }}
            >
              {t.desc}
            </p>

            {/* Giant Pitch Display Number */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
              <span
                style={{
                  fontSize: 'clamp(72px, 7vw, 120px)',
                  fontWeight: 900,
                  letterSpacing: '-.03em',
                  lineHeight: 1,
                  color: '#111110',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pitch === Math.round(pitch) ? pitch : pitch.toFixed(1)}
              </span>
              <span style={{ fontSize: 18, color: '#8A8880', fontWeight: 600 }}>{t.unit}</span>
            </div>

            {/* Range Slider */}
            <div style={{ maxWidth: 520 }}>
              <input
                type="range"
                className="xr-range"
                min={MIN}
                max={MAX}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  appearance: 'none',
                  background: '#d6d4ce',
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
                aria-label="Pixel pitch selector"
              />

              {/* Preset Buttons Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  gap: 2,
                }}
              >
                {PRESETS.map((p) => {
                  const near = Math.abs(pitch - p) < 0.05;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPitch(p)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 2px',
                        fontSize: 11,
                        letterSpacing: '.05em',
                        fontFamily: 'monospace',
                        color: near ? '#C3F910' : '#A3A19B',
                        fontWeight: near ? 800 : 500,
                        borderTop: near ? '2px solid #C3F910' : '2px solid transparent',
                        transition: 'color .2s ease, border-color .2s ease',
                      }}
                    >
                      {p === Math.round(p) ? p : p.toFixed(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats: Pixels / M2 and Typical Use */}
            <div
              style={{
                display: 'flex',
                gap: 52,
                marginTop: 48,
                paddingTop: 32,
                borderTop: '1px solid #dfddd5',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#111110',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {pixelsPerM2(pitch)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.18em',
                    color: '#8A8880',
                    marginTop: 6,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                >
                  {t.pixelsLabel}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#111110',
                  }}
                >
                  {getTypicalUse(pitch)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.18em',
                    color: '#8A8880',
                    marginTop: 6,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                >
                  {t.typicalLabel}
                </div>
              </div>
            </div>

            {/* CTA Link */}
            <div style={{ marginTop: 44 }}>
              <button
                type="button"
                onClick={onOpenConsultation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: '#111110',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #111110',
                  padding: '0 0 4px',
                  cursor: 'pointer',
                  transition: 'color .2s, border-color .2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#C3F910';
                  e.currentTarget.style.borderBottomColor = '#C3F910';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#111110';
                  e.currentTarget.style.borderBottomColor = '#111110';
                }}
              >
                <span>{t.cta}</span>
              </button>
            </div>
          </div>

          {/* Right Column: LED Surface Canvas Simulation + Distance Ruler with Human Silhouette */}
          <div>
            {/* The LED Simulation Screen */}
            <div
              className="pitch-sim"
              style={{
                position: 'relative',
                background: '#080808',
                overflow: 'hidden',
                border: '1px solid #1f1f1e',
                borderRadius: 2,
                height: 'min(56vh, 520px)',
                minHeight: 380,
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'block',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 20,
                  fontSize: 10,
                  letterSpacing: '.22em',
                  fontFamily: 'monospace',
                  color: 'rgba(245,244,240,0.5)',
                  pointerEvents: 'none',
                }}
              >
                {t.simLabel}
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  fontSize: 11,
                  letterSpacing: '.22em',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#C3F910',
                  pointerEvents: 'none',
                }}
              >
                P {pitch === Math.round(pitch) ? pitch : pitch.toFixed(1)}
              </div>
            </div>

            {/* Viewing Distance Scale with Human Silhouette (Exact match Image 2) */}
            <div style={{ position: 'relative', height: 90, marginTop: 14 }}>
              {/* Baseline axis */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: 1,
                  background: '#dad8d2',
                }}
              />

              {/* Display start block */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: 6,
                  background: '#111110',
                }}
              />

              {/* Dynamic distance marker with human silhouette */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${markerLeftPercent}%`,
                  transition: 'left .45s cubic-bezier(.2,.8,.2,1)',
                }}
              >
                {/* Vertical red indicator bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    bottom: 8,
                    left: 0,
                    width: 2,
                    background: '#C3F910',
                  }}
                />

                {/* Human Silhouette SVG (Identical to Image 2) */}
                <svg
                  width="14"
                  height="30"
                  viewBox="0 0 14 30"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 8,
                    transform: 'translateY(-50%)',
                  }}
                  fill="none"
                  stroke="#111110"
                  strokeWidth="1.4"
                >
                  <circle cx="7" cy="4" r="3" />
                  <line x1="7" y1="7" x2="7" y2="18" />
                  <line x1="7" y1="10" x2="1" y2="15" />
                  <line x1="7" y1="10" x2="13" y2="15" />
                  <line x1="7" y1="18" x2="2" y2="27" />
                  <line x1="7" y1="18" x2="12" y2="27" />
                </svg>

                {/* Distance Value & Label */}
                <div style={{ position: 'absolute', top: -2, left: 28, whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      fontSize: 19,
                      fontWeight: 800,
                      color: '#111110',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ≈ {pitch === Math.round(pitch) ? pitch : pitch.toFixed(1)} m
                  </span>
                  <div
                    style={{
                      fontSize: 9.5,
                      letterSpacing: '.16em',
                      color: '#8A8880',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    {t.minViewingLabel}
                  </div>
                </div>
              </div>

              {/* Bottom distance labels (DISPLAY, 2m, 4m, 5m, 8m, 10m) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: '#A3A19B',
                  letterSpacing: '.08em',
                  fontFamily: 'monospace',
                }}
              >
                <span>{t.display}</span>
                <span>2 m</span>
                <span>4 m</span>
                <span>5 m</span>
                <span>8 m</span>
                <span>10 m</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div
              style={{
                fontSize: 11,
                color: '#A3A19B',
                marginTop: 26,
                lineHeight: 1.5,
              }}
            >
              {t.disclaimer}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
