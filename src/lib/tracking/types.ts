export type TrackingProvider = '17track' | 'dhl' | 'ups' | 'fedex' | 'gls' | 'laposte' | 'chronopost';

export type TrackingStatus =
  | 'NotFound'
  | 'InfoReceived'
  | 'InTransit'
  | 'Expired'
  | 'AvailableForPickup'
  | 'OutForDelivery'
  | 'DeliveryFailure'
  | 'Delivered'
  | 'Exception';

export interface CarrierConfig {
  id: string;
  label: string;
  provider: TrackingProvider;
  carrierCode?: number;
  enabled: boolean;
  apiKey?: string;
  webhookUrl?: string;
  lastTestAt?: string | null;
  lastTestOk?: boolean | null;
}

export interface TrackingEvent {
  time: string;
  timeRaw: string;
  location: string;
  description: string;
  subStatus: string;
  status: TrackingStatus;
}

export interface TrackingData {
  trackingNumber: string;
  carrier: number;
  carrierLabel: string;
  status: TrackingStatus;
  subStatus: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  pickupTime?: string;
  deliveryTime?: string;
  recipient?: string;
  originCountry?: string;
  destinationCountry?: string;
  lastUpdatedAt: string;
  provider: TrackingProvider;
}

export interface TrackedOrder {
  orderId: string;
  orderType: 'sale' | 'rental';
  trackingNumbers: TrackedNumber[];
}

export interface TrackedNumber {
  trackingNumber: string;
  carrier: number;
  carrierLabel: string;
  provider: TrackingProvider;
  status: TrackingStatus;
  subStatus: string;
  events: TrackingEvent[];
  registeredAt: string;
  lastUpdatedAt: string;
  webhookActive: boolean;
}

export interface ProviderSettings {
  id: string;
  provider: TrackingProvider;
  label: string;
  apiKey: string;
  enabled: boolean;
  webhookUrl: string;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
}
