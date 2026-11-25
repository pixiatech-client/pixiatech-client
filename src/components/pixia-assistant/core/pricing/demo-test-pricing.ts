import type { ConfigState, Language, Product } from '../types';
import { computeAreaSqm, computeRentalDays } from './pricing-engine';

/**
 * TEMPORARY TEST DEMO PRICING — REMOVE AFTER TESTING
 * ---------------------------------------------------------------------------
 * Unverified sample figures strictly for previewing UI pricing layout while
 * toggling off "Sur estimation". Keep isolated from official pricing-engine.ts.
 */
export interface DemoTestEstimate {
  areaSqm: number;
  totalAreaSqm: number;
  rentalDays: number;
  productGlobalPrice: number;
  deliveryPrice: number;
  maintenanceInstallationPrice: number;
  totalPrice: number;
}

export function computeDemoProductRatePerSqm(
  product: Product | null,
  isRental: boolean
): number {
  const pitch = product?.pitch ?? 2.5;
  if (isRental) {
    // Sample daily rental rate per m² by pitch tier
    if (pitch <= 2.0) return 210;
    if (pitch <= 3.0) return 175;
    if (pitch <= 5.0) return 145;
    return 115;
  }
  // Sample purchase rate per m² by pitch tier
  if (pitch <= 2.0) return 1890;
  if (pitch <= 3.0) return 1450;
  if (pitch <= 5.0) return 1190;
  return 920;
}

export function computeDemoTestEstimate(params: {
  configState: ConfigState;
  includeDelivery: boolean | null;
  includeInstallation: boolean | null;
  productOverride?: Product | null;
}): DemoTestEstimate {
  const { configState, includeDelivery, includeInstallation, productOverride } = params;
  const width = configState.width && configState.width > 0 ? configState.width : 4;
  const height = configState.height && configState.height > 0 ? configState.height : 2.5;
  const areaSqm = computeAreaSqm(width, height);
  const qty = Math.max(1, configState.quantity || 1);
  const totalAreaSqm = Math.round(areaSqm * qty * 100) / 100;
  const isRental = configState.projectType === 'location';
  const rentalDays = isRental
    ? computeRentalDays(configState.rentalStartDate, configState.rentalEndDate)
    : 1;

  const targetProduct = productOverride ?? configState.selectedProduct;
  const unitRate = computeDemoProductRatePerSqm(targetProduct, isRental);

  const productGlobalPrice = isRental
    ? Math.round(totalAreaSqm * unitRate * rentalDays)
    : Math.round(totalAreaSqm * unitRate);

  const deliveryPrice =
    includeDelivery === false ? 0 : Math.max(190, Math.round(totalAreaSqm * 32));

  const maintenanceInstallationPrice =
    includeInstallation === false ? 0 : Math.max(340, Math.round(totalAreaSqm * 68));

  const totalPrice = productGlobalPrice + deliveryPrice + maintenanceInstallationPrice;

  return {
    areaSqm,
    totalAreaSqm,
    rentalDays,
    productGlobalPrice,
    deliveryPrice,
    maintenanceInstallationPrice,
    totalPrice,
  };
}

export function formatDemoEuro(amount: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
