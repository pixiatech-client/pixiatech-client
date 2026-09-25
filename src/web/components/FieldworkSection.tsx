'use client';

import React from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductFieldwork } from '@/lib/products/types';

interface FieldworkSectionProps {
  companyName: string;
  lang?: Language;
  /** Données produit (template dynamique). Priorité : data ?? CMS ?? défaut. */
  data?: ProductFieldwork;
}

export const FieldworkSection: React.FC<FieldworkSectionProps> = ({
  companyName,
  lang = 'FR',
  data,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsFieldwork = (pages[currentPageId]?.sections?.fieldwork as Record<string, unknown>) || {};

  const eyebrow =
    data?.eyebrow ||
    (cmsFieldwork.eyebrow as string) ||
    (lang === 'FR' ? '05 / SUR LE TERRAIN' : '05 / IN THE FIELD');
  const title1 =
    data?.title ||
    (cmsFieldwork.title as string) ||
    (lang === 'FR' ? 'Projets réalisés' : 'Projects built');
  const title2 = lang === 'FR' ? `avec ${companyName} Fine.` : `with ${companyName} Fine.`;
  const allProjectsLink = lang === 'FR' ? 'TOUS LES PROJETS →' : 'ALL PROJECTS →';

  const projects = data?.projects?.length
    ? data.projects.map((proj) => {
        const parts: string[] = [];
        if (proj.title) parts.push(proj.title);
        if (proj.location) parts.push(proj.location);
        if (proj.pitch) parts.push(proj.pitch);
        return {
          img: proj.image || (proj as any).img || '',
          alt: parts.join(' — '),
          caption: proj.caption || parts.join(' — ').toUpperCase(),
        };
      })
    : [
    {
      img: '/uploads/projects/westfield-paris-retail-led-screen.jpg',
      alt: `${companyName}, Scenarchie and BTB Audiovisuel Deliver New Digital Impact in Paris — installation`,
      caption: lang === 'FR'
        ? `${companyName.toUpperCase()}, SCENARCHIE ET BTB AUDIOVISUEL ILLUMINENT WESTFIELD PARIS — France / 2026`
        : `${companyName.toUpperCase()}, SCENARCHIE AND BTB AUDIOVISUEL DELIVER NEW DIGITAL IMPACT IN PARIS — France / 2026`,
    },
    {
      img: '/uploads/projects/xeron-led-screens-for-saudi-arabias-ministry-of-culture.jpg',
      alt: `${companyName} LED Screens for Saudi Arabia’s Ministry of Culture — installation`,
      caption: lang === 'FR'
        ? `ÉCRANS LED ${companyName.toUpperCase()} POUR LE MINISTÈRE DE LA CULTURE SAOUDIEN — Arabie Saoudite / 2026`
        : `${companyName.toUpperCase()} LED SCREENS FOR SAUDI ARABIA’S MINISTRY OF CULTURE — Saudi Arabia / 2026`,
    },
  ];

  return (
    <section id="fieldwork" className="section theme-light">
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

        {/* Heading & Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '32px',
            flexWrap: 'wrap',
            marginBottom: '64px',
          }}
        >
          <h2 className="h2" style={{ margin: 0 }}>
            {title1}
            <br />
            {title2}
          </h2>
          <a href="/web/projects" className="link-ul">
            {allProjectsLink}
          </a>
        </div>

        {/* 2-Column Projects Showcase */}
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {projects.map((proj, idx) => (
            <div key={proj.img || `proj-${idx}`}>
              <div
                style={{
                  position: 'relative',
                  height: 'min(48vh, 460px)',
                  overflow: 'hidden',
                  background: '#e0ded8',
                }}
              >
                {proj.img ? (
                  <img
                    src={proj.img}
                    alt={proj.alt}
                    className="slot-img"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://xeron.co${proj.img}`;
                    }}
                  />
                ) : null}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '.2em',
                  color: 'var(--muted, #8a8880)',
                  marginTop: '16px',
                  textTransform: 'uppercase',
                }}
              >
                {proj.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
