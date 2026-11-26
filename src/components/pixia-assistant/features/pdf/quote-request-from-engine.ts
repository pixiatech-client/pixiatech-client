'use client';

import type {
  City,
  PriceSnapshot,
  ProductSpec,
  QuoteRequest,
} from '@/lib/types';
import type { BootstrapPayload } from '../../core/types';
import type { PixiaEngineState } from '../../core/fsm/pixia-fsm';

/**
 * Construit la `QuoteRequest` attendue par le modèle de devis officiel
 * (`QuotePDF`) à partir de l'état du bot et du snapshot de prix signé par le
 * serveur. Aucun montant n'est recalculé ici : toutes les valeurs viennent du
 * snapshot officiel, exactement comme dans le parcours client normal.
 */
export function buildAssistantQuoteRequest(params: {
  engine: PixiaEngineState;
  bootstrap: BootstrapPayload;
  snapshot: PriceSnapshot;
  selectedCity: City | null;
}): { request: QuoteRequest; specs: Record<string, ProductSpec[]> } {
  const { engine, bootstrap, snapshot, selectedCity } = params;
  const { configState, form } = engine;
  const transactionType =
    configState.projectType === 'location' ? 'rental' : 'sale';
  const productId = configState.selectedProduct?.id ?? '';
  const productName = configState.selectedProduct?.name ?? '';
  const width = Number(configState.width) || 0;
  const height = Number(configState.height) || 0;
  const quantity = Math.max(1, Number(configState.quantity) || 1);
  const productType =
    configState.environment === 'exterieur'
      ? 'outdoor'
      : configState.environment === 'semi-exterieur'
        ? 'showcase'
        : 'indoor';

  const specs: Record<string, ProductSpec[]> = productId
    ? {
        [productId]: [
          {
            id: 'pitch',
            key: 'Pixel pitch',
            value: configState.pitchLabel
              ? `${configState.pitchLabel} mm`
              : configState.pixelPitch
                ? `P${configState.pixelPitch} mm`
                : 'P2.5 mm',
          },
        ],
      }
    : {};

  const rentalPeriod =
    transactionType === 'rental' &&
    configState.rentalStartDate &&
    configState.rentalEndDate
      ? {
          from: new Date(configState.rentalStartDate),
          to: new Date(configState.rentalEndDate),
        }
      : undefined;

  const request = {
    id: engine.quoteId ?? 'assistant-bot',
    number: engine.quoteReference ?? undefined,
    createdAt: new Date(),
    status: 'pending',
    isRead: false,
    emailVerified: true,
    client: {
      companyName: form.company,
      email: form.email,
      phone: form.phone,
      address: form.address,
      notes: '',
    },
    products: [
      {
        id: productId || 'assistant-product',
        productId,
        productName,
        productType,
        width,
        height,
        quantity,
        transactionType,
        rentalDuration: 1,
        rentalUnit: 'day',
        lineTotal: snapshot.productsSubtotal,
        tileWidth: (configState.selectedProduct?.tileWidthMm ?? 0) / 1000,
        tileHeight: (configState.selectedProduct?.tileHeightMm ?? 0) / 1000,
        pricePerTile: configState.selectedProduct?.salePricePerSqm ?? 0,
        screenLayout:
          configState.screenShape === 'curved'
            ? 'curved'
            : configState.screenShape === '360'
              ? 'cylindrical'
              : 'flat',
        isCurved: configState.screenShape === 'curved',
        is360: configState.screenShape === '360',
        curveLeft: configState.curveLeft ?? 0,
        curveRight: configState.curveRight ?? 0,
        installationPhoto: configState.installationPhoto ?? undefined,
        rentalPeriod,
        rentalStartTime: configState.rentalStartTime,
        rentalEndTime: configState.rentalEndTime,
      },
    ],
    installationCost: snapshot.installation?.cost ?? 0,
    deliveryCost: snapshot.delivery?.cost ?? 0,
    totalQuote: snapshot.total,
    priceSnapshot: snapshot,
    transactionType,
    includeInstallation: Boolean(engine.includeInstallation),
    techniciansRequired: snapshot.installation?.techniciansRequired ?? 0,
    includeDelivery: Boolean(engine.includeDelivery),
    isDeliveryCostFinal: true,
    selectedCityId: selectedCity?.id ?? null,
    width,
    height,
    productName,
    screenType: productType,
    lang: engine.lang,
    rentalPeriod,
    rentalStartTime:
      transactionType === 'rental' ? configState.rentalStartTime : undefined,
    rentalEndTime:
      transactionType === 'rental' ? configState.rentalEndTime : undefined,
    configuratorType: 'lumi',
  } as QuoteRequest;

  return { request, specs };
}
