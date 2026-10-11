/**
 * LECTURE SEULE — aucun set/update/delete. But : mesurer l'impact du seed vide.
 * Question : quels produits publics resolus par le seed disparaîtraient ?
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });

const db = getFirestore();

const SEED_ON_MAIN = ['pxt-fine', 'wk-series'];

console.log('=== 1. site_web_products : slug + statut ===');
const prods = await db.collection('site_web_products').get();
for (const d of prods.docs.sort((a, b) => a.id.localeCompare(b.id))) {
  const slug = (d.data().slug ?? d.id) as string;
  const status = (d.data().status ?? '(aucun)') as string;
  console.log(`  ${slug.padEnd(20)} status=${status}`);
}

console.log('\n=== 2. Produits du seed de main : resolus ou 404 ? ===');
import { getSeedProductBySlug } from '@/lib/products/seed';
import { resolvePublicProduct } from '@/lib/products/resolve-public-product';

for (const slug of SEED_ON_MAIN) {
  const inFirestore = await db.collection('site_web_products').where('slug', '==', slug).limit(1).get();
  const inSeed = getSeedProductBySlug(slug);
  const resolved = await resolvePublicProduct(slug);

  const firestoreState = inFirestore.empty
    ? 'ABSENT de Firestore'
    : `status=${inFirestore.docs[0].data()?.status}`;

  console.log(`  ${slug.padEnd(12)} ${firestoreState}`);
  console.log(`               seed      : ${inSeed ? inSeed.name : 'ABSENT'}`);
  console.log(
    `               resolution: ${resolved ? `OK -> ${resolved.name}` : 'NULL -> la route rendrait notFound() (404)'}`
  );
}

console.log('\n=== 3. template-maitre (autorite des caracteristiques) ===');
const tm = await db.collection('site_web_products').where('slug', '==', 'template-maitre').get();
if (tm.empty) {
  console.log('  ABSENT  -> buildProductFromMasterTemplate tomberait sur son repli structurel');
} else {
  const groups = tm.docs[0].data()?.specs?.groups;
  const rows = (groups ?? []).reduce((n: number, g: any) => n + (g.rows?.length ?? 0), 0);
  console.log(`  present  status=${tm.docs[0].data()?.status}  groupes=${groups?.length ?? 0}  lignes=${rows}`);
}
