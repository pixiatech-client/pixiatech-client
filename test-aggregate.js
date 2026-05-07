const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { AggregateField } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

async function test() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
      })
    });
  }
  const db = getFirestore();
  
  try {
    const snapshot = await db.collection('quotes').where('status', '==', 'processed').aggregate({
      count: AggregateField.count(),
      sumClient: AggregateField.sum('totalClient')
    }).get();
    
    console.log('Processed aggregation result:', snapshot.data());
    
    const snap = await db.collection('quotes').where('status', '==', 'processed').get();
    console.log(`Manual get size: ${snap.size}`);
  } catch(e) {
    console.error('Aggregation failed:', e);
  }
}
test();
