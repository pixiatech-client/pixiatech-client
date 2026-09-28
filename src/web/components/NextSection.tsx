'use client';

import React from 'react';
import { Language } from '../data/translations';
import type { ProductNext } from '@/lib/products/types';
import { text } from '@/lib/products/display';

interface NextSectionProps {
  onOpenConsultation: () => void;
  lang?: Language;
  /** Données produit (template dynamique). */
  data?: ProductNext;
  /** Nom du produit courant : évite d'afficher « PXT Ultra » par défaut. */
  productTitle?: string;
}

export const NextSection: React.FC<NextSectionProps> = ({
  onOpenConsultation,
  lang = 'FR',
  data,
  productTitle,
}) => {
  // Navigation de série : nom et tagline viennent du PDF. Aucune série
  // inventée (« WK Series », « PXT Ultra ») : une carte sans donnée n'est pas
  // rendue, sinon elle mentirait sur le catalogue.
  const prevName = text(data?.prev?.name);
  const nextName = text(data?.next?.name);
  const prevTagline = text(data?.prev?.tagline);
  const nextTagline = text(data?.next?.tagline);
  const prevHref = text(data?.prev?.url) ?? '/web/products';
  const nextHref = text(data?.next?.url) ?? '/web/products';

  const seriesCards = [
    { key: 'prev', name: prevName, tagline: prevTagline, href: prevHref },
    { key: 'next', name: nextName, tagline: nextTagline, href: nextHref },
  ].filter((c) => Boolean(c.name));

  // Accroche CTA : celle du PDF, ou rien. Le texte EN n'existe pas dans la
  // source, il ne doit donc pas être inventé à partir du FR.
  const headline = text(data?.headline);
  const highlight = text(data?.headlineHighlight);
  const line1 = headline && highlight && headline.includes(highlight)
    ? headline.slice(0, headline.indexOf(highlight))
    : headline;
  const line2 = headline && highlight && headline.includes(highlight) ? highlight : '';

  // Libellé d'action du SITE quand le PDF n'en fournit pas.
  const ctaLabel =
    text(data?.cta) ?? (lang === 'FR' ? 'Démarrer un projet →' : 'Start a Project →');

  // Titre de repli : le nom du produit courant, jamais celui d'une autre série.
  const fallbackTitle = productTitle ?? '';

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
        {/* Navigation de série : une carte par série réellement nommée dans le PDF */}
        {seriesCards.length > 0 && (
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: seriesCards.length === 1 ? '1fr' : '1fr 1fr',
            gap: '24px',
          }}
        >
          {seriesCards.map((card) => (
            <a
              key={card.key}
              href={card.href}
              className="next-series-card"
              style={{
                display: 'block',
                border: '1px solid var(--dark-line, #1f1f1f)',
                padding: '34px 32px',
                textAlign: card.key === 'next' ? 'right' : 'left',
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
                  justifyContent: card.key === 'next' ? 'flex-end' : undefined,
                  gap: '6px',
                }}
              >
                {card.key === 'prev' ? (
                  <>
                    <span>&larr;</span>{' '}
                    {lang === 'FR' ? 'SÉRIE PRÉCÉDENTE' : 'PREVIOUS SERIES'}
                  </>
                ) : (
                  <>
                    {lang === 'FR' ? 'SÉRIE SUIVANTE' : 'NEXT SERIES'} <span>&rarr;</span>
                  </>
                )}
              </div>
              <div
                style={{
                  fontSize: 'clamp(22px, 2.2vw, 32px)',
                  fontWeight: 700,
                  color: 'var(--dark-text, #f5f4f0)',
                  letterSpacing: '-.01em',
                }}
              >
                {card.name}
              </div>
              {card.tagline && (
                <div
                  style={{
                    fontSize: '13px',
                    color: 'var(--dark-muted, #7a7a76)',
                    marginTop: '8px',
                  }}
                >
                  {card.tagline}
                </div>
              )}
            </a>
          ))}
        </div>
        )}

        {/* Call To Action Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
            borderTop: seriesCards.length > 0 ? '1px solid var(--dark-line, #1f1f1f)' : 'none',
            marginTop: seriesCards.length > 0 ? '72px' : 0,
            paddingTop: seriesCards.length > 0 ? '64px' : 0,
          }}
        >
          {(line1 || fallbackTitle) && (
          <h2
            style={{
              fontSize: 'clamp(34px, 3.6vw, 58px)',
              fontWeight: 700,
              letterSpacing: '-.02em',
              margin: 0,
              lineHeight: 1.06,
            }}
          >
            {line1 || fallbackTitle}
            {line2 && (
              <>
                <br />
                {line2}
              </>
            )}
          </h2>
          )}

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
