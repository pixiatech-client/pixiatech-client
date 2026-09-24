'use client';

import React from 'react';
import { Language } from '../data/translations';

interface NextSectionProps {
  onOpenConsultation: () => void;
  lang?: Language;
}

export const NextSection: React.FC<NextSectionProps> = ({
  onOpenConsultation,
  lang = 'FR',
}) => {
  return (
    <section
      id="next"
      className="theme-dark"
      style={{
        padding: 'clamp(90px, 10vh, 130px) 0',
        borderTop: '1px solid var(--dark-line, #1f1f1f)',
        background: 'var(--black, #080808)',
        color: 'var(--dark-text, #f5f4f0)',
      }}
    >
      <div className="wrap">
        {/* Previous & Next Series Cards */}
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Previous Series */}
          <a
            href="/web/products"
            className="hov-border-acc"
            style={{
              display: 'block',
              border: '1px solid var(--dark-line, #1f1f1f)',
              padding: '32px 30px',
              transition: 'border-color .25s ease',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '.2em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: '14px',
                textTransform: 'uppercase',
              }}
            >
              {lang === 'FR' ? '← SÉRIE PRÉCÉDENTE' : '← PREVIOUS SERIES'}
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 2.2vw, 32px)',
                fontWeight: 700,
                color: 'var(--dark-text, #f5f4f0)',
              }}
            >
              WK Series
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--dark-muted, #7a7a76)',
                marginTop: '6px',
              }}
            >
              {lang === 'FR' ? 'Écran LED fin pitch intérieur' : 'Indoor fine-pitch LED display'}
            </div>
          </a>

          {/* Next Series */}
          <a
            href="/web/products"
            className="hov-border-acc"
            style={{
              display: 'block',
              border: '1px solid var(--dark-line, #1f1f1f)',
              padding: '32px 30px',
              textAlign: 'right',
              transition: 'border-color .25s ease',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                letterSpacing: '.2em',
                color: 'var(--dark-muted, #7a7a76)',
                marginBottom: '14px',
                textTransform: 'uppercase',
              }}
            >
              {lang === 'FR' ? 'SÉRIE SUIVANTE →' : 'NEXT SERIES →'}
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 2.2vw, 32px)',
                fontWeight: 700,
                color: 'var(--dark-text, #f5f4f0)',
              }}
            >
              PXT Ultra
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--dark-muted, #7a7a76)',
                marginTop: '6px',
              }}
            >
              {lang === 'FR' ? 'Écran LED fin pitch intérieur' : 'Indoor fine-pitch LED display'}
            </div>
          </a>
        </div>

        {/* Call To Action Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--dark-line, #1f1f1f)',
            marginTop: '72px',
            paddingTop: '64px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(34px, 3.6vw, 58px)',
              fontWeight: 700,
              letterSpacing: '-.02em',
              margin: 0,
              lineHeight: 1.06,
            }}
          >
            {lang === 'FR' ? (
              <>
                Donnons vie à
                <br />
                votre affichage.
              </>
            ) : (
              <>
                Let&#x27;s build
                <br />
                your display.
              </>
            )}
          </h2>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="btn btn-solid"
            style={{
              padding: '19px 34px',
              fontSize: '14px',
              textTransform: 'none',
              letterSpacing: '.04em',
              cursor: 'pointer',
            }}
          >
            {lang === 'FR' ? 'Démarrer un projet →' : 'Start a Project →'}
          </button>
        </div>
      </div>
    </section>
  );
};
