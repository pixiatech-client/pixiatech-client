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
import { useCms } from '@/lib/site-web/cms-context';
import { Language } from './xeron-translations';
import { setLang as trackerSetLang } from '@/lib/analytics/tracker';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import { applyModelFallback, REFERENCE_PRODUCT } from '@/lib/products/model-fallback';
import type { Product } from '@/lib/products/types';

interface ProductPageTemplateProps {
  slug: string;
  fallbackProduct: Product;
}

export function ProductPageTemplate({ slug, fallbackProduct }: ProductPageTemplateProps) {
  return (
    <ProductsProvider>
      <ProductView slug={slug} fallbackProduct={fallbackProduct} />
    </ProductsProvider>
  );
}

function ProductView({ slug, fallbackProduct }: ProductPageTemplateProps) {
  const [companyName] = useState<string>('PixiaTech');
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<Language>('FR');
  const { setCurrentPageId } = useCms();
  const { getBySlug } = useProducts();

  // Page id synthétique : aucune page CMS ne peut fuiter sur le template dynamique.
  useEffect(() => {
    setCurrentPageId(`product__${slug}`);
  }, [slug, setCurrentPageId]);

  // Stratégie : donnée Firestore en temps réel, sinon seed de référence (Phase B).
  // Chaque section manquante/partielle est complétée par le modèle PXT Fine (Phase D).
  const product: Product = applyModelFallback(
    getBySlug(slug) ?? fallbackProduct,
    REFERENCE_PRODUCT
  );

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
        <HeroSection
          title={product?.name || 'PXT Fine'}
          data={product?.hero}
          image={product?.media?.photos?.find((ph) => ph.url)?.url ?? product?.hero?.image}
          onOpenQuote={() => setIsConsultationOpen(true)}
          lang={lang}
        />

        {/* Section 01: Overview (Light Theme) */}
        <OverviewSection
          companyName={companyName}
          data={product?.overview}
          lang={lang}
        />

        {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
        <DesignSection
          data={product?.design}
          lang={lang}
        />

        {/* Section 03: Key Features Interactive FStage (Dark Theme) */}
        <FeaturesSection
          data={product?.features}
          lang={lang}
        />

        {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
        <SpecsSection
          specs={product?.specs}
          onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
          lang={lang}
        />

        {/* Section 05: In The Field Projects (Light Theme) */}
        <FieldworkSection
          companyName={companyName}
          data={product?.fieldwork}
          lang={lang}
        />

        {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
        <NextSection
          data={product?.next}
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
