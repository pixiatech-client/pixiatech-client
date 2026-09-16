import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { requireRole } from '@/lib/auth-guards';
import {
  INVOICES_COLLECTION,
  getCompanySnapshot,
  buildInvoiceItems,
  computeInvoiceAmounts,
  type InvoiceItem,
} from '@/lib/invoices';
import { generateInvoicePdf, type InvoicePdfBuyer } from '@/lib/server-invoice-pdf';
import { getProfessionalInfo } from '@/lib/professional-info';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin', 'commercial');

    const { id } = await params;
    if (!id || !/^(sale|rental)_/.test(id)) {
      return NextResponse.json({ error: 'Identifiant de facture invalide' }, { status: 400 });
    }

    const { adminDb } = getFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: 'Base de données indisponible' }, { status: 500 });
    }

    const invoiceRef = adminDb.collection(INVOICES_COLLECTION).doc(id);
    const snap = await invoiceRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    const doc = snap.data() || {};
    let pdfContent = typeof doc.pdfContent === 'string' ? doc.pdfContent : '';
    const invoiceNumber = String(doc.invoiceNumber || doc.orderNumber || id.replace(/^(sale|rental)_/, 'PIX-'));

    // Si aucun PDF n'a encore été généré pour ce projet, on génère le modèle officiel
    // avec le template standardisé identique à celui de l'espace client.
    if (!pdfContent) {
      try {
        const orderType: 'sale' | 'rental' = doc.orderType === 'rental' ? 'rental' : 'sale';
        const orderId = typeof doc.orderId === 'string' && doc.orderId ? doc.orderId : id.replace(/^(sale|rental)_/, '');
        const customerId = String(doc.customerId || doc.userId || '');

        const orderColl = orderType === 'sale' ? 'sale_orders' : 'rental_orders';
        let order: Record<string, unknown> | null = null;
        try {
          const orderSnap = await adminDb.collection(orderColl).doc(orderId).get();
          if (orderSnap.exists) order = orderSnap.data() || null;
        } catch {
          // ignore
        }

        const billing = doc.billing && typeof doc.billing === 'object' ? doc.billing : {};
        const profInfo = customerId ? await getProfessionalInfo(customerId).catch(() => null) : null;

        const buyerCompany =
          orderType === 'sale'
            ? String((order as any)?.customerCompany || billing.companyName || doc.customerCompany || doc.companyName || '')
            : String((order as any)?.renterCompany || billing.companyName || doc.renterCompany || doc.companyName || '');

        const isB2B = !!profInfo || !!buyerCompany || doc.isB2B === true;
        const vatValidated = !!(profInfo?.vatValidated && profInfo?.vatNumber);
        const vatNumber = profInfo?.vatNumber || doc.vatNumber || '';

        let adminTaxRate = 19;
        try {
          const settingsSnap = await adminDb.collection('settings').doc('main').get();
          const s = settingsSnap.exists ? settingsSnap.data() || {} : {};
          if (typeof (s as any)?.estimationFlow?.taxRate === 'number' && (s as any).estimationFlow.taxRate >= 0) {
            adminTaxRate = (s as any).estimationFlow.taxRate;
          }
        } catch {
          // ignore
        }

        const items: InvoiceItem[] = order
          ? buildInvoiceItems(order)
          : Array.isArray(doc.items) && doc.items.length > 0
            ? (doc.items as InvoiceItem[])
            : [];

        const amounts = order
          ? computeInvoiceAmounts(order, { vatValidated, vatNumber, vatRate: adminTaxRate / 100 })
          : {
              subtotal: Number(doc.subtotal) || 0,
              discount: Number(doc.discount) || 0,
              deliveryCost: Number(doc.deliveryCost) || 0,
              vat: Number(doc.vat) || 0,
              vatRate: Number(doc.vatRate) >= 0 ? Number(doc.vatRate) : adminTaxRate / 100,
              totalTtc: Number(doc.totalTtc) || 0,
            };

        const company = await getCompanySnapshot(adminDb);
        const customerName = String(
          (order as any)?.customerName ||
            (order as any)?.renterRepresentative ||
            doc.customerName ||
            doc.clientName ||
            billing.fullName ||
            billing.name ||
            'Client'
        );
        const customerEmail = String((order as any)?.customerEmail || (order as any)?.renterEmail || doc.customerEmail || billing.email || '');

        const buyer: InvoicePdfBuyer = {
          name: customerName,
          company: buyerCompany || profInfo?.companyName || undefined,
          address:
            String((order as any)?.customerAddress || (order as any)?.renterAddress || doc.address || billing.address || '') ||
            profInfo?.address ||
            undefined,
          city:
            String((order as any)?.customerCity || (order as any)?.renterCity || doc.city || billing.city || '') ||
            profInfo?.city ||
            undefined,
          postcode:
            String((order as any)?.customerPostcode || (order as any)?.renterPostcode || doc.postcode || billing.postcode || '') ||
            profInfo?.postcode ||
            undefined,
          country:
            String((order as any)?.customerCountry || (order as any)?.renterCountry || doc.country || billing.country || '') ||
            profInfo?.country ||
            undefined,
          siren:
            String(
              (order as any)?.customerSiren || doc.siren || (profInfo?.siret ? profInfo.siret.slice(0, 9) : '')
            ) || undefined,
          vatNumber: String((order as any)?.customerVatNumber || doc.vatNumber || profInfo?.vatNumber || '') || undefined,
          email: customerEmail || undefined,
        };

        const orderDate = String(
          (order as any)?.createdAt || doc.orderDate || doc.requestedAt || doc.createdAt || new Date().toISOString()
        );

        pdfContent = generateInvoicePdf({
          invoiceNumber,
          orderType,
          orderDate,
          company,
          buyer,
          isB2B,
          vatValidated,
          rentalStartDate: (order as any)?.rentalStartDate || doc.rentalStartDate || undefined,
          rentalEndDate: (order as any)?.rentalEndDate || doc.rentalEndDate || undefined,
          items: items.length > 0 ? items : [{ productName: 'Produit', variantName: null, productImage: null, quantity: 1, unitPrice: amounts.subtotal, lineTotal: amounts.subtotal }],
          subtotal: amounts.subtotal,
          discount: amounts.discount,
          deliveryCost: amounts.deliveryCost,
          vat: amounts.vat,
          vatRate: amounts.vatRate,
          totalTtc: amounts.totalTtc,
          promoCode: (order as any)?.promoCode || doc.promoCode || undefined,
        });

        // Enregistre en cache sur le document de manière asynchrone
        invoiceRef.update({
          pdfContent,
          pdfSize: Buffer.byteLength(Buffer.from(pdfContent, 'base64')),
          hasPdf: true,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      } catch (genErr) {
        console.error('[AdminInvoicePdf] Failed to auto-generate PDF model:', genErr);
      }
    }

    if (!pdfContent) {
      return NextResponse.json({ error: 'PDF non disponible' }, { status: 500 });
    }

    const pdfBuffer = Buffer.from(pdfContent, 'base64');
    const isAttachment = req.nextUrl.searchParams.get('download') === '1';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isAttachment
          ? `attachment; filename="facture-${invoiceNumber}.pdf"`
          : `inline; filename="facture-${invoiceNumber}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err?.status || 500 });
  }
}