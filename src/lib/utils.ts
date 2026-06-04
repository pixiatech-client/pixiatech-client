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
  delivered: { fr: 'Livré', en: 'Delivered' },
  trashed: { fr: 'Corbeille', en: 'Trashed' },
  archive: { fr: 'Archivé', en: 'Archived' },
  archived: { fr: 'Archivé', en: 'Archived' },
};

export const translateStatus = (status: string, locale: string = 'fr'): string => {
  const normalized = STATUS_TRANSLATIONS[status];
  if (!normalized) return status;
  const lang = locale === 'en' ? 'en' : 'fr';
  return normalized[lang];
};
