import { firestore } from '@/firebase/config';
import { collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { QuoteRequest, QuoteRequestStatus } from './quote-requests';

const COLLECTION = 'quote_requests';

function mapDoc(id: string, data: any): QuoteRequest {
  return {
    id,
    productId: data.productId || '',
    productName: data.productName || '',
    productImage: data.productImage || '',
    quantity: data.quantity || 1,
    customerName: data.customerName || '',
    customerCompany: data.customerCompany || '',
    customerPhone: data.customerPhone || '',
    customerEmail: data.customerEmail || '',
    customerCountry: data.customerCountry || '',
    customerAddress: data.customerAddress || '',
    customerCity: data.customerCity || '',
    customerPostcode: data.customerPostcode || '',
    comment: data.comment || '',
    adminNotes: data.adminNotes || '',
    status: data.status || 'pending_supplier',
    supplierPrice: data.supplierPrice ?? undefined,
    finalPrice: data.finalPrice ?? undefined,
    currency: data.currency || 'EUR',
    paymentLink: data.paymentLink || '',
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
  };
}

export async function createQuoteRequest(data: Omit<QuoteRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    status: 'pending_supplier',
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function getQuoteRequest(id: string): Promise<QuoteRequest | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

export async function listQuoteRequests(status?: QuoteRequestStatus): Promise<QuoteRequest[]> {
  const constraints: any[] = [orderBy('createdAt', 'desc')];
  if (status) constraints.unshift(where('status', '==', status));
  const snap = await getDocs(query(collection(firestore, COLLECTION), ...constraints));
  return snap.docs.map(d => mapDoc(d.id, d.data()));
}

export async function updateQuoteRequest(id: string, data: Partial<QuoteRequest>): Promise<void> {
  const payload: any = { ...data, updatedAt: Timestamp.now() };
  delete payload.id;
  await updateDoc(doc(firestore, COLLECTION, id), payload);
}

export async function deleteQuoteRequest(id: string): Promise<void> {
  await deleteDoc(doc(firestore, COLLECTION, id));
}
