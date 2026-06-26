export const DEFAULT_SALE_PRICE_PER_SQM = 2000;
export const DEFAULT_RENTAL_PRICE_PER_DAY = 12;
export const DEFAULT_RENTAL_PRICE_PER_HOUR = 1.5;

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
