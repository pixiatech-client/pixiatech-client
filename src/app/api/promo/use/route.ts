import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { rateLimitExceeded } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (rateLimitExceeded(req, 30, 200)) {
      return NextResponse.json({ error: 'Trop de tentatives, veuillez réessayer plus tard' }, { status: 429 });
    }

    const { promoDocId } = await req.json();
    if (!promoDocId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();
    const ref = adminDb.collection('promo_codes').doc(promoDocId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Code promo introuvable' }, { status: 404 });
    }
    const data = doc.data();
    if (data?.active === false) {
      return NextResponse.json({ error: 'Code promo inactif' }, { status: 400 });
    }
    await ref.update({
      currentUses: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
