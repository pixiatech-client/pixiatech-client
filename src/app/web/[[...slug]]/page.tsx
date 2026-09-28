import { PixiaHomePage } from '@/web/pixiatech/HomePage';
import { PixiaInsightsPage } from '@/web/pixiatech/InsightsPage';
import { WebPage } from '@/web/WebPage';
import { AllProductsPage } from '@/web/pixiatech/AllProductsPage';
import { MentionsLegalesPage } from '@/web/legal/MentionsLegalesPage';
import { PolitiqueConfidentialitePage } from '@/web/legal/PolitiqueConfidentialitePage';
import { GestionCookiesPage } from '@/web/legal/GestionCookiesPage';
import { PixiaContactPage } from '@/web/pixiatech/ContactPage';
import { resolvePublicProduct } from '@/lib/products/resolve-public-product';
import { connection } from 'next/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug?.[0] === 'contact') {
    return {
      title: 'Contactez-nous | PIXIATECH',
      description:
        "Contactez l'équipe PIXIATECH pour vos projets d'écrans LED, devis et solutions visuelles sur-mesure.",
    };
  }
  return {};
}

export default async function WebSlugPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const first = slug?.[0];

  if (first === 'insights') {
    return <PixiaInsightsPage />;
  }

  // Page Contact du site web : header PixiaTech + module contact en mode public.
  if (first === 'contact') {
    return <PixiaContactPage />;
  }

  if (first === 'pxt-fine') {
    // Cette seule branche lit Firestore à chaque requête. `connection()`
    // arrête le prerender ICI, et non pour tout le catch-all : les autres
    // pages /web/* gardent leur comportement de rendu précédent.
    // Sans produit, les sections restent masquées (aucune donnée inventée)
    // au lieu d'afficher une fiche vide qui laisserait croire à du contenu.
    await connection();
    const product = await resolvePublicProduct('pxt-fine');
    return <WebPage product={product ?? undefined} />;
  }

  if (first === 'products') {
    return <AllProductsPage />;
  }

  if (first === 'mentions-legales') {
    return <MentionsLegalesPage />;
  }

  if (first === 'politique-confidentialite') {
    return <PolitiqueConfidentialitePage />;
  }

  if (first === 'gestion-cookies') {
    return <GestionCookiesPage />;
  }

  // Unknown or empty slug → PixiaTech home (preserves the 307-not-found→home fix)
  return <PixiaHomePage />;
}