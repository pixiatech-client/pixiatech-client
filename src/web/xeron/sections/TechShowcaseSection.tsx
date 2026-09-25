'use client';

import React, { useState } from 'react';
import { Language } from '../../xeron-translations';
import { useCms } from '@/lib/site-web/cms-context';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import { useSectionStyle } from '../../cms/useSectionStyle';

interface TechShowcaseSectionProps {
  lang?: Language;
  onOpenConsultation?: () => void;
}

const TECHS = [
  {
    id: 'coldled',
    name: 'COLDLED',
    descFR: "La chaleur est l\u2019ennemi de la performance LED. ColdLED l\u2019\u00e9limine \u2014 prolongeant la dur\u00e9e de vie et maintenant la luminosit\u00e9 l\u00e0 o\u00f9 d\u2019autres faiblissent.",
    descEN: 'Heat is the enemy of LED performance. ColdLED eliminates it \u2014 extending lifespan and maintaining brightness where others fade.',
    img: '/uploads/site/tech-coldled.jpg',
  },
  {
    id: 'solidskin',
    name: 'SOLIDSKIN',
    descFR: "Une couche de surface nano-renforc\u00e9e qui prot\u00e8ge les modules LED \u2014 am\u00e9liorant la r\u00e9sistance aux impacts, la longévit\u00e9 et le contraste optique.",
    descEN: 'A reinforced surface layer that protects LED modules \u2014 boosting impact resistance, durability and long-term visual performance.',
    img: '/uploads/site/tech-solidskin.jpg',
  },
  {
    id: 'armorled',
    name: 'ARMORLED',
    descFR: "Les connexions de soudure renforc\u00e9es multiplient la r\u00e9sistance m\u00e9canique par 3 \u00e0 5\u00d7 pour des \u00e9crans plus robustes et d\u2019une fiabilit\u00e9 totale.",
    descEN: 'Reinforced LED soldering connections improve impact resistance by 3\u20135\u00d7 for tougher, more reliable displays.',
    img: '/uploads/site/tech-armorled.jpg',
  },
  {
    id: 'cbsf',
    name: 'CBSF',
    descFR: "Harmonise les performances sur chaque pixel \u2014 \u00e9liminant tout d\u00e9calage colorim\u00e9trique et assurant une parfaite uniformit\u00e9 sous tous les angles de vision.",
    descEN: 'Harmonizes performance across every pixel \u2014 minimizing color shift and brightness inconsistency across a wide viewing angle.',
    img: '/uploads/site/tech-cbsf.jpg',
  },
  {
    id: 'infinite',
    name: 'INFINITE COLORS',
    descFR: "\u00c9tend la LED au-del\u00e0 du RVB avec un \u00e9metteur blanc chaud additionnel \u2014 contr\u00f4le accru du spectre, teintes de peau naturelles et \u00e9clairage calibr\u00e9.",
    descEN: 'Expands LED beyond RGB with an added warm white emitter \u2014 richer spectrum control, natural skin tones and production-ready lighting.',
    img: '/uploads/site/tech-infinite.jpg',
  },
];

/**
 * Section 07 — TECHNOLOGIES PROPRIÉTAIRES
 * Accordéon horizontal de 5 technologies LED exclusives.
 */
export const TechShowcaseSection: React.FC<TechShowcaseSectionProps> = ({ lang = 'FR' }) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const { pages, currentLang, isEditing } = useCms();

  const cmsData = (pages['home']?.sections?.technology as Record<string, unknown>) || {};
  const cms = useSectionStyle(cmsData);
  const activeLang = isEditing ? currentLang : normalizeLang(lang);

  const t = {
    eyebrow: getCmsText(
      cmsData,
      'badge',
      activeLang,
      getCmsText(cmsData, 'eyebrow', activeLang, activeLang === 'fr' ? '07 / TECHNOLOGIES PROPRIÉTAIRES' : '07 / PROPRIETARY TECHNOLOGY')
    ),
    title: getCmsText(
      cmsData,
      'title',
      activeLang,
      activeLang === 'fr' ? 'La technologie au cœur de chaque pixel.' : 'Technology inside every pixel.'
    ),
    desc:
      getCmsText(cmsData, 'description', activeLang) ||
      getCmsText(
        cmsData,
        'subtitle',
        activeLang,
        activeLang === 'fr'
          ? 'Cinq technologies fondamentales développées dans nos laboratoires pour garantir un rendement photonique maximal, une durabilité éprouvée et une efficience exemplaire.'
          : 'Five proprietary display technologies delivering exceptional performance, proven reliability and enhanced sustainability.'
      ),
  };

  return (
    <section
      id="technology"
      style={{
        position: 'relative',
        background: cms.section.backgroundColor ?? '#080808',
        color: '#F5F4F0',
        paddingTop: cms.section.paddingTop ?? 'clamp(90px, 12vh, 150px)',
        paddingBottom: cms.section.paddingBottom ?? 'clamp(90px, 12vh, 150px)',
        paddingLeft: cms.section.paddingLeft ?? 0,
        paddingRight: cms.section.paddingRight ?? 0,
        minHeight: cms.section.minHeight ?? undefined,
        marginTop: cms.section.marginTop ?? undefined,
        marginBottom: cms.section.marginBottom ?? undefined,
        backgroundImage: cms.section.backgroundImage ?? undefined,
        backgroundSize: cms.section.backgroundSize ?? undefined,
        backgroundPosition: cms.section.backgroundPosition ?? undefined,
        backgroundRepeat: cms.section.backgroundRepeat ?? undefined,
        borderTop: '1px solid #1c1c1b',
      }}
    >
      {/* Overlay optionnel */}
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

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1520,
          margin: '0 auto',
          padding: '0 clamp(24px, 3.4vw, 56px)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 54 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.24em',
              color: '#7A7A76',
              marginBottom: 20,
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              fontWeight: 700,
            }}
          >
            {t.eyebrow}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 32,
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(34px, 4.2vw, 68px)',
                fontWeight: 800,
                letterSpacing: '-.025em',
                lineHeight: 1.04,
                color: '#F5F4F0',
                maxWidth: 820,
                margin: 0,
                ...cms.title,
              }}
            >
              {t.title}
            </h2>
            <p
              style={{
                fontSize: 15.5,
                lineHeight: 1.6,
                color: '#8A8A86',
                maxWidth: 480,
                margin: 0,
              }}
            >
              {t.desc}
            </p>
          </div>
        </div>

        {/* Accordion horizontale */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            height: 'min(60vh, 580px)',
            minHeight: 300,
          }}
        >
          {TECHS.map((tech, idx) => {
            const isSelected = idx === activeIdx;
            const imgSrc =
              (cmsData[`tech_${tech.id}_image`] as string) ||
              (cmsData[`image_${tech.id}`] as string) ||
              tech.img;

            return (
              <div
                key={tech.id}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  flex: isSelected ? '2.8 1 0%' : '1 1 0%',
                  transition: 'flex .65s cubic-bezier(.2,.8,.2,1)',
                  minWidth: 0,
                  cursor: 'pointer',
                  border: '1px solid #1f1f1e',
                  background: '#0e0e0d',
                }}
              >
                {/* Background image */}
                <div style={{ position: 'absolute', inset: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={tech.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform .8s ease',
                      transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    }}
                  />
                </div>

                {/* Gradient overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(8,8,8,.6) 0%, rgba(8,8,8,.1) 42%, rgba(8,8,8,.88) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Top label */}
                <div
                  style={{
                    position: 'absolute',
                    top: 22,
                    left: 24,
                    right: 24,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 14,
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: '.14em',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: isSelected ? '#C3F910' : '#7A7A76',
                      transition: 'color .4s ease',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      letterSpacing: '.2em',
                      fontWeight: 700,
                      color: '#F5F4F0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'monospace',
                    }}
                  >
                    {tech.name}
                  </span>
                </div>

                {/* Bottom description */}
                <div
                  style={{
                    position: 'absolute',
                    left: 24,
                    right: 24,
                    bottom: 24,
                    pointerEvents: 'none',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14.5,
                      lineHeight: 1.55,
                      color: '#E5E3DE',
                      maxWidth: 420,
                      opacity: isSelected ? 1 : 0,
                      transform: isSelected ? 'translateY(0)' : 'translateY(12px)',
                      transition: 'opacity .5s ease .1s, transform .5s ease .1s',
                    }}
                  >
                    {lang === 'FR' ? tech.descFR : tech.descEN}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
