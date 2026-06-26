import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

    const { adminDb } = getFirebaseAdmin();
    const ref = adminDb.collection('promo_codes').doc(id);

    const updateData: Record<string, any> = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.assignedType !== undefined) updateData.assignedType = data.assignedType;
    if (data.maxUses !== undefined) updateData.maxUses = Number(data.maxUses);
    if (data.minPurchase !== undefined) updateData.minPurchase = Number(data.minPurchase);
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt || null;
    if (data.active !== undefined) updateData.active = data.active;

    await ref.update(updateData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
