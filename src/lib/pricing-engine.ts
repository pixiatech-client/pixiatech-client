import type { DeliverySettings, LaborSettings, DeliveryCostReason } from '@/lib/types';

// Ré-exporté depuis types.ts pour compatibilité avec les consommateurs existants.
export type { DeliveryCostReason };

export const DEFAULT_SALE_PRICE_PER_SQM = 2000;
export const DEFAULT_RENTAL_PRICE_PER_DAY = 12;
export const DEFAULT_RENTAL_PRICE_PER_HOUR = 1.5;

// Version du moteur de pricing — TOUJOURS incrémenter en cas de changement de
// la moindre règle de calcul (production, livraison, installation, TVA).
// Elle est gelée dans les PriceSnapshot pour garantir l'immutabilité des devis
// validés après une évolution du moteur.
export const PRICING_ENGINE_VERSION = '1.0.0';

// Normalisation monétaire : centrale, utilisée par le moteur et les snapshots.
export function roundMoney(amount: number): number {
  if (!isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Dépôt de sécurité — règle métier partagée (P1.1). Location : 50 % du total.
export function computeDeposit(total: number, transactionType: 'sale' | 'rental'): number {
  return transactionType === 'rental' ? roundMoney(total * 0.5) : 0;
}

// Échéancier de paiement standard (60 % à la commande / 40 % au solde).
export function computePaymentSchedule(total: number): { firstPayment: number; remainingPayment: number } {
  const firstPayment = roundMoney(total * 0.6);
  return { firstPayment, remainingPayment: roundMoney(total - firstPayment) };
}

// ─────────────────────────────────────────────────────────────────────────────
// COÛTS LIVRAISON / INSTALLATION / TECHNICIENS — SOURCE DE VÉRITÉ UNIQUE
//
// Règles applicables :
//  - Tout coût vaut 0 tant que l'administrateur ne l'a pas configuré explicitement
//    dans Firestore (settings/delivery, settings/labor).
//  - Aucun tarif par défaut caché (600 €, 250 €, 50 €, 1 tech / 40 m², etc.).
//  - Ces fonctions sont pures : elles ne lisent pas Firestore et n'écrivent rien.
//    quote-builder, SignatureFlow, WizardBotFlow, les API et les actions serveur
//    doivent toutes passer par ces fonctions.
// ─────────────────────────────────────────────────────────────────────────────

export interface DeliveryCostInput {
  subtotal?: number;
  zoneId?: string | null;
  cityId?: string | null;
}

export interface DeliveryCostDetails {
  cost: number;
  reason: DeliveryCostReason;
}

function resolveDeliveryCost(settings: DeliverySettings, input: DeliveryCostInput): DeliveryCostDetails {
  const subtotal = input.subtotal ?? 0;

  // Livraison offerte globale (configurée par l'administrateur).
  if (settings.isTotalFreeDeliveryEnabled) return { cost: 0, reason: 'total-free' };

  // Livraison offerte au-delà d'un seuil (configurée par l'administrateur).
  if (settings.isFreeDeliveryEnabled && subtotal >= (settings.freeDeliveryThreshold ?? 0)) {
    return { cost: 0, reason: 'threshold-free' };
  }

  // Règles zone / ville explicitement configurées par l'administrateur.
  if (input.zoneId && settings.deliveryFeeRules?.length) {
    const cityRule = settings.deliveryFeeRules.find(
      r => r.zoneId === input.zoneId && r.cityId && r.cityId === input.cityId
    );
    if (cityRule) return { cost: cityRule.fee ?? 0, reason: 'rule' };

    const zoneRule = settings.deliveryFeeRules.find(
      r => r.zoneId === input.zoneId && !r.cityId
    );
    if (zoneRule) return { cost: zoneRule.fee ?? 0, reason: 'rule' };
  }

  // Tarif par défaut — uniquement si explicitement activé par l'administrateur.
  if (settings.isDefaultFeeEnabled) return { cost: settings.defaultFee ?? 0, reason: 'default' };

  return { cost: 0, reason: 'unconfigured' };
}

export function computeDeliveryCost(settings: DeliverySettings, input: DeliveryCostInput = {}): number {
  return resolveDeliveryCost(settings, input).cost;
}

export function computeDeliveryCostDetails(settings: DeliverySettings, input: DeliveryCostInput = {}): DeliveryCostDetails {
  return resolveDeliveryCost(settings, input);
}

export interface LaborCostResult {
  installationCost: number;
  techniciansRequired: number;
}

export function computeLaborCost(settings: LaborSettings, totalArea: number): LaborCostResult {
  const rules = settings.rules ?? [];
  if (totalArea <= 0 || rules.length === 0) {
    return { installationCost: 0, techniciansRequired: 0 };
  }

  const applicableRule = [...rules]
    .sort((a, b) => b.minSqM - a.minSqM)
    .find(rule => totalArea >= rule.minSqM);

  if (!applicableRule) {
    return { installationCost: 0, techniciansRequired: 0 };
  }

  return {
    installationCost: applicableRule.price ?? 0,
    techniciansRequired: applicableRule.technicians ?? 0,
  };
}

export function normalizePrice(value: string | number | undefined | null): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const normalized = value.replace(/[^0-9.,\-]/g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function calculateArea(widthM: number, heightM: number): number {
  return widthM * heightM;
}

export function calculateTilesCount(widthM: number, heightM: number, tileWidthCM: number, tileHeightCM: number): number {
  if (!tileWidthCM || !tileHeightCM) return 0;
  const tilesW = Math.ceil((widthM * 100) / tileWidthCM);
  const tilesH = Math.ceil((heightM * 100) / tileHeightCM);
  return tilesW * tilesH;
}

export function calculateTileLineTotal(
  widthM: number,
  heightM: number,
  tileWidthCM: number,
  tileHeightCM: number,
  pricePerTile: number
): number {
  return calculateTilesCount(widthM, heightM, tileWidthCM, tileHeightCM) * (pricePerTile || 0);
}

export function calculateSaleLineTotal(
  widthM: number,
  heightM: number,
  pricePerSqM: number,
  quantity: number,
  options?: {
    dimensionsEnabled?: boolean;
    tileWidthCM?: number;
    tileHeightCM?: number;
    pricePerTile?: number;
  }
): number {
  const qty = Math.max(1, quantity || 1);
  if (options?.dimensionsEnabled && options?.tileWidthCM && options?.tileHeightCM) {
    const tileTotal = calculateTileLineTotal(widthM, heightM, options.tileWidthCM, options.tileHeightCM, options.pricePerTile || 0);
    return tileTotal * qty;
  }
  const area = calculateArea(widthM, heightM);
  const price = (pricePerSqM || DEFAULT_SALE_PRICE_PER_SQM);
  return area * price * qty;
}

export function calculateRentalLineTotal(
  widthM: number,
  heightM: number,
  rate: number,
  unit: 'day' | 'hour',
  duration: number,
  quantity: number,
  options?: {
    dimensionsEnabled?: boolean;
    tileWidthCM?: number;
    tileHeightCM?: number;
    pricePerTile?: number;
  }
): number {
  const qty = Math.max(1, quantity || 1);
  const dur = Math.max(1, duration || 1);
  let unitPrice: number;
  if (options?.dimensionsEnabled && options?.tileWidthCM && options?.tileHeightCM) {
    unitPrice = calculateTileLineTotal(widthM, heightM, options.tileWidthCM, options.tileHeightCM, options.pricePerTile || 0);
  } else {
    const area = calculateArea(widthM, heightM);
    const fallback = unit === 'day' ? DEFAULT_RENTAL_PRICE_PER_DAY : DEFAULT_RENTAL_PRICE_PER_HOUR;
    unitPrice = area * (rate || fallback);
  }
  return unitPrice * qty * dur;
}

export function calculatePromotionPercent(oldPrice: number, currentPrice: number): number {
  if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return 0;
  return Math.round((1 - currentPrice / oldPrice) * 100);
}

export function formatPrice(amount: number, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function computeProductLineTotal(
  product: {
    hasDimensions?: boolean;
    tileWidth?: number;
    tileHeight?: number;
    pricePerTile?: number;
    salePricePerSqM?: number;
    rentalPricePerDay?: number;
    rentalPricePerHour?: number;
  },
  config: {
    width: number;
    height: number;
    quantity: number;
    transactionType: 'sale' | 'rental';
    rentalDuration?: number;
    rentalUnit?: 'day' | 'hour';
  }
): number {
  const widthM = config.width || 0;
  const heightM = config.height || 0;
  const quantity = config.quantity || 1;

  const options = {
    dimensionsEnabled: !!product.hasDimensions,
    tileWidthCM: product.tileWidth,
    tileHeightCM: product.tileHeight,
    pricePerTile: product.pricePerTile,
  };

  if (config.transactionType === 'sale') {
    return calculateSaleLineTotal(
      widthM,
      heightM,
      product.salePricePerSqM || 0,
      quantity,
      options
    );
  } else {
    const rate = config.rentalUnit === 'hour'
      ? (product.rentalPricePerHour || 0)
      : (product.rentalPricePerDay || 0);
    return calculateRentalLineTotal(
      widthM,
      heightM,
      rate,
      config.rentalUnit || 'day',
      config.rentalDuration || 1,
      quantity,
      options
    );
  }
}

export function computeProductUnitPrice(
  product: {
    hasDimensions?: boolean;
    tileWidth?: number;
    tileHeight?: number;
    pricePerTile?: number;
    salePricePerSqM?: number;
    rentalPricePerDay?: number;
    rentalPricePerHour?: number;
  },
  config: {
    width: number;
    height: number;
    transactionType: 'sale' | 'rental';
    rentalDuration?: number;
    rentalUnit?: 'day' | 'hour';
  }
): number {
  return computeProductLineTotal(product, {
    ...config,
    quantity: 1,
  });
}

export interface QuoteProduct {
  unitPrice: number;
  quantity: number;
  discount?: number;
  transactionType?: 'sale' | 'rental';
  rentalDuration?: number;
  dimensionsEnabled?: boolean;
  width?: number;
  height?: number;
  tileWidth?: number;
  tileHeight?: number;
  pricePerTile?: number;
}

export interface QuoteOptions {
  productDiscount?: number;
  deliveryCost?: number;
  deliveryDiscount?: number;
  laborCost?: number;
  laborDiscount?: number;
  taxRate?: number;
  globalDiscount?: number;
  techniciansCount?: number;
}

export interface QuoteTotal {
  productsSubtotal: number;
  productsTotal: number;
  deliveryTotal: number;
  laborTotal: number;
  subtotalHT: number;
  tva: number;
  totalTTC: number;
  finalTotal: number;
  totalInitial: number;
  totalArea: number;
  techniciansCount: number;
}

export function computeQuoteTotal(
  products: QuoteProduct[],
  options: QuoteOptions = {}
): QuoteTotal {
  const {
    productDiscount = 0,
    deliveryCost = 0,
    deliveryDiscount = 0,
    laborCost = 0,
    laborDiscount = 0,
    taxRate = 0,
    globalDiscount = 0,
  } = options;

  const productsSubtotal = products.reduce((acc, p) => {
    const unitPrice = p.unitPrice || 0;
    return acc + ((p.quantity || 0) * unitPrice);
  }, 0);

  const productsDiscountedTotal = products.reduce((acc, p) => {
    const unitPrice = p.unitPrice || 0;
    const lineBaseTotal = (p.quantity || 0) * unitPrice;
    let durationFactor = p.transactionType === 'rental' ? (p.rentalDuration || 1) : 1;
    const lineTotal = lineBaseTotal * durationFactor;
    const discounted = lineTotal * (1 - (p.discount || 0) / 100);
    return acc + discounted;
  }, 0);

  const productsTotal = productsDiscountedTotal * (1 - productDiscount / 100);
  const deliveryTotal = deliveryCost - (deliveryCost * deliveryDiscount / 100);
  const laborTotal = laborCost - (laborCost * laborDiscount / 100);
  const subtotalHT = productsTotal + deliveryTotal + laborTotal;
  const tva = subtotalHT * taxRate / 100;
  const totalTTC = subtotalHT + tva;
  const finalTotal = totalTTC - (totalTTC * globalDiscount / 100);

  const totalArea = products.reduce((acc, p) => acc + ((p.width || 0) * (p.height || 0) * (p.quantity || 1)), 0);
  // Nombre de techniciens : jamais déduit d'une règle cachée (ex. 1 / 40 m²).
  // Il doit toujours provenir des règles labor configurées (computeLaborCost) et être
  // transmis explicitement par l'appelant. Valeur sûre : 0.
  const techniciansCount = options.techniciansCount ?? 0;

  return {
    productsSubtotal,
    productsTotal,
    deliveryTotal,
    laborTotal,
    subtotalHT,
    tva,
    totalTTC,
    finalTotal,
    totalInitial: productsSubtotal + deliveryCost + laborCost,
    totalArea,
    techniciansCount,
  };
}
