import { XerHomePage } from '@/web/xeron/HomePage';
import { XerInsightsPage } from '@/web/xeron/InsightsPage';
import { WebPage } from '@/web/WebPage';
import { AllProductsPage } from '@/web/xeron/AllProductsPage';

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

  // Unknown or empty slug → PixiaTech home (preserves the 307-not-found→home fix)
  return <XerHomePage />;
}