import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    const { adminDb } = getFirebaseAdmin();

    const code = (body.code || '').toUpperCase().trim();
    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const existing = await adminDb.collection('promo_codes')
      .where('code', '==', code)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'Ce code existe déjà' }, { status: 409 });
    }

    const doc = {
      code,
      type: body.type || 'percentage',
      value: Number(body.value) || 0,
      assignedTo: body.assignedTo || '',
      assignedType: body.assignedType || 'collaborator',
      maxUses: Number(body.maxUses) || 0,
      currentUses: 0,
      minPurchase: Number(body.minPurchase) || 0,
      expiresAt: body.expiresAt || null,
      active: body.active !== false,
      createdAt: new Date().toISOString(),
    };

    const ref = await adminDb.collection('promo_codes').add(doc);

    return NextResponse.json({ id: ref.id, ...doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
