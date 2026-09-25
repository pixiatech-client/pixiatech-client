'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../xeron.css';
import { XerHeader } from './XerHeader';
import { XerFooter } from './XerFooter';
import { RevealRoot } from './RevealRoot';
import { ConsultationModal } from './ConsultationModal';
import { BackToTopButton } from './BackToTopButton';
import { Language } from '../xeron-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import type { ProductRecord } from '@/lib/products/types';
import seedData from '../../../data/mega-menu-seed.json';

interface AllProductsPageProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

// ─── Complete 39-series catalog from xeron.co/en/products ───────────────────
const ALL_PRODUCTS = [
  // FIXED INSTALLATION / INDOOR
  { slug: 'wp',      name: 'XR Fine',      env: 'INDOOR',   apps: ['Indoor', 'Corporate', 'Retail', 'Control Room'], sub: 'Indoor LED display',                          pitch: '1.2–3.1 mm',    brightness: '800–1,500',   cabinet: '600×337.5 mm' },
  { slug: 'wt',      name: 'XR Ultra',     env: 'INDOOR',   apps: ['Indoor', 'Corporate', 'Retail'],                  sub: 'Indoor fine-pitch LED display',               pitch: '0.78–1.5 mm',   brightness: '600–1,000',   cabinet: '600×337.5 mm' },
  { slug: 'wpwrap',  name: 'XR Wrap',      env: 'INDOOR',   apps: ['Indoor', 'Corporate', 'Creative'],                sub: 'Curves wrap LED display',                     pitch: '1.2–3.1 mm',    brightness: '800–1,500',   cabinet: '300×337.5 mm' },
  { slug: 'wv',      name: 'XR Seamless',  env: 'INDOOR',   apps: ['Indoor', 'Control Room'],                         sub: 'Indoor control room LED display',             pitch: '1.25–1.56 mm',  brightness: '800',         cabinet: '1200×675 mm' },
  { slug: 'gemini',  name: 'XR Twin',      env: 'INDOOR',   apps: ['Indoor', 'Retail', 'DOOH'],                       sub: 'Dual-sided indoor LED display',               pitch: '1.56–2.5 mm',   brightness: '600–1,500',   cabinet: '600×675 mm' },
  { slug: 'orion',   name: 'XR Orion',     env: 'INDOOR',   apps: ['Indoor', 'Corporate'],                            sub: 'Indoor LED collaboration display',            pitch: '1.25–1.56 mm',  brightness: '600–1,000',   cabinet: '108″ / 136″' },
  { slug: 'poster',  name: 'Poster LED',   env: 'INDOOR',   apps: ['Indoor', 'Retail', 'DOOH'],                       sub: 'Freestanding indoor poster LED',              pitch: '1.56–3.1 mm',   brightness: '800–1,200',   cabinet: 'Custom' },
  // OUTDOOR / DOOH
  { slug: 'mv',      name: 'XR Vision',    env: 'OUTDOOR',  apps: ['Outdoor', 'DOOH'],                                sub: 'Outdoor LED display — next generation',       pitch: '2.9–12.5 mm',   brightness: '1,000–10,000',cabinet: '500×500 mm +' },
  { slug: 'mvedge',  name: 'XR Edge',      env: 'OUTDOOR',  apps: ['Outdoor', 'DOOH', 'Creative'],                   sub: 'Outdoor curved LED façade display',           pitch: '3.91–10.4 mm',  brightness: '5,000–8,000', cabinet: '1000×1000 mm' },
  { slug: 'rs',      name: 'XR Rugged',    env: 'IN / OUT', apps: ['Indoor', 'Outdoor', 'Rental'],                   sub: 'Indoor / Outdoor rental LED',                 pitch: '2.5 / 3.9 mm',  brightness: '1,200–5,000', cabinet: '500×1000 mm' },
  // SPORTS
  { slug: 'sp',      name: 'XR Arena',     env: 'OUTDOOR',  apps: ['Outdoor', 'Sports'],                             sub: 'Stadium perimeter LED',                       pitch: '6.25 / 10 mm',  brightness: '5,000–6,000', cabinet: '1600×956 mm' },
  // KINETIC
  { slug: 'spki',    name: 'SPKI Kinetic', env: 'INDOOR',   apps: ['Indoor', 'Creative', 'Kinetic'],                 sub: 'Indoor kinetic LED system',                   pitch: '3.9 mm',        brightness: '1,000',       cabinet: 'Custom' },
  { slug: 'spko',    name: 'SPKO Kinetic', env: 'IN / OUT', apps: ['Indoor', 'Outdoor', 'Creative', 'Kinetic'],      sub: 'Indoor / Outdoor kinetic LED system',         pitch: '3.9–6.25 mm',   brightness: '1,000–5,000', cabinet: 'Custom' },
  // RENTAL & STAGING
  { slug: 'armk2',   name: 'XR Flex',      env: 'IN / OUT', apps: ['Indoor', 'Outdoor', 'Rental'],                   sub: 'Indoor / Outdoor rental LED',                 pitch: '2.9–10.4 mm',   brightness: '1,000–5,000', cabinet: '500×1000 mm' },
  { slug: 'art',     name: 'XR Bastion',   env: 'IN / OUT', apps: ['Outdoor', 'Rental'],                             sub: 'Outdoor touring LED',                         pitch: '3.9–10.4 mm',   brightness: '4,000–5,000', cabinet: '500×1000 mm' },
  { slug: 'xmk2',    name: 'XR Arc',       env: 'INDOOR',   apps: ['Indoor', 'Rental', 'Creative'],                  sub: 'Curved creative LED',                         pitch: '1.9–3.9 mm',    brightness: '1,000–1,200', cabinet: '500×500 mm' },
  { slug: 'xmk3',    name: 'XR Arc II',    env: 'INDOOR',   apps: ['Indoor', 'Rental', 'Creative'],                  sub: 'Curved creative LED — next gen',              pitch: '1.5–2.6 mm',    brightness: '1,000–1,200', cabinet: '500×500 mm' },
  { slug: 'ezmk2',   name: 'XR Essential', env: 'INDOOR',   apps: ['Indoor', 'Rental'],                              sub: 'Indoor fine-pitch rental LED',                pitch: '1.9 / 2.6 mm',  brightness: '1,000–1,200', cabinet: '500×500 mm' },
  { slug: 'titanx',  name: 'XR Titan',     env: 'OUTDOOR',  apps: ['Outdoor', 'Rental', 'Transparent'],             sub: 'Outdoor transparent touring LED',             pitch: '8.3 mm',        brightness: '4,000',       cabinet: '1200×1200 mm' },
  // TRANSPARENT
  { slug: 'mvmesh',  name: 'XR Air',       env: 'OUTDOOR',  apps: ['Outdoor', 'Transparent', 'DOOH'],               sub: 'Outdoor transparent LED mesh',                pitch: '16/6–25/50 mm', brightness: '5,000–10,000',cabinet: '1000×1000 mm' },
  { slug: 'holo',    name: 'XR Holo',      env: 'OUTDOOR',  apps: ['Outdoor', 'Transparent', 'Creative'],           sub: 'Outdoor transparent creative LED',            pitch: '3.9 / 7.8 mm',  brightness: '4,500',       cabinet: '1000×500 mm' },
  { slug: 'ammk2',   name: 'XR Veil',      env: 'OUTDOOR',  apps: ['Outdoor', 'Transparent'],                        sub: 'Outdoor transparent mesh LED',                pitch: '8.3 mm',        brightness: '3,500–4,000', cabinet: '1200×1200 mm' },
  { slug: 'amt',     name: 'XR Drape',     env: 'OUTDOOR',  apps: ['Outdoor', 'Transparent', 'Rental'],             sub: 'Outdoor touring mesh LED',                    pitch: '8.3 mm',        brightness: '5,000',       cabinet: '1000×1000 mm' },
  { slug: 'bwamt',   name: 'XR Nova',      env: 'OUTDOOR',  apps: ['Outdoor', 'Transparent', 'Rental'],             sub: 'Hybrid solid + mesh touring LED',             pitch: '3.91–7.81 mm',  brightness: '2,500–4,000', cabinet: '1000×1000 mm' },
  { slug: 'jelly',   name: 'Jellyfish',    env: 'INDOOR',   apps: ['Indoor', 'Transparent', 'Creative'],            sub: 'Hologram / Glass creative LED',               pitch: '3.9 mm',        brightness: '1,500',       cabinet: 'Custom' },
  // XR / VP
  { slug: 'studio',  name: 'XR Studio',    env: 'INDOOR',   apps: ['Indoor', 'XR / VP'],                             sub: 'Ceiling, background, floor studio LED',       pitch: '1.56–5.9 mm',   brightness: '1,000–8,000', cabinet: '500×500 mm +' },
  // CREATIVE
  { slug: 'sf',      name: 'XR Curve',     env: 'INDOOR',   apps: ['Indoor', 'Creative'],                            sub: 'Flexible indoor LED',                         pitch: '1.5–4 mm',      brightness: '600–1,000',   cabinet: '320×160 mm' },
  { slug: 'mc',      name: 'XR Cube',      env: 'IN / OUT', apps: ['Indoor', 'Outdoor', 'Creative'],                 sub: 'Creative corner & cube LED',                  pitch: '1.56–3.9 mm',   brightness: '800–5,000',   cabinet: '500×500 mm' },
  { slug: 'rc',      name: 'XR Column',    env: 'INDOOR',   apps: ['Indoor', 'Creative'],                            sub: 'Indoor LED column',                           pitch: '1.9 mm',        brightness: '1,000',       cabinet: '187.5×187.5 mm' },
  { slug: 'dfmk2',   name: 'XR Floor',     env: 'IN / OUT', apps: ['Indoor', 'Outdoor', 'Creative', 'Rental'],      sub: 'LED floor system',                            pitch: '2.6–7.8 mm',    brightness: '800–3,000',   cabinet: '500×500 mm' },
  // LARGE FORMAT
  { slug: 'dbmk2',   name: 'XR Modul',     env: 'INDOOR',   apps: ['Indoor', 'Control Room'],                        sub: 'Ultra-Black LED display',                     pitch: '1.56–2.6 mm',   brightness: '600–1,800',   cabinet: '500×500 mm' },
  { slug: 'orez',    name: 'XR Event',     env: 'OUTDOOR',  apps: ['Outdoor', 'DOOH', 'Rental'],                    sub: 'Outdoor fine-pitch LED',                      pitch: '2.6 mm',        brightness: '4,000–5,000', cabinet: '500×500 mm' },
  // MORE CREATIVE
  { slug: 'spin',    name: 'XR Spin',      env: 'INDOOR',   apps: ['Indoor', 'Creative', 'Kinetic'],                sub: 'Hologram fan LED display',                    pitch: '3.75 mm',       brightness: '800',         cabinet: 'Ø 75–100 cm' },
];

const ENV_FILTERS = ['All', 'Indoor', 'Outdoor'];
const APP_FILTERS = [
  'All', 'Corporate', 'Retail', 'DOOH', 'Rental', 'Sports',
  'XR / VP', 'Control Room', 'Creative', 'Kinetic', 'Transparent',
];

// ─── Fusion legacy → produits Firestore (source de vérité) ──────────────────
// Un seul produit, une seule carte : si un catalogSlug legacy possède un
// équivalent Firestore connu (mapping du seed), la carte légacy est remplacée
// par le produit réel — jamais affichée en double.

const LEGACY_TO_PRODUCT: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const menu = (
    seedData as {
      menu: {
        columns: Array<{
          items: Array<{ catalogSlug?: string | null; productSlug?: string | null }>;
        }>;
      };
    }
  ).menu;
  menu.columns.forEach((c) =>
    c.items.forEach((i) => {
      if (i.catalogSlug && i.productSlug) map[i.catalogSlug] = i.productSlug;
    })
  );
  return map;
})();

interface CatalogCard {
  key: string;
  slug: string;
  name: string;
  isReal: boolean;
  img: string | null;
  imgBack: string | null;
  env: string;
  apps: string[];
  sub: string;
  pitch: string;
  brightness: string;
  cabinet: string;
}

function mainImageOf(p: ProductRecord): string | null {
  return p.media?.photos?.find((ph) => ph.url)?.url ?? p.hero?.image ?? null;
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

function appsOf(p: ProductRecord): string[] {
  const list: string[] = [];
  const tag = p.hero?.tags?.[0];
  if (tag) list.push(tag);
  return list;
}

function subOf(p: ProductRecord, lang: Language): string {
  return lang === 'FR'
    ? p.description?.shortFr ?? p.hero?.subtitle ?? ''
    : p.description?.shortEn ?? p.hero?.subtitle ?? '';
}

function specValue(p: ProductRecord, index: number): string {
  const values = (p.hero?.specs ?? []).map((s) => s.value).filter(Boolean);
  if (values.length >= index + 1) return values[index];
  return '—';
}

function realCard(p: ProductRecord, lang: Language): CatalogCard {
  return {
    key: `product-${p.slug}`,
    slug: p.slug,
    name: p.name,
    isReal: true,
    img: mainImageOf(p),
    imgBack: null,
    env: envLabel(p.environment),
    apps: appsOf(p),
    sub: subOf(p, lang),
    pitch: specValue(p, 0),
    brightness: specValue(p, 1),
    cabinet: specValue(p, 2),
  };
}

function legacyCard(legacy: (typeof ALL_PRODUCTS)[number]): CatalogCard {
  return {
    key: `legacy-${legacy.slug}`,
    slug: legacy.slug,
    name: legacy.name,
    isReal: false,
    img: `/uploads/products/${legacy.slug}/front.jpg`,
    imgBack: `/uploads/products/${legacy.slug}/back.jpg`,
    env: legacy.env,
    apps: legacy.apps,
    sub: legacy.sub,
    pitch: legacy.pitch,
    brightness: legacy.brightness,
    cabinet: legacy.cabinet,
  };
}

export const AllProductsPage: React.FC<AllProductsPageProps> = (props) => (
  <ProductsProvider>
    <AllProductsView {...props} />
  </ProductsProvider>
);

function AllProductsView({
  lang: initialLang = 'FR',
  onOpenConsultation,
}: AllProductsPageProps) {
  const router = useRouter();
  const { products } = useProducts();
  const [lang, setLang] = useState<Language>(initialLang);
  const [consultOpen, setConsultOpen] = useState(false);
  const [envFilter, setEnvFilter] = useState('All');
  const [appFilter, setAppFilter] = useState('All');
  const [hovered, setHovered] = useState<string | null>(null);
  const { setCurrentPageId } = useCms();

  useEffect(() => {
    setCurrentPageId('products');
  }, [setCurrentPageId]);

  const toggleLang = () => setLang((l) => (l === 'FR' ? 'EN' : 'FR'));
  const handleOpenConsultation = () => {
    if (onOpenConsultation) {
      onOpenConsultation();
    } else {
      setConsultOpen(true);
    }
  };

  const t = {
    eyebrow: lang === 'FR' ? 'PIXIATECH / TOUS LES PRODUITS' : 'PIXIATECH / ALL PRODUCTS',
    h1Line1: lang === 'FR' ? 'Trouvez l\'écran' : 'Find the display',
    h1Line2: lang === 'FR' ? 'fait pour votre espace.' : 'built for your space.',
    desc: lang === 'FR'
      ? 'Le catalogue complet PixiaTech — installation fixe, location, transparent, cinétique et créatif.'
      : 'The complete PixiaTech display catalog — fixed installation, rental, transparent, kinetic and creative systems.',
    envLabel: 'ENVIRONMENT',
    appLabel: 'APPLICATION',
    series: lang === 'FR' ? 'SÉRIES' : 'SERIES',
    startProject: lang === 'FR' ? 'DÉMARRER UN PROJET' : 'START A PROJECT',
    pixelPitch: 'PIXEL PITCH',
    brightness: 'BRIGHTNESS',
    cabinet: 'CABINET',
  };

  const merged = useMemo(() => {
    const published = products.filter((p) => p.status === 'published');
    const realBySlug = new Map(published.map((p) => [p.slug, p]));
    const cards: CatalogCard[] = [];
    const usedReal = new Set<string>();
    for (const legacy of ALL_PRODUCTS) {
      const realSlug =
        LEGACY_TO_PRODUCT[legacy.slug] ?? (realBySlug.has(legacy.slug) ? legacy.slug : null);
      const real = realSlug ? realBySlug.get(realSlug) ?? null : null;
      if (real) {
        usedReal.add(real.slug);
        cards.push(realCard(real, lang));
      } else {
        cards.push(legacyCard(legacy));
      }
    }
    for (const real of published) {
      if (!usedReal.has(real.slug)) cards.push(realCard(real, lang));
    }
    return cards;
  }, [products, lang]);

  const filtered = useMemo(() => {
    return merged.filter((p) => {
      const matchEnv =
        envFilter === 'All' ||
        (envFilter === 'Indoor' && (p.env === 'INDOOR' || p.env === 'IN / OUT')) ||
        (envFilter === 'Outdoor' && (p.env === 'OUTDOOR' || p.env === 'IN / OUT'));
      const matchApp = appFilter === 'All' || p.apps.includes(appFilter);
      return matchEnv && matchApp;
    });
  }, [merged, envFilter, appFilter]);

  return (
    <RevealRoot className="xer-site" style={{ background: '#F5F4F0' }}>
      <XerHeader
        companyName="PIXIATECH"
        lang={lang}
        onOpenConsultation={handleOpenConsultation}
        onToggleLang={toggleLang}
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
              fontFamily: 'monospace',
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
            {/* Environment */}
            <div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.2em',
                  color: '#8A8880',
                  marginBottom: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t.envLabel}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ENV_FILTERS.map((f) => {
                  const active = envFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`chip${active ? ' on' : ''}`}
                      onClick={() => setEnvFilter(f)}
                      style={{
                        fontSize: 11,
                        letterSpacing: '.1em',
                        fontFamily: 'monospace',
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
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Application */}
            <div style={{ flex: 1, minWidth: 320 }}>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.2em',
                  color: '#8A8880',
                  marginBottom: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {t.appLabel}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {APP_FILTERS.map((f) => {
                  const active = appFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`chip${active ? ' on' : ''}`}
                      onClick={() => setAppFilter(f)}
                      style={{
                        fontSize: 11,
                        letterSpacing: '.1em',
                        fontFamily: 'monospace',
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
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count */}
            <div
              style={{
                fontSize: 12,
                letterSpacing: '.14em',
                color: '#8A8880',
                fontFamily: 'monospace',
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
              return (
                <article
                  key={p.key}
                  className="card"
                  onMouseEnter={() => setHovered(p.key)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (p.isReal) {
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
                          alt={`${p.name} — rear view`}
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
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.env}
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
                            fontFamily: 'monospace',
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
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.brightness}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.cabinet}</div>
                        <div
                          style={{
                            fontSize: 9.5,
                            letterSpacing: '.16em',
                            color: '#8A8880',
                            marginTop: 3,
                            fontFamily: 'monospace',
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
                  ? 'Nos ingénieurs trouvent la solution.'
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
      <XerFooter companyName="PIXIATECH" lang={lang} onOpenConsultation={handleOpenConsultation} />
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
