import { CITIES } from '../cities';
import { resolveDestination, type ResolvedDestination } from '../delivery-resolver';
import {
  computeDeliveryCostDetails,
  computeLaborCost,
  computeProductLineTotal,
  roundMoney,
} from '../pricing-engine';
import { buildPriceSnapshot } from '../price-snapshot';
import type {
  DeliverySettings,
  LaborSettings,
  Locations,
  PriceSnapshot,
  Product,
  Settings,
} from '../types';

export interface AssistantQuoteConfig {
  projectType: 'vente' | 'location' | null;
  width: number | null;
  height: number | null;
  quantity: number;
  selectedProductId?: string | null;
  selectedCityId?: string | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  rentalStartTime?: string;
  rentalEndTime?: string;
}

export interface AssistantQuotePricingInput {
  lang: 'fr' | 'en' | 'zh-CN';
  config: AssistantQuoteConfig;
  client: { deliveryCity: string; deliveryPostcode: string };
  includeDelivery: boolean;
  includeInstallation: boolean;
  product: Product | null;
  locations: Locations;
  settings: Settings;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
}

function rentalDurationInDays(from: string | null | undefined, to: string | null | undefined): number {
  if (!from || !to) return 1;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.max(1, Math.ceil((end - start) / 86_400_000) + 1);
}

/**
 * Calcule un devis d'Assistant avec LES moteurs officiels PixiaTech.
 *
 * Aucune règle tarifaire n'est dupliquée ici : la ligne produit, la livraison,
 * l'installation et la TVA viennent respectivement de pricing-engine.ts et de
 * price-snapshot.ts. Cette fonction est pure (aucun Firestore) afin d'être
 * testable, mais elle n'est appelée que côté serveur avec des réglages lus dans
 * les services officiels.
 */
export function buildAssistantQuotePricing(input: AssistantQuotePricingInput): {
  snapshot: PriceSnapshot;
  productItems: Array<Record<string, unknown>>;
  destination: ResolvedDestination;
  quoteDetails: Record<string, unknown>;
} {
  const transactionType = input.config.projectType === 'location' ? 'rental' : 'sale';
  const width = Math.max(0, Number(input.config.width) || 0);
  const height = Math.max(0, Number(input.config.height) || 0);
  const quantity = Math.max(1, Number(input.config.quantity) || 1);
  const totalArea = width * height * quantity;

  const destination = resolveDestination(
    {
      cityId: input.config.selectedCityId,
      postcode: input.client.deliveryPostcode,
      cityName: input.client.deliveryCity,
    },
    input.locations?.villes,
    CITIES
  );

  const rentalDuration = transactionType === 'rental'
    ? rentalDurationInDays(input.config.rentalStartDate, input.config.rentalEndDate)
    : 1;

  const lineTotal = input.product
    ? roundMoney(computeProductLineTotal(input.product, {
        width,
        height,
        quantity,
        transactionType,
        rentalDuration,
        rentalUnit: 'day',
      }))
    : 0;

  const deliveryDetails = computeDeliveryCostDetails(input.deliverySettings, {
    subtotal: lineTotal,
    zoneId: destination.zoneId,
    cityId: destination.cityId,
  });
  const labor = computeLaborCost(input.laborSettings, totalArea);
  const flow = input.settings?.estimationFlow;

  const snapshot = buildPriceSnapshot({
    transactionType,
    productsSubtotal: lineTotal,
    deliveryDetails,
    labor,
    includeDelivery: input.includeDelivery,
    includeInstallation: input.includeInstallation,
    tax: {
      enabled: Boolean(flow?.taxEnabled),
      rate: flow?.taxRate ?? 0,
      mode: flow?.taxMode ?? 'ht',
    },
    destination: destination.resolved
      ? {
          cityId: destination.cityId,
          zoneId: destination.zoneId,
          cityName: destination.cityName,
          postcode: destination.postcode,
          resolved: destination.resolved,
          fallbackUsed: destination.fallbackUsed,
        }
      : null,
  });

  const productItems = [{
    productId: input.product?.id ?? input.config.selectedProductId ?? '',
    productName: input.product?.name ?? '',
    lineTotal,
    width,
    height,
    quantity,
    transactionType,
    rentalDuration,
    rentalUnit: 'day',
    tileWidth: input.product?.tileWidth ?? 0,
    tileHeight: input.product?.tileHeight ?? 0,
    pricePerTile: input.product?.pricePerTile ?? 0,
    dimensionsEnabled: Boolean(input.product?.hasDimensions || input.product?.dimensionsEnabled),
    nombreEcrans: quantity,
  }];

  const rentalPeriod = transactionType === 'rental' &&
    input.config.rentalStartDate && input.config.rentalEndDate
      ? { from: input.config.rentalStartDate, to: input.config.rentalEndDate }
      : undefined;

  const quoteDetails: Record<string, unknown> = {
    products: productItems,
    transactionType,
    includeInstallation: input.includeInstallation,
    installationCost: snapshot.installation.cost,
    techniciansRequired: snapshot.installation.techniciansRequired,
    includeDelivery: input.includeDelivery,
    deliveryCost: snapshot.delivery.cost,
    totalQuote: snapshot.total,
    width,
    height,
    productName: input.product?.name ?? '',
    lang: input.lang,
    rentalPeriod,
    rentalStartTime: transactionType === 'rental' ? input.config.rentalStartTime : undefined,
    rentalEndTime: transactionType === 'rental' ? input.config.rentalEndTime : undefined,
    configuratorType: 'lumi',
    selectedCityId: destination.resolved ? destination.cityId : null,
    isDeliveryCostFinal: !destination.fallbackUsed,
    unconfiguredCityQuery: destination.fallbackUsed ? input.client.deliveryCity : undefined,
    priceSnapshot: snapshot,
  };

  return { snapshot, productItems, destination, quoteDetails };
}
