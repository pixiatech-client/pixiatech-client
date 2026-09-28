'use client';

import React from 'react';
import { LedCanvasText } from './LedCanvasText';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductHero } from '@/lib/products/types';
import { text } from '@/lib/products/display';

import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';

interface HeroSectionProps {
  onOpenQuote: () => void;
  /** Nom du produit courant. Requis : une page produit sans nom n'a pas de hero. */
  title?: string;
  lang?: Language;
  /** Image principale du produit (une seule source Firestore). Optionnelle. */
  image?: string;
  /** Données produit (template dynamique). Priorité : CMS ?? data. */
  data?: ProductHero;
  /** Série du produit (masthead PDF) : dernier fil d'Ariane. */
  series?: string;
  /**
   * Sections effectivement rendues plus bas sur la page. La sous-navigation
   * ne propose que des ancres existantes : un lien vers une section masquée
   * parce qu'elle est vide mènerait nulle part.
   */
  sections?: { id: string; label: string }[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenQuote,
  title: initialTitle,
  lang = 'FR',
  image,
  data,
  series,
  sections,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsHero = (pages[currentPageId]?.sections?.hero as Record<string, unknown>) || {};
  const activeLang = normalizeLang(lang);

  const breadcrumbAll = lang === 'FR' ? 'TOUS LES PRODUITS' : 'ALL PRODUCTS';
  // Fil d'Ariane : catégorie déclarée, sinon la série du produit.
  const breadcrumbCat =
    text(lang === 'FR' ? data?.breadcrumbCategoryFr : data?.breadcrumbCategoryEn) ??
    text(series);

  // Lecture CMS prioritaire avec support multilingue FR/EN
  const title = getCmsText(cmsHero, 'title', activeLang, text(data?.title) ?? initialTitle ?? '');
  const subtitle = getCmsText(cmsHero, 'subtitle', activeLang, text(data?.subtitle) ?? '');
  const quoteCta = getCmsText(
    cmsHero,
    'primaryCta',
    activeLang,
    text(data?.primaryCta) ?? (lang === 'FR' ? 'Demander un devis →' : 'Request Quote →')
  );
  const heroImage = (cmsHero.image as string) || (cmsHero.heroImage as string) || image;
  const secondaryCta = text(data?.secondaryCta);

  const tags = data?.tags?.length ? data.tags : [];
  const specs = (data?.specs ?? []).filter((s) => text(s.value) && text(s.label));

  const subnavItems = sections ?? [];

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
          {breadcrumbCat && (
            <>
              <span>/</span>
              <span style={{ color: 'var(--dark-text-2, #c9c7c1)' }}>{breadcrumbCat}</span>
            </>
          )}
        </div>

        {/* Dynamic Animated LED Matrix Canvas */}
        <div data-text-key="title" title="Cliquer pour éditer le titre">
          <LedCanvasText label={title} />
        </div>

        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-image-key="image"
            src={heroImage}
            alt={title}
            className="hero-product-img"
            style={{
              display: 'block',
              maxWidth: 'min(720px, 100%)',
              maxHeight: 420,
              margin: '0 auto',
              objectFit: 'contain',
              borderRadius: 12,
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

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
            {subtitle && (
              <div
                data-text-key="subtitle"
                style={{
                  fontSize: 'clamp(20px, 1.9vw, 28px)',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: 'var(--dark-text, #f5f4f0)',
                }}
              >
                {subtitle}
              </div>
            )}
            {tags.length > 0 && (
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
            )}
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              data-text-key="primaryCta"
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
            {secondaryCta && (
              <a className="btn btn-ghost" href="#specs" style={{ alignSelf: 'center' }}>
                {secondaryCta}
              </a>
            )}
          </div>
        </div>

        {/* Grille 4 cellules : uniquement si le PDF a fourni des couples
            valeur/libellé. Un gabarit vide ne produit pas de grille factice. */}
        {specs.length > 0 && (
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
              key={`${item.label}-${item.value}`}
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
        )}
      </div>

      {/* Sous-navigation : masquée si la page n'a qu'une seule section. */}
      {subnavItems.length > 0 && (
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
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleSubnavClick(e, `#${item.id}`)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
      )}
    </section>
  );
};
