export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const { adminAuth, adminDb } = getFirebaseAdmin();
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
    }

    const sessionCookie = (await cookies()).get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const snap = await adminDb.collection('products').get();
    const moved: string[] = [];
    const skipped: string[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const hasBoutiqueFields = data.badges || data.galleryUrls || data.oldPrice || data.descriptionDetaillee;
      if (!hasBoutiqueFields) {
        skipped.push(doc.id);
        continue;
      }

      await adminDb.collection('boutique_products').doc(doc.id).set(data);
      await adminDb.collection('products').doc(doc.id).delete();
      moved.push(doc.id);
    }

    return NextResponse.json({
      success: true,
      moved: moved.length,
      movedIds: moved,
      skipped: skipped.length,
    });
  } catch (err: any) {
    console.error('[migrate-boutique] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
