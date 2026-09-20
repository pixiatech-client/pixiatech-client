import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}
type QuoteStatus = 'pending' | 'processed' | 'delivered' | 'trashed' | 'archive';

const STATUS_TRANSLATIONS: Record<string, { fr: string; en: string }> = {
  pending: { fr: 'En attente', en: 'Pending' },
  processed: { fr: 'Traité', en: 'Processed' },
  delivered: { fr: 'Livraison', en: 'Delivery' },
  trashed: { fr: 'Corbeille', en: 'Trash' },
  archive: { fr: 'Archivé', en: 'Archived' },
  archived: { fr: 'Archivé', en: 'Archived' },
  returned: { fr: 'Retourné', en: 'Returned' },
  supplier: { fr: 'Fournisseur', en: 'Supplier' },
  rented: { fr: 'Loué', en: 'Rented' },
  in_progress: { fr: 'En cours', en: 'In progress' },
  sent: { fr: 'Envoyé', en: 'Sent' },
  sale: { fr: 'Vente', en: 'Sale' },
  rental: { fr: 'Location', en: 'Rental' },
  completed: { fr: 'Terminé', en: 'Completed' },
  generated: { fr: 'Générée', en: 'Generated' },
  draft: { fr: 'Brouillon', en: 'Draft' },
  failed: { fr: 'Échouée', en: 'Failed' },
};

const STATUS_REVERSE_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(STATUS_TRANSLATIONS)) {
  STATUS_REVERSE_MAP[value.fr] = key;
}

export const translateStatus = (status: string, locale: string = 'en'): string => {
  const translationKey = STATUS_REVERSE_MAP[status] || status;
  const normalized = STATUS_TRANSLATIONS[translationKey];
  if (!normalized) return status;
  return locale === 'en' ? normalized.en : normalized.fr;
};

const DESC_PATTERNS: Record<string, [RegExp, string][]> = {
  estimation: [[/has been marked as (\w+)/, 'a été marqué comme $1']],
  delivery: [[/has been marked as in delivery/, 'a été marqué comme en livraison']],
  estimation_sent: [[/has been submitted to you on/, 'vous a été soumis le']],
  estimation_rejected: [[/The supplier has rejected quote/, 'Le fournisseur a rejeté le devis']],
  order_created: [[/An order has been created for quote/, 'Une commande a été créée pour le devis']],
  estimation_archived: [[/has been moved to trash by/, 'a été déplacé vers la corbeille par']],
  estimation_unarchived: [[/Your estimate for (.+) has been unarchived/, 'Votre devis pour $1 a été désarchivé']],
};

// Maps raw Firestore reason codes to human-readable French labels.
// Covers all codes used in dispute creation & reply routes.
const DISPUTE_REASON_LABELS: Record<string, string> = {
  // Standard codes from the client form
  delay: 'Retard de livraison',
  damaged: 'Produit endommagé',
  missing: 'Produit manquant',
  wrong: 'Produit différent de la commande',
  quality: 'Problème de qualité',
  invoice: 'Problème de facturation',
  other: 'Autre demande',
  // Legacy / alternate codes that can appear in Firestore
  missing_item: 'Article manquant',
  produit_non_recu: 'Produit non reçu',
  produit_endommage: 'Produit endommagé',
  produit_non_conforme: 'Produit non conforme',
  livraison_tardive: 'Livraison tardive',
  probleme_paiement: 'Problème de paiement',
  service_client: 'Service client',
  autre: 'Autre demande',
};

/**
 * Replaces raw reason codes (e.g. "missing_item") embedded inside a
 * notification description string with their French label.
 * Called by NotificationBell before rendering each notification.
 */
function translateReasonCodes(desc: string): string {
  return desc.replace(
    /:\s*([a-z][a-z0-9_]*)\s*$/i,
    (_, code) => {
      const label = DISPUTE_REASON_LABELS[code.toLowerCase()];
      return label ? ` : ${label}` : ` : ${code}`;
    }
  );
}

export function translateNotificationDesc(type: string, desc: string): string {
  // First apply type-specific pattern translations
  const rules = DESC_PATTERNS[type];
  let result = desc;
  if (rules) {
    for (const [regex, replacement] of rules) {
      if (regex.test(result)) {
        result = result.replace(regex, replacement);
        break;
      }
    }
  }
  // Then always translate any trailing raw reason code (covers message & order_created types)
  return translateReasonCodes(result);
}