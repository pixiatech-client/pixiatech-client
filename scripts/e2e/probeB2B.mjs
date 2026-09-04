import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv(resolve(__dirname, '..', '..', '.env.local'));
loadEnv(resolve(__dirname, '..', '..', '.env'));

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.ADMIN_PROJECT_ID || 'pixiatech-client';
    initializeApp({ projectId });
  }
  return getFirestore();
}

async function main() {
  const db = getDb();
  const doc = await db.collection('settings').doc('main').get();
  if (!doc.exists) { console.log('settings/main NOT FOUND'); process.exit(0); }
  const d = doc.data() || {};
  const ef = d.estimationFlow || {};
  console.log('estimationFlow keys:', Object.keys(ef).join(','));
  console.log('estimationFlow.boutiqueB2B:', JSON.stringify(ef.boutiqueB2B), '(type ' + typeof ef.boutiqueB2B + ')');
  console.log('estimationFlow.taxRate:', ef.taxRate);
  process.exit(0);
}
main().catch(e => { console.error('ERR ' + (e && e.stack ? e.stack : e)); process.exit(1); });