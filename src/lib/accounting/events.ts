import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { AccountingEvent } from './types';

const EVENTS_COLLECTION = 'accounting_events';

export async function logAccountingEvent(
  event: Omit<AccountingEvent, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection(EVENTS_COLLECTION).add({
      ...event,
      attempts: typeof event.attempts === 'number' ? event.attempts : 1,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err) {
    // L'événement ne doit JAMAIS faire échouer le flux commercial.
    console.error('[Accounting] Failed to log accounting event:', err);
  }
}