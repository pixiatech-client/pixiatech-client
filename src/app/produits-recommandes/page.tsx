export const dynamic = 'force-dynamic';

import { QuoteBuilder } from '@/components/quote-builder';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations, WizardSettings } from '@/lib/types';
import { EmergencyStopPage } from '@/components/emergency-stop-page';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations, getWizardSettings } from '@/app/admin/actions';

export default async function ProduitsRecommandesPage() {
  const settings: Settings = await getSettings();

  if (settings.emergencyStopEnabled) {
    return <EmergencyStopPage returnUrl={settings.emergencyReturnUrl} message={settings.emergencyStopMessage} />;
  }

  const [deliverySettings, laborSettings, productsResult, locations, wizardSettings] = await Promise.all([
    getDeliverySettings(),
    getLaborSettings(),
    getProducts({ limit: 1000 }),
    getLocations(),
    getWizardSettings()
  ]);

  const allProducts: Product[] = productsResult.products;

  return (
    <div className="w-full relative">
      <QuoteBuilder
        initialSettings={settings}
        deliverySettings={deliverySettings}
        laborSettings={laborSettings}
        allProducts={allProducts}
        locations={locations}
        wizardSettings={wizardSettings}
        workflowStep="produits-recommandes"
      />
    </div>
  );
}
