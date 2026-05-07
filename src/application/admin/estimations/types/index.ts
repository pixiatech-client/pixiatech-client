export type ProfileType = 'client' | 'supplier';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  specs?: {
    surface?: string;
    resolution?: string;
    ledModules?: number;
    maxPower?: string;
    avgPower?: string;
    breaker?: string;
    projectType?: string;
    environment?: string;
    viewDistance?: string;
    pixelPitch?: string;
    // V2 Specs (Supplier Deep Detail)
    chipset?: string;
    refreshRate?: string;
    brightness?: string;
    cabinetMaterial?: string;
    cabinetWeight?: string;
    ipRating?: string;
    viewingAngle?: string;
    maintenanceType?: string;
  };
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  sitePhoto?: string;
}

// Type d'entrée d'historique - cf. README-METIER.md Section 8.2
export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  userId: string;
  type: 'global' | 'local' | 'product' | 'payment';
}

export interface Estimation {
  id: string;
  client: ClientInfo;
  products: Product[];
  productDiscount: number; // percentage
  deliveryCity?: string;
  deliveryCost: number;
  deliveryDiscount: number; // percentage
  laborCost: number;
  laborDiscount: number; // percentage
  taxRate: number; // percentage (e.g., 20)
  globalDiscount: number; // percentage
  history: HistoryEntry[];
  transmittedToSupplier?: boolean;
  transmittedDate?: string;
  supplierNotes?: string;
  hideCommentsFromSupplier?: boolean;
  hidePhotoFromSupplier?: boolean;
  pdfUrl?: string;
}
