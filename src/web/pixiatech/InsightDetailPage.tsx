'use client';

import { useMemo, useState, useEffect } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { RevealRoot } from './RevealRoot';
import type { InsightArticle } from '../data/insights-articles-content';
import { getAllInsightArticles } from '../data/insights-articles-content';
import type { Language } from '../pixiatech-translations';
import { useI18n } from '@/lib/i18n';
import { useCms } from '@/lib/site-web/cms-context';
import { EditableWrapper } from '../cms/EditableWrapper';
import { ArticleEditorModal } from '../cms/ArticleEditorModal';
import { Edit3 } from 'lucide-react';
import { getProductBySlug } from '@/lib/products/products-service';
import type { ProductRecord } from '@/lib/products/types';

interface InsightDetailPageProps {
  article: InsightArticle;
}

// Map article slug → related PixiaTech product (slug + display name)
const RELATED_PRODUCT: Record<string, { slug: string; name: string }> = {
  'stadium-led-screens': { slug: 'sp', name: 'XR Arena' },
  'led-screen-installation': { slug: 'wp', name: 'XR Fine' },
  'led-screen-power-consumption': { slug: 'wp', name: 'XR Fine' },
  'led-floor-screens': { slug: 'dfmk2', name: 'XR Floor' },
  'led-sign-vs-led-screen': { slug: 'poster', name: 'Poster LED Display' },
  'led-screen-rental-guide': { slug: 'armk2', name: 'XR Flex' },
  'led-screen-prices': { slug: 'mv', name: 'XR Vision' },
  'led-in-outdoor-advertising': { slug: 'mv', name: 'XR Vision' },
  'outdoor-led-buying-checklist': { slug: 'mv', name: 'XR Vision' },
  'led-vs-projector': { slug: 'wv', name: 'XR Seamless' },
  'retail-window-led': { slug: 'mvmesh', name: 'XR Air' },
  'event-led-screen-size': { slug: 'armk2', name: 'XR Flex' },
  'led-vs-lcd-video-wall': { slug: 'wv', name: 'XR Seamless' },
  'led-screen-lifespan-maintenance': { slug: 'wt', name: 'XR Ultra' },
  'holographic-displays': { slug: 'halo', name: 'XR Spin' },
  'what-is-an-led-screen': { slug: 'wp', name: 'XR Fine' },
  'cob-fine-pitch': { slug: 'wt', name: 'XR Ultra' },
  'rental-stage-build': { slug: 'armk2', name: 'XR Flex' },
  'transparent-led': { slug: 'mvmesh', name: 'XR Air' },
  'pixel-pitch': { slug: 'wp', name: 'XR Fine' },
  'corporate-screens': { slug: 'orion', name: 'XR Orion' },
  'outdoor-brightness': { slug: 'mv', name: 'XR Vision' },
  'curved-led': { slug: 'xmk2', name: 'XR Arc' },
  'xr-stages': { slug: 'studio', name: 'XR Studio' },
  'kinetic': { slug: 'spki', name: 'SPKI Kinetic Series' },
};

interface ProductSummary {
  name: string;
  descFr: string;
  descEn: string;
  img: string;
}

const PRODUCT_SUMMARIES: Record<string, ProductSummary> = {
  mv: {
    name: 'XR Vision',
    descFr: 'Une solution LED de nouvelle génération, conçue pour offrir une qualité d\'image exceptionnelle et une fiabilité optimale, en intérieur comme en extérieur.',
    descEn: 'A next-generation LED solution engineered for exceptional image quality and optimal reliability, both indoors and outdoors.',
    img: '/uploads/products/mv/front.jpg',
  },
  wp: {
    name: 'XR Fine',
    descFr: 'L\'écran LED ultra-fin conçu pour les espaces d\'exception où contrôle thermique, fiabilité sans compromis et intégration architecturale sont primordiaux.',
    descEn: 'The wallpaper-thin LED display engineered for executive spaces where thermal control, reliability and architectural integration are critical.',
    img: '/uploads/products/wp/front.jpg',
  },
  wt: {
    name: 'XR Ultra',
    descFr: 'Écran LED micro-pitch pour salles de contrôle critiques et régies broadcast exigeant une densité de pixels absolue et une protection de surface COB.',
    descEn: 'Micro-pitch LED display engineered for mission-critical command centers, broadcast rooms and luxury boardrooms requiring absolute pixel permanence.',
    img: '/uploads/products/wt/front.jpg',
  },
  wv: {
    name: 'XR Seamless',
    descFr: 'Grands modules avec alimentation déportée, garantissant un affichage 4K/8K natif sans aucun bruit ni dissipation de chaleur dans la pièce.',
    descEn: 'Large-format display blocks with remote power units, delivering native 4K/8K resolution with zero ambient noise and zero heat emissions.',
    img: '/uploads/products/wv/front.jpg',
  },
  sp: {
    name: 'XR Arena',
    descFr: 'Système d\'affichage LED périmétrique et scoreboards haute visibilité certifié pour les stades et arènes sportives internationales.',
    descEn: 'Impact-absorbing perimeter boards and continuous arena fascia displays certified for international sports federation broadcasts.',
    img: '/uploads/products/sp/front.jpg',
  },
  armk2: {
    name: 'XR Flex',
    descFr: 'Châssis magnésium ultra-légers pour tournées de concerts et salons, dotés de verrous rapides et d\'angles d\'incurvation de -10° à +10°.',
    descEn: 'Rugged, featherweight rental platform for events, touring and XR/VP with quick-locks and telescopic alignment.',
    img: '/uploads/products/armk2/front.jpg',
  },
  dfmk2: {
    name: 'XR Floor',
    descFr: 'Système de sol LED porteur haute résistance conçu pour la production virtuelle, les plateaux XR et les scénographies événementielles.',
    descEn: 'Load-bearing LED floor system engineered for XR, virtual production and immersive events — 1,500 kg/m² capacity.',
    img: '/uploads/products/dfmk2/front.jpg',
  },
  mvmesh: {
    name: 'XR Air',
    descFr: 'Grille LED architecturale ultra-légère et perméable au vent transformant les façades de verre entières en écrans médiatiques lumineux.',
    descEn: 'Lightweight, wind-permeable architectural LED mesh transforming entire building envelopes into glowing media facades.',
    img: '/uploads/products/mvmesh/front.jpg',
  },
  xmk2: {
    name: 'XR Arc',
    descFr: 'Affichage courbé haute précision avec angles réglables pour créer des vagues et volumes immersifs spectaculaires.',
    descEn: 'Patented curved display for premium installations with precise angle positions from -30° to +30°.',
    img: '/uploads/products/xmk2/front.jpg',
  },
  orion: {
    name: 'XR Orion',
    descFr: 'Écran LED de collaboration tout-en-un avec système vidéo intégré, conçu pour les auditoriums et salles de conseil de direction.',
    descEn: 'All-in-one indoor collaboration LED display integrated for executive boardrooms and auditoriums.',
    img: '/uploads/products/orion/front.jpg',
  },
  halo: {
    name: 'XR Spin',
    descFr: 'Affichage holographique 3D à effet visuel saisissant sans lunettes, conçu pour attirer les regards en retail et événementiel.',
    descEn: 'Naked-eye 3D holographic fan displays from desktop units to large outdoor walls for high-impact visual presence.',
    img: '/uploads/products/halo/front.jpg',
  },
  studio: {
    name: 'XR Studio',
    descFr: 'L\'écosystème LED complet pour la production virtuelle : plafond, arrière-plan et sol pour un tournage sans scintillement.',
    descEn: 'The complete LED ecosystem for virtual production — ceiling, background and floor, engineered together for flicker-free filming.',
    img: '/uploads/products/studio/front.jpg',
  },
  poster: {
    name: 'Poster LED Display',
    descFr: 'Totem LED autonome et ultra-fin pour espaces d\'accueil, retail et salons — sur pied, suspendu ou mural, prêt à l\'emploi.',
    descEn: 'Slim, freestanding LED poster for retail, lobbies and events — floor-standing, hanging or wall-mounted, plug in and play.',
    img: '/uploads/products/poster/front.jpg',
  },
  spki: {
    name: 'SPKI Kinetic Series',
    descFr: 'Modules LED cinétiques motorisés avec déplacement en profondeur synchronisé créant des reliefs tridimensionnels en mouvement.',
    descEn: 'Indoor kinetic LED with synchronized motion units on the Z-axis creating striking three-dimensional wave surfaces.',
    img: '/uploads/products/spki/front.jpg',
  },
  'caisson-dynamique': {
    name: 'Caisson dynamique',
    descFr: 'Caisson lumineux architectural dynamique avec modules LED haute luminosité, idéal pour façades et enseignes haute visibilité.',
    descEn: 'Dynamic architectural light box with high-brightness LED modules, engineered for striking facades and premium brand signage.',
    img: 'https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/site_web_products%2Fcaisson-dynamique%2Fphotos%2F1790978420554-P30-RGB-W-1.jpg?alt=media&token=21610b97-91e7-43a7-a009-692fe2a12003',
  },
  'pxt-fine': {
    name: 'PXT FINE',
    descFr: 'Cabinet aluminium usiné 600x337,5 mm, pitch ultra-fin, calibrage 16-bit et rafraîchissement 7680 Hz pour espaces d\'exception.',
    descEn: 'Precision-machined 600x337.5 mm aluminum cabinet, ultra-fine pitch, 16-bit calibration and 7680 Hz refresh rate for premium indoor venues.',
    img: 'https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/site_web_products%2Fpxt-fine%2Fphotos%2F1791631887517-001.jpg?alt=media&token=4312c463-5859-4e7a-a418-14f6536744b8',
  },
  'pxt-seamless': {
    name: 'PXT SEAMLESS',
    descFr: 'Série LED COB indoor avec technologie d\'assemblage sans raccord, garantissant une surface visuelle continue et une protection renforcée.',
    descEn: 'Indoor COB LED series engineered with seamless joint technology, providing uninterrupted viewing planes and superior surface protection.',
    img: '/uploads/products/wp/module-1.jpg',
  },
  'pxt-wrap': {
    name: 'PXT WRAP',
    descFr: 'Modules LED flexibles indoor pour surfaces incurvées, cylindres et colonnes architecturales, offrant une courbure fluide sans compromis.',
    descEn: 'Flexible indoor LED modules for curved architecture, columns and cylinders, delivering smooth continuous contours with zero distortion.',
    img: 'https://firebasestorage.googleapis.com/v0/b/pixiatech-client.firebasestorage.app/o/site_web_products%2Fpxt-wrap%2Fphotos%2F1791629982153-front.jpg?alt=media&token=3dfcf7b3-bec8-4377-9367-d3ce05eb4d51',
  },
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

function categoryLabel(category: string, lang: Language): string {
  if (lang !== 'FR') return category;
  const isFeatured = category.includes('— FEATURED');
  const prefix = category.includes('—')
    ? category.slice(0, category.indexOf('—')).trim()
    : category.trim();
  return `${CATEGORY_FR[prefix] ?? prefix}${isFeatured ? ' — À LA UNE' : ''}`;
}

function titleOf(a: InsightArticle, lang: Language): string {
  return lang === 'FR' ? a.titleFr ?? a.title : a.title;
}

function descOf(a: InsightArticle, lang: Language): string | undefined {
  return lang === 'FR' ? a.descFr ?? a.desc : a.desc;
}

function dateOf(a: InsightArticle, lang: Language): string {
  return lang === 'FR' && a.dateFr ? a.dateFr : a.date;
}

function readOf(read: string, lang: Language): string {
  return lang === 'FR' ? read.replace('MIN READ', 'MIN DE LECTURE') : read;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface ParsedSection {
  id: string;
  title: string;
  paragraphs: Array<
    | { type: 'p'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'quote'; text: string }
    | { type: 'list'; num: string; text: string }
  >;
}

function parseMarkdownContent(content: string): {
  intro: string[];
  sections: ParsedSection[];
} {
  const lines = content.split('\n');
  const intro: string[] = [];
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    if (raw.startsWith('## ')) {
      const heading = raw.replace(/^##\s+/, '').trim();
      currentSection = {
        id: slugify(heading),
        title: heading,
        paragraphs: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      intro.push(raw);
      continue;
    }

    if (raw.startsWith('### ')) {
      currentSection.paragraphs.push({
        type: 'h3',
        text: raw.replace(/^###\s+/, '').trim(),
      });
    } else if (raw.startsWith('> ')) {
      currentSection.paragraphs.push({
        type: 'quote',
        text: raw.replace(/^>\s+/, '').trim(),
      });
    } else {
      // Numbered step pattern: "1.   0 1 ..." or "1. ..."
      const stepMatch = raw.match(/^(\d+)\.\s+(?:0\s*\d+)?\s*(.+)$/);
      if (stepMatch) {
        const num = String(parseInt(stepMatch[1])).padStart(2, '0');
        currentSection.paragraphs.push({
          type: 'list',
          num,
          text: stepMatch[2],
        });
      } else {
        currentSection.paragraphs.push({ type: 'p', text: raw });
      }
    }
  }

  return { intro, sections };
}

export function PixiaInsightDetailPage({ article }: InsightDetailPageProps) {
  const { locale } = useI18n();
  const { setCurrentPageId, isAdmin, isEditing } = useCms();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTocId, setActiveTocId] = useState<string>('');
  const [currentArticle, setCurrentArticle] = useState<InsightArticle>(article);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialTab, setEditorInitialTab] = useState<'content' | 'metadata' | 'faqs'>('content');

  useEffect(() => {
    setCurrentArticle(article);
  }, [article]);

  // Synchronise avec le serveur pour avoir la dernière version enregistrée de l'article
  useEffect(() => {
    let mounted = true;
    async function loadFresh() {
      try {
        const res = await fetch(`/api/site-web/articles/${article.slug}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.article && mounted) {
            setCurrentArticle(data.article);
          }
        }
      } catch (err) {
        console.warn('[InsightDetailPage] Erreur lors de la récupération fraîche de l’article:', err);
      }
    }
    loadFresh();
    return () => {
      mounted = false;
    };
  }, [article.slug]);

  // Définit la page CMS active
  useEffect(() => {
    setCurrentPageId(`article__${article.slug}`);
  }, [setCurrentPageId, article.slug]);

  // Chargement dynamique du produit depuis Firestore s'il existe (pour les produits créés via le backoffice)
  const [liveProduct, setLiveProduct] = useState<ProductRecord | null>(null);

  const activeProductSlug = currentArticle.relatedProductSlug || RELATED_PRODUCT[currentArticle.slug]?.slug;

  useEffect(() => {
    let mounted = true;
    if (!activeProductSlug) {
      setLiveProduct(null);
      return;
    }
    getProductBySlug(activeProductSlug)
      .then((p) => {
        if (mounted && p) {
          setLiveProduct(p);
        }
      })
      .catch((err) => {
        console.warn('[InsightDetailPage] Info produit non trouvée en base pour:', activeProductSlug, err);
      });
    return () => {
      mounted = false;
    };
  }, [activeProductSlug]);

  // Produit associé : priorité aux champs CMS, puis live Firestore, puis fallback sur le mapping statique
  const relatedProduct = useMemo(() => {
    const slug = activeProductSlug;
    if (!slug) return null;
    const summary = PRODUCT_SUMMARIES[slug];

    // Nom : custom CMS > produit Firestore > nom statique > slug
    const name =
      currentArticle.relatedProductName ||
      liveProduct?.name ||
      RELATED_PRODUCT[currentArticle.slug]?.name ||
      summary?.name ||
      slug;

    // Description : summary statique > hero subtitle Firestore > default
    const desc =
      (lang === 'FR' ? summary?.descFr : summary?.descEn) ||
      liveProduct?.hero?.subtitle ||
      (liveProduct?.series ? `${liveProduct.series} · Solution haute performance PixiaTech.` : null);

    const defaultDesc = lang === 'FR'
      ? 'Une solution LED de nouvelle génération, conçue pour offrir une qualité d\'image exceptionnelle et une fiabilité optimale, en intérieur comme en extérieur.'
      : 'A next-generation LED solution engineered for exceptional image quality and optimal reliability, both indoors and outdoors.';

    // Image : photo 0 Firestore > photo summary statique > fallback standard
    const img =
      liveProduct?.media?.photos?.[0]?.url ||
      summary?.img ||
      `/uploads/products/${slug}/front.jpg`;

    return {
      slug,
      name,
      desc: desc || defaultDesc,
      img,
    };
  }, [activeProductSlug, currentArticle.relatedProductName, currentArticle.slug, liveProduct, lang]);

  const nextArticle = useMemo(() => {
    const all = getAllInsightArticles();
    const idx = all.findIndex((a) => a.slug === currentArticle.slug);
    if (idx === -1 || idx === all.length - 1) return all[0];
    return all[idx + 1];
  }, [currentArticle.slug]);

  const content =
    lang === 'FR' ? currentArticle.contentFr ?? currentArticle.content : currentArticle.content;
  const faqs = lang === 'FR' ? currentArticle.faqsFr ?? currentArticle.faqs : currentArticle.faqs;

  const { intro, sections } = useMemo(
    () => parseMarkdownContent(content),
    [content]
  );

  // Filter FAQ from TOC – we'll render it inline without TOC entry clutter
  const tocSections = sections.filter(
    (s) =>
      !s.title.toLowerCase().includes('frequently asked questions') &&
      !s.title.toLowerCase().includes('faq')
  );

  function isFaqSection(sec: ParsedSection) {
    const t = sec.title.toLowerCase();
    return t.includes('frequently asked questions') || t.includes('faq');
  }

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, (window.scrollY / totalHeight) * 100));
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveTocId(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return (
    <RevealRoot className="theme-light">
      {/* Reading progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: 2,
          background: 'var(--line,#dad8d2)',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${scrollProgress}%`,
            background: 'var(--accent,#C3F910)',
            transition: 'width 0.12s linear',
          }}
        />
      </div>

      <PixiaHeader />

      <main style={{ minHeight: '80vh', paddingTop: 'var(--nav-h,88px)' }}>

        {/* ── Article header ───────────────────────────────────────── */}
        <EditableWrapper sectionKey="article_header" sectionLabel="En-tête de l'article">
          <div
            className="wrap"
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '40px var(--gutter,clamp(24px,3.4vw,56px)) 0',
            }}
          >
            {/* Back + category breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 32,
                fontSize: 11,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--muted,#8a8880)',
              }}
            >
              <a
                href="/web/insights"
                data-link-key="back_link"
                style={{
                  color: 'var(--muted,#8a8880)',
                  textDecoration: 'none',
                  transition: 'color .2s',
                  fontWeight: 600,
                }}
                className="hov-acc"
              >
                {lang === 'FR' ? '← RESSOURCES' : '← INSIGHTS'}
              </a>
              <span>/</span>
              <span
                data-text-key="category"
                style={{ color: 'var(--body,#4a4a46)' }}
              >
                {categoryLabel(currentArticle.category, lang)}
              </span>
            </div>

            {/* H1 */}
            <h1
              className="art-h1 pretty"
              data-text-key="title"
              style={{
                fontSize: 'clamp(30px,3.8vw,60px)',
                fontWeight: 900,
                lineHeight: 1.06,
                letterSpacing: '-.025em',
                color: 'var(--ink,#111110)',
                margin: '0 0 20px',
                maxWidth: 960,
              }}
            >
              {titleOf(currentArticle, lang)}
            </h1>

            {/* Lead */}
            {descOf(currentArticle, lang) && (
              <p
                className="pretty"
                data-text-key="desc"
                style={{
                  fontSize: 'clamp(16px,1.2vw,19px)',
                  lineHeight: 1.6,
                  color: 'var(--body,#4a4a46)',
                  maxWidth: 800,
                  margin: '0 0 24px',
                }}
              >
                {descOf(currentArticle, lang)}
              </p>
            )}

            {/* Meta row */}
            <div
              data-text-key="meta_row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                flexWrap: 'wrap',
                fontSize: 11,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--muted,#8a8880)',
                borderBottom: '1px solid var(--line,#dad8d2)',
                paddingBottom: 20,
                marginBottom: 0,
              }}
            >
              <span style={{ fontWeight: 700 }}>PIXIATECH</span>
              <span>·</span>
              <span>{dateOf(currentArticle, lang)}</span>
              <span>·</span>
              <span>{readOf(currentArticle.read, lang)}</span>
            </div>
          </div>
        </EditableWrapper>

        {/* ── Cover image ──────────────────────────────────────────── */}
        <EditableWrapper sectionKey="article_cover" sectionLabel="Image de couverture">
          <div
            className="wrap"
            style={{
              maxWidth: 1280,
              margin: '0 auto',
              padding: '0 var(--gutter,clamp(24px,3.4vw,56px))',
            }}
          >
            <div
              style={{
                position: 'relative',
                height: 'min(62vh,580px)',
                overflow: 'hidden',
                background: '#e0ded8',
                margin: '0 0 0',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-image-key="cover_image"
                src={currentArticle.img}
                alt={titleOf(currentArticle, lang)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </EditableWrapper>

        {/* ── Two-column body ──────────────────────────────────────── */}
        <div
          className="wrap"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 var(--gutter,clamp(24px,3.4vw,56px)) 100px',
            display: 'grid',
            gridTemplateColumns: '220px minmax(0,1fr)',
            gap: 'clamp(36px,4vw,72px)',
            alignItems: 'start',
          }}
        >
          {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
          <EditableWrapper sectionKey="article_sidebar" sectionLabel="Barre latérale (Sommaire)">
            <aside
              className="toc"
              style={{
                position: 'sticky',
                top: 104,
                display: 'flex',
                flexDirection: 'column',
                gap: 28,
                paddingTop: 36,
              }}
            >
            {/* Table of Contents */}
            {tocSections.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--muted,#8a8880)',
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  {lang === 'FR' ? 'DANS CET ARTICLE' : 'IN THIS ARTICLE'}
                </div>
                <nav
                  style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
                >
                  {tocSections.map((t) => {
                    const isActive = activeTocId === t.id;
                    return (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        style={{
                          display: 'block',
                          fontSize: 12.5,
                          lineHeight: 1.45,
                          padding: '6px 0 6px 12px',
                          color: isActive
                            ? 'var(--ink,#111110)'
                            : 'var(--body,#4a4a46)',
                          fontWeight: isActive ? 700 : 400,
                          borderLeft: `2px solid ${
                            isActive
                              ? 'var(--accent,#C3F910)'
                              : 'transparent'
                          }`,
                          transition: 'color .2s, border-color .2s',
                          textDecoration: 'none',
                        }}
                      >
                        {t.title}
                      </a>
                    );
                  })}
                </nav>
              </div>
            )}

            </aside>
          </EditableWrapper>

          {/* ── MAIN ARTICLE BODY ────────────────────────────────── */}
          <EditableWrapper sectionKey="article_body" sectionLabel="Corps de l'article (Markdown)">
            <article
              id="art-body"
            style={{
              fontSize: 'clamp(16px,1.1vw,17.5px)',
              lineHeight: 1.75,
              color: 'var(--body,#4a4a46)',
              paddingTop: 36,
            }}
          >
            {/* Intro paragraphs */}
            {intro.map((p, i) => (
              <p
                key={i}
                className="pretty"
                style={{
                  fontSize: 'clamp(16px,1.15vw,18px)',
                  lineHeight: 1.68,
                  color: 'var(--body,#4a4a46)',
                  margin: '0 0 20px',
                }}
              >
                {p}
              </p>
            ))}

            {/* ── GRAND BLOC PRODUIT ASSOCIÉ (immédiatement sous le paragraphe introductif) ── */}
            {relatedProduct && (
              <div
                className="article-related-product-card"
                data-element-key="main_related_product_card"
              >
                <div className="article-related-product-content">
                  <div
                    className="article-related-product-badge"
                    data-text-key="product_badge"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{lang === 'FR' ? 'PRODUIT ASSOCIÉ' : 'RELATED PRODUCT'}</span>
                  </div>

                  <h3
                    className="article-related-product-title"
                    data-text-key="product_name"
                  >
                    {relatedProduct.name}
                  </h3>

                  <p
                    className="article-related-product-desc pretty"
                    data-text-key="product_desc"
                  >
                    {relatedProduct.desc}
                  </p>

                  <a
                    className="article-related-product-btn"
                    data-element-key="product_cta_button"
                    href={`/web/product/${relatedProduct.slug}`}
                  >
                    <span>{lang === 'FR' ? 'VOIR LE PRODUIT' : 'VIEW PRODUCT'}</span>
                    <span className="btn-arrow" aria-hidden="true">→</span>
                  </a>
                </div>

                <div className="article-related-product-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={relatedProduct.img}
                    alt={relatedProduct.name}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/front.jpg')) {
                        target.src = `/uploads/products/${relatedProduct.slug}/front.jpg`;
                      }
                    }}
                  />
                </div>

                {/* Bouton d'édition rapide du produit pour les administrateurs CMS */}
                {isAdmin && isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditorInitialTab('metadata');
                      setIsEditorOpen(true);
                    }}
                    data-cms-ui
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#111110',
                      color: '#C3F910',
                      border: '1px solid #C3F910',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                    title={lang === 'FR' ? 'Changer le produit associé (CMS)' : 'Change related product (CMS)'}
                  >
                    <Edit3 size={11} />
                    <span>{lang === 'FR' ? 'Changer produit' : 'Change product'}</span>
                  </button>
                )}
              </div>
            )}

            {!relatedProduct && isAdmin && isEditing && (
              <div
                style={{
                  border: '1px dashed var(--line,#dad8d2)',
                  borderRadius: 12,
                  padding: '20px',
                  background: '#fafaf9',
                  textAlign: 'center',
                  margin: '24px 0 36px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setEditorInitialTab('metadata');
                    setIsEditorOpen(true);
                  }}
                  data-cms-ui
                  style={{
                    background: '#111110',
                    color: '#C3F910',
                    border: '1px solid #C3F910',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Associer un produit PixiaTech (CMS)
                </button>
              </div>
            )}

            {/* Sections */}
            {sections.map((section, idx) => {
              const isFaq = isFaqSection(section);

              return (
                <section
                  key={section.id}
                  id={section.id}
                  style={{ scrollMarginTop: 110, marginBottom: 48, paddingTop: 36 }}
                >
                  <h2
                    style={{
                      fontSize: 'clamp(22px,2.2vw,30px)',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      letterSpacing: '-.015em',
                      color: 'var(--ink,#111110)',
                      margin: '0 0 20px',
                      borderTop: idx === 0 && relatedProduct ? 'none' : '1px solid var(--line,#dad8d2)',
                      paddingTop: idx === 0 && relatedProduct ? 0 : 32,
                    }}
                  >
                    {section.title}
                  </h2>

                  {/* FAQ – interactive accordions */}
                  {isFaq && faqs && faqs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {faqs.map((faq, fi) => (
                        <details
                          key={fi}
                          style={{
                            border: '1px solid var(--line,#dad8d2)',
                            padding: '18px 20px',
                            cursor: 'pointer',
                          }}
                        >
                          <summary
                            style={{
                              listStyle: 'none',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: 16,
                              fontWeight: 700,
                              color: 'var(--ink,#111110)',
                              gap: 12,
                              outline: 'none',
                            }}
                          >
                            <span>{faq.question}</span>
                            <span
                              style={{
                                fontSize: 22,
                                fontWeight: 300,
                                color: 'var(--muted,#8a8880)',
                                flexShrink: 0,
                                lineHeight: 1,
                              }}
                            >
                              +
                            </span>
                          </summary>
                          <p
                            style={{
                              margin: '14px 0 0',
                              fontSize: 15.5,
                              lineHeight: 1.65,
                              color: 'var(--body,#4a4a46)',
                              borderTop: '1px solid var(--line-2,#e2e0da)',
                              paddingTop: 12,
                            }}
                          >
                            {faq.answer}
                          </p>
                        </details>
                      ))}
                    </div>
                  ) : (
                    /* Regular section paragraphs */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {section.paragraphs.map((item, pi) => {
                        if (item.type === 'h3') {
                          return (
                            <h3
                              key={pi}
                              style={{
                                fontSize: 'clamp(18px,1.6vw,22px)',
                                fontWeight: 700,
                                lineHeight: 1.3,
                                letterSpacing: '-.01em',
                                color: 'var(--ink,#111110)',
                                margin: '14px 0 4px',
                              }}
                            >
                              {item.text}
                            </h3>
                          );
                        }

                        if (item.type === 'quote') {
                          return (
                            <blockquote
                              key={pi}
                              style={{
                                margin: '8px 0',
                                padding: '18px 0 18px 20px',
                                borderLeft: '3px solid var(--accent,#C3F910)',
                                fontSize: 'clamp(17px,1.3vw,20px)',
                                fontStyle: 'italic',
                                lineHeight: 1.55,
                                color: 'var(--ink,#111110)',
                                background: 'transparent',
                              }}
                            >
                              "{item.text}"
                            </blockquote>
                          );
                        }

                        if (item.type === 'list') {
                          return (
                            <div
                              key={pi}
                              style={{
                                display: 'flex',
                                gap: 18,
                                alignItems: 'baseline',
                                padding: '8px 0',
                                borderBottom: '1px solid var(--line-2,#e2e0da)',
                              }}
                            >
                              <span
                                style={{
                                  fontVariantNumeric: 'tabular-nums',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  letterSpacing: '.05em',
                                  color: 'var(--accent,#649600)',
                                  flexShrink: 0,
                                  minWidth: 22,
                                }}
                              >
                                {item.num}
                              </span>
                              <span style={{ fontSize: 15.5, lineHeight: 1.65 }}>
                                {item.text}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <p key={pi} className="pretty" style={{ margin: 0 }}>
                            {item.text}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
            </article>
          </EditableWrapper>
        </div>

        {/* ── Next article ─────────────────────────────────────────── */}
        {nextArticle && (
          <EditableWrapper sectionKey="article_next" sectionLabel="Ressource suivante">
            <div
              style={{
                borderTop: '1px solid var(--line,#dad8d2)',
                background: 'var(--paper,#f5f4f0)',
                padding: '56px 0 80px',
              }}
            >
              <div
                className="wrap"
                style={{
                  maxWidth: 1280,
                  margin: '0 auto',
                  padding: '0 var(--gutter,clamp(24px,3.4vw,56px))',
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '.24em',
                    textTransform: 'uppercase',
                    color: 'var(--muted,#8a8880)',
                    fontWeight: 700,
                    marginBottom: 22,
                  }}
                >
                  {lang === 'FR' ? 'RESSOURCE SUIVANTE' : 'NEXT INSIGHT'}
                </div>

                <a
                  href={`/web/insights/${nextArticle.slug}`}
                  className="art"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'min(380px,45%) 1fr',
                    gap: 'clamp(24px,3.6vw,52px)',
                    alignItems: 'center',
                    color: 'var(--ink,#111110)',
                    textDecoration: 'none',
                    border: '1px solid var(--line,#dad8d2)',
                    background: '#fff',
                    padding: 'clamp(18px,2.4vw,30px)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 240,
                      overflow: 'hidden',
                      background: '#e0ded8',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="slot-img"
                      src={nextArticle.img}
                      alt={titleOf(nextArticle, lang)}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 10.5,
                        letterSpacing: '.2em',
                        textTransform: 'uppercase',
                        color: 'var(--accent,#649600)',
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      {categoryLabel(nextArticle.category, lang)}
                    </div>

                    <h3
                      className="art-t pretty"
                      style={{
                        fontSize: 'clamp(20px,1.9vw,28px)',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        letterSpacing: '-.01em',
                        margin: '0 0 14px',
                      }}
                    >
                      {titleOf(nextArticle, lang)}
                    </h3>

                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: '.15em',
                        textTransform: 'uppercase',
                        color: 'var(--muted,#8a8880)',
                        marginBottom: 20,
                      }}
                    >
                      {readOf(nextArticle.read, lang)} · {dateOf(nextArticle, lang)}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11.5,
                        fontWeight: 800,
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        color: 'var(--ink,#111110)',
                        borderBottom: '2px solid var(--accent,#C3F910)',
                        paddingBottom: 2,
                      }}
                    >
                      {lang === 'FR' ? "LIRE L'ARTICLE →" : 'READ FULL INSIGHT →'}
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </EditableWrapper>
        )}
      </main>

      <PixiaFooter lang={lang} />

      {/* Bouton d'édition d'article complet pour les administrateurs */}
      {isAdmin && isEditing && (
        <button
          type="button"
          onClick={() => setIsEditorOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 22px',
            background: '#111110',
            color: '#C3F910',
            border: '1.5px solid #C3F910',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            cursor: 'pointer',
          }}
          className="hov-scale"
          title={lang === 'FR' ? "Ouvrir l'éditeur complet de cet article" : 'Open full article editor'}
        >
          <Edit3 size={16} />
          {lang === 'FR' ? "Éditer l'article (Markdown & Métadonnées)" : 'Edit Article (Markdown & Metadata)'}
        </button>
      )}

      <ArticleEditorModal
        article={currentArticle}
        isOpen={isEditorOpen && isAdmin && isEditing}
        initialTab={editorInitialTab}
        onClose={() => setIsEditorOpen(false)}
        onSaved={(updated) => {
          setCurrentArticle(updated);
        }}
      />
    </RevealRoot>
  );
}
