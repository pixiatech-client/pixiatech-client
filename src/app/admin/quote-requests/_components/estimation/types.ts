// Estimation statuses - see README-METIER.md Section 3.1
export type EstimationStatus = 
  | 'En attente'    // 1. En attente (pending)
  | 'Traité'       // 2. Traité (processed) - REQUIS: supplier
  | 'Fournisseur' // 3. Fournisseur (supplier)
  | 'Livraison'   // 4. Livraison (delivery) - REQUIS: trackingNumber + deliveryDate
  | 'Livré'       // 5. Livré (delivered - supplier marks as delivered)
  | 'Réception confirmée' // 6. Réception confirmée (client confirms receipt)
  | 'Archivé'     // 7. Archivé (archived)
  | 'Corbeille'   // 8. Corbeille (bin)
  | 'Retourné'    // 9. Retourné (returned)
  | 'Loué';       // 10. Loué (rented)

export interface TrackingInfo {
  number: string;
  deliveryDate: string;
  receiptDate: string;
}

export interface DeliveryHistoryEntry {
  action: string;
  userId: string;
  userName: string;
  timestamp: number;
  details?: string;
}

export interface Estimation {
  id: string;
  number: string;
  client: string;
  phone: string;
  email: string;
  status: EstimationStatus;
  supplier?: string;
  supplierId?: string;
  supplierPhoto?: string;
  time: string;
  date: string;
  totalPurchase: number;
  totalClient: number;
  reference: string;
  trackingNumber?: string;
  isReturned?: boolean;
  returnReason?: string;
  sendDate?: string;          // Date sent to supplier
  expectedArrivalDate?: string;  // Expected arrival date
  receiptDate?: string;       // Receipt date
  trackingInfo?: TrackingInfo;
  isLocked?: boolean;
  treatedBy?: string;
  treatedByName?: string;
  treatedByRole?: string;
  treatedAt?: any;
  supplierNotes?: string;
  supplierNotesRead?: boolean;
  emailVerified?: boolean;
  sitePhoto?: string;
  pdfUrl?: string;
  transactionType?: 'sale' | 'rental';
  rentalPeriod?: {
    from: string;
    to: string;
  };
  rentalStartTime?: string;
  rentalEndTime?: string;
  // Delivery tracking
  deliveryHistory?: DeliveryHistoryEntry[];
  isDelivered?: boolean;
  deliveredAt?: string;
  deliveredBy?: string;
  deliveredByName?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  delayDays?: number;
  lastDelayNotificationDay?: number;
  previousStatus?: string;
}

