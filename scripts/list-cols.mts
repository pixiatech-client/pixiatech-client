import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });
const db = getFirestore();
console.log('=== collections racine ===');
for (const c of await db.listCollections()) {
  const n = await c.get();
  console.log(' ', c.id, '->', n.size, 'docs :', n.docs.map((d) => d.id).join(', ') || '(vide)');
}
