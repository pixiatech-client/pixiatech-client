'use client';

import React, { useRef, useEffect } from 'react';
import { Language } from '../../pixiatech-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface MarketsSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

export const MarketsSection: React.FC<MarketsSectionProps> = ({ lang = 'FR', onOpenConsultation }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const { pages, currentLang, isEditing } = useCms();
  const cmsData = (pages['home']?.sections?.markets as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const t = {
    eyebrow: getCmsText(
      cmsData,
      'badge',
      activeLang,
      getCmsText(cmsData, 'eyebrow', activeLang, activeLang === 'fr' ? '03 / MARCHÉS' : '03 / MARKETS')
    ),
    title: getCmsText(
      cmsData,
      'title',
      activeLang,
      activeLang === 'fr' ? 'Conçu pour chaque environnement.' : 'Built for every environment.'
    ),
    markets: [
      {
        id: 'corporate',
        num: '01',
        name: lang === 'FR' ? 'ENTREPRISE' : 'CORPORATE',
        desc:
          lang === 'FR'
            ? 'Des écrans de précision pour les espaces où chaque détail compte.'
            : 'Precision displays for spaces where every detail matters.',
        cta: lang === 'FR' ? 'EXPLORER ENTREPRISE →' : 'EXPLORE CORPORATE →',
        img: '/uploads/site/market-corporate.jpg',
      },
      {
        id: 'retail',
        num: '02',
        name: lang === 'FR' ? 'COMMERCE & RETAIL' : 'RETAIL',
        desc:
          lang === 'FR' ? 'Des affichages qui transforment les visiteurs en audiences captivées.' : 'Displays that turn visitors into audiences.',
        cta: lang === 'FR' ? 'EXPLORER COMMERCE →' : 'EXPLORE RETAIL →',
        img: '/uploads/site/market-retail.jpg',
      },
      {
        id: 'dooh',
        num: '03',
        name: 'DOOH',
        desc:
          lang === 'FR'
            ? "La toile urbaine monumentale — ultra-lumineuse, audacieuse et parée contre les éléments."
            : 'The urban canvas — bright, bold and built for the elements.',
        cta: lang === 'FR' ? 'EXPLORER DOOH →' : 'EXPLORE DOOH →',
        img: '/uploads/site/market-dooh.jpg',
      },
      {
        id: 'rental',
        num: '04',
        name: lang === 'FR' ? 'LOCATION & ÉVÉNEMENTS' : 'RENTAL & EVENTS',
        desc:
          lang === 'FR'
            ? 'Rapide à monter, sûr en tournée, impossible à ignorer.'
            : 'Fast to build, safe to tour, impossible to ignore.',
        cta: lang === 'FR' ? 'EXPLORER LOCATION & ÉVÉNEMENTS →' : 'EXPLORE RENTAL & EVENTS →',
        img: '/uploads/site/market-rental.jpg',
      },
      {
        id: 'xr',
        num: '05',
        name: lang === 'FR' ? 'XR & PRODUCTION VIRTUELLE' : 'XR & VIRTUAL PRODUCTION',
        desc:
          lang === 'FR'
            ? 'Conçu avec une précision millimétrique pour la caméra.'
            : 'Precision-built for the camera.',
        cta: lang === 'FR' ? 'EXPLORER XR & PRODUCTION VIRTUELLE →' : 'EXPLORE XR & VIRTUAL PRODUCTION →',
        img: '/uploads/site/market-xr.jpg',
      },
      {
        id: 'sports',
        num: '06',
        name: lang === 'FR' ? 'SPORTS' : 'SPORTS',
        desc:
          lang === 'FR'
            ? "Conçu pour l'échelle des stades et la lumière broadcast."
            : 'Engineered for stadium scale and broadcast light.',
        cta: lang === 'FR' ? 'EXPLORER SPORTS →' : 'EXPLORE SPORTS →',
        img: '/uploads/site/market-sports.jpg',
      },
      {
        id: 'control',
        num: '07',
        name: lang === 'FR' ? 'SALLES DE CONTRÔLE' : 'CONTROL ROOMS',
        desc:
          lang === 'FR'
            ? 'Fiabilité 24/7 pour les environnements de mission critique.'
            : '24/7 reliability for mission-critical environments.',
        cta: lang === 'FR' ? 'EXPLORER SALLES DE CONTRÔLE →' : 'EXPLORE CONTROL ROOMS →',
        img: '/uploads/site/market-control.jpg',
      },
      {
        id: 'creative',
        num: '08',
        name: lang === 'FR' ? 'CRÉATIF & ARCHITECTURE' : 'CREATIVE & ARCHITECTURE',
        desc:
          lang === 'FR'
            ? 'Surfaces courbées, transparentes et sculpturales.'
            : 'Curved, transparent and sculptural surfaces.',
        cta: lang === 'FR' ? 'EXPLORER CRÉATIF & ARCHITECTURE →' : 'EXPLORE CREATIVE & ARCHITECTURE →',
        img: '/uploads/site/market-creative.jpg',
      },
    ],
  };

  useEffect(() => {
    let animId = 0;
    let maxDist = 0;
    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    let lastHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    let resizeTimer: NodeJS.Timeout | null = null;

    const measure = () => {
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      const track = trackRef.current;
      if (!wrapper || !sticky || !track) return;

      const isMobile = window.innerWidth <= 768;

      // Base sticky styles (mobile and PC)
      sticky.style.touchAction = '';
      sticky.style.position = 'sticky';
      sticky.style.top = 'var(--admin-bar-h, 0px)';
      sticky.style.overflow = 'hidden';
      sticky.style.overflowX = 'hidden';
      sticky.style.overflowY = 'hidden';
      sticky.style.scrollSnapType = 'none';
      (sticky.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling = '';

      let r = 0;

      if (isMobile) {
        // Mobile: calculate distance to display all 8 cards with final padding
        const cards = track.querySelectorAll<HTMLElement>('.mkt-card');
        const lastCard = cards[cards.length - 1];
        const paddingEnd = Math.max(16, Math.round(window.innerWidth * 0.05));

        if (lastCard) {
          const lastCardRight = lastCard.offsetLeft + lastCard.offsetWidth;
          r = Math.max(lastCardRight + paddingEnd - window.innerWidth, 0);
        } else {
          r = Math.max(track.scrollWidth - window.innerWidth + paddingEnd, 0);
        }

        sticky.style.height = 'calc(100vh - var(--admin-bar-h, 0px))';
        sticky.style.height = 'calc(100dvh - var(--admin-bar-h, 0px))';
        wrapper.style.height = `calc(100vh + ${r}px)`;
        wrapper.style.height = `calc(100dvh + ${r}px)`;
      } else {
        // Desktop: preserve EXACT original behavior with sticky pinning under admin bar
        sticky.style.height = 'calc(100vh - var(--admin-bar-h, 0px))';
        const trackScrollWidth = track.scrollWidth;
        r = Math.max(trackScrollWidth - window.innerWidth + 80, 0);
        wrapper.style.height = `calc(100vh + ${r}px)`;
      }

      maxDist = r;
    };

    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (maxDist <= 0 || !wrapper || !track) return;

      if (!animId) {
        animId = requestAnimationFrame(() => {
          animId = 0;
          const rect = wrapper.getBoundingClientRect();
          const adminH = typeof window !== 'undefined'
            ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--admin-bar-h') || '0')
            : 0;
          const progress = Math.min(Math.max((adminH - rect.top) / maxDist, 0), 1);
          track.style.transform = `translate3d(${-progress * maxDist}px, 0, 0)`;
        });
      }
    };

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      // On mobile, browser address bar expand/collapse triggers resize with ~50-80px height change
      // but unchanged width. Avoid expensive layout reflows and stuttering while scrolling.
      const widthChanged = Math.abs(newWidth - lastWidth) > 1;
      const heightSignificant = Math.abs(newHeight - lastHeight) > 150; // orientation or device fold

      if (!widthChanged && !heightSignificant) {
        return;
      }

      lastWidth = newWidth;
      lastHeight = newHeight;

      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        handleScroll();
      }, 50);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        measure();
        handleScroll();
      }, 150);
    };

    measure();
    handleScroll();

    const timer = setTimeout(() => {
      measure();
      handleScroll();
    }, 200);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isEditing]);

  return (
    <>
      <span id="markets" style={{ display: 'block', height: 0, marginTop: -90, paddingTop: 90 }} />
      <div
        ref={wrapperRef}
        data-cms-section="markets"
        style={{
          position: 'relative',
          background: '#080808',
          color: '#F5F4F0',
          borderTop: '1px solid #1c1c1b',
          // CMS overrides
          ...cms.section,
        }}
      >
        <div
          ref={stickyRef}
          className="mkt-track-wrap"
          style={{
            position: 'sticky',
            top: 'var(--admin-bar-h, 0px)',
            height: 'calc(100vh - var(--admin-bar-h, 0px))',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Header Title (fixe et stationnaire en haut de la section pendant le défilement des cartes) */}
          <div
            style={{
              maxWidth: 1520,
              width: '100%',
              margin: '0 auto',
              padding: 'clamp(24px, 4vh, 48px) clamp(16px, 3.5vw, 64px) clamp(16px, 2.5vh, 28px)',
              flex: 'none',
              zIndex: 10,
            }}
          >
            <div
              data-text-key="badge"
              style={{
                fontSize: 11,
                letterSpacing: '.24em',
                color: '#7A7A76',
                marginBottom: 14,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
              }}
            >
              {t.eyebrow}
            </div>
            <h2
              data-text-key="title"
              style={{
                fontSize: 'clamp(36px, 3.6vw, 58px)',
                fontWeight: 800,
                letterSpacing: '-.025em',
                color: '#F5F4F0',
                margin: 0,
              }}
            >
              {t.title}
            </h2>
          </div>

          {/* Horizontal Track transformed with translate3d on scroll */}
          <div
            ref={trackRef}
            className="mkt-track"
            style={{
              position: 'relative',
              display: 'flex',
              gap: 24,
              padding: '0 clamp(16px, 3.5vw, 64px)',
              willChange: 'transform',
            }}
          >
            {t.markets.map((m) => {
              const label = getCmsText(
                cmsData,
                `market_${m.id}_label`,
                activeLang,
                `${m.num} — ${m.name}`
              );
              const desc = getCmsText(
                cmsData,
                `market_${m.id}_desc`,
                activeLang,
                m.desc
              );
              const cta = getCmsText(
                cmsData,
                `market_${m.id}_cta`,
                activeLang,
                m.cta
              );

              return (
                <div
                  key={m.id}
                  className="mkt-card"
                  style={{
                    flex: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    width: '76vw',
                    maxWidth: 1180,
                    height: 'min(58vh, 560px)',
                    minHeight: 360,
                    background: '#0e0e0d',
                    border: '1px solid #1a1a19',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    data-image-key={`market_${m.id}_image`}
                    src={(cmsData[`market_${m.id}_image`] as string) || (cmsData[`image_${m.id}`] as string) || m.img}
                    alt={`${m.name} — PIXIATECH`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Gradient shadow overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '32px 36px',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(8,8,8,.88) 100%)',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <div
                      data-text-key={`market_${m.id}_label`}
                      style={{
                        fontSize: 11,
                        letterSpacing: '.24em',
                        color: '#C9C7C1',
                        marginBottom: 8,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        pointerEvents: 'auto',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      data-text-key={`market_${m.id}_desc`}
                      style={{
                        fontSize: 'clamp(18px, 1.8vw, 24px)',
                        fontWeight: 700,
                        color: '#F5F4F0',
                        marginBottom: 14,
                        lineHeight: 1.3,
                        maxWidth: 820,
                        pointerEvents: 'auto',
                      }}
                    >
                      {desc}
                    </div>
                    <button
                      type="button"
                      data-text-key={`market_${m.id}_cta`}
                      onClick={onOpenConsultation}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        fontSize: 12,
                        letterSpacing: '.14em',
                        fontWeight: 700,
                        color: '#C3F910',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        pointerEvents: 'auto',
                        borderBottom: '1px solid #C3F910',
                      }}
                    >
                      {cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
