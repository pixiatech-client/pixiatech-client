'use client';

import React from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';

interface DesignSectionProps {
  lang?: Language;
}

export const DesignSection: React.FC<DesignSectionProps> = ({ lang = 'FR' }) => {
  const { pages, currentPageId } = useCms();
  const cmsDesign = (pages[currentPageId]?.sections?.design as Record<string, unknown>) || {};

  const eyebrow = (cmsDesign.eyebrow as string) || (lang === 'FR' ? '02 / CONCEPTION' : '02 / DESIGN');
  const heading1 = (cmsDesign.title as string) || (lang === 'FR' ? "Conçu comme une œuvre d'art." : 'Engineered as an object.');
  const heading2 = lang === 'FR' ? 'Installé comme une surface.' : 'Installed as a surface.';

  const specsList = [
    { label: lang === 'FR' ? 'CHÂSSIS' : 'CABINET', val: '600×337.5 mm' },
    { label: lang === 'FR' ? 'PITCH PIXEL' : 'PIXEL PITCH', val: '1.2–3.1 mm' },
    { label: lang === 'FR' ? 'LUMINOSITÉ' : 'BRIGHTNESS', val: '800–1,500' },
    { label: lang === 'FR' ? 'ENVIRONNEMENT' : 'ENVIRONMENT', val: lang === 'FR' ? 'INTÉRIEUR' : 'INDOOR' },
  ];

  const configs = lang === 'FR'
    ? [
        {
          num: '01',
          title: 'Fixation murale',
          desc: 'Support ultra-fin avec seulement 37 mm de profondeur totale. Finition invisible et maintenance 100% avant sans décrocher le panneau.',
        },
        {
          num: '02',
          title: 'Totem mobile',
          desc: 'Se transforme en écran mobile haute définition. Bordure de protection anti-choc sécurisant les diodes lors des déplacements.',
        },
        {
          num: '03',
          title: 'Angles créatifs',
          desc: "Configurations d'angles pour espaces en L et enveloppants. Compatible avec la série XR Wrap pour installations courbes.",
        },
      ]
    : [
        {
          num: '01',
          title: 'Wall-mounted',
          desc: 'Slim floating bracket. 37mm total depth. Flat, seamless finish — front service access without removing the panel.',
        },
        {
          num: '02',
          title: 'Mobile Stand',
          desc: 'Transforms into a high-definition mobile display. Anti-collision safety rim protects LEDs in transit.',
        },
        {
          num: '03',
          title: 'Creative Corner',
          desc: 'Corner-screen configurations for L-shaped and wrap-around spaces. Combine with XR Wrap for curved installations.',
        },
      ];

  const handleScrollToSpecs = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#specs');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="design"
      className="section theme-dark"
      style={{
        background: 'var(--black-3, #0d0d0c)',
        borderTop: '1px solid var(--dark-line, #1f1f1f)',
      }}
    >
      <div className="wrap">
        {/* Eyebrow */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '.24em',
            color: 'var(--dark-muted, #7a7a76)',
            marginBottom: '36px',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>

        {/* Title */}
        <h2 className="h2" style={{ marginBottom: '64px' }}>
          {heading1}
          <br />
          <span style={{ color: 'var(--muted, #8a8880)' }}>{heading2}</span>
        </h2>

        {/* 2-Column Technical Diagram & Quick Specs */}
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(40px, 5vw, 88px)',
            alignItems: 'center',
          }}
        >
          {/* Blueprint SVG vector exact xeron dimensions */}
          <svg
            viewBox="0 0 560 282.8"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-label="Technical Cabinet & Module Blueprint"
          >
            <rect x="80" y="50" width="300" height="168.8" fill="none" stroke="#4A4A46" strokeWidth="1.2" />
            <line x1="230" y1="50" x2="230" y2="218.8" stroke="#2E2E2C" strokeWidth="0.6" />
            <line x1="80" y1="134.4" x2="380" y2="134.4" stroke="#2E2E2C" strokeWidth="0.6" />
            <rect x="80" y="50" width="150" height="84.4" fill="none" stroke="var(--accent, #C3F910)" strokeWidth="1.2" />
            <line x1="155" y1="50" x2="155" y2="26" stroke="var(--accent, #C3F910)" strokeWidth="0.6" />
            <text x="149" y="18" fontSize="11" fill="var(--accent, #C3F910)">
              MODULE — 300 × 168.8 mm
            </text>
            <line x1="80" y1="238.8" x2="380" y2="238.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <line x1="80" y1="230.8" x2="80" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <line x1="380" y1="230.8" x2="380" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <text x="80" y="266.8" fontSize="11" fill="#7A7A76">
              CABINET — 600×337.5 mm
            </text>
            <rect x="440" y="50" width="14.8" height="168.8" fill="none" stroke="#4A4A46" strokeWidth="1.2" />
            <line x1="440" y1="50" x2="440" y2="218.8" stroke="var(--accent, #C3F910)" strokeWidth="2.4" />
            <line x1="440" y1="238.8" x2="454.8" y2="238.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <line x1="440" y1="230.8" x2="440" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <line x1="454.8" y1="230.8" x2="454.8" y2="246.8" stroke="#3A3A3A" strokeWidth="0.8" />
            <text x="428" y="266.8" fontSize="11" fill="#7A7A76">
              DEPTH — 29.5 mm
            </text>
            <text x="440" y="36" fontSize="11" fill="#4A4A46">
              SIDE
            </text>
            <text x="80" y="36" fontSize="11" fill="#4A4A46">
              FRONT
            </text>
          </svg>

          {/* Quick specs list + module photograph */}
          <div>
            <div style={{ borderTop: '1px solid var(--dark-line, #1f1f1f)' }}>
              {specsList.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '20px',
                    padding: '20px 4px',
                    borderBottom: '1px solid var(--dark-line, #1f1f1f)',
                  }}
                >
                  <span style={{ fontSize: '13px', letterSpacing: '.14em', color: 'var(--dark-muted, #7a7a76)' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dark-text, #f5f4f0)' }}>
                    {item.val}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '20px',
                  padding: '20px 4px',
                  borderBottom: 'none',
                }}
              >
                <span style={{ fontSize: '13px', letterSpacing: '.14em', color: 'var(--dark-muted, #7a7a76)' }}>
                  {lang === 'FR' ? 'DONNÉES TECHNIQUES COMPLÈTES' : 'FULL TECHNICAL DATA'}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  <a
                    href="#specs"
                    onClick={handleScrollToSpecs}
                    className="hov-acc"
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '.08em',
                      borderBottom: '1px solid var(--accent, #C3F910)',
                      paddingBottom: '2px',
                      transition: 'color .2s, border-color .2s',
                    }}
                  >
                    {lang === 'FR' ? 'SPÉCIFICATIONS ↓' : 'SPECIFICATIONS ↓'}
                  </a>
                </span>
              </div>
            </div>

            {/* Module photo 3 */}
            <div
              style={{
                position: 'relative',
                height: '220px',
                marginTop: '28px',
                overflow: 'hidden',
                background: '#0e0e0d',
              }}
            >
              <img
                src="/uploads/products/wp/module-3.jpg"
                alt="Module Detail"
                className="slot-img"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://xeron.co/uploads/products/wp/module-3.jpg';
                }}
              />
            </div>
          </div>
        </div>

        {/* Configurations matching xeron.co */}
        <div
          style={{
            marginTop: '88px',
            borderTop: '1px solid var(--dark-line, #1f1f1f)',
            paddingTop: '56px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '.24em',
              color: 'var(--dark-muted, #7a7a76)',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}
          >
            CONFIGURATIONS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
              gap: '24px',
            }}
          >
            {configs.map((cfg) => (
              <div
                key={cfg.title}
                style={{
                  borderTop: '2px solid var(--dark-text, #f5f4f0)',
                  paddingTop: '18px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    letterSpacing: '.2em',
                    color: 'var(--accent, #C3F910)',
                    marginBottom: '10px',
                    fontWeight: 700,
                  }}
                >
                  {cfg.num}
                </div>
                <div
                  style={{
                    fontSize: '21px',
                    fontWeight: 700,
                    marginBottom: '8px',
                    color: 'var(--dark-text, #f5f4f0)',
                  }}
                >
                  {cfg.title}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--dark-body, #a3a3a3)',
                    lineHeight: 1.6,
                  }}
                >
                  {cfg.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
