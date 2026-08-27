import { PRICING_ENGINE_VERSION, computeDeposit, computePaymentSchedule, roundMoney } from '@/lib/pricing-engine';
import type { DeliveryCostDetails } from '@/lib/pricing-engine';
import type {
  DeliveryCostReason,
  PriceSnapshot,
  PriceSnapshotDestination,
} from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// PRICE SNAPSHOT — CONSTRUCTEUR UNIQUE DU SNAPSHOT DE PRIX
//
// Règle ABSOLUE : le snapshot est créé APRÈS le calcul du moteur partagé,
// jamais avant et jamais en parallèle. Il ne recalcule RIEN : il ne fait que
// figer, normaliser et versionner le résultat des fonctions du moteur
// (computeDeliveryCostDetails, computeLaborCost, computeProductLineTotal).
//
// Une fois persisté (devis validé/signé, commande créée), il est IMMUABLE :
// tout consommateur (récap, contrat, QuotePDF, PayPal, processQuoteSnapshot)
// lit snapshot.total / snapshot.delivery.cost / etc., sans jamais refaire de
// calcul. Toute évolution des tarifs admin produit un NOUVEAU snapshot/version.
//
// Fonction pure, utilisable côté client ET côté serveur (aucune dépendance
// Firestore / i18n).
// ─────────────────────────────────────────────────────────────────────────────

export const PRICE_SNAPSHOT_SCHEMA_VERSION = 1;

export interface BuildPriceSnapshotInput {
  transactionType: 'sale' | 'rental';
  // Résultats DÉJÀ calculés par le moteur partagé :
  productsSubtotal: number;               // HT produits × quantité
  deliveryDetails: DeliveryCostDetails;   // sortie de computeDeliveryCostDetails
  labor: { installationCost: number; techniciansRequired: number }; // sortie de computeLaborCost
  // Choix métier utilisateur (jamais hardcodés) :
  includeDelivery: boolean;
  includeInstallation: boolean;
  // TVA — source unique fournie par l'appelant (settings estimationFlow) :
  tax: { enabled: boolean; rate: number; mode: 'ht' | 'ttc' };
  // Destination résolue (résolveur centralisé) :
  destination: PriceSnapshotDestination | null;
}

/**
 * Construit le PriceSnapshot à partir des résultats du moteur.
 * Todas les valeurs monétaires sont normalisées (roundMoney).
 * Le snapshot est versionné (engineVersion + schema version) et horodaté.
 */
export function buildPriceSnapshot(input: BuildPriceSnapshotInput): PriceSnapshot {
  const {
    transactionType,
    productsSubtotal,
    deliveryDetails,
    labor,
    includeDelivery,
    includeInstallation,
    tax,
    destination,
  } = input;

  const products = roundMoney(productsSubtotal);

  const deliveryCost = includeDelivery ? roundMoney(deliveryDetails.cost) : 0;
  const deliveryReason = includeDelivery ? deliveryDetails.reason : 'unconfigured';

  const installationCost = includeInstallation ? roundMoney(labor.installationCost) : 0;
  const techniciansRequired = includeInstallation ? labor.techniciansRequired : 0;

  const subtotal = roundMoney(products + deliveryCost + installationCost);

  const taxRate = tax.enabled ? tax.rate : 0;
  const taxAmount = tax.enabled ? roundMoney(subtotal * taxRate / 100) : 0;
  const total = roundMoney(tax.enabled && tax.mode === 'ttc' ? subtotal + taxAmount : subtotal);

  const deposit = computeDeposit(total, transactionType);
  const schedule = computePaymentSchedule(total);

  return {
    version: PRICE_SNAPSHOT_SCHEMA_VERSION,
    engineVersion: PRICING_ENGINE_VERSION,
    calculatedAt: new Date().toISOString(),
    currency: 'EUR',
    transactionType,
    destination,
    productsSubtotal: products,
    delivery: {
      included: includeDelivery,
      cost: deliveryCost,
      reason: deliveryReason,
      label: deliveryReasonLabel(deliveryReason),
      destination,
    },
    installation: {
      included: includeInstallation,
      cost: installationCost,
      techniciansRequired,
    },
    tax: {
      enabled: tax.enabled,
      rate: taxRate,
      amount: taxAmount,
      mode: tax.mode,
    },
    subtotal,
    total,
    deposit,
    paymentSchedule: [
      { label: 'firstPayment', amount: schedule.firstPayment },
      { label: 'remainingPayment', amount: schedule.remainingPayment },
    ],
  };
}

function deliveryReasonLabel(reason: DeliveryCostReason): string {
  switch (reason) {
    case 'total-free': return 'delivery.totalFree';
    case 'threshold-free': return 'delivery.thresholdFree';
    case 'rule': return 'delivery.rule';
    case 'default': return 'delivery.default';
    default: return 'delivery.unconfigured';
  }
}