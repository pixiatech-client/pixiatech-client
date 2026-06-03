const { getFirebaseAdmin } = require('../src/lib/firebase-admin');

async function run() {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) {
    console.error('adminDb not initialized');
    process.exit(1);
  }
  const snap = await adminDb.collection('quotes').get();
  console.log('Total quotes:', snap.size);
  const types = {};
  snap.forEach(doc => {
    const data = doc.data();
    const type = data.transactionType || 'undefined';
    types[type] = (types[type] || 0) + 1;
  });
  console.log('Quote types:', types);
  process.exit(0);
}

run().catch(console.error);
