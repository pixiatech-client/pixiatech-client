'use client';

import React, { useState, useEffect } from 'react';
import { XerHeader } from './xeron/XerHeader';
import { HeroSection } from './components/HeroSection';
import { OverviewSection } from './components/OverviewSection';
import { DesignSection } from './components/DesignSection';
import { FeaturesSection } from './components/FeaturesSection';
import { SpecsSection } from './components/SpecsSection';
import { FieldworkSection } from './components/FieldworkSection';
import { NextSection } from './components/NextSection';
import { XerFooter } from './xeron/XerFooter';
import { ConsultationModal } from './components/ConsultationModal';
import { DatasheetModal } from './components/DatasheetModal';
import { BackToTopButton } from './components/BackToTopButton';
import { SpecModel } from './types';
import { EditableWrapper } from './cms/EditableWrapper';
import { useCms } from '@/lib/site-web/cms-context';
import { Language } from './xeron-translations';
import { setLang as trackerSetLang } from '@/lib/analytics/tracker';

const PRODUCT_PAGE_ID = 'product_wp';

export function WebPage() {
  const [companyName] = useState<string>('PixiaTech');
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<Language>('FR');
  const { setCurrentPageId } = useCms();

  useEffect(() => {
    setCurrentPageId(PRODUCT_PAGE_ID);
  }, [setCurrentPageId]);

  const toggleLang = () => {
    const next = lang === 'EN' ? 'FR' : 'EN';
    setLang(next);
    trackerSetLang(next.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Sticky Blur Header matching xeron.co */}
      <XerHeader
        companyName={companyName}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        lang={lang}
        onToggleLang={toggleLang}
        forceSolidDark={false}
      />

      {/* Main Product Sections matching xeron.co/en/products/wp */}
      <main>
        {/* Section 0: Hero & Animated LED Canvas */}
        <EditableWrapper sectionKey="hero" sectionLabel="Hero Produit (PXT Fine)">
          <HeroSection
            title="PXT Fine"
            onOpenQuote={() => setIsConsultationOpen(true)}
            lang={lang}
          />
        </EditableWrapper>

        {/* Section 01: Overview (Light Theme) */}
        <EditableWrapper sectionKey="overview" sectionLabel="Aperçu & Châssis">
          <OverviewSection
            companyName={companyName}
            lang={lang}
          />
        </EditableWrapper>

        {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
        <EditableWrapper sectionKey="design" sectionLabel="Conception & Dimensions">
          <DesignSection
            lang={lang}
          />
        </EditableWrapper>

        {/* Section 03: Key Features Interactive FStage (Dark Theme) */}
        <EditableWrapper sectionKey="features" sectionLabel="Caractéristiques Techniques">
          <FeaturesSection
            lang={lang}
          />
        </EditableWrapper>

        {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
        <SpecsSection
          onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
          lang={lang}
        />

        {/* Section 05: In The Field Projects (Light Theme) */}
        <EditableWrapper sectionKey="fieldwork" sectionLabel="Réalisations sur le terrain">
          <FieldworkSection
            companyName={companyName}
            lang={lang}
          />
        </EditableWrapper>

        {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
        <NextSection
          onOpenConsultation={() => setIsConsultationOpen(true)}
          lang={lang}
        />
      </main>

      {/* Site Footer matching xeron.co */}
      <XerFooter
        companyName={companyName}
        lang={lang}
        onOpenConsultation={() => setIsConsultationOpen(true)}
      />

      {/* Consultation & Quote Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        companyName={companyName}
        lang={lang}
      />

      {/* Datasheet Printable Modal */}
      <DatasheetModal
        model={activeDatasheetModel}
        onClose={() => setActiveDatasheetModel(null)}
        companyName={companyName}
        lang={lang}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton lang={lang} />
    </div>
  );
}
