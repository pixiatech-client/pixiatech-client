import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('promo_codes').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
