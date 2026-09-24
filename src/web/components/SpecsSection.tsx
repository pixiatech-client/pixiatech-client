'use client';

import React, { useRef, useState, useEffect } from 'react';
import specsData from '../data/specs-data.json';
import { SpecModel } from '../types';
import { Language } from '../data/translations';

interface SpecsSectionProps {
  onSelectDatasheet: (model: SpecModel) => void;
  lang?: Language;
}

export const SpecsSection: React.FC<SpecsSectionProps> = ({ onSelectDatasheet, lang = 'FR' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { models } = specsData;

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const groups = [
    {
      name: 'GENERAL',
      label: lang === 'FR' ? 'GÉNÉRAL' : 'GENERAL',
      rows: [
        { key: 'env', label: lang === 'FR' ? 'INTÉRIEUR / EXTÉRIEUR' : 'IN / OUT' },
        { key: 'arrangement', label: lang === 'FR' ? 'AGENCEMENT LED' : 'LED ARRANGEMENT' },
      ],
    },
    {
      name: 'PHYSICAL',
      label: lang === 'FR' ? 'PHYSIQUE & MÉCANIQUE' : 'PHYSICAL',
      rows: [
        { key: 'pitch', label: lang === 'FR' ? 'PITCH PIXEL' : 'PIXEL PITCH' },
        { key: 'density', label: lang === 'FR' ? 'DENSITÉ PHYSIQUE' : 'PHYSICAL DENSITY' },
        { key: 'moduleRes', label: lang === 'FR' ? 'RÉSOLUTION MODULE (H/V)' : 'MODULE RESOLUTION (H/V)' },
        { key: 'moduleDim', label: lang === 'FR' ? 'DIMENSIONS MODULE' : 'MODULE DIMENSIONS' },
        { key: 'cabRes', label: lang === 'FR' ? 'RÉSOLUTION CHÂSSIS (H/V)' : 'CABINET RESOLUTION (H/V)' },
        { key: 'cabDim', label: lang === 'FR' ? 'DIMENSIONS CHÂSSIS' : 'CABINET DIMENSIONS' },
        { key: 'weight', label: lang === 'FR' ? 'POIDS DU CHÂSSIS' : 'CABINET WEIGHT' },
      ],
    },
    {
      name: 'OPTICAL',
      label: lang === 'FR' ? 'OPTIQUE' : 'OPTICAL',
      rows: [
        { key: 'brightness', label: lang === 'FR' ? 'LUMINOSITÉ' : 'BRIGHTNESS' },
        { key: 'refresh', label: lang === 'FR' ? 'TAUX DE RAFRAÎCHISSEMENT' : 'REFRESH RATE' },
        { key: 'scan', label: lang === 'FR' ? 'TAUX DE BALAYAGE' : 'SCAN RATE' },
        { key: 'angle', label: lang === 'FR' ? 'ANGLE DE VISION (H/V)' : 'VIEWING ANGLE (H/V)' },
      ],
    },
    {
      name: 'ELECTRICAL',
      label: lang === 'FR' ? 'ÉLECTRIQUE' : 'ELECTRICAL',
      rows: [
        { key: 'maxPower', label: lang === 'FR' ? 'PUISSANCE MAX (W / PANNEAU)' : 'MAX POWER (W / PANEL)' },
        { key: 'avgPower', label: lang === 'FR' ? 'PUISSANCE MOYENNE (W / PANNEAU)' : 'AVG POWER (W / PANEL)' },
        { key: 'power', label: lang === 'FR' ? 'SOURCE D’ALIMENTATION' : 'OPERATING POWER SOURCE' },
        { key: 'signal', label: lang === 'FR' ? 'ENTRÉES DU SIGNAL' : 'SIGNAL INPUT' },
      ],
    },
    {
      name: 'ENVIRONMENTAL',
      label: lang === 'FR' ? 'ENVIRONNEMENT & CERTIFICATIONS' : 'ENVIRONMENTAL',
      rows: [
        { key: 'ip', label: lang === 'FR' ? 'INDICE IP' : 'IP RATING' },
        { key: 'temp', label: lang === 'FR' ? 'TEMPÉRATURE DE FONCTIONNEMENT' : 'OPERATING TEMPERATURE' },
        { key: 'transparency', label: lang === 'FR' ? 'TRANSPARENCE' : 'TRANSPARENCY' },
        { key: 'certs', label: lang === 'FR' ? 'CERTIFICATIONS' : 'CERTIFICATIONS' },
      ],
    },
  ];

  return (
    <section id="specs" className="section theme-dark">
      <div className="wrap">
        {/* Eyebrow */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '.24em',
            color: 'var(--dark-muted, #7a7a76)',
            marginBottom: '36px',
            textTransform: 'uppercase',
          }}
        >
          {lang === 'FR' ? '04 / SPÉCIFICATIONS' : '04 / SPECIFICATIONS'}
        </div>

        {/* Title */}
        <h2 className="h2" style={{ marginBottom: '56px' }}>
          {lang === 'FR' ? 'Données techniques.' : 'Technical data.'}
        </h2>

        {/* Description */}
        <p
          style={{
            margin: '0 0 44px',
            maxWidth: '560px',
            fontSize: '15.5px',
            lineHeight: 1.6,
            color: 'var(--dark-body, #a3a3a3)',
          }}
        >
          {lang === 'FR'
            ? 'Données détaillées par modèle pour la plateforme Fine. Les valeurs certifiées sont extraites des fiches techniques constructeur.'
            : 'Model-level data for the XR Fine platform. Values not yet confirmed are marked and will be populated from the official datasheets.'}
        </p>

        {/* Controls: Model Count & Scroll Arrows */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '10.5px',
              letterSpacing: '.22em',
              color: 'var(--dark-muted, #7a7a76)',
              textTransform: 'uppercase',
            }}
          >
            09 {lang === 'FR' ? 'MODÈLES — DÉFILEMENT HORIZONTAL →' : 'MODELS — SCROLL HORIZONTALLY →'}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Previous models"
              disabled={!canScrollLeft}
              style={{
                width: '44px',
                height: '44px',
                border: '1px solid var(--dark-line-3, #2a2a2a)',
                background: 'transparent',
                color: canScrollLeft ? '#F5F4F0' : '#3A3A3A',
                cursor: canScrollLeft ? 'pointer' : 'default',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color .2s, border-color .2s',
              }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Next models"
              disabled={!canScrollRight}
              style={{
                width: '44px',
                height: '44px',
                border: '1px solid var(--dark-line-3, #2a2a2a)',
                background: 'transparent',
                color: canScrollRight ? '#F5F4F0' : '#3A3A3A',
                cursor: canScrollRight ? 'pointer' : 'default',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color .2s, border-color .2s',
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div style={{ position: 'relative' }}>
          <div
            ref={scrollRef}
            style={{
              overflowX: 'auto',
              borderTop: '1px solid var(--dark-line, #1f1f1f)',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#2A2A2A transparent',
            }}
          >
            {/* Header Row: MODEL and 9 Models */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--dark-line, #1f1f1f)',
                background: 'var(--black-2, #0b0b0a)',
                minWidth: 'max-content',
              }}
            >
              <div
                className="spec-key"
                style={{
                  flex: '0 0 240px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  borderRight: '1px solid var(--dark-line, #1f1f1f)',
                  boxShadow: '12px 0 24px -8px rgba(8, 8, 8, 0.9)',
                  background: 'var(--black-2, #0b0b0a)',
                  padding: '22px 14px',
                  fontSize: '11px',
                  letterSpacing: '.2em',
                  color: 'var(--dark-muted, #7a7a76)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  textTransform: 'uppercase',
                }}
              >
                {lang === 'FR' ? 'MODÈLE' : 'MODEL'}
              </div>

              {models.map((model) => (
                <div
                  key={model.name}
                  className="spec-head"
                  style={{
                    flex: '0 0 280px',
                    padding: '22px 18px',
                    borderLeft: '1px solid var(--dark-line-2, #161615)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      letterSpacing: '-.01em',
                      lineHeight: 1.25,
                      overflowWrap: 'anywhere',
                      color: 'var(--dark-text, #f5f4f0)',
                    }}
                  >
                    {model.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectDatasheet(model as SpecModel)}
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      border: '1px solid #3A2A22',
                      padding: '6px 12px',
                      fontSize: '10px',
                      letterSpacing: '.16em',
                      color: '#E88A66',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'border-color .2s, color .2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#E88A66';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#3A2A22';
                      e.currentTarget.style.color = '#E88A66';
                    }}
                  >
                    {lang === 'FR' ? 'FICHE TECHNIQUE' : 'DATASHEET'}
                  </button>
                </div>
              ))}
            </div>

            {/* Spec Groups */}
            {groups.map((grp) => (
              <div key={grp.name}>
                {/* Group Heading Row */}
                <div
                  style={{
                    display: 'flex',
                    borderBottom: '1px solid var(--dark-line, #1f1f1f)',
                    background: '#0A0A09',
                    minWidth: 'max-content',
                  }}
                >
                  <div
                    className="spec-key"
                    style={{
                      flex: '0 0 240px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      borderRight: '1px solid var(--dark-line, #1f1f1f)',
                      boxShadow: 'none',
                      background: '#0A0A09',
                      padding: '15px 14px',
                      fontSize: '10.5px',
                      letterSpacing: '.26em',
                      color: 'var(--accent, #C3F910)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {grp.label}
                  </div>
                  <div style={{ flex: 1, minWidth: '280px' }} />
                </div>

                {/* Group Rows */}
                {grp.rows.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--dark-line-2, #161615)',
                      minWidth: 'max-content',
                    }}
                  >
                    {/* Sticky Key Column */}
                    <div
                      className="spec-key"
                      style={{
                        flex: '0 0 240px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                        borderRight: '1px solid var(--dark-line, #1f1f1f)',
                        boxShadow: '12px 0 24px -8px rgba(8, 8, 8, 0.9)',
                        background: 'var(--black, #080808)',
                        padding: '16px 14px',
                        fontSize: '11px',
                        letterSpacing: '.16em',
                        color: 'var(--dark-muted, #7a7a76)',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {row.label}
                    </div>

                    {/* Model Value Columns */}
                    {models.map((model) => {
                      const specItem = (model.specs as Record<string, { v: string; calc: boolean }>)[row.key];
                      const val = specItem?.v || '—';
                      return (
                        <div
                          key={model.name + row.key}
                          className="spec-val"
                          style={{
                            flex: '0 0 280px',
                            padding: '16px 18px',
                            fontSize: '14.5px',
                            fontWeight: 500,
                            borderLeft: '1px solid var(--dark-line-2, #161615)',
                            color: '#F5F4F0',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
