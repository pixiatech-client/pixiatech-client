import { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from './firebase-admin';

const CUSTOMER_COLLECTION = 'customers';
const ACTIVE_STATUS = 'active';

export async function getClientSessionCustomerId(req: NextRequest): Promise<string | null> {
  const sessionCookie = req.cookies.get('client_session')?.value;
  if (!sessionCookie) return null;
  try {
    const payload = await decrypt(sessionCookie);
    const customerId =
      typeof payload.customerId === 'string' && payload.customerId ? payload.customerId : null;
    if (!customerId) return null;

    const active = await isCustomerActive(customerId);
    return active ? customerId : null;
  } catch (err) {
    console.error('[ClientSession] Failed to decrypt client_session:', err);
    return null;
  }
}

export async function isCustomerActive(customerId: string): Promise<boolean> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection(CUSTOMER_COLLECTION).doc(customerId).get();
    if (!snap.exists) return false;
    const status = snap.get('status');
    // Absence de statut (doc legacy) => considéré actif ; tout statut != 'active' => refusé.
    return status === undefined || status === ACTIVE_STATUS;
  } catch (err) {
    console.error('[ClientSession] Failed to check customer status:', err);
    return false;
  }
}