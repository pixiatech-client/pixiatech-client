'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { useI18n } from '@/lib/i18n';
import { ProductsProvider, useProducts } from '@/lib/products/products-context';
import {
  DEFAULT_COMPANY_NAME,
  hasDesign,
  hasFeatures,
  hasFieldwork,
  hasOverview,
  hasSpecs,
  text,
} from '@/lib/products/display';
import type { Product, ProductNext } from '@/lib/products/types';
import { attachSectionMedia } from '@/lib/products/master-template';

import { EditableWrapper } from './cms/EditableWrapper';
import { SectionDragDropProvider } from './cms/SectionDragDropManager';

export const DEFAULT_PRODUCT_SECTION_ORDER = [
  'hero',
  'overview',
  'design',
  'features',
  'specs',
  'fieldwork',
  'next',
];

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
  const { setCurrentPageId, isEditing, setCurrentLang, currentPageData } = useCms();
  // Meme source de langue que le header (contexte i18n global, persiste).
  const { locale } = useI18n();
  const effectiveLang: Language = locale === 'en' ? 'EN' : 'FR';
  const { getBySlug, products } = useProducts();

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

  /** Produits publiés, ordonnés : c'est la source unique de la navigation. */
  const publishedProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === 'published')
        .sort((a, b) => {
          const oa = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const ob = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          if (oa !== ob) return oa - ob;
          return (a.name || '').localeCompare(b.name || '', 'fr');
        }),
    [products]
  );

  /**
   * Navigation circulaire entre produits publiés.
   * - 0 ou 1 produit publié → null (section masquée).
   * - 2+ produits → prev/next avec bouclage circulaire.
   * La navigation déclarée dans le PDF (product.next.prev / product.next.next)
   * n'alimente plus les liens produit : elle ne décrit pas des produits réels
   * de la base, et elle réapparaissait quand aucun autre produit n'était publié.
   */
  const circularNav = useMemo((): ProductNext | null => {
    if (publishedProducts.length < 2) return null;

    const idx = publishedProducts.findIndex((p) => p.slug === slug);
    if (idx === -1) return null;

    const N = publishedProducts.length;
    const prevP = publishedProducts[(idx - 1 + N) % N];
    const nextP = publishedProducts[(idx + 1) % N];

    const taglineOf = (p: typeof prevP) =>
      p.description?.shortFr || p.hero?.subtitle || '';

    return {
      ...(product.next?.headline ? { headline: product.next.headline } : {}),
      ...(product.next?.headlineHighlight ? { headlineHighlight: product.next.headlineHighlight } : {}),
      ...(product.next?.cta ? { cta: product.next.cta } : {}),
      prev: {
        name: prevP.name,
        url: `/web/product/${prevP.slug}`,
        tagline: taglineOf(prevP),
      },
      next: {
        name: nextP.name,
        url: `/web/product/${nextP.slug}`,
        tagline: taglineOf(nextP),
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedProducts, slug, product.next]);

  /**
   * Rattachement des médias aux sections — décidé par le TEMPLATE MAÎTRE
   * (`attachSectionMedia`), pas ici.
   *
   *   photos[0] -> 01 / APERÇU        photos[1] -> 02 / CONCEPTION
   *
   * Avant, la 2e photo n'avait aucun propriétaire : elle était passée en
   * `images` à l'aperçu, ce qui l'affichait en 01 alors que l'emplacement réel
   * de la section 02 (`design.visuals`) restait vide. Chaque section reçoit
   * désormais SON média, et `ProductPageTemplate` n'a plus qu'à lire.
   */
  const sectionsProduct = useMemo(() => attachSectionMedia(product), [product]);

  // L'editeur direct n'a pas de selecteur de langue propre : il se cale sur la
  // locale du site, exactement comme le header.
  useEffect(() => {
    setCurrentLang(locale);
    trackerSetLang(locale);
  }, [locale, setCurrentLang]);

  // Ancres de la sous-navigation : une ancre n'existe que si sa section est
  // rendue. Construites après les tests de présence pour rester synchronisées.
  const anchors = [
    // Une ancre n'existe que si sa section est rendue : même condition que le
    // rendu, pour qu'aucun lien ne mène vers une zone absente.
    hasOverview(sectionsProduct?.overview) && {
      id: 'overview',
      label: effectiveLang === 'FR' ? 'APERÇU' : 'OVERVIEW',
    },
    hasDesign(sectionsProduct?.design) && {
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

  // Calcul de l'ordre actif des sections depuis le CMS (ou ordre par défaut)
  const configuredOrder = currentPageData?.sectionOrder;
  const activeOrder = useMemo(() => {
    if (configuredOrder && Array.isArray(configuredOrder) && configuredOrder.length > 0) {
      const validConfigured = configuredOrder.filter((k) => DEFAULT_PRODUCT_SECTION_ORDER.includes(k));
      const missing = DEFAULT_PRODUCT_SECTION_ORDER.filter((k) => !validConfigured.includes(k));
      return [...validConfigured, ...missing];
    }
    return DEFAULT_PRODUCT_SECTION_ORDER;
  }, [configuredOrder]);

  const productSections: Record<string, { label: string; render: () => React.ReactNode } | null> = {
    hero: {
      label: effectiveLang === 'FR' ? 'Hero Produit' : 'Product Hero',
      render: () => (
        <HeroSection
          title={productTitle ?? slug}
          data={product?.hero}
          productPhotosInOverview
          onOpenQuote={() => setIsConsultationOpen(true)}
          lang={effectiveLang}
          series={text(product.series)}
        />
      ),
    },
    overview: hasOverview(sectionsProduct?.overview)
      ? {
          label: effectiveLang === 'FR' ? 'Aperçu & Statistiques' : 'Overview & Stats',
          render: () => (
            <OverviewSection
              data={sectionsProduct?.overview}
              lang={effectiveLang}
            />
          ),
        }
      : null,
    design: hasDesign(sectionsProduct?.design)
      ? {
          label: effectiveLang === 'FR' ? 'Conception & Dimensions' : 'Design & Dimensions',
          render: () => (
            <DesignSection
              data={sectionsProduct?.design}
              lang={effectiveLang}
              hasSpecsTable={hasSpecs(product?.specs)}
            />
          ),
        }
      : null,
    features: hasFeatures(product?.features)
      ? {
          label: effectiveLang === 'FR' ? 'Points Clés' : 'Key Features',
          render: () => (
            <FeaturesSection data={product?.features} lang={effectiveLang} />
          ),
        }
      : null,
    specs: hasSpecs(product?.specs)
      ? {
          label: effectiveLang === 'FR' ? 'Spécifications Techniques' : 'Technical Specs',
          render: () => (
            <SpecsSection
              specs={product?.specs}
              shopLinks={product?.shopLinks}
              shopLinkTypes={product?.shopLinkTypes}
              onSelectDatasheet={(model) => setActiveDatasheetModel(model)}
              lang={effectiveLang}
            />
          ),
        }
      : null,
    fieldwork: hasFieldwork(product?.fieldwork)
      ? {
          label: effectiveLang === 'FR' ? 'Projets Réalisés' : 'Field Projects',
          render: () => (
            <FieldworkSection data={product?.fieldwork} lang={effectiveLang} />
          ),
        }
      : null,
    next: circularNav
      ? {
          label: effectiveLang === 'FR' ? 'Produits & Devis' : 'Products & Quote',
          render: () => (
            <NextSection
              data={circularNav}
              productTitle={productTitle}
              onOpenConsultation={() => setIsConsultationOpen(true)}
              lang={effectiveLang}
            />
          ),
        }
      : null,
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Prévisualisation administrateur : rendue uniquement si le serveur a
          validé la session admin et que le produit n'est pas publié. */}
      {isPreview && <ProductPreviewBar slug={slug} />}

      {/* Sticky Blur Header.
          La navigation interne de la fiche vit ICI, dans le header principal
          (Accueil | Produits | [sections] | Ressources | Contact). Elle ne
          passe que sur une fiche produit : `PixiaHeader` l'ignore ailleurs, et
          le header des autres pages est bit pour bit inchangé. */}
      <PixiaHeader
        companyName={companyName}
        onOpenConsultation={() => setIsConsultationOpen(true)}
        forceSolidDark={false}
        productSections={anchors}
      />

      {/* Main Product Sections —
          chaque section est enveloppée par EditableWrapper et ordonnée dynamiquement via SectionDragDropProvider */}
      <main>
        <SectionDragDropProvider allSectionKeys={activeOrder}>
          {activeOrder.map((key) => {
            const sec = productSections[key];
            if (!sec) return null;
            return (
              <EditableWrapper
                key={key}
                sectionKey={key}
                sectionLabel={sec.label}
              >
                {sec.render()}
              </EditableWrapper>
            );
          })}
        </SectionDragDropProvider>
      </main>

      {/* Site Footer */}
      <PixiaFooter
        companyName={companyName}
        lang={effectiveLang}
        onOpenConsultation={() => setIsConsultationOpen(true)}
      />



      {/* Datasheet Printable Modal — alimenté par le produit courant */}
      <DatasheetModal
        model={activeDatasheetModel}
        product={product}
        onClose={() => setActiveDatasheetModel(null)}
        companyName={companyName}
        lang={effectiveLang}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton lang={effectiveLang} />
    </div>
  );
}
