import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const { adminDb } = getFirebaseAdmin();
    const now = new Date();
    const ref = await adminDb.collection('sale_orders').add({
      productId: 'test-tracking-001',
      productName: 'TEST - Écran LED P2 960x480mm',
      productImage: '',
      productPrice: 599,
      quantity: 1,
      customerName: 'Client Test Tracking',
      customerEmail: 'test@pixia.com',
      customerPhone: '+33600000000',
      customerAddress: '1 Rue Test',
      customerCity: 'Paris',
      customerPostcode: '75001',
      paypalOrderId: 'TEST_TRACK_001',
      paypalCaptureId: 'TEST_TRACK_CAP_001',
      amountPaid: 599,
      status: 'commande',
      customerId: 'test-customer-track',
      trackingNumber: 'RX123456789FR',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    return NextResponse.json({ id: ref.id, message: 'Test order created with tracking RX123456789FR' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
