'use client';

import React, { useState } from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductDesign } from '@/lib/products/types';

interface DesignSectionProps {
  lang?: Language;
  data?: ProductDesign;
}

/* ── Hover-aware spec row (mirrors xeron.co behavior) ─────────────────────── */
function SpecRow({
  label,
  val,
  isLast = false,
}: {
  label: string;
  val: string;
  isLast?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        padding: '20px 8px',
        borderBottom: isLast ? 'none' : '1px solid var(--dark-line, #1f1f1f)',
        cursor: 'pointer',
        transition: 'all .25s ease',
        background: hovered ? 'rgba(195, 249, 16, 0.06)' : 'transparent',
        borderLeft: hovered ? '2px solid #C3F910' : '2px solid transparent',
        paddingLeft: hovered ? '14px' : '8px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          letterSpacing: '.14em',
          color: hovered ? '#C3F910' : 'var(--dark-muted, #7a7a76)',
          transition: 'color .2s',
          fontWeight: hovered ? 700 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: hovered ? '#ffffff' : 'var(--dark-text, #f5f4f0)',
          transition: 'all .2s ease',
          transform: hovered ? 'translateX(4px)' : 'translateX(0)',
          textShadow: hovered ? '0 0 12px rgba(195, 249, 16, 0.35)' : 'none',
        }}
      >
        {val}
      </span>
    </div>
  );
}

/* ── Specs list panel ──────────────────────────────────────────────────────── */
function SpecsList({
  specsList,
  lang,
  onScrollToSpecs,
}: {
  specsList: { label: string; val: string }[];
  lang: Language;
  onScrollToSpecs: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [linkHovered, setLinkHovered] = useState(false);
  return (
    <div>
      <div style={{ borderTop: '1px solid var(--dark-line, #1f1f1f)' }}>
        {specsList.map((item) => (
          <SpecRow key={item.label} label={item.label} val={item.val} />
        ))}

        {/* Full technical data link row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            padding: '20px 8px',
            borderBottom: 'none',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              letterSpacing: '.14em',
              color: 'var(--dark-muted, #7a7a76)',
            }}
          >
            {lang === 'FR' ? 'DONNÉES TECHNIQUES COMPLÈTES' : 'FULL TECHNICAL DATA'}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            <a
              href="#specs"
              onClick={onScrollToSpecs}
              onMouseEnter={() => setLinkHovered(true)}
              onMouseLeave={() => setLinkHovered(false)}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '.08em',
                color: '#C3F910',
                borderBottom: '1px solid #C3F910',
                padding: '4px 10px',
                background: linkHovered ? 'rgba(195, 249, 16, 0.15)' : 'transparent',
                borderRadius: '2px',
                transition: 'all .2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://xeron.co/uploads/products/wp/module-3.jpg';
          }}
        />
      </div>
    </div>
  );
}

/* ── Config card with hover accent border ──────────────────────────────────── */
function ConfigCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: `2px solid ${hovered ? '#C3F910' : 'rgba(195, 249, 16, 0.25)'}`,
        paddingTop: '20px',
        transition: 'all .25s ease',
        cursor: 'default',
        background: hovered ? 'rgba(195, 249, 16, 0.04)' : 'transparent',
        padding: '20px 14px 16px',
        borderRadius: hovered ? '4px' : '0',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '.2em',
          color: '#C3F910',
          marginBottom: '10px',
          fontWeight: 700,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: '21px',
          fontWeight: 700,
          marginBottom: '8px',
          color: hovered ? '#ffffff' : 'var(--dark-text, #f5f4f0)',
          transition: 'color .25s',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: hovered ? 'var(--dark-text-2, #c9c7c1)' : 'var(--dark-body, #a3a3a3)',
          lineHeight: 1.6,
          transition: 'color .25s',
        }}
      >
        {desc}
      </div>
    </div>
  );
}

/* ── Config grid ───────────────────────────────────────────────────────────── */
function ConfigGrid({ configs }: { configs: { num: string; title: string; desc: string }[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: '24px',
      }}
    >
      {configs.map((cfg) => (
        <ConfigCard key={cfg.title} num={cfg.num} title={cfg.title} desc={cfg.desc} />
      ))}
    </div>
  );
}

/* ── Main section ──────────────────────────────────────────────────────────── */
export const DesignSection: React.FC<DesignSectionProps> = ({ lang = 'FR', data }) => {
  const { pages, currentPageId } = useCms();
  const cmsDesign = (pages[currentPageId]?.sections?.design as Record<string, unknown>) || {};

  const eyebrow =
    data?.eyebrow ||
    (cmsDesign.eyebrow as string) ||
    (lang === 'FR' ? '02 / CONCEPTION ARCHITECTURALE' : '02 / ARCHITECTURAL DESIGN');
  const heading1 =
    data?.title ||
    (cmsDesign.title as string) ||
    (lang === 'FR' ? "Usinage d'orfèvrerie & Châssis Monobloc" : 'Engineered as an object.');
  const heading2 = lang === 'FR' ? 'Installé comme une surface.' : 'Installed as a surface.';

  const specsList = data?.specsList?.length
    ? data.specsList.map((s) => ({ label: s.label, val: s.value }))
    : [
        { label: lang === 'FR' ? 'CHÂSSIS' : 'CABINET', val: '600×337.5 mm' },
        { label: lang === 'FR' ? 'PITCH PIXEL' : 'PIXEL PITCH', val: '1.2–3.1 mm' },
        { label: lang === 'FR' ? 'LUMINOSITÉ' : 'BRIGHTNESS', val: '800–1,500' },
        {
          label: lang === 'FR' ? 'ENVIRONNEMENT' : 'ENVIRONMENT',
          val: lang === 'FR' ? 'INTÉRIEUR' : 'INDOOR',
        },
      ];

  const configs = data?.configs?.length
    ? data.configs.map((c) => ({ num: c.num, title: c.title, desc: c.description || '' }))
    : lang === 'FR'
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
            color: '#C3F910',
            marginBottom: '36px',
            textTransform: 'uppercase',
            fontWeight: 700,
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

        {/* 2-Column: Blueprint SVG + Specs */}
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(40px, 5vw, 88px)',
            alignItems: 'center',
          }}
        >
          {/* Blueprint SVG */}
          <svg
            viewBox="0 0 560 282.8"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            aria-label="Technical Cabinet & Module Blueprint"
          >
            {/* Main Cabinet Outer Box */}
            <rect x="80" y="50" width="300" height="168.8" fill="rgba(255,255,255,0.01)" stroke="#3A3A36" strokeWidth="1.2" />
            <line x1="230" y1="50" x2="230" y2="218.8" stroke="#252523" strokeWidth="0.6" strokeDasharray="3 3" />
            <line x1="80" y1="134.4" x2="380" y2="134.4" stroke="#252523" strokeWidth="0.6" strokeDasharray="3 3" />

            {/* Active Highlighted Module in #C3F910 */}
            <rect x="80" y="50" width="150" height="84.4" fill="rgba(195, 249, 16, 0.08)" stroke="#C3F910" strokeWidth="1.8" />
            <line x1="155" y1="50" x2="155" y2="24" stroke="#C3F910" strokeWidth="1" />
            <circle cx="155" cy="50" r="2.5" fill="#C3F910" />
            <text x="145" y="16" fontSize="11" fill="#C3F910" fontWeight="700" letterSpacing="0.08em">
              MODULE — 300 × 168.8 mm
            </text>

            {/* Cabinet Dimension Lines */}
            <line x1="80" y1="238.8" x2="380" y2="238.8" stroke="#4A4A46" strokeWidth="0.8" />
            <line x1="80" y1="230.8" x2="80" y2="246.8" stroke="#4A4A46" strokeWidth="0.8" />
            <line x1="380" y1="230.8" x2="380" y2="246.8" stroke="#4A4A46" strokeWidth="0.8" />
            <text x="80" y="266.8" fontSize="11" fill="#C9C7C1" letterSpacing="0.08em" fontWeight="500">
              CABINET — 600×337.5 mm
            </text>

            {/* Side View with Depth */}
            <rect x="440" y="50" width="14.8" height="168.8" fill="rgba(195, 249, 16, 0.05)" stroke="#3A3A36" strokeWidth="1.2" />
            <line x1="440" y1="50" x2="440" y2="218.8" stroke="#C3F910" strokeWidth="2.8" />
            <line x1="440" y1="238.8" x2="454.8" y2="238.8" stroke="#4A4A46" strokeWidth="0.8" />
            <line x1="440" y1="230.8" x2="440" y2="246.8" stroke="#4A4A46" strokeWidth="0.8" />
            <line x1="454.8" y1="230.8" x2="454.8" y2="246.8" stroke="#4A4A46" strokeWidth="0.8" />
            <text x="418" y="266.8" fontSize="11" fill="#C9C7C1" letterSpacing="0.08em">
              DEPTH — <tspan fill="#C3F910" fontWeight="700">29.5 mm</tspan>
            </text>
            <text x="440" y="36" fontSize="11" fill="#7A7A76" fontWeight="600" letterSpacing="0.1em">SIDE</text>
            <text x="80" y="36" fontSize="11" fill="#7A7A76" fontWeight="600" letterSpacing="0.1em">FRONT</text>
          </svg>

          {/* Specs list + photo */}
          <SpecsList specsList={specsList} lang={lang} onScrollToSpecs={handleScrollToSpecs} />
        </div>

        {/* Configurations */}
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
          <ConfigGrid configs={configs} />
        </div>
      </div>
    </section>
  );
};
