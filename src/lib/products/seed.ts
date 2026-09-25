// ============================================================================
// Chargement du seed de référence (Phase A) — uniquement côté serveur (RSC).
// `data/products-seed.json` est la référence canonique de PXT Fine ; il sert
// de fallback au rendu tant que les règles Firestore `site_web_products`
// ne sont pas déployées. Résolution : chemin relatif depuis src/lib/products.
// ============================================================================

import type { Product } from './types';
import seedData from '../../../data/products-seed.json';

interface SeedFile {
  version: number;
  products: Product[];
}

const seed: SeedFile = seedData as SeedFile;

export function getSeedProducts(): Product[] {
  return seed.products || [];
}

export function getSeedProductBySlug(slug: string): Product | null {
  const products = seed.products || [];
  return products.find((p) => p.slug === slug) ?? null;
}
