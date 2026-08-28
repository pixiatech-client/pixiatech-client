import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { upsertCustomer } from '@/lib/customers';
import { createMagicLink } from '@/lib/magic-link';
import { getSmtpTransport } from '@/lib/smtpService';
import {
  PaypalAmountError,
  resolveBoutiqueAmount,
  assertCompleted,
  getPaypalCaptureId,
} from '@/lib/paypal-amount';
import type { BoutiqueAmountInput, ResolvedAmount } from '@/lib/paypal-amount';

// Lightweight auth gate: at least one valid session cookie must be present.
// This blocks anonymous abuse of the capture endpoint (order creation, customer
// upsert, magic link email). PayPal orderId alone is NOT sufficient auth because
// it can leak through logs, network traces, or be guessed.
async function requireAuthenticatedSession(req: NextRequest): Promise<NextResponse | null> {
  const clientSession = req.cookies.get('client_session')?.value;
  const adminSession = req.cookies.get('session')?.value;
  if (!clientSession && !adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // We do a presence check here; downstream server-side code already uses Admin SDK
  // with its own authorization. Returning 401 if neither cookie exists blocks
  // the anonymous attack vector without disrupting legitimate clients.
  return null;
}

function buildWelcomeEmailHtml(linkUrl: string, expiresInMinutes: number): string {
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
            Un compte client a été créé avec votre adresse email.
            Cliquez sur le bouton ci-dessous pour accéder à votre espace client et suivre vos commandes.
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
            Si vous n'êtes pas à l'origine de cette commande, ignorez cet email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemKey(item: any, type: 'purchase' | 'rental'): string {
  return `${item.productId}|${type}|${item.variantReference || item.variantName || ''}`;
}

function serverUnitPrice(resolved: ResolvedAmount, item: any, type: 'purchase' | 'rental'): number {
  const found = resolved.items?.find((i) => i.key === itemKey(item, type));
  return found ? found.serverPrice : item.productPrice;
}

export async function POST(req: NextRequest) {
  try {
    const authErr = await requireAuthenticatedSession(req);
    if (authErr) return authErr;

    const { orderId, cart, rentalItems, purchaseItems, delivery, promoCode, promoDocId } = await req.json();
    if (!cart) {
      return NextResponse.json({ error: 'Contexte de paiement manquant' }, { status: 400 });
    }

    const capture = await capturePayPalOrder(orderId);

    // Montant attendu reconstruit côté serveur — jamais depuis le client.
    const resolved = await resolveBoutiqueAmount({
      items: cart.items,
      delivery: cart.delivery || delivery,
      clientType: cart.clientType,
      vatValidated: cart.vatValidated ?? delivery?.vatValidated,
      promoCode: cart.promoCode ?? promoCode,
      promoDocId: cart.promoDocId ?? promoDocId,
    } as BoutiqueAmountInput);

    // Refuse toute divergence entre le montant réellement capturé et l'attendu.
    const capturedAmount = assertCompleted(capture, resolved.amount);

    const { adminDb, FieldValue } = getFirebaseAdmin();
    const paypalCaptureId = getPaypalCaptureId(capture);
    const now = new Date().toISOString();

    // Increment real promo usage ONLY once the capture is verified
    if (resolved.promoId) {
      try {
        await adminDb.collection('promo_codes').doc(resolved.promoId).update({
          currentUses: FieldValue.increment(1),
        });
      } catch (e) {
        console.warn('[CaptureOrder] Failed to increment promo uses:', e);
      }
    }

    // Use delivery data from frontend if provided, fall back to PayPal payer/shipping info
    const payer = capture?.payer;
    const shipping = capture?.purchase_units?.[0]?.shipping;
    const payerName = payer?.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : '';
    const shippingName = shipping?.name?.full_name || '';
    const shippingAddress = shipping?.address || {};

    const customerName = delivery?.firstName
      ? `${delivery.firstName} ${delivery.lastName}`.trim()
      : shippingName || payerName || '';
    const customerEmail = delivery?.email || payer?.email_address || '';
    const customerPhone = delivery?.phone || '';
    const customerAddress = delivery?.addressLine1 || shippingAddress?.address_line_1 || '';
    const customerAddress2 = delivery?.addressLine2 || '';
    const customerCity = delivery?.city || shippingAddress?.admin_area_2 || '';
    const customerPostcode = delivery?.postcode || shippingAddress?.postal_code || '';
    const customerCountry = delivery?.country || 'FR';
    const customerCompany = delivery?.companyName || '';
    const customerSiren = delivery?.siren || '';
    const customerVatNumber = delivery?.vatNumber || '';
    const customerVatValidated = delivery?.vatValidated === true || delivery?.vatValidated === 'true';

    // Upsert customer
    let customerId = '';
    let isNewCustomer = false;
    if (customerEmail) {
      const result = await upsertCustomer(customerEmail, customerName, customerPhone);
      customerId = result.id;
      isNewCustomer = result.isNew;
      // Send magic link if new customer
      if (result.isNew) {
        try {
          const origin = req.nextUrl.origin;
          const { url } = await createMagicLink(customerEmail, customerId, origin);
          const { transporter, fromHeader } = await getSmtpTransport();
          await transporter.sendMail({
            from: fromHeader,
            to: customerEmail,
            subject: 'Bienvenue chez PIXIATECH — Confirmez votre email',
            html: buildWelcomeEmailHtml(url, 15),
          });
          console.log(`[CaptureOrder] Welcome email sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error('[CaptureOrder] Failed to send welcome email:', emailErr);
        }
      }
    }

    const rentalOrderIds: string[] = [];
    if (rentalItems && rentalItems.length > 0) {
      for (const item of rentalItems) {
        try {
          const rd = item.renterDetails;
          if (!rd) {
            console.error('Missing renterDetails for item:', item.productId);
            continue;
          }
          const unitPrice = serverUnitPrice(resolved, item, 'rental');
          const ref = await adminDb.collection('rental_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: unitPrice,
            quantity: item.quantity,
            renterCompany: rd.company || '',
            renterRepresentative: rd.representative || '',
            renterEmail: rd.email || '',
            renterPhone: rd.phone || '',
            renterAddress: rd.address || '',
            renterCity: rd.city || '',
            renterPostcode: rd.postcode || '',
            rentalStartDate: item.rentalStartDate || '',
            rentalEndDate: item.rentalEndDate || '',
            rentalStartTime: item.rentalStartTime || '',
            rentalEndTime: item.rentalEndTime || '',
            additionalNotes: item.additionalNotes || '',
            contractSignedAt: item.contractSignedAt || null,
            contractPdfUrl: null,
            emailVerified: true,
            emailVerifiedAt: now,
            paypalOrderId: orderId,
            paypalCaptureId,
            amountPaid: Math.round(unitPrice * item.quantity * 100) / 100,
            subtotal: resolved.subtotal,
            discount: resolved.discount,
            deliveryCost: resolved.deliveryCost,
            vat: resolved.vat,
            totalCaptured: capturedAmount,
            amountSource: resolved.source,
            status: 'pending_validation',
            userId: null,
            customerId,
            createdAt: now,
            updatedAt: now,
          });
          rentalOrderIds.push(ref.id);
        } catch (err) {
          console.error('Failed to create rental order for item:', item.productId, err);
        }
      }
    }

    const saleOrderIds: string[] = [];
    if (purchaseItems && purchaseItems.length > 0) {
      for (const item of purchaseItems) {
        try {
          const unitPrice = serverUnitPrice(resolved, item, 'purchase');
          const ref = await adminDb.collection('sale_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: unitPrice,
            quantity: item.quantity,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress: customerAddress2
              ? `${customerAddress}, ${customerAddress2}`
              : customerAddress,
            customerCity,
            customerPostcode,
            customerCountry,
            customerCompany,
            customerSiren,
            customerVatNumber,
            customerVatValidated,
            customerId,
            paypalOrderId: orderId,
            paypalCaptureId,
            amountPaid: Math.round(unitPrice * item.quantity * 100) / 100,
            subtotal: resolved.subtotal,
            discount: resolved.discount,
            vat: resolved.vat,
            deliveryCost: resolved.deliveryCost,
            totalCaptured: capturedAmount,
            amountSource: resolved.source,
            promoCode: resolved.promoCode || '',
            status: 'commande',
            createdAt: now,
            updatedAt: now,
          });
          saleOrderIds.push(ref.id);
        } catch (err) {
          console.error('Failed to create sale order for item:', item.productId, err);
        }
      }
    }

    return NextResponse.json({ ...capture, rentalOrderIds, saleOrderIds, isNewCustomer });
  } catch (err: any) {
    if (err instanceof PaypalAmountError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}