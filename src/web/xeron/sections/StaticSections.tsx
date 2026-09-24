'use client';

import React, { useEffect, useRef } from 'react';
import { XERON_INSIGHTS, XERON_PROCESS, XERON_PROJECTS } from '../../xeron-data';
import { usePrefersReducedMotion } from '../../xeron-hooks';
import { Language } from '../../xeron-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { useSectionStyle } from '../../cms/useSectionStyle';

const stripArticles = XERON_INSIGHTS.filter((a) => !a.featured).slice(0, 3);

interface SectionCommonProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

/** 08 / PROJECTS (Image 3) — Real World Installations Grid */
export const ProjectsSection: React.FC<SectionCommonProps> = ({
  lang = 'FR',
  onOpenConsultation,
}) => {
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.projects as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);

  const t = {
    eyebrow: (cmsData.badge as string) || (cmsData.eyebrow as string) || (lang === 'FR' ? '08 / PROJETS & RÉALISATIONS' : '08 / PROJECTS'),
    titleLine1: (cmsData.title as string) || (lang === 'FR' ? 'Déployé dans' : 'Built in'),
    titleLine2: (cmsData.titleLine2 as string) || (lang === 'FR' ? 'le monde réel.' : 'the real world.'),
    desc:
      (cmsData.description as string) ||
      (cmsData.subtitle as string) ||
      (lang === 'FR'
        ? "Scènes de festivals, studios de production virtuelle, façades DOOH et campus universitaires — études de cas concrètes de nos déploiements."
        : 'Festival stages, virtual production studios, DOOH façades and campus displays — case studies on the projects page.'),
    allProjects: (cmsData.primaryCta as string) || (cmsData.ctaText as string) || (lang === 'FR' ? 'TOUS LES PROJETS →' : 'ALL PROJECTS →'),
  };

  return (
    <section
      id="projects"
      className="section theme-dark"
      style={{
        position: 'relative',
        background: '#080808',
        ...cms.section,
      }}
    >
      {cms.hasOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: cms.overlayColor,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.24em',
            color: 'var(--dark-muted)',
            marginBottom: 36,
            fontFamily: 'monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {t.eyebrow}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <h2 className="display" style={{ margin: 0, color: '#F5F4F0', ...cms.title }}>
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h2>
          <button
            type="button"
            onClick={onOpenConsultation}
            className="btn btn-solid"
            style={{
              padding: '16px 28px',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              background: '#F5F4F0',
              color: '#080808',
              border: 0,
              cursor: 'pointer',
              transition: 'background .25s ease, color .25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#C3F910';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F5F4F0';
            }}
          >
            {t.allProjects}
          </button>
        </div>

        <p
          className="lede pretty"
          data-reveal="true"
          style={{
            margin: '28px 0 64px',
            maxWidth: 620,
            color: '#A3A3A3',
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          {t.desc}
        </p>

        {/* 4 Projects Grid (Matches Image 3) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {XERON_PROJECTS.map((p, idx) => {
            const projectImg = (cmsData[`project_${idx}_image`] as string) || (cmsData[`image_${idx}`] as string) || p.img;
            return (
            <div
              key={p.title}
              onClick={onOpenConsultation}
              style={{ display: 'block', cursor: 'pointer' }}
              className="group"
            >
              <div
                style={{
                  position: 'relative',
                  height: 250,
                  overflow: 'hidden',
                  border: '1px solid #1f1f1f',
                  background: '#0d0d0c',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="slot-img"
                  data-image-key={`project_${idx}_image`}
                  src={projectImg}
                  alt={p.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform .7s cubic-bezier(.2,.8,.2,1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 12,
                  marginTop: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: '#F5F4F0',
                    lineHeight: 1.4,
                  }}
                >
                  {p.title.replace('&rsquo;', "'")}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    letterSpacing: '.14em',
                    color: '#7A7A76',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {p.meta}
                </span>
              </div>

              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.18em',
                  color: '#C3F910',
                  marginTop: 6,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {p.tag}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </section>
  );
};

/** 09 / PROCESS (Image 4) — scroll-accent line + step rows */
export const ProcessSection: React.FC<SectionCommonProps> = ({
  lang = 'FR',
}) => {
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.process as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const ref = useRef<HTMLElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const t = {
    eyebrow: (cmsData.badge as string) || (cmsData.eyebrow as string) || (lang === 'FR' ? '09 / MÉTHODOLOGIE & PROCESS' : '09 / PROCESS'),
    titleLine1: (cmsData.title as string) || (lang === 'FR' ? "De l'idée" : 'From idea'),
    titleLine2: (cmsData.titleLine2 as string) || (lang === 'FR' ? 'à la première lumière.' : 'to first light.'),
  };

  const processSteps = [
    {
      index: '01',
      title: lang === 'FR' ? 'DÉCOUVERTE' : 'DISCOVER',
      desc:
        lang === 'FR'
          ? "Compréhension fine de l'environnement architectural, des flux d'audience et des objectifs scénographiques."
          : 'Understanding the environment, audience and project objectives.',
    },
    {
      index: '02',
      title: lang === 'FR' ? 'INGÉNIERIE' : 'ENGINEER',
      desc:
        lang === 'FR'
          ? 'Calcul du pas de pixel, luminance cible, tolérance thermique et architecture de distribution de signal.'
          : 'Pixel pitch, brightness, structure and system architecture.',
    },
    {
      index: '03',
      title: lang === 'FR' ? 'DESIGN' : 'DESIGN',
      desc:
        lang === 'FR'
          ? 'Intégration mécanique invisible, sous-structures mécano-soudées et coordination technique avec les corps de métier.'
          : 'Architectural and visual integration.',
    },
    {
      index: '04',
      title: lang === 'FR' ? 'CRÉATION' : 'CREATE',
      desc:
        lang === 'FR'
          ? 'Production de contenus LED natifs — motion design sur mesure adapté au ratio, à la résolution et à la géométrie de chaque surface.'
          : 'LED-native content production — motion design tailored to each screen\u2019s resolution, form and environment.',
    },
    {
      index: '05',
      title: lang === 'FR' ? 'INSTALLATION' : 'INSTALL',
      desc:
        lang === 'FR'
          ? 'Mise en œuvre sur site par des équipes habilitées, levage de précision et raccordements certifiés.'
          : 'Professional on-site implementation.',
    },
    {
      index: '06',
      title: lang === 'FR' ? 'CALIBRATION' : 'CALIBRATE',
      desc:
        lang === 'FR'
          ? 'Étalonnage spectrométrique, homogénéisation des gradients de luminance et mise en service complète.'
          : 'Image optimization and system commissioning.',
    },
    {
      index: '07',
      title: lang === 'FR' ? 'SUPPORT' : 'SUPPORT',
      desc:
        lang === 'FR'
          ? 'Supervision télémétrique en temps réel, stocks de pièces de rechange dédiées et garantie complète de 5 ans.'
          : 'Maintenance and long-term technical service.',
    },
  ];

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      const line = lineRef.current;
      if (!el || !line) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 1;
      line.style.transform = `scaleY(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section
      id="process"
      ref={ref}
      className="theme-dark sec-lg"
      style={{
        position: 'relative',
        background: '#0d0d0c',
        borderTop: '1px solid #1f1f1f',
        paddingTop: 'clamp(90px, 12vh, 150px)',
        paddingBottom: 'clamp(90px, 12vh, 150px)',
        paddingLeft: 0,
        paddingRight: 0,
        ...cms.section,
      }}
    >
      {cms.hasOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: cms.overlayColor,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.24em',
            color: 'var(--dark-muted)',
            marginBottom: 36,
            fontFamily: 'monospace',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {t.eyebrow}
        </div>
        <h2
          className="display"
          data-reveal="true"
          style={{
            marginBottom: 72,
            fontSize: 'clamp(38px, 4.4vw, 76px)',
            fontWeight: 900,
            letterSpacing: '-.03em',
            lineHeight: 1.04,
            color: '#F5F4F0',
            ...cms.title,
          }}
        >
          {t.titleLine1}
          <br />
          {t.titleLine2}
        </h2>

        {/* Process Step Rows with animated red/accent indicator line (Matches Image 4) */}
        <div style={{ position: 'relative', paddingLeft: 'clamp(36px, 4vw, 64px)' }}>
          {/* Base track line */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 1,
              background: '#222',
            }}
          />
          {/* Animated fill line */}
          <div
            ref={lineRef}
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#C3F910',
              transform: 'scaleY(0)',
              transformOrigin: 'top',
              willChange: 'transform',
            }}
          />

          {processSteps.map((s, i) => (
            <div
              className="proc-row"
              key={s.title}
              style={{
                display: 'grid',
                gridTemplateColumns: 'clamp(60px, 6vw, 100px) clamp(160px, 18vw, 260px) 1fr',
                alignItems: 'baseline',
                gap: 24,
                padding: '36px 0',
                borderBottom: i === processSteps.length - 1 ? 'none' : '1px solid #1f1f1f',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: '.2em',
                  color: '#C3F910',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                }}
              >
                {s.index}
              </span>
              <span
                style={{
                  fontSize: 'clamp(22px, 2vw, 32px)',
                  fontWeight: 800,
                  letterSpacing: '.04em',
                  color: '#F5F4F0',
                  textTransform: 'uppercase',
                }}
              >
                {s.title}
              </span>
              <span
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.6,
                  color: '#A3A3A3',
                  maxWidth: 680,
                }}
              >
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/** 10 / PIXIATECH EXPERIENCE CENTER */
export const ExperienceSection: React.FC<SectionCommonProps> = ({
  lang = 'FR',
  onOpenConsultation,
}) => {
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.experience as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const bgImage = (cmsData.image as string) || (cmsData.heroImage as string) || (cmsData.primaryImage as string) || '/uploads/site/xc-bg.jpg';

  const t = {
    eyebrow: (cmsData.badge as string) || (cmsData.eyebrow as string) || (lang === 'FR' ? '10 / PIXIATECH EXPERIENCE CENTER' : '10 / PIXIATECH EXPERIENCE CENTER'),
    title:
      (cmsData.title as string) ||
      (lang === 'FR'
        ? 'La lumière prend tout son sens lorsque vous vous tenez devant elle.'
        : 'Pixels make more sense when you stand in front of them.'),
    cta1: (cmsData.primaryCta as string) || (cmsData.ctaText as string) || (cmsData.cta1 as string) || (lang === 'FR' ? 'Visiter le PIXIATECH Experience Center →' : 'Visit PixiaTech Experience Center →'),
    cta2: (cmsData.secondaryCta as string) || (cmsData.cta2 as string) || (lang === 'FR' ? 'Réserver une démo technique →' : 'Book a Demo →'),
    location: (cmsData.location as string) || (lang === 'FR' ? 'PARIS & SHOWROOM EUROPÉEN' : 'PARIS & EUROPEAN SHOWROOM'),
  };

  return (
    <section
      id="experience"
      className="theme-dark xc-sec"
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: 'min(88vh, 820px)',
        minHeight: 520,
        background: '#080808',
        ...cms.section,
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="slot-img"
          data-image-key="image"
          src={bgImage}
          alt="PixiaTech Experience Center"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8,8,8,.35) 0%, rgba(8,8,8,.85) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', pointerEvents: 'none' }}>
        <div
          style={{
            maxWidth: 1520,
            width: '100%',
            margin: '0 auto',
            padding: '0 clamp(16px, 3.5vw, 64px) 72px',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.24em',
              color: '#C9C7C1',
              marginBottom: 24,
              fontFamily: 'monospace',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {t.eyebrow}
          </div>
          <h2
            className="pretty h-xc"
            data-reveal="true"
            style={{
              margin: '0 0 36px',
              lineHeight: 1.04,
              maxWidth: 980,
              fontSize: 'clamp(34px, 4.4vw, 70px)',
              fontWeight: 900,
              color: '#F5F4F0',
              ...cms.title,
            }}
          >
            {t.title}
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              pointerEvents: 'auto',
              marginBottom: 32,
            }}
          >
            <button
              type="button"
              onClick={onOpenConsultation}
              className="btn btn-solid"
              style={{
                padding: '16px 28px',
                fontSize: 13.5,
                fontWeight: 800,
                textTransform: 'none',
                letterSpacing: '.04em',
                background: '#C3F910',
                color: '#080808',
                border: 0,
                cursor: 'pointer',
              }}
            >
              {t.cta1}
            </button>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="btn btn-outline"
              style={{
                padding: '15px 28px',
                fontSize: 13.5,
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '.04em',
                border: '1px solid rgba(245,244,240,.4)',
                background: 'transparent',
                color: '#F5F4F0',
                cursor: 'pointer',
              }}
            >
              {t.cta2}
            </button>
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '.16em',
              color: '#A3A3A3',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            {t.location}
          </div>
        </div>
      </div>
    </section>
  );
};

/** 11 / INSIGHTS strip (home version — 3 cards) — Theme Light */
export const InsightsSection: React.FC<SectionCommonProps> = ({
  lang = 'FR',
}) => {
  const { pages } = useCms();
  const cmsData = (pages['home']?.sections?.insights as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);

  const t = {
    eyebrow: (cmsData.badge as string) || (cmsData.eyebrow as string) || (lang === 'FR' ? '11 / RESSOURCES & INSIGHTS' : '11 / INSIGHTS'),
    titleLine1: (cmsData.title as string) || (lang === 'FR' ? 'Notes sur la lumière,' : 'Notes on light,'),
    titleLine2: (cmsData.titleLine2 as string) || (lang === 'FR' ? 'les pixels et l’espace.' : 'pixels and space.'),
    allArticles: (cmsData.primaryCta as string) || (cmsData.ctaText as string) || (lang === 'FR' ? 'TOUS LES ARTICLES →' : 'ALL ARTICLES →'),
  };

  return (
    <section
      id="insights"
      className="theme-light sec-lg"
      style={{
        position: 'relative',
        background: '#f5f4f0',
        color: '#111110',
        paddingTop: 'clamp(90px, 12vh, 150px)',
        paddingBottom: 'clamp(90px, 12vh, 150px)',
        paddingLeft: 0,
        paddingRight: 0,
        borderTop: '1px solid #e5e4de',
        ...cms.section,
      }}
    >
      {cms.hasOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: cms.overlayColor,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 24,
            marginBottom: 64,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#8A8880',
                marginBottom: 36,
                fontFamily: 'monospace',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {t.eyebrow}
            </div>
            <h2
              className="h-insights"
              style={{
                lineHeight: 1.04,
                fontSize: 'clamp(36px, 4.4vw, 68px)',
                fontWeight: 900,
                color: '#111110',
                margin: 0,
                ...cms.title,
              }}
            >
              {t.titleLine1}
              <br />
              {t.titleLine2}
            </h2>
          </div>
          <a
            className="link-ul"
            href="/web/insights"
            style={{
              color: '#111110',
              fontWeight: 800,
              fontSize: 12.5,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              borderBottom: '2px solid #111110',
              paddingBottom: 4,
            }}
          >
            {t.allArticles}
          </a>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: 28,
          }}
        >
          {stripArticles.map((a, idx) => {
            const cardImg = (cmsData[`insight_${idx}_image`] as string) || (cmsData[`image_${idx}`] as string) || a.img;
            return (
            <a
              className="art"
              href="/web/insights"
              key={a.slug}
              style={{ color: '#111110', textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  height: 280,
                  position: 'relative',
                  marginBottom: 20,
                  overflow: 'hidden',
                  background: '#e0ded8',
                }}
              >
                <div className="art-img" style={{ position: 'absolute', inset: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="slot-img"
                    data-image-key={`insight_${idx}_image`}
                    src={cardImg}
                    alt={a.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform .6s ease',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  letterSpacing: '.2em',
                  color: '#649600',
                  marginBottom: 10,
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {a.category}
              </div>
              <div
                className="art-t pretty"
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  letterSpacing: '-.01em',
                  marginBottom: 12,
                  color: '#111110',
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.16em',
                  color: '#8A8880',
                  fontFamily: 'monospace',
                }}
              >
                {a.read}
              </div>
            </a>
          );
        })}
        </div>
      </div>
    </section>
  );
};