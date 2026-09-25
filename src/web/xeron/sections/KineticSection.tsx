'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../../xeron-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface KineticSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

const ACCENT_GREEN = '#C3F910';

export const KineticSection: React.FC<KineticSectionProps> = ({ lang = 'FR' }) => {
  const [activePart, setActivePart] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.kinetic as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const t = {
    eyebrow: getCmsText(
      cmsData,
      'badge',
      activeLang,
      activeLang === 'fr' ? '04 / FEATURED — SPKI-250 KINETIC' : '04 / FEATURED — SPKI-250 KINETIC'
    ),
    title1: getCmsText(
      cmsData,
      'title1',
      activeLang,
      getCmsText(cmsData, 'title', activeLang, activeLang === 'fr' ? "L'écran s'anime." : 'The screen moves.')
    ),
    title2: getCmsText(
      cmsData,
      'title2',
      activeLang,
      activeLang === 'fr' ? 'La profondeur devient' : 'Depth becomes'
    ),
    title3: getCmsText(
      cmsData,
      'title3',
      activeLang,
      activeLang === 'fr' ? "partie intégrante de l'image." : 'part of the image.'
    ),
    caption: getCmsText(
      cmsData,
      'caption',
      activeLang,
      activeLang === 'fr' ? 'LED CINÉTIQUE — MODULES EN MOUVEMENT' : 'KINETIC LED — MODULES IN MOTION'
    ),
    stepText: activeLang === 'fr' ? '05 — CHÂSSIS MOULÉ SOUS PRESSION' : '05 — DIE-CAST CABINET',
    items:
      activeLang === 'fr'
        ? [
            'UNITÉ DE MOUVEMENT — 248.5 MM',
            'GLISSIÈRE LINÉAIRE INDUSTRIELLE',
            'CONTRÔLEUR DE MOUVEMENT SYNCHRONISÉ',
            'SYSTÈME QUICK-LOCK SANS OUTIL',
            'CHÂSSIS EN ALUMINIUM MOULÉ',
          ]
        : ['MOTION UNIT — 248.5 MM', 'LINEAR GUIDE RAIL', 'MOTION CONTROLLER', 'QUICK-LOCK SYSTEM', 'DIE-CAST CABINET'],
    stats: [
      { val: '248.5 × 248.5', label: activeLang === 'fr' ? 'UNITÉ DE MOUVEMENT · MM' : 'MOTION UNIT · MM' },
      { val: '500 × 500', label: activeLang === 'fr' ? 'CHÂSSIS · MM' : 'CABINET · MM' },
      { val: '1.5 mm', label: activeLang === 'fr' ? 'INTERVALLE MODULE' : 'MODULE GAP' },
      { val: 'Quick-Lock', label: activeLang === 'fr' ? 'INSTALLATION SANS OUTIL' : 'TOOL-FREE INSTALL' },
      { val: 'Die-Cast', label: activeLang === 'fr' ? 'ALUMINIUM MOULÉ' : 'ALUMINIUM CABINET' },
    ],
    footnote: getCmsText(
      cmsData,
      'description',
      activeLang,
      activeLang === 'fr'
        ? 'Système LED cinétique intérieur grand format et ultra-léger — modules de mouvement 4-en-1 montés sur glissières linéaires industrielles, conçus pour les scénographies scéniques et installations suspendues à grande échelle.'
        : 'Large-format, lightweight indoor kinetic LED — 4-in-1 motion units on industrial linear guide rails, engineered for large-scale and elevated installations.'
    ),
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let mouseX = -1e4;
    let mouseY = -1e4;
    let isIntersecting = false;
    let animFrame = 0;

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const render = (timeSec: number) => {
      ctx.fillStyle = '#0A0A09';
      ctx.fillRect(0, 0, width, height);

      const cellSize = Math.max(48, Math.round(width / 12));
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;
      const faceSize = cellSize - 2;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = cols - 1; c >= 0; c--) {
          const posX = c * cellSize;
          const posY = r * cellSize;

          let elevation =
            14 + 13 * Math.sin(Math.hypot(posX + cellSize / 2 - centerX, posY + cellSize / 2 - centerY) / 64 - 1.1 * timeSec);

          const distToMouse = Math.hypot(posX + cellSize / 2 - mouseX, posY + cellSize / 2 - mouseY);
          if (distToMouse < 260) {
            elevation += (1 - distToMouse / 260) * 20;
          }

          elevation = Math.max(0.5, elevation);
          const topFaceX = posX + 0.5 * elevation;
          const topFaceY = posY - 0.9 * elevation;

          ctx.fillStyle = '#131312';
          ctx.beginPath();
          ctx.moveTo(posX, posY);
          ctx.lineTo(topFaceX, topFaceY);
          ctx.lineTo(topFaceX, topFaceY + faceSize);
          ctx.lineTo(posX, posY + faceSize);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#060606';
          ctx.beginPath();
          ctx.moveTo(posX, posY + faceSize);
          ctx.lineTo(topFaceX, topFaceY + faceSize);
          ctx.lineTo(topFaceX + faceSize, topFaceY + faceSize);
          ctx.lineTo(posX + faceSize, posY + faceSize);
          ctx.closePath();
          ctx.fill();

          const uNorm = Math.min(1, elevation / 34);
          const gray = 20 + 52 * uNorm;
          ctx.fillStyle = `rgb(${Math.round(gray + 6)},${Math.round(gray + 2)},${Math.round(gray)})`;
          ctx.fillRect(topFaceX, topFaceY, faceSize, faceSize);

          const half = faceSize / 2;
          ctx.strokeStyle = 'rgba(0,0,0,.5)';
          ctx.beginPath();
          ctx.moveTo(topFaceX + half, topFaceY);
          ctx.lineTo(topFaceX + half, topFaceY + faceSize);
          ctx.moveTo(topFaceX, topFaceY + half);
          ctx.lineTo(topFaceX + faceSize, topFaceY + half);
          ctx.stroke();

          if (uNorm > 0.55) {
            ctx.fillStyle = `rgba(195,249,16,${((uNorm - 0.55) * 0.95).toFixed(2)})`;
            ctx.fillRect(topFaceX, topFaceY, faceSize, 1.5);
          }

          ctx.strokeStyle = 'rgba(0,0,0,.4)';
          ctx.strokeRect(topFaceX + 0.5, topFaceY + 0.5, faceSize - 1, faceSize - 1);
        }
      }
    };

    render(2.2);

    const startTime = performance.now();
    const loop = (now: number) => {
      animFrame = 0;
      render((now - startTime) / 1000);
      if (isIntersecting) {
        animFrame = requestAnimationFrame(loop);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        isIntersecting = entries[0].isIntersecting && !prefersReducedMotion;
        if (isIntersecting && !animFrame) {
          animFrame = requestAnimationFrame(loop);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(parent);

    const ro = new ResizeObserver(() => {
      resize();
      if (!isIntersecting) render(2.2);
    });
    ro.observe(parent);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1e4;
      mouseY = -1e4;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      io.disconnect();
      ro.disconnect();
      if (animFrame) cancelAnimationFrame(animFrame);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const d = (index: number) => (activePart === index ? ACCENT_GREEN : '#3E3E3C');

  return (
    <section
      id="featured"
      className="theme-dark sec-lg"
      style={{
        position: 'relative',
        background: '#080808',
        borderTop: '1px solid #1c1c1b',
        paddingTop: 'clamp(90px, 12vh, 150px)',
        paddingBottom: 'clamp(90px, 12vh, 150px)',
        paddingLeft: 0,
        paddingRight: 0,
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
      <div className="wrap" style={{ position: 'relative', zIndex: 2, maxWidth: 1520, margin: '0 auto', padding: '0 clamp(16px, 3.5vw, 64px)' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.24em',
            color: '#7A7A76',
            marginBottom: 36,
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}
        >
          {t.eyebrow}
        </div>

        <h2
          className="h-featured"
          style={{
            margin: '0 0 70px',
            lineHeight: 1.02,
            letterSpacing: '-.025em',
            maxWidth: 1100,
            fontSize: 'clamp(38px, 5.2vw, 86px)',
            fontWeight: 800,
            color: '#F5F4F0',
            ...cms.title,
          }}
        >
          {t.title1}
          <br />
          {t.title2}
          <br />
          <span style={{ color: '#7A7A76' }}>{t.title3}</span>
        </h2>

        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))',
            gap: 'clamp(40px, 5vw, 88px)',
            alignItems: 'start',
          }}
        >
          <div
            className="kin-stage"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#0A0A09',
              border: '1px solid #222220',
              height: 'min(64vh, 620px)',
              minHeight: 400,
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
                cursor: 'crosshair',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 22,
                bottom: 20,
                fontSize: 10.5,
                letterSpacing: '.22em',
                color: '#7A7A76',
                pointerEvents: 'none',
                fontFamily: 'monospace',
              }}
            >
              {t.caption}
            </div>
          </div>

          <div>
            <svg viewBox="0 0 560 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <rect
                x="430"
                y="50"
                width="70"
                height="290"
                fill="none"
                stroke={d(4)}
                strokeWidth="1.2"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="444" y1="50" x2="444" y2="340" stroke={d(4)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <line x1="430" y1="195" x2="500" y2="195" stroke={d(4)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <line x1="500" y1="80" x2="512" y2="68" stroke={d(4)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <line x1="500" y1="180" x2="512" y2="168" stroke={d(4)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <line x1="500" y1="280" x2="512" y2="268" stroke={d(4)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <text
                x="548"
                y="392"
                textAnchor="end"
                fontSize="11"
                fill={d(4)}
                fontFamily="monospace"
                style={{ transition: 'fill 0.25s' }}
              >
                {t.stepText}
              </text>
              <line x1="430" y1="356" x2="500" y2="356" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="430" y1="348" x2="430" y2="364" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="500" y1="348" x2="500" y2="364" stroke="#3A3A3A" strokeWidth="0.8" />
              <text x="404" y="376" fontSize="11" fill="#7A7A76" fontFamily="monospace">
                500 × 500 MM
              </text>

              <rect
                x="310"
                y="132"
                width="120"
                height="14"
                fill="none"
                stroke={d(1)}
                strokeWidth="1"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="166" y1="139" x2="310" y2="139" stroke={d(1)} strokeWidth="0.8" style={{ transition: 'stroke 0.25s' }} />
              <rect
                x="340"
                y="242"
                width="90"
                height="14"
                fill="none"
                stroke={d(1)}
                strokeWidth="1"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="276" y1="249" x2="340" y2="249" stroke={d(1)} strokeWidth="0.8" style={{ transition: 'stroke 0.25s' }} />
              <line x1="370" y1="132" x2="370" y2="100" stroke={d(1)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <text x="363" y="92" fontSize="11" fill={d(1)} fontFamily="monospace" style={{ transition: 'fill 0.25s' }}>
                02
              </text>

              <rect
                x="140"
                y="84"
                width="26"
                height="110"
                fill="none"
                stroke={d(0)}
                strokeWidth="1.2"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="140" y1="84" x2="140" y2="194" stroke={d(0)} strokeWidth="3" style={{ transition: 'stroke 0.25s' }} />
              <line x1="153" y1="84" x2="153" y2="40" stroke={d(0)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <text x="146" y="32" fontSize="11" fill={d(0)} fontFamily="monospace" style={{ transition: 'fill 0.25s' }}>
                01
              </text>

              <rect
                x="250"
                y="194"
                width="26"
                height="110"
                fill="none"
                stroke={d(0)}
                strokeWidth="1.2"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="250" y1="194" x2="250" y2="304" stroke={d(0)} strokeWidth="3" style={{ transition: 'stroke 0.25s' }} />
              <line x1="120" y1="84" x2="120" y2="194" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="112" y1="84" x2="128" y2="84" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="112" y1="194" x2="128" y2="194" stroke="#3A3A3A" strokeWidth="0.8" />
              <text
                transform="rotate(-90 100 139)"
                x="100"
                y="139"
                textAnchor="middle"
                fontSize="11"
                fill="#7A7A76"
                fontFamily="monospace"
              >
                248.5 MM
              </text>

              <rect
                x="444"
                y="208"
                width="42"
                height="30"
                fill="none"
                stroke={d(2)}
                strokeWidth="1.2"
                style={{ transition: 'stroke 0.25s' }}
              />
              <line x1="486" y1="223" x2="516" y2="223" stroke={d(2)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <text x="522" y="227" fontSize="11" fill={d(2)} fontFamily="monospace" style={{ transition: 'fill 0.25s' }}>
                03
              </text>

              <circle cx="446" cy="44" r="4" fill="none" stroke={d(3)} strokeWidth="1" style={{ transition: 'stroke 0.25s' }} />
              <circle cx="470" cy="44" r="4" fill="none" stroke={d(3)} strokeWidth="1" style={{ transition: 'stroke 0.25s' }} />
              <line x1="474" y1="40" x2="506" y2="28" stroke={d(3)} strokeWidth="0.6" style={{ transition: 'stroke 0.25s' }} />
              <text x="512" y="32" fontSize="11" fill={d(3)} fontFamily="monospace" style={{ transition: 'fill 0.25s' }}>
                04
              </text>

              <line x1="140" y1="332" x2="276" y2="332" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="140" y1="324" x2="140" y2="340" stroke="#3A3A3A" strokeWidth="0.8" />
              <line x1="276" y1="324" x2="276" y2="340" stroke="#3A3A3A" strokeWidth="0.8" />
              <text x="140" y="360" fontSize="11" fill="#7A7A76" fontFamily="monospace">
                Z-AXIS TRAVEL — SIDE VIEW
              </text>
            </svg>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 28,
                borderTop: '1px solid #222220',
              }}
            >
              {t.items.map((item, index) => {
                const isSelected = activePart === index;
                return (
                  <div
                    key={item}
                    onMouseEnter={() => setActivePart(index)}
                    onClick={() => setActivePart(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 18,
                      padding: '15px 4px',
                      borderBottom: '1px solid #1c1c1a',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: '.14em',
                        color: isSelected ? ACCENT_GREEN : '#3A3A3A',
                        minWidth: 22,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        transition: 'color 0.2s',
                      }}
                    >
                      0{index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        letterSpacing: '.1em',
                        fontWeight: 600,
                        color: isSelected ? '#F5F4F0' : '#5A5A56',
                        transition: 'color 0.2s',
                      }}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="kin-stats"
          style={{
            display: 'grid',
            gap: 1,
            background: '#222220',
            border: '1px solid #222220',
            marginTop: 72,
          }}
        >
          {t.stats.map((stat) => (
            <div key={stat.label} style={{ background: '#0d0d0c', padding: '26px 24px' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#F5F4F0', letterSpacing: '-.01em' }}>{stat.val}</div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.2em',
                  color: '#7A7A76',
                  marginTop: 8,
                  fontFamily: 'monospace',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 12,
            color: '#7A7A76',
            marginTop: 16,
            lineHeight: 1.6,
            maxWidth: 960,
          }}
        >
          {t.footnote}
        </div>
      </div>
    </section>
  );
};
