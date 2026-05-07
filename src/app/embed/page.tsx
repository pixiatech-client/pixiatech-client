
import { QuoteBuilder } from '@/components/quote-builder';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations, WizardSettings } from '@/lib/types';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations, getWizardSettings } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function EmbedPage() {
  const settings: Settings = await getSettings();
  
  const [deliverySettings, laborSettings, productsResult, locations, wizardSettings] = await Promise.all([
    getDeliverySettings(),
    getLaborSettings(),
    getProducts({ limit: 1000 }),
    getLocations(),
    getWizardSettings()
  ]);

  const allProducts: Product[] = productsResult.products;
  
  return (
    <main className="flex-1 container mx-auto p-4 md:p-6">
        <QuoteBuilder 
          initialSettings={settings}
          deliverySettings={deliverySettings}
          laborSettings={laborSettings}
          allProducts={allProducts}
          locations={locations}
          wizardSettings={wizardSettings}
        />
    </main>
  );
}
