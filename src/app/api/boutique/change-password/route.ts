import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ error: 'Mot de passe actuel requis' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit être différent' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const customerRef = adminDb.collection('customers').doc(customerId);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const hash = customerSnap.data()?.passwordHash;
    if (!hash) {
      return NextResponse.json(
        { error: 'Aucun mot de passe défini. Utilisez un lien de connexion pour en créer un.' },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, hash);
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await customerRef.update({
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ChangePassword] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}