import { getFirebaseAdmin } from './firebase-admin';

export interface ProfessionalInfo {
  companyName: string;
  siret: string;
  vatNumber: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  officePhone: string;
  companyEmail: string;
  position: string;
  employees: string;
  website: string;
  fax: string;
  vatValidated: boolean;
  vatRate: 0 | 0.2;
  createdAt?: string;
  validatedAt?: string;
  updatedAt: string;
}

const COLLECTION = 'user_professional_info';

export async function getProfessionalInfo(customerId: string): Promise<ProfessionalInfo | null> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb.collection(COLLECTION).doc(customerId).get();
  if (!snap.exists) return null;
  return snap.data() as ProfessionalInfo;
}

export async function upsertProfessionalInfo(
  customerId: string,
  data: Omit<ProfessionalInfo, 'updatedAt' | 'createdAt' | 'validatedAt'>
): Promise<ProfessionalInfo> {
  const { adminDb } = getFirebaseAdmin();
  const ref = adminDb.collection(COLLECTION).doc(customerId);
  const existing = await ref.get();
  const now = new Date().toISOString();
  const doc: ProfessionalInfo = {
    ...data,
    createdAt: existing.exists ? String((existing.data()?.createdAt || now)) : now,
    validatedAt: data.vatValidated ? now : '',
    updatedAt: now,
  };
  await ref.set(doc, { merge: true });
  return doc;
}