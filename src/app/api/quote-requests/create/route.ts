import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSmtpTransport } from '@/lib/smtpService';

const REQUIRED_FIELDS = ['productId', 'productName', 'quantity', 'customerName', 'customerPhone', 'customerEmail', 'customerCountry', 'customerAddress'] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    for (const field of REQUIRED_FIELDS) {
      if (!body[field]) {
        return NextResponse.json({ error: `Le champ '${field}' est requis` }, { status: 400 });
      }
    }

    if (typeof body.quantity !== 'number' || body.quantity < 1) {
      return NextResponse.json({ error: 'La quantité doit être un nombre positif' }, { status: 400 });
    }

    if (typeof body.customerEmail !== 'string' || !body.customerEmail.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const now = new Date().toISOString();

    const docRef = await adminDb.collection('quote_requests').add({
      productId: body.productId,
      productName: body.productName,
      productImage: body.productImage || '',
      quantity: body.quantity,
      customerName: body.customerName.trim(),
      customerCompany: body.customerCompany?.trim() || '',
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail.toLowerCase().trim(),
      customerCountry: body.customerCountry.trim(),
      customerAddress: body.customerAddress.trim(),
      customerCity: body.customerCity?.trim() || '',
      customerPostcode: body.customerPostcode?.trim() || '',
      comment: body.comment?.trim() || '',
      adminNotes: '',
      status: 'pending_supplier',
      currency: 'EUR',
      createdAt: now,
      updatedAt: now,
    });

    try {
      const { transporter, fromHeader } = await getSmtpTransport();
      await transporter.sendMail({
        from: fromHeader,
        to: 'devis@pixiatech.com',
        subject: `Nouvelle demande de devis - ${body.productName}`,
        html: `
          <h2>Nouvelle demande de devis</h2>
          <p><strong>Produit :</strong> ${body.productName}</p>
          <p><strong>Quantité :</strong> ${body.quantity}</p>
          <p><strong>Client :</strong> ${body.customerName}</p>
          <p><strong>Email :</strong> ${body.customerEmail}</p>
          <p><strong>Téléphone :</strong> ${body.customerPhone}</p>
          ${body.customerCompany ? `<p><strong>Société :</strong> ${body.customerCompany}</p>` : ''}
          <p><strong>Pays :</strong> ${body.customerCountry}</p>
          <p><strong>Adresse :</strong> ${body.customerAddress}</p>
          ${body.comment ? `<p><strong>Commentaire :</strong> ${body.comment}</p>` : ''}
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/boutique?tab=sur-commande">Voir dans l'administration</a></p>
        `,
      });
    } catch (emailErr) {
      console.warn('[QuoteRequest] Email notification failed:', emailErr);
    }

    return NextResponse.json({ id: docRef.id, message: 'Demande de devis envoyée avec succès' });
  } catch (err: any) {
    console.error('[QuoteRequest] Error:', err);
    return NextResponse.json({ error: "Erreur lors de l'envoi de la demande" }, { status: 500 });
  }
}
