export type ActiveTab = 'dashboard' | 'orders' | 'invoices' | 'disputes' | 'settings';
export type ClientTab = ActiveTab;

export type BillingType = 'entreprise' | 'particulier';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  emailVerified: boolean;
  emailVerificationCode?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  legalForm?: string;
  // Enterprise info
  siret?: string;
  siretVerified?: boolean;
  companyName?: string;
  vatNumber?: string;
  companyAddress?: string;
  legalStatus?: string; // e.g. SAS, SARL
  nafCode?: string; // e.g. 62.01Z
  city?: string;
  postalCode?: string;
  // Personal client address
  personalAddress?: string;
  personalCity?: string;
  personalPostalCode?: string;
  personalCountry?: string;
  // Legacy fields
  vatValidated?: boolean;
  hasPassword?: boolean;
  civility?: string;
  officePhone?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export type ClientProfile = UserProfile;

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  productDescription?: string;
  quantity: number;
  unitPriceHT: number;
  vatRate: number; // 0.20 for 20%
  unitPriceTTC: number;
  category: string;
}

export type OrderStatus = 'delivered' | 'in_transit' | 'shipped' | 'processing' | 'cancelled';

export type InvoiceStatus = 'EN ATTENTE' | 'EN COURS' | 'FACTURE DISPONIBLE';

export interface Order {
  id: string; // e.g. cmd-001 or CMD-2025-0842
  orderNumber: string;
  date: string;
  status: OrderStatus;
  statusKey?: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  type?: string;
  items: OrderItem[];
  subtotalHT: number;
  vatAmount: number;
  vatRate?: number;
  discountCode?: string;
  discountAmount?: number;
  deliveryCost?: number;
  totalTTC: number;
  deliveryAddress?: string;
  shippingAddress?: string;
  carrier: string; // e.g. "Chronopost Spécialiste Frêt"
  trackingNumber: string;
  deliveryPin?: string;
  deliveryPinCode?: string; // e.g. "7394"
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  hasInvoice: boolean;
  invoiceId?: string;
  invoiceStatus?: InvoiceStatus;
}

export type ClientOrder = Order;

export interface Invoice {
  id: string; // e.g. fac-001 or FAC-2025-0042
  invoiceNumber: string;
  number?: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  productUrl?: string;
  issueDate: string;
  dueDate?: string;
  subtotalHT: number;
  totalHt?: number;
  vatRate: number;
  vatAmount: number;
  vat?: number;
  discountCode?: string;
  discountAmount?: number;
  totalTTC: number;
  totalTtc?: number;
  status: InvoiceStatus;
  pdfUrl?: string;
  downloadable?: boolean;
  orders?: any[];
  definitiveDocumentUploaded?: boolean;
  uploadedAt?: string;
  adminNotes?: string;
  billingType?: BillingType;
  clientSnapshot: {
    billingType: BillingType;
    clientName: string;
    email: string;
    siret?: string;
    companyName?: string;
    vatNumber?: string;
    billingAddress: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export type ClientInvoice = Invoice;

export type DisputeStatus = 'Ouvert' | 'En cours' | 'En attente' | 'Résolu' | 'Fermé';

export type DisputeReason =
  | 'damaged_package'
  | 'missing_item'
  | 'delivery_delay'
  | 'wrong_reference'
  | 'defective_product'
  | 'other';

export interface DisputeMessage {
  id: string;
  sender: 'client' | 'admin' | 'customer';
  senderName: string;
  message: string;
  date: string;
  time: string;
  attachment?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | null;
  mediaName?: string | null;
}

export interface Dispute {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  productImage: string;
  reason: DisputeReason;
  reasonLabel: string;
  description: string;
  status: DisputeStatus;
  date: string;
  unreadByClient?: boolean;
  lastResponseDate?: string;
  carrierNote?: string;
  messages: DisputeMessage[];
}

export type ClientDispute = Dispute;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'order' | 'invoice' | 'delivery' | 'dispute' | 'security';
  linkTab?: ActiveTab;
  disputeId?: string;
  invoiceId?: string;
}

export type ClientNotification = NotificationItem;

export interface EligibleOrder {
  orderId: string;
  orderType: 'sale' | 'rental';
  createdAt: string;
  productName?: string;
  subtotal?: number;
  vat?: number;
  totalTtc?: number;
}

export interface OrderDraftOption {
  key: string;
  label: string;
  periodLabel: string;
  typeLabel: string;
  count: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  orders: Array<{
    orderId: string;
    orderType: 'sale' | 'rental';
    label: string;
    date: string;
    amount: number;
  }>;
}

export interface ClientProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  description?: string;
  category?: string;
}