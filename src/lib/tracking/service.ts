import type { ProviderSettings, TrackingData, TrackingEvent, TrackedOrder, TrackedNumber } from './types';
import { TRACKING_COLLECTION } from './constants';

const ADMIN_DB = 'adminDb';
const FIELD_VALUE = 'FieldValue';

async function getAdminDb() {
  const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
  return getFirebaseAdmin();
}

export async function getProviderSettings(): Promise<ProviderSettings[]> {
  try {
    const { adminDb } = await getAdminDb();
    const snap = await adminDb.collection(TRACKING_COLLECTION).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProviderSettings));
  } catch (e) {
    console.error('[getProviderSettings] Erreur:', e);
    return [];
  }
}

export async function saveProviderSettings(
  id: string | null,
  data: Partial<ProviderSettings>
): Promise<void> {
  const { adminDb, FieldValue } = await getAdminDb();
  const ref = id
    ? adminDb.collection(TRACKING_COLLECTION).doc(id)
    : adminDb.collection(TRACKING_COLLECTION).doc();
  const now = FieldValue.serverTimestamp();
  const payload: Record<string, any> = { ...data, updatedAt: now };
  payload.createdAt = now;
  await ref.set(payload, { merge: true });
}

export async function getActive17TrackKey(): Promise<string | null> {
  const providers = await getProviderSettings();
  const cfg = providers.find((p) => p.provider === '17track' && p.enabled && p.apiKey);
  if (cfg?.apiKey) return cfg.apiKey;
  const envKey = process.env.TRACKING_API_KEY;
  if (envKey) return envKey;
  return null;
}

export async function saveTrackingToOrder(
  orderId: string,
  orderType: 'sale' | 'rental',
  trackingNumber: string,
  carrier: number,
  carrierLabel: string
): Promise<void> {
  const { adminDb, FieldValue } = await getAdminDb();
  const collection = orderType === 'sale' ? 'sale_orders' : 'rental_orders';
  const ref = adminDb.collection(collection).doc(orderId);

  await ref.set(
    {
      trackingNumber,
      trackingCarrier: carrier,
      trackingCarrierLabel: carrierLabel,
      trackingUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getTrackingForOrder(
  orderId: string,
  orderType: 'sale' | 'rental'
): Promise<{ trackingNumber?: string; trackingCarrier?: number } | null> {
  const { adminDb } = await getAdminDb();
  const collection = orderType === 'sale' ? 'sale_orders' : 'rental_orders';
  const doc = await adminDb.collection(collection).doc(orderId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (!data.trackingNumber) return null;
  return {
    trackingNumber: data.trackingNumber,
    trackingCarrier: data.trackingCarrier,
  };
}

export async function saveTrackingStatus(
  trackingNumber: string,
  data: {
    status: string;
    subStatus: string;
    events: TrackingEvent[];
    carrier: number;
  }
): Promise<void> {
  const { adminDb, FieldValue } = await getAdminDb();
  await adminDb
    .collection('tracking_cache')
    .doc(trackingNumber)
    .set(
      {
        ...data,
        lastUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function getCachedTracking(
  trackingNumber: string
): Promise<{
  status: string;
  subStatus: string;
  events: TrackingEvent[];
  carrier: number;
  lastUpdatedAt?: string;
} | null> {
  const { adminDb } = await getAdminDb();
  const doc = await adminDb.collection('tracking_cache').doc(trackingNumber).get();
  if (!doc.exists) return null;
  return doc.data() as any;
}
