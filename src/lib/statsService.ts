import { getFirebaseAdmin } from './firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';

export interface QuoteStats {
  pending: { count: number; total: number };
  processed: { count: number; total: number };
  returned: { count: number; total: number };
  in_progress: { count: number; total: number };
  sent: { count: number; total: number };
  archived: { count: number; total: number };
  trashed: { count: number; total: number };
  rented: { count: number; total: number };
  updatedAt: Timestamp | null;
  resyncVersion: number;
}

const DEFAULT_STATS: QuoteStats = {
  pending: { count: 0, total: 0 },
  processed: { count: 0, total: 0 },
  returned: { count: 0, total: 0 },
  in_progress: { count: 0, total: 0 },
  sent: { count: 0, total: 0 },
  archived: { count: 0, total: 0 },
  trashed: { count: 0, total: 0 },
  rented: { count: 0, total: 0 },
  updatedAt: null,
  resyncVersion: 1
};

export const validStatuses = ['pending', 'processed', 'returned', 'in_progress', 'sent', 'archived', 'trashed', 'rented'] as const;
export type ValidStatus = typeof validStatuses[number];

function isValidStatus(status: string): status is ValidStatus {
  return validStatuses.includes(status as ValidStatus);
}

export async function getQuoteStats(): Promise<QuoteStats> {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) return DEFAULT_STATS;

  const statsDoc = await adminDb.collection('settings').doc('quote_stats').get();
  if (!statsDoc.exists) {
    return DEFAULT_STATS;
  }

  const data = statsDoc.data() || {};
  const result = { ...DEFAULT_STATS, ...data } as any;
  
  // Explicitly ensure nested fields exist to avoid spread operator overwriting them with partial objects
  validStatuses.forEach(s => {
    if (data[s]) {
      result[s] = {
        count: data[s].count || 0,
        total: data[s].total || 0
      };
    } else {
      result[s] = { count: 0, total: 0 };
    }
  });

  return result as QuoteStats;
}

export async function updateStatsOnCreate(status: string, amount: number) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb || !isValidStatus(status)) return;

  const statsRef = adminDb.collection('settings').doc('quote_stats');

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    const data = snap.exists ? (snap.data() as QuoteStats) : { ...DEFAULT_STATS };

    if (!data[status]) {
      data[status] = { count: 0, total: 0 };
    }

    data[status].count = (data[status].count || 0) + 1;
    data[status].total = (data[status].total || 0) + amount;
    data.updatedAt = FieldValue.serverTimestamp() as Timestamp;

    tx.set(statsRef, data, { merge: true });
    console.warn(`STATS UPDATE [CREATE]: ${status} count=${data[status].count} total=${data[status].total}`);
  });
}

export async function updateStatsOnStatusChange(oldStatus: string | null, newStatus: string | null, amount: number, quantity: number = 1) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) return;

  const statsRef = adminDb.collection('settings').doc('quote_stats');

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    const data = snap.exists ? (snap.data() as QuoteStats) : { ...DEFAULT_STATS };

    let changed = false;

    if (oldStatus && isValidStatus(oldStatus) && data[oldStatus]) {
      data[oldStatus].count = Math.max(0, (data[oldStatus].count || 0) - quantity);
      data[oldStatus].total = Math.max(0, (data[oldStatus].total || 0) - amount);
      changed = true;
    }

    if (newStatus && isValidStatus(newStatus)) {
      if (!data[newStatus]) data[newStatus] = { count: 0, total: 0 };
      data[newStatus].count = (data[newStatus].count || 0) + quantity;
      data[newStatus].total = (data[newStatus].total || 0) + amount;
      changed = true;
    }

    if (changed) {
      data.updatedAt = FieldValue.serverTimestamp() as Timestamp;
      tx.set(statsRef, data, { merge: true });
      console.warn(`STATS UPDATE [CHANGE]: ${oldStatus || 'none'} -> ${newStatus || 'none'} | Amount: ${amount} | Qty: ${quantity}`);
    }
  });
}

export async function updateStatsOnDelete(status: string, amount: number, quantity: number = 1) {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb || !isValidStatus(status)) return;

  const statsRef = adminDb.collection('settings').doc('quote_stats');

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(statsRef);
    if (!snap.exists) return;

    const data = snap.data() as QuoteStats;

    if (data[status]) {
      data[status].count = Math.max(0, (data[status].count || 0) - quantity);
      data[status].total = Math.max(0, (data[status].total || 0) - amount);
      data.updatedAt = FieldValue.serverTimestamp() as Timestamp;

      tx.set(statsRef, data, { merge: true });
      console.warn(`STATS UPDATE [DELETE]: ${status} count=${data[status].count} total=${data[status].total}`);
    }
  });
}

export async function resyncStats() {
  const { adminDb, FieldValue } = getFirebaseAdmin();
  if (!adminDb) return null;

  const statsRef = adminDb.collection('settings').doc('quote_stats');
  const quotesRef = adminDb.collection('quotes');

  try {
    // 1. Fetch all quotes (fallback to full manual count to guarantee accuracy)
    const snapshot = await quotesRef.get();
    
    const newStats: QuoteStats = { ...DEFAULT_STATS };
    let totalCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const status = data.status as ValidStatus;
      const amount = data.totalClient || data.totalQuote || 0;

      if (isValidStatus(status)) {
        const numericAmount = Number(amount) || 0;
        newStats[status].count += 1;
        newStats[status].total += numericAmount;
      }
      totalCount++;
    });

    newStats.resyncVersion = Date.now();
    
    // Write new stats in one go
    await statsRef.set({
      ...newStats,
      updatedAt: FieldValue.serverTimestamp()
    });

    console.warn(`✅ STATS RESYNC COMPLETE: Processed ${totalCount} quotes.`);
    return newStats;
  } catch (error) {
    console.error('Failed to resync stats:', error);
    return null;
  }
}
