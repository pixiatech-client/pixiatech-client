import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('quote_requests').doc(id).delete();

    return NextResponse.json({ message: 'Demande supprimée' });
  } catch (err: any) {
    console.error('[QuoteRequest Delete] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
