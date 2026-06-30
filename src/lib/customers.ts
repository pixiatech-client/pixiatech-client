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
  const snap = await adminDb.collection(COLLECTION).where('email', '==', email.toLowerCase().trim()).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function createCustomer(data: Omit<Customer, 'id'>): Promise<string> {
  const { adminDb } = getFirebaseAdmin();
  const ref = await adminDb.collection(COLLECTION).add({
    ...data,
    email: data.email.toLowerCase().trim()
  });
  return ref.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  const { adminDb } = getFirebaseAdmin();
  const updateData = { ...data };
  if (updateData.email) {
    updateData.email = updateData.email.toLowerCase().trim();
  }
  await adminDb.collection(COLLECTION).doc(id).update(updateData);
}

export async function upsertCustomer(email: string, displayName: string, phone?: string): Promise<{ id: string; isNew: boolean }> {
  const existing = await findCustomerByEmail(email);
  const now = new Date().toISOString();
  if (existing) {
    const updateData: Partial<Customer> = { lastLoginAt: now };
    if (phone) updateData.phone = phone;
    await updateCustomer(existing.id!, updateData);
    return { id: existing.id!, isNew: false };
  }
  const id = await createCustomer({
    email,
    displayName,
    phone: phone || '',
    createdAt: now,
    lastLoginAt: now,
    status: 'active',
  });
  return { id, isNew: true };
}
