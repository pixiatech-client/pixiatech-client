const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
console.log('GOOGLE_APPLICATION_CREDENTIALS set:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);

const admin = require('firebase-admin');
async function main() {
  if (admin.apps.length === 0) {
    const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
    admin.initializeApp({
      projectId: sa.project_id,
      credential: admin.credential.cert(sa),
    });
  }
  const db = admin.firestore();
  const doc = await db.collection('settings').doc('paypal').get();
  const payload = { exists: doc.exists, fields: [], hasSecret: false, hasId: false };
  if (doc.exists) {
    const d = doc.data() || {};
    payload.fields = Object.keys(d);
    payload.hasSecret = !!d.clientSecret;
    payload.hasId = !!d.clientId;
    payload.environment = d.environment || null;
  }
  console.log('RESULT: ' + JSON.stringify(payload));
  process.exit(0);
}
main().catch(e => { console.error('ERR ' + (e && e.stack ? e.stack : e)); process.exit(1); });
