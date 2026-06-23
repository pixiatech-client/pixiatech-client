import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'serviceAccountKey.json'), 'utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  const email = 'ayanhil@gmail.com';

  // Find customer
  const snap = await db.collection('customers').where('email', '==', email).limit(1).get();
  if (snap.empty) {
    console.log('Customer not found. Create the account first.');
    process.exit(1);
  }
  const customer = { id: snap.docs[0].id, ...snap.docs[0].data() };
  console.log(`Found customer: ${customer.displayName} (${customer.id})`);

  const now = new Date();

  // Fake order 1 - completed/archived (older)
  const order1 = {
    productId: 'led-p2-960x480',
    productName: 'Écran LED P2 960x480mm',
    productImage: '',
    productPrice: 899.00,
    quantity: 2,
    customerName: customer.displayName,
    customerEmail: email,
    customerPhone: '+33612345678',
    customerAddress: '15 Avenue des Champs-Élysées',
    customerCity: 'Paris',
    customerPostcode: '75008',
    paypalOrderId: 'FAKE_ORDER_001',
    paypalCaptureId: 'FAKE_CAPTURE_001',
    amountPaid: 1798.00,
    status: 'archive',
    customerId: customer.id,
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Fake order 2 - in progress (recent)
  const order2 = {
    productId: 'led-p3-640x480',
    productName: 'Écran LED P3 640x480mm',
    productImage: '',
    productPrice: 450.00,
    quantity: 3,
    customerName: customer.displayName,
    customerEmail: email,
    customerPhone: '+33612345678',
    customerAddress: '15 Avenue des Champs-Élysées',
    customerCity: 'Paris',
    customerPostcode: '75008',
    paypalOrderId: 'FAKE_ORDER_002',
    paypalCaptureId: 'FAKE_CAPTURE_002',
    amountPaid: 1350.00,
    status: 'commande',
    customerId: customer.id,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const batch = db.batch();
  const ref1 = db.collection('sale_orders').doc();
  const ref2 = db.collection('sale_orders').doc();

  batch.set(ref1, order1);
  batch.set(ref2, order2);

  await batch.commit();

  console.log(`✓ Order 1: ${ref1.id} — ${order1.productName} x${order1.quantity} — ${order1.status} — ${order1.amountPaid}€`);
  console.log(`✓ Order 2: ${ref2.id} — ${order2.productName} x${order2.quantity} — ${order2.status} — ${order2.amountPaid}€`);
  console.log('\nDone. 2 fake orders added.');
}

main().catch(console.error);
