import { ChatWidgetClient } from './ChatWidgetClient';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations } from '@/lib/types';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ChatWidgetPage({ searchParams }: PageProps) {
  const settings: Settings = await getSettings();
  
  const langQuery = typeof searchParams.lang === 'string' ? searchParams.lang : 'fr';
  const lang = langQuery === 'en' ? 'en' : 'fr';
  
  const [deliverySettings, laborSettings, productsResult, locations] = await Promise.all([
    getDeliverySettings(),
    getLaborSettings(),
    getProducts({ limit: 1000 }),
    getLocations()
  ]);

  const allProducts: Product[] = productsResult.products;

  return (
    <main className="w-full h-screen bg-[#f8f9fb] overflow-hidden flex flex-col">
      <ChatWidgetClient 
        settings={settings}
        deliverySettings={deliverySettings}
        laborSettings={laborSettings}
        allProducts={allProducts}
        locations={locations}
        lang={lang}
      />
    </main>
  );
}
