import { getFirebaseAdmin } from './firebase-admin';
import { PaypalAmountError } from './paypal-amount';
import { effectiveVariantStock, normalizeStockQuantity } from './product-status';
import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore';

export interface StockReserveItem {
  productId: string;
  type: 'purchase' | 'rental';
  quantity: number;
  /** Variante ciblée : si présente (vente), le stock décrémenté est celui de la
   *  variante, jamais le stock global du produit. */
  variantReference?: string;
  variantName?: string;
}

export interface StockReservationLine {
  productId: string;
  type: 'purchase' | 'rental';
  ref: DocumentReference;
  field: 'stock' | 'rentalStock';
  /** Chemin Firestore réellement écrit : 'stock', 'rentalStock' ou 'variants.<i>.stock'. */
  path: string;
  /** Identifiant de la variante réservée (référence préférée, sinon nom). */
  variantKey?: string;
  quantity: number;
  before: number;
  after: number;
}

export type StockReservation = StockReservationLine[];

function hasDefined(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Détermine le champ de stock qui porte la disponibilité d'un produit
 * (même règle que la résolution du panier : rentalStock pour la location,
 * sinon stock). Retourne le champ + la quantité normalisée, ou `null` si
 * aucun stock n'est déclaré.
 */
function stockFieldFor(data: any, type: 'purchase' | 'rental'): { field: 'stock' | 'rentalStock'; qty: number } | null {
  const hasRentalField = type === 'rental' && hasDefined(data.rentalStock);
  if (hasRentalField) {
    return { field: 'rentalStock', qty: normalizeStockQuantity(data.rentalStock) };
  }
  if (hasDefined(data.stock)) {
    return { field: 'stock', qty: normalizeStockQuantity(data.stock) };
  }
  return null;
}

/** Résout la référence du doc produit (boutique_products, repli products). */
async function resolveProductRef(tx: Transaction, adminDb: Firestore, productId: string) {
  const boutiqueRef = adminDb.collection('boutique_products').doc(productId);
  const legacyRef = adminDb.collection('products').doc(productId);

  let snap = await tx.get(boutiqueRef);
  const ref = snap.exists ? boutiqueRef : legacyRef;
  if (!snap.exists) {
    snap = await tx.get(legacyRef);
  }
  if (!snap.exists) {
    throw new PaypalAmountError(`Produit introuvable (${productId})`, 404);
  }
  return { ref, data: snap.data() };
}

/**
 * Si la ligne cible une variante (vente), résout le chemin Firestore
 * 'variants.<i>.stock' vers la variante trouvée (référence préférée, sinon nom).
 * Retourne null si aucune variante n'est demandée ou trouvée (on retombe alors
 * sur le stock global du produit — comportement historique).
 */
function resolveVariantPath(
  item: StockReserveItem,
  variants: any[]
): { index: number; path: string; variantKey: string } | null {
  if (item.type !== 'purchase') return null;
  if (!item.variantReference && !item.variantName) return null;
  const idx = variants.findIndex(
    (v) =>
      (item.variantReference && v?.reference === item.variantReference) ||
      (item.variantName && v?.name === item.variantName)
  );
  if (idx < 0) return null;
  return {
    index: idx,
    path: `variants.${idx}.stock`,
    variantKey: item.variantReference || item.variantName || '',
  };
}

/**
 * Réserve (décrémente) le stock de chaque ligne dans UNE transaction Firestore.
 *
 * - Lecture du stock DANS la transaction + écriture conditionnelle : deux
 *   captures concurrentes sur les dernières unités se neutralisent, l'une
 *   des deux échoue (overlapping read/write) → pas de survente.
 * - Vente : si `stockQty > 0` on décrémente ; un stock nul est déjà filtré en
 *   amont (rupture sauf "sur commande") et ne consomme rien.
 * - Location : `allowZeroStock` à false → un stock nul/absent refuse la
 *   location (fail-closed). Pour les devis (sur commande), `allowZeroStock:
 *   true` laisse passer sans décrémenter.
 *
 * En cas d'échec, toute la transaction est annulée : rien n'est écrit.
 */
export async function reserveBoutiqueStock(
  items: StockReserveItem[],
  opts?: { allowZeroStock?: boolean }
): Promise<StockReservation> {
  const allowZeroStock = opts?.allowZeroStock === true;
  if (!items || items.length === 0) return [];

  const { adminDb } = getFirebaseAdmin();
  const reservation: StockReservation = [];

  await adminDb.runTransaction(async (tx) => {
    for (const item of items) {
      const qty = Math.floor(item.quantity);
      if (!Number.isFinite(qty) || qty < 1) {
        throw new PaypalAmountError('Quantité invalide');
      }

      const { ref, data } = await resolveProductRef(tx, adminDb, item.productId);

      // Variante ciblée (vente) : le stock décrémenté est celui de la variante.
      // Rule : le champ stock de la variante fait foi quand il est défini (y
      // compris 0 → refusé en amont par la garde de vente) ; sinon repli sur le
      // stock global du produit (données legacy).
      const variantInfo = resolveVariantPath(item, Array.isArray(data.variants) ? data.variants : []);
      let stockQty: number;
      let field: 'stock' | 'rentalStock' | undefined;
      let path: string | undefined;
      let variantKey: string | undefined;

      if (variantInfo) {
        const variant = (data.variants as any[])[variantInfo.index];
        stockQty = effectiveVariantStock(variant, data.stock);
        field = 'stock';
        path = variantInfo.path;
        variantKey = variantInfo.variantKey;
      } else {
        const stockInfo = stockFieldFor(data, item.type);
        stockQty = stockInfo?.qty ?? 0;
        field = stockInfo?.field;
        path = field;
      }

      if (item.type === 'rental' && stockQty <= 0 && !allowZeroStock) {
        throw new PaypalAmountError(
          'Produit indisponible à la location (aucun stock disponible).',
          409
        );
      }
      if (stockQty > 0 && qty > stockQty) {
        throw new PaypalAmountError(
          `Quantité maximale disponible atteinte. Vous ne pouvez pas dépasser le stock disponible (${stockQty}) pour le produit ${item.productId}.`,
          409
        );
      }
      if (path && stockQty > 0) {
        const before = stockQty;
        const after = Math.max(0, stockQty - qty);
        tx.update(ref, { [path]: after });
        reservation.push({ productId: item.productId, type: item.type, ref, field: field ?? 'stock', path, variantKey, quantity: qty, before, after });
      }
    }
  });

  return reservation;
}

/**
 * Transaction compensatrice : remet le stock réservé en place. À appeler si la
 * capture PayPal échoue APRÈS une réservation réussie, pour ne jamais laisser
 * de stock consommé sans paiement.
 */
export async function releaseBoutiqueStock(reservation: StockReservation): Promise<void> {
  if (!reservation || reservation.length === 0) return;

  const { adminDb } = getFirebaseAdmin();
  await adminDb.runTransaction(async (tx) => {
    for (const line of reservation) {
      tx.update(line.ref, { [line.path]: line.after + line.quantity });
    }
  });
}

/**
 * Idempotence : un ordre PayPal déjà traité (rejeu client, double onApprove,
 * retry réseau) ne doit ni recapturer, ni re-réserver, ni recréer de commandes.
 */
export async function paypalOrderAlreadyProcessed(adminDb: Firestore, orderId: string): Promise<boolean> {
  const [saleSnap, rentalSnap] = await Promise.all([
    adminDb.collection('sale_orders').where('paypalOrderId', '==', orderId).limit(1).get(),
    adminDb.collection('rental_orders').where('paypalOrderId', '==', orderId).limit(1).get(),
  ]);
  return !saleSnap.empty || !rentalSnap.empty;
}

/**
 * Idempotence post-capture : le captureId PayPal est unique par capture.
 * Si une commande enregistre déjà ce captureId, la requête concurrente
 * (double onApprove, retry réseau, capture idempotente) ne doit pas recréer.
 */
export async function paypalCaptureAlreadyUsed(adminDb: Firestore, captureId: string): Promise<boolean> {
  const [saleSnap, rentalSnap] = await Promise.all([
    adminDb.collection('sale_orders').where('paypalCaptureId', '==', captureId).limit(1).get(),
    adminDb.collection('rental_orders').where('paypalCaptureId', '==', captureId).limit(1).get(),
  ]);
  return !saleSnap.empty || !rentalSnap.empty;
}