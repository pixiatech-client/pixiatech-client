'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductFeatures, ProductFeature } from '@/lib/products/types';

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

  const eyebrow =
    data?.eyebrow ||
    (cmsFeatures.eyebrow as string) ||
    (lang === 'FR' ? '03 / POINTS CLÉS' : '03 / KEY FEATURES');
  const title1 =
    data?.title ||
    (cmsFeatures.title as string) ||
    (lang === 'FR' ? "Façonné autour de" : 'Built around');
  const title2 = lang === 'FR' ? "l'essentiel." : 'what matters.';

  const totalFeatures = data?.items?.length ?? 7;
  const toDisplayFeature = (item: ProductFeature, idx: number) => ({
    num: item.num || String(idx + 1).padStart(2, '0'),
    indexStr: `${String(idx + 1).padStart(2, '0')} / ${String(totalFeatures).padStart(2, '0')}`,
    title: item.title,
    desc: item.description || '',
    img: item.image || '',
    contain: !!item.contain,
  });

  const featureList = data?.items?.length
    ? data.items.map(toDisplayFeature)
    : lang === 'FR'
    ? [
        {
          num: '01',
          indexStr: '01 / 07',
          title: "Plateforme d'efficacité énergétique durable",
          desc: "Fonctionnement à basse température pour une stabilité accrue et des coûts d'exploitation réduits.",
          img: '/uploads/products/wp/feature-1.jpg',
          contain: false,
        },
        {
          num: '02',
          indexStr: '02 / 07',
          title: 'Profil ultra-fin de 29,7 mm',
          desc: 'S’intègre parfaitement dans les espaces restreints des intérieurs prestigieux et des salles de contrôle.',
          img: '/uploads/products/wp/feature-2.jpg',
          contain: true,
        },
        {
          num: '03',
          indexStr: '03 / 07',
          title: "Qualité d'image Premium HDR10",
          desc: 'Contraste saisissant et restitution visuelle ultra-stable pour les applications critiques.',
          img: '/uploads/products/wp/feature-3.jpg',
          contain: false,
        },
        {
          num: '04',
          indexStr: '04 / 07',
          title: 'Contraste extrême de 30 000:1',
          desc: 'Noirs d’une profondeur absolue et précision colorimétrique maximale pour les plateaux TV et la production virtuelle.',
          img: '/uploads/products/wp/feature-4.jpg',
          contain: false,
        },
        {
          num: '05',
          indexStr: '05 / 07',
          title: 'Fréquence de rafraîchissement jusqu’à 7 680 Hz',
          desc: 'Rendu parfait face caméra avec un temps de réponse instantané de l’ordre de la nanoseconde.',
          img: '/uploads/products/wp/feature-5.jpg',
          contain: false,
        },
        {
          num: '06',
          indexStr: '06 / 07',
          title: 'Certification CEM Classe B',
          desc: 'Répond aux normes les plus exigeantes pour les centres de commandement et les salles de crise.',
          img: '/uploads/products/wp/feature-6.jpg',
          contain: false,
        },
        {
          num: '07',
          indexStr: '07 / 07',
          title: 'Maintenance intégrale par l’avant',
          desc: 'Intervention magnétique sans interrompre le fonctionnement dans les environnements 24/7.',
          img: '/uploads/products/wp/feature-7.jpg',
          contain: false,
        },
      ]
    : [
        {
          num: '01',
          indexStr: '01 / 07',
          title: 'Sustainable energy saving platform',
          desc: 'Cooler operation for higher stability and lower operating cost.',
          img: '/uploads/products/wp/feature-1.jpg',
          contain: false,
        },
        {
          num: '02',
          indexStr: '02 / 07',
          title: 'Ultra-Thin 29.7 mm Profile',
          desc: 'Fits tight depth constraints in premium interiors and control rooms.',
          img: '/uploads/products/wp/feature-2.jpg',
          contain: true,
        },
        {
          num: '03',
          indexStr: '03 / 07',
          title: 'Premium HDR10 image quality',
          desc: 'Capable strong contrast and stable visuals for critical spaces.',
          img: '/uploads/products/wp/feature-3.jpg',
          contain: false,
        },
        {
          num: '04',
          indexStr: '04 / 07',
          title: '30,000:1 Contrast',
          desc: 'Extreme black levels and high color accuracy for broadcast and XR use.',
          img: '/uploads/products/wp/feature-4.jpg',
          contain: false,
        },
        {
          num: '05',
          indexStr: '05 / 07',
          title: 'High Refresh up to 7,680Hz',
          desc: 'Camera-ready visuals with nanosecond response playback.',
          img: '/uploads/products/wp/feature-5.jpg',
          contain: false,
        },
        {
          num: '06',
          indexStr: '06 / 07',
          title: 'EMC Class B Certified',
          desc: 'Meets strict control room and command center compliance requirements.',
          img: '/uploads/products/wp/feature-6.jpg',
          contain: false,
        },
        {
          num: '07',
          indexStr: '07 / 07',
          title: 'Front service maintenance',
          desc: 'Minimizes disruption in 24/7 environments',
          img: '/uploads/products/wp/feature-7.jpg',
          contain: false,
        },
      ];

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

        {/* Title */}
        <h2 className="h2" style={{ marginBottom: '72px' }}>
          {title1}
          <br />
          {title2}
        </h2>

        {/* Feature Stage Grid */}
        <div className="fstage">
          {/* Sticky Visual Stage */}
          <div className="fstage-stage">
            <div className="fstage-frame">
              {featureList.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={item.title}
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
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://xeron.co${item.img}`;
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}

              {/* Gradient Vignette Shade */}
              <div className="fstage-shade" aria-hidden="true" />

              {/* Footer with caption and interactive progress rail */}
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
            </div>
          </div>

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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://xeron.co${item.img}`;
                      }}
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

                    <p
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
