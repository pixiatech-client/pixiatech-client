// ============================================================================
// TEMPLATE MAÎTRE — la base absolue de toute page produit.
//
// Règle (mission, POINT 18) :
//
//   LE TEMPLATE MAÎTRE EST LA BASE. LE PDF PERSONNALISE LE TEMPLATE.
//
// Pour chaque champ :
//   - le PDF contient une valeur  -> cette valeur est utilisée ;
//   - le PDF ne contient RIEN     -> la valeur du template maître est conservée.
//
// INTERDIT : supprimer une valeur du template maître parce que le PDF ne la
// mentionne pas. L'ancien `mapParsedToProduct` construisait un `Partial<Product>`
// à partir d'un objet vide : chaque section n'était créée que si le PDF la
// remplissait, si bien que la page produite pouvait se réduire au nom du
// produit. Ici on part d'une base complète et on n'écrase que ce qui est
// réellement fourni.
//
// Deux sources de base, dans cet ordre :
//   1. le produit maître réel « template-maitre » (Firestore) ;
//   2. à défaut, le squelette STRUCTUREL ci-dessous.
//
// Le squelette ne contient AUCUNE valeur produit : uniquement les clés et les
// libellés de sections dont le rendu a besoin. On n'invente donc jamais une
// caractéristique technique (mission, POINT 22).
// ============================================================================

import type { Product, ProductDesign, ProductMediaItem, ProductOverview } from './types';

/** Slug du produit maître officiel (`/web/product/template-maitre?preview=true`). */
export const MASTER_TEMPLATE_SLUG = 'template-maitre';

/** Champs d'identité : ils appartiennent au produit créé, jamais au template. */
const IDENTITY_FIELDS = new Set(['name', 'slug', 'status', 'id', 'createdAt', 'updatedAt']);

/**
 * Une valeur est « absente » quand le PDF ne fournit rien d'exploitable.
 * C'est cette notion qui décide si le template est conservé ou écrasé.
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Chaîne réellement porteuse d'information, ou `undefined`.
 *
 * Volontairement local : ce module est la base DONNÉES du template et ne doit
 * dépendre d'aucun module de règles d'affichage.
 */
function label(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Fusion « template = base, PDF = surcouche ».
 *
 * - champ scalaire fourni   -> valeur du PDF ;
 * - champ scalaire absent   -> valeur du template ;
 * - objet                   -> fusion récursive, champ par champ.
 * - tableau                 -> fusion ÉLÉMENT PAR ÉLÉMENT (voir `mergeArray`).
 */
function mergeValue(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (isEmptyValue(overlay)) return base; // le PDF n'a rien fourni : on garde
  if (Array.isArray(overlay)) return mergeArray(base, overlay);
  if (isPlainObject(overlay)) {
    const out: Record<string, unknown> = isPlainObject(base) ? { ...base } : {};
    for (const [key, value] of Object.entries(overlay)) {
      if (IDENTITY_FIELDS.has(key)) {
        out[key] = value;
        continue;
      }
      const merged = mergeValue(out[key], value);
      if (merged !== undefined) out[key] = merged;
    }
    return out;
  }
  return overlay; // scalaire : la surcouche gagne
}

/**
 * Cle d'appariement d'un élément de tableau. Deux entrées ne se confondent que
 * si elles décrivent la MÊME donnée (même ligne de caractéristique, même
 * modèle). Sans cela, une caractéristique du template absente du PDF serait
 * écrasée puis supprimée — ce qu'interdit explicitement la règle du template
 * maître.
 */
function arrayItemKey(item: unknown): string {
  if (!isPlainObject(item)) return JSON.stringify(item);
  for (const field of ['key', 'label', 'name', 'id', 'title']) {
    const v = item[field];
    if (typeof v === 'string' && v.trim() !== '') return `${field}:${v.trim()}`;
  }
  return JSON.stringify(item);
}

/**
 * Un tableau du PDF personnalise le template, il ne l'efface pas :
 *   - entrée appariée   -> le PDF gagne ;
 *   - entrée du template absente du PDF -> CONSERVÉE (règle du POINT 18) ;
 *   - entrée du PDF absente du template -> ajoutée.
 *
 * Le PDF reste prioritaire : ses entrées viennent en premier, puis les entrées
 * du template qui ne sont pas représentées. L'ordre du template est donc
 * respecté pour ce qui survit.
 */
function mergeArray(base: unknown, overlay: unknown[]): unknown[] {
  const baseArr = Array.isArray(base) ? base : [];
  const baseByKey = new Map<string, unknown>();
  for (const item of baseArr) baseByKey.set(arrayItemKey(item), item);

  const out = overlay.map((item) => {
    const match = baseByKey.get(arrayItemKey(item));
    // Entrée appariée : on fusionne l'intérieur, le PDF gagne sur les champs
    // qu'il renseigne et le template garde ceux qu'il laisse vides.
    return match !== undefined && isPlainObject(item) && isPlainObject(match)
      ? mergeValue(match, item)
      : item;
  });

  const seen = new Set(overlay.map(arrayItemKey));
  for (const item of baseArr) {
    // Entrée du template absente du PDF : CONSERVÉE (règle du POINT 18).
    if (!seen.has(arrayItemKey(item))) out.push(item);
  }
  return out;
}

/**
 * Applique une surcouche (résultat du parsing PDF) sur une base de produit.
 * Ne modifie jamais les objets reçus.
 */
export function mergeProductOntoTemplate(base: Product, overlay: Partial<Product>): Product {
  const merged = mergeValue(base as unknown, overlay as unknown) as Product;
  // Un brouillon reste un brouillon : le template ne doit jamais publier un
  // produit à la place de l'utilisateur.
  merged.status = overlay.status ?? base.status ?? 'draft';
  return merged;
}

/**
 * Squelette STRUCTUREL du gabarit : les sections et libellés attendus par
 * `ProductPageTemplate`, sans aucune valeur produit. Sert uniquement de filet
 * quand le produit maître « template-maitre » est introuvable : la page garde
 * alors toutes ses sections, mais elles restent vides plutôt qu'inventées.
 */
export function createMasterTemplateSkeleton(): Product {
  return {
    name: '',
    slug: '',
    status: 'draft',
    badge: '',
    environment: 'indoor',
    sellingModes: ['sale'],
    characteristics: [],
    buttons: { study: '', datasheet: '' },
    variants: [],
    description: { shortFr: '', detailedFr: '' },
    menu: { groupFr: '', groupEn: '' },
    hero: {
      title: '',
      subtitle: '',
      primaryCta: '',
      secondaryCta: '',
      breadcrumbCategoryFr: '',
      breadcrumbCategoryEn: '',
      tags: [],
      specs: [],
    },
    overview: { eyebrow: '', title: '', description: '', stats: [], technologies: [] },
    design: { eyebrow: '', title: '', specsList: [], visuals: [], configs: [] },
    features: { eyebrow: '', title: '', items: [] },
    specs: { groups: [], models: [] },
    fieldwork: { eyebrow: '', title: '', projects: [] },
    next: { headline: '', headlineHighlight: '', cta: '' },
    seo: { title: '', description: '' },
    media: { photos: [], videos: [] },
    files: [],
  };
}

// ============================================================================
// RATTACHEMENT DES MÉDIAS AUX SECTIONS — DÉFINI PAR LE TEMPLATE MAÎTRE.
//
// La galerie `media.photos` est une bibliothèque ORDONNÉE, pas un contenu en
// soi : chaque photo doit appartenir à UNE section, et le template est celui
// qui décide laquelle.
//
//   media.photos[0]  ->  01 / APERÇU       la photo de l'aperçu
//   media.photos[1]  ->  02 / CONCEPTION   le visuel d'usinage / châssis
//
// Ces emplacements existent déjà dans le schéma (`overview.photo` et
// `design.visuals`), mais RIEN ne plaçait la galerie dessus. Une photo sans
// propriétaire est alors affichée par le premier composant qui la rencontre :
// c'est ainsi que la 2e photo s'est retrouvée en 01 / APERÇU, pendant que le
// vrai emplacement de la section 02 restait vide. Le rattachement est déclaré
// ici, dans le template : tout produit cloné le reçoit. Ce n'est pas une règle
// propre à un produit.
// ============================================================================

/**
 * Rattache la galerie ordonnée aux emplacements de section du template.
 *
 * Renvoie un produit COPIÉ : rien n'est muté, et la valeur n'est écrite nulle
 * part — c'est une dérivation de rendu, pas une donnée persistée.
 *
 * Un emplacement déjà renseigné (par l'admin ou le PDF) est conservé tel quel :
 * conformément à la règle du template, la donnée explicite gagne et la
 * bibliothèque ne sert que de repli.
 */
export function attachSectionMedia(product: Product): Product {
  const gallery: ProductMediaItem[] = (product.media?.photos ?? []).filter((p) =>
    Boolean(label(p?.url))
  );

  // 01 / APERÇU : la photo de l'aperçu. `hero.image` est la photo principale du
  // produit, donc son emplacement naturel quand la galerie est vide — un
  // produit ancêtre sans galerie ne perd pas son image, elle change de zone.
  const overview: ProductOverview = { ...product.overview };
  const overviewPhoto = gallery[0]?.url ?? label(product.hero?.image);
  if (overviewPhoto && !label(overview.photo?.url)) {
    overview.photo = {
      title: label(gallery[0]?.name) ?? label(overview.photo?.title) ?? '',
      description: label(overview.photo?.description) ?? '',
      url: overviewPhoto,
    };
  }

  // 02 / CONCEPTION ARCHITECTURALE : le visuel d'usinage / châssis, à sa
  // place. `DesignSection` rend le PREMIER visuel renseigné : on n'en ajoute
  // un second que si la section n'en a aucun, faute de quoi la photo
  // n'apparaîtrait jamais.
  const design: ProductDesign = { ...product.design };
  const visuals = [...(design.visuals ?? [])];
  const designHasVisual = visuals.some((slot) => label(slot?.url));
  if (gallery[1]?.url && !designHasVisual) {
    visuals.push({
      title: label(gallery[1].name) ?? '',
      url: gallery[1].url,
    });
  }
  design.visuals = visuals;

  return { ...product, overview, design };
}
