import { firestore } from '@/firebase/config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export type RentalStatus = 'pending_validation' | 'validated' | 'shipped' | 'completed' | 'cancelled';

export interface RentalOrder {
  id?: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  // Client
  renterCompany: string;
  renterRepresentative: string;
  renterEmail: string;
  renterPhone: string;
  renterAddress: string;
  renterCity: string;
  renterPostcode: string;
  customerId?: string;
  trackingNumber?: string;
  // Location
  rentalStartDate: string;
  rentalEndDate: string;
  rentalStartTime: string;
  rentalEndTime: string;
  additionalNotes: string;
  // Contrat
  contractSignedAt: string | null;
  contractPdfUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  // Paiement
  deliveryCost: number;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  amountPaid: number;
  // Meta
  status: RentalStatus;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'rental_orders';

export async function createRentalOrder(data: Omit<RentalOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(firestore, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateRentalOrder(id: string, data: Omit<Partial<RentalOrder>, 'updatedAt' | 'createdAt'>) {
  await updateDoc(doc(firestore, COLLECTION, id), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getRentalOrder(id: string): Promise<RentalOrder | null> {
  const snap = await getDoc(doc(firestore, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RentalOrder;
}

export async function getRentalOrders(options?: {
  status?: RentalStatus;
  limit?: number;
}): Promise<RentalOrder[]> {
  const constraints: any[] = [];
  if (options?.status) constraints.push(where('status', '==', options.status));
  constraints.push(orderBy('createdAt', 'desc'));
  if (options?.limit) constraints.push(limit(options.limit));
  const q = query(collection(firestore, COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RentalOrder));
}

