import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { code, cartTotal } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code requis' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection('promo_codes')
      .where('code', '==', code.toUpperCase().trim())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ valid: false, error: 'Code promo introuvable' });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    if (!data.active) {
      return NextResponse.json({ valid: false, error: 'Ce code promo est désactivé' });
    }

    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a expiré' });
    }

    if (data.maxUses > 0 && data.currentUses >= data.maxUses) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a atteint sa limite d\'utilisations' });
    }

    if (data.minPurchase > 0 && cartTotal < data.minPurchase) {
      return NextResponse.json({
        valid: false,
        error: `Panier minimum de ${data.minPurchase}€ requis pour ce code`
      });
    }

    const discount = data.type === 'percentage'
      ? Math.round(cartTotal * (data.value / 100) * 100) / 100
      : data.value;

    return NextResponse.json({
      valid: true,
      discount,
      type: data.type,
      value: data.value,
      promoDocId: doc.id,
      assignedTo: data.assignedTo || '',
      assignedType: data.assignedType || '',
    });
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message }, { status: 500 });
  }
}
