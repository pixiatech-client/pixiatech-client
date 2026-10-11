import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseProductPdf } from '../src/lib/products/product-pdf-parser.ts';
import { buildProductFromMasterTemplate } from '../src/lib/products/product-from-template.ts';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });
const db = getFirestore();
const col = db.collection('site_web_products');

const curSnap = await col.doc('pxt-ultra').get();
const cur: any = curSnap.data();
console.log('=== DOCUMENT EXISTANT pxt-ultra ===');
console.log('cles racine :', Object.keys(cur).sort().join(', '));
console.log('taille JSON :', JSON.stringify(cur).length, 'caracteres');

const parsed = await parseProductPdf(new File([readFileSync(process.argv[2])], 'f.pdf'));
const masterSnap = await col.doc('template-maitre').get();
const master: any = masterSnap.data();

const built: any = await buildProductFromMasterTemplate(parsed as any, async (slug) => {
  const d = await col.doc(slug).get();
  return d.exists ? (d.data() as any) : null;
});

console.log('\n=== CLES RACINE : construit vs existant ===');
const ck = new Set(Object.keys(cur));
const bk = new Set(Object.keys(built));
console.log('seulement dans le construit (seront AJOUTES) :', [...bk].filter((k) => !ck.has(k)).sort().join(', ') || 'aucune');
console.log('seulement dans l existant (seront ABSENTS)    :', [...ck].filter((k) => !bk.has(k)).sort().join(', ') || 'aucune');

console.log('\n=== CHAMPS MODIFIES (hors specs, hors metadonnees) ===');
const META = new Set(['id', 'slug', 'createdAt', 'updatedAt', 'specs']);
for (const k of [...bk].filter((k) => !META.has(k)).sort()) {
  const a = JSON.stringify(cur[k]);
  const b = JSON.stringify(built[k]);
  if (a === b) continue;
  const show = (s: any) => { const t = JSON.stringify(s); return t === undefined ? 'undefined' : (t.length > 150 ? t.slice(0, 150) + '…' : t); };
  console.log(`\n-- ${k}`);
  console.log('   existant :', show(cur[k]));
  console.log('   construit:', show(built[k]));
}
console.log('\nslug existant :', cur.slug, '| slug construit :', built.slug);
console.log('status existant :', cur.status, '| status construit :', built.status);
