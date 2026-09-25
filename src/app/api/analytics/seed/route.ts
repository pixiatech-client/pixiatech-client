import { NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';
import { generateDemoSeed } from '@/lib/analytics/seed-data';

export const dynamic = 'force-dynamic';

const BATCH = 450;

export async function POST() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminDb } = getFirebaseAdmin();
    const { sessions, messages } = generateDemoSeed();

    const sessionRefs = adminDb.collection('analytics_sessions');
    for (let i = 0; i < sessions.length; i += BATCH) {
      const batch = adminDb.batch();
      const chunk = sessions.slice(i, i + BATCH);
      for (const s of chunk) {
        batch.set(sessionRefs.doc(s.sid), { ...s });
      }
      await batch.commit();
    }

    const messagesRef = adminDb.collection('siteWebMessages');
    for (let i = 0; i < messages.length; i += BATCH) {
      const batch = adminDb.batch();
      const chunk = messages.slice(i, i + BATCH);
      for (const m of chunk) {
        const { id, ...data } = m;
        batch.set(messagesRef.doc(String(id)), data);
      }
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      sessions: sessions.length,
      messages: messages.length,
      message: `${sessions.length} sessions et ${messages.length} conversions fictives insérées.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}