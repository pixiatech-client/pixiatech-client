import { XerHomePage } from '@/web/xeron/HomePage';
import { XerInsightsPage } from '@/web/xeron/InsightsPage';
import { WebPage } from '@/web/WebPage';
import { AllProductsPage } from '@/web/xeron/AllProductsPage';
import { MentionsLegalesPage } from '@/web/legal/MentionsLegalesPage';
import { PolitiqueConfidentialitePage } from '@/web/legal/PolitiqueConfidentialitePage';
import { GestionCookiesPage } from '@/web/legal/GestionCookiesPage';

export default async function WebSlugPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const first = slug?.[0];

  if (first === 'insights') {
    return <XerInsightsPage />;
  }

  if (first === 'pxt-fine') {
    return <WebPage />;
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
  return <XerHomePage />;
}