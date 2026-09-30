// ============================================================================
// Produits du site web — modèle de données canonique
//
// Un seul template (/web/product/[slug]) + des données propres à chaque produit.
// Ce schéma reflète les 5 sections du PDF modèle
// (docs/product-system/fiche-technique-modele.pdf) :
//   01 APERCU PRODUIT · 02 CONCEPTION & FORMAT · 03 POINTS FORTS TECHNIQUES
//   04 CARACTERISTIQUES TECHNIQUES (matrice groupes × variantes) · 05 REFERENCES TERRAIN
// Tout champ absent du PDF reste ABSENT : aucune valeur n'est inventée ni
// complétée depuis un autre produit.
// Persistance : Firestore, collection "site_web_products" (lecture publique,
// écriture admin), doc.id = slug du produit.
// ============================================================================

export const PRODUCTS_COLLECTION = 'site_web_products';
export const PRODUCT_CATEGORIES_COLLECTION = 'product_categories';
export const PRODUCT_CATEGORY_GROUPS_COLLECTION = 'product_category_groups';
export const MEGA_MENU_SETTING_ID = 'mega_menu';
/**
 * Garde-fou de saisie, PAS une contrainte de nom court.
 *
 * Historique : la valeur initiale de 12 came du Cahier des charges Phase C
 * (« nom court »), écrit avant l'import de fiches PDF. Aucun système en
 * dépend : Firestore indexe sur le slug, les routes sont `/web/product/[slug]`,
 * le SEO prend le nom tel quel et l'affichage gère le débordement en CSS.
 *
 * Les noms réels des fiches PDF ne rentrent pas dans 12 caractères
 * (« IL-FISS-IRWP1.2 Lite » = 21) : cette limite bloquait la création alors
 * que le nom extrait du PDF était correct. 100 laisse largement la place aux
 * références catalogue tout en refusant un pavé collé par erreur.
 *
 * Le slug, lui, reste indépendant et sans limite de longueur dédiée : c'est
 * lui qui devient la clé de document Firestore et le segment d'URL.
 */
export const MAX_PRODUCT_NAME_LENGTH = 100;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductStatus = 'draft' | 'published' | 'deleted';
export type ProductEnvironment = 'indoor' | 'outdoor' | 'showcase' | 'both';
export type SellingMode = 'sale' | 'rental';

// ---------------------------------------------------------------------------
// Catégories produits (taxonomie administrée depuis le CMS)
// ---------------------------------------------------------------------------

/**
 * Clé de groupe de filtres. Les catégories référencent leur groupe par cette
 * clé stable via `ProductCategoryGroup.key`. Les deux groupes seedés
 * conservent les clés "environment" et "application" (rétrocompatibilité) ;
 * tout nouveau groupe administré via le CMS ajoute sa propre clé.
 */
export type ProductCategoryType = string;

/**
 * Groupe de filtres (taxonomie CMS — niveau supérieur aux catégories).
 * Exemple : "Usage", "Sélecteur", "Technologie", "Type de produit".
 * Le groupe est réferencé par les catégories via `key` — renommer un groupe
 * ne change jamais sa clé, donc aucune association n'est cassée.
 */
export interface ProductCategoryGroup {
  id: string;
  /** Clé stable (slug). Renommage du groupe ≠ changement de clé. */
  key: string;
  /** Libellé canonique (repli quand labelFr/labelEn absents). */
  label: string;
  labelFr?: string;
  labelEn?: string;
  active: boolean;
  /** Ordre d'affichage des sections de filtres (plus petit = en premier). */
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Libellé affiché d'un groupe de filtres selon la langue du site.
 * FR → labelFr sinon label ; EN → labelEn sinon label.
 */
export function groupDisplayName(g: ProductCategoryGroup, lang: 'FR' | 'EN' | string): string {
  if (lang === 'FR' && g.labelFr && g.labelFr.trim()) return g.labelFr.trim();
  if (lang === 'EN' && g.labelEn && g.labelEn.trim()) return g.labelEn.trim();
  return g.label ?? '';
}

/**
 * Catégorie produit (classification éditoriale — jamais dérivée du PDF).
 * Les produits référencent les catégories par leur ID stable, jamais par leur
 * libellé : un renommage admin (ex. "Creative" → "Creative & Design")
 * n'affecte aucune association.
 */
export interface ProductCategory {
  id: string;
  name: string;
  /**
   * Libellés par langue (optionnels). Priorité : `nameFr`/`nameEn` puis `name`.
   * Le champ `name` reste le libellé canonique de repli — jamais référencé par
   * les produits (ils utilisent l'ID stable), donc renommable sans risque.
   */
  nameFr?: string;
  nameEn?: string;
  /** Slug stable (ex. "creative"), utilisé pour les résolutions héritées. */
  slug: string;
  /** Clé du groupe de filtres auquel appartient la catégorie. */
  type: ProductCategoryType;
  active: boolean;
  /** Ordre d'affichage dans les filtres (plus petit = plus haut). */
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Libellé affiché d'une catégorie selon la langue du site.
 * FR → `nameFr` sinon `name` ; EN → `nameEn` sinon `name`.
 */
export function categoryDisplayName(c: ProductCategory, lang: 'FR' | 'EN' | string): string {
  if (lang === 'FR' && c.nameFr && c.nameFr.trim()) return c.nameFr.trim();
  if (lang === 'EN' && c.nameEn && c.nameEn.trim()) return c.nameEn.trim();
  return c.name ?? '';
}

/**
 * IDs de catégories référencés par un produit.
 * Source de vérité : `categoryIds` (champ unifié). Repli rétrocompatible sur
 * les anciens tableaux `environmentCategoryIds` / `applicationCategoryIds`
 * tant que chaque produit n'a pas été normalisé.
 */
export function productCategoryIds(p: {
  categoryIds?: string[];
  environmentCategoryIds?: string[];
  applicationCategoryIds?: string[];
}): string[] {
  if (Array.isArray(p.categoryIds) && p.categoryIds.length > 0) return p.categoryIds;
  return [...(p.environmentCategoryIds ?? []), ...(p.applicationCategoryIds ?? [])];
}

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

/**
 * Emplacement média décrit par le PDF (titre + description).
 * Le PDF ne contient que la description : le FICHIER est ajouté dans l'admin.
 */
export interface ProductMediaSlot {
  title?: string;
  description?: string;
  /** Renseigné dans l'admin uniquement (jamais extrait du PDF). */
  url?: string;
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
  /** Image affichée au survol de la carte dans la page "Tous les produits". Aucun autre rôle. */
  hoverImage?: string;
  /** Chemin Storage de `hoverImage` : permet de supprimer le fichier à la défonce. */
  hoverImagePath?: string;
  bgColor?: string;
}

export interface ProductOverview {
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  video?: ProductMediaSlot & {
    poster?: string;
    /** Sources HTML <video> dans l'ordre de préférence. */
    sources?: { src: string; type?: string }[];
  };
  photo?: ProductMediaSlot;
  stats?: ProductStat[];
  technologies?: ProductSubItem[];
}

export interface ProductDesign {
  eyebrow?: string;
  title?: string;
  moduleDim?: string;
  cabinetDim?: string;
  depth?: string;
  weight?: string;
  material?: string;
  image?: string;
  specsList?: ProductKeyValue[];
  /** Visuels techniques (côté / face) décrits par le PDF. */
  visuals?: ProductMediaSlot[];
  configs?: ProductSubItem[];
}

export interface ProductFeature extends ProductSubItem {
  image?: string;
  contain?: boolean;
}

export interface ProductFeatures {
  eyebrow?: string;
  title?: string;
  /** Visuel produit central décrit par le PDF. */
  visual?: ProductMediaSlot;
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

/**
 * Liens boutique par variante, indexés par NOM DE MODÈLE (`ProductSpecModel.name`).
 *
 * Volontairement à la RACINE du produit et non dans `specs.models` :
 * `specs` est intégralement reconstruit à chaque import/réanalyse de PDF
 * (`product-from-template.ts` et `product-pdf-parser.ts` repartent de zéro),
 * ce qui effacerait toute donnée d'édition posée à côté. En étant une clé
 * racine, la fusion superficielle de `saveProduct` la préserve telle quelle :
 * le PDF reste la source des caractéristiques, l'admin la source des liens.
 *
 * Clé absente ou vide = aucun lien = aucun bouton sur le site public.
 */
export type ProductShopLinks = Record<string, string>;

export interface ProductFieldworkProject {
  title: string;
  location?: string;
  pitch?: string;
  year?: string;
  image?: string;
  caption?: string;
}

export interface ProductFieldwork {
  eyebrow?: string;
  title?: string;
  projects: ProductFieldworkProject[];
}

/** Entrée de navigation « série » lue dans le CTA du PDF. */
export interface ProductNextSeries {
  name?: string;
  url?: string;
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
  /** Chemin Storage : indispensable pour la suppression DÉFINITIVE du fichier. */
  path?: string;
  size?: number;
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

  /** Éditeur / société porteuse (masthead du PDF). */
  company?: string;
  /** Série du produit (masthead du PDF) : alimente le fil d'Ariane. */
  series?: string;
  /**
   * Avertissements de l'import PDF (libellé inconnu, valeur hors colonne,
   * cellule ignorée…). Rien n'est jamais perdu en silence : l'admin les affiche.
   */
  importWarnings?: string[];

  // Données historiques (ancien format PDF 17 sections) — non alimentées par
  // le gabarit actuel, conservées pour les produits déjà en base.
  badge?: string;
  environment?: ProductEnvironment;
  sellingModes?: SellingMode[];
  characteristics?: ProductCharacteristic[];
  // Caractéristiques canoniques dérivées de la section 5 (clé PDF → propriété).
  // Une caractéristique = une propriété : aucun champ ne peut être remplacé par
  // un autre sémantiquement différent (un pitch absent reste absent).
  pixelPitch?: string;
  brightness?: string;
  cabinetDimensions?: string;
  cabinetWeight?: string;
  buttons?: ProductButtons;
  variants?: ProductVariant[];
  description?: ProductDescription;

  // Catégories (taxonomie CMS — choix explicite de l'administrateur, jamais
  // déduites du PDF). `categoryIds` est le champ unifié ; les tableaux
  // `environmentCategoryIds` / `applicationCategoryIds` sont conservés pour
  // rétrocompatibilité (lecture via productCategoryIds()).
  categoryIds?: string[];
  environmentCategoryIds?: string[];
  applicationCategoryIds?: string[];

  // Sections du gabarit PDF (template web)
  menu?: ProductMenuRef;
  hero?: ProductHero;
  overview?: ProductOverview;
  design?: ProductDesign;
  features?: ProductFeatures;
  specs?: ProductSpecs;
  /**
   * Liens boutique par variante (clé = nom de modèle). Donnée d'ADMIN, jamais
   * extraite du PDF. Voir {@link ProductShopLinks} pour le choix de stockage.
   */
  shopLinks?: ProductShopLinks;
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

/**
 * Protocoles autorisés pour un lien boutique saisi par un administrateur.
 * Volontairement une liste blanche : `javascript:`, `data:` ou `vbscript:`
 * deviendraient un vecteur XSS dès que le lien est rendu dans un `href`.
 */
const SHOP_URL_PROTOCOLS = ['http://', 'https://'] as const;

/**
 * Normalise un lien boutique saisi par un administrateur.
 *
 * Renvoie une chaîne VIDE pour toute valeur absente ou non sûre : l'appelant
 * traite alors l'absence de lien comme le cas normal, et aucun bouton ne peut
 * s'afficher avec une URL fantaisiste.
 *
 * Un chemin interne (`/boutique/pxt-fine`) est accepté tel quel, sans protocole.
 */
export function normalizeShopUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  // Un chemin interne relatif est autorisé ; tout le reste doit déclarer un protocole.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  const isAllowed = SHOP_URL_PROTOCOLS.some((protocol) => trimmed.toLowerCase().startsWith(protocol));
  if (!isAllowed) return '';
  // Un espace ou un retour ligne dans une URL est toujours une saisie erronée :
  // `new URL()` échouerait au clic, sur une page déjà rendue.
  if (/\s/.test(trimmed)) return '';
  try {
    return new URL(trimmed).toString();
  } catch {
    return '';
  }
}

/** `true` si la valeur est un lien boutique affichable tel quel. */
export function isValidShopUrl(value: unknown): boolean {
  return normalizeShopUrl(value) !== '';
}

/**
 * Règle unique du bouton public : le lien d'UNE variante, ou une chaîne vide.
 *
 * Centralise la décision « ce bouton existe-t-il ? » pour que l'affichage et
 * les tests partagent exactement le même code. Une chaîne vide garantit
 * l'absence du bouton (et non un `href` vide ou un `#`).
 */
export function shopLinkForVariant(
  shopLinks: ProductShopLinks | undefined | null,
  modelName: string
): string {
  if (!shopLinks || typeof shopLinks !== 'object') return '';
  return normalizeShopUrl(shopLinks[modelName]);
}

/**
 * Ne conserve que les liens boutique valides d'un formulaire d'édition.
 * Une URL erronée est supprimée plutôt que persistée : le site public n'a
 * ainsi jamais à traiter une valeur invalide, même si l'admin l'a saisie.
 */
export function sanitizeShopLinks(input: Record<string, unknown> | undefined | null): ProductShopLinks {
  const out: ProductShopLinks = {};
  if (!input || typeof input !== 'object') return out;
  for (const [modelName, value] of Object.entries(input)) {
    const key = modelName.trim();
    if (!key) continue;
    const url = normalizeShopUrl(value);
    if (url) out[key] = url;
  }
  return out;
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
