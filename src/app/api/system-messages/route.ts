import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const location = searchParams.get('location');
    const { adminDb } = getFirebaseAdmin();

    let query: FirebaseFirestore.Query = adminDb.collection('system_messages').orderBy('createdAt', 'desc');

    if (activeOnly) {
      query = query.where('active', '==', true);
    }

    const snap = await query.get();
    let messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (location) {
      const locationField = `show${location.charAt(0).toUpperCase() + location.slice(1)}`;
      messages = messages.filter((m: any) => m[locationField] === true);
    }

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminDb, FieldValue, Timestamp } = getFirebaseAdmin();

    const doc: Record<string, any> = {
      type: body.type || 'info',
      title: body.title || '',
      content: body.content || '',
      color: body.color || '',
      icon: body.icon || '',
      active: body.active !== false,
      showHomepage: body.showHomepage || false,
      showBoutique: body.showBoutique || false,
      showClientArea: body.showClientArea || false,
      permanent: body.permanent || false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await adminDb.collection('system_messages').add(doc);

    return NextResponse.json({ id: ref.id, ...doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
