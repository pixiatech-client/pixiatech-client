import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
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

    const { disputeId } = await req.json();
    if (!disputeId) {
      return NextResponse.json({ error: 'disputeId requis' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const disputeRef = adminDb.collection('disputes').doc(disputeId);
    const dispute = await disputeRef.get();
    if (!dispute.exists || dispute.data()?.customerId !== customerId) {
      return NextResponse.json({ error: 'Litige introuvable' }, { status: 404 });
    }

    await disputeRef.update({ unreadByClient: false });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Litige Read] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
