import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('client_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    let customerId = '';
    try {
      const payload = await decrypt(sessionCookie);
      customerId = payload.customerId;
    } catch {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection('disputes')
      .where('customerId', '==', customerId)
      .where('unreadByClient', '==', true)
      .get();

    return NextResponse.json({ count: snap.docs.length });
  } catch (err: any) {
    console.error('[Unread Count] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
