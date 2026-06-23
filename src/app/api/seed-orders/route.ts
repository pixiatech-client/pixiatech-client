import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  const { adminDb } = getFirebaseAdmin();

  const email = 'ayanhil@gmail.com';
  const snap = await adminDb.collection('customers').where('email', '==', email).limit(1).get();

  if (snap.empty) {
    return NextResponse.json({ error: `Customer ${email} not found. Create the account first.` }, { status: 404 });
  }

  const customerId = snap.docs[0].id;
  const now = new Date();

  // Fake order 1 — archived (delivered), 7 days ago
  const order1 = {
    productId: 'led-p2-960x480',
    productName: 'Écran LED P2 960x480mm',
    productImage: '',
    productPrice: 899.00,
    quantity: 2,
    customerName: 'Jean Dupont',
    customerEmail: email,
    customerPhone: '+33612345678',
    customerAddress: '15 Avenue des Champs-Élysées',
    customerCity: 'Paris',
    customerPostcode: '75008',
    paypalOrderId: 'FAKE_ORDER_001',
    paypalCaptureId: 'FAKE_CAPTURE_001',
    amountPaid: 1798.00,
    status: 'archive',
    customerId,
    createdAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
  };

  // Fake order 2 — in progress (commande), 2 days ago
  const order2 = {
    productId: 'led-p3-640x480',
    productName: 'Écran LED P3 640x480mm',
    productImage: '',
    productPrice: 450.00,
    quantity: 3,
    customerName: 'Jean Dupont',
    customerEmail: email,
    customerPhone: '+33612345678',
    customerAddress: '15 Avenue des Champs-Élysées',
    customerCity: 'Paris',
    customerPostcode: '75008',
    paypalOrderId: 'FAKE_ORDER_002',
    paypalCaptureId: 'FAKE_CAPTURE_002',
    amountPaid: 1350.00,
    status: 'commande',
    customerId,
    createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
  };

  const batch = adminDb.batch();
  const ref1 = adminDb.collection('sale_orders').doc();
  const ref2 = adminDb.collection('sale_orders').doc();
  batch.set(ref1, order1);
  batch.set(ref2, order2);
  await batch.commit();

  return NextResponse.json({
    message: '2 fake orders added',
    orders: [
      { id: ref1.id, ...order1 },
      { id: ref2.id, ...order2 },
    ],
  });
}
