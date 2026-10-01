'use client';

import React, { useRef, useState, useEffect } from 'react';
import { SpecModel, SpecValue } from '../types';
import { Language } from '../data/translations';
import { shopLinkForVariant } from '@/lib/products/types';
import { specRowHasValue } from '@/lib/products/display';
import type { ProductShopLinks, ProductSpecs, ProductSpecModel } from '@/lib/products/types';

interface SpecsSectionProps {
  /**
   * Ouverture de la fiche technique PDF d'une variante.
   *
   * PLUS UTILISÉE par ce tableau : ce bouton est devenu « Acheter le
   * produit » (il pointe vers la boutique, pas vers un PDF), donc la
   * matrice n'a plus de déclencheur de fiche technique. La prop reste
   * déclarée, optionnelle et ignorée, pour que `ProductPageTemplate`
   * conserve son câblage tel quel : la modale reste atteignable par un
   * autre chemin sans que la section ait à être refactorisée.
   */
  onSelectDatasheet?: (model: SpecModel) => void;
  lang?: Language;
  /** Matrice produit (template dynamique). */
  specs?: ProductSpecs;
  /**
   * Liens boutique par variante, indexés par nom de modèle. Donnée d'admin :
   * une variante sans lien (clé absente ou URL rejetée à la normalisation)
   * n'affiche AUCUN bouton — jamais de lien vide ni de `href="#"`.
   */
  shopLinks?: ProductShopLinks;
}

function toSpecModel(model: ProductSpecModel): SpecModel {
  const specs: Record<string, SpecValue> = {};
  for (const [key, value] of Object.entries(model.specs || {})) {
    specs[key] = typeof value === 'string' ? { v: value } : value;
  }
  return { name: model.name, tag: model.tag || 'DATASHEET', specs };
}

/**
 * Neutralise un libellé dupliqué À L'AFFICHAGE UNIQUEMENT.
 *
 * Certains PDF dessinent deux fois le même texte au même emplacement ; le
 * parser joint alors les deux fragments sans séparateur et le libellé arrive
 * sous la forme « CERTIFICATIONSCERTIFICATIONS ».
 *
 * Ni le PDF, ni le parser, ni les données stockées ne sont modifiés : seule la
 * chaîne présentée est normalisée. La règle est volontairement étroite — le
 * libellé entier doit être le doublon EXACT d'un même fragment d'au moins
 * 3 caractères — donc aucun libellé légitime (« Pixel pitch », « IP rating »,
 * « Certifications ») n'est jamais réécrit.
 */
function collapseDoubledLabel(label: string): string {
  const text = label.trim();
  if (text.length % 2 !== 0) return text;
  const half = text.length / 2;
  if (half < 3) return text;
  const first = text.slice(0, half);
  if (first !== text.slice(half)) return text;
  return /\p{L}/u.test(first) ? first : text;
}

export const SpecsSection: React.FC<SpecsSectionProps> = ({ lang = 'FR', specs, shopLinks }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Modèles du produit courant, sans repli global : la matrice PXT Fine qui
  // vivait dans `specs-data.json` s'affichait pour tout produit sans matrice.
  // Ce fichier a été supprimé ; une matrice absente masque la section.
  const models: SpecModel[] = (specs?.models ?? []).map(toSpecModel);

  // Une ligne n'est affichée que si au moins un modèle porte une valeur réelle
  // pour elle. Le template maître définit la structure ; le PDF ne fournit que
  // des valeurs. Une ligne dont toutes les cellules sont absentes n'est donc
  // pas une donnée manquante à signaler, elle n'a rien à dire : l'afficher
  // produirait un tableau de libellés suivis de tirets, qui donne l'illusion
  // d'une caractéristique relevée alors qu'aucune valeur n'existe.
  //
  // `specRowHasValue` porte la règle (et « pas de valeur »), au même endroit
  // que `text()`. Ne pas la redéfinir ici : deux définitions du tiret
  // placeholder finissent par divergir, et l'une des deux finit par laisser
  // passer des lignes vides.
  const hasValueFor = (key: string) => specRowHasValue(models, key);

  // Groupes : structure du master (libellé + lignes), filtrée sur la présence
  // réelle d'une valeur. À défaut de groupes, les lignes sont dérivées de
  // l'union des clés présentes dans les modèles.
  const groups = (() => {
    if (specs?.groups?.length) {
      return specs.groups
        .map((g) => ({
          label: g.label,
          rows: g.rows
            .filter((r) => hasValueFor(r.key))
            .map((r) => ({ key: r.key, label: r.label })),
        }))
        .filter((g) => g.rows.length > 0);
    }
    const keys = new Set<string>();
    for (const model of models) {
      for (const key of Object.keys(model.specs ?? {})) keys.add(key);
    }
    const rows = Array.from(keys)
      .filter((key) => hasValueFor(key))
      .map((key) => ({ key, label: key }));
    return rows.length > 0 ? [{ label: '', rows }] : [];
  })();

  const modelCount = String(models.length).padStart(2, '0');

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [models.length]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };


  return (
    <section id="specs" className="section theme-dark">
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
          {lang === 'FR' ? '04 / SPÉCIFICATIONS' : '04 / SPECIFICATIONS'}
        </div>

        {/* Title */}
        <h2 className="h2" style={{ marginBottom: '56px' }}>
          {lang === 'FR' ? 'Données techniques.' : 'Technical data.'}
        </h2>

        {/* Description — supprimée : elle nommait la « plateforme Fine »,
            donc la matrice PXT Fine, sur la page de n'importe quel produit. */}

        {/* Controls: Model Count & Scroll Arrows */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              letterSpacing: '.22em',
              color: 'var(--dark-muted, #7a7a76)',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: '#C3F910', fontWeight: 700 }}>{modelCount}</span>{' '}
            {lang === 'FR' ? 'MODÈLES — DÉFILEMENT HORIZONTAL' : 'MODELS — SCROLL HORIZONTALLY'}{' '}
            <span style={{ color: '#C3F910' }}>→</span>
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Previous models"
              disabled={!canScrollLeft}
              style={{
                width: '44px',
                height: '44px',
                border: `1px solid ${canScrollLeft ? 'rgba(195, 249, 16, 0.4)' : 'var(--dark-line-3, #2a2a2a)'}`,
                background: 'transparent',
                color: canScrollLeft ? '#C3F910' : '#3A3A3A',
                cursor: canScrollLeft ? 'pointer' : 'default',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s ease',
              }}
              onMouseEnter={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.borderColor = '#C3F910';
                  e.currentTarget.style.background = 'rgba(195, 249, 16, 0.12)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(195, 249, 16, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollLeft) {
                  e.currentTarget.style.borderColor = 'rgba(195, 249, 16, 0.4)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Next models"
              disabled={!canScrollRight}
              style={{
                width: '44px',
                height: '44px',
                border: `1px solid ${canScrollRight ? 'rgba(195, 249, 16, 0.4)' : 'var(--dark-line-3, #2a2a2a)'}`,
                background: 'transparent',
                color: canScrollRight ? '#C3F910' : '#3A3A3A',
                cursor: canScrollRight ? 'pointer' : 'default',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .2s ease',
              }}
              onMouseEnter={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.borderColor = '#C3F910';
                  e.currentTarget.style.background = 'rgba(195, 249, 16, 0.12)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(195, 249, 16, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (canScrollRight) {
                  e.currentTarget.style.borderColor = 'rgba(195, 249, 16, 0.4)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div style={{ position: 'relative' }}>
          <div
            ref={scrollRef}
            style={{
              overflowX: 'auto',
              borderTop: '1px solid var(--dark-line, #1f1f1f)',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#2A2A2A transparent',
            }}
          >
            {/* Header Row: MODEL and 9 Models */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--dark-line, #1f1f1f)',
                background: 'var(--black-2, #0b0b0a)',
                minWidth: 'max-content',
              }}
            >
              <div
                className="spec-key"
                style={{
                  flex: '0 0 240px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  borderRight: '1px solid var(--dark-line, #1f1f1f)',
                  boxShadow: '12px 0 24px -8px rgba(8, 8, 8, 0.9)',
                  background: 'var(--black-2, #0b0b0a)',
                  padding: '22px 14px',
                  fontSize: '11px',
                  letterSpacing: '.2em',
                  color: 'var(--dark-muted, #7a7a76)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'FR' ? 'MODÈLE' : 'MODEL'}
              </div>

              {models.map((model) => {
                // Lien boutique de CETTE variante. La règle de visibilité vit
                // dans `shopLinkForVariant` : chaîne vide = aucun bouton, donc
                // jamais de lien mort ni de `#` affiché au visiteur.
                const shopUrl = shopLinkForVariant(shopLinks, model.name);
                const shopIsExternal = shopUrl !== '' && !shopUrl.startsWith('/');
                return (
                <div
                  key={model.name}
                  className="spec-head"
                  style={{
                    flex: '0 0 280px',
                    padding: '22px 18px',
                    borderLeft: '1px solid var(--dark-line-2, #161615)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      letterSpacing: '-.01em',
                      lineHeight: 1.25,
                      overflowWrap: 'anywhere',
                      color: 'var(--dark-text, #f5f4f0)',
                    }}
                  >
                    {model.name}
                  </div>
                  {/* BOUTON ACHAT — unique bouton de la cellule.
                      Règle de rendu : strictement `shopUrl &&`. Aucune
                      variante ne peut faire apparaître ce bouton par son
                      simple fait d'exister : il faut une URL valide rangée
                      dans `product.shopLinks[model.name]`. Pas de `href=""`,
                      pas de `#`, pas de placeholder, pas de lien par défaut.
                      `href` reçoit l'URL ENREGISTRÉE, telle quelle : rien
                      n'est reconstruit ici. Un lien interne garde la
                      navigation du site ; un lien externe s'ouvre en
                      nouvel onglet avec `rel="noopener noreferrer"`. */}
                  {shopUrl && (
                    <a
                      href={shopUrl}
                      {...(shopIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        border: '1px solid #C3F910',
                        padding: '6px 12px',
                        fontSize: '10px',
                        letterSpacing: '.16em',
                        color: '#000000',
                        background: '#C3F910',
                        cursor: 'pointer',
                        transition: 'all .2s ease',
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d4ff2e';
                        e.currentTarget.style.borderColor = '#d4ff2e';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#C3F910';
                        e.currentTarget.style.borderColor = '#C3F910';
                      }}
                    >
                      {lang === 'FR' ? 'ACHETER LE PRODUIT' : 'BUY THE PRODUCT'}
                    </a>
                  )}
                </div>
                );
              })}
            </div>

            {/* Spec Groups */}
            {groups.map((grp, grpIdx) => (
              // La position est partie de la clé : deux groupes de même libellé
              // (matrice saisie à la main) donnaient la même clé React, et
              // React duplique ou omet alors des enfants.
              <div key={`${grp.label || 'grp'}::${grpIdx}`}>
                {/* En-tête de groupe — absent quand les lignes n'ont pas de
                    libellé de groupe (matrice saisie sans structure).

                    Séparation de catégorie : filet vert 1px sur toute la largeur
                    du tableau + voile vert très léger (≤ 7 % d'opacité) qui
                    s'estompe vers la droite. Vert en LITTÉRAL `#C3F910` — celui
                    de `web.css` et de la fiche technique — et non `var(--accent)`,
                    que la palette du back-office réécrit : aucune couleur
                    inventée. Les largeurs de colonnes (240px / 280px) sont
                    inchangées : rien ne peut déformer la matrice, quel que soit
                    le nombre de variantes. */}
                {grp.label && (
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(195, 249, 16, 0.26)',
                    backgroundColor: '#0A0A09',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(195, 249, 16, 0.075) 0%, rgba(195, 249, 16, 0.03) 26%, rgba(195, 249, 16, 0) 62%)',
                    minWidth: 'max-content',
                  }}
                >
                  <div
                    className="spec-key"
                    style={{
                      flex: '0 0 240px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      borderRight: '1px solid var(--dark-line, #1f1f1f)',
                      // Filet vert vertical de 2px : rappel du motif déjà présent
                      // sur le site (`.fstage-step`). En `inset`, donc aucun
                      // décalage de mise en page.
                      //
                      // VERT EN LITTÉRAL, et non `var(--accent)`. La palette du
                      // back-office réécrit `--accent` via un `html:root` injecté
                      // à l'exécution (theme-utils), de spécificité supérieure :
                      // le libellé suivait la couleur du CMS — souvent claire,
                      // donc blanche sur fond noir — alors que les filets, eux,
                      // restaient verts. `#C3F910` est le vert Pixiatech, celui
                      // de `web.css` et de la fiche technique.
                      boxShadow: 'inset 2px 0 0 #C3F910',
                      // Fond opaque SOUS le voile vert : la colonne reste
                      // masquante pendant le défilement horizontal.
                      backgroundColor: '#0A0A09',
                      backgroundImage:
                        'linear-gradient(90deg, rgba(195, 249, 16, 0.11) 0%, rgba(195, 249, 16, 0.045) 100%)',
                      padding: '15px 14px',
                      fontSize: '10.5px',
                      letterSpacing: '.26em',
                      // Même vert littéral que ci-dessus : GENERAL, PHYSIQUE,
                      // PHYSICAL, OPTIQUE, OPTICAL… partagent ce seul rendu, donc
                      // quelle que soit la langue du libellé du PDF, le titre de
                      // catégorie reste vert Pixiatech — jamais blanc.
                      color: '#C3F910',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {collapseDoubledLabel(grp.label)}
                  </div>
                  <div style={{ flex: 1, minWidth: '280px' }} />
                </div>
                )}

                {/* Group Rows */}
                {grp.rows.map((row) => (
                  <div
                    key={row.key}
                    className="spec-row"
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--dark-line-2, #161615)',
                      minWidth: 'max-content',
                      transition: 'background .2s ease',
                    }}
                  >
                    {/* Sticky Key Column */}
                    <div
                      className="spec-key"
                      style={{
                        flex: '0 0 240px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        borderRight: '1px solid var(--dark-line, #1f1f1f)',
                        boxShadow: '12px 0 24px -8px rgba(8, 8, 8, 0.9)',
                        background: 'var(--black, #080808)',
                        padding: '16px 14px',
                        fontSize: '11px',
                        letterSpacing: '.16em',
                        color: 'var(--dark-muted, #7a7a76)',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {collapseDoubledLabel(row.label)}
                    </div>

                    {/* Model Value Columns */}
                    {models.map((model) => {
                      const specItem = (model.specs as Record<string, { v: string; calc: boolean }>)[row.key];
                      // Une cellule réellement absente reste VIDE : le tiret est
                      // le placeholder du gabarit pour « pas de donnée », l'écrire
                      // ici enverrait le message inverse — une valeur relevée et
                      // trouvée vide. La ligne est affichée parce qu'AUTRE
                      // variante la renseigne ; ce modèle précis, lui, n'en a pas.
                      const val = specItem?.v ?? '';
                      return (
                        <div
                          key={model.name + row.key}
                          className="spec-val"
                          style={{
                            flex: '0 0 280px',
                            padding: '16px 18px',
                            fontSize: '14.5px',
                            fontWeight: 500,
                            borderLeft: '1px solid var(--dark-line-2, #161615)',
                            color: '#F5F4F0',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
