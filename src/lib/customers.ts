import { getFirebaseAdmin } from './firebase-admin';

export interface Customer {
  id?: string;
  email: string;
  displayName: string;
  phone: string;
  createdAt: string;
  lastLoginAt: string;
  status: 'active';
}

const COLLECTION = 'customers';

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(COLLECTION).where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function createCustomer(data: Omit<Customer, 'id'>): Promise<string> {
  const { adminDb } = getFirebaseAdmin();
  const ref = await adminDb.collection(COLLECTION).add(data);
  return ref.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const { adminDb } = getFirebaseAdmin();
  await adminDb.collection(COLLECTION).doc(id).update(data);
}

export async function upsertCustomer(email: string, displayName: string): Promise<{ id: string; isNew: boolean }> {
  const existing = await findCustomerByEmail(email);
  const now = new Date().toISOString();
  if (existing) {
    await updateCustomer(existing.id!, { lastLoginAt: now });
    return { id: existing.id!, isNew: false };
  }
  const id = await createCustomer({
    email,
    displayName,
    phone: '',
    createdAt: now,
    lastLoginAt: now,
    status: 'active',
  });
  return { id, isNew: true };
}
