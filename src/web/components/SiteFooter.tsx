'use client';

import React from 'react';
import { translations, Language } from '../data/translations';
import { OrbCanvas } from './OrbCanvas';

interface SiteFooterProps {
  companyName: string;
  lang?: Language;
}


// ── Footer ───────────────────────────────────────────────────────────────────
export const SiteFooter: React.FC<SiteFooterProps> = ({
  companyName,
  lang = 'FR',
}) => {
  const t = translations[lang].footer;

  return (
    <footer
      id="site-footer"
      style={{
        position: 'relative',
        background: '#050505',
        color: '#f5f4f0',
        overflow: 'hidden',
        borderTop: '1px solid #1a1a1a',
      }}
    >
      {/* ── Animated WebGL Fluid background (helloshivam.com) ── */}
      <OrbCanvas />

      {/* ── Scoped rule: allow clicking links/buttons while letting canvas catch background mousemove ── */}
      <style>{`
        #site-footer a, #site-footer button, #site-footer input {
          pointer-events: auto !important;
        }
      `}</style>

      {/* ── Footer content (above canvas) ── */}
      <div className="wrap pt-20 pb-12" style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        {/* Foot Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-[4.5rem] border-b border-[#1a1a1a]">
          {/* Products */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.products}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Fine (WP Series)
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Vision
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Flex
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                PXT Studio
              </a>
              <a href="#hero" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.allSeries}
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.company}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <a href="#overview" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.about.replace('PixiaTech', companyName)}
              </a>
              <a href="#fieldwork" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.projects}
              </a>
              <a href="#overview" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.coldLedTech}
              </a>
              <a href="#design" className="text-[#c9c7c1] hover:text-white transition-colors">
                {t.experienceCenter}
              </a>
            </div>
          </div>

          {/* Standards & Compliance */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.standards}
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              <span className="text-[#7a7a76]">CE / EMC Class B</span>
              <span className="text-[#7a7a76]">{t.rohs}</span>
              <span className="text-[#7a7a76]">{t.warranty}</span>
              <span className="text-[#7a7a76]">{t.calibration}</span>
            </div>
          </div>

          {/* Showroom & Contact */}
          <div>
            <div className="text-[10.5px] tracking-[0.22em] text-[#7a7a76] uppercase font-mono mb-5">
              {t.headquarters}
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px] text-[#c9c7c1]">
              <div className="font-bold text-white">{companyName} France</div>
              <div>{t.showroom}</div>
              <div className="text-[#7a7a76] text-xs">Saint-Ouen-sur-Seine (Grand Paris)</div>
              <div className="mt-2 text-[#C3F910] font-mono text-xs">
                contact@{companyName.toLowerCase().replace(/\s+/g, '')}.com
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-[11px] tracking-[0.15em] text-[#7a7a76] uppercase font-mono">
          <div>
            © 2026 {companyName.toUpperCase()}. {t.rights}
          </div>
          <div className="flex gap-6">
            <a href="#hero" className="hover:text-white transition-colors">{t.privacy}</a>
            <a href="#hero" className="hover:text-white transition-colors">{t.legal}</a>
            <a href="#specs" className="hover:text-white transition-colors">{t.datasheets}</a>
          </div>
        </div>
      </div>

      {/* Giant Full-Width Watermark Logo */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '0 var(--gutter, clamp(24px, 3.4vw, 56px))',
          userSelect: 'none',
          lineHeight: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pixiatech-logo.png"
          alt={companyName}
          style={{
            display: 'block',
            width: '100%',
            opacity: 0.14,
            transform: 'translateY(10%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </footer>
  );
};

