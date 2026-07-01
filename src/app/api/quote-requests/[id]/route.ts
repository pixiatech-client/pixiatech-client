import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { adminDb } = getFirebaseAdmin();
    const docRef = adminDb.collection('quote_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    console.error('[QuoteRequest GET] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}