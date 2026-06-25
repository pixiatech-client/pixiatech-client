import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const location = searchParams.get('location');
    const { adminDb } = getFirebaseAdmin();

    let query: FirebaseFirestore.Query = adminDb.collection('system_messages');

    if (activeOnly) {
      query = query.where('active', '==', true);
    }

    const snap = await query.get();
    let messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort by createdAt descending (in-memory to avoid composite index requirement)
    messages.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() ?? a.createdAt ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? b.createdAt ?? 0;
      return bTime - aTime;
    });

    const now = new Date();

    // Filter by active + scheduling
    messages = messages.filter((m: any) => {
      // Must be active
      if (activeOnly && !m.active) return false;

      // Scheduling start date: skip if startDate is in the future
      if (m.startDate) {
        const start = new Date(m.startDate);
        if (start > now) return false;
      }

      // Scheduling end date: skip if endDate is in the past
      if (m.endDate) {
        const end = new Date(m.endDate);
        if (end < now) return false;
      }

      return true;
    });

    if (location) {
      const locationField = `show${location.charAt(0).toUpperCase() + location.slice(1)}`;
      messages = messages.filter((m: any) => m.showAllPages === true || m[locationField] === true);
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
      showAllPages: body.showAllPages || false,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      permanent: body.permanent || false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = await adminDb.collection('system_messages').add(doc);

    // Auto-deactivate other non-permanent active messages (only one at a time)
    if (doc.active && !doc.permanent) {
      const activeSnap = await adminDb.collection('system_messages')
        .where('active', '==', true)
        .get();
      const batch = adminDb.batch();
      activeSnap.docs.forEach(d => {
        const data = d.data();
        if (d.id !== ref.id && !data.permanent) {
          batch.update(d.ref, { active: false, updatedAt: FieldValue.serverTimestamp() });
        }
      });
      await batch.commit();
    }

    return NextResponse.json({ id: ref.id, ...doc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
