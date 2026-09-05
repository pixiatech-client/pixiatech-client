import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getClientSessionCustomerId } from '@/lib/client-session';
import { getSmtpTransport } from '@/lib/smtpService';
import { getProfessionalInfo } from '@/lib/professional-info';
import {
  SALE_BILLABLE_STATUSES,
  RENTAL_BILLABLE_STATUSES,
  invoiceDocId,
  allocateInvoiceNumber,
  getCompanySnapshot,
  buildInvoiceItems,
  computeInvoiceAmounts,
  type InvoiceDoc,
  type InvoiceItem,
} from '@/lib/invoices';
import { generateInvoicePdf, type InvoicePdfBuyer } from '@/lib/server-invoice-pdf';

function buildInvoiceEmailHtml(invoiceNumber: string, customerName: string, totalTtc: number): string {
  const formatted = `${totalTtc.toFixed(2).replace('.', ',')} €`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="padding:32px 32px 0;">
          <h1 style="font-size:20px;font-weight:800;color:#111827;margin:0 0 8px;">Votre facture ${invoiceNumber}</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 16px;line-height:1.5;">
            Bonjour ${customerName || ''},<br/>
            Merci pour votre commande. Votre facture ${invoiceNumber} d'un montant de <strong>${formatted}</strong> est disponible en pièce jointe.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;border-top:1px solid #f0f0f0;">
          <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;line-height:1.4;">
            Vous pouvez également retrouver cette facture dans votre espace client, rubrique « Mes factures ».
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderAsAny(order: Record<string, unknown>) {
  return order as any;
}

export async function POST(req: NextRequest) {
  try {
    const customerId = await getClientSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;
    const orderType = body?.orderType;

    if (typeof orderId !== 'string' || !orderId) {
      return NextResponse.json({ error: 'orderId requis' }, { status: 400 });
    }
    if (orderType !== 'sale' && orderType !== 'rental') {
      return NextResponse.json({ error: 'orderType invalide (attendu sale ou rental)' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();

    const orderColl = orderType === 'sale' ? 'sale_orders' : 'rental_orders';
    const orderRef = adminDb.collection(orderColl).doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }
    const order = orderSnap.data() as Record<string, unknown>;
    const o = orderAsAny(order);

    if (!o.customerId || o.customerId !== customerId) {
      return NextResponse.json({ error: 'Commande non accessible' }, { status: 403 });
    }

    const billableStatuses = orderType === 'sale' ? SALE_BILLABLE_STATUSES : RENTAL_BILLABLE_STATUSES;
    if (!billableStatuses.includes(o.status)) {
      return NextResponse.json(
        { error: `La commande (statut « ${o.status || 'inconnu'} ») n'est pas facturable` },
        { status: 400 }
      );
    }

    const invoiceRef = adminDb.collection('invoices').doc(invoiceDocId(orderType, orderId));
    const existingSnap = await invoiceRef.get();
    if (existingSnap.exists) {
      return NextResponse.json({ error: 'Une facture existe déjà pour cette commande' }, { status: 409 });
    }

    const profInfo = await getProfessionalInfo(customerId);
    const buyerCompany =
      orderType === 'sale'
        ? String(o.customerCompany || '')
        : String(o.renterCompany || '');

    const isB2B = !!profInfo || !!buyerCompany;
    const vatValidated = profInfo ? profInfo.vatValidated === true : false;
    const vatRate: 0 | 0.2 = profInfo ? (profInfo.vatRate === 0 ? 0 : 0.2) : 0.2;

    const items: InvoiceItem[] = buildInvoiceItems(order);
    const amounts = computeInvoiceAmounts(order, { vatValidated, vatRate });
    const company = await getCompanySnapshot(adminDb);

    const customerName = String(o.customerName || o.renterRepresentative || profInfo?.companyName || '');
    const customerEmail = String(o.customerEmail || o.renterEmail || profInfo?.companyEmail || '');

    const buyer: InvoicePdfBuyer = {
      name: customerName,
      company: buyerCompany || profInfo?.companyName || undefined,
      address: String(
        orderType === 'sale' ? o.customerAddress || '' : o.renterAddress || ''
      ) || profInfo?.address || undefined,
      city:
        String(orderType === 'sale' ? o.customerCity || '' : o.renterCity || '') ||
        profInfo?.city ||
        undefined,
      postcode:
        String(orderType === 'sale' ? o.customerPostcode || '' : o.renterPostcode || '') ||
        profInfo?.postcode ||
        undefined,
      country: String(orderType === 'sale' ? o.customerCountry || '' : o.renterCountry || '') || profInfo?.country || undefined,
      siren: String(o.customerSiren || (profInfo?.siret ? profInfo.siret.slice(0, 9) : '')) || undefined,
      vatNumber: String(o.customerVatNumber || profInfo?.vatNumber || '') || undefined,
      email: customerEmail || undefined,
    };

    const { invoiceNumber } = await allocateInvoiceNumber(adminDb);

    const orderDate = String(o.createdAt || new Date().toISOString());
    const generatedAt = new Date().toISOString();

    const pdfContent = generateInvoicePdf({
      invoiceNumber,
      orderType,
      orderDate,
      company,
      buyer,
      isB2B,
      vatValidated,
      rentalStartDate: o.rentalStartDate || undefined,
      rentalEndDate: o.rentalEndDate || undefined,
      items,
      subtotal: amounts.subtotal,
      discount: amounts.discount,
      deliveryCost: amounts.deliveryCost,
      vat: amounts.vat,
      vatRate: amounts.vatRate,
      totalTtc: amounts.totalTtc,
    });

    const invoiceDoc: InvoiceDoc = {
      ...company,
      orderId,
      orderType,
      customerId,
      customerEmail,
      customerName,
      invoiceNumber,
      status: 'generated',
      isB2B,
      vatValidated,
      items,
      subtotal: amounts.subtotal,
      discount: amounts.discount,
      deliveryCost: amounts.deliveryCost,
      vat: amounts.vat,
      vatRate: amounts.vatRate,
      totalTtc: amounts.totalTtc,
      orderDate,
      generatedAt,
      // TODO: Migrer vers Firebase Storage quand les factures dépassent 500 Ko
      // ou quand le volume dépasse 1000 factures/mois.
      pdfContent,
      pdfSize: Buffer.byteLength(Buffer.from(pdfContent, 'base64')),
    };

    await invoiceRef.set(invoiceDoc);

    let emailSentAt: string | undefined;
    if (customerEmail) {
      try {
        const { transporter, fromHeader } = await getSmtpTransport();
        await transporter.sendMail({
          from: fromHeader,
          to: customerEmail,
          subject: `Votre facture ${invoiceNumber} — PIXIATECH`,
          html: buildInvoiceEmailHtml(invoiceNumber, customerName, amounts.totalTtc),
          // nodemailer supports attachments: pièce jointe PDF en base64.
          attachments: [
            {
              filename: `facture-${invoiceNumber}.pdf`,
              content: Buffer.from(pdfContent, 'base64'),
              contentType: 'application/pdf',
            },
          ],
        });
        emailSentAt = new Date().toISOString();
        await invoiceRef.update({ emailSentAt, status: 'sent' });
      } catch (err) {
        // Fallback e-mail : la facture est créée et téléchargeable même si
        // l'envoi échoue (SMTP down, adresse invalide, etc.). Statut :
        // 'generated' (à renvoyer). Le champ emailSentAt reste absent.
        console.error('[InvoicesGenerate] Failed to send invoice email:', err);
      }
    }

    const returned: Record<string, unknown> = { ...invoiceDoc };
    delete returned.pdfContent;
    return NextResponse.json({ invoice: returned, emailSentAt: emailSentAt || null }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}