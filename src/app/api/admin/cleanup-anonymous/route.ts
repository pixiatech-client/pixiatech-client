export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { cleanupAnonymousUsers } = await import('../../../admin/actions');
    const result = await cleanupAnonymousUsers();

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[cleanup-anonymous] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
