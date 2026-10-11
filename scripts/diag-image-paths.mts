/** LECTURE SEULE — compare les chemins image declares en base, le disque local, et la production. */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });

const d = await getFirestore()
  .collection('site_web_products')
  .where('slug', '==', process.env.SLUG ?? 'pxt-seamless')
  .limit(1)
  .get();

const raw = JSON.stringify(d.docs[0]?.data() ?? {});

// Tous les chemins qui ressemblent a une image servie par le site.
const paths = [...new Set([...raw.matchAll(/"(\/[^"\\]*?\.(?:jpg|jpeg|png|webp|gif|svg|avif))"/gi)].map((m) => m[1]))];

console.log(`slug=${process.env.SLUG ?? 'pxt-seamless'}  references image trouvees = ${paths.length}`);
for (const p of paths) console.log(`  ${p}`);
