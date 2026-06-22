import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { upsertCustomer } from '@/lib/customers';

export async function POST(req: NextRequest) {
  try {
    const { orderId, rentalItems, purchaseItems } = await req.json();
    const capture = await capturePayPalOrder(orderId);
    const paypalCaptureId = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id || capture?.id || '';
    const { adminDb } = getFirebaseAdmin();
    const now = new Date().toISOString();

    // Extract payer info from PayPal
    const payer = capture?.payer;
    const shipping = capture?.purchase_units?.[0]?.shipping;
    const payerName = payer?.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : '';
    const customerName = shipping?.name?.full_name || payerName || '';
    const customerEmail = payer?.email_address || '';
    const shippingAddress = shipping?.address || {};
    const customerAddress = shippingAddress?.address_line_1 || '';
    const customerCity = shippingAddress?.admin_area_2 || '';
    const customerPostcode = shippingAddress?.postal_code || '';

    // Upsert customer
    let customerId = '';
    if (customerEmail) {
      const result = await upsertCustomer(customerEmail, customerName);
      customerId = result.id;
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
          const ref = await adminDb.collection('rental_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: item.productPrice,
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
            amountPaid: item.productPrice * item.quantity,
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
          const ref = await adminDb.collection('sale_orders').add({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: item.productPrice,
            quantity: item.quantity,
            customerName,
            customerEmail,
            customerPhone: '',
            customerAddress,
            customerCity,
            customerPostcode,
            customerId,
            paypalOrderId: orderId,
            paypalCaptureId,
            amountPaid: item.productPrice * item.quantity,
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

    return NextResponse.json({ ...capture, rentalOrderIds, saleOrderIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
