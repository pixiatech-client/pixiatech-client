/**
 * LECTURE SEULE — aucun client Firestore en écriture, aucun set/update/delete.
 * Objectif : déterminer si le tiret « — » est stocké DANS la valeur ou ajouté
 * par le renderer.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });

const col = getFirestore().collection('site_web_products');
const all = await col.get();
const DASHY = /[\u2010-\u2015\u2212-]/;

for (const d of all.docs) {
  const data = d.data();
  const models = data?.specs?.models ?? [];
  console.log(`\n### ${d.id} — ${models.length} variante(s)`);
  for (const m of models) {
    for (const [k, v] of Object.entries(m.specs ?? {})) {
      if (typeof v === 'string' && DASHY.test(v)) {
        console.log(`  ${m.name} | ${k} = ${JSON.stringify(v)}`);
      }
    }
  }
}
