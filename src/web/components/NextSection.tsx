'use client';

import React from 'react';
import { Language } from '../data/translations';
import type { ProductNext } from '@/lib/products/types';

interface NextSectionProps {
  onOpenConsultation: () => void;
  lang?: Language;
  /** Données produit (template dynamique). Nom des séries neutres, CTA FR uniquement. */
  data?: ProductNext;
}

export const NextSection: React.FC<NextSectionProps> = ({
  onOpenConsultation,
  lang = 'FR',
  data,
}) => {
  const prevName = data?.prev?.name || 'WK Series';
  const nextName = data?.next?.name || 'PXT Ultra';

  // Seuls les libellés FR sont portés par les données ; l'EN garde son texte.
  const headline = lang === 'FR' ? (data?.headline || 'Donnons vie à votre affichage.') : "Let's build your display.";
  const highlight = lang === 'FR' ? (data?.headlineHighlight || 'votre affichage.') : 'your display.';
  const line1 = headline.split(highlight)[0] || headline;
  const line2 = line1 === headline ? '' : highlight;

  // Le CTA produit n'est piloté qu'en FR pour ne jamais transparaître en EN.
  const ctaLabel =
    (lang === 'FR' ? data?.cta : undefined) ||
    (lang === 'FR' ? 'Démarrer un projet →' : 'Start a Project →');

  return (
    <section
      id="next"
      className="theme-dark"
      style={{
        padding: 'clamp(90px, 10vh, 130px) 0',
        borderTop: '1px solid var(--dark-line, #1f1f1f)',
        background: 'var(--black, #080808)',
        color: 'var(--dark-text, #f5f4f0)',
      }}
    >
      <div className="wrap">
        {/* Previous & Next Series Cards */}
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Previous Series */}
          <a
            href="/web/products"
            className="next-series-card"
            style={{
              display: 'block',
              border: '1px solid var(--dark-line, #1f1f1f)',
              padding: '34px 32px',
              transition: 'all .25s ease',
              textDecoration: 'none',
              background: 'transparent',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C3F910';
              e.currentTarget.style.background = 'rgba(195, 249, 16, 0.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(195, 249, 16, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--dark-line, #1f1f1f)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '.22em',
                color: '#C3F910',
                marginBottom: '14px',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>←</span> {lang === 'FR' ? 'SÉRIE PRÉCÉDENTE' : 'PREVIOUS SERIES'}
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 2.2vw, 32px)',
                fontWeight: 700,
                color: 'var(--dark-text, #f5f4f0)',
                letterSpacing: '-.01em',
              }}
            >
              {prevName}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--dark-muted, #7a7a76)',
                marginTop: '8px',
              }}
            >
              {lang === 'FR' ? 'Écran LED fin pitch intérieur' : 'Indoor fine-pitch LED display'}
            </div>
          </a>

          {/* Next Series */}
          <a
            href="/web/products"
            className="next-series-card"
            style={{
              display: 'block',
              border: '1px solid var(--dark-line, #1f1f1f)',
              padding: '34px 32px',
              textAlign: 'right',
              transition: 'all .25s ease',
              textDecoration: 'none',
              background: 'transparent',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#C3F910';
              e.currentTarget.style.background = 'rgba(195, 249, 16, 0.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(195, 249, 16, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--dark-line, #1f1f1f)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '.22em',
                color: '#C3F910',
                marginBottom: '14px',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
              }}
            >
              {lang === 'FR' ? 'SÉRIE SUIVANTE' : 'NEXT SERIES'} <span>→</span>
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 2.2vw, 32px)',
                fontWeight: 700,
                color: 'var(--dark-text, #f5f4f0)',
                letterSpacing: '-.01em',
              }}
            >
              {nextName}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--dark-muted, #7a7a76)',
                marginTop: '8px',
              }}
            >
              {lang === 'FR' ? 'Écran LED fin pitch intérieur' : 'Indoor fine-pitch LED display'}
            </div>
          </a>
        </div>

        {/* Call To Action Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--dark-line, #1f1f1f)',
            marginTop: '72px',
            paddingTop: '64px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(34px, 3.6vw, 58px)',
              fontWeight: 700,
              letterSpacing: '-.02em',
              margin: 0,
              lineHeight: 1.06,
            }}
          >
            {line1}
            {line2 && (
              <>
                <br />
                {line2}
              </>
            )}
          </h2>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="btn btn-solid"
            style={{
              padding: '19px 34px',
              fontSize: '14px',
              textTransform: 'none',
              letterSpacing: '.04em',
              cursor: 'pointer',
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
};
