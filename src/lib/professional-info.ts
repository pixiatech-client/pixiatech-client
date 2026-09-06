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
  nafCode?: string;
  createdAt?: string;
  validatedAt?: string;
  updatedAt: string;
}

const COLLECTION = 'user_professional_info';

// Champs d'identité verrouillés définitivement après la première validation.
// Toute tentative de modification ultérieure est ignorée côté serveur.
const LOCKED_IDENTITY_FIELDS = ['companyName', 'siret', 'vatNumber'] as const;

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

  const payload: Omit<ProfessionalInfo, 'updatedAt' | 'createdAt' | 'validatedAt'> = { ...data };

  // Verrou d'identité : si le document existe déjà (1re validation terminée),
  // on conserve la valeur en base des champs d'identité et on ignore toute
  // modification envoyée par l'appelant (contournement API impossible).
  if (existing.exists) {
    const stored = existing.data() || {};
    for (const field of LOCKED_IDENTITY_FIELDS) {
      if (typeof stored[field] === 'string') {
        payload[field] = stored[field];
      }
    }
  }

  const doc: ProfessionalInfo = {
    ...payload,
    createdAt: existing.exists ? String((existing.data()?.createdAt || now)) : now,
    validatedAt: data.vatValidated ? now : '',
    updatedAt: now,
  };
  await ref.set(doc, { merge: true });
  return doc;
}