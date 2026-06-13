export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { QuoteBuilder } from '@/components/quote-builder';
import { EmergencyStopPage } from '@/components/emergency-stop-page';
import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations, getWizardSettings } from '@/app/admin/actions';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations, WizardSettings } from '@/lib/types';

export default async function StepPage({ params, searchParams }: { 
  params: { step?: string[] },
  searchParams?: { otp?: string; id?: string; token?: string; [key: string]: string | string[] | undefined }
}) {
  const stepName = params.step?.[0];

  // OTP verification: redirect to dedicated verify page
  if (stepName === 'verification-securite' && (searchParams?.otp || searchParams?.token)) {
    const query = new URLSearchParams();
    if (searchParams.otp) query.set('otp', searchParams.otp as string);
    if (searchParams.id) query.set('id', searchParams.id as string);
    if (searchParams.token) query.set('token', searchParams.token as string);
    redirect(`/quote/verify?${query.toString()}`);
  }

  // All named step paths redirect to root — everything stays at /
  if (stepName) {
    redirect('/');
  }

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
    <div className="w-full flex flex-col flex-1 relative">
      <QuoteBuilder
        initialSettings={settings}
        deliverySettings={deliverySettings}
        laborSettings={laborSettings}
        allProducts={allProducts}
        locations={locations}
        wizardSettings={wizardSettings}
      />
    </div>
  );
}
