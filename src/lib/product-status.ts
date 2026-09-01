/**
 * Règle métier ABSOLUE : le statut d'un produit ne dépend QUE de la quantité
 * réelle en stock. Aucune action utilisateur (favoris, panier, fiche produit,
 * prix, nom, images...) ne doit recalculer ou écrire ce statut.
 */

export type ProductStatus = 'sale' | 'out_of_stock';

/**
 * Note : ce module est volontairement sans import (aucune dépendance),
 * pour être partageable entre client, serveur et tests unitaires.
 */

export function getProductStatus(stockQuantity: number): ProductStatus {
  return stockQuantity > 0 ? 'sale' : 'out_of_stock';
}

/**
 * Normalise une valeur de stock en nombre entier >= 0.
 * Fail-closed : undefined / null / NaN / texte invalide -> 0 (rupture).
 */
export function normalizeStockQuantity(value: unknown): number {
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string') {
    n = Number(value);
  } else {
    n = NaN;
  }
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export function isProductInStock(value: unknown): boolean {
  return getProductStatus(normalizeStockQuantity(value)) === 'sale';
}

export interface StockableProduct {
  stock?: unknown;
  availableFor?: unknown;
}

/**
 * True uniquement si le produit relève de la vente directe (stockQuantity <= 0).
 * Ne s'applique pas sur commande / locations / demandes de devis,
 * qui n'utilisent pas le champ stock de vente.
 */
export function isProductOutOfStockForSale(product: StockableProduct): boolean {
  const avail: string[] = Array.isArray(product.availableFor)
    ? product.availableFor.map((m) => String(m).toLowerCase().replace(/[\s_-]/g, ''))
    : [];
  if (avail.includes('surcommande') || avail.includes('quoterequest') || avail.includes('quoteonly')) {
    return false;
  }
  if (avail.includes('rental') && !avail.includes('sale')) {
    return false;
  }
  return !isProductInStock(product.stock);
}

/**
 * True si le produit est réservé à la location (availableFor contient 'rental'
 * et pas 'sale') : il ne peut PAS être acheté directement, un passage par le
 * formulaire de location (dates, contrat, vérification) est obligatoire.
 */
export function isRentalOnlyProduct(product: StockableProduct): boolean {
  const avail: string[] = Array.isArray(product.availableFor)
    ? product.availableFor.map((m) => String(m).toLowerCase().replace(/[\s_-]/g, ''))
    : [];
  return avail.includes('rental') && !avail.includes('sale');
}

/** Message d'erreur serveur si la vente directe du produit est bloquée (ou ''). */
export function getSaleBlockReason(product: StockableProduct): string {
  return isProductOutOfStockForSale(product) ? 'Produit en rupture de stock' : '';
}