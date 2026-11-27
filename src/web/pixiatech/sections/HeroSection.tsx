'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';
import { heroSlideStore, useStoreValue } from '../../cms/editor-ui-store';
import { computeValidHeroSlides } from './hero-slides';
import { isMediaVideo } from '../../cms/media-utils';
import { makeElementStyledId } from '../../cms/cms-style-utils';
import {
  buildHeroCriticalCss,
  heroOverlayStyle,
  readHeroOverlayConfig,
} from '../../cms/hero-critical-styles';

// Transition cinématique du Hero : fondu croisé + zoom Ken Burns continu.
const HERO_FADE_MS = 1300; // fondu croisé (1–1,4 s)
const HERO_ZOOM_MS = 7000; // durée du zoom Ken Burns (lent, discret)
const HERO_ZOOM = 1.08; // échelle cible COMMUNE active + sortante (pas d'inversion)

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
  const criticalCss = React.useMemo(() => buildHeroCriticalCss(cmsData), [cmsData]);

  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  // Photos réellement disponibles (aucune diapositive fantôme). Voir
  // `hero-slides.ts` : liste vide → un unique visuel de repli.
  const slides = React.useMemo(
    () => computeValidHeroSlides(cmsData, activeLang),
    [cmsData, activeLang]
  );

  const storedSlide = useStoreValue(heroSlideStore);
  const activeSlide = slides.length ? storedSlide % slides.length : 0;
  const activeSlideData = slides[activeSlide];

  // Textes par slide : clés plates `sliderN.<champ>` dérivées de la clé
  // STABLE de l'image active (`slideImageN`), jamais de l'index de tableau.
  // Aucune migration : tant qu'aucune clé `sliderN.*` n'existe, la lecture
  // retombe sur les champs globaux ci-dessous → affichage inchangé.
  const slideFieldKey = (field: string): string => {
    const n = activeSlideData?.imageKey?.replace(/^slideImage/u, '') || '1';
    return `slider${n}.${field}`;
  };
  const slideValue = (field: string): string => getCmsText(cmsHero, slideFieldKey(field), activeLang);
  const slideOrGlobal = (field: string, global: string): string => slideValue(field) || global;

  // Destination des CTA : chaque slide lit SA propre clé CMS. Le href global
  // historique (_elements.primaryCta / secondaryCta) ne sert plus que de repli,
  // jamais de valeur partagée entre les boutons.
  const slideElements = (cmsData._elements || {}) as Record<string, Record<string, unknown>>;
  const slideLink = (field: string, fallback: string) => {
    const own = slideElements[slideFieldKey(field)] || {};
    const shared = slideElements[field] || {};
    const href = own.href ?? shared.href;
    const target = own.target ?? shared.target;
    const rel = own.rel ?? shared.rel;
    return {
      href: typeof href === 'string' ? href : fallback,
      target: typeof target === 'string' && target ? target : undefined,
      rel: typeof rel === 'string' && rel ? rel : undefined,
    };
  };
  const primaryLink = slideLink('primaryCta', '#markets');
  const secondaryLink = slideLink('secondaryCta', '/web/contact');

  // Ramène l'index dans une plage valide quand le nombre de photos change.
  useEffect(() => {
    if (slides.length === 0) return;
    if (storedSlide >= slides.length) heroSlideStore.set(storedSlide % slides.length);
  }, [slides.length, storedSlide]);

  useEffect(() => {
    if (isEditing) return; // Ne pas faire tourner automatiquement en mode édition
    if (slides.length <= 1) return; // Rien à faire tourner avec une seule photo
    const timer = setInterval(() => {
      heroSlideStore.set((heroSlideStore.get() + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isEditing]);

  // --- Transition cinématique entre images (crossfade + Ken Burns) ---
  // Active et sortante partagent la même cible : la course du zoom reste
  // monotone et continue, sans inversion ni saut. Seule l'opacité change.
  const [outgoingSlide, setOutgoingSlide] = React.useState(-1);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [entered, setEntered] = React.useState(false);
  const lastActive = React.useRef(activeSlide);
  const outgoingRef = React.useRef(-1);
  const transitionIdRef = React.useRef(0);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Zoom doux du tout premier visuel, après le montage (pas de zoom au SSR).
  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Seule la transition la plus récente définit/efface l'image sortante :
  // annulation du minuteur précédent + identifiant de cycle unique.
  React.useEffect(() => {
    const incoming = activeSlide;
    const changed = lastActive.current !== incoming;
    const prevActive = lastActive.current;
    lastActive.current = incoming;

    const myId = ++transitionIdRef.current;
    const nextOutgoing = changed ? prevActive : outgoingRef.current;
    outgoingRef.current = nextOutgoing;
    setOutgoingSlide(nextOutgoing);

    const to = window.setTimeout(() => {
      if (transitionIdRef.current !== myId) return; // cycle plus récent → ne rien effacer
      outgoingRef.current = -1;
      setOutgoingSlide(-1);
    }, HERO_FADE_MS + 120);
    return () => window.clearTimeout(to);
  }, [activeSlide]);

  const t = {
    eyebrow: slideOrGlobal(
      'badge',
      getCmsText(
        cmsHero,
        'badge',
        activeLang,
        activeLang === 'fr' ? 'PIXIATECH / TECHNOLOGIE VISUELLE' : 'PIXIATECH / VISUAL TECHNOLOGY'
      )
    ),
    h1Line1: slideOrGlobal(
      'title',
      getCmsText(cmsHero, 'title', activeLang, activeLang === 'fr' ? 'Écrans LED sur mesure' : 'LED Walls & Displays')
    ),
    h1Line2: slideOrGlobal(
      'tagline',
      getCmsText(cmsHero, 'tagline', activeLang, activeLang === 'fr' ? 'Transformez vos espaces en expériences visuelles immersives.' : 'Bringing your spaces to life.')
    ),
    // Repli global recopié à l'identique : slide (description) → slide
    // (subtitle) → `description` global → `subtitle` global → défaut.
    sub:
      slideValue('description') ||
      slideValue('subtitle') ||
      getCmsText(cmsHero, 'description', activeLang) ||
      getCmsText(
        cmsHero,
        'subtitle',
        activeLang,
        activeLang === 'fr'
          ? "PIXIATECH conçoit des écrans LED sur mesure pour l’architecture, le retail et l’événementiel, avec conseil expert, installation et SAV partout en France."
          : 'PIXIATECH designs custom LED displays for architecture, retail and events, with expert consulting, installation and support across France.'
      ),
    cta1: slideOrGlobal(
      'primaryCta',
      getCmsText(
        cmsHero,
        'primaryCta',
        activeLang,
        getCmsText(cmsHero, 'ctaText', activeLang, activeLang === 'fr' ? 'Explorer les solutions →' : 'Explore Solutions →')
      )
    ),
    cta2: slideOrGlobal(
      'secondaryCta',
      getCmsText(cmsHero, 'secondaryCta', activeLang, activeLang === 'fr' ? 'Estimation gratuite →' : 'Free quote →')
    ),
    city: activeLang === 'fr' ? 'PARIS · MONDE' : 'PARIS · GLOBAL PROJECTS',
    scroll: activeLang === 'fr' ? 'DÉFILEZ POUR DÉCOUVRIR' : 'SCROLL TO DISCOVER',
    scrollArrow: '↓',
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
      {/* Styles CMS critiques sérialisés dans le premier HTML : le Hero ne
          doit jamais passer par une version non stylisée avant hydratation. */}
      <style dangerouslySetInnerHTML={{ __html: criticalCss }} />

      {/* Background Slides with smooth fade & Ken Burns zoom */}
      {slides.map((s, idx) => {
        const isActive = idx === activeSlide;
        // Actif OU sortant → même cible (1.08) : le zoom de la sortante poursuit
        // sa course pendant le fondu (jamais de retour arrière, jamais de saut).
        const isOnScreen = isActive || idx === outgoingSlide;
        const scale = reduceMotion ? 1 : isOnScreen ? (entered ? HERO_ZOOM : 1) : 1;
        const mediaStyledId = makeElementStyledId('hero', s.imageKey);
        const overlayStyle = heroOverlayStyle(readHeroOverlayConfig(cmsData, s.imageKey));
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              transform: `scale(${scale})`,
              transition: reduceMotion
                ? 'opacity 300ms ease'
                : `opacity ${HERO_FADE_MS}ms ease, transform ${HERO_ZOOM_MS}ms linear`,
              willChange: 'opacity, transform',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {isMediaVideo(s.img) ? (
              <video
                src={s.img}
                autoPlay
                loop
                muted
                playsInline
                className="slot-img"
                data-image-key={s.imageKey}
                data-cms-styled-id={mediaStyledId}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={s.img}
                alt={s.alt}
                className="slot-img"
                data-image-key={s.imageKey}
                data-cms-styled-id={mediaStyledId}
              />
            )}
            {/* Voile CMS : présent dès la première peinture, puis repris par
                le moteur CMS sans duplication (même `data-cms-overlay-for`). */}
            {overlayStyle && (
              <div
                data-cms-overlay-for={mediaStyledId}
                data-cms-ignore="true"
                data-cms-ui="true"
                style={overlayStyle}
              />
            )}
          </div>
        );
      })}

      {/* Le sélecteur de photo du Hero est désormais intégré à la barre de
          section unique (`CmsSectionBar`) quand le Hero est actif. */}

      {/* Top right slide indicator dots (01/02/03) */}
      {slides.length > 1 && (
        <div className="hero-dots-top" data-cms-ui>
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-cms-ignore
              className={`hero-dot ${idx === activeSlide ? 'on' : ''}`}
              aria-current={idx === activeSlide ? 'true' : undefined}
              aria-label={`Slide ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                heroSlideStore.set(idx);
              }}
            >
              {String(idx + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}

      <div className="hero-wrap">
        <div className="hero-in">
          {/* Eyebrow */}
          <div
            className="hero-eyebrow"
            data-text-key="badge"
            data-slide-field={slideFieldKey('badge')}
            data-cms-styled-id={makeElementStyledId('hero', 'badge')}
          >
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
            <span
              style={{ display: 'block' }}
              data-text-key="title"
              data-slide-field={slideFieldKey('title')}
              data-cms-styled-id={makeElementStyledId('hero', 'title')}
            >{t.h1Line1}</span>
            <span
              style={{ display: 'block' }}
              data-text-key="tagline"
              data-slide-field={slideFieldKey('tagline')}
              data-cms-styled-id={makeElementStyledId('hero', 'tagline')}
            >{t.h1Line2}</span>
          </h1>

          {/* Subtitle */}
          <p
            className="pretty hero-sub"
            style={{ opacity: 1, transition: 'opacity .5s ease' }}
            data-text-key="description"
            data-slide-field={slideFieldKey('description')}
            data-cms-styled-id={makeElementStyledId('hero', 'description')}
          >
            {t.sub}
          </p>

          {/* Action Buttons */}
          <div className="hero-ctas">
            <a
              href={primaryLink.href}
              target={primaryLink.target}
              rel={primaryLink.rel}
              className="hero-cta1"
              data-text-key="primaryCta"
              data-slide-field={slideFieldKey('primaryCta')}
              data-cms-link-key={slideFieldKey('primaryCta')}
              data-cms-styled-id={makeElementStyledId('hero', 'primaryCta')}
            >
              {t.cta1}
            </a>
            <a
              href={secondaryLink.href}
              target={secondaryLink.target}
              rel={secondaryLink.rel}
              className="hero-cta2"
              style={{ cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              data-text-key="secondaryCta"
              data-slide-field={slideFieldKey('secondaryCta')}
              data-cms-link-key={slideFieldKey('secondaryCta')}
              data-cms-styled-id={makeElementStyledId('hero', 'secondaryCta')}
            >
              {t.cta2}
            </a>
          </div>

          {/* Hero Bottom Telemetry Bar */}
          <div className="hero-meta">
            <span>{t.city}</span>
            <span>{t.scroll}<span className="hero-meta-arrow" aria-hidden="true"> {t.scrollArrow}</span></span>
            <span>{t.tagline}</span>
            <div className="hero-dots-inline" data-cms-ui>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  data-cms-ignore
                  className={`hero-dot ${idx === activeSlide ? 'on' : ''}`}
                  aria-current={idx === activeSlide ? 'true' : undefined}
                  aria-label={`Slide ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    heroSlideStore.set(idx);
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
