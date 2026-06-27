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
    let unitPrice = p.unitPrice || 0;
    if (p.dimensionsEnabled && p.tileWidth && p.tileHeight && p.pricePerTile) {
      const tilesPerWidth = Math.ceil(((p.width || 0) * 100) / (p.tileWidth || 1));
      const tilesPerHeight = Math.ceil(((p.height || 0) * 100) / (p.tileHeight || 1));
      const totalTiles = tilesPerWidth * tilesPerHeight;
      unitPrice = totalTiles * (p.pricePerTile || 0);
    }
    return acc + ((p.quantity || 0) * unitPrice);
  }, 0);

  const productsDiscountedTotal = products.reduce((acc, p) => {
    let unitPrice = p.unitPrice || 0;
    if (p.dimensionsEnabled && p.tileWidth && p.tileHeight && p.pricePerTile) {
      const tilesPerWidth = Math.ceil(((p.width || 0) * 100) / (p.tileWidth || 1));
      const tilesPerHeight = Math.ceil(((p.height || 0) * 100) / (p.tileHeight || 1));
      const totalTiles = tilesPerWidth * tilesPerHeight;
      unitPrice = totalTiles * (p.pricePerTile || 0);
    }
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
  const techniciansCount = Math.max(1, Math.ceil(totalArea / 40));

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
