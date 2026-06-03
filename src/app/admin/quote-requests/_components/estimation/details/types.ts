export type ProfileType = 'client' | 'supplier';

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  sitePhoto?: string;
  commercialNotes?: string;
}

export interface Product {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tileWidth?: number;
  tileHeight?: number;
  pricePerTile?: number;
  nombreEcrans?: number;
  dimensionsEnabled?: boolean;
  width?: number;
  height?: number;
  transactionType?: 'sale' | 'rental';
  rentalUnit?: 'day' | 'hour';
  rentalDuration?: number;
  rentalPeriod?: { from: Date; to: Date };
  rentalDate?: Date;
  rentalStartTime?: string;
  rentalEndTime?: string;
  specs?: Record<string, string | number>;
}

export interface HistoryEntry {
  id: string;
  timestamp: string | Date;
  action: string;
  user: string;
  userId: string;
  userPhoto?: string;
  type: 'local' | 'global';
}

export interface PaymentStep {
  id: string;
  label: string;
  amount: number;
  status: 'pending' | 'completed';
  date?: string;
}

export interface Estimation {
  id: string;
  client: ClientInfo;
  products: Product[];
  productDiscount: number;
  deliveryCity?: string;
  deliveryCost: number;
  deliveryDiscount: number;
  laborCost: number;
  laborDiscount: number;
  taxRate: number;
  globalDiscount: number;
  history: HistoryEntry[];
  payments?: {
    totalPaid: number;
    steps: PaymentStep[];
  };
  transmittedToSupplier?: boolean;
  hideCommentsFromSupplier?: boolean;
  hidePhotoFromSupplier?: boolean;
  supplierNotes?: string;
  commercialNotes?: string;
  status?: string;
  pdfUrl?: string;
}
