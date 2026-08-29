import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSaleBlockReason } from '@/lib/product-status';
import { computeDeliveryCostDetails } from '@/lib/pricing-engine';
import { calculateCheckout } from '@/lib/checkout-calculations';
import type { ProfileType } from '@/lib/checkout-calculations';
import type { DeliverySettings, City, PriceSnapshot } from '@/lib/types';

/**
 * Autorité serveur du montant PayPal (P0.3).
 *
 * Aucun montant envoyé par le navigateur ne doit être utilisé comme vérité.
 * Chaque résolution ci-dessous dérive `expectedAmount` depuis des données
 * serveur : `quotes.priceSnapshot.total` (devis signé), `quote_requests.finalPrice`
 * (offre admin) ou une reconstruction du panier boutique depuis les produits.
 */

export const PAYPAL_AMOUNT_TOLERANCE = 0.01;

export class PaypalAmountError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'PaypalAmountError';
    this.status = status;
  }
}

export interface ResolvedItem {
  key: string;
  productId: string;
  type: string;
  quantity: number;
  serverPrice: number;
  lineTotal: number;
}

export interface ResolvedAmount {
  amount: number;
  subtotal: number;
  discount: number;
  totalAfterDiscount: number;
  deliveryCost: number;
  vat: number;
  source: 'price_snapshot' | 'final_price' | 'cart_server';
  priceSnapshot?: PriceSnapshot | null;
  promoCode?: string;
  promoId?: string;
  quoteRequestId?: string;
  quoteId?: string;
  quote?: any;
  items?: ResolvedItem[];
}

export interface BoutiqueCartItem {
  productId: string;
  productPrice?: number;
  quantity: number;
  type: 'purchase' | 'rental';
  variantName?: string;
  variantReference?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalStartTime?: string;
  rentalEndTime?: string;
}

export interface BoutiqueAmountInput {
  items: BoutiqueCartItem[];
  delivery?: { postcode?: string; city?: string; country?: string } | null;
  clientType?: ProfileType;
  vatValidated?: boolean;
  promoCode?: string | null;
  promoDocId?: string | null;
}

/** Miroir de la normalisation client (mapFirestoreDoc) : number sinon salePricePerSqM sinon price. */
function resolveBoutiqueBasePrice(data: any): number | null {
  if (typeof data.price === 'number' && Number.isFinite(data.price)) return data.price;
  if (data.price !== undefined && data.price !== null && data.price !== '') {
    const p = parseFloat(String(data.price));
    if (!Number.isNaN(p)) return p;
  }
  if (data.salePricePerSqM !== undefined && data.salePricePerSqM !== null && data.salePricePerSqM !== '') {
    const p = parseFloat(String(data.salePricePerSqM));
    if (!Number.isNaN(p)) return p;
  }
  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Même formule que BoutiqueRentalFlow : nb jours inclusifs arrondis au supérieur. */
function computeRentalDays(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0;
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

/** Montant réellement capturé par PayPal (EUR). */
export function getCapturedAmount(capture: any): number {
  const value = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
  const num = typeof value === 'string' ? parseFloat(value) : NaN;
  if (Number.isNaN(num)) {
    throw new PaypalAmountError('Impossible de lire le montant capturé PayPal', 502);
  }
  return round2(num);
}

/** Montant enregistré sur l'ordre PayPal à la création. */
export function getOrderAmount(capture: any): number {
  const value = capture?.purchase_units?.[0]?.amount?.value;
  const num = typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isNaN(num) ? 0 : round2(num);
}

export function getPaypalCaptureId(capture: any): string {
  return capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || capture?.id || '';
}

/**
 * Vérifie que la capture est COMPLETED et que son montant réel correspond
 * au montant attendu (tolérance ±0.01 EUR). Jette si divergence.
 */
export function assertCompleted(capture: any, expectedAmount: number): number {
  if (!capture || capture.status !== 'COMPLETED') {
    throw new PaypalAmountError("Paiement PayPal non confirmé (status '" + (capture?.status || 'inconnu') + "')", 409);
  }
  const captured = getCapturedAmount(capture);
  const orderAmount = getOrderAmount(capture);
  if (orderAmount > 0 && Math.abs(orderAmount - expectedAmount) > PAYPAL_AMOUNT_TOLERANCE) {
    throw new PaypalAmountError(
      `Montant PayPal de la commande (${orderAmount.toFixed(2)} EUR) différent du montant attendu (${expectedAmount.toFixed(2)} EUR). Transaction refusée.`,
      409
    );
  }
  if (Math.abs(captured - expectedAmount) > PAYPAL_AMOUNT_TOLERANCE) {
    throw new PaypalAmountError(
      `Montant PayPal capturé (${captured.toFixed(2)} EUR) différent du montant attendu (${expectedAmount.toFixed(2)} EUR). Transaction refusée.`,
      409
    );
  }
  return captured;
}

interface PromoInput {
  code?: string | null;
  docId?: string | null;
}

interface PromoResult {
  discount: number;
  code?: string;
  docId?: string;
}

/** Résout la remise promo côté serveur — jamais à partir du montant client. */
async function resolvePromo(base: number, promo?: PromoInput): Promise<PromoResult> {
  const code = promo?.code?.trim();
  const docId = promo?.docId?.trim();
  if (!code && !docId) return { discount: 0 };

  const { adminDb } = getFirebaseAdmin();

  let promoDoc: any = null;
  if (docId) {
    const snap = await adminDb.collection('promo_codes').doc(docId).get();
    if (snap.exists) promoDoc = { id: snap.id, data: snap.data() };
  } else if (code) {
    const snap = await adminDb
      .collection('promo_codes')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();
    if (!snap.empty) promoDoc = { id: snap.docs[0].id, data: snap.docs[0].data() };
  }

  if (!promoDoc) {
    throw new PaypalAmountError('Code promo introuvable', 404);
  }

  const data = promoDoc.data || {};
  if (data.active === false) {
    throw new PaypalAmountError('Ce code promo est désactivé');
  }
  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    throw new PaypalAmountError('Ce code promo a expiré');
  }
  if (data.maxUses > 0 && data.currentUses >= data.maxUses) {
    throw new PaypalAmountError("Ce code promo a atteint sa limite d'utilisations");
  }
  if (data.minPurchase > 0 && base < data.minPurchase) {
    throw new PaypalAmountError(`Panier minimum de ${data.minPurchase}€ requis pour ce code`);
  }

  const discount = data.type === 'percentage' ? round2(base * (data.value / 100)) : data.value || 0;

  return {
    discount,
    code: code || data.code || undefined,
    docId: promoDoc.id,
  };
}

/** Recalcule le coût de livraison côté serveur (identique à /api/boutique/delivery-cost). */
export async function resolveServerDeliveryCost(postcode: string, city: string, subtotal: number): Promise<number> {
  const { adminDb } = getFirebaseAdmin();

  const settingsDoc = await adminDb.collection('settings').doc('delivery').get();
  const defaults: DeliverySettings = {
    defaultFee: 0,
    isDefaultFeeEnabled: false,
    isFreeDeliveryEnabled: false,
    freeDeliveryThreshold: 0,
    deliveryFeeRules: [],
    isTotalFreeDeliveryEnabled: false,
    unconfiguredZoneMessage: '',
  };
  const settings: DeliverySettings = settingsDoc.exists
    ? { ...defaults, ...settingsDoc.data() }
    : defaults;

  let matchedCity: City | null = null;
  if (postcode || city) {
    const citiesQuery = adminDb.collection('cities');
    const snapshot = postcode
      ? await citiesQuery.where('postalCode', '==', postcode).limit(1).get()
      : await citiesQuery.where('name', '==', city).limit(1).get();
    if (!snapshot.empty) {
      matchedCity = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as City;
    }
  }

  const { cost } = computeDeliveryCostDetails(settings, {
    subtotal,
    zoneId: matchedCity?.zoneId ?? null,
    cityId: matchedCity?.id ?? null,
  });

  return round2(cost);
}

/**
 * Devis signé (collection `quotes`) : vérité = `priceSnapshot.total`.
 * Fallback legacy = `finalPrice` si le snapshot est absent.
 */
export async function resolveSignQuoteAmount(
  quoteId: string,
  opts?: { promoCode?: string | null; promoDocId?: string | null }
): Promise<ResolvedAmount> {
  const { adminDb } = getFirebaseAdmin();
  const doc = await adminDb.collection('quotes').doc(quoteId).get();
  if (!doc.exists) {
    throw new PaypalAmountError('Devis signé introuvable', 404);
  }
  const q = doc.data()!;
  const snapshot: PriceSnapshot | null = q.priceSnapshot || null;

  let base: number;
  if (snapshot && typeof snapshot.total === 'number') {
    base = snapshot.total;
  } else if (typeof q.finalPrice === 'number') {
    base = q.finalPrice;
  } else if (typeof q.totalQuote === 'number') {
    base = q.totalQuote;
  } else {
    throw new PaypalAmountError('Aucun montant de référence sur ce devis');
  }

  const promo = await resolvePromo(base, { code: opts?.promoCode, docId: opts?.promoDocId });
  const totalAfterDiscount = Math.max(0, round2(base - promo.discount));

  return {
    amount: totalAfterDiscount,
    subtotal: base,
    discount: promo.discount,
    totalAfterDiscount,
    deliveryCost: 0,
    vat: 0,
    source: snapshot ? 'price_snapshot' : 'final_price',
    priceSnapshot: snapshot,
    promoCode: promo.code,
    promoId: promo.docId,
    quoteId,
    quote: q,
  };
}

/**
 * Offre admin (collection `quote_requests`) : vérité = `finalPrice`.
 * La collection ne porte pas de snapshot à la demande ; le montant n'est
 * utilisable qu'après génération de l'offre (statut `accepted`).
 */
export async function resolveOfferAmount(
  quoteRequestId: string,
  opts?: { promoCode?: string | null; promoDocId?: string | null }
): Promise<ResolvedAmount> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection('quote_requests').doc(quoteRequestId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new PaypalAmountError('Devis introuvable', 404);
  }
  const quote = doc.data()!;
  if (quote.status !== 'accepted') {
    throw new PaypalAmountError('Ce devis n\'est pas en attente de paiement');
  }

  const finalPrice = typeof quote.finalPrice === 'number' ? quote.finalPrice : NaN;
  if (!Number.isFinite(finalPrice)) {
    throw new PaypalAmountError('Montant du devis indisponible (aucun prix définitif)');
  }

  const promo = await resolvePromo(finalPrice, { code: opts?.promoCode, docId: opts?.promoDocId });
  const totalAfterDiscount = Math.max(0, round2(finalPrice - promo.discount));

  return {
    amount: totalAfterDiscount,
    subtotal: finalPrice,
    discount: promo.discount,
    totalAfterDiscount,
    deliveryCost: 0,
    vat: 0,
    source: 'final_price',
    promoCode: promo.code,
    promoId: promo.docId,
    quoteRequestId,
    quote,
  };
}

/**
 * Panier boutique : reconstruction serveur depuis `boutique_products`
 * (fallback `products`). Le prix de chaque ligne est dérivé du document
 * produit (variante par référence/nom, sinon prix de base), jamais du
 * panier envoyé par le client.
 */
export async function resolveBoutiqueAmount(input: BoutiqueAmountInput): Promise<ResolvedAmount> {
  const { adminDb } = getFirebaseAdmin();

  if (!input.items || input.items.length === 0) {
    throw new PaypalAmountError('Panier vide');
  }

  let subtotal = 0;
  const items: ResolvedItem[] = [];

  for (const item of input.items) {
    if (!item.productId) {
      throw new PaypalAmountError('Produit sans identifiant');
    }
    const qty = Math.floor(item.quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      throw new PaypalAmountError('Quantité invalide');
    }

    let productSnap = await adminDb.collection('boutique_products').doc(item.productId).get();
    if (!productSnap.exists) {
      productSnap = await adminDb.collection('products').doc(item.productId).get();
    }
    if (!productSnap.exists) {
      throw new PaypalAmountError(`Produit introuvable (${item.productId})`, 404);
    }

    const data = productSnap.data() || {};

    // Garde serveur : une vente directe est refusée si la quantité en stock
    // est <= 0 (statut piloté uniquement par stockQuantity). Survole les
    // sur-commandes et locations (stock de vente non applicable).
    if (item.type !== 'rental') {
      const blockReason = getSaleBlockReason(data);
      if (blockReason) {
        throw new PaypalAmountError(`${blockReason} (${item.productId})`, 409);
      }
    }

    let baseUnit: number;
    if (item.variantReference || item.variantName) {
      const variants: any[] = Array.isArray(data.variants) ? data.variants : [];
      const variant = variants.find(
        (v) =>
          (item.variantReference && v.reference === item.variantReference) ||
          (item.variantName && v.name === item.variantName)
      );
      baseUnit =
        variant && typeof variant.price === 'number'
          ? variant.price
          : resolveBoutiqueBasePrice(data) ?? NaN;
    } else {
      baseUnit = resolveBoutiqueBasePrice(data) ?? NaN;
    }

    if (!Number.isFinite(baseUnit)) {
      throw new PaypalAmountError(`Prix invalide pour ${item.productId}`);
    }

    // Location : la location se facture à la journée (same formula as BoutiqueRentalFlow).
    let serverPrice: number;
    if (item.type === 'rental') {
      const days = computeRentalDays(item.rentalStartDate, item.rentalEndDate);
      if (days < 1) {
        throw new PaypalAmountError(`Période de location invalide pour ${item.productId}`);
      }
      serverPrice = round2(baseUnit * days);
    } else {
      serverPrice = baseUnit;
    }

    const lineTotal = round2(serverPrice * qty);
    subtotal += lineTotal;
    items.push({
      key: `${item.productId}|${item.type}|${item.variantReference || item.variantName || ''}`,
      productId: item.productId,
      type: item.type,
      quantity: qty,
      serverPrice,
      lineTotal,
    });
  }

  subtotal = round2(subtotal);
  const promo = await resolvePromo(subtotal, { code: input.promoCode, docId: input.promoDocId });
  const totalAfterDiscount = Math.max(0, round2(subtotal - promo.discount));

  const deliveryCost = await resolveServerDeliveryCost(
    input.delivery?.postcode || '',
    input.delivery?.city || '',
    subtotal
  );

  const calc = calculateCheckout({
    subtotal,
    totalAfterDiscount,
    deliveryCost,
    profileType: input.clientType || null,
    country: input.delivery?.country || 'FR',
    vatValidated: input.vatValidated === true,
  });

  const amount = round2(calc.total);

  return {
    amount,
    subtotal,
    discount: promo.discount,
    totalAfterDiscount,
    deliveryCost,
    vat: calc.vat,
    source: 'cart_server',
    promoCode: promo.code,
    promoId: promo.docId,
    items,
  };
}