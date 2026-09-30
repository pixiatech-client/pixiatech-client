/**
 * Verrou n°2 — le nom pré-rempli dans « Nouveau produit » vient du PDF.
 *
 * Symptôme rapporté : en glissant un PDF, le champ « Le nom du produit » se
 * remplissait avec le nom de la page Démo — celui du produit template maître,
 * qui sert de base à la génération.
 *
 * La cause n'est pas l'absence de nom dans le PDF, mais la source du
 * pré-remplissage : le formulaire lisait le nom du produit CONSTRUIT, or cette
 * construction retombe sur le template maître dès que le parser n'a rien lu
 * (`product-from-template.ts` : `overlay.name || master.name`). Un brouillon
 * créé depuis un PDF héritait donc de l'identité du gabarit.
 *
 * Ces tests exécutent réellement les deux maillons du raisonnement — le mapping
 * du parser et la fusion avec le maître — puis verrouillent que le formulaire
 * lit le premier et pas le second.
 */
import { readFileSync } from 'node:fs';
import { mapParsedToProduct } from '../src/lib/products/product-pdf-parser.ts';
import { buildProductFromMasterTemplate } from '../src/lib/products/product-from-template.ts';
import type { ParsedFiche } from '../src/lib/products/product-pdf-parser.ts';
import type { Product } from '../src/lib/products/types.ts';

let failures = 0;
let assertions = 0;

function assertEqual(actual: unknown, expected: unknown, name: string): void {
  assertions++;
  const ok = Object.is(actual, expected);
  console.log(
    `${ok ? '  PASS' : '  FAIL'} | ${name}${
      ok ? '' : ` (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`
    }`
  );
  if (!ok) failures++;
}

const ADMIN_SOURCE = readFileSync(
  new URL('../src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx', import.meta.url),
  'utf8'
);

/** Le gabarit réel du site : le produit dont le nom est « Démo ». */
const MASTER = {
  name: 'Démo',
  slug: 'template-maitre',
  status: 'draft',
} as Product;

const emptyFiche = { warnings: [] } as ParsedFiche;
const namedFiche = { warnings: [], productName: 'PXT Fine' } as ParsedFiche;

// ---------------------------------------------------------------------------
console.log('\n--- 1. Le parser sait lire le nom du PDF ---');
// ---------------------------------------------------------------------------

assertEqual(
  mapParsedToProduct(namedFiche).name,
  'PXT Fine',
  '1 | un nom lu dans le PDF devient bien le nom du brouillon'
);
assertEqual(
  mapParsedToProduct(emptyFiche).name,
  undefined,
  '1 | un gabarit sans nom ne produit AUCUN nom — rien n’est inventé'
);

// ---------------------------------------------------------------------------
console.log('\n--- 2. Le produit construit retombe sur le maître : c’est là le piège ---');
// ---------------------------------------------------------------------------

const resolveMaster = async () => MASTER;

const builtFromPdf = await buildProductFromMasterTemplate(
  mapParsedToProduct(namedFiche),
  resolveMaster
);
assertEqual(builtFromPdf.name, 'PXT Fine', '2 | avec un nom dans le PDF, le PDF gagne');

const builtWithoutName = await buildProductFromMasterTemplate(
  mapParsedToProduct(emptyFiche),
  resolveMaster
);
assertEqual(
  builtWithoutName.name,
  'Démo',
  '2 | sans nom dans le PDF, le produit construit prend celui du template maître'
);
assertEqual(
  builtWithoutName.slug,
  MASTER.slug,
  '2 | le produit construit hérite aussi du slug du maître : c’est bien le '
    + 'gabarit qui fournit l’identité, pas le PDF'
);

// ---------------------------------------------------------------------------
console.log('\n--- 3. Le formulaire lit le PDF, pas le produit construit ---');
// ---------------------------------------------------------------------------

assertEqual(
  /if \(!cleanName && parsed\.name\) setName\(parsed\.name\)/.test(ADMIN_SOURCE),
  true,
  '3 | le pré-remplissage prend le nom du PDF'
);
assertEqual(
  /setName\(built\.name\)/.test(ADMIN_SOURCE),
  false,
  '3 | le pré-remplissage ne lit plus le nom du produit construit'
);
assertEqual(
  /name: cleanName,/.test(ADMIN_SOURCE),
  true,
  '3 | la création enregistre le champ du formulaire, pas le nom du template'
);
assertEqual(
  /if \(!cleanName && parsed\.name\)/.test(ADMIN_SOURCE),
  true,
  '3 | un nom déjà saisi par l’administrateur n’est jamais écrasé'
);

console.log(`\n${assertions - failures}/${assertions} assertions`);
if (failures > 0) {
  console.error(`ECHEC : ${failures} assertion(s) sont tombées.`);
  process.exit(1);
}
console.log('OK');
