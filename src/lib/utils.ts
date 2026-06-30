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

export function translateNotificationDesc(type: string, desc: string): string {
  const rules = DESC_PATTERNS[type];
  if (rules) {
    for (const [regex, replacement] of rules) {
      if (regex.test(desc)) return desc.replace(regex, replacement);
    }
  }
  return desc;
}