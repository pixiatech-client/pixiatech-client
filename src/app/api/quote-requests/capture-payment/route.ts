import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { upsertCustomer } from '@/lib/customers';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';
import {
  PaypalAmountError,
  resolveOfferAmount,
  assertCompleted,
  getPaypalCaptureId,
} from '@/lib/paypal-amount';
import {
  reserveBoutiqueStock,
  releaseBoutiqueStock,
  paypalCaptureAlreadyUsed,
} from '@/lib/stock-reservation';

// Auth gate: a valid session cookie must be present to prevent anonymous abuse.
// PayPal orderId alone is not enough — it can leak through logs/network traces.
function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function hasValidSessionCookie(req: NextRequest): boolean {
  const clientSession = req.cookies.get('client_session')?.value;
  const adminSession = req.cookies.get('session')?.value;
  return Boolean(clientSession || adminSession);
}

function buildLoginEmailHtml(linkUrl: string, expiresInMinutes: number): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Connexion à votre espace client</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client et suivre votre commande.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Accéder à mon espace client
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildWelcomeEmailHtml(linkUrl: string, expiresInMinutes: number): string {
  const setPasswordUrl = `${linkUrl}&set-password=1`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">Merci pour votre commande</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">
            Votre compte client a été créé automatiquement avec votre adresse email.<br/>
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client et suivre vos commandes grâce au lien sécurisé.
            Ce lien expire dans ${expiresInMinutes} minutes.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <a href="${linkUrl}" style="display:inline-block;padding:14px 40px;background:#111827;color:#fff;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;">
            Accéder à mon espace client
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;border-top:1px solid #f0f0f0;">
          <p style="font-size:13px;color:#6b7280;margin:16px 0 8px;line-height:1.5;">
            Vous préférez utiliser un mot de passe ?
          </p>
          <a href="${setPasswordUrl}" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#111827;border:1px solid #d1d5db;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;">
            Créer mon mot de passe
          </a>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;line-height:1.4;">
            Si vous n'êtes pas à l'origine de cette commande, ignorez cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    if (!hasValidSessionCookie(req)) {
      return unauthorizedResponse();
    }

    const { orderId, quoteId, promoCode, promoDocId } = await req.json();
    if (!orderId || !quoteId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const { adminDb, FieldValue } = getFirebaseAdmin();

    // Montant attendu résolu côté serveur (quote_requests.finalPrice − promo serveur).
    const resolved = await resolveOfferAmount(quoteId, { promoCode, promoDocId });
    const quote = resolved.quote;

    // Réservation atomique du stock AVANT le débit. Un devis porte un produit
    // physique : s'il a du stock disponible on le réserve ; s'il est en
    // fabrication (stock nul/absent, sur commande) on laisse passer sans
    // décrémenter (`allowZeroStock`).
    const reservation = await reserveBoutiqueStock(
      [{ productId: quote.productId, type: 'purchase' as const, quantity: quote.quantity || 1 }],
      { allowZeroStock: true }
    );

    // Capture PayPal puis vérification du montant. En cas d'échec à ce stade,
    // on libère la réservation : jamais de stock consommé sans paiement.
    let capture: any;
    let capturedAmount: number;
    try {
      capture = await capturePayPalOrder(orderId);
      capturedAmount = assertCompleted(capture, resolved.amount);
    } catch (err) {
      await releaseBoutiqueStock(reservation).catch((e) =>
        console.error('[CapturePayment] Failed to release stock reservation:', e)
      );
      throw err;
    }

    const paypalCaptureId = getPaypalCaptureId(capture);
    const now = new Date().toISOString();
    const origin = req.nextUrl.origin;

    // Idempotence post-capture : si ce captureId a déjà engendré une commande,
    // la requête concurrente libère sa réservation et ne recrée pas de commande.
    if (await paypalCaptureAlreadyUsed(adminDb, paypalCaptureId)) {
      await releaseBoutiqueStock(reservation).catch((e) =>
        console.error('[CapturePayment] Failed to release stock reservation:', e)
      );
      return NextResponse.json({ status: 'COMPLETED', isNewCustomer: false, alreadyProcessed: true });
    }

    // Compte réel de la promo, uniquement après capture vérifiée.
    if (resolved.promoId) {
      try {
        await adminDb.collection('promo_codes').doc(resolved.promoId).update({
          currentUses: FieldValue.increment(1),
        });
      } catch (e) {
        console.warn('[CapturePayment] Failed to increment promo uses:', e);
      }
    }

    // Upsert customer & send magic link
    let customerId = '';
    if (quote.customerEmail) {
      const result = await upsertCustomer(quote.customerEmail, quote.customerName, quote.customerPhone);
      customerId = result.id;
      try {
        const { url } = await createMagicLink(quote.customerEmail, customerId, origin);
        const { transporter, fromHeader } = await getSmtpTransport();
        const html = result.isNew
          ? buildWelcomeEmailHtml(url, 15)
          : buildLoginEmailHtml(url, 15);
        await transporter.sendMail({
          from: fromHeader,
          to: quote.customerEmail,
          subject: result.isNew
            ? 'Bienvenue chez PIXIATECH — Confirmez votre email'
            : 'Connexion à votre espace client PIXIATECH',
          html,
        });
      } catch (emailErr) {
        console.warn('[CapturePayment] Magic link email failed:', emailErr);
      }
    }

    // Update quote status
    await adminDb.collection('quote_requests').doc(quoteId).update({
      status: 'awaiting_delivery',
      paypalOrderId: orderId,
      paypalCaptureId,
      amountPaid: capturedAmount,
      amountSource: resolved.source,
      promoCode: resolved.promoCode || '',
      customerId,
      updatedAt: now,
    });

    // Create sale order — montants autorisés côté serveur.
    await adminDb.collection('sale_orders').add({
      productId: quote.productId,
      productName: quote.productName,
      productImage: quote.productImage || '',
      quoteRequestId: quoteId,
      productPrice: resolved.subtotal,
      quantity: quote.quantity || 1,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: quote.customerPhone || '',
      customerAddress: quote.customerAddress || '',
      customerCity: quote.customerCity || '',
      customerPostcode: quote.customerPostcode || '',
      customerCountry: quote.customerCountry || 'FR',
      customerCompany: quote.customerCompany || '',
      customerId: customerId || null,
      deliveryCost: 0,
      paypalOrderId: orderId,
      paypalCaptureId,
      amountPaid: capturedAmount,
      subtotal: resolved.subtotal,
      discount: resolved.discount,
      vat: 0,
      totalCaptured: capturedAmount,
      amountSource: resolved.source,
      promoCode: resolved.promoCode || '',
      status: 'commande',
      stockAtOrder:
        reservation.length > 0
          ? { before: reservation[0].before, after: reservation[0].after }
          : null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ status: 'COMPLETED', isNewCustomer: !!customerId });
  } catch (err: any) {
    console.error('[CapturePayment] Error:', err);
    if (err instanceof PaypalAmountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}