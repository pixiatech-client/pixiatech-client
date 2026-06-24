import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();
    const snap = await adminDb.collection('promo_codes')
      .orderBy('createdAt', 'desc')
      .get();

    const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json(codes);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
