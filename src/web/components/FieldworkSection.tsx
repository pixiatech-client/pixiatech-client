'use client';

import React from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductFieldwork } from '@/lib/products/types';
import { text } from '@/lib/products/display';

interface FieldworkSectionProps {
  lang?: Language;
  /** Données produit (template dynamique). Priorité : data ?? CMS. */
  data?: ProductFieldwork;
}

export const FieldworkSection: React.FC<FieldworkSectionProps> = ({
  lang = 'FR',
  data,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsFieldwork = (pages[currentPageId]?.sections?.fieldwork as Record<string, unknown>) || {};

  const eyebrow =
    text(data?.eyebrow) ||
    (cmsFieldwork.eyebrow as string) ||
    (lang === 'FR' ? '05 / SUR LE TERRAIN' : '05 / IN THE FIELD');
  // Accroche du PDF uniquement : « Projets réalisés avec PixiaTech Fine. » était
  // un texte figé qui mentionnait le produit de référence sur toutes les pages.
  const heading = text(data?.title) ?? (cmsFieldwork.title as string);
  const allProjectsLink = lang === 'FR' ? 'TOUS LES PROJETS →' : 'ALL PROJECTS →';

  // Un projet sans image est ignoré : une carte vide avec une légende mais sans
  // photo n'apporte rien et occupancy la grille.
  const projects = (data?.projects ?? [])
    .filter((proj) => text(proj.title) || text(proj.caption) || text(proj.image))
    .map((proj) => {
      const parts: string[] = [];
      if (text(proj.title)) parts.push(proj.title);
      if (text(proj.location)) parts.push(proj.location);
      if (text(proj.pitch)) parts.push(proj.pitch);
      if (text(proj.year)) parts.push(proj.year);
      return {
        img: text(proj.image) ?? '',
        alt: parts.join(' — '),
        caption: text(proj.caption) ?? parts.join(' — ').toUpperCase(),
      };
    });

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
          {heading && (
            <h2 className="h2" style={{ margin: 0 }}>
              {heading}
            </h2>
          )}
          <a href="/web/projects" className="link-ul">
            {allProjectsLink}
          </a>
        </div>

        {/* Projets : grille pilotée par le nombre réel de projets */}
        {projects.length > 0 && (
        <div
          className="g2"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(projects.length, 2)}, minmax(0, 1fr))`,
            gap: '24px',
          }}
        >
          {projects.map((proj, idx) => (
            <div key={proj.img || proj.caption || `proj-${idx}`}>
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
                  />
                ) : null}
              </div>
              {proj.caption && (
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
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};
