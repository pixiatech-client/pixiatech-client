import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const { adminDb, FieldValue } = getFirebaseAdmin();

    const existing = await adminDb.collection('system_messages').doc('b2b-profile').get();

    if (existing.exists) {
      return NextResponse.json({ message: 'Le message B2B/B2C existe déjà', id: 'b2b-profile' });
    }

    await adminDb.collection('system_messages').doc('b2b-profile').set({
      type: 'info',
      title: 'Profil B2B / B2C',
      content: 'Cet espace est réservé aux professionnels (B2B).\nMerci d\'indiquer votre profil afin d\'afficher les prix correspondants.',
      color: '#3B82F6',
      icon: 'UserCheck',
      active: true,
      showHomepage: true,
      showBoutique: true,
      showClientArea: true,
      showAllPages: false,
      startDate: null,
      endDate: null,
      permanent: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: 'Message B2B/B2C créé', id: 'b2b-profile' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
