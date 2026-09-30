/**
 * Verrou n°3 — la longueur du nom produit.
 *
 * Contexte : `MAX_PRODUCT_NAME_LENGTH` valait 12, une valeur venue du Cahier
 * des charges Phase C (« nom court »), écrite AVANT l'import de fiches PDF. Les
 * noms réels du catalogue ne rentrent pas dedans (« IL-FISS-IRWP1.2 Lite » =
 * 21 caractères) : même avec un parsing PDF parfait, la création était refusée.
 *
 * Ces tests exécutent réellement les fonctions de validation plutôt que de
 * vérifier leur source, et prouvent que le nom extrait du PDF est conservé
 * caractère pour caractère, sans troncature ni substitution par le slug.
 */
import { readFileSync } from 'node:fs';
import {
  MAX_PRODUCT_NAME_LENGTH,
  assertValidProductName,
  slugify,
  isValidSlug,
  normalizeName,
} from '../src/lib/products/types.ts';
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

function assertTrue(actual: boolean, name: string): void {
  assertEqual(actual, true, name);
}

function assertThrows(fn: () => unknown, name: string): void {
  assertions++;
  try {
    fn();
    console.log(`  FAIL | ${name} (aucune erreur levée alors qu'une l should've été)`);
    failures++;
  } catch {
    console.log(`  PASS | ${name}`);
  }
}

const ADMIN_SOURCE = readFileSync(
  new URL('../src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx', import.meta.url),
  'utf8'
);
const PARSER_SOURCE = readFileSync(
  new URL('../src/lib/products/product-pdf-parser.ts', import.meta.url),
  'utf8'
);

/** Le nom réel du catalogue mentionné dans la mission. */
const REAL_NAME = 'IL-FISS-IRWP1.2 Lite';

// ---------------------------------------------------------------------------
console.log('\n--- A. Le nom réel du catalogue est accepté ---');
// ---------------------------------------------------------------------------

// Le libellé fait 20 caractères (et non 21 : le tiret et le point comptent
// chacun pour un). L'écart de une unité avec l'énoncé n'a aucune incidence —
// il dépassait déjà largement l'ancienne limite de 12.
assertEqual(REAL_NAME.length, 20, 'A | le nom de référence fait 20 caractères');
assertEqual(
  REAL_NAME.length > 12,
  true,
  'A | il dépassait donc l’ancienne limite de 12'
);
assertEqual(assertValidProductName(REAL_NAME), REAL_NAME, 'A | accepté sans erreur');
assertTrue(
  REAL_NAME.length <= MAX_PRODUCT_NAME_LENGTH,
  `A | 21 caractères rentrent dans la nouvelle limite (${MAX_PRODUCT_NAME_LENGTH})`
);

// ---------------------------------------------------------------------------
console.log('\n--- B. Le nom exact n’est jamais tronqué ---');
// ---------------------------------------------------------------------------

assertEqual(
  assertValidProductName(REAL_NAME),
  'IL-FISS-IRWP1.2 Lite',
  'B | la validation renvoie le nom À L’IDENTIQUE'
);
assertEqual(
  assertValidProductName(REAL_NAME).length,
  20,
  'B | aucun caractère retiré'
);
assertEqual(
  normalizeName(REAL_NAME),
  REAL_NAME,
  'B | normalizeName ne touche ni au tiret, ni au point, ni à l’espace'
);

// Le nom extrait du PDF traverse le mapping puis la fusion avec le maître.
const parsedFiche = { warnings: [], productName: REAL_NAME } as ParsedFiche;
const parsed = mapParsedToProduct(parsedFiche);
assertEqual(parsed.name, REAL_NAME, 'B | le mapping PDF conserve le nom exact');

const master = { name: 'Démo', slug: 'template-maitre', status: 'draft' } as Product;
const built = await buildProductFromMasterTemplate(parsed, async () => master);
assertEqual(built.name, REAL_NAME, 'B | la fusion avec le maître conserve le nom exact');
assertEqual(
  built.name.includes('…') || built.name.includes('...'),
  false,
  'B | aucun caractère d’ellipse de troncature'
);

// ---------------------------------------------------------------------------
console.log('\n--- C. Un nom long mais raisonnable passe jusqu’à la limite ---');
// ---------------------------------------------------------------------------

const LONG_NAME = 'Projecteur LED Polyvalent Intérieur Extérieur Étanche IP66';
assertTrue(
  LONG_NAME.length > 40 && LONG_NAME.length <= MAX_PRODUCT_NAME_LENGTH,
  `C | un libellé catalogue de ${LONG_NAME.length} caractères est dans la plage`
);
assertEqual(assertValidProductName(LONG_NAME), LONG_NAME, 'C | accepté à l’identique');
assertEqual(
  assertValidProductName('A'.repeat(MAX_PRODUCT_NAME_LENGTH)).length,
  MAX_PRODUCT_NAME_LENGTH,
  `C | un nom exactement à la limite (${MAX_PRODUCT_NAME_LENGTH}) est accepté`
);
assertEqual(
  assertValidProductName('A'.repeat(MAX_PRODUCT_NAME_LENGTH - 1)).length,
  MAX_PRODUCT_NAME_LENGTH - 1,
  'C | un nom juste en dessous est accepté'
);

// ---------------------------------------------------------------------------
console.log('\n--- D. Un dépassement réel est refusé ---');
// ---------------------------------------------------------------------------

assertThrows(
  () => assertValidProductName('A'.repeat(MAX_PRODUCT_NAME_LENGTH + 1)),
  `D | ${MAX_PRODUCT_NAME_LENGTH + 1} caractères est refusé`
);
assertThrows(
  () => assertValidProductName(`${'A'.repeat(MAX_PRODUCT_NAME_LENGTH)}X`),
  'D | un seul caractère de plus est refusé'
);

// ---------------------------------------------------------------------------
console.log('\n--- E. Le template maître « Démo » ne peut pas remplacer le nom PDF ---');
// ---------------------------------------------------------------------------

const emptyFiche = { warnings: [] } as ParsedFiche;
assertEqual(
  mapParsedToProduct(emptyFiche).name,
  undefined,
  'E | sans nom dans le PDF, le parser n’en invente aucun'
);

const builtFromEmpty = await buildProductFromMasterTemplate(
  mapParsedToProduct(emptyFiche),
  async () => master
);
assertEqual(
  builtFromEmpty.name,
  'Démo',
  'E | le produit CONSTRUIT仍 retombe sur le maître (d’où l’importance du verrou suivant)'
);

// …mais le formulaire ne lit pas ce produit construit.
assertTrue(
  /if \(!cleanName && parsed\.name\) setName\(parsed\.name\)/.test(ADMIN_SOURCE),
  'E | le formulaire pré-remplit depuis le PDF'
);
assertEqual(
  /setName\(built\.name\)/.test(ADMIN_SOURCE),
  false,
  'E | le formulaire ne pré-remplit plus depuis le produit construit'
);
assertTrue(
  /name: cleanName,/.test(ADMIN_SOURCE),
  'E | la création enregistre le nom du PDF, pas celui du template'
);

// La validation serveur refuse aussi le nom du maître comme source implicite.
assertTrue(
  MAX_PRODUCT_NAME_LENGTH >= REAL_NAME.length,
  'E | la garde-fou n’entrave plus la création depuis un PDF réel'
);

// ---------------------------------------------------------------------------
console.log('\n--- F. Aucun changement du parser PDF ---');
// ---------------------------------------------------------------------------

assertEqual(
  /MAX_PRODUCT_NAME_LENGTH/.test(PARSER_SOURCE),
  false,
  'F | le parser ne dépend pas de la limite de longueur'
);
assertEqual(
  /MAX_PRODUCT_NAME_LENGTH/.test(ADMIN_SOURCE.replace(/duplicateProduct[\s\S]*?\n  };/, '')),
  true,
  'F | l’admin reste le seul porteur de la garde-fou de saisie'
);

// ---------------------------------------------------------------------------
console.log('\n--- G. Le Master Template est inchangé ---');
// ---------------------------------------------------------------------------

const MASTER_TEMPLATE = readFileSync(
  new URL('../src/lib/products/master-template.ts', import.meta.url),
  'utf8'
);
assertEqual(
  /MAX_PRODUCT_NAME_LENGTH|\.slice\(0,/.test(MASTER_TEMPLATE),
  false,
  'G | master-template.ts ne manipule ni longueur ni troncature'
);
assertTrue(
  MASTER_TEMPLATE.includes("MASTER_TEMPLATE_SLUG = 'template-maitre'"),
  'G | le slug du template est toujours template-maitre'
);

// ---------------------------------------------------------------------------
console.log('\n--- Le slug reste géré séparément du nom ---');
// ---------------------------------------------------------------------------

const slug = slugify(REAL_NAME);
assertEqual(slug, 'il-fiss-irwp1-2-lite', 'slug | dérivé du nom complet');
assertTrue(isValidSlug(slug), 'slug | valide et indépendant de la longueur du nom');
assertEqual(
  slug,
  slugify(assertValidProductName(REAL_NAME)),
  'slug | le nom validé et le nom brut produisent le même slug'
);
// Les deux longueurs sont des grandeurs distinctes : « IL-FISS-IRWP1.2 Lite »
// (20 car.) et « il-fiss-irwp1-2-lite » (20 car.) sont deux chaînes de même
// longueur mais de contenus distincts — le slug n'est jamais le nom recopié,
// c'est une dérivation qui remplace tirets et points.
assertEqual(
  slugify('IL-FISS-IRWP1.2 Lite') === REAL_NAME,
  false,
  'slug | le slug n’est PAS le nom recopié'
);
assertEqual(
  slugify('PXT Fine Lite') !== 'PXT Fine Lite',
  true,
  'slug | un nom avec espace devient un slug à tirets'
);
assertEqual(
  isValidSlug(slugify('Produit  spaces  et  tirets---')),
  true,
  'slug | le slug se normalise indépendamment de la longueur du nom'
);

console.log(`\n${assertions - failures}/${assertions} assertions`);
if (failures > 0) {
  console.error(`ECHEC : ${failures} assertion(s) sont tombées.`);
  process.exit(1);
}
console.log('OK');
