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
export function translateStatus(status: string): string {
  if (!status) return '';
  const s = status.toLowerCase();
  const translations: Record<string, string> = {
    'pending': 'En attente',
    'processed': 'Traité',
    'trashed': 'Corbeille',
    'archive': 'Archivé',
    'archived': 'Archivé',
    'in_progress': 'En cours',
    'sent': 'Envoyé',
    'delivered': 'Livré',
    'returned': 'Retourné',
  };
  return translations[s] || status;
}
