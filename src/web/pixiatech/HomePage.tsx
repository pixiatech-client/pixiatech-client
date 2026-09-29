'use client';

import React, { useState, useEffect, useMemo } from 'react';
import '../pixiatech.css';
import { PixiaHeader } from './PixiaHeader';
import { PixiaFooter } from './PixiaFooter';
import { RevealRoot } from './RevealRoot';
import { Language } from '../pixiatech-translations';
import { ConsultationModal } from './ConsultationModal';
import { BackToTopButton } from './BackToTopButton';

// All Sections in Authentic xeron.co Hierarchy
import { HeroSection } from './sections/HeroSection';
import { ManifestoSection } from './sections/ManifestoSection';
import { ShowreelSection } from './sections/ShowreelSection';
import { MarketsSection } from './sections/MarketsSection';
import { KineticSection } from './sections/KineticSection';
import { ProductsSection } from './sections/ProductsSection';
import { TechShowcaseSection } from './sections/TechShowcaseSection';
import { PitchSection } from './sections/PitchSection';
import {
  ProjectsSection,
  ProcessSection,
  ExperienceSection,
  InsightsSection,
} from './sections/StaticSections';
import { NextSection } from './sections/NextSection';

import { EditableWrapper } from '../cms/EditableWrapper';
import type { StyleKey } from '../cms/SectionStylePanel';
import {
  BGMAP_STYLE_KEYS,
  BGMAP_TITLELESS_KEYS,
  FULL_STYLE_KEYS,
  SHOWREEL_STYLE_KEYS,
} from '../cms/SectionStylePanel';
import { SectionDragDropProvider } from '../cms/SectionDragDropManager';
import { useCms } from '@/lib/site-web/cms-context';

const HOME_PAGE_ID = 'home';

/**
 * Propriétés de style réellement rendues par chaque section (audit des
 * consommateurs, étape 4) : le panneau de style ne propose que ce que le
 * renderer applique, jamais de propriété orpheline.
 */
const HOME_SECTION_STYLE_CAPS: Record<string, readonly StyleKey[]> = {
  hero: BGMAP_STYLE_KEYS, // Hero : cms.section complet, pas de voile rendu
  experience: BGMAP_STYLE_KEYS, // Experience (StaticSections) : pas de voile
  markets: BGMAP_TITLELESS_KEYS, // pas de cms.title, pas de voile
  showreel: SHOWREEL_STYLE_KEYS, // fond + voile + padding ; pas de marges/typo/texte
};

export const DEFAULT_HOME_SECTION_ORDER = [
  'hero',
  'manifesto',
  'showreel',
  'markets',
  'kinetic',
  'products',
  'technology',
  'pitch',
  'projects',
  'process',
  'experience',
  'insights',
  'contact',
];

interface SectionRendererProps {
  lang: Language;
  openConsultation: () => void;
}

const HOME_SECTIONS: Record<
  string,
  { label: string; render: (props: SectionRendererProps) => React.ReactNode }
> = {
  hero: {
    label: 'Hero Principal',
    render: (p) => <HeroSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  manifesto: {
    label: 'Manifeste & Vision',
    render: (p) => <ManifestoSection lang={p.lang} />,
  },
  showreel: {
    label: 'Showreel 3D (Écran LED)',
    render: (p) => <ShowreelSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  markets: {
    label: 'Marchés & Solutions',
    render: (p) => <MarketsSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  kinetic: {
    label: 'Kinetic SPKI-250 (3D & Diode)',
    render: (p) => <KineticSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  products: {
    label: 'Catalogue des Écrans (39 Séries)',
    render: (p) => <ProductsSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  technology: {
    label: 'Technologies Propriétaires (5 Techs)',
    render: (p) => <TechShowcaseSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  pitch: {
    label: 'Calculateur Pas de Pixel & Recul',
    render: (p) => <PitchSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  projects: {
    label: 'Réalisations & Projets Mondiaux',
    render: (p) => <ProjectsSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  process: {
    label: 'Méthodologie & Processus',
    render: (p) => <ProcessSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  experience: {
    label: 'Experience Center',
    render: (p) => <ExperienceSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  insights: {
    label: 'Insights & Articles Techniques',
    render: (p) => <InsightsSection lang={p.lang} onOpenConsultation={p.openConsultation} />,
  },
  contact: {
    label: 'Contact & Consultation',
    render: (p) => (
      <div id="contact">
        <NextSection lang={p.lang} onOpenConsultation={p.openConsultation} />
      </div>
    ),
  },
};

export function PixiaHomePage() {
  const [lang, setLang] = useState<Language>('FR');
  const [consultOpen, setConsultOpen] = useState(false);
  const { setCurrentPageId, currentPageData, isEditing, currentLang, setCurrentLang } = useCms();

  useEffect(() => {
    setCurrentPageId(HOME_PAGE_ID);
  }, [setCurrentPageId]);

  const toggleLang = () => {
    const next: Language = lang === 'FR' ? 'EN' : 'FR';
    setLang(next);
    setCurrentLang(next.toLowerCase());
  };
  const openConsultation = () => setConsultOpen(true);

  // Le toggle de langue du header définit la langue active : l'éditeur direct
  // s'y conforme (aucun sélecteur de langue supplémentaire dans l'éditeur).
  const effectiveLang: Language = isEditing
    ? (currentLang.toUpperCase() === 'EN' ? 'EN' : 'FR')
    : lang;

  // Compute ordered sections
  const configuredOrder = currentPageData?.sectionOrder;
  const activeOrder = useMemo(() => {
    if (configuredOrder && Array.isArray(configuredOrder) && configuredOrder.length > 0) {
      const validConfigured = configuredOrder.filter((k) => k in HOME_SECTIONS);
      const missing = DEFAULT_HOME_SECTION_ORDER.filter((k) => !validConfigured.includes(k));
      return [...validConfigured, ...missing];
    }
    return DEFAULT_HOME_SECTION_ORDER;
  }, [configuredOrder]);

  return (
    <RevealRoot className="xer-site" style={{ background: '#080808' }}>
      <PixiaHeader
        companyName="PIXIATECH"
        lang={effectiveLang}
        onOpenConsultation={openConsultation}
        onToggleLang={toggleLang}
      />
      <main className="w-full bg-[#080808] text-[#f5f4f0]">
        <SectionDragDropProvider allSectionKeys={activeOrder}>
          {activeOrder.map((key) => {
            const sec = HOME_SECTIONS[key];
            if (!sec) return null;
            return (
              <EditableWrapper
                key={key}
                sectionKey={key}
                sectionLabel={sec.label}
                styleCapabilities={HOME_SECTION_STYLE_CAPS[key] ?? FULL_STYLE_KEYS}
              >
                {sec.render({ lang: effectiveLang, openConsultation })}
              </EditableWrapper>
            );
          })}
        </SectionDragDropProvider>
      </main>
      <PixiaFooter companyName="PIXIATECH" lang={effectiveLang} onOpenConsultation={openConsultation} />
      <ConsultationModal
        isOpen={consultOpen}
        onClose={() => setConsultOpen(false)}
        companyName="PIXIATECH"
        lang={lang}
      />
      <BackToTopButton lang={lang} />
    </RevealRoot>
  );
}
