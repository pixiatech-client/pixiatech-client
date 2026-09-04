const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env.local');
console.log('envPath exists:', fs.existsSync(envPath), '|', envPath);
if (fs.existsSync(envPath)) {
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
console.log('SA set:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);

const admin = require('firebase-admin');
async function main() {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  admin.initializeApp({ projectId: sa.project_id, credential: admin.credential.cert(sa) });
  const db = admin.firestore();
  const doc = await db.collection('settings').doc('main').get();
  if (!doc.exists) { console.log('settings/main NOT FOUND'); process.exit(0); }
  const d = doc.data() || {};
  const ef = d.estimationFlow || {};
  console.log('estimationFlow keys:', Object.keys(ef));
  console.log('estimationFlow.boutiqueB2B:', ef.boutiqueB2B, '(type ' + typeof ef.boutiqueB2B + ')');
  console.log('estimationFlow.taxRate:', ef.taxRate);
  process.exit(0);
}
main().catch(e => { console.error('ERR ' + (e && e.stack ? e.stack : e)); process.exit(1); });
