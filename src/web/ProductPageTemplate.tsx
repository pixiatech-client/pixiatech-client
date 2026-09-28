'use client';

import React, { useState, useEffect } from 'react';
import { PixiaHeader } from './pixiatech/PixiaHeader';
import { HeroSection } from './components/HeroSection';
import { OverviewSection } from './components/OverviewSection';
import { DesignSection } from './components/DesignSection';
import { FeaturesSection } from './components/FeaturesSection';
import { SpecsSection } from './components/SpecsSection';
import { FieldworkSection } from './components/FieldworkSection';
import { NextSection } from './components/NextSection';
import { PixiaFooter } from './pixiatech/PixiaFooter';
import { ConsultationModal } from './components/ConsultationModal';
import { DatasheetModal } from './components/DatasheetModal';
import { BackToTopButton } from './components/BackToTopButton';
import { ProductPreviewBar } from './components/ProductPreviewBar';
import { SpecModel } from './types';
import { useCms } from '@/lib/site-web/cms-context';
import { Language } from './pixiatech-translations';
import { setLang as trackerSetLang } from '@/lib/analytics/tracker';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import {
  DEFAULT_COMPANY_NAME,
  hasDesign,
  hasFeatures,
  hasFieldwork,
  hasNext,
  hasOverview,
  hasSpecs,
  text,
} from '@/lib/products/display';
import type { Product } from '@/lib/products/types';

import { EditableWrapper } from './cms/EditableWrapper';

interface ProductPageTemplateProps {
  slug: string;
  fallbackProduct: Product;
  /**
   * Décidé côté serveur : session admin valide ET produit non publié.
   * Ne jamais déduire ce flag depuis l'URL côté client.
   */
  isPreview?: boolean;
}

export function ProductPageTemplate({ slug, fallbackProduct, isPreview = false }: ProductPageTemplateProps) {
  return (
    <ProductsProvider>
      <ProductView slug={slug} fallbackProduct={fallbackProduct} isPreview={isPreview} />
    </ProductsProvider>
  );
}

function ProductView({ slug, fallbackProduct, isPreview = false }: ProductPageTemplateProps) {
  // L'identité de marque reste une constante du site ; le produit peut la
  // redéfinir via le champ `company` du masthead PDF.
  const [brandName] = useState<string>(DEFAULT_COMPANY_NAME);
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<Language>('FR');
  const { setCurrentPageId, isEditing, currentLang, setCurrentLang } = useCms();
  const { getBySlug } = useProducts();

  // Page id synthétique : chaque fiche produit a sa propre page CMS persistée.
  useEffect(() => {
    setCurrentPageId(`product__${slug}`);
  }, [slug, setCurrentPageId]);

  // Donnée du produit courant, SANS REPLI. Firestore d'abord, puis le seed du
  // même slug en développement. Aucun autre produit ne peut alimenter cette
  // page : une section absente reste absente.
  const product: Product = getBySlug(slug) ?? fallbackProduct;
  const companyName = text(product.company) ?? brandName;
  const productTitle = text(product.name) ?? text(product.hero?.title);

  // Synchronisation de langue : le toggle du header pilote aussi l'éditeur CMS.
  const effectiveLang: Language = isEditing
    ? (currentLang.toUpperCase() === 'EN' ? 'EN' : 'FR')
    : lang;

  // Ancres de la sous-navigation : une ancre n'existe que si sa section est
  // rendue. Construites après les tests de présence pour rester synchronisées.
  const anchors = [
    hasOverview(product?.overview) && {
      id: 'overview',
      label: effectiveLang === 'FR' ? 'APERÇU' : 'OVERVIEW',
    },
    hasDesign(product?.design) && {
      id: 'design',
      label: effectiveLang === 'FR' ? 'CONCEPTION' : 'DESIGN',
    },
    hasFeatures(product?.features) && {
      id: 'features',
      label: effectiveLang === 'FR' ? 'POINTS CLÉS' : 'FEATURES',
    },
    hasSpecs(product?.specs) && {
      id: 'specs',
      label: effectiveLang === 'FR' ? 'SPÉCIFICATIONS' : 'SPECIFICATIONS',
    },
    hasFieldwork(product?.fieldwork) && {
      id: 'fieldwork',
      label: effectiveLang === 'FR' ? 'PROJETS' : 'PROJECTS',
    },
  ].filter((a): a is { id: string; label: string } => Boolean(a));

  const toggleLang = () => {
    const next: Language = lang === 'EN' ? 'FR' : 'EN';
    setLang(next);
    setCurrentLang(next.toLowerCase());
    trackerSetLang(next.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Prévisualisation administrateur : rendue uniquement si le serveur a
          validé la session admin et que le produit n'est pas publié. */}
      {isPreview && <ProductPreviewBar slug={slug} />}

      {/* Sticky Blur Header matching xeron.co */}
      <PixiaHeader
        companyName={companyName}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        lang={effectiveLang}
        onToggleLang={toggleLang}
        forceSolidDark={false}
      />

      {/* Main Product Sections matching xeron.co/en/products/wp —
          chaque section est enveloppée par EditableWrapper pour l'éditeur visuel (Point 2 & 4). */}
      <main>
        {/* Section 0: Hero & Animated LED Canvas */}
        <EditableWrapper sectionKey="hero" sectionLabel={effectiveLang === 'FR' ? 'Hero Produit' : 'Product Hero'}>
          <HeroSection
            title={productTitle ?? slug}
            data={product?.hero}
            image={product?.media?.photos?.find((ph) => ph.url)?.url ?? product?.hero?.image}
            onOpenQuote={() => setIsConsultationOpen(true)}
            lang={effectiveLang}
            series={text(product.series)}
            sections={anchors}
          />
        </EditableWrapper>

        {/* Section 01: Overview (Light Theme) */}
        {hasOverview(product?.overview) && (
          <EditableWrapper sectionKey="overview" sectionLabel={effectiveLang === 'FR' ? 'Aperçu & Statistiques' : 'Overview & Stats'}>
            <OverviewSection data={product?.overview} lang={effectiveLang} />
          </EditableWrapper>
        )}

        {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
        {hasDesign(product?.design) && (
          <EditableWrapper sectionKey="design" sectionLabel={effectiveLang === 'FR' ? 'Conception & Dimensions' : 'Design & Dimensions'}>
            <DesignSection
              data={product?.design}
              lang={effectiveLang}
              hasSpecsTable={hasSpecs(product?.specs)}
            />
          </EditableWrapper>
        )}

        {/* Section 03: Key Features Interactive FStage (Dark Theme) */}
        {hasFeatures(product?.features) && (
          <EditableWrapper sectionKey="features" sectionLabel={effectiveLang === 'FR' ? 'Points Clés' : 'Key Features'}>
            <FeaturesSection data={product?.features} lang={effectiveLang} />
          </EditableWrapper>
        )}

        {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
        {hasSpecs(product?.specs) && (
          <EditableWrapper sectionKey="specs" sectionLabel={effectiveLang === 'FR' ? 'Spécifications Techniques' : 'Technical Specs'}>
            <SpecsSection
              specs={product?.specs}
              onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
              lang={effectiveLang}
            />
          </EditableWrapper>
        )}

        {/* Section 05: In The Field Projects (Light Theme) */}
        {hasFieldwork(product?.fieldwork) && (
          <EditableWrapper sectionKey="fieldwork" sectionLabel={effectiveLang === 'FR' ? 'Projets Réalisés' : 'Field Projects'}>
            <FieldworkSection data={product?.fieldwork} lang={effectiveLang} />
          </EditableWrapper>
        )}

        {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
        {hasNext(product?.next) && (
          <EditableWrapper sectionKey="next" sectionLabel={effectiveLang === 'FR' ? 'Séries Suivantes & Devis' : 'Next Series & Quote'}>
            <NextSection
              data={product?.next}
              productTitle={productTitle}
              onOpenConsultation={() => setIsConsultationOpen(true)}
              lang={effectiveLang}
            />
          </EditableWrapper>
        )}
      </main>

      {/* Site Footer matching xeron.co */}
      <PixiaFooter
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

      {/* Datasheet Printable Modal — alimenté par le produit courant */}
      <DatasheetModal
        model={activeDatasheetModel}
        product={product}
        onClose={() => setActiveDatasheetModel(null)}
        companyName={companyName}
        lang={lang}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton lang={lang} />
    </div>
  );
}
