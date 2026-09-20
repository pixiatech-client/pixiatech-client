import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function GET(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
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
