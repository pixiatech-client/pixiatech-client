import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseProductPdf } from '../src/lib/products/product-pdf-parser.ts';
import { buildProductFromMasterTemplate } from '../src/lib/products/product-from-template.ts';
initializeApp({ credential: applicationDefault(), projectId: 'pixiatech-client' });
const col = getFirestore().collection('site_web_products');
const curSnap = await col.doc('pxt-ultra').get();
console.log('exists =', curSnap.exists);
const cur: any = curSnap.data();
console.log('data OK =', !!cur, '| name =', cur?.name, '| slug =', cur?.slug, '| status =', cur?.status);
const master: any = (await col.doc('template-maitre').get()).data();
const parsed = await parseProductPdf(new File([readFileSync(process.argv[2])], 'f.pdf'));
const built: any = await buildProductFromMasterTemplate(parsed as any, async (s) => {
  const d = await col.doc(s).get(); return d.exists ? (d.data() as any) : null;
});
console.log('\nbuilt.specs cles :', Object.keys(built.specs).join(', '));
console.log('\n=== RISQUES si on ecrivait le document ENTIER ===');
for (const k of ['slug','status','media','description','design','features','overview','hero','characteristics']) {
  const a = JSON.stringify(cur[k]), b = JSON.stringify(built[k]);
  if (a === b) { console.log(`- ${k}: identique`); continue; }
  console.log(`- ${k}:`);
  console.log(`    existant : ${(a ?? 'undefined').slice(0, 115)}`);
  console.log(`    construit: ${(b ?? 'undefined').slice(0, 115)}`);
}
console.log('\nabsentes du construit :', ['applicationCategoryIds','categoryIds','environmentCategoryIds','id','createdAt'].filter((k) => !(k in built)).join(', '));
console.log('\n=== MEDIAS pxt-ultra (a ne pas perdre) ===');
for (const p of (cur.media?.photos ?? [])) console.log('   ', p.name, '->', String(p.url).slice(0, 76));
