'use client';

import React from 'react';
import { DotMatrixSignButton } from './DotMatrixSignButton';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductHero } from '@/lib/products/types';
import { text } from '@/lib/products/display';

import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  onOpenQuote: () => void;
  /** Nom du produit courant. Requis : une page produit sans nom n'a pas de hero. */
  title?: string;
  lang?: Language;
  /** Image principale du produit (une seule source Firestore). Optionnelle. */
  image?: string;
  /** Données produit (template dynamique). Priorité : CMS ?? data. */
  data?: ProductHero;
  /**
   * Le produit affiche ses photos dans la première section d'aperçu, juste sous
   * le grand titre. Le hero ne doit donc pas rejouer la même image à cet
   * endroit : elle y serait dupliquée. `WebPage` conserve le comportement
   * historique (false par défaut, la photo s'affiche dans le hero).
   */
  productPhotosInOverview?: boolean;
  /** Série du produit (masthead PDF) : dernier fil d'Ariane. */
  series?: string;
  /** Gamme du produit (ex. PXT AIR, PXT FINE) affichée dans le panneau matrice LED. */
  rangeName?: string;
  /**
   * Nom faisant autorité, fourni uniquement par la fiche produit : il vient
   * de la donnée produit (Firestore/CMS) et remplace toute surcharge de titre
   * stockée sur la page CMS (les clones pouvaient conserver un ancien titre).
   * Les autres pages utilisant le hero ne le passent pas : leur comportement
   * CMS reste inchangé.
   */
  authoritativeTitle?: string;
  /**
   * Callback pour déclencher le téléchargement de la fiche technique en PDF.
   * Fourni uniquement depuis la page produit `/web/product/[slug]`.
   * Si absent, le bouton PDF n'est pas rendu.
   */
  onDownloadPdf?: () => void;
  /** Indique si l'export PDF est en cours (affichage du spinner). */
  pdfExporting?: boolean;
  /**
   * Page CMS à lire pour ce Hero. Fourni par la fiche produit uniquement :
   * évite le premier rendu avec `currentPageId='home'`. Les autres pages ne
   * le passent pas et conservent leur comportement historique.
   */
  cmsPageId?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenQuote,
  title: initialTitle,
  lang = 'FR',
  image,
  data,
  series,
  rangeName,
  authoritativeTitle,
  productPhotosInOverview = false,
  onDownloadPdf,
  pdfExporting = false,
  cmsPageId,
}) => {
  const { pages, currentPageId } = useCms();
  const heroPageId = cmsPageId ?? currentPageId;
  const cmsHero = (pages[heroPageId]?.sections?.hero as Record<string, unknown>) || {};
  const activeLang = normalizeLang(lang);

  const breadcrumbAll = lang === 'FR' ? 'TOUS LES PRODUITS' : 'ALL PRODUCTS';
  // Fil d'Ariane : catégorie déclarée, sinon la série du produit.
  const breadcrumbCat =
    text(lang === 'FR' ? data?.breadcrumbCategoryFr : data?.breadcrumbCategoryEn) ??
    text(series);

  // Lecture CMS prioritaire avec support multilingue FR/EN
  const title =
    authoritativeTitle ??
    getCmsText(cmsHero, 'title', activeLang, initialTitle || text(data?.title) || '');
  const subtitle = getCmsText(cmsHero, 'subtitle', activeLang, text(data?.subtitle) ?? '');
  const signBrand = getCmsText(cmsHero, 'signBrand', activeLang, 'PIXIATECH');
  const signNote = getCmsText(cmsHero, 'signNote', activeLang, subtitle);
  const quoteCta = getCmsText(
    cmsHero,
    'primaryCta',
    activeLang,
    text(data?.primaryCta) ?? (lang === 'FR' ? 'Demander un devis →' : 'Request Quote →')
  );
  // Quand le produit porte ses photos dans la première section d'aperçu, le
  // hero s'abstient : le titre reste suivi du sous-titre / tags / CTA, et les
  // deux images apparaissent exactement une fois, dans la bonne zone.
  const heroImage = productPhotosInOverview
    ? undefined
    : (cmsHero.image as string) || (cmsHero.heroImage as string) || image;
  const secondaryCta = text(data?.secondaryCta);

  const tags = data?.tags?.length ? data.tags : [];
  const specs = (data?.specs ?? []).filter((s) => text(s.value) && text(s.label));

  // La navigation interne vit désormais dans le header principal
  // (`PixiaHeader` + `productSections`) : une seule nav, toujours en haut,
  // sur la fiche produit comme sur la page CMS générique.

  return (
    <section
      id="hero"
      className="theme-dark"
      style={{
        position: 'relative',
        // Sur les fiches produit, `<main>` porte déjà la hauteur du header :
        // `--product-hero-top` y vaut 0. Ailleurs, le repli historique est
        // conservé à l'identique (aucune autre page n'est modifiée).
        padding: 'var(--product-hero-top, calc(var(--nav-h, 88px) + clamp(24px, 4vh, 56px))) 0 0',
        background: 'radial-gradient(110% 80% at 50% 0%, #101010 0%, #080808 60%)',
      }}
    >
      <div className="wrap">
        {/* Breadcrumb */}
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

        {/* Le panneau matrice LED affiche la gamme du produit (rangeName > series > title). */}
        <div
          data-text-key="title"
          data-cms-group="true"
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
          title="Cliquer pour sélectionner / redimensionner le panneau"
        >
          <h1 className="sr-only">{title}</h1>
          <DotMatrixSignButton
            label={text(rangeName) || text(series) || title}
            done={text(rangeName) || text(series) || title}
            brand={signBrand}
            note={signNote}
            noteDone={signNote}
          />
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

        {/* Sub-header, Tags & Request Quote button */}
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
              className={`btn btn-solid ${styles.primaryCta}`}
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
              <a className={`btn btn-ghost ${styles.datasheetCta}`} href="#specs" style={{ alignSelf: 'center' }}>
                {secondaryCta}
              </a>
            )}
            {onDownloadPdf && (
              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={pdfExporting}
                className="btn btn-ghost"
                data-cms-ui="true"
                style={{
                  alignSelf: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: pdfExporting ? 0.65 : 1,
                  cursor: pdfExporting ? 'wait' : 'pointer',
                  fontSize: '12px',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}
                title={
                  lang === 'FR'
                    ? 'Télécharger la fiche technique au format PDF'
                    : 'Download technical datasheet as PDF'
                }
              >
                {pdfExporting ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
                <span>
                  {pdfExporting
                    ? (lang === 'FR' ? 'Génération…' : 'Generating…')
                    : (lang === 'FR' ? 'Fiche Technique PDF' : 'Download PDF')
                  }
                </span>
              </button>
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

    </section>
  );
};
