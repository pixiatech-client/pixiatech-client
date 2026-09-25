// ============================================================================
// Fallback « modèle » (Phase D) : le template produit public doit TOUJOURS
// rendre une page complète, comme la page de référence PXT Fine (Phase B).
// Chaque section absente ou trop partielle d'un produit Firestore (créé à
// partir d'un simple PDF) est complétée par les données du modèle de référence.
// Le seed de référence n'est jamais modifié — on construit des objets neufs.
// ============================================================================

import type {
  Product,
  ProductHero,
  ProductOverview,
  ProductFeatures,
  ProductFeature,
  ProductSpecs,
  ProductSpecModel,
} from './types';
import seedData from '../../../data/products-seed.json';

interface SeedFile {
  version: number;
  products: Product[];
}

const seed = seedData as unknown as SeedFile;

/** Modèle de référence : la série « PXT Fine » (page prise comme modèle). */
export const REFERENCE_PRODUCT: Product =
  seed.products.find((p) => p.slug === 'pxt-fine') ?? seed.products[0];

const hasItems = (xs?: unknown[]): boolean => !!xs && xs.length > 0;

function mergeHero(data?: ProductHero): ProductHero {
  const base: ProductHero = REFERENCE_PRODUCT.hero ?? { title: '' };
  if (!data) return base;
  return {
    ...base,
    ...data,
    specs: hasItems(data.specs) ? data.specs : base.specs,
    tags: hasItems(data.tags) ? data.tags : base.tags,
  };
}

function mergeOverview(data?: ProductOverview): ProductOverview {
  const base: ProductOverview = REFERENCE_PRODUCT.overview ?? {};
  if (!data) return base;
  return {
    ...base,
    ...data,
    stats: hasItems(data.stats) ? data.stats : base.stats,
    technologies: hasItems(data.technologies) ? data.technologies : base.technologies,
  };
}

function mergeFeatures(data?: ProductFeatures): ProductFeatures {
  const base: ProductFeatures = REFERENCE_PRODUCT.features ?? { items: [] };
  const srcItems = data?.items && data.items.length > 0 ? data.items : undefined;
  if (!srcItems) return base;
  const modelItems = base.items ?? [];
  const items: ProductFeature[] = srcItems.map((item, i) => {
    const ref = modelItems[i];
    return {
      ...ref,
      ...item,
      num: item.num || ref?.num || String(i + 1).padStart(2, '0'),
      image: item.image || ref?.image || '',
      contain: typeof item.contain === 'boolean' ? item.contain : !!ref?.contain,
    };
  });
  return {
    eyebrow: data.eyebrow ?? base.eyebrow,
    title: data.title ?? base.title,
    items,
  };
}

function mergeSpecs(data?: ProductSpecs): ProductSpecs {
  const base: ProductSpecs = REFERENCE_PRODUCT.specs ?? { groups: [], models: [] };
  const hasMatrix =
    !!data?.models &&
    data.models.some((m) => Object.keys(m.specs ?? {}).length >= 2);
  if (!hasMatrix) return base;
  const seen = new Set<string>();
  const models: ProductSpecModel[] = data!.models
    .filter((m) => Object.keys(m.specs ?? {}).length > 0)
    .filter((m) => {
      if (seen.has(m.name)) return false;
      seen.add(m.name);
      return true;
    });
  return {
    groups: data!.groups && data!.groups.length > 0 ? data!.groups : base.groups,
    models,
  };
}

function hasUsablePhotos(media?: Product['media']): boolean {
  return !!media?.photos?.some((photo) => !!photo.url);
}

/**
 * Complète un produit public avec les données du modèle de référence :
 * sections absentes → modèle ; sections présentes → données réelles du produit,
 * les sous-champs manquants (ex. images de features) repiqués depuis le modèle.
 */
export function applyModelFallback(
  product: Product | null | undefined,
  model: Product = REFERENCE_PRODUCT
): Product {
  if (!product) return model;
  return {
    ...product,
    name: product.name || model.name,
    slug: product.slug || model.slug,
    badge: product.badge ?? model.badge,
    environment: product.environment ?? model.environment,
    sellingModes: hasItems(product.sellingModes) ? product.sellingModes : model.sellingModes,
    variants: hasItems(product.variants) ? product.variants : model.variants,
    characteristics: product.characteristics ?? model.characteristics,
    buttons: product.buttons ?? model.buttons,
    description: product.description ?? model.description,
    menu: product.menu ?? model.menu,
    hero: mergeHero(product.hero),
    overview: mergeOverview(product.overview),
    design: product.design ?? model.design,
    features: mergeFeatures(product.features),
    specs: mergeSpecs(product.specs),
    fieldwork:
      product.fieldwork?.projects?.length ? product.fieldwork : model.fieldwork,
    next: product.next ?? model.next,
    seo: product.seo ?? model.seo,
    media: hasUsablePhotos(product.media) ? product.media : model.media,
  };
}