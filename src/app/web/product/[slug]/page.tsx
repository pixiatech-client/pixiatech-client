import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeedProductBySlug } from '@/lib/products/seed';
import { getProductBySlug } from '@/lib/products/products-store';
import type { Product } from '@/lib/products/types';
import { ProductPageTemplate } from '@/web/ProductPageTemplate';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

// Page dynamique (Phase C.5) : chaque visite relit Firestore via l'admin SDK,
// afin qu'un produit publié depuis l'admin soit visible immédiatement, sans
// rebuild ni ajout manuel en seed.
export const dynamic = 'force-dynamic';

// Un produit Firestore n'est public que s'il est « published » (brouillons
// invisibles sur le site). Le seed de référence, lui, est toujours public.
function isPubliclyVisible(product: Product | null): product is Product {
  return !!product && product.status === 'published';
}

// Normalise les éventuels Timestamps Firestore (firestore-admin) en chaînes ISO
// pour une sérialisation RSC sans erreur. Séquences `undefined` → supprimées.
function toSerializable(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(toSerializable).filter((v) => v !== undefined);
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const cleaned = toSerializable(val);
    if (cleaned !== undefined) out[key] = cleaned;
  }
  return out;
}

// Précédence : Firestore (produit réel publié) → seed de référence → null.
async function resolvePublicProduct(slug: string): Promise<Product | null> {
  const firestoreProduct = await getProductBySlug(slug);
  if (isPubliclyVisible(firestoreProduct)) {
    return toSerializable(firestoreProduct) as Product;
  }
  const seedProduct = getSeedProductBySlug(slug);
  if (seedProduct) return seedProduct;
  return null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolvePublicProduct(slug);
  if (!product) {
    return { title: 'Produit introuvable · Product not found' };
  }
  return {
    title: product.seo?.title || `${product.name} - PixiaTech`,
    description: product.seo?.description || product.description?.shortFr,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const fallbackProduct = await resolvePublicProduct(slug);
  if (!fallbackProduct) {
    notFound();
  }
  return <ProductPageTemplate slug={slug} fallbackProduct={fallbackProduct} />;
}