'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductFeatures, ProductFeature } from '@/lib/products/types';
import { text } from '@/lib/products/display';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';

interface FeaturesSectionProps {
  lang?: Language;
  /** Données produit (template dynamique). Priorité : data ?? CMS ?? défaut. */
  data?: ProductFeatures;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ lang = 'FR', data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isClickingRef = useRef(false);

  const { pages, currentPageId } = useCms();
  const cmsFeatures = (pages[currentPageId]?.sections?.features as Record<string, unknown>) || {};
  const activeLang = normalizeLang(lang);

  const eyebrow = getCmsText(
    cmsFeatures,
    'eyebrow',
    activeLang,
    text(data?.eyebrow) || (lang === 'FR' ? '03 / POINTS CLÉS' : '03 / KEY FEATURES')
  );
  const title = getCmsText(cmsFeatures, 'title', activeLang, text(data?.title) ?? '');

  const items = (data?.items ?? []).filter((item) => text(item.title));
  const totalFeatures = items.length;
  const featureList = items.map((item: ProductFeature, idx: number) => ({
    num: item.num || String(idx + 1).padStart(2, '0'),
    indexStr: `${String(idx + 1).padStart(2, '0')} / ${String(totalFeatures).padStart(2, '0')}`,
    title: getCmsText(cmsFeatures, `feature_${idx}_title`, activeLang, item.title),
    desc: getCmsText(cmsFeatures, `feature_${idx}_desc`, activeLang, item.description || ''),
    img: (cmsFeatures[`feature_${idx}_image`] as string) || text(item.image) || '',
    contain: !!item.contain,
  }));

  // Visuel central décrit par le PDF (section 03) : affiché si l'admin l'a associé.
  const visualUrl = text(data?.visual?.url);

  // Le stage collant n'existe que s'il a une image à montrer. Sans visuel, la
  // grille passe en pleine largeur au lieu d'afficher un cadre noir vide.
  const hasStageImages = Boolean(visualUrl) || featureList.some((item) => item.img);

  // Scroll listener using IntersectionObserver to switch active feature seamlessly
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, index) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isClickingRef.current) {
              setActiveIndex(index);
            }
          });
        },
        {
          rootMargin: '-30% 0px -40% 0px',
          threshold: 0.2,
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const handleStepClick = (index: number) => {
    setActiveIndex(index);
    isClickingRef.current = true;
    const target = stepRefs.current[index];
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => {
      isClickingRef.current = false;
    }, 700);
  };

  const activeFeature = featureList[activeIndex] || featureList[0];

  return (
    <section id="features" className="section theme-dark">
      <div className="wrap">
        {/* Eyebrow */}
        <div
          data-text-key="eyebrow"
          style={{
            fontSize: '11px',
            letterSpacing: '.24em',
            color: '#C3F910',
            marginBottom: '36px',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {eyebrow}
        </div>

        {/* Title — absent si le PDF n'en fournit pas */}
        {title && (
          <h2 className="h2" data-text-key="title" style={{ marginBottom: '72px' }}>
            {title}
          </h2>
        )}

        {/* Feature Stage Grid */}
        <div className="fstage">
          {/* Sticky Visual Stage — masqué s'il n'y a aucun visuel à afficher */}
          {hasStageImages && (
          <div className="fstage-stage">
            <div className="fstage-frame">
              {[
                ...(visualUrl
                  ? [
                      {
                        num: '',
                        indexStr: '',
                        title: text(data?.visual?.title) ?? text(data?.visual?.description) ?? '',
                        desc: '',
                        img: visualUrl ?? '',
                        contain: false,
                      },
                    ]
                  : []),
                ...featureList.filter((item) => item.img),
              ].map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={`${item.title}-${idx}`}
                    className={`fstage-img ${isActive ? 'on' : ''}`}
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateX(0) scale(1)' : 'translateX(3%) scale(1.05)',
                    }}
                    aria-hidden={!isActive}
                  >
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.title}
                        className={`slot-img ${item.contain ? 'slot-contain' : ''}`}
                      />
                    ) : null}
                  </div>
                );
              })}

              {/* Gradient Vignette Shade */}
              <div className="fstage-shade" aria-hidden="true" />

              {/* Footer with caption and interactive progress rail */}
              {activeFeature && (
              <div className="fstage-foot">
                <div className="fstage-caption">
                  <span style={{ color: '#C3F910', fontWeight: 700, letterSpacing: '.24em' }}>
                    {activeFeature.indexStr}
                  </span>
                  <span key={activeFeature.title} className="fstage-cap-in" style={{ color: '#ffffff' }}>
                    {activeFeature.title}
                  </span>
                </div>

                <div className="fstage-rail" role="tablist" aria-label="Key Features">
                  {featureList.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={item.title}
                        onClick={() => handleStepClick(idx)}
                        className={`fstage-seg ${isActive ? 'on' : ''}`}
                        style={{ flex: isActive ? 2.4 : 1 }}
                      >
                        <i style={{ background: isActive ? '#C3F910' : undefined }} />
                      </button>
                    );
                  })}
                </div>
              </div>
              )}
            </div>
          </div>
          )}

          {/* Scrollable Steps List */}
          <div className="fstage-steps">
            {featureList.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.title}
                  ref={(el) => {
                    stepRefs.current[idx] = el;
                  }}
                  data-i={idx}
                  onClick={() => handleStepClick(idx)}
                  className={`fstage-step ${isActive ? 'on' : ''}`}
                >
                  {/* Inline media for mobile */}
                  <div className="fstage-step-media">
                    {item.img ? (
                    <img
                      src={item.img}
                      alt={item.title}
                      className="slot-img"
                    />
                  ) : null}
                  </div>

                  <div className="fstage-step-text">
                    <div className="fstage-step-meta">
                      <span
                        style={{
                          color: '#C3F910',
                          fontWeight: 700,
                          fontSize: '12px',
                          letterSpacing: '.2em',
                        }}
                      >
                        {item.num}
                      </span>
                      <span
                        className="fstage-step-line"
                        style={{
                          background: isActive ? '#C3F910' : undefined,
                          boxShadow: isActive ? '0 0 10px rgba(195, 249, 16, 0.5)' : 'none',
                        }}
                      />
                      <span
                        style={{
                          color: isActive ? '#C3F910' : undefined,
                          fontWeight: isActive ? 600 : 400,
                          transition: 'color .3s',
                        }}
                      >
                        {item.indexStr}
                      </span>
                    </div>

                    <h3
                      data-text-key={`feature_${idx}_title`}
                      style={{
                        fontSize: 'clamp(28px, 2.6vw, 42px)',
                        lineHeight: 1.06,
                        letterSpacing: '-.015em',
                        margin: '16px 0 16px',
                        fontWeight: 700,
                        color: 'var(--dark-text, #f5f4f0)',
                      }}
                    >
                      {item.title}
                    </h3>

                    {text(item.desc) && (
                      <p
                        data-text-key={`feature_${idx}_desc`}
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          lineHeight: 1.65,
                          color: 'var(--dark-body, #a3a3a3)',
                          maxWidth: '420px',
                        }}
                      >
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
