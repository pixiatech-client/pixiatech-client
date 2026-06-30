import type { TrackingStatus } from './types';

export const SEVENTEEN_TRACK_API_BASE = 'https://api.17track.net/track/v2.4';

export const TRACKING_COLLECTION = 'tracking_providers';

export const STATUS_LABELS: Record<TrackingStatus, string> = {
  NotFound: 'Non trouvé',
  InfoReceived: 'Informations reçues',
  InTransit: 'En transit',
  Expired: 'Expiré',
  AvailableForPickup: 'Disponible en point relais',
  OutForDelivery: 'En cours de livraison',
  DeliveryFailure: 'Échec de livraison',
  Delivered: 'Livré',
  Exception: 'Incident',
};

export const STATUS_COLORS: Record<TrackingStatus, { dot: string; bg: string; text: string; border: string }> = {
  NotFound: { dot: '#eab308', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  InfoReceived: { dot: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  InTransit: { dot: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Expired: { dot: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  AvailableForPickup: { dot: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  OutForDelivery: { dot: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DeliveryFailure: { dot: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  Delivered: { dot: '#22c55e', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Exception: { dot: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};
