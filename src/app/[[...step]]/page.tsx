export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import { QuoteBuilder } from '@/components/quote-builder';
import { EmergencyStopPage } from '@/components/emergency-stop-page';
import { VALID_STEPS } from '@/lib/quote-routes';

import { getSettings, getDeliverySettings, getLaborSettings, getProducts, getLocations, getWizardSettings } from '@/app/actions/public-actions';
import type { Settings, DeliverySettings, LaborSettings, Product, Locations, WizardSettings } from '@/lib/types';

export default async function StepPage(props: { 
  params: Promise<{ step?: string[] }>,
  searchParams?: Promise<{ otp?: string; id?: string; token?: string; step?: string; [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const stepName = params.step?.[0];
  const lastSegment = params.step?.[params.step.length - 1] || '';

  // Sécurité anti-boucle : ne JAMAIS rediriger les assets statiques, images ou uploads manquants vers /
  // Une ressource statique manquante (ex: /uploads/...) doit renvoyer 404 immédiatement (0ms) et non
  // un 307 vers / qui relance le rendu complet du QuoteBuilder et les requêtes Firestore.
  if (
    stepName === 'uploads' ||
    stepName === 'static' ||
    stepName === 'images' ||
    stepName === 'media' ||
    /\.(jpe?g|png|webp|gif|svg|ico|css|js|map|mp4|webm|woff2?|ttf|eot)$/i.test(lastSegment)
  ) {
    notFound();
  }

  // OTP verification: redirect to dedicated verify page
  if (stepName === 'verification-securite' && (searchParams?.otp || searchParams?.token)) {
    const query = new URLSearchParams();
    if (searchParams.otp) query.set('otp', searchParams.otp as string);
    if (searchParams.id) query.set('id', searchParams.id as string);
    if (searchParams.token) query.set('token', searchParams.token as string);
    redirect(`/quote/verify?${query.toString()}`);
  }

  // step-one / step1 : alias legacy → ouvre le Wizard directement à l'étape 1
  if (stepName === 'step-one' || stepName === 'step1') {
    redirect('/?step=1');
  }

  // Slugs historiques du configurateur : on garde la redirection vers l'accueil
  // (le wizard vit désormais sur /?step=N). Tout autre chemin est une vraie 404.
  const KNOWN_LEGACY_STEPS = new Set([...VALID_STEPS, 'step-one', 'step1']);
  if (stepName && KNOWN_LEGACY_STEPS.has(stepName)) {
    redirect('/');
  }

  if (stepName) {
    notFound();
  }

  // Deep-link: ?step=N opens wizard directly at step N
  const wizardStepParam = searchParams?.step;
  const wizardInitialStep = wizardStepParam ? Math.min(8, Math.max(1, parseInt(wizardStepParam as string, 10) || 1)) : undefined;

  const [settings, deliverySettings, laborSettings, productsResult, locations, wizardSettings] = await Promise.all([
    getSettings(),
    getDeliverySettings(),
    getLaborSettings(),
    getProducts({ limit: 1000 }),
    getLocations(),
    getWizardSettings()
  ]);

  if (settings.emergencyStopEnabled) {
    return <EmergencyStopPage returnUrl={settings.emergencyReturnUrl} message={settings.emergencyStopMessage} />;
  }

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
        initialWizardStep={wizardInitialStep}
      />
    </div>
  );
}
