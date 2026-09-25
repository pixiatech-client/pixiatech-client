import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { phone } = await req.json();
    if (typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('customers').doc(customerId).update({
      phone: phone.trim(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, phone: phone.trim() });
  } catch (err: any) {
    console.error('[UpdatePhone] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
