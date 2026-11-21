'use client';

import { useMemo, useState, useEffect } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { RevealRoot } from './RevealRoot';
import { INSIGHT_CHIPS, PIXIA_INSIGHTS } from '../pixiatech-data';
import type { Insight } from '../pixiatech-data';
import type { Language } from '../pixiatech-translations';
import { useI18n } from '@/lib/i18n';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText } from '@/lib/site-web/cms-i18n';
import { EditableWrapper } from '../cms/EditableWrapper';
import { Edit3, ArrowRight, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { MobileBottomSheet, useIsMobile } from '@/components/ui/bottom-sheet';
import type { InsightArticle } from '../data/insights-articles-content';

const CHIP_LABEL_FR: Record<string, string> = {
  All: 'Tous',
  'LED Technology': 'Technologie LED',
  Architecture: 'Architecture',
  DOOH: 'DOOH',
  'Corporate AV': 'AV Entreprise',
  Retail: 'Commerce',
  'Virtual Production': 'Production Virtuelle',
  Guides: 'Guides',
  'Case Studies': 'Études de cas',
};

const CATEGORY_FR: Record<string, string> = {
  GUIDE: 'GUIDE',
  'LED TECHNOLOGY': 'TECHNOLOGIE LED',
  COMPARISON: 'COMPARATIF',
  DOOH: 'DOOH',
  RETAIL: 'COMMERCE',
  'CORPORATE AV': 'AV ENTREPRISE',
  ARCHITECTURE: 'ARCHITECTURE',
  'VIRTUAL PRODUCTION': 'PRODUCTION VIRTUELLE',
};

function titleOf(a: Insight, lang: Language): string {
  return lang === 'FR' ? a.titleFr ?? a.title : a.title;
}

function readOf(read: string, lang: Language): string {
  return lang === 'FR' ? read.replace('MIN READ', 'MIN DE LECTURE') : read;
}

function chipLabel(c: string, lang: Language): string {
  return lang === 'FR' ? CHIP_LABEL_FR[c] ?? c : c;
}

function categoryLabel(category: string, lang: Language): string {
  if (lang !== 'FR') return category;
  const isFeatured = category.includes('— FEATURED');
  const prefix = category.includes('—') ? category.slice(0, category.indexOf('—')).trim() : category.trim();
  return `${CATEGORY_FR[prefix] ?? prefix}${isFeatured ? ' — À LA UNE' : ''}`;
}

export function PixiaInsightsPage() {
  const { locale } = useI18n();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  const { pages, setCurrentPageId, isAdmin, isEditing } = useCms();
  const [liveArticles, setLiveArticles] = useState<Insight[]>(PIXIA_INSIGHTS);

  useEffect(() => {
    setCurrentPageId('insights');
  }, [setCurrentPageId]);

  // Récupération des articles mis à jour en direct depuis l'API Firestore
  useEffect(() => {
    let mounted = true;
    async function loadFreshArticles() {
      try {
        const res = await fetch('/api/site-web/articles', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.articles && Array.isArray(data.articles) && mounted) {
            const mapped: Insight[] = data.articles.map((a: InsightArticle) => ({
              slug: a.slug,
              img: a.img,
              category: a.category,
              chip: a.chip,
              tag: a.tag,
              title: a.title,
              titleFr: a.titleFr,
              desc: a.desc,
              descFr: a.descFr,
              read: a.read,
              date: a.date,
              dateFr: a.dateFr,
              featured: a.featured,
            }));
            setLiveArticles(mapped);
          }
        }
      } catch (err) {
        console.warn('[InsightsPage] Erreur de chargement des articles:', err);
      }
    }
    loadFreshArticles();
    return () => {
      mounted = false;
    };
  }, []);

  const heroData = (pages['insights']?.sections?.insights_hero as Record<string, unknown>) || {};
  const featuredData = (pages['insights']?.sections?.insights_featured as Record<string, unknown>) || {};
  const gridData = (pages['insights']?.sections?.insights_grid as Record<string, unknown>) || {};

  const t = {
    eyebrow: getCmsText(heroData, 'eyebrow', lang, 'PIXIATECH / INSIGHTS'),
    h1Line1: getCmsText(heroData, 'h1Line1', lang, lang === 'FR' ? 'Notes sur la lumière,' : 'Notes on light,'),
    h1Line2: getCmsText(heroData, 'h1Line2', lang, lang === 'FR' ? "les pixels et l'espace." : 'pixels and space.'),
    lede: getCmsText(
      heroData,
      'lede',
      lang,
      lang === 'FR'
        ? "Guides, notes techniques et observations terrain de l'équipe d'ingénierie PixiaTech."
        : 'Guides, technical notes and field observations from the PixiaTech engineering team.'
    ),
  };

  const [chip, setChip] = useState('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
  const featured = liveArticles.find((a) => a.featured) ?? liveArticles[0];
  const grid = useMemo(() => liveArticles.filter((a) => !a.featured), [liveArticles]);
  const visible = chip === 'All' ? grid : grid.filter((a) => a.chip === chip);

  const featuredCategory = featured ? getCmsText(featuredData, 'featured_category', lang, categoryLabel(featured.category, lang)) : '';
  const featuredTitle = featured ? getCmsText(featuredData, 'featured_title', lang, titleOf(featured, lang)) : '';
  const featuredDesc = featured ? getCmsText(featuredData, 'featured_desc', lang, (lang === 'FR' ? featured.descFr ?? featured.desc : featured.desc) || '') : '';
  const featuredMeta = featured ? getCmsText(featuredData, 'featured_meta', lang, `${readOf(featured.read, lang)} · ${lang === 'FR' && featured.dateFr ? featured.dateFr : featured.date}`) : '';
  const featuredImg = featured ? ((featuredData['featured_image'] as string) || (featuredData['img'] as string) || featured.img) : '';

  return (
    <RevealRoot className="xer-site" style={{ background: 'var(--paper)' }}>
      <PixiaHeader />
      <main>
        <section className="section-hero theme-light" style={{ color: 'var(--ink)' }}>
          <div className="wrap">
            {/* 1. En-tête éditorial */}
            <EditableWrapper sectionKey="insights_hero" sectionLabel="Ressources — En-tête">
              <div className="eyebrow" data-text-key="eyebrow" data-reveal="true">{t.eyebrow}</div>
              <h1 className="display" data-reveal="true" style={{ marginBottom: 20, color: 'var(--ink)' }}>
                <span data-text-key="h1Line1">{t.h1Line1}</span>
                <br />
                <span data-text-key="h1Line2">{t.h1Line2}</span>
              </h1>
              <p className="lede" data-reveal="true" data-text-key="lede" style={{ marginBottom: 64, maxWidth: 560 }}>
                {t.lede}
              </p>
            </EditableWrapper>

            {/* 2. Filtres : chips sur desktop, Bottom Sheet sur mobile */}
            <EditableWrapper sectionKey="insights_filter" sectionLabel="Ressources — Filtres & Catégories">
              {isMobile ? (
                <div className="mb-16 flex items-center justify-between gap-3 border-y border-[color:var(--line)] py-4">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="flex min-h-[48px] items-center gap-2 rounded-xl border border-[#c9c7c2] px-4 text-xs font-bold uppercase tracking-widest"
                    aria-haspopup="dialog"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {lang === 'FR' ? 'Filtrer les ressources' : 'Filter resources'}
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                    {chipLabel(chip, lang)}
                  </span>
                </div>
              ) : (
                <div
                  data-reveal="true"
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    borderTop: '1px solid var(--line)',
                    borderBottom: '1px solid var(--line)',
                    padding: '20px 0',
                    marginBottom: 64,
                  }}
                >
              {INSIGHT_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip${chip === c ? ' on' : ''}`}
                  onClick={() => setChip(c)}
                  style={{
                    minHeight: 44,
                    fontSize: 11,
                    letterSpacing: '.1em',
                    color: chip === c ? 'var(--paper)' : 'var(--body)',
                    background: chip === c ? 'var(--ink)' : 'transparent',
                    borderColor: chip === c ? 'var(--ink)' : '#c9c7c2',
                  }}
                >
                  {chipLabel(c, lang)}
                </button>
              ))}
                </div>
              )}

              <MobileBottomSheet
                open={filtersOpen && isMobile}
                onClose={() => setFiltersOpen(false)}
                title={lang === 'FR' ? 'Catégories' : 'Categories'}
                tone="light"
                footer={
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="mb-[max(0px,env(safe-area-inset-bottom))] h-12 w-full rounded-xl bg-[color:var(--ui-accent)] text-sm font-bold text-black"
                  >
                    {lang === 'FR' ? 'Voir les articles' : 'View articles'}
                  </button>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {INSIGHT_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`chip${chip === c ? ' on' : ''}`}
                  onClick={() => setChip(c)}
                  style={{
                    minHeight: 44,
                    fontSize: 11,
                    letterSpacing: '.1em',
                    color: chip === c ? 'var(--paper)' : 'var(--body)',
                    background: chip === c ? 'var(--ink)' : 'transparent',
                    borderColor: chip === c ? 'var(--ink)' : '#c9c7c2',
                  }}
                >
                  {chipLabel(c, lang)}
                </button>
              ))}
                </div>
              </MobileBottomSheet>
            </EditableWrapper>

            {/* 3. Article À La Une */}
            {featured && (
              <EditableWrapper sectionKey="insights_featured" sectionLabel="Ressources — Article à la Une">
                <div style={{ position: 'relative', marginBottom: 96 }}>
                  {isAdmin && isEditing && (
                    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                      <a
                        href={`/web/insights/${featured.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#080808]/90 text-[color:var(--ui-accent)] border border-[color:var(--ui-accent)] rounded-lg text-xs font-mono font-bold hover:bg-[color:var(--ui-accent)] hover:text-[#080808] transition-all shadow-xl"
                        title="Ouvrir la page de cet article pour modifier son contenu complet"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Éditer l’article complet</span>
                      </a>
                    </div>
                  )}

                  <a
                    className="art g-lead"
                    href={isEditing ? undefined : `/web/insights/${featured.slug}`}
                    onClick={(e) => {
                      if (isEditing) e.preventDefault();
                    }}
                    data-reveal="true"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr',
                      gap: 'clamp(28px,4vw,64px)',
                      alignItems: 'end',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      className="art-lead-media"
                      style={{ position: 'relative', height: 'min(64vh,620px)', overflow: 'hidden' }}
                    >
                      <div className="art-img" style={{ position: 'absolute', inset: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          data-image-key="featured_image"
                          className="slot-img"
                          src={featuredImg}
                          alt={featuredTitle}
                        />
                      </div>
                    </div>
                    <div>
                      <div
                        data-text-key="featured_category"
                        style={{ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--accent)', marginBottom: 16 }}
                      >
                        {featuredCategory}
                      </div>
                      <div
                        data-text-key="featured_title"
                        className="art-t pretty"
                        style={{
                          fontSize: 'clamp(30px,2.8vw,44px)',
                          fontWeight: 700,
                          lineHeight: 1.1,
                          letterSpacing: '-.015em',
                          marginBottom: 18,
                        }}
                      >
                        {featuredTitle}
                      </div>
                      {featuredDesc && (
                        <p
                          data-text-key="featured_desc"
                          className="pretty"
                          style={{ margin: '0 0 24px', fontSize: 16, lineHeight: 1.6, color: 'var(--body)' }}
                        >
                          {featuredDesc}
                        </p>
                      )}
                      <div
                        data-text-key="featured_meta"
                        style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--muted)' }}
                      >
                        {featuredMeta}
                      </div>
                    </div>
                  </a>
                </div>
              </EditableWrapper>
            )}

            {/* 4. Grille d'articles */}
            <EditableWrapper sectionKey="insights_grid" sectionLabel="Ressources — Grille d'Articles">
              <div
                data-reveal-group="true"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))',
                  gap: '32px 28px',
                }}
              >
                {visible.map((a) => {
                  const cardCat = getCmsText(gridData, `card_${a.slug}_cat`, lang, categoryLabel(a.category, lang));
                  const cardTitle = getCmsText(gridData, `card_${a.slug}_title`, lang, titleOf(a, lang));
                  const cardMeta = getCmsText(gridData, `card_${a.slug}_meta`, lang, `${readOf(a.read, lang)} · ${lang === 'FR' && a.dateFr ? a.dateFr : a.date}`);
                  const cardImg = (gridData[`card_${a.slug}_image`] as string) || a.img;

                  return (
                    <div key={a.slug} style={{ position: 'relative' }}>
                      {isAdmin && isEditing && (
                        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                          <a
                            href={`/web/insights/${a.slug}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#080808]/90 text-[color:var(--ui-accent)] border border-[color:var(--ui-accent)] rounded text-[11px] font-mono font-bold hover:bg-[color:var(--ui-accent)] hover:text-[#080808] transition-all shadow-md"
                            title={`Éditer l'article « ${cardTitle} »`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Éditer</span>
                          </a>
                        </div>
                      )}

                      <a
                        className="art"
                        href={isEditing ? undefined : `/web/insights/${a.slug}`}
                        onClick={(e) => {
                          if (isEditing) e.preventDefault();
                        }}
                        data-reveal="true"
                        style={{ color: 'var(--ink)', textDecoration: 'none', display: 'block' }}
                      >
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
                            <div className="art-img" style={{ position: 'absolute', inset: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                data-image-key={`card_${a.slug}_image`}
                                className="slot-img"
                                src={cardImg}
                                alt={cardTitle}
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          data-text-key={`card_${a.slug}_cat`}
                          style={{ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--accent)', marginBottom: 10 }}
                        >
                          {cardCat}
                        </div>
                        <div
                          data-text-key={`card_${a.slug}_title`}
                          className="art-t pretty"
                          style={{
                            fontSize: 23,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            letterSpacing: '-.01em',
                            marginBottom: 12,
                          }}
                        >
                          {cardTitle}
                        </div>
                        <div
                          data-text-key={`card_${a.slug}_meta`}
                          style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--muted)' }}
                        >
                          {cardMeta}
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </EditableWrapper>
          </div>
        </section>
      </main>
      <PixiaFooter lang={lang} />
    </RevealRoot>
  );
}
