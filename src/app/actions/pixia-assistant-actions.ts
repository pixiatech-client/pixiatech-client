'use server';

import {
  getDeliverySettings,
  getLaborSettings,
  getLocations,
  getProducts,
  getSettings,
  getWizardSettings,
} from '@/app/actions/public-actions';
import { getBlockedPeriods, getPdfSettings } from '@/app/actions/quote-actions';
import { buildPixiaAssistantBootstrap } from '@/lib/pixia-assistant/bootstrap-builder';
import type { PixiaBootstrapResult } from '@/lib/pixia-assistant/bootstrap-types';
import { readPixiaAssistantSession } from '@/lib/pixia-assistant/session';

const PAGE_SIZE = 1000;

/** Charge tout le catalogue en paginant tant que `hasMore` est vrai. */
async function loadAllProducts() {
  const products: Awaited<ReturnType<typeof getProducts>>['products'] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const result = await getProducts({ page, limit: PAGE_SIZE });
    products.push(...result.products);
    hasMore = result.hasMore;
    page += 1;
  }
  return products;
}

/**
 * Source réelle du bootstrap du nouvel Assistant Bot Pixia.
 *
 * La fonction ne prend aucun argument : l'identité client est résolue côté
 * serveur depuis `client_session`. Les services officiels sont réutilisés
 * tels quels ; aucun backend parallèle ni tarif de démonstration n'est créé.
 */
export async function getPixiaAssistantBootstrap(): Promise<PixiaBootstrapResult> {
  try {
    const [
      session,
      settings,
      wizardSettings,
      deliverySettings,
      laborSettings,
      products,
      locations,
      blockedPeriods,
      pdfSettings,
    ] = await Promise.all([
      readPixiaAssistantSession(),
      getSettings(),
      getWizardSettings(),
      getDeliverySettings(),
      getLaborSettings(),
      loadAllProducts(),
      getLocations(),
      getBlockedPeriods(),
      // rawUrls=true évite de transmettre les logo/background convertis en
      // data URI : seuls les champs texte nécessaires sont conservés ensuite.
      getPdfSettings(true),
    ]);

    return buildPixiaAssistantBootstrap({
      session,
      data: {
        settings,
        wizardSettings,
        deliverySettings,
        laborSettings,
        products,
        locations,
        blockedPeriods,
        pdfSettings,
      },
    });
  } catch (error) {
    console.error('[pixia-assistant] bootstrap action failed:', error);
    return { ok: false, reason: 'service_unavailable' };
  }
}
