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
  const { setCurrentPageId } = useCms();
  const lang: Language = locale === 'en' ? 'EN' : 'FR';
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTocId, setActiveTocId] = useState<string>('');

  // L'article Ressources partage la page CMS "insights" (même contexte que la
  // liste) : sans cela, la page arrivée en direct restait sur l'id précédent.
  // Le corps de l'article est un contenu du référentiel éditorial, pas un texte
  // de page — il n'est volontairement pas éditable inline (voir rapport).
  useEffect(() => {
    setCurrentPageId('insights');
  }, [setCurrentPageId]);

  const relatedProduct = RELATED_PRODUCT[article.slug];

  const nextArticle = useMemo(() => {
    const all = getAllInsightArticles();
    const idx = all.findIndex((a) => a.slug === article.slug);
    if (idx === -1 || idx === all.length - 1) return all[0];
    return all[idx + 1];
  }, [article.slug]);

  const content =
    lang === 'FR' ? article.contentFr ?? article.content : article.content;
  const faqs = lang === 'FR' ? article.faqsFr ?? article.faqs : article.faqs;

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
            <span style={{ color: 'var(--body,#4a4a46)' }}>
              {categoryLabel(article.category, lang)}
            </span>
          </div>

          {/* H1 */}
          <h1
            className="art-h1 pretty"
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
            {titleOf(article, lang)}
          </h1>

          {/* Lead */}
          {descOf(article, lang) && (
            <p
              className="pretty"
              style={{
                fontSize: 'clamp(16px,1.2vw,19px)',
                lineHeight: 1.6,
                color: 'var(--body,#4a4a46)',
                maxWidth: 800,
                margin: '0 0 24px',
              }}
            >
              {descOf(article, lang)}
            </p>
          )}

          {/* Meta row */}
          <div
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
            <span>{dateOf(article, lang)}</span>
            <span>·</span>
            <span>{readOf(article.read, lang)}</span>
          </div>
        </div>

        {/* ── Cover image ──────────────────────────────────────────── */}
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
              src={article.img}
              alt={titleOf(article, lang)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>

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

            {/* Related product box */}
            {relatedProduct && (
              <div
                style={{
                  border: '1px solid var(--line,#dad8d2)',
                  padding: '20px 18px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--muted,#8a8880)',
                    fontWeight: 700,
                    marginBottom: 10,
                  }}
                >
                  {lang === 'FR' ? 'PRODUIT ASSOCIÉ' : 'RELATED SERIES'}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: 'var(--ink,#111110)',
                    marginBottom: 10,
                    letterSpacing: '-.01em',
                  }}
                >
                  {relatedProduct.name}
                </div>
                <a
                  href={`/web#products`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '.14em',
                    textTransform: 'uppercase',
                    color: 'var(--accent,#649600)',
                    textDecoration: 'none',
                    borderBottom: '1px solid currentColor',
                    paddingBottom: 2,
                  }}
                >
                  {lang === 'FR' ? 'VOIR LE PRODUIT →' : 'VIEW PRODUCT →'}
                </a>
              </div>
            )}
          </aside>

          {/* ── MAIN ARTICLE BODY ────────────────────────────────── */}
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

            {/* Sections */}
            {sections.map((section) => {
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
                      borderTop: '1px solid var(--line,#dad8d2)',
                      paddingTop: 32,
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
        </div>

        {/* ── Next article ─────────────────────────────────────────── */}
        {nextArticle && (
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
        )}
      </main>

      <PixiaFooter lang={lang} />
    </RevealRoot>
  );
}
