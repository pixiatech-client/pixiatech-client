import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  sale: { fr: 'Vente', en: 'Sale' },
  rental: { fr: 'Location', en: 'Rental' },
};

const STATUS_REVERSE_MAP: Record<string, string> = {};
for (const [key, value] of Object.entries(STATUS_TRANSLATIONS)) {
  STATUS_REVERSE_MAP[value.fr] = key;
}

export const translateStatus = (status: string, locale: string = 'fr'): string => {
  const translationKey = STATUS_REVERSE_MAP[status] || status;
  const normalized = STATUS_TRANSLATIONS[translationKey];
  if (!normalized) return status;
  return locale === 'en' ? normalized.en : normalized.fr;
};