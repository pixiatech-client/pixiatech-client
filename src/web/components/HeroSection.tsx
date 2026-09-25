'use client';

import React from 'react';
import { LedCanvasText } from './LedCanvasText';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductHero } from '@/lib/products/types';

interface HeroSectionProps {
  onOpenQuote: () => void;
  title?: string;
  lang?: Language;
  /** Données produit (template dynamique). Priorité : data ?? CMS ?? défaut. */
  data?: ProductHero;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenQuote,
  title: initialTitle = 'PXT Fine',
  lang = 'FR',
  data,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsHero = pages[currentPageId]?.sections?.hero || {};

  const breadcrumbAll = lang === 'FR' ? 'TOUS LES PRODUITS' : 'ALL PRODUCTS';
  const breadcrumbCat =
    (lang === 'FR' ? data?.breadcrumbCategoryFr : data?.breadcrumbCategoryEn) ||
    (lang === 'FR' ? 'ÉCRAN LED INTÉRIEUR' : 'INDOOR LED DISPLAY');
  const title = data?.title || (cmsHero.title as string) || initialTitle;
  const subtitle =
    data?.subtitle ||
    (cmsHero.subtitle as string) ||
    (lang === 'FR' ? 'Écran LED intérieur' : 'Indoor LED display');
  const quoteCta =
    data?.primaryCta ||
    (cmsHero.primaryCta as string) ||
    (lang === 'FR' ? 'Demander un devis →' : 'Request Quote →');

  const tags = data?.tags?.length
    ? data.tags
    : lang === 'FR'
      ? ['INTÉRIEUR', 'Corporate', 'Salle de contrôle', 'Retail', 'XR / VP']
      : ['INDOOR', 'Corporate', 'Control Room', 'Retail', 'XR / VP'];

  const specs = data?.specs?.length
    ? data.specs.map((s) => ({ value: s.value, label: s.label }))
    : [
        { value: '1.2–3.1 mm', label: lang === 'FR' ? 'PITCH PIXEL' : 'PIXEL PITCH' },
        { value: '800–1,500', label: lang === 'FR' ? 'LUMINOSITÉ · NITS' : 'BRIGHTNESS · NITS' },
        { value: '600×337.5 mm', label: lang === 'FR' ? 'CHÂSSIS' : 'CABINET' },
        { value: lang === 'FR' ? 'INTÉRIEUR' : 'INDOOR', label: lang === 'FR' ? 'ENVIRONNEMENT' : 'ENVIRONMENT' },
      ];

  const subnavItems = lang === 'FR'
    ? [
        { label: 'APERÇU', href: '#overview' },
        { label: 'CONCEPTION', href: '#design' },
        { label: 'POINTS CLÉS', href: '#features' },
        { label: 'SPÉCIFICATIONS', href: '#specs' },
        { label: 'PROJETS', href: '#fieldwork' },
      ]
    : [
        { label: 'OVERVIEW', href: '#overview' },
        { label: 'DESIGN', href: '#design' },
        { label: 'FEATURES', href: '#features' },
        { label: 'SPECIFICATIONS', href: '#specs' },
        { label: 'PROJECTS', href: '#fieldwork' },
      ];

  const handleSubnavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="theme-dark"
      style={{
        position: 'relative',
        padding: 'calc(var(--nav-h, 88px) + clamp(50px, 7vh, 90px)) 0 0',
        background: 'radial-gradient(110% 80% at 50% 0%, #101010 0%, #080808 60%)',
      }}
    >
      <div className="wrap">
        {/* Breadcrumb matching xeron.co */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '11px',
            letterSpacing: '.2em',
            color: 'var(--dark-muted, #7a7a76)',
            marginBottom: '40px',
            textTransform: 'uppercase',
          }}
        >
          <a href="/web/products" className="hov-acc" style={{ transition: 'color .2s' }}>
            {breadcrumbAll}
          </a>
          <span>/</span>
          <span style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>{breadcrumbCat}</span>
        </div>

        {/* Dynamic Animated LED Matrix Canvas */}
        <LedCanvasText label={title} />

        {/* Sub-header, Tags & Request Quote button matching xeron.co */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '32px',
            flexWrap: 'wrap',
            marginTop: '34px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'clamp(20px, 1.9vw, 28px)',
                fontWeight: 700,
                marginBottom: '10px',
                color: 'var(--dark-text, #f5f4f0)',
              }}
            >
              {subtitle}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`tag ${i === 0 ? 'on' : ''}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onOpenQuote}
              className="btn btn-solid"
              style={{
                padding: '16px 28px',
                textTransform: 'none',
                letterSpacing: '.06em',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {quoteCta}
            </button>
          </div>
        </div>

        {/* 4-Cell Specs Grid matching xeron.co .pd-spec4 */}
        <div
          className="pd-spec4"
          style={{
            display: 'grid',
            gap: '1px',
            background: 'var(--dark-line, #1f1f1f)',
            border: '1px solid var(--dark-line, #1f1f1f)',
            marginTop: '56px',
          }}
        >
          {specs.map((item) => (
            <div
              key={item.label}
              className="pd-spec-cell"
              style={{
                background: 'var(--black-2, #0b0b0a)',
                padding: '26px 24px',
              }}
            >
              <div
                className="pd-spec-v"
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--dark-text, #f5f4f0)',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  letterSpacing: '.2em',
                  color: 'var(--dark-muted, #7a7a76)',
                  marginTop: '8px',
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subnav matching xeron.co */}
      <div
        style={{
          borderTop: '1px solid var(--dark-line, #1f1f1f)',
          marginTop: '64px',
        }}
      >
        <div
          className="wrap subnav"
          style={{
            display: 'flex',
            gap: 'clamp(20px, 3vw, 44px)',
            overflowX: 'auto',
          }}
        >
          {subnavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleSubnavClick(e, item.href)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
