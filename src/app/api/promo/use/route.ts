import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { promoDocId } = await req.json();
    if (!promoDocId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();
    const ref = adminDb.collection('promo_codes').doc(promoDocId);
    await ref.update({
      currentUses: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
