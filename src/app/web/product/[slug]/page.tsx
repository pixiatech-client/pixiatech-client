import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  resolveProductForPreview,
  resolvePublicProduct,
} from '@/lib/products/resolve-public-product';
import { requireAdminFresh } from '@/lib/auth-guards';
import { ProductPageTemplate } from '@/web/ProductPageTemplate';
import type { Product } from '@/lib/products/types';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Page dynamique (Phase C.5) : chaque visite relit Firestore via l'admin SDK,
// afin qu'un produit publié depuis l'admin soit visible immédiatement, sans
// rebuild ni ajout manuel en seed.
//
// `force-dynamic` est aussi la condition de sécurité du mode prévisualisation :
// la session admin est lue dans les cookies à chaque requête. Une page mise en
// cache ne pourrait plus garantir qu'un brouillon ne fuite pas.
export const dynamic = 'force-dynamic';

/**
 * `?preview=true` n'est qu'un INDICATEUR de demande. Il n'autorise rien :
 * l'autorisation vient exclusivement de `hasAdminSession()`.
 */
function wantsPreview(searchParams: { [key: string]: string | string[] | undefined }): boolean {
  const raw = searchParams.preview;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'true' || value === '1';
}

/**
 * Session administrateur réellement valide : cookie `session` vérifié par
 * l'admin SDK, rôle `admin`, compte `approved` (cf. `requireAdminFresh`).
 * Aucune nouvelle dépendance, aucun second système d'authentification.
 */
async function hasAdminSession(): Promise<boolean> {
  try {
    await requireAdminFresh();
    return true;
  } catch {
    // 401/403/503 : pas de session admin. La demande reste un visiteur.
    return false;
  }
}

/**
 * Charge le produit pour une requête, en appliquant la règle unique :
 *   - `?preview` sans session admin  → aucune donnée de brouillon ne sort ;
 *   - `?preview` avec session admin  → le produit est lu quel que soit son statut ;
 *   - sans `?preview`                → `resolvePublicProduct`, donc `published` uniquement.
 *
 * L'indicateur de prévisualisation n'est levé que si le produit n'est pas
 * réellement publié : un brouillon déjà publié n'a pas à être présenté comme
 * un brouillon, et un produit publié doit rester une page publique normale.
 */
async function loadProduct(
  slug: string,
  preview: boolean
): Promise<{ product: Product | null; isPreview: boolean }> {
  if (preview) {
    if (!(await hasAdminSession())) {
      // Un visiteur qui connaît l'URL ne doit pas apprendre que le produit
      // existe : on applique exactement le même chemin qu'un brouillon sans
      // preview, à savoir `resolvePublicProduct` (donc 404 de fait).
      const product = await resolvePublicProduct(slug);
      return { product, isPreview: false };
    }
    const product = await resolveProductForPreview(slug);
    return { product, isPreview: !!product && product.status !== 'published' };
  }
  return { product: await resolvePublicProduct(slug), isPreview: false };
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product, isPreview } = await loadProduct(slug, wantsPreview(await searchParams));
  if (!product) {
    return { title: 'Produit introuvable · Product not found' };
  }
  return {
    title: product.seo?.title || `${product.name} - PixiaTech`,
    description: product.seo?.description || product.description?.shortFr,
    // Un brouillon n'a rien à faire dans un index de moteur de recherche, même
    // si l'URL a fuité : on interdit explicitement l'indexation en preview.
    ...(isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { product, isPreview } = await loadProduct(slug, wantsPreview(await searchParams));
  if (!product) {
    notFound();
  }
  return <ProductPageTemplate slug={slug} fallbackProduct={product} isPreview={isPreview} />;
}
