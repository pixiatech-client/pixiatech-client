// Helpers partagés (route API + UI client) pour le portail client.
// Ce module est pur : aucune importation serveur - il peut être importé
// depuis des composants client comme depuis les route handlers.

export type ClientOrderKind = 'sale' | 'rental';

export const SALE_NUMBER_PREFIX = 'PX';
export const RENTAL_NUMBER_PREFIX = 'RL';

export const DISPUTE_REASON_LABELS: Record<string, string> = {
  delay: 'Retard de livraison',
  damaged: 'Produit endommagé',
  missing: 'Produit manquant',
  wrong: 'Produit différent de la commande',
  quality: 'Problème de qualité',
  invoice: 'Problème de facturation',
  other: 'Autre demande',
};

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  pending: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  generated: 'GÉNÉRÉE',
  sent: 'ENVOYÉE',
  failed: 'ÉCHEC ENVOI',
  pending: 'EN ATTENTE',
  in_progress: 'EN COURS',
  completed: 'FACTURE DISPONIBLE',
  archived: 'ARCHIVÉE',
};

export interface OrderVisualStatus {
  key: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  label: string;
}

export function saleOrderStatus(status: string, hasTracking = false): OrderVisualStatus {
  if (status === 'archive') return { key: 'delivered', label: 'Livrée' };
  if (status === 'corbeille') return { key: 'cancelled', label: 'Annulée' };
  if (hasTracking) return { key: 'in_transit', label: "En cours d'acheminement" };
  return { key: 'processing', label: 'En préparation' };
}

export function rentalOrderStatus(status: string): OrderVisualStatus {
  switch (status) {
    case 'completed':
      return { key: 'delivered', label: 'Livrée' };
    case 'shipped':
      return { key: 'in_transit', label: "En cours d'acheminement" };
    case 'cancelled':
    case 'corbeille':
      return { key: 'cancelled', label: 'Annulée' };
    case 'validated':
      return { key: 'processing', label: 'Validation contractuelle' };
    default:
      return { key: 'processing', label: 'En attente de validation' };
  }
}

export function computeVatRate(vat: number, base: number): number {
  if (!isFinite(base) || base <= 0) return 0;
  if (isFinite(vat) && vat > 0) return Math.round((vat / base) * 1000) / 1000;
  return 0;
}

export function toIsoDate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function formatOrderNumber(kind: ClientOrderKind, id: string, dateValue?: unknown): string {
  const prefix = kind === 'sale' ? SALE_NUMBER_PREFIX : RENTAL_NUMBER_PREFIX;
  const iso = toIsoDate(dateValue);
  const year = iso ? iso.slice(0, 4) : String(new Date().getFullYear());
  const seqRaw = id ? id.replace(/[^0-9a-z]/gi, '') : '';
  const seq = String((parseInt(seqRaw.slice(-4), 36) || 1) % 100000).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
}

export function getReasonLabel(reason: string): string {
  return DISPUTE_REASON_LABELS[reason] || reason || 'Autre demande';
}

export function getDisputeStatusLabel(status: string): string {
  return DISPUTE_STATUS_LABELS[status] || 'Ouvert';
}

export function getInvoiceStatusLabel(status: string): string {
  return INVOICE_STATUS_LABELS[status] || status || '';
}

export function isDisputeOpen(status: string): boolean {
  return status === 'open' || status === 'in_progress' || status === 'pending';
}