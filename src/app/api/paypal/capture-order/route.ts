import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/paypal';
import { createRentalOrder } from '@/lib/rental-orders';

export async function POST(req: NextRequest) {
  try {
    const { orderId, rentalItems } = await req.json();
    const capture = await capturePayPalOrder(orderId);

    const rentalOrderIds: string[] = [];
    if (rentalItems && rentalItems.length > 0) {
      for (const item of rentalItems) {
        try {
          const id = await createRentalOrder({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            productPrice: item.productPrice,
            quantity: item.quantity,
            renterCompany: item.renterDetails.company,
            renterRepresentative: item.renterDetails.representative,
            renterEmail: item.renterDetails.email,
            renterPhone: item.renterDetails.phone,
            renterAddress: item.renterDetails.address,
            renterCity: item.renterDetails.city,
            renterPostcode: item.renterDetails.postcode,
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            rentalStartTime: item.rentalStartTime,
            rentalEndTime: item.rentalEndTime,
            additionalNotes: '',
            contractSignedAt: null,
            contractPdfUrl: null,
            emailVerified: true,
            emailVerifiedAt: new Date().toISOString(),
            paypalOrderId: orderId,
            paypalCaptureId: capture.id,
            amountPaid: item.productPrice * item.quantity,
            status: 'pending_validation',
            userId: null,
          });
          rentalOrderIds.push(id);
        } catch (err) {
          console.error('Failed to create rental order for item:', item.productId, err);
        }
      }
    }

    return NextResponse.json({ ...capture, rentalOrderIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
