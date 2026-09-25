'use client';

import React from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductOverview, ProductStat } from '@/lib/products/types';

interface OverviewSectionProps {
  companyName: string;
  lang?: Language;
  /** Données produit (template dynamique). Priorité : data ?? CMS ?? défaut. */
  data?: ProductOverview;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  companyName,
  lang = 'FR',
  data,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsOverview = (pages[currentPageId]?.sections?.overview as Record<string, unknown>) || {};

  const eyebrow =
    data?.eyebrow ||
    (cmsOverview.eyebrow as string) ||
    (lang === 'FR' ? '01 / APERÇU' : '01 / OVERVIEW');
  const title =
    data?.title ||
    (cmsOverview.title as string) ||
    (lang === 'FR' ? 'Une technologie invisible. Une émotion inoubliable.' : 'Technology you never see. Content you never forget.');
  const description =
    data?.description ||
    (cmsOverview.description as string) ||
    (lang === 'FR'
      ? `${companyName} Fine est un écran haute précision à pas fin conçu pour les environnements intérieurs exigeant une maîtrise thermique exemplaire, une fiabilité absolue et une intégration architecturale totale. Grâce à la technologie ColdLED, la température de fonctionnement et la consommation sont drastiquement réduites, prolongeant la durée de vie des diodes.`
      : `${companyName} Fine is a premium indoor fine-pitch display built for indoor environments where thermal control, reliability, and architectural integration are critical. Featuring ColdLED technology, ${companyName} Fine significantly reduces operating temperature and power consumption for extended LED lifespan.`
    );

  const stats: { value: string; label: string }[] = data?.stats?.length
    ? data.stats.map((s: ProductStat) => ({
        value: s.value,
        label: (lang === 'FR' ? s.labelFr : s.labelEn) || s.label,
      }))
    : lang === 'FR'
      ? [
          { value: '50%', label: "d'énergie consommée en moins comparé aux LED standard" },
          { value: '29,5 mm', label: 'profondeur totale du châssis – ultra affleurant' },
          { value: '8K', label: 'résolution maximale supportée' },
        ]
      : [
          { value: '50%', label: 'less power than standard LED' },
          { value: '29,5 mm', label: 'total screen depth – paper thin' },
          { value: '8K', label: 'max resolution supported' },
        ];

  const techHeading = lang === 'FR' ? 'TECHNOLOGIES INTÉGRÉES' : 'TECHNOLOGIES INSIDE';

  const technologies = lang === 'FR'
    ? [
        {
          num: '01',
          name: 'ColdLED',
          desc: "La chaleur est l'ennemi juré des diodes LED. ColdLED l'élimine à la source — prolongeant la durée de vie et maintenant une luminosité optimale là où les écrans traditionnels s'affaiblissent.",
        },
        {
          num: '02',
          name: 'SolidSkin',
          desc: "La couche protectrice SolidSkin et sa certification IP65 en face avant protègent chaque diode contre l'humidité, la poussière et les chocs — assurant une image plus douce et sans reflet sur toute la surface.",
        },
      ]
    : [
        {
          num: '01',
          name: 'ColdLED',
          desc: 'ColdLED eliminates it — extending lifespan and maintaining brightness where others fade.',
        },
        {
          num: '02',
          name: 'SolidSkin',
          desc: 'SolidSkin’s protective layer and IP65 front rating shields every LED against moisture, dust, and impact — delivering softer, smoother visuals across the entire display.',
        },
      ];

  return (
    <section id="overview" className="section theme-light">
      <div className="wrap">
        {/* Eyebrow */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '.24em',
            color: 'var(--muted, #8a8880)',
            marginBottom: '36px',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>

        {/* Intro Grid */}
        <div
          className="g2 pd-intro"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.35fr 1fr',
            gap: 'clamp(32px, 5vw, 96px)',
            alignItems: 'end',
            marginBottom: '56px',
          }}
        >
          <h2
            className="pretty"
            style={{
              margin: 0,
              fontSize: 'clamp(34px, 3.8vw, 62px)',
              lineHeight: 1.06,
              fontWeight: 700,
            }}
          >
            {title}
          </h2>
          <p
            className="pretty"
            style={{
              margin: 0,
              fontSize: '16.5px',
              lineHeight: 1.65,
              color: 'var(--body, #4a4a46)',
            }}
          >
            {description}
          </p>
        </div>

        {/* Split Video & Photography */}
        <div
          className="g2 pd-split"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {/* Left: Cabinet detail video */}
          <div
            className="pd-stage"
            style={{
              height: 'min(62vh, 600px)',
              position: 'relative',
              overflow: 'hidden',
              background: '#000',
              border: '1px solid #1a1a19',
            }}
          >
            <video
              className="slot-img slot-contain"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/uploads/products/wp/wp-cabinet.jpg"
              aria-label={`${companyName} Fine Cabinet 3D Detail`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            >
              <source src="/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
              <source src="/uploads/products/wp/wp-cabinet.mov" type="video/quicktime" />
              <source src="https://xeron.co/uploads/products/wp/wp-cabinet.webm" type="video/webm" />
            </video>
            <div
              className="pd-stage-cap"
              style={{
                letterSpacing: '.22em',
                color: 'rgba(245, 244, 240, 0.55)',
                pointerEvents: 'none',
                justifyContent: 'space-between',
                gap: '16px',
                fontSize: '10.5px',
                display: 'flex',
                position: 'absolute',
                bottom: '20px',
                left: '24px',
                right: '24px',
                textTransform: 'uppercase',
              }}
            >
              <span>{companyName.toUpperCase()} FINE — 600×337.5 mm CABINET</span>
              <span>1.2–3.1 mm · 800–1,500 NITS</span>
            </div>
          </div>

          {/* Right: High-resolution module photography */}
          <div
            style={{
              position: 'relative',
              height: 'min(62vh, 600px)',
              overflow: 'hidden',
              background: '#ebe8e1',
            }}
          >
            <img
              src="/uploads/products/wp/module-1.jpg"
              alt={`${companyName} Fine Module`}
              className="slot-img"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://xeron.co/uploads/products/wp/module-1.jpg';
              }}
            />
          </div>
        </div>

        {/* 3-Column Metrics Box matching xeron.co .pd-stats */}
        <div
          className="pd-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--line, #dad8d2)',
            border: '1px solid var(--line, #dad8d2)',
            marginTop: '24px',
          }}
        >
          {stats.map((item) => (
            <div
              key={item.label}
              style={{
                background: 'var(--paper, #f5f4f0)',
                padding: '30px 28px',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(30px, 2.8vw, 44px)',
                  fontWeight: 900,
                  letterSpacing: '-.02em',
                  lineHeight: 1,
                  color: 'var(--ink, #111110)',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  letterSpacing: '.02em',
                  color: 'var(--muted-2, #6b6a66)',
                  marginTop: '12px',
                  lineHeight: 1.5,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Technologies Inside Section */}
        <div
          style={{
            marginTop: '72px',
            borderTop: '1px solid var(--line, #dad8d2)',
            paddingTop: '48px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '.24em',
              color: 'var(--muted, #8a8880)',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}
          >
            {techHeading}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: '1px',
              background: 'var(--line, #dad8d2)',
              border: '1px solid var(--line, #dad8d2)',
            }}
          >
            {technologies.map((tech) => (
              <div
                key={tech.name}
                style={{
                  background: 'var(--paper, #f5f4f0)',
                  padding: '30px 28px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    letterSpacing: '.2em',
                    color: 'var(--accent, #C3F910)',
                    marginBottom: '14px',
                    fontWeight: 700,
                  }}
                >
                  {tech.num}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    color: 'var(--ink, #111110)',
                  }}
                >
                  {tech.name}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--muted-2, #6b6a66)',
                    lineHeight: 1.6,
                  }}
                >
                  {tech.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
