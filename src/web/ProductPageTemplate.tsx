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
  const { setCurrentPageId, isEditing, setCurrentLang } = useCms();
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

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f4f0] antialiased selection:bg-white/20 selection:text-white">
      {/* Prévisualisation administrateur : rendue uniquement si le serveur a
          validé la session admin et que le produit n'est pas publié. */}
      {isPreview && <ProductPreviewBar slug={slug} />}

      {/* Sticky Blur Header matching xeron.co.
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

      {/* Main Product Sections matching xeron.co/en/products/wp —
          chaque section est enveloppée par EditableWrapper pour l'éditeur visuel (Point 2 & 4). */}
      <main>
        {/* Section 0: Hero & Animated LED Canvas */}
        <EditableWrapper sectionKey="hero" sectionLabel={effectiveLang === 'FR' ? 'Hero Produit' : 'Product Hero'}>
          <HeroSection
            title={productTitle ?? slug}
            data={product?.hero}
            productPhotosInOverview
            onOpenQuote={() => setIsConsultationOpen(true)}
            lang={effectiveLang}
            series={text(product.series)}
          />
        </EditableWrapper>

        {/* Section 01: Overview (Light Theme).
            Contenu : la vidéo du template et UNE photo, celle de l'aperçu.
            La 2e photo n'a rien à y faire : elle appartient à la section 02. */}
        {hasOverview(sectionsProduct?.overview) && (
          <EditableWrapper sectionKey="overview" sectionLabel={effectiveLang === 'FR' ? 'Aperçu & Statistiques' : 'Overview & Stats'}>
            <OverviewSection
              data={sectionsProduct?.overview}
              lang={effectiveLang}
            />
          </EditableWrapper>
        )}

        {/* Section 02: Design & Architectural Dimensions (Dark Theme).
            Reçoit son visuel via `design.visuals` (rattachement du template). */}
        {hasDesign(sectionsProduct?.design) && (
          <EditableWrapper sectionKey="design" sectionLabel={effectiveLang === 'FR' ? 'Conception & Dimensions' : 'Design & Dimensions'}>
            <DesignSection
              data={sectionsProduct?.design}
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
                  shopLinks={product?.shopLinks}
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

        {/* Section 06: Navigation circulaire produit + CTA Banner (Dark Theme)
            La section n'apparaît que si au moins DEUX produits sont publiés et
            que celui-ci en fait partie : avec un seul produit (ou un produit
            hors base publiée), les deux blocs sont masqués. Les liens pointent
            toujours vers des produits réels de la base, jamais vers la
            navigation déclarée dans le PDF. */}
        {circularNav && (
          <EditableWrapper sectionKey="next" sectionLabel={effectiveLang === 'FR' ? 'Produits & Devis' : 'Products & Quote'}>
            <NextSection
              data={circularNav}
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
        lang={effectiveLang}
        onOpenConsultation={() => setIsConsultationOpen(true)}
      />

      {/* Consultation & Quote Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        companyName={companyName}
        lang={effectiveLang}
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
