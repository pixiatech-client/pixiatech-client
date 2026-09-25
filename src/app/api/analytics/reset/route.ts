import { NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const BATCH = 450;
const MAX_DELETE = 50_000;

async function deleteCollection(ref: FirebaseFirestore.CollectionReference) {
  const { adminDb } = getFirebaseAdmin();
  let removed = 0;
  while (removed < MAX_DELETE) {
    const snap = await ref.limit(BATCH).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    removed += snap.docs.length;
  }
  return removed;
}

export async function POST() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminDb } = getFirebaseAdmin();

    const sessionsDeleted = await deleteCollection(adminDb.collection('analytics_sessions'));
    const eventsDeleted = await deleteCollection(adminDb.collection('analytics_events'));

    const seedMessagesSnap = await adminDb
      .collection('siteWebMessages')
      .where('__seed', '==', true)
      .limit(BATCH)
      .get();
    const seedMsgDeleted = seedMessagesSnap.size;
    if (!seedMessagesSnap.empty) {
      const batch = adminDb.batch();
      seedMessagesSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      sessionsDeleted,
      eventsDeleted,
      seedMessagesDeleted: seedMsgDeleted,
      message: `Données analytics réinitialisées : ${sessionsDeleted} sessions, ${eventsDeleted} événements, ${seedMsgDeleted} conversions fictives supprimées.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}