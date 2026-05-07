
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account from env if possible, or look for common paths
// In this project, service account seems to be handled via env or a specific file
// I'll try to use the same logic as in the app if I can find it

async function dump() {
  // Try to initialize using same method as app
  if (!admin.apps.length) {
    const saPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(saPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.error('Service account not found');
      return;
    }
  }

  const db = admin.firestore();
  const snap = await db.collection('quotes').limit(5).get();
  
  if (snap.empty) {
    console.log('No quotes found');
    return;
  }

  snap.forEach(doc => {
    console.log(`--- DOC ${doc.id} ---`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

dump().catch(console.error);
