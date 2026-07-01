import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const { adminDb } = getFirebaseAdmin();
    let query: FirebaseFirestore.Query = adminDb.collection('quote_requests').orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(requests);
  } catch (err: any) {
    console.error('[QuoteRequest List] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la récupération des demandes' }, { status: 500 });
  }
}
