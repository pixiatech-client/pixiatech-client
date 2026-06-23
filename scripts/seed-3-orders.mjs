import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

function getDb() {
  if (!getApps().length) {
    const privateKey = (process.env.ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.ADMIN_PROJECT_ID,
        clientEmail: process.env.ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getFirestore(getApp());
}

async function main() {
  const db = getDb();
  const email = 'ayanhil@gmail.com';

  // Find customer
  const snap = await db.collection('customers').where('email', '==', email).limit(1).get();
  if (snap.empty) {
    console.log('Customer not found. Create the account first.');
    process.exit(1);
  }
  const customer = { id: snap.docs[0].id, ...snap.docs[0].data() };
  console.log(`Found customer: ${customer.displayName || email} (${customer.id})`);

  // Fetch available boutique products
  const productsSnap = await db.collection('boutique_products').get();
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${products.length} boutique products.`);

  // Pick 3 products (or use fallbacks if none found)
  const selected = [];
  const fallbacks = [
    { id: 'led-p2-960x480', name: 'Écran LED P2 960x480mm', price: 899.00 },
    { id: 'led-p3-640x480', name: 'Écran LED P3 640x480mm', price: 450.00 },
    { id: 'prod-1', name: 'Écran LED Intérieur P1.2 High-End', price: 4500.00 },
  ];

  for (let i = 0; i < 3; i++) {
    const candidate = products[i] || { id: fallbacks[i].id, name: fallbacks[i].name, price: fallbacks[i].price };
    selected.push({
      id: candidate.id || fallbacks[i].id,
      name: candidate.name || candidate.productName || fallbacks[i].name,
      price: parseFloat(candidate.price || candidate.salePricePerSqM || fallbacks[i].price),
      image: candidate.image || candidate.imageUrl || '',
    });
  }

  const now = new Date();

  const orders = [
    {
      productId: selected[0].id,
      productName: selected[0].name,
      productImage: selected[0].image,
      productPrice: selected[0].price,
      quantity: 2,
      customerName: customer.displayName || customer.email?.split('@')[0] || 'Client',
      customerEmail: email,
      customerPhone: customer.phone || '+33600000000',
      customerAddress: '15 Rue de Rivoli',
      customerCity: 'Paris',
      customerPostcode: '75001',
      paypalOrderId: 'SEED_ORDER_001',
      paypalCaptureId: 'SEED_CAPTURE_001',
      amountPaid: Math.round(selected[0].price * 2 * 100) / 100,
      status: 'archive',
      customerId: customer.id,
      createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 86400000).toISOString(),
    },
    {
      productId: selected[1].id,
      productName: selected[1].name,
      productImage: selected[1].image,
      productPrice: selected[1].price,
      quantity: 1,
      customerName: customer.displayName || customer.email?.split('@')[0] || 'Client',
      customerEmail: email,
      customerPhone: customer.phone || '+33600000000',
      customerAddress: '15 Rue de Rivoli',
      customerCity: 'Paris',
      customerPostcode: '75001',
      paypalOrderId: 'SEED_ORDER_002',
      paypalCaptureId: 'SEED_CAPTURE_002',
      amountPaid: Math.round(selected[1].price * 1 * 100) / 100,
      status: 'commande',
      customerId: customer.id,
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      productId: selected[2].id,
      productName: selected[2].name,
      productImage: selected[2].image,
      productPrice: selected[2].price,
      quantity: 3,
      customerName: customer.displayName || customer.email?.split('@')[0] || 'Client',
      customerEmail: email,
      customerPhone: customer.phone || '+33600000000',
      customerAddress: '15 Rue de Rivoli',
      customerCity: 'Paris',
      customerPostcode: '75001',
      paypalOrderId: 'SEED_ORDER_003',
      paypalCaptureId: 'SEED_CAPTURE_003',
      amountPaid: Math.round(selected[2].price * 3 * 100) / 100,
      status: 'commande',
      customerId: customer.id,
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
  ];

  const batch = db.batch();
  const refs = orders.map(() => db.collection('sale_orders').doc());
  orders.forEach((order, i) => batch.set(refs[i], order));
  await batch.commit();

  console.log('\n3 orders created:');
  refs.forEach((ref, i) => {
    const o = orders[i];
    console.log(`  ✓ ${ref.id} — ${o.productName} x${o.quantity} — ${o.status} — ${o.amountPaid}€`);
  });
  console.log('\nDone.');
}

main().catch(console.error);
