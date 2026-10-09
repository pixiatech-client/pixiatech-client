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

  const heroPrimaryImage =
    cmsHero.slideImage1 || cmsHero.primaryImage || cmsHero.heroImage || '/uploads/site/hero-1.jpg';

  const slides = [
    {
      img: heroPrimaryImage,
      alt: activeLang === 'fr'
        ? 'Installation LED — hall architectural avec structure illuminée'
        : 'LED installation — architectural lobby with illuminated structure',
    },
    {
      img: cmsHero.slideImage2 || '/uploads/site/hero-2.jpg',
      alt: activeLang === 'fr'
        ? 'Installation LED — atrium avec écran LED immersif'
        : 'LED installation — atrium with immersive LED display',
    },
    {
      img: cmsHero.slideImage3 || '/uploads/site/hero-3.jpg',
      alt: activeLang === 'fr'
        ? 'Installation LED — mur LED panoramique incurvé'
        : 'LED installation — curved panoramic LED wall',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
            />
          </div>
        );
      })}

      {/* Top right slide indicator dots */}
      <div className="hero-dots-top">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`hero-dot ${i === activeSlide ? 'on' : ''}`}
            aria-current={i === activeSlide ? 'true' : undefined}
            onClick={() => setActiveSlide(i)}
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
          <div className="hero-eyebrow">
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
            <span style={{ display: 'block' }}>{t.h1Line1}</span>
            <span style={{ display: 'block' }}>{t.h1Line2}</span>
          </h1>

          {/* Subtitle */}
          <p className="pretty hero-sub" style={{ opacity: 1, transition: 'opacity .5s ease' }}>
            {t.sub}
          </p>

          {/* Action Buttons */}
          <div className="hero-ctas">
            <a href="#markets" className="hero-cta1">
              {t.cta1}
            </a>
            <button
              type="button"
              onClick={onOpenConsultation}
              className="hero-cta2"
              style={{ cursor: 'pointer', fontFamily: 'inherit' }}
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
            <div className="hero-dots-inline">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`hero-dot ${i === activeSlide ? 'on' : ''}`}
                  aria-current={i === activeSlide ? 'true' : undefined}
                  onClick={() => setActiveSlide(i)}
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
