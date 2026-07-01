import { firestore } from '@/firebase/config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

export type SaleStatus = 'commande' | 'archive' | 'corbeille';

export interface SaleOrder {
  id?: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerPostcode: string;
  customerCountry?: string;
  customerCompany?: string;
  customerSiren?: string;
  customerVatNumber?: string;
  customerVatValidated?: boolean;
  customerId?: string;
  trackingNumber?: string;
  deliveryCost: number;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  amountPaid: number;
  vat: number;
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'sale_orders';

export async function createSaleOrder(data: Omit<SaleOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateSaleOrder(id: string, data: Omit<Partial<SaleOrder>, 'updatedAt' | 'createdAt'>) {
  await updateDoc(doc(firestore, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getSaleOrder(id: string): Promise<SaleOrder | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SaleOrder;
}

export async function getSaleOrders(options?: {
  status?: SaleStatus;
  limitVal?: number;
}): Promise<SaleOrder[]> {
  const constraints: any[] = [];
  if (options?.status) constraints.push(where('status', '==', options.status));
  constraints.push(orderBy('createdAt', 'desc'));
  if (options?.limitVal) constraints.push(limit(options.limitVal));
  const q = query(collection(firestore, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleOrder));
}

export async function deleteSaleOrder(id: string) {
  await deleteDoc(doc(firestore, COLLECTION, id));
}

export async function getAllSaleOrders(): Promise<SaleOrder[]> {
  const q = query(collection(firestore, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SaleOrder));
}
