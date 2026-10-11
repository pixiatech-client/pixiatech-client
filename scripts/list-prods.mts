import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });
const col = getFirestore().collection('site_web_products');
const all = await col.get();
console.log('total documents =', all.size);
for (const d of all.docs) console.log('  id=', JSON.stringify(d.id), '| slug=', JSON.stringify(d.data()?.slug), '| name=', JSON.stringify(d.data()?.name));
