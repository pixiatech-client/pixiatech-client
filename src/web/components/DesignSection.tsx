'use client';

import React, { useState } from 'react';
import { Language } from '../data/translations';
import { useCms } from '@/lib/site-web/cms-context';
import type { ProductDesign } from '@/lib/products/types';
import { dimensionForArt, text } from '@/lib/products/display';
import { getCmsText, normalizeLang } from '@/lib/site-web/cms-i18n';
import Product3DModule from '@/components/product-3d/Product3DModule';
import { getProduct3DDefinition } from '@/components/product-3d/catalog';

interface DesignSectionProps {
  lang?: Language;
  data?: ProductDesign;
  /** La matrice comparative du produit existe-t-elle ? Contrôle le lien #specs. */
  hasSpecsTable?: boolean;
  /** Identifiant stable du module 3D, porté par le produit (jamais par le CMS). */
  modelId?: string | null;
  /** Mode d'installation propre au produit, si le modèle le prend en charge. */
  installationMode?: string;
}

/* ── Hover-aware spec row ─────────────────────────────────────────────────── */
function SpecRow({
  label,
  val,
  isLast = false,
}: {
  label: string;
  val: string;
  isLast?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        padding: '20px 8px',
        borderBottom: isLast ? 'none' : '1px solid var(--dark-line, #1f1f1f)',
        cursor: 'pointer',
        transition: 'all .25s ease',
        background: hovered ? 'rgba(var(--ui-accent-rgb),0.06)' : 'transparent',
        borderLeft: hovered ? '2px solid var(--ui-accent, var(--ui-accent))' : '2px solid transparent',
        paddingLeft: hovered ? '14px' : '8px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          letterSpacing: '.14em',
          color: hovered ? 'var(--ui-accent, var(--ui-accent))' : 'var(--dark-muted, #7a7a76)',
          transition: 'color .2s',
          fontWeight: hovered ? 700 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: hovered ? '#ffffff' : 'var(--dark-text, #f5f4f0)',
          transition: 'all .2s ease',
          transform: hovered ? 'translateX(4px)' : 'translateX(0)',
          textShadow: hovered ? '0 0 12px rgba(var(--ui-accent-rgb),0.35)' : 'none',
        }}
      >
        {val}
      </span>
    </div>
  );
}

/* ── Specs list panel ──────────────────────────────────────────────────────── */
function SpecsList({
  specsList,
  lang,
  onScrollToSpecs,
  photo,
  hasSpecsTable,
}: {
  specsList: { label: string; val: string }[];
  lang: Language;
  onScrollToSpecs: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Visuel de conception fourni par l'admin (section 02 du PDF). */
  photo?: { title?: string; description?: string; url?: string };
  /** La matrice comparative existe-t-elle ? Sinon pas de lien vers #specs. */
  hasSpecsTable: boolean;
}) {
  const [linkHovered, setLinkHovered] = useState(false);
  const photoUrl = text(photo?.url);
  return (
    <div>
      <div style={{ borderTop: '1px solid var(--dark-line, #1f1f1f)' }}>
        {specsList.map((item) => (
          <SpecRow key={item.label} label={item.label} val={item.val} />
        ))}

        {/* Full technical data link row — masqué si la matrice est absente,
            pour ne pas proposer un lien vers une ancre qui n'existe pas. */}
        {hasSpecsTable && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            padding: '20px 8px',
            borderBottom: 'none',
          }}
        >
          <span
            style={{
              fontSize: '13px',
              letterSpacing: '.14em',
              color: 'var(--dark-muted, #7a7a76)',
            }}
          >
            {lang === 'FR' ? 'DONNÉES TECHNIQUES COMPLÈTES' : 'FULL TECHNICAL DATA'}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            <a
              href="#specs"
              onClick={onScrollToSpecs}
              onMouseEnter={() => setLinkHovered(true)}
              onMouseLeave={() => setLinkHovered(false)}
              style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '.08em',
                color: 'var(--ui-accent, var(--ui-accent))',
                borderBottom: '1px solid var(--ui-accent, var(--ui-accent))',
                padding: '4px 10px',
                background: linkHovered ? 'rgba(var(--ui-accent-rgb),0.15)' : 'transparent',
                borderRadius: '2px',
                transition: 'all .2s ease',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {lang === 'FR' ? 'SPÉCIFICATIONS ↓' : 'SPECIFICATIONS ↓'}
            </a>
          </span>
        </div>
        )}
      </div>

      {/* Visuel de conception — absent tant que l'admin n'a rien associé */}
      {photoUrl && (
        <div
          style={{
            position: 'relative',
            height: '220px',
            marginTop: '28px',
            overflow: 'hidden',
            background: '#0e0e0d',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={text(photo?.title) ?? text(photo?.description) ?? ''}
            className="slot-img"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Config card with hover accent border ──────────────────────────────────── */
function ConfigCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: `2px solid ${hovered ? 'var(--ui-accent, var(--ui-accent))' : 'rgba(var(--ui-accent-rgb),0.25)'}`,
        paddingTop: '20px',
        transition: 'all .25s ease',
        cursor: 'default',
        background: hovered ? 'rgba(var(--ui-accent-rgb),0.04)' : 'transparent',
        padding: '20px 14px 16px',
        borderRadius: hovered ? '4px' : '0',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          letterSpacing: '.2em',
          color: 'var(--ui-accent, var(--ui-accent))',
          marginBottom: '10px',
          fontWeight: 700,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontSize: '21px',
          fontWeight: 700,
          marginBottom: text(desc) ? '8px' : 0,
          color: hovered ? '#ffffff' : 'var(--dark-text, #f5f4f0)',
          transition: 'color .25s',
        }}
      >
        {title}
      </div>
      {text(desc) && (
        <div
          style={{
            fontSize: '14px',
            color: hovered ? 'var(--dark-text-2, #c9c7c1)' : 'var(--dark-body, #a3a3a3)',
            lineHeight: 1.6,
            transition: 'color .25s',
          }}
        >
          {desc}
        </div>
      )}
    </div>
  );
}

/* ── Config grid ───────────────────────────────────────────────────────────── */
function ConfigGrid({ configs }: { configs: { num: string; title: string; desc: string }[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: '24px',
      }}
    >
      {configs.map((cfg) => (
        <ConfigCard key={cfg.title} num={cfg.num} title={cfg.title} desc={cfg.desc} />
      ))}
    </div>
  );
}

/* ── Main section ──────────────────────────────────────────────────────────── */
export const DesignSection: React.FC<DesignSectionProps> = ({
  lang = 'FR',
  data,
  hasSpecsTable = false,
  modelId,
  installationMode,
}) => {
  const { pages, currentPageId } = useCms();
  const cmsDesign = (pages[currentPageId]?.sections?.design as Record<string, unknown>) || {};
  const activeLang = normalizeLang(lang);

  // getCmsText donne priorité au CMS, puis aux données produit, puis au défaut.
  // data-text-key permet à l'éditeur visuel de persister les modifications.
  const eyebrow = getCmsText(
    cmsDesign,
    'eyebrow',
    activeLang,
    text(data?.eyebrow) || (lang === 'FR' ? '02 / CONCEPTION ARCHITECTURALE' : '02 / ARCHITECTURAL DESIGN')
  );
  // Titre : CMS prend le dessus sur le PDF uniquement si l'admin a défini une valeur.
  const heading1 = getCmsText(cmsDesign, 'title', activeLang, text(data?.title) ?? '');

  const specsList = (data?.specsList ?? [])
    .filter((s) => text(s.value) && text(s.label))
    .map((s) => ({ label: s.label, val: s.value }));

  const configs = (data?.configs ?? [])
    .filter((c) => text(c.title))
    .map((c) => ({ num: c.num ?? '', title: c.title, desc: c.description ?? '' }));

  // Cotes du plan : issues du produit. Une cote absente masque son annotation
  // plutôt que d'afficher celle d'un autre châssis.
  const moduleArt = dimensionForArt(data?.moduleDim);
  const cabinetArt = dimensionForArt(data?.cabinetDim);
  const depthArt = dimensionForArt(data?.depth);
  // Photo du plan : média de design fourni par l'admin, sinon blueprint SVG.
  const planPhoto = data?.visuals?.find((v) => text(v.url)) ?? undefined;

  const handleScrollToSpecs = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.querySelector('#specs');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="design" className="section theme-dark design-section">
      <div className="design-wrap">
        {/* Eyebrow */}
        <div
          data-text-key="eyebrow"
          style={{
            fontSize: '11px',
            letterSpacing: '.24em',
            color: 'var(--ui-accent, var(--ui-accent))',
            marginBottom: '36px',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {eyebrow}
        </div>

        {/* Title — absent si le PDF n'en fournit pas */}
        {heading1 && (
          <h2 className="h2" data-text-key="title" style={{ marginBottom: '64px' }}>
            {heading1}
          </h2>
        )}

        {/* Nouveau système : architecture à gauche, vrai module 3D à droite */}
        <div className="design-grid">
          <div className="design-technical space-y-6">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[.24em] text-neutral-400">
                Architecture — vues techniques
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--ui-accent)]">Face</div>
                  <svg viewBox="0 0 200 110" className="h-24 w-full" aria-label="Vue de face">
                    <rect x="20" y="14" width="160" height="82" fill="rgba(255,255,255,0.02)" stroke="#4A4A46" strokeWidth="1.2" />
                    {[0, 1, 2, 3].map((i) => (
                      <rect key={i} x={24 + i * 39} y="18" width="35" height="74" fill="rgba(var(--ui-accent-rgb),0.06)" stroke="#3A3A36" strokeWidth="0.8" />
                    ))}
                    {moduleArt && (
                      <text x="20" y="8" fontSize="9" fill="var(--ui-accent)">MODULE — {moduleArt}</text>
                    )}
                  </svg>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--ui-accent)]">Profil / Dos</div>
                  <svg viewBox="0 0 200 110" className="h-24 w-full" aria-label="Vue de profil">
                    <rect x="80" y="14" width="32" height="82" fill="rgba(var(--ui-accent-rgb),0.06)" stroke="#4A4A46" strokeWidth="1.2" />
                    <line x1="80" y1="104" x2="112" y2="104" stroke="#4A4A46" strokeWidth="1" />
                    {depthArt && (
                      <text x="45" y="8" fontSize="9" fill="var(--ui-accent)">ÉPAISSEUR — {depthArt}</text>
                    )}
                  </svg>
                </div>
              </div>
              {(moduleArt || cabinetArt || depthArt) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                  {moduleArt && <span className="rounded-md bg-white/5 px-2 py-1">Module : {moduleArt}</span>}
                  {cabinetArt && <span className="rounded-md bg-white/5 px-2 py-1">Cabinet : {cabinetArt}</span>}
                  {depthArt && <span className="rounded-md bg-white/5 px-2 py-1">Profondeur : {depthArt}</span>}
                </div>
              )}
              {installationMode && getProduct3DDefinition(modelId).supportsInstallationModes && (
                <div className="mt-2 text-[11px] text-neutral-400">
                  Mode d’installation : <span className="font-semibold text-white">{installationMode}</span>
                </div>
              )}
            </div>
            <SpecsList
              specsList={specsList}
              lang={lang}
              onScrollToSpecs={handleScrollToSpecs}
              photo={planPhoto}
              hasSpecsTable={hasSpecsTable}
            />
          </div>

          <div className="design-viewer">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold uppercase tracking-[.24em] text-neutral-400">
                Visualisation 3D — {getProduct3DDefinition(modelId).label}
              </div>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-neutral-400">
                Modèle {getProduct3DDefinition(modelId).number}
              </span>
            </div>
            <Product3DModule modelId={modelId} className="product-3d-embed" />
          </div>
        </div>

        {/* Configurations — masquées si le PDF n'en fournit pas */}
        {configs.length > 0 && (
        <div
          style={{
            marginTop: '88px',
            borderTop: '1px solid var(--dark-line, #1f1f1f)',
            paddingTop: '56px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '.24em',
              color: 'var(--dark-muted, #7a7a76)',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}
          >
            CONFIGURATIONS
          </div>
          <ConfigGrid configs={configs} />
        </div>
        )}
      </div>
    </section>
  );
};
