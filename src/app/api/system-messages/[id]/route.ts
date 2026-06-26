import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, verifyAdminSession } from '@/lib/firebase-admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { adminDb, FieldValue } = getFirebaseAdmin();
    const { id } = await params;

    const update: Record<string, any> = { ...body, updatedAt: FieldValue.serverTimestamp() };
    delete update.id;
    delete update.createdAt;

    await adminDb.collection('system_messages').doc(id).update(update);

    // Auto-deactivate other non-permanent messages if this one was activated
    if (body.active === true) {
      const docSnap = await adminDb.collection('system_messages').doc(id).get();
      const docData = docSnap.data();
      if (docData && !docData.permanent) {
        const activeSnap = await adminDb.collection('system_messages')
          .where('active', '==', true)
          .get();
        const batch = adminDb.batch();
        activeSnap.docs.forEach(d => {
          const data = d.data();
          if (d.id !== id && !data.permanent) {
            batch.update(d.ref, { active: false, updatedAt: FieldValue.serverTimestamp() });
          }
        });
        await batch.commit();
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { adminDb } = getFirebaseAdmin();
    const { id } = await params;

    const doc = await adminDb.collection('system_messages').doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Message introuvable' }, { status: 404 });
    }
    if (doc.data()?.permanent) {
      return NextResponse.json({ error: 'Ce message ne peut pas être supprimé' }, { status: 403 });
    }

    await adminDb.collection('system_messages').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

