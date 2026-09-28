'use client';

import React from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductOverview, ProductStat } from '@/lib/products/types';
import { text } from '@/lib/products/display';

import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';

interface OverviewSectionProps {
  lang?: Language;
  /** Données produit (template dynamique). Priorité : CMS ?? data. */
  data?: ProductOverview;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  lang = 'FR',
  data,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsOverview = (pages[currentPageId]?.sections?.overview as Record<string, unknown>) || {};
  const activeLang = normalizeLang(lang);

  const eyebrow = getCmsText(
    cmsOverview,
    'eyebrow',
    activeLang,
    text(data?.eyebrow) || (lang === 'FR' ? '01 / APERÇU' : '01 / OVERVIEW')
  );
  const title = getCmsText(cmsOverview, 'title', activeLang, text(data?.title) ?? '');
  const description = getCmsText(cmsOverview, 'description', activeLang, text(data?.description) ?? '');

  const stats: { value: string; label: string }[] = (data?.stats ?? [])
    .filter((s) => text(s.value) && text(s.label))
    .map((s: ProductStat, idx: number) => ({
      value: getCmsText(cmsOverview, `stat_${idx}_val`, activeLang, s.value.trim()),
      label: getCmsText(cmsOverview, `stat_${idx}_label`, activeLang, (lang === 'FR' ? s.labelFr : s.labelEn) || s.label),
    }));

  const techHeading = lang === 'FR' ? 'TECHNOLOGIES INTÉGRÉES' : 'TECHNOLOGIES INSIDE';

  const technologies = (data?.technologies ?? []).filter((t) => text(t.title));

  // Médias : le PDF fournit titre + description, l'admin fournit le fichier.
  const video = data?.video;
  const videoSrc = video?.sources?.filter((s) => text(s.src)) ?? [];
  const videoUrl = text(video?.url);
  const showVideo = videoSrc.length > 0 || Boolean(videoUrl);
  const photoUrl = (cmsOverview.photo as string) || (cmsOverview.image as string) || text(data?.photo?.url);
  const showPhoto = Boolean(photoUrl);
  const showSplit = showVideo || showPhoto;

  return (
    <section id="overview" className="section theme-light">
      <div className="wrap">
        {/* Eyebrow */}
        <div
          data-text-key="eyebrow"
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
            gridTemplateColumns: description ? '1.35fr 1fr' : '1fr',
            gap: 'clamp(32px, 5vw, 96px)',
            alignItems: 'end',
            marginBottom: '56px',
          }}
        >
          {title && (
            <h2
              data-text-key="title"
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
          )}
          {description && (
            <p
              data-text-key="description"
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
          )}
        </div>

        {/* Médias : grille à 1 ou 2 colonnes selon ce qui est réellement fourni */}
        {showSplit && (
        <div
          className="g2 pd-split"
          style={{
            display: 'grid',
            gridTemplateColumns: showVideo && showPhoto ? '1.15fr 1fr' : '1fr',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {showVideo && (
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
                poster={text(video?.poster)}
                aria-label={text(video?.title) ?? text(video?.description)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              >
                {videoSrc.map((s) => (
                  <source key={s.src} src={s.src} type={s.type} />
                ))}
                {videoSrc.length === 0 && videoUrl && (
                  <source src={videoUrl} type={undefined} />
                )}
              </video>
              {(text(video?.title) || text(video?.description)) && (
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
                  <span>{text(video?.title) ?? text(video?.description)}</span>
                </div>
              )}
            </div>
          )}

          {showPhoto && (
            <div
              style={{
                position: 'relative',
                height: 'min(62vh, 600px)',
                overflow: 'hidden',
                background: '#ebe8e1',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-image-key="photo"
                src={photoUrl}
                alt={text(data?.photo?.title) ?? text(data?.photo?.description) ?? ''}
                className="slot-img"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          )}
        </div>
        )}

        {/* Statistiques : grille pilotée par le nombre réel de couples */}
        {stats.length > 0 && (
        <div
          className="pd-stats"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, minmax(0, 1fr))`,
            gap: '1px',
            background: 'var(--line, #dad8d2)',
            border: '1px solid var(--line, #dad8d2)',
            marginTop: '24px',
          }}
        >
          {stats.map((item) => (
            <div
              key={`${item.value}-${item.label}`}
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
        )}

        {/* Technologies : bloc masqué si le PDF n'en fournit pas */}
        {technologies.length > 0 && (
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
                key={tech.title}
                style={{
                  background: 'var(--paper, #f5f4f0)',
                  padding: '30px 28px',
                }}
              >
                {text(tech.num) && (
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
                )}
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    marginBottom: text(tech.description) ? '10px' : 0,
                    color: 'var(--ink, #111110)',
                  }}
                >
                  {tech.title}
                </div>
                {text(tech.description) && (
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--muted-2, #6b6a66)',
                      lineHeight: 1.6,
                    }}
                  >
                    {tech.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </section>
  );
};
