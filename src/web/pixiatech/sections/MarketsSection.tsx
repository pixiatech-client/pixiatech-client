'use client';

import React, { useRef } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { ZeroSlider } from '../zero-slider/ZeroSlider';

interface MarketsSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.markets as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const t = {
    eyebrow: getCmsText(
      cmsData,
      'badge',
      activeLang,
      getCmsText(cmsData, 'eyebrow', activeLang, activeLang === 'fr' ? '02 / MARCHÉS' : '02 / MARKETS')
    ),
    title: getCmsText(
      cmsData,
      'title',
      activeLang,
      activeLang === 'fr' ? 'Conçu pour chaque environnement.' : 'Built for every environment.'
    ),
  };

  return (
    <>
      <span id="markets" style={{ display: 'block', height: 0, marginTop: -90, paddingTop: 90 }} />
      <section
        ref={sectionRef}
        data-cms-section="markets"
        style={{
          position: 'relative',
          background: '#000000',
          color: '#F5F4F0',
          borderTop: '1px solid #1c1c1b',
          borderBottom: '1px solid #1c1c1b',
          overflow: 'hidden',
          padding: 0,
          ...cms.section,
        }}
      >
        {/* Background ambient subtle glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 50% 25%, rgba(var(--ui-accent-rgb), 0.04) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Section Header: Titre et numéro 02 positionnés à l'intérieur de la section sur fond noir, en haut à gauche */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(28px, 4.5vh, 56px)',
            left: 'clamp(20px, 4vw, 72px)',
            zIndex: 25,
            pointerEvents: isEditing ? 'auto' : 'none',
            maxWidth: 'min(90%, 820px)',
          }}
        >
          <div
            data-text-key="badge"
            style={{
              fontSize: 11,
              letterSpacing: '.24em',
              color: '#8A8A86',
              marginBottom: 12,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            {t.eyebrow}
          </div>
          <h2
            data-text-key="title"
            style={{
              fontSize: 'clamp(28px, 3.2vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-.025em',
              color: '#F5F4F0',
              margin: 0,
              lineHeight: 1.08,
            }}
          >
            {t.title}
          </h2>
        </div>

        {/* Intégration pleine largeur du modèle Zero Slider sans contrainte de carte */}
        <div style={{ width: '100%', position: 'relative' }}>
          <ZeroSlider onOpenConsultation={onOpenConsultation} />
        </div>
      </section>
    </>
  );
};
