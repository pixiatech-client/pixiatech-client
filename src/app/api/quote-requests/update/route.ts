import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSmtpTransport } from '@/lib/smtpService';

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    const docRef = adminDb.collection('quote_requests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    const updatePayload: Record<string, any> = { ...data, updatedAt: new Date().toISOString() };
    delete updatePayload.id;
    delete updatePayload.createdAt;

    await docRef.update(updatePayload);

    // Send email to customer when offer is sent
    if (data.status === 'offer_sent') {
      const current = doc.data()!;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host') || 'localhost:3000'}`;
        const acceptUrl = `${baseUrl}/quote/respond/${id}?action=accept`;
        const declineUrl = `${baseUrl}/quote/respond/${id}?action=decline`;
        const { transporter, fromHeader } = await getSmtpTransport();
        const priceStr = data.finalPrice ? Number(data.finalPrice).toLocaleString('fr-FR') : '';
        await transporter.sendMail({
          from: fromHeader,
          to: current.customerEmail,
          subject: `Votre offre pour ${current.productName} vous a été envoyée`,
          html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f7f9fb;font-family:Manrope,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f7f9fb">
<tr><td style="padding:24px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background-color:#ffffff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">

<!-- Header -->
<tr><td style="padding:24px 32px;border-bottom:1px solid #E2E8F0">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
<tr>
<td style="vertical-align:middle">
<img src="${baseUrl}/favicon-512.png" alt="PIXIATECH" width="40" height="40" style="vertical-align:middle;margin-right:10px;border-radius:8px"/><span style="font-size:22px;font-weight:800;color:#000000;vertical-align:middle">PIXIATECH</span>
</td>
</tr>
</table>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px 32px 24px">

<!-- Title -->
<h1 style="font-size:32px;font-weight:800;color:#000000;margin:0 0 8px;letter-spacing:-0.02em">Offre envoyée</h1>
<p style="font-size:16px;color:#46464b;line-height:24px;margin:0 0 24px">Bonjour ${current.customerName},</p>

<!-- Product card -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#f2f4f6;border-radius:12px;border:1px solid #E2E8F0;margin-bottom:24px;overflow:hidden">
<tr><td style="padding:20px">
${current.productImage ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:12px">
<tr>
<td style="width:80px;vertical-align:top">
<img src="${current.productImage.startsWith('http') ? current.productImage : baseUrl + '/' + current.productImage}" alt="${current.productName}" width="80" height="80" style="width:80px;height:80px;border-radius:8px;object-fit:cover;display:block;background-color:#e2e8f0"/>
</td>
<td style="padding-left:16px;vertical-align:middle">
<p style="font-size:12px;font-weight:600;color:#4648d4;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px">DÉTAILS DU PRODUIT</p>
<p style="font-size:18px;font-weight:600;color:#191c1e;margin:0;line-height:28px">Nous avons le plaisir de vous informer que notre offre pour <strong style="color:#000000">${current.productName}</strong> vous a été transmise.</p>
</td>
</tr>
</table>` : `<p style="font-size:12px;font-weight:600;color:#4648d4;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px">DÉTAILS DU PRODUIT</p>
<p style="font-size:18px;font-weight:600;color:#191c1e;margin:0;line-height:28px">Nous avons le plaisir de vous informer que notre offre pour <strong style="color:#000000">${current.productName}</strong> vous a été transmise.</p>`}
</td></tr>
</table>

<!-- Price card -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#e6e8ea;border-radius:12px;border-left:4px solid #4648d4;margin-bottom:24px">
<tr><td style="padding:20px">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
<tr>
<td style="vertical-align:middle">
<p style="font-size:12px;font-weight:600;color:#46464b;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 4px">PRIX PROPOSÉ</p>
<span style="font-size:32px;font-weight:800;color:#000000;letter-spacing:-0.02em">${priceStr} ${data.currency || 'EUR'}</span>
</td>
</tr>
</table>
</td></tr>
</table>

<!-- CTA -->
<p style="font-size:16px;color:#46464b;line-height:24px;margin:0 0 20px">Merci de nous donner votre réponse :</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px">
<tr>
<td style="padding-bottom:12px">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
<tr>
<td style="width:50%;padding-right:8px">
<a href="${acceptUrl}" style="display:block;text-align:center;padding:16px 24px;background-color:#00966d;color:#ffffff;border-radius:12px;text-decoration:none;font-size:18px;font-weight:600;line-height:28px">Accepter l'offre</a>
</td>
<td style="width:50%;padding-left:8px">
<a href="${declineUrl}" style="display:block;text-align:center;padding:16px 24px;background-color:#ba1a1a;color:#ffffff;border-radius:12px;text-decoration:none;font-size:18px;font-weight:600;line-height:28px">Refuser l'offre</a>
</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- Fallback links -->
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #E2E8F0;padding-top:16px">
<tr><td>
<p style="font-size:12px;font-weight:500;color:#46464b;letter-spacing:0.05em;margin:0 0 8px">SI LES BOUTONS NE FONCTIONNENT PAS</p>
<p style="font-size:12px;color:#46464b;margin:0 0 4px">Accepter : <a href="${acceptUrl}" style="color:#4648d4">${acceptUrl}</a></p>
<p style="font-size:12px;color:#46464b;margin:0">Refuser : <a href="${declineUrl}" style="color:#4648d4">${declineUrl}</a></p>
</td></tr>
</table>

</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f7f9fb;border-top:1px solid #E2E8F0;padding:40px 32px;text-align:center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">
<tr><td style="padding-bottom:16px">
<a href="#" style="font-size:12px;font-weight:500;color:#46464b;text-decoration:none;padding:0 8px">Privacy Policy</a>
<a href="#" style="font-size:12px;font-weight:500;color:#46464b;text-decoration:none;padding:0 8px">Contact Support</a>
</td></tr>
<tr><td style="font-size:14px;color:#46464b;padding-bottom:8px">© ${new Date().getFullYear()} PIXIATECH. All rights reserved.</td></tr>
</table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
        });
      } catch (emailErr) {
        console.warn('[QuoteRequest] Offer sent email failed:', emailErr);
      }
    }

    return NextResponse.json({ message: 'Demande mise à jour' });
  } catch (err: any) {
    console.error('[QuoteRequest Update] Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
