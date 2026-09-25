// ============================================================================
// Produits du site web — modèle de données canonique (Phase A)
//
// Un seul template (/web/pxt-fine) + des données propres à chaque produit.
// Ce schéma reflète le format d'entrée structuré du PDF modèle
// (docs/product-system/fiche-technique-modele.pdf), sections 1 à 17.
// Persistance : Firestore, collection "site_web_products" (lecture publique,
// écriture admin), doc.id = slug du produit.
// ============================================================================

export const PRODUCTS_COLLECTION = 'site_web_products';
export const MEGA_MENU_SETTING_ID = 'mega_menu';
export const MAX_PRODUCT_NAME_LENGTH = 12;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductStatus = 'draft' | 'published' | 'deleted';
export type ProductEnvironment = 'indoor' | 'outdoor' | 'showcase' | 'both';
export type SellingMode = 'sale' | 'rental';

// ---------------------------------------------------------------------------
// Blocs génériques réutilisés par plusieurs sections
// ---------------------------------------------------------------------------

export interface ProductKeyValue {
  label: string;
  value: string;
}

export interface ProductStat {
  value: string;
  label: string;
  /** Libellé FR optionnel (si différent du label neutre). */
  labelFr?: string;
  /** Libellé EN optionnel (si différent du label neutre). */
  labelEn?: string;
}

export interface ProductSubItem {
  num?: string;
  title: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Sections 1-8 (base extraite du PDF par le parser existant)
// ---------------------------------------------------------------------------

export interface ProductCharacteristic {
  key: string;
  value: string;
}

export interface ProductVariant {
  name: string;
  value: string;
  reference?: string;
}

export interface ProductButtons {
  /** Bouton principal (étude technique / devis). */
  study?: string;
  /** Bouton secondaire (téléchargement de la fiche technique). */
  datasheet?: string;
}

export interface ProductDescription {
  shortFr: string;
  shortEn?: string;
  detailedFr: string;
  detailedEn?: string;
  keywords?: string[];
}

// ---------------------------------------------------------------------------
// Sections 9-17 (données web du template)
// ---------------------------------------------------------------------------

export interface ProductMenuRef {
  groupFr: string;
  groupEn: string;
  tag?: string;
}

export interface ProductHero {
  title: string;
  subtitle?: string;
  primaryCta?: string;
  secondaryCta?: string;
  breadcrumbCategoryFr?: string;
  breadcrumbCategoryEn?: string;
  tags?: string[];
  /** Grille 4 cellules sous le titre (pitch / luminosité / châssis / environnement). */
  specs?: ProductKeyValue[];
  badge?: string;
  image?: string;
  bgColor?: string;
}

export interface ProductOverview {
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  video?: {
    poster?: string;
    /** Sources HTML <video> dans l'ordre de préférence. */
    sources?: { src: string; type?: string }[];
  };
  stats?: ProductStat[];
  technologies?: ProductSubItem[];
}

export interface ProductDesign {
  eyebrow?: string;
  title?: string;
  cabinetDim?: string;
  weight?: string;
  material?: string;
  image?: string;
  specsList?: ProductKeyValue[];
  configs?: ProductSubItem[];
}

export interface ProductFeature extends ProductSubItem {
  image?: string;
  contain?: boolean;
}

export interface ProductFeatures {
  eyebrow?: string;
  title?: string;
  items: ProductFeature[];
}

export interface ProductSpecRow {
  key: string;
  label: string;
}

export interface ProductSpecGroup {
  id?: string;
  label: string;
  rows: ProductSpecRow[];
}

export interface ProductSpecModel {
  name: string;
  tag?: string;
  specs: Record<string, string>;
}

/** Matrice comparative, propre à chaque produit. */
export interface ProductSpecs {
  groups: ProductSpecGroup[];
  models: ProductSpecModel[];
}

export interface ProductFieldworkProject {
  title: string;
  location?: string;
  pitch?: string;
  image?: string;
  caption?: string;
}

export interface ProductFieldwork {
  eyebrow?: string;
  title?: string;
  projects: ProductFieldworkProject[];
}

export interface ProductNextSeries {
  name: string;
  tagline?: string;
}

export interface ProductNext {
  prev?: ProductNextSeries;
  next?: ProductNextSeries;
  headline?: string;
  headlineHighlight?: string;
  cta?: string;
}

export interface ProductSeo {
  title?: string;
  description?: string;
}

export interface ProductMediaItem {
  id?: string;
  name?: string;
  url?: string;
  type?: 'image' | 'video' | 'pdf';
}

export interface ProductFile {
  name: string;
  url?: string;
  size?: number;
}

// ---------------------------------------------------------------------------
// Produit complet (doc Firestore)
// ---------------------------------------------------------------------------

export interface Product {
  /** Nom commercial, ≤ 12 caractères (slug derivé). */
  name: string;
  /** URL publique stable : /web/product/{slug}. Unique. */
  slug: string;
  status: ProductStatus;
  order?: number;

  // Sections 1-8 (parser PDF)
  badge?: string;
  environment?: ProductEnvironment;
  sellingModes?: SellingMode[];
  characteristics?: ProductCharacteristic[];
  buttons?: ProductButtons;
  variants?: ProductVariant[];
  description?: ProductDescription;

  // Sections 9-17 (template web)
  menu?: ProductMenuRef;
  hero?: ProductHero;
  overview?: ProductOverview;
  design?: ProductDesign;
  features?: ProductFeatures;
  specs?: ProductSpecs;
  fieldwork?: ProductFieldwork;
  next?: ProductNext;
  seo?: ProductSeo;

  // Médias & annexes (gérés séparément dans l'admin, jamais extraits du PDF)
  media?: {
    photos?: ProductMediaItem[];
    videos?: ProductMediaItem[];
  };
  files?: ProductFile[];

  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRecord extends Product {
  id: string;
}

// ---------------------------------------------------------------------------
// Méga-menu (doc Firestore "settings/mega_menu")
// Le menu référence les produits UNIQUEMENT par productSlug — jamais de
// duplication des données produit. Label en cache pour afficher un item
// grisé si le produit est supprimé.
// ---------------------------------------------------------------------------

export interface MegaMenuItem {
  id: string;
  label: string;
  catalogSlug?: string | null;
  productSlug?: string | null;
  /** Affichage public : absent ou true = visible, false = masqué de l'admin et du site. */
  visible?: boolean;
}

export interface MegaMenuColumn {
  id: string;
  titleEn: string;
  titleFr: string;
  items: MegaMenuItem[];
}

export interface MegaMenu {
  columns: MegaMenuColumn[];
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Utilitaires de normalisation
// ---------------------------------------------------------------------------

export function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export function slugify(name: string): string {
  return normalizeName(name)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function assertValidProductName(name: string): string {
  const clean = normalizeName(name);
  if (!clean) {
    throw new Error('Le nom du produit est vide.');
  }
  if (clean.length > MAX_PRODUCT_NAME_LENGTH) {
    throw new Error(`Le nom du produit doit faire au plus ${MAX_PRODUCT_NAME_LENGTH} caractères.`);
  }
  return clean;
}

export function assertValidProductSlug(slug: string): string {
  if (!isValidSlug(slug)) {
    throw new Error(`Slug invalide : « ${slug} ». Utilisez uniquement lettres minuscules, chiffres et tirets.`);
  }
  return slug;
}
