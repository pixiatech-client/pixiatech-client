import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSmtpTransport } from '@/lib/smtpService';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { adminDb } = getFirebaseAdmin();
    await adminDb.collection('reseller_leads').add({
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      notified: false,
    });

    const { transporter, fromHeader } = await getSmtpTransport();
    await transporter.sendMail({
      from: fromHeader,
      to: 'devis@pixiatech.com',
      subject: 'Nouveau lead revendeur',
      html: `<p>Un revendeur potentiel s'est inscrit :</p><p>Email : ${normalizedEmail}</p>`,
    });

    return NextResponse.json({ message: 'Merci ! Vous recevrez un email dès l\'ouverture des inscriptions.' });
  } catch (err: any) {
    console.error('[ResellerInterest] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
  }
}
