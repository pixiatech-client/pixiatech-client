'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface HeroSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const router = useRouter();
  const { pages, currentLang, isEditing } = useCms();
  const cmsHero = pages['home']?.sections?.hero || {};
  const cmsData = cmsHero as Record<string, unknown>;
  const cms = useSectionStyle(cmsData);
  const [activeSlide, setActiveSlide] = useState(0);

  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  // Les images de slides sont lues avec priorité sur le champ plat racine
  // (écrit par HeroSlidersAdmin ou l'API) puis sur le stockage _i18n
  // (écrit par updateSectionField) pour compatibilité absolue.
  const slideImage1 =
    (cmsHero.slideImage1 as string | undefined) ||
    getCmsText(cmsHero, 'slideImage1', 'fr') ||
    (cmsHero.primaryImage as string | undefined) ||
    (cmsHero.heroImage as string | undefined) ||
    '/uploads/site/hero-1.jpg';
  const slideImage2 =
    (cmsHero.slideImage2 as string | undefined) ||
    getCmsText(cmsHero, 'slideImage2', 'fr') ||
    '/uploads/site/hero-2.jpg';
  const slideImage3 =
    (cmsHero.slideImage3 as string | undefined) ||
    getCmsText(cmsHero, 'slideImage3', 'fr') ||
    '/uploads/site/hero-3.jpg';

  const slides = [
    {
      img: slideImage1,
      alt: activeLang === 'fr'
        ? 'Installation LED — hall architectural avec structure illuminée'
        : 'LED installation — architectural lobby with illuminated structure',
      imageKey: 'slideImage1',
    },
    {
      img: slideImage2,
      alt: activeLang === 'fr'
        ? 'Installation LED — atrium avec écran LED immersif'
        : 'LED installation — atrium with immersive LED display',
      imageKey: 'slideImage2',
    },
    {
      img: slideImage3,
      alt: activeLang === 'fr'
        ? 'Installation LED — mur LED panoramique incurvé'
        : 'LED installation — curved panoramic LED wall',
      imageKey: 'slideImage3',
    },
  ];

  useEffect(() => {
    if (isEditing) return; // Ne pas faire tourner automatiquement en mode édition
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isEditing]);

  const t = {
    eyebrow: getCmsText(cmsHero, 'badge', activeLang, 'PIXIATECH / VISUAL TECHNOLOGY'),
    h1Line1: getCmsText(cmsHero, 'title', activeLang, activeLang === 'fr' ? "L'INGÉNIERIE" : 'ENGINEERED'),
    h1Line2: getCmsText(cmsHero, 'tagline', activeLang, activeLang === 'fr' ? 'DU VISIBLE.' : 'TO BE SEEN.'),
    sub:
      getCmsText(cmsHero, 'description', activeLang) ||
      getCmsText(
        cmsHero,
        'subtitle',
        activeLang,
        activeLang === 'fr'
          ? "Systèmes d'affichage LED professionnels conçus pour l'architecture, l'entreprise et des expériences visuelles inoubliables."
          : 'Professional LED display systems engineered for architecture, business and unforgettable visual experiences.'
      ),
    cta1: getCmsText(
      cmsHero,
      'primaryCta',
      activeLang,
      getCmsText(cmsHero, 'ctaText', activeLang, activeLang === 'fr' ? 'Explorer les solutions →' : 'Explore Solutions →')
    ),
    cta2: getCmsText(cmsHero, 'secondaryCta', activeLang, activeLang === 'fr' ? 'Démarrer un projet →' : 'Start a Project →'),
    city: activeLang === 'fr' ? 'PARIS · MONDE' : 'PARIS · GLOBAL PROJECTS',
    scroll: activeLang === 'fr' ? 'DÉFILEZ POUR DÉCOUVRIR ↓' : 'SCROLL TO DISCOVER ↓',
    tagline: activeLang === 'fr' ? "SYSTÈMES D'AFFICHAGE LED" : 'LED DISPLAY SYSTEMS',
  };

  return (
    <section
      id="top"
      data-cms-section="hero"
      className="hero"
      style={{
        ...cms.section,
      }}
    >
      {/* Background Slides with smooth fade & Ken Burns zoom */}
      {slides.map((s, idx) => {
        const isActive = idx === activeSlide;
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
              transition: 'opacity .9s ease, transform 4s linear',
              willChange: 'transform',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.img}
              alt={s.alt}
              className="slot-img"
              data-image-key={s.imageKey}
            />
          </div>
        );
      })}

      {/* Indicateur de slider actif en mode édition pour basculer facilement */}
      {isEditing && (
        <div
          data-cms-ui
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            background: 'rgba(14, 14, 13, 0.94)',
            border: '1px solid #C3F910',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#C3F910' }}>
            SLIDER ACTIF :
          </span>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              data-cms-ignore
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveSlide(i);
              }}
              style={{
                padding: '4px 9px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 700,
                cursor: 'pointer',
                background: i === activeSlide ? '#C3F910' : '#222',
                color: i === activeSlide ? '#080808' : '#aaa',
                border: i === activeSlide ? '1px solid #C3F910' : '1px solid #444',
                transition: 'all 0.15s ease',
              }}
            >
              0{i + 1}
            </button>
          ))}
          <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>
            (cliquez sur le fond pour changer la photo)
          </span>
        </div>
      )}

      {/* Top right slide indicator dots */}
      <div className="hero-dots-top" data-cms-ui>
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            data-cms-ignore
            className={`hero-dot ${i === activeSlide ? 'on' : ''}`}
            aria-current={i === activeSlide ? 'true' : undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveSlide(i);
            }}
          >
            0{i + 1}
          </button>
        ))}
      </div>

      {/* Vignette & Contrast Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8,8,8,.55) 0%, rgba(8,8,8,.15) 40%, rgba(8,8,8,.82) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Hero Content Wrapper */}
      <div className="hero-wrap">
        <div className="hero-in">
          {/* Eyebrow */}
          <div className="hero-eyebrow" data-text-key="badge">
            {t.eyebrow}
          </div>

          {/* Huge H1 Headline */}
          <h1
            className="hero-h1"
            style={{
              opacity: 1,
              transition: 'opacity .5s ease',
              ...cms.title,
            }}
          >
            <span style={{ display: 'block' }} data-text-key="title">{t.h1Line1}</span>
            <span style={{ display: 'block' }} data-text-key="tagline">{t.h1Line2}</span>
          </h1>

          {/* Subtitle */}
          <p className="pretty hero-sub" style={{ opacity: 1, transition: 'opacity .5s ease' }} data-text-key="description">
            {t.sub}
          </p>

          {/* Action Buttons */}
          <div className="hero-ctas">
            <a href="#markets" className="hero-cta1" data-text-key="primaryCta">
              {t.cta1}
            </a>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="hero-cta2"
              style={{ cursor: 'pointer', fontFamily: 'inherit' }}
              data-text-key="secondaryCta"
            >
              {t.cta2}
            </button>
          </div>

          {/* Hero Bottom Telemetry Bar */}
          <div className="hero-meta">
            <span>{t.city}</span>
            <span className="hide-s">{activeLang === 'fr' ? 'PROJETS INTERNATIONAUX' : 'GLOBAL PROJECTS'}</span>
            <span className="hide-s" style={{ animation: 'xr-pulse 2.6s ease-in-out infinite' }}>
              {t.scroll}
            </span>
            <span className="hide-s">{t.tagline}</span>
            <div className="hero-dots-inline" data-cms-ui>
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-cms-ignore
                  className={`hero-dot ${i === activeSlide ? 'on' : ''}`}
                  aria-current={i === activeSlide ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveSlide(i);
                  }}
                >
                  0{i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
