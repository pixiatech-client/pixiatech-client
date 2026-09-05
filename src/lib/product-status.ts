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

export interface ListableProduct extends StockableProduct {
  variants?: Array<{ active?: unknown; stock?: unknown }>;
}

/**
 * Disponibilité globale d'un produit pour la LISTE boutique.
 *
 * - Sur commande / devis / location uniquement : jamais considéré en rupture ici
 *   (le stock de vente ne s'applique pas à ces modes).
 * - Produit AVEC variantes : le stock global `product.stock` est totalement
 *   ignoré. Le produit est disponible dès qu'AU MOINS UNE variante active a un
 *   stock effectif > 0 (évalué via `effectiveVariantStock`, i.e. stock de la
 *   variante sinon repli sur le stock global du produit pour les données legacy).
 *   Les variantes inactives sont exclues.
 * - Produit SANS variantes : comportement historique basé sur `product.stock`.
 */
export function isProductAvailable(product: ListableProduct): boolean {
  const avail: string[] = Array.isArray(product.availableFor)
    ? product.availableFor.map((m) => String(m).toLowerCase().replace(/[\s_-]/g, ''))
    : [];
  if (avail.includes('surcommande') || avail.includes('quoterequest') || avail.includes('quoteonly')) {
    return true;
  }
  if (avail.includes('rental') && !avail.includes('sale')) {
    return true;
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((v) => v?.active !== false && v?.active !== undefined);
  if (activeVariants.length > 0) {
    return activeVariants.some((v) => effectiveVariantStock(v, product.stock) > 0);
  }

  return isProductInStock(product.stock);
}

/**
 * Stock effectif d'une variante.
 * Règle : si la variante déclare explicitement son propre stock (champ `stock`
 * défini ET non vide), c'est lui qui fait foi — y compris `0` (rupture).
 * Sinon (données legacy sans stock par variante), repli sur le stock global du
 * produit. Si aucun des deux n'est renseigné, le résultat est 0 (fail-closed).
 */
export function effectiveVariantStock(
  variant: { stock?: unknown } | null | undefined,
  productStock: unknown
): number {
  const raw = variant?.stock;
  if (raw !== undefined && raw !== null && raw !== '') {
    return normalizeStockQuantity(raw);
  }
  return normalizeStockQuantity(productStock);
}

/**
 * Même règle que `isProductOutOfStockForSale` mais appliquée au stock D'UNE
 * VARIANTE : un produit sur commande / devis, ou réservé à la location, n'est
 * jamais considéré en rupture via le stock de vente de ses variantes.
 */
export function isVariantOutOfStockForSale(
  product: StockableProduct,
  variantStockValue: unknown
): boolean {
  const avail: string[] = Array.isArray(product.availableFor)
    ? product.availableFor.map((m) => String(m).toLowerCase().replace(/[\s_-]/g, ''))
    : [];
  if (avail.includes('surcommande') || avail.includes('quoterequest') || avail.includes('quoteonly')) {
    return false;
  }
  if (avail.includes('rental') && !avail.includes('sale')) {
    return false;
  }
  return !isProductInStock(variantStockValue);
}

/** Message d'erreur serveur si la vente directe de la variante est bloquée (ou ''). */
export function getVariantSaleBlockReason(
  product: StockableProduct,
  variantStockValue: unknown
): string {
  return isVariantOutOfStockForSale(product, variantStockValue) ? 'Produit en rupture de stock' : '';
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

export interface AvailabilityProduct extends StockableProduct {
  quoteOnly?: unknown;
}

/**
 * True si le produit est "sur commande" / sur devis (pas de vente directe) :
 * le bouton n'ajoute rien au panier, il ouvre la fiche produit (Plus d'infos).
 */
export function isQuoteOnlyProduct(product: AvailabilityProduct): boolean {
  const avail: string[] = Array.isArray(product.availableFor)
    ? product.availableFor.map((m) => String(m).toLowerCase().replace(/[\s_-]/g, ''))
    : [];
  if (avail.includes('surcommande') || avail.includes('quoterequest') || avail.includes('quoteonly')) {
    return true;
  }
  return product.quoteOnly === true;
}

/** Message d'erreur serveur si la vente directe du produit est bloquée (ou ''). */
export function getSaleBlockReason(product: StockableProduct): string {
  return isProductOutOfStockForSale(product) ? 'Produit en rupture de stock' : '';
}