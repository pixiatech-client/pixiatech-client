import type { ClientOrderKind } from '@/lib/client-status';

export type ClientTab = 'dashboard' | 'orders' | 'invoices' | 'disputes' | 'settings';

export type ClientNotificationType = 'dispute' | 'invoice' | 'delivery' | 'order';

export interface ClientNotification {
  id: string;
  type: ClientNotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  linkTab?: string;
  disputeId?: string;
  invoiceId?: string;
}

export interface ClientProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  emailVerified: boolean;
  siretVerified: boolean;
  vatValidated: boolean;
  hasPassword: boolean;
  civility: string;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyPostalCode: string;
  companyCountry: string;
  legalStatus: string;
  vatNumber: string;
  siret: string;
  nafCode: string;
  officePhone: string;
  personalAddress: { street: string; postalCode: string; city: string; country: string };
  createdAt?: string;
  lastLoginAt?: string;
}

export interface ClientOrderItem {
  id: string;
  img: string;
  title: string;
  subtitle: string;
  kindLabel: 'Achat' | 'Location';
  unitPriceHT: number;
  unitPriceTTC: number;
  quantity: number;
  deliveryAddress: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryCountry: string;
  deliveryFees: number;
  carrier: string;
  trackingNumber: string;
  deliveryPinCode: string;
  estimatedDeliveryDate: string;
  vatRate: number;
  note?: string;
}

export interface ClientOrder {
  id: string;
  number: string;
  date: string;
  itemCount: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  statusKey: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  statusLabel: string;
  type: ClientOrderKind;
  kindLabel: 'Achat' | 'Location';
  hasInvoice: boolean;
  invoiceId?: string;
  invoiceStatusLabel?: string;
  items: ClientOrderItem[];
}

export interface ClientOrderTracker {
  hour: string;
  label: string;
  status: 'done' | 'active' | 'pending';
}

export interface ClientInvoice {
  id: string;
  number: string;
  date: string;
  companyName: string;
  statusLabel: string;
  status: string;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  orderId: string;
  orderType: 'sale' | 'rental';
  downloadable: boolean;
}

export interface ClientDisputeMessage {
  id: string;
  sender: 'customer' | 'admin';
  senderName: string;
  message: string;
  date: string;
  time: string;
}

export interface ClientDispute {
  id: string;
  reasonLabel: string;
  description: string;
  statusLabel: string;
  unreadByClient: boolean;
  date: string;
  lastResponseDate: string;
  orderNumber?: string;
  productName?: string;
  productImage?: string;
  carrierNote?: string;
  messages: ClientDisputeMessage[];
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

export interface DraftOrderRef {
  orderId: string;
  orderType: 'sale' | 'rental';
  label: string;
  date: string;
  amount: number;
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
  orders: DraftOrderRef[];
}

export interface EligibleOrder {
  orderId: string;
  orderType: 'sale' | 'rental';
  createdAt: string;
  productName: string;
  quantity: number;
  status: string;
  amountPaid: number;
  subtotal: number;
  discount: number;
  deliveryCost: number;
  vat: number;
  vatRate: number;
  taxRate: number;
  totalTtc: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
  promoCode?: string;
}