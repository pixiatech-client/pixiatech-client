export type QuoteRequestStatus = 'pending_supplier' | 'offer_sent' | 'accepted' | 'declined' | 'expired' | 'awaiting_delivery';

export interface QuoteRequest {
  id?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  customerName: string;
  customerCompany?: string;
  customerPhone: string;
  customerEmail: string;
  customerCountry: string;
  customerAddress: string;
  customerCity?: string;
  customerPostcode?: string;
  comment?: string;
  adminNotes?: string;
  status: QuoteRequestStatus;
  supplierPrice?: number;
  finalPrice?: number;
  currency?: string;
  paymentLink?: string;
  createdAt: string;
  updatedAt: string;
}
