import { ChatWidgetClient } from './ChatWidgetClient';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations } from '@/lib/types';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function ChatWidgetPage() {
  const settings: Settings = await getSettings();
  
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
      />
    </main>
  );
}
