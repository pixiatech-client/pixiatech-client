/**
 * Verrou n°1 — le TEMPLATE SYSTÈME ne peut pas être supprimé.
 *
 * Ce test n'est pas une démonstration : il existe parce qu'une erreur humaine
 * (« Tout sélectionner » puis « Supprimer ») détruit la base de toutes les
 * générations futures, et parce que l'absence d'action visible ne protège rien
 * dès qu'un appel HTTP direct contourne l'écran.
 *
 * Ce qui est vérifié ici :
 *   - la règle d'identification est UNIQUE et réutilise l'identifiant existant ;
 *   - `deleteProduct` refuse RÉELLEMENT, avant tout accès à Firestore ;
 *   - la route DELETE répond 403 avant de supprimer quoi que ce soit ;
 *   - le « Tout sélectionner » ne peut pas composer une cible contre lui ;
 *   - un produit ordinaire n'est pas concerné par la protection.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { MASTER_TEMPLATE_SLUG } from '../src/lib/products/master-template.ts';
import {
  SYSTEM_TEMPLATE_LABEL,
  SYSTEM_TEMPLATE_PROTECTED_CODE,
  SYSTEM_TEMPLATE_PROTECTED_MESSAGE,
  SYSTEM_TEMPLATE_SLUG,
  SystemTemplateProtectedError,
  assertDeletableProduct,
  isSystemTemplate,
  isSystemTemplateSlug,
  partitionDeletableProducts,
} from '../src/lib/products/system-template.ts';
import * as fakeAdmin from './fakes/firebase-admin-firestore.ts';
import { loadMasterTemplate } from '../src/lib/products/product-from-template.ts';
import type { Product } from '../src/lib/products/types.ts';

// `deleteProduct` n'est PAS importé statiquement : il faut substituer
// `@/lib/firebase-admin` avant son chargement, sinon c'est l'admin SDK réel
// qui s'initialiserait. Un hook enregistré ici, lancé avant l'import
// dynamique ci-dessous, prend le pas sur celui du runner.
const FAKE_ADMIN_URL = new URL('./fakes/firebase-admin-firestore.ts', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/lib/firebase-admin') return { url: FAKE_ADMIN_URL, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { deleteProduct, getProductBySlug } = await import('../src/lib/products/products-store.ts');

let failures = 0;
let assertions = 0;

function assertEqual(actual: unknown, expected: unknown, name: string): void {
  assertions++;
  const ok = Object.is(actual, expected);
  console.log(`${ok ? '  PASS' : '  FAIL'} | ${name}${ok ? '' : ` (attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)})`}`);
  if (!ok) failures++;
}

function assertTrue(cond: boolean, name: string): void {
  assertEqual(cond, true, name);
}

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

const ADMIN_SOURCE = read('src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx');
const STORE_SOURCE = read('src/lib/products/products-store.ts');
const ROUTE_SOURCE = read('src/app/api/site-web/products/[slug]/route.ts');
const FROM_TEMPLATE_SOURCE = read('src/lib/products/product-from-template.ts');

/** Le template tel qu'il existe en base : brouillon, comme il a toujours été. */
const TEMPLATE: Product = {
  name: 'Template maître',
  slug: SYSTEM_TEMPLATE_SLUG,
  status: 'draft',
} as Product;
const PRODUCT_A = { name: 'Produit A', slug: 'produit-a', status: 'published' } as Product;
const PRODUCT_B = { name: 'Produit B', slug: 'produit-b', status: 'draft' } as Product;

// ---------------------------------------------------------------------------
console.log('\n--- A. Le template est identifié par la règle existante ---');
// ---------------------------------------------------------------------------

assertEqual(
  SYSTEM_TEMPLATE_SLUG,
  MASTER_TEMPLATE_SLUG,
  'A | le slug vient bien du template maître, aucune constante dupliquée'
);
assertTrue(isSystemTemplateSlug(SYSTEM_TEMPLATE_SLUG), 'A | le slug du template est reconnu');
assertTrue(isSystemTemplate(TEMPLATE), 'A | le produit template est reconnu');
assertTrue(
  isSystemTemplateSlug(`  ${SYSTEM_TEMPLATE_SLUG.toUpperCase()}  `),
  'A | la casse et les espaces ne permettent pas de contourner la règle'
);
assertEqual(isSystemTemplateSlug('autre-produit'), false, 'A | un slug ordinaire n’est pas protégé');
assertEqual(isSystemTemplate(PRODUCT_A), false, 'A | un produit ordinaire n’est pas protégé');
assertEqual(isSystemTemplate(null), false, 'A | l’absence de produit ne lève pas');
assertEqual(isSystemTemplate(undefined), false, 'A | undefined ne lève pas');
assertEqual(
  SYSTEM_TEMPLATE_PROTECTED_MESSAGE,
  'Ce produit est le template système et ne peut pas être supprimé.',
  'A | le message de refus est explicite'
);
assertEqual(
  SYSTEM_TEMPLATE_PROTECTED_CODE,
  'SYSTEM_TEMPLATE_PROTECTED',
  'A | le refus porte un code stable, distinct d’une panne'
);

// La règle doit exister AU SEUL ENDROIT. Un littéral recopié dans un module
// applicatif finirait par diverger du template maître — c'est exactement le
// silence que cette mission cherche à supprimer.
const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}
const slugLiterals = filesUnder(join(REPO_ROOT, 'src'))
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => readFileSync(f, 'utf8').includes(`'${SYSTEM_TEMPLATE_SLUG}'`))
  .map((f) => f.slice(REPO_ROOT.length).replace(/\\/g, '/'));
assertEqual(
  slugLiterals.join(','),
  'src/lib/products/master-template.ts',
  'A | « template-maitre » n’est écrit que dans le module qui le définit'
);

// ---------------------------------------------------------------------------
console.log('\n--- B/C. Interface : visible comme protégé, jamais supprimable ---');
// ---------------------------------------------------------------------------

assertEqual(
  SYSTEM_TEMPLATE_LABEL,
  'TEMPLATE SYSTÈME',
  'B | l’étiquette du cadenas est celle attendue'
);
assertTrue(
  ADMIN_SOURCE.includes('SYSTEM_TEMPLATE_LABEL'),
  'B | le cadenas « TEMPLATE SYSTÈME » est rendu dans la liste'
);
assertTrue(
  ADMIN_SOURCE.includes('<Lock className="w-3 h-3" aria-hidden />'),
  'B | le cadenas utilise l’icône de l’UI existante, pas un caractère'
);
assertTrue(
  ADMIN_SOURCE.includes('disabled={isTemplate}'),
  'C | la case de sélection est désactivée pour le template'
);
assertTrue(
  /\{!isTemplate && \(\s*<button[\s\S]{0,400}onClick=\{\(\) => onDelete\(p\)\}/.test(ADMIN_SOURCE),
  'C | le bouton Supprimer n’est pas rendu pour le template'
);
assertTrue(
  ADMIN_SOURCE.includes('deletingSlug === p.slug && !isTemplate'),
  'C | la confirmation en ligne ne peut pas s’ouvrir pour le template'
);
assertTrue(
  /const askDelete = \(product: Product\) => \{[\s\S]{0,400}isSystemTemplate\(product\)/.test(ADMIN_SOURCE),
  'C | askDelete refuse le template même si on l’appelle'
);
assertTrue(
  !/slug\s*===\s*['"`]template-maitre['"`]/.test(ADMIN_SOURCE),
  'B | l’interface ne réimplémente pas la règle avec un slug en dur'
);

// ---------------------------------------------------------------------------
console.log('\n--- D/E. Suppression directe du template : refusée, document intact ---');
// ---------------------------------------------------------------------------

// Appel réel de la fonction qui touche Firestore — ici une base en mémoire,
// mais le code exécuté est celui de la production. Aucune maquette, aucun clic :
// la seule façon que le document disparaisse reste ouverte si la garde est
// contournée ailleurs, donc on l'appelle directement, puis on regarde ce qu'il
// reste en base.
fakeAdmin.__reset({
  site_web_products: {
    [SYSTEM_TEMPLATE_SLUG]: TEMPLATE as unknown as Record<string, unknown>,
    'produit-a': PRODUCT_A as unknown as Record<string, unknown>,
  },
});
let refusal: unknown;
try {
  await deleteProduct(SYSTEM_TEMPLATE_SLUG);
} catch (err) {
  refusal = err;
}
assertTrue(refusal instanceof SystemTemplateProtectedError, 'D | deleteProduct refuse le template');
assertEqual(
  (refusal as Error)?.message,
  SYSTEM_TEMPLATE_PROTECTED_MESSAGE,
  'D | le refus porte le message explicite attendu'
);
assertEqual(
  (refusal as SystemTemplateProtectedError)?.slug,
  SYSTEM_TEMPLATE_SLUG,
  'D | le refus porte le slug visé, pour le journal'
);
assertTrue(
  fakeAdmin.__exists('site_web_products', SYSTEM_TEMPLATE_SLUG),
  'E | le document template existe toujours après la tentative'
);
assertTrue(
  (await getProductBySlug(SYSTEM_TEMPLATE_SLUG)) !== null,
  'E | le template est toujours relisible, et intact'
);
assertEqual(
  fakeAdmin.__ids('site_web_products').join(','),
  `${SYSTEM_TEMPLATE_SLUG},produit-a`,
  'E | rien d’autre n’a bougé pendant la tentative'
);
assertTrue(
  STORE_SOURCE.indexOf('assertDeletableProduct(slug)') <
    STORE_SOURCE.indexOf('getFirebaseAdmin()', STORE_SOURCE.indexOf('deleteProduct')),
  'E | dans deleteProduct, la garde précède l’ouverture de Firestore'
);
assertTrue(
  ROUTE_SOURCE.includes('isSystemTemplateSlug(slug)') && ROUTE_SOURCE.includes('status: 403'),
  'D | la route DELETE répond 403 au template'
);
assertTrue(
  ROUTE_SOURCE.indexOf('isSystemTemplateSlug(slug)', ROUTE_SOURCE.indexOf('export async function DELETE')) <
    ROUTE_SOURCE.indexOf('deleteProduct(slug)', ROUTE_SOURCE.indexOf('export async function DELETE')),
  'D | la route DELETE refuse avant d’appeler deleteProduct'
);

// ---------------------------------------------------------------------------
console.log('\n--- F. Un produit ordinaire n’est pas concerné ---');
// ---------------------------------------------------------------------------

assertTrue(
  (() => {
    try {
      assertDeletableProduct('produit-a');
      return true;
    } catch {
      return false;
    }
  })(),
  'F | la garde laisse passer un produit ordinaire'
);
assertEqual(
  partitionDeletableProducts([PRODUCT_A, PRODUCT_B]).protectedItems.length,
  0,
  'F | aucun produit ordinaire n’est classé comme protégé'
);
// La suppression ordinaire, exécutée pour de vrai : elle aboutit et retire le
// document. Une protection qui laisserait passer le template bloquerait
// aussi ce produit — ce serait le défaut à surveiller.
assertEqual(
  await deleteProduct('produit-a'),
  true,
  'F | la suppression d’un produit ordinaire aboutit toujours'
);
assertEqual(
  fakeAdmin.__exists('site_web_products', 'produit-a'),
  false,
  'F | le produit ordinaire a bien été supprimé'
);
assertTrue(
  fakeAdmin.__exists('site_web_products', SYSTEM_TEMPLATE_SLUG),
  'F | le template, lui, est resté pendant cette suppression'
);
assertTrue(
  /export async function deleteProduct[\s\S]*?docRef\.delete\(\)/.test(STORE_SOURCE),
  'F | la suppression ordinaire reste en place, garde ajoutée avant seulement'
);
assertTrue(
  !/export async function saveProduct[\s\S]{0,900}isSystemTemplate/.test(STORE_SOURCE),
  'F | l’écriture n’est pas touchée : le template reste modifiable'
);

// ---------------------------------------------------------------------------
console.log('\n--- G/H. Sélection multiple avec le template ---');
// ---------------------------------------------------------------------------

const mixed = partitionDeletableProducts([TEMPLATE, PRODUCT_A, PRODUCT_B]);
assertEqual(mixed.deletable.length, 2, 'G | les produits ordinaires restent supprimables');
assertEqual(mixed.protectedItems.length, 1, 'G | le template est écarté');
assertEqual(
  mixed.deletable.map((p) => p.slug).join(','),
  'produit-a,produit-b',
  'H | les produits ordinaires sont supprimés, le template est conservé'
);
assertEqual(
  partitionDeletableProducts([TEMPLATE]).deletable.length,
  0,
  'G | une sélection réduite au template ne contient plus de cible'
);
assertEqual(
  partitionDeletableProducts([TEMPLATE]).protectedItems[0]?.slug,
  SYSTEM_TEMPLATE_SLUG,
  'G | le refus est signalable, sinon un « tout supprimer » semblerait complet'
);
assertTrue(
  /const \{ deletable: targets, protectedItems \} = partitionDeletableProducts\(victims\)/.test(
    ADMIN_SOURCE
  ),
  'G | la suppression groupée filtre par la règle centrale avant tout appel réseau'
);
assertTrue(
  ADMIN_SOURCE.indexOf('partitionDeletableProducts(victims)') <
    ADMIN_SOURCE.indexOf("method: 'DELETE'"),
  'G | le filtre précède le DELETE envoyé au serveur'
);

// ---------------------------------------------------------------------------
console.log('\n--- I. « Tout sélectionner » ---');
// ---------------------------------------------------------------------------

// On rejoue la sélection telle que la liste la calcule : le template en est
// exclu, donc aucun clic — pas même le « tout cocher » — ne le place dans la
// cible d'une action destructive.
const rowList = [TEMPLATE, PRODUCT_A, PRODUCT_B];
const selectable = rowList.filter((p) => !isSystemTemplate(p)).map((p) => p.slug);
assertEqual(selectable.join(','), 'produit-a,produit-b', 'I | le tout-cocher ne cible que les produits ordinaires');
assertEqual(
  selectable.includes(SYSTEM_TEMPLATE_SLUG),
  false,
  'I | le template ne peut jamais devenir une cible supprimable'
);
assertEqual(
  partitionDeletableProducts(
    selectable.map((slug) => rowList.find((p) => p.slug === slug)!)
  ).deletable.length,
  2,
  'I | la suppression groupée du tout-cocher passe, template intact'
);
assertTrue(
  ADMIN_SOURCE.includes('if (allVisibleSelected) selectableSlugs.forEach'),
  'I | « tout cocher » itère la liste des slugs sélectionnables'
);
assertTrue(
  ADMIN_SOURCE.includes('filtered.filter((p) => selected[p.slug] && !isSystemTemplate(p))'),
  'I | l’action groupée re-filtre, même si la sélection était forcée'
);
assertTrue(
  ADMIN_SOURCE.includes('const selectedSlugs = selectableSlugs.filter'),
  'I | le décompte de la barre groupée ignore le template'
);

// ---------------------------------------------------------------------------
console.log('\n--- J/K. Le template reste utilisable en brouillon ---');
// ---------------------------------------------------------------------------

assertTrue(
  isSystemTemplate({ slug: SYSTEM_TEMPLATE_SLUG, status: 'draft' }),
  'J | la protection ne dépend pas du statut'
);
assertTrue(
  isSystemTemplate({ slug: SYSTEM_TEMPLATE_SLUG, status: 'published' }),
  'J | le template reste protégé s’il est publié'
);
// La génération, exécutée pour de vrai : un template en brouillon est bien
// résolu, ce qui prouve qu'aucune règle ne le suppose publié.
const resolved = await loadMasterTemplate(async (slug) =>
  slug === SYSTEM_TEMPLATE_SLUG ? TEMPLATE : null
);
assertEqual(resolved.slug, SYSTEM_TEMPLATE_SLUG, 'K | un template en brouillon sert bien de base');
assertEqual(resolved.status, 'draft', 'K | le statut est conservé tel quel, rien n’est imposé');
assertTrue(
  FROM_TEMPLATE_SOURCE.includes('resolveBase(MASTER_TEMPLATE_SLUG)'),
  'K | la génération lit toujours le template maître, inchangée'
);
assertTrue(
  !/export async function DELETE[\s\S]*?MASTER_TEMPLATE_SLUG/.test(ROUTE_SOURCE)
    && !FROM_TEMPLATE_SOURCE.includes('isSystemTemplate'),
  'K | la protection ne s’est pas propagée dans la génération'
);

console.log(`\n${assertions - failures}/${assertions} assertions`);
if (failures > 0) {
  console.error(`ECHEC : ${failures} assertion(s) sont tombées.`);
  process.exit(1);
}
console.log('OK');
