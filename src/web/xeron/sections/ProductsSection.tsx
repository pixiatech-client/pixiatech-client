'use client';

import React from 'react';
import { Language } from '../../xeron-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface ProductsSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

/**
 * Section 06 — CATALOGUE DES ÉCRANS
 * En-tête épuré avec titre, description et bouton CTA vers le catalogue complet.
 */
export const ProductsSection: React.FC<ProductsSectionProps> = ({
  lang = 'FR',
  onOpenConsultation,
}) => {
  const { pages } = useCms();

  const cmsData = (pages['home']?.sections?.products as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);

  const t = {
    eyebrow:
      (cmsData.badge as string) ||
      (cmsData.eyebrow as string) ||
      (lang === 'FR' ? '06 / CATALOGUE PRODUITS' : '06 / PRODUCTS CATALOG'),
    title:
      (cmsData.title as string) ||
      (lang === 'FR' ? '39 séries d\u2019écrans.' : '39 display series.'),
    titleLine2:
      (cmsData.titleLine2 as string) ||
      (lang === 'FR' ? 'Un seul catalogue.' : 'One catalog.'),
    cta:
      (cmsData.primaryCta as string) ||
      (cmsData.ctaText as string) ||
      (lang === 'FR' ? 'TOUS LES PRODUITS →' : 'ALL PRODUCTS →'),
    desc:
      (cmsData.description as string) ||
      (cmsData.subtitle as string) ||
      (lang === 'FR'
        ? 'Installation fixe, location & événementiel, transparents, cinétiques et créatifs — explorez notre catalogue complet par environnement et domaine d\u2019application.'
        : 'Fixed installation, rental & staging, transparent, kinetic and creative — filter the full catalog by environment and application.'),
  };

  return (
    <section
      id="products"
      style={{
        position: 'relative',
        background: cms.section.backgroundColor ?? '#f5f4f0',
        color: '#111110',
        paddingTop: cms.section.paddingTop ?? 'clamp(90px, 12vh, 150px)',
        paddingBottom: cms.section.paddingBottom ?? 'clamp(90px, 12vh, 150px)',
        paddingLeft: cms.section.paddingLeft ?? 0,
        paddingRight: cms.section.paddingRight ?? 0,
        minHeight: cms.section.minHeight ?? undefined,
        marginTop: cms.section.marginTop ?? undefined,
        marginBottom: cms.section.marginBottom ?? undefined,
        backgroundImage: cms.section.backgroundImage ?? undefined,
        backgroundSize: cms.section.backgroundSize ?? undefined,
        backgroundPosition: cms.section.backgroundPosition ?? undefined,
        backgroundRepeat: cms.section.backgroundRepeat ?? undefined,
        borderTop: '1px solid #e5e4de',
      }}
    >
      {/* Overlay optionnel */}
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

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1520,
          margin: '0 auto',
          padding: '0 clamp(24px, 3.4vw, 56px)',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(38px, 4.4vw, 76px)',
              fontWeight: 900,
              letterSpacing: '-.03em',
              lineHeight: 1.04,
              color: '#111110',
              ...cms.title,
            }}
          >
            {t.title}
            <br />
            {t.titleLine2}
          </h2>

          <a
            href="/web/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '16px 28px',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              background: '#111110',
              color: '#f5f4f0',
              textDecoration: 'none',
              transition: 'background .25s ease, color .25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C3F910';
              e.currentTarget.style.color = '#080808';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111110';
              e.currentTarget.style.color = '#f5f4f0';
            }}
          >
            {t.cta}
          </a>
        </div>

        {/* Description */}
        <p
          style={{
            marginTop: 28,
            maxWidth: 580,
            color: '#4A4A46',
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          {t.desc}
        </p>
      </div>
    </section>
  );
};
