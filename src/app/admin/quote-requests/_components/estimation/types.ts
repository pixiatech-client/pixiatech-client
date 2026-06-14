// Estimation statuses - see README-METIER.md Section 3.1
export type EstimationStatus = 
  | 'En attente'    // 1. En attente (pending)
  | 'Traité'       // 2. Traité (processed) - REQUIS: supplier
  | 'Fournisseur' // 3. Fournisseur (supplier)
  | 'Livraison'   // 4. Livraison (delivery) - REQUIS: trackingNumber + deliveryDate
  | 'Archivé'     // 5. Archivé (archived)
  | 'Corbeille'   // 6. Corbeille (bin)
  | 'Retourné'    // 7. Retourné (returned)
  | 'Loué';       // 8. Loué (rented)

export interface TrackingInfo {
  number: string;
  deliveryDate: string;
  receiptDate: string;
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
}

