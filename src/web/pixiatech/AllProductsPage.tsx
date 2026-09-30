'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { RevealRoot } from './RevealRoot';
import { ConsultationModal } from './ConsultationModal';
import { BackToTopButton } from './BackToTopButton';
import { Language } from '../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { useI18n } from '@/lib/i18n';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import type { ProductCategory, ProductCategoryGroup, ProductRecord } from '@/lib/products/types';
import { categoryDisplayName, groupDisplayName, productCategoryIds } from '@/lib/products/types';
import { trackProductClick, setLang as trackerSetLang } from '@/lib/analytics/tracker';

interface AllProductsPageProps {
  onOpenConsultation?: () => void;
}

function envBadge(env: string, lang: Language): string {
  if (lang !== 'FR' || env === 'IN / OUT') {
    return env === 'IN / OUT' && lang === 'FR' ? 'INT / EXT' : env;
  }
  return env === 'INDOOR' ? 'INTÃ‰RIEUR' : 'EXTÃ‰RIEUR';
}

// Les filtres ENVIRONMENT / APPLICATION sont construits dynamiquement depuis
// la collection Firestore `product_categories` (taxonomie CMS). Chaque produit
// reel porte lui-meme ses IDs de categories (productCategoryIds).

interface CatalogCard {
  key: string;
  slug: string;
  name: string;
  isReal: boolean;
  img: string | null;
  imgBack: string | null;
  env: string;
  apps: string[];
  /** IDs de catÃ©gories (taxonomie CMS) â€” utilisÃ©s pour le filtrage. */
  categoryIds: string[];
  sub: string;
  pitch: string;
  brightness: string;
  cabinet: string;
}

function mainImageOf(p: ProductRecord | null): string | null {
  return p?.media?.photos?.find((ph) => ph.url)?.url ?? p?.hero?.image ?? null;
}

function envLabel(e?: ProductRecord['environment']): string {
  switch (e) {
    case 'outdoor':
      return 'OUTDOOR';
    case 'both':
      return 'IN / OUT';
    case 'showcase':
      return 'INDOOR';
    default:
      return 'INDOOR';
  }
}

function subOf(p: ProductRecord, lang: Language): string {
  return lang === 'FR'
    ? p.description?.shortFr ?? p.hero?.subtitle ?? ''
    : p.description?.shortEn ?? p.hero?.subtitle ?? '';
}

// RÃ©solution sÃ©mantique (jamais par position) : champ canonique explicite
// d'abord, puis hero.specs par label (docs crÃ©Ã©s avant les champs explicites).
// Une caractÃ©ristique absente affiche Â« â€” Â» â€” aucun remplacement croisÃ©.
const SPEC_KIND: Record<'pitch' | 'brightness' | 'cabinet', RegExp> = {
  pitch: /^\s*pitch\s*pixel|^\s*pixel\s*pitch/i,
  brightness: /^\s*luminos|^\s*brightness/i,
  cabinet: /^\s*ch[Ã¢a]ssis|^\s*cabinet/i,
};

function specValue(p: ProductRecord, kind: 'pitch' | 'brightness' | 'cabinet'): string {
  const explicit =
    kind === 'pitch'
      ? p.pixelPitch
      : kind === 'brightness'
        ? p.brightness
        : p.cabinetDimensions;
  if (explicit) return explicit;
  const entry = (p.hero?.specs ?? []).find((s) => SPEC_KIND[kind].test(s.label ?? ''));
  return entry?.value ?? 'â€”';
}

function realCard(p: ProductRecord, lang: Language): CatalogCard {
  return {
    key: `product-${p.slug}`,
    slug: p.slug,
    name: p.name,
    isReal: true,
    img: mainImageOf(p),
    imgBack: p.hero?.hoverImage ?? null,
    env: envLabel(p.environment),
    apps: p.hero?.tags ?? [],
    categoryIds: productCategoryIds(p),
    sub: subOf(p, lang),
    pitch: specValue(p, 'pitch'),
    brightness: specValue(p, 'brightness'),
    cabinet: specValue(p, 'cabinet'),
  };
}

export const AllProductsPage: React.FC<AllProductsPageProps> = (props) => (
  <ProductsProvider>
    <AllProductsView {...props} />
  </ProductsProvider>
);

function AllProductsView({
  onOpenConsultation,
}: AllProductsPageProps) {
  const router = useRouter();
  const { products, categories, groups } = useProducts();
  // Meme source de langue que le header (contexte i18n global, persiste).
  const { locale } = useI18n();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  useEffect(() => {
    trackerSetLang(locale);
  }, [locale]);
  const [consultOpen, setConsultOpen] = useState(false);
  /** Filtre actif par groupe = ID de catÃ©gorie CMS (ou 'All'). */
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);
  const { setCurrentPageId } = useCms();

  useEffect(() => {
    setCurrentPageId('products');
  }, [setCurrentPageId]);

  const handleOpenConsultation = () => {
    if (onOpenConsultation) {
      onOpenConsultation();
    } else {
      setConsultOpen(true);
    }
  };

  const t = {
    eyebrow: lang === 'FR' ? 'PIXIATECH / TOUS LES PRODUITS' : 'PIXIATECH / ALL PRODUCTS',
    h1Line1: lang === 'FR' ? 'Trouvez l\'Ã©cran' : 'Find the display',
    h1Line2: lang === 'FR' ? 'fait pour votre espace.' : 'built for your space.',
    desc: lang === 'FR'
      ? 'Le catalogue complet PixiaTech â€” installation fixe, location, transparent, cinÃ©tique et crÃ©atif.'
      : 'The complete PixiaTech display catalog â€” fixed installation, rental, transparent, kinetic and creative systems.',
    all: lang === 'FR' ? 'TOUS' : 'ALL',
    search: lang === 'FR' ? 'RECHERCHER' : 'SEARCH',
    searchPlaceholder: lang === 'FR' ? 'Rechercher un produitâ€¦' : 'Search productsâ€¦',
    clearSearch: lang === 'FR' ? 'Effacer la recherche' : 'Clear search',
    rearView: lang === 'FR' ? 'vue arriÃ¨re' : 'rear view',
    series: lang === 'FR' ? 'SÃ‰RIES' : 'SERIES',
    startProject: lang === 'FR' ? 'DÃ‰MARRER UN PROJET' : 'START A PROJECT',
    pixelPitch: lang === 'FR' ? 'PAS DE PIXEL' : 'PIXEL PITCH',
    brightness: lang === 'FR' ? 'LUMINOSITÃ‰' : 'BRIGHTNESS',
    cabinet: 'CABINET',
  };

  // Le catalogue n'affiche que les produits reels publies dans Firestore. La
  // liste de series legacy codee en dur a ete retiree : elle continuait de
  // s'afficher en plus des produits reels et empechait de partir d'un
  // catalogue vide. Les filtres de categories restent construits depuis la
  // taxonomie CMS.
  const merged = useMemo(
    () => products.filter((p) => p.status === 'published').map((p) => realCard(p, lang)),
    [products, lang]
  );

  /** Sections de filtres : groupes actifs, dans l'ordre, avec leurs options
 *  actives triÃ©es. Un groupe sans option active est masquÃ© du front-end. */
  const sections = useMemo(() => {
    return groups
      .filter((g) => g.active)
      .map((g) => {
        const options = categories
          .filter((c) => c.type === g.key && c.active)
          .sort((a, b) => {
            const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return oa !== ob ? oa - ob : (a.name || '').localeCompare(b.name || '', 'fr');
          });
        return { group: g, options };
      })
      .filter((s) => s.options.length > 0);
  }, [groups, categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merged.filter((p) => {
      // Conjonction de groupes : chaque groupe dont une option est sÃ©lectionnÃ©e
      // doit matcher (jamais par libellÃ© â€” uniquement par ID de catÃ©gorie).
      const matchSections = sections.every((s) => {
        const sel = filters[s.group.key];
        if (!sel || sel === 'All') return true;
        return p.categoryIds.includes(sel);
      });
      const matchQuery =
        !q ||
        [p.name, p.slug, p.sub, p.env, ...p.apps]
          .join(' ')
          .toLowerCase()
          .includes(q);
      return matchSections && matchQuery;
    });
  }, [merged, sections, filters, query]);

  return (
    <RevealRoot className="xer-site" style={{ background: '#F5F4F0' }}>
      <PixiaHeader
        companyName="PIXIATECH"
        onOpenConsultation={handleOpenConsultation}
        forceSolidDark={true}
      />
      <main style={{ background: '#F5F4F0', minHeight: '100vh', color: '#111110', paddingTop: 88 }}>
        {/* Hero header */}
        <section
          className="section-hero theme-light"
          style={{
            background: '#F5F4F0',
            paddingTop: 'clamp(40px, 6vh, 80px)',
            paddingBottom: 'clamp(48px, 6vh, 80px)',
          }}
        >
        <div className="wrap">
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: '.24em',
              color: '#8A8880',
              marginBottom: 20,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {t.eyebrow}
          </div>

          <h1
            className="display"
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(40px, 5.5vw, 90px)',
              fontWeight: 900,
              letterSpacing: '-.03em',
              lineHeight: 1.02,
              color: '#111110',
            }}
          >
            {t.h1Line1}
            <br />
            {t.h1Line2}
          </h1>

          <p
            className="lede"
            style={{
              marginBottom: 48,
              maxWidth: 560,
              fontSize: 17,
              lineHeight: 1.6,
              color: '#4A4A46',
            }}
          >
            {t.desc}
          </p>

          {/* Filter bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 32,
              alignItems: 'flex-start',
              borderTop: '1px solid #DFDDD5',
              borderBottom: '1px solid #DFDDD5',
              padding: '24px 0',
              marginBottom: 48,
            }}
          >
            {/* Search */}
            <div style={{ minWidth: 280, flex: '0 1 340px' }}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.2em',
                  color: '#8A8880',
                  marginBottom: 12,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t.search}
              </div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Search
                  className="lucide"
                  style={{
                    position: 'absolute',
                    left: 14,
                    width: 15,
                    height: 15,
                    color: '#8A8880',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 40px',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    color: '#111110',
                    background: '#fff',
                    border: '1px solid #c9c7c2',
                    outline: 'none',
                    transition: 'border-color .18s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#111110';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#c9c7c2';
                  }}
                />
                {query && (
                  <button
                    type="button"
                    aria-label={t.clearSearch}
                    onClick={() => setQuery('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'transparent',
                      color: '#8A8880',
                      cursor: 'pointer',
                    }}
                  >
                    <X className="lucide" style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </div>
            </div>

            {/* Sections de filtres â€” gÃ©nÃ©rÃ©es depuis les groupes du CMS */}
            {sections.map(({ group, options }, index) => {
              const activeId = filters[group.key] ?? 'All';
              const setFilter = (id: string) =>
                setFilters((prev) => ({ ...prev, [group.key]: id }));
              return (
                <div key={group.id} style={index === 0 ? {} : { flex: 1, minWidth: 320 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '.2em',
                      color: '#8A8880',
                      marginBottom: 12,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {groupDisplayName(group, lang)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { id: 'All', name: t.all },
                      ...options.map((c) => ({ id: c.id, name: categoryDisplayName(c, lang) })),
                    ].map((f) => {
                      const active = activeId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          className={`chip${active ? ' on' : ''}`}
                          onClick={() => setFilter(f.id)}
                          style={{
                            fontSize: 11,
                            letterSpacing: '.1em',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: active ? '#111110' : '#c9c7c2',
                            background: active ? '#111110' : 'transparent',
                            color: active ? '#f5f4f0' : '#4A4A46',
                            transition: 'all .18s ease',
                          }}
                        >
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Count */}
            <div
              style={{
                fontSize: 12,
                letterSpacing: '.14em',
                color: '#8A8880',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                alignSelf: 'flex-end',
                paddingBottom: 10,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {filtered.length} {t.series}
            </div>
          </div>

          {/* Products grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(430px, 100%), 1fr))',
              gap: 32,
            }}
          >
            {filtered.map((p) => {
              const isHov = hovered === p.key;
              const cabinetLabel = p.cabinet === 'Custom' && lang === 'FR' ? 'Sur mesure' : p.cabinet;
              return (
                <article
                  key={p.key}
                  className="card"
                  onMouseEnter={() => setHovered(p.key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (p.isReal) {
                      trackProductClick(p.slug, lang);
                      router.push(`/web/product/${p.slug}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      handleOpenConsultation();
                    }
                  }}
                  style={{
                    background: '#fff',
                    border: '1px solid #DFDDD5',
                    cursor: 'pointer',
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'box-shadow .25s ease, border-color .25s ease',
                    boxShadow: isHov ? '0 8px 32px rgba(0,0,0,.09)' : 'none',
                    borderColor: isHov ? '#c9c7c2' : '#DFDDD5',
                  }}
                >
                  {/* Card media */}
                  <div
                    className="card-media"
                    style={{
                      position: 'relative',
                      height: 260,
                      overflow: 'hidden',
                      background: '#EDEAE2',
                    }}
                  >
                    {p.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.img}
                        alt={p.name}
                        className="slot-img slot-contain"
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          padding: 20,
                          opacity: p.imgBack ? (isHov ? 0 : 1) : 1,
                          transition: 'opacity .35s ease',
                        }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0';
                        }}
                      />
                    )}
                    {p.imgBack && (
                      <div
                        className="card-alt filled"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: isHov ? 1 : 0,
                          transition: 'opacity .35s ease',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imgBack}
                          alt={`${p.name} â€” ${t.rearView}`}
                          className="slot-img slot-contain"
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: 20,
                          }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '22px 24px 24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 12,
                      }}
                    >
                      <div
                        className="card-title"
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          letterSpacing: '-.01em',
                          color: '#111110',
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing: '.18em',
                          color: '#8A8880',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {envBadge(p.env, lang)}
                      </div>
                    </div>

                    <div
                      className="card-sub"
                      style={{
                        fontSize: 13.5,
                        color: '#6b6a66',
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {p.sub}
                    </div>

                    {/* Specs */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 12,
                        marginTop: 18,
                        paddingTop: 16,
                        borderTop: '1px solid #EBE9E4',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.pitch}</div>
                        <div
                          style={{
                            fontSize: 9.5,
                            letterSpacing: '.16em',
                            color: '#8A8880',
                            marginTop: 3,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.pixelPitch}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.brightness}</div>
                        <div
                          style={{
                            fontSize: 9.5,
                            letterSpacing: '.16em',
                            color: '#8A8880',
                            marginTop: 3,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.brightness}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{cabinetLabel}</div>
                        <div
                          style={{
                            fontSize: 9.5,
                            letterSpacing: '.16em',
                            color: '#8A8880',
                            marginTop: 3,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.cabinet}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div
              style={{
                marginTop: 48,
                textAlign: 'center',
                color: '#6b6a66',
                fontSize: 15,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#8A8880', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
                {lang === 'FR' ? 'AUCUN RÃ‰SULTAT' : 'NO RESULTS'}
              </div>
              {lang === 'FR'
                ? 'Aucun produit ne correspond Ã  votre recherche.'
                : 'No products match your search.'}
            </div>
          )}

          {/* CTA bottom */}
          <div
            style={{
              marginTop: 80,
              paddingTop: 48,
              borderTop: '1px solid #DFDDD5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 32,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: '#8A8880',
                  margin: 0,
                  letterSpacing: '.05em',
                }}
              >
                {lang === 'FR'
                  ? 'Vous ne trouvez pas ce qu\'il vous faut ?'
                  : 'Can\'t find what you need?'}
              </p>
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#111110',
                  margin: '6px 0 0',
                  letterSpacing: '-.01em',
                }}
              >
                {lang === 'FR'
                  ? 'Nos ingÃ©nieurs trouvent la solution.'
                  : 'Our engineers will find the solution.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenConsultation}
              style={{
                padding: '18px 36px',
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                background: '#111110',
                color: '#f5f4f0',
                border: 0,
                cursor: 'pointer',
                transition: 'background .22s ease, color .22s ease',
                whiteSpace: 'nowrap',
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
              {t.startProject}
            </button>
          </div>
        </div>
      </section>
      </main>
      <PixiaFooter companyName="PIXIATECH" lang={lang} onOpenConsultation={handleOpenConsultation} />
      <ConsultationModal
        isOpen={consultOpen}
        onClose={() => setConsultOpen(false)}
        companyName="PIXIATECH"
        lang={lang}
      />
      <BackToTopButton lang={lang} />
    </RevealRoot>
  );
};
