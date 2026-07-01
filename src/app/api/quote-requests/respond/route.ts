import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSmtpTransport } from '@/lib/smtpService';

export async function POST(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (!id || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();
    const docRef = adminDb.collection('quote_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    const current = doc.data()!;
    const status = action === 'accept' ? 'accepted' : 'declined';
    await docRef.update({ status, updatedAt: new Date().toISOString() });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host') || 'localhost:3000'}`;

    // Send admin notification email
    try {
      const { transporter, fromHeader } = await getSmtpTransport();
      const adminSubject = status === 'accepted'
        ? `[PIXIATECH] Devis accepté : ${current.productName}`
        : `[PIXIATECH] Devis refusé : ${current.productName}`;
      await transporter.sendMail({
        from: fromHeader,
        to: fromHeader,
        subject: adminSubject,
        html: `
<h2>Notification de ${status === 'accepted' ? 'd' : 'r'}éponse client</h2>
<p>Le client <strong>${current.customerName}</strong> (${current.customerEmail}) a ${status === 'accepted' ? 'accepté' : 'refusé'} l'offre pour <strong>${current.productName}</strong>.</p>
${status === 'accepted' ? `<p><strong>Prix :</strong> ${(current.finalPrice || 0).toLocaleString('fr-FR')} ${current.currency || 'EUR'}</p>` : ''}
<p><a href="${baseUrl}/admin/boutique">Voir dans l'admin</a></p>`,
      });
    } catch (emailErr) {
      console.warn('[QuoteRequest Respond] Admin notification email failed:', emailErr);
    }

    // Create bell notifications for all admins and commercials
    try {
      const usersSnapshot = await adminDb.collection('users')
        .where('role', 'in', ['admin', 'commercial'])
        .where('status', '==', 'approved')
        .get();

      const notifType = status === 'accepted' ? 'order_created' : 'estimation_rejected';
      const notifTitle = status === 'accepted' ? 'Devis accepté' : 'Devis refusé';
      const notifDesc = status === 'accepted'
        ? `${current.customerName} a accepté l'offre pour ${current.productName}`
        : `${current.customerName} a refusé l'offre pour ${current.productName}`;

      const batch = adminDb.batch();
      usersSnapshot.forEach((userDoc: any) => {
        const notifRef = adminDb.collection('notifications').doc();
        batch.set(notifRef, {
          userId: userDoc.id,
          type: notifType,
          title: notifTitle,
          description: notifDesc,
          href: '/admin/boutique',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (notifError) {
      console.warn('[QuoteRequest Respond] Bell notification creation failed:', notifError);
    }

    const responseData = {
      status,
      finalPrice: current.finalPrice || 0,
      currency: current.currency || 'EUR',
      customerName: current.customerName,
      customerEmail: current.customerEmail,
      productName: current.productName,
      productImage: current.productImage || '',
      productId: current.productId,
      quantity: current.quantity || 1,
      customerPhone: current.customerPhone || '',
      customerCountry: current.customerCountry || '',
      customerAddress: current.customerAddress || '',
      customerCity: current.customerCity || '',
      customerPostcode: current.customerPostcode || '',
      customerCompany: current.customerCompany || '',
    };

    return NextResponse.json({ message: `Devis ${status === 'accepted' ? 'accepté' : 'refusé'}`, data: responseData });
  } catch (err: any) {
    console.error('[QuoteRequest Respond] Error:', err);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}