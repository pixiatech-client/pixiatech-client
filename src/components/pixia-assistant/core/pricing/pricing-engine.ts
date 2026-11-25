import type {
  DeliverySettings,
  LaborSettings,
  Locations,
  PricingCalculationResult,
  Product,
  ProjectType,
  Settings,
} from '../types';

/**
 * ISOLATION LAYER FOR EXTERNAL PRICING FORMULAS
 * -----------------------------------------------------------------------------
 * Per audit report & user directive:
 * The original external implementations for:
 *   - computeProductLineTotal
 *   - computeLaborCost
 *   - computeDeliveryCostDetails
 *   - resolveDestination (and static CITIES table)
 *   - buildPriceSnapshot
 *   - computeDeposit
 *   - calculatePromotionPercent
 * are NOT present in this workspace.
 *
 * No formulas have been fabricated. Verified geometry (`areaSqm`, `totalAreaSqm`,
 * `rentalDays`) and destination matching run cleanly, while unverified monetary
 * amounts return `null` and display as "Sur estimation" / "On quote".
 * Plug official formulas into these isolated functions when ready.
 */

export interface ExternalPricingHooks {
  computeProductLineTotal?: (
    product: Product,
    params: {
      width: number;
      height: number;
      quantity: number;
      transactionType: ProjectType;
      rentalDuration: number;
      rentalUnit: 'day';
    }
  ) => number;
  computeLaborCost?: (
    laborSettings: LaborSettings,
    totalAreaSqm: number
  ) => { installationCost: number; techniciansRequired: number };
  computeDeliveryCostDetails?: (
    deliverySettings: DeliverySettings,
    params: { subtotal: number; zoneId: string | null; cityId: string | null }
  ) => { cost: number };
  computeDeposit?: (total: number, transactionType: ProjectType) => number;
}

const HOOKS: ExternalPricingHooks = {};

export function computeAreaSqm(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 0;
  }
  return Math.round(width * height * 100) / 100;
}

export function computeRentalDays(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function resolveDestination(
  cityQuery: string,
  villes: Locations['villes']
): { cityName: string; postcode: string; zoneId: string | null; cityId: string | null; matched: boolean } {
  const normalized = cityQuery.trim().toLowerCase();
  const found = villes.find((v) => v.name.toLowerCase() === normalized)
    ?? villes.find((v) => v.name.toLowerCase().includes(normalized) && normalized.length >= 2);

  if (found) {
    return {
      cityName: found.name,
      postcode: found.postcode,
      zoneId: found.zoneId,
      cityId: found.id,
      matched: true,
    };
  }

  return {
    cityName: cityQuery.trim() || 'À préciser',
    postcode: '',
    zoneId: null,
    cityId: null,
    matched: false,
  };
}

export function calculatePromotionPercent(product: Product | null): number | null {
  if (!product || typeof product.promotionPercent !== 'number') return null;
  return product.promotionPercent > 0 ? product.promotionPercent : null;
}

export function buildPriceSnapshot(params: {
  product: Product | null;
  width: number;
  height: number;
  quantity: number;
  transactionType: ProjectType;
  rentalStartDate: string | null;
  rentalEndDate: string | null;
  includeDelivery: boolean;
  includeInstallation: boolean;
  deliveryCity: string;
  locations: Locations;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
  settings: Settings;
}): PricingCalculationResult {
  const areaSqm = computeAreaSqm(params.width, params.height);
  const qty = Math.max(1, params.quantity || 1);
  const totalAreaSqm = Math.round(areaSqm * qty * 100) / 100;
  const rentalDays = params.transactionType === 'location'
    ? computeRentalDays(params.rentalStartDate, params.rentalEndDate)
    : 1;

  // Historical audit behavior used rentalDuration: 1 even for multi-day periods.
  // Isolated here until official formula integration is provided.
  const effectiveBillingDays = 1;
  const destination = resolveDestination(params.deliveryCity, params.locations.villes);

  const hasOfficialHooks = Boolean(
    HOOKS.computeProductLineTotal &&
      HOOKS.computeLaborCost &&
      HOOKS.computeDeliveryCostDetails &&
      HOOKS.computeDeposit
  );

  if (!hasOfficialHooks || !params.product) {
    return {
      formulaStatus: 'on_quote_isolated',
      displayMode: 'on_quote',
      areaSqm,
      totalAreaSqm,
      rentalDays,
      effectiveBillingDays,
      destination: {
        cityName: destination.cityName,
        postcode: destination.postcode,
        zoneId: destination.zoneId,
        matched: destination.matched,
      },
      lineTotal: null,
      installationCost: null,
      techniciansRequired: null,
      deliveryCost: null,
      subtotal: null,
      taxRate: params.settings.estimationFlow.taxEnabled ? params.settings.estimationFlow.taxRate : 0,
      taxMode: params.settings.estimationFlow.taxMode ?? 'ht',
      total: null,
      deposit: null,
      promotionPercent: calculatePromotionPercent(params.product),
    };
  }

  const lineTotal = HOOKS.computeProductLineTotal!(params.product, {
    width: params.width,
    height: params.height,
    quantity: qty,
    transactionType: params.transactionType,
    rentalDuration: effectiveBillingDays,
    rentalUnit: 'day',
  });
  const labor = HOOKS.computeLaborCost!(params.laborSettings, totalAreaSqm);
  const installationCost = params.includeInstallation ? labor.installationCost : 0;
  const techniciansRequired = params.includeInstallation ? labor.techniciansRequired : 0;
  const deliveryDetails = HOOKS.computeDeliveryCostDetails!(params.deliverySettings, {
    subtotal: lineTotal,
    zoneId: destination.zoneId,
    cityId: destination.cityId,
  });
  const deliveryCost = params.includeDelivery ? deliveryDetails.cost : 0;
  const subtotal = lineTotal + installationCost + deliveryCost;
  const taxRate = params.settings.estimationFlow.taxEnabled ? params.settings.estimationFlow.taxRate : 0;
  const taxMode = params.settings.estimationFlow.taxMode ?? 'ht';
  const total = taxMode === 'ht' ? subtotal * (1 + taxRate / 100) : subtotal;
  const deposit = HOOKS.computeDeposit!(total, params.transactionType);

  return {
    formulaStatus: 'configured',
    displayMode: 'calculated',
    areaSqm,
    totalAreaSqm,
    rentalDays,
    effectiveBillingDays,
    destination: {
      cityName: destination.cityName,
      postcode: destination.postcode,
      zoneId: destination.zoneId,
      matched: destination.matched,
    },
    lineTotal,
    installationCost,
    techniciansRequired,
    deliveryCost,
    subtotal,
    taxRate,
    taxMode,
    total,
    deposit,
    promotionPercent: calculatePromotionPercent(params.product),
  };
}
