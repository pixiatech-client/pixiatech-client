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
import { SpecModel } from './types';
import { EditableWrapper } from './cms/EditableWrapper';
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

const PRODUCT_PAGE_ID = 'product_wp';
/** Cette page CMS est la fiche produit dont elle porte l'identifiant. */
const PRODUCT_SLUG = 'pxt-fine';

/**
 * @param seedProduct Produit déjà résolu côté serveur (Firestore publié, sinon
 *   seed du même slug). Il garantit que la page CMS n'affiche jamais une fiche
 *   vide si Firestore ne contient pas encore le produit. La version vivante
 *   issue de `useProducts()` reste prioritaire pour que l'admin soit visible
 *   sans rechargement.
 */
export function WebPage({ product: seedProduct }: { product?: Product } = {}) {
  return (
    <ProductsProvider>
      <WebPageView seedProduct={seedProduct} />
    </ProductsProvider>
  );
}

function WebPageView({ seedProduct }: { seedProduct?: Product } = {}) {
  const [companyName] = useState<string>(DEFAULT_COMPANY_NAME);
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [activeDatasheetModel, setActiveDatasheetModel] = useState<SpecModel | null>(null);
  const [lang, setLang] = useState<Language>('FR');
  const { setCurrentPageId } = useCms();
  const { getBySlug } = useProducts();

  useEffect(() => {
    setCurrentPageId(PRODUCT_PAGE_ID);
  }, [setCurrentPageId]);

  // La page CMS affiche un produit réel, comme le template dynamique. Elle ne
  // contient plus aucun texte de PXT Fine : les sections non renseignées sont
  // masquées, et les surcharges CMS restent lues par chaque composant.
  // `getBySlug` peut aussi renvoyer un brouillon : sur le site public, seuls
  // les produits « published » sont visibles.
  const liveProduct = getBySlug(PRODUCT_SLUG);
  const product: Product | undefined =
    liveProduct?.status === 'published' ? liveProduct : seedProduct;
  const productTitle = text(product?.name);
  const brandName = text(product?.company) ?? companyName;
  const anchors = [
    hasOverview(product?.overview) && {
      id: 'overview',
      label: lang === 'FR' ? 'APERÇU' : 'OVERVIEW',
    },
    hasDesign(product?.design) && {
      id: 'design',
      label: lang === 'FR' ? 'CONCEPTION' : 'DESIGN',
    },
    hasFeatures(product?.features) && {
      id: 'features',
      label: lang === 'FR' ? 'POINTS CLÉS' : 'FEATURES',
    },
    hasSpecs(product?.specs) && {
      id: 'specs',
      label: lang === 'FR' ? 'SPÉCIFICATIONS' : 'SPECIFICATIONS',
    },
    hasFieldwork(product?.fieldwork) && {
      id: 'fieldwork',
      label: lang === 'FR' ? 'PROJETS' : 'PROJECTS',
    },
  ].filter((a): a is { id: string; label: string } => Boolean(a));

  const toggleLang = () => {
    const next = lang === 'EN' ? 'FR' : 'EN';
    setLang(next);
    trackerSetLang(next.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Sticky Blur Header matching xeron.co */}
      <PixiaHeader
        companyName={brandName}
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
            title={productTitle ?? PRODUCT_SLUG}
            data={product?.hero}
            image={product?.media?.photos?.find((ph) => ph.url)?.url ?? product?.hero?.image}
            onOpenQuote={() => setIsConsultationOpen(true)}
            lang={lang}
            series={text(product?.series)}
            sections={anchors}
          />
        </EditableWrapper>

        {/* Section 01: Overview (Light Theme) */}
        {hasOverview(product?.overview) && (
        <EditableWrapper sectionKey="overview" sectionLabel="Aperçu & Châssis">
          <OverviewSection
            data={product?.overview}
            lang={lang}
          />
        </EditableWrapper>
        )}

        {/* Section 02: Design & Architectural Dimensions (Dark Theme) */}
        {hasDesign(product?.design) && (
        <EditableWrapper sectionKey="design" sectionLabel="Conception & Dimensions">
          <DesignSection
            data={product?.design}
            lang={lang}
            hasSpecsTable={hasSpecs(product?.specs)}
          />
        </EditableWrapper>
        )}

        {/* Section 03: Key Features Interactive FStage (Dark Theme) */}
        {hasFeatures(product?.features) && (
        <EditableWrapper sectionKey="features" sectionLabel="Caractéristiques Techniques">
          <FeaturesSection
            data={product?.features}
            lang={lang}
          />
        </EditableWrapper>
        )}

        {/* Section 04: Complete Specifications Matrix (Dark Theme) */}
        {hasSpecs(product?.specs) && (
        <SpecsSection
          specs={product?.specs}
          onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
          lang={lang}
        />
        )}

        {/* Section 05: In The Field Projects (Light Theme) */}
        {hasFieldwork(product?.fieldwork) && (
        <EditableWrapper sectionKey="fieldwork" sectionLabel="Réalisations sur le terrain">
          <FieldworkSection
            data={product?.fieldwork}
            lang={lang}
          />
        </EditableWrapper>
        )}

        {/* Section 06: Next Series & CTA Banner (Dark Theme) */}
        {hasNext(product?.next) && (
        <NextSection
          data={product?.next}
          productTitle={productTitle}
          onOpenConsultation={() => setIsConsultationOpen(true)}
          lang={lang}
        />
        )}
      </main>

      {/* Site Footer matching xeron.co */}
      <PixiaFooter
        companyName={brandName}
        lang={lang}
        onOpenConsultation={() => setIsConsultationOpen(true)}
      />

      {/* Consultation & Quote Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        companyName={brandName}
        lang={lang}
      />

      {/* Datasheet Printable Modal */}
      <DatasheetModal
        model={activeDatasheetModel}
        onClose={() => setActiveDatasheetModel(null)}
        companyName={brandName}
        lang={lang}
        product={product}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton lang={lang} />
    </div>
  );
}
