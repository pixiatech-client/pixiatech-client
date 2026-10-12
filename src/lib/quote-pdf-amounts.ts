import type { QuoteRequest } from '@/lib/types';
import { applyTaxMode, isTaxDisplayInclusive, roundMoney, type TaxDisplayConfig } from '@/lib/pricing-engine';

// ─────────────────────────────────────────────────────────────────────────────
// MONTANTS AFFICHÉS PAR LE PDF DE DEVIS — SOURCE DE VÉRITÉ UNIQUE
//
// Le PDF (QuotePDF) et la page de résultat doivent afficher EXACTEMENT les mêmes
// montants. Toute la logique de base fiscale (HT/TTC) est centralisée ici et
// partagée avec la page (applyTaxMode), afin qu'aucune divergence ne puisse
// réapparaître.
//
// Contrats de données (confirmés par audit) :
//   - PriceSnapshot.productsSubtotal / delivery.cost / installation.cost = HT ;
//   - PriceSnapshot.total = total canonique DÉJÀ dans la base d'affichage
//     (TTC si tax.mode === 'ttc', HT sinon) ;
//   - request.products[].lineTotal = HT (tous les créateurs de devis) ;
//   - chemin legacy sans snapshot : installationCost / deliveryCost = HT,
//     `totalQuote` est AMBIGU (HT ou TTC selon le créateur) → jamais utilisé
//     pour reconstruire le sous-total produits.
// ─────────────────────────────────────────────────────────────────────────────

export interface QuotePdfAmounts {
  /** Configuration TVA résolue (snapshot prioritaire, sinon champs legacy). */
  tax: Required<TaxDisplayConfig>;
  /** Vrai si les montants affichés sont TTC (TVA activée + mode 'ttc'). */
  isTtc: boolean;
  /** Sous-total produits, dans la base d'affichage. */
  subtotal: number;
  /** Installation, dans la base d'affichage. */
  installation: number;
  /** Livraison, dans la base d'affichage. */
  delivery: number;
  /** Total, dans la base d'affichage. */
  total: number;
}

function normalizeMode(mode: unknown): 'ht' | 'ttc' {
  return mode === 'ttc' ? 'ttc' : 'ht';
}

/** Résout la configuration TVA applicable : le snapshot prime, sinon legacy. */
export function resolveQuoteTaxConfig(request: QuoteRequest): Required<TaxDisplayConfig> {
  const snapshot = request.priceSnapshot;
  if (snapshot) {
    const tax = snapshot.tax || ({} as TaxDisplayConfig);
    return {
      enabled: !!tax.enabled,
      rate: Number(tax.rate) || 0,
      mode: normalizeMode(tax.mode),
    };
  }
  const rate = Number(request.taxRate) || 0;
  return {
    enabled: rate > 0,
    rate,
    mode: normalizeMode(request.taxMode),
  };
}

/**
 * Calcule les montants du récapitulatif PDF dans une base fiscale unique.
 * Les composantes HT sont converties via `applyTaxMode` ; le total utilise le
 * total canonique du snapshot quand il existe.
 */
export function computeQuotePdfAmounts(request: QuoteRequest): QuotePdfAmounts {
  const products = request.products || [];
  const snapshot = request.priceSnapshot;
  const tax = resolveQuoteTaxConfig(request);
  const isTtc = isTaxDisplayInclusive(tax);

  if (snapshot) {
    return {
      tax,
      isTtc,
      subtotal: applyTaxMode(snapshot.productsSubtotal, tax),
      installation: applyTaxMode(snapshot.installation?.cost ?? 0, tax),
      delivery: applyTaxMode(snapshot.delivery?.cost ?? 0, tax),
      // Total canonique : déjà dans la base d'affichage (TTC si mode 'ttc').
      total: roundMoney(snapshot.total ?? 0),
    };
  }

  // Chemin legacy SANS snapshot : on reconstruit le sous-total à partir des
  // lignes produits HT (jamais de `request.totalQuote`, dont la base est
  // ambiguë) puis on applique la même conversion que la page.
  const subtotalHt = roundMoney(products.reduce((sum, p) => sum + (p.lineTotal || 0), 0));
  const installationHt = roundMoney(request.installationCost || 0);
  const deliveryHt = roundMoney(request.deliveryCost || 0);
  const totalHt = roundMoney(subtotalHt + installationHt + deliveryHt);

  return {
    tax,
    isTtc,
    subtotal: applyTaxMode(subtotalHt, tax),
    installation: applyTaxMode(installationHt, tax),
    delivery: applyTaxMode(deliveryHt, tax),
    total: applyTaxMode(totalHt, tax),
  };
}

/** Montant d'une ligne produit (lineTotal HT) dans la base d'affichage. */
export function computeQuotePdfLineAmount(lineTotalHt: number, tax: TaxDisplayConfig): number {
  return applyTaxMode(lineTotalHt, tax);
}
