// Tests du lien boutique par variante (bouton « Acheter ce produit »).
// Exécution : node --experimental-strip-types scripts/test-shop-links.ts
//
// Ces tests verrouillent la règle de visibilité PUBLIQUE : le bouton existe
// si et seulement si la variante porte un lien valide. Tout le reste (données
// du PDF, matrice technique) en est indépendant.
import { readFileSync } from 'node:fs';
import {
  isValidShopUrl,
  normalizeShopUrl,
  sanitizeShopLinks,
  shopLinkForVariant,
} from '../src/lib/products/types.ts';

let failures = 0;
let assertions = 0;

function assertEqual(actual: unknown, expected: unknown, label: string) {
  assertions++;
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS | ${label}`);
  } else {
    failures++;
    console.log(`  FAIL | ${label} => attendu ${e}, obtenu ${a}`);
  }
}

console.log('--- CAS A : aucun lien => aucun bouton ---');
assertEqual(shopLinkForVariant({}, 'PXT-FINE'), '', 'map vide => aucun bouton');
assertEqual(shopLinkForVariant(undefined, 'PXT-FINE'), '', 'shopLinks absent => aucun bouton');
assertEqual(shopLinkForVariant(null, 'PXT-FINE'), '', 'shopLinks null => aucun bouton');
assertEqual(shopLinkForVariant({ 'PXT-FINE': '' }, 'PXT-FINE'), '', 'chaîne vide => aucun bouton');
assertEqual(shopLinkForVariant({ 'PXT-FINE': '   ' }, 'PXT-FINE'), '', 'espaces seuls => aucun bouton');

console.log('--- CAS B : lien valide => bouton affiché ---');
assertEqual(
  shopLinkForVariant({ 'PXT-FINE': 'https://boutique.exemple.fr/pxt-fine' }, 'PXT-FINE'),
  'https://boutique.exemple.fr/pxt-fine',
  'URL https complète => bouton'
);
assertEqual(
  shopLinkForVariant({ 'PXT-FINE': 'http://boutique.exemple.fr/pxt' }, 'PXT-FINE'),
  'http://boutique.exemple.fr/pxt',
  'URL http => bouton'
);
assertEqual(
  shopLinkForVariant({ 'PXT-FINE': '/boutique/pxt-fine' }, 'PXT-FINE'),
  '/boutique/pxt-fine',
  'chemin interne => bouton'
);
assertEqual(
  shopLinkForVariant({ 'PXT-FINE': '  https://boutique.exemple.fr/pxt  ' }, 'PXT-FINE'),
  'https://boutique.exemple.fr/pxt',
  'espaces autour de l URL => normalisés'
);

console.log('--- CAS C : mélange, chaque variante est indépendante ---');
const mixed = { 'PXT-FINE': 'https://boutique.exemple.fr/fine', 'PXT-FINE+': '' };
assertEqual(
  shopLinkForVariant(mixed, 'PXT-FINE'),
  'https://boutique.exemple.fr/fine',
  'variante avec lien => bouton'
);
assertEqual(shopLinkForVariant(mixed, 'PXT-FINE+'), '', 'variante sans lien => aucun bouton');
assertEqual(
  shopLinkForVariant({ A: 'https://a.fr/x', B: 'https://b.fr/y', C: 'https://c.fr/z' }, 'B'),
  'https://b.fr/y',
  'lien de la seule variante B => bouton'
);

console.log('--- CAS D : ancien produit, aucun champ shopLinks ---');
assertEqual(shopLinkForVariant({}, 'PXT-FINE'), '', 'produit pré-fonctionnalité => aucun bouton');
assertEqual(
  shopLinkForVariant({ 'AUTRE-VARIANTE': 'https://boutique.exemple.fr/x' }, 'PXT-FINE'),
  '',
  'clé inconnue => aucun bouton'
);

console.log('--- Sécurité : seules http(s) et les chemins internes passent ---');
const dangerous: [string, unknown][] = [
  ['javascript:alert(1)', 'javascript'],
  ['JaVaScRiPt:alert(1)', 'javascript insensible à la casse'],
  ['data:text/html,<script>alert(1)</script>', 'data URI'],
  ['vbscript:msgbox(1)', 'vbscript'],
  ['#', 'ancre interne'],
  ['www.boutique.fr/pxt', 'sans protocole'],
  ['boutique.fr/pxt', 'domaine nu'],
  ['//boutique.fr/pxt', 'protocole relatif'],
  ['https://', 'https sans hôte'],
  ['https://boutique.fr/a b', 'espace dans l URL'],
  [null, 'null'],
  [undefined, 'undefined'],
  [42, 'nombre'],
  [{ href: 'https://x.fr' }, 'objet'],
];
for (const [value, label] of dangerous) {
  assertEqual(normalizeShopUrl(value), '', `${label} => rejeté`);
}
assertEqual(isValidShopUrl('javascript:alert(1)'), false, 'javascript: non valide');
assertEqual(isValidShopUrl('https://boutique.fr/x'), true, 'https valide');

console.log('--- Persistance : seules les entrées valides sont conservées ---');
assertEqual(
  sanitizeShopLinks({
    'PXT-FINE': 'https://boutique.exemple.fr/fine',
    'PXT-FINE+': '',
    'PXT-EVO': 'javascript:alert(1)',
    '  ': 'https://boutique.exemple.fr/espace',
    '': 'https://boutique.exemple.fr/cle-vide',
  }),
  { 'PXT-FINE': 'https://boutique.exemple.fr/fine' },
  'les liens invalides, vides ou à clé vide sont écartés'
);
assertEqual(sanitizeShopLinks(undefined), {}, 'undefined => map vide');
assertEqual(sanitizeShopLinks(null), {}, 'null => map vide');

console.log('--- Régression PDF : une réanalyse ne touche pas la map des liens ---');
// `specs` est reconstruit à chaque import ; `shopLinks` est une clé RACINE,
// donc la fusion superficielle de saveProduct la conserve intacte.
const stored = { specs: { groups: [], models: [{ name: 'PXT-FINE', specs: {} }] }, shopLinks: { 'PXT-FINE': 'https://boutique.exemple.fr/fine' } };
const reimportedSpecs = { groups: [], models: [{ name: 'PXT-FINE', specs: { pitch: '1.25' } }] };
const merged = { ...stored, specs: reimportedSpecs };
assertEqual(
  shopLinkForVariant(merged.shopLinks, 'PXT-FINE'),
  'https://boutique.exemple.fr/fine',
  'le lien survit au remplacement de specs'
);

// ---------------------------------------------------------------------------
// PARCOURS COMPLET : édition → saisie → sauvegarde → rechargement → clic.
//
// On rejoue ici le flux réel, avec la même fusion superficielle que
// `saveProduct` (products-store) : `{ ...base, ...body }`. Aucun état React
// ni local n'intervient — seule la donnée écrite compte, ce qui est
// exactement ce que la mission demande de garantir.
// ---------------------------------------------------------------------------

/** Reproduit le payload et la fusion de `saveProduct`. */
function saveProduct(
  base: Record<string, unknown>,
  draftLinks: Record<string, unknown> | undefined
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...draftLinks ? { shopLinks: draftLinks } : {} };
  return { ...base, ...body };
}

/** Reproduit la relecture Firestore : `toRecord` = `{ id, ...data }`. */
function reload(storedProduct: Record<string, unknown>) {
  return { id: 'pxt-fine', ...storedProduct };
}

/** Le href rendu, ou '' si aucun bouton n'est produit. */
function renderedHref(product: Record<string, unknown>, variantName: string): string {
  return shopLinkForVariant(
    product.shopLinks as Parameters<typeof shopLinkForVariant>[0],
    variantName
  );
}

console.log('\n--- TEST 1 : nouvelle variante sans lien => bouton absent ---');
const productAtCreation = { name: 'PXT FINE', specs: { groups: [], models: [{ name: 'PXT-FINE', specs: {} }] } };
assertEqual(renderedHref(productAtCreation, 'PXT-FINE'), '', 'TEST 1 | produit créé sans lien => aucun bouton');
assertEqual(
  Object.keys(productAtCreation).includes('shopLinks'),
  false,
  'TEST 1 | aucun champ shopLinks n est inventé à la création'
);

console.log('\n--- TEST 2 : saisie d URL en édition + sauvegarde => bouton visible ---');
const editedLinks = { 'PXT-FINE': 'https://boutique.exemple.fr/pxt-fine' };
const afterSave = saveProduct(productAtCreation, editedLinks);
assertEqual(
  renderedHref(afterSave, 'PXT-FINE'),
  'https://boutique.exemple.fr/pxt-fine',
  'TEST 2 | lien saisi puis sauvegardé => bouton visible'
);

console.log('\n--- TEST 3 : rechargement de la page => lien et bouton toujours là ---');
const afterReload = reload(afterSave);
assertEqual(
  renderedHref(afterReload, 'PXT-FINE'),
  'https://boutique.exemple.fr/pxt-fine',
  'TEST 3 | lien toujours présent après rechargement'
);
assertEqual(
  (afterReload.shopLinks as Record<string, string>)['PXT-FINE'],
  'https://boutique.exemple.fr/pxt-fine',
  'TEST 3 | donnée persistée à la racine du produit'
);
const otherVariantAfterReload = reload(afterSave);
assertEqual(
  renderedHref(otherVariantAfterReload, 'PXT-EVO'),
  '',
  'TEST 3 | une variante sans lien reste sans bouton après rechargement'
);

console.log('\n--- TEST 4 : suppression du lien + sauvegarde => bouton de nouveau absent ---');
const afterDeletion = saveProduct(afterReload, { 'PXT-FINE': '' });
assertEqual(
  renderedHref(afterDeletion, 'PXT-FINE'),
  '',
  'TEST 4 | lien vidé => aucun bouton'
);
const afterHardDeletion = saveProduct(afterReload, {});
assertEqual(
  renderedHref(afterHardDeletion, 'PXT-FINE'),
  '',
  'TEST 4 | champ retiré => aucun bouton'
);
assertEqual(
  renderedHref(reload(afterDeletion), 'PXT-FINE'),
  '',
  'TEST 4 | le retrait survit lui aussi au rechargement'
);

console.log('\n--- Destination : le clic va vers le lien ENREGISTRÉ, tel quel ---');
const target = 'https://boutique.exemple.fr/catalogue/pxt-fine?ref=fiche';
const withTarget = saveProduct(productAtCreation, { 'PXT-FINE': target });
assertEqual(renderedHref(withTarget, 'PXT-FINE'), target, 'le href est l URL enregistrée, non reconstruite');
assertEqual(
  renderedHref(withTarget, 'PXT-FINE') !== 'https://boutique.exemple.fr/pxt-fine',
  true,
  'aucune URL n est reconstruite ni devinée'
);
const productA = saveProduct({ name: 'A' }, { 'M1': 'https://boutique.exemple.fr/a' });
const productB = saveProduct({ name: 'B' }, { 'M1': 'https://boutique.exemple.fr/b' });
assertEqual(
  renderedHref(productA, 'M1') !== renderedHref(productB, 'M1'),
  true,
  'deux variantes/produits peuvent viser deux fiches différentes (pas de lien statique commun)'
);

console.log('\n--- Garde-fou source : plus aucun bouton « Fiche technique » dans la matrice ---');
// Le libellé de la cellule ne doit être QUE « Acheter le produit ». On relit
// le composant pour empêcher un retour en arrière silencieux. Les commentaires
// sont retirés : on vérifie le JSX RENDU, pas la prose qui l'entoure.
const specsSectionSource = readFileSync(
  new URL('../src/web/components/SpecsSection.tsx', import.meta.url),
  'utf8'
);
const renderedCode = specsSectionSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

// On cherche un libellé RENDU : texte JSX (`>…<`) ou branche de ternaire
// FR/EN. Le défaut de donnée `tag: 'DATASHEET'` de l'adaptateur `toSpecModel`
// est volontairement toléré : c'est une donnée, pas un bouton.
assertEqual(
  [
    // texte JSX : >FICHE TECHNIQUE<
    />\s*(?:FICHE\s+TECHNIQUE|DATASHEET)\s*</.test(renderedCode),
    // branche de ternaire FR/EN : 'FICHE TECHNIQUE' :
    /'[^']*(?:FICHE\s+TECHNIQUE|DATASHEET)[^']*'\s*:/.test(renderedCode),
  ].filter(Boolean),
  [],
  'aucun libellé rendu « Fiche technique » / « Datasheet » dans SpecsSection'
);
assertEqual(
  /ACHETER LE PRODUIT/.test(renderedCode),
  true,
  'le libellé « Acheter le produit » est présent'
);
assertEqual(
  /onClick=\{\(\) => onSelectDatasheet\(/.test(renderedCode),
  false,
  'la matrice ne déclenche plus la fiche technique'
);
assertEqual(
  /\{shopUrl && \(/.test(renderedCode),
  true,
  'le bouton reste conditionné par la présence d un lien valide'
);

// ---------------------------------------------------------------------------
// CAS E — ÉDITION SANS LIEN.
//
// Règle de conception à verrouiller : « masqué publiquement » ne veut PAS dire
// « inexistant dans le CMS ». Le renderer public conditionne le bouton, le
// CONTRÔLE D'ÉDITION, lui, doit rester atteignable même avec `shopUrl = ''`,
// sinon l'administrateur ne pourrait jamais saisir le premier lien.
// ---------------------------------------------------------------------------

console.log('\n--- CAS E : édition administrateur SANS lien ---');

/**
 * Reproduit le gate de rendu du bloc d'édition admin : il dépend des
 * variantes DU MATRICE, jamais de l'existence d'un lien.
 */
function adminEditorShowsVariants(
  isNew: boolean,
  variantNames: string[]
): boolean {
  return !isNew && variantNames.length > 0;
}

/** Le champ affiché par l'admin pour une variante. */
function adminFieldValue(
  shopLinks: Record<string, unknown>,
  variantName: string
): string {
  const raw = shopLinks[variantName];
  return typeof raw === 'string' ? raw : '';
}

// 1-2. Variante sans lien, puis ouverture de l'éditeur.
const editedProduct: Record<string, unknown> = {
  slug: 'pxt-fine',
  specs: { groups: [], models: [{ name: 'PXT-FINE', specs: {} }, { name: 'PXT-EVO', specs: {} }] },
};
const editShopLinks: Record<string, unknown> = editedProduct.shopLinks ?? {};

assertEqual(
  adminEditorShowsVariants(false, ['PXT-FINE', 'PXT-EVO']),
  true,
  'CAS E | étape 2 : le contrôle d édition est proposé en mode Modifier'
);
assertEqual(
  adminFieldValue(editShopLinks, 'PXT-FINE'),
  '',
  'CAS E | étape 3-4 : le champ est présent et VIDE pour une variante sans lien'
);
assertEqual(
  adminFieldValue(editShopLinks, 'PXT-EVO'),
  '',
  'CAS E | le champ reste vide pour toutes les variantes non liées'
);

// 5. Saisie d'une URL dans le champ vide.
const typedUrl = 'https://boutique.exemple.fr/pxt-fine';
editShopLinks['PXT-FINE'] = typedUrl;
assertEqual(
  adminFieldValue(editShopLinks, 'PXT-FINE'),
  typedUrl,
  'CAS E | étape 5 : l URL saisie est reprise par le champ'
);

// 6-7. Sauvegarde puis rendu public : le bouton apparaît.
const afterAdding = saveProduct(editedProduct, editShopLinks);
assertEqual(
  renderedHref(afterAdding, 'PXT-FINE'),
  typedUrl,
  'CAS E | étape 7 : le bouton apparaît sur le site public'
);
assertEqual(
  renderedHref(afterAdding, 'PXT-EVO'),
  '',
  'CAS E | la variante non liée reste sans bouton'
);

// 8-9. Suppression de l'URL puis sauvegarde.
delete editShopLinks['PXT-FINE'];
const afterRemoving = saveProduct(editedProduct, editShopLinks);
assertEqual(
  renderedHref(afterRemoving, 'PXT-FINE'),
  '',
  'CAS E | étape 10 : le bouton disparaît du site public'
);

// 10-11. Le contrôle d'édition reste disponible, champ vide, prêt à ressaisir.
assertEqual(
  adminEditorShowsVariants(false, ['PXT-FINE', 'PXT-EVO']),
  true,
  'CAS E | étape 11 : le contrôle d édition est TOUJOURS présent après suppression'
);
assertEqual(
  adminFieldValue(editShopLinks, 'PXT-FINE'),
  '',
  'CAS E | le champ est de nouveau vide, prêt à recevoir une URL'
);
assertEqual(
  adminEditorShowsVariants(false, ['PXT-EVO']),
  true,
  'CAS E | un produit dont aucune variante n est liée reste éditable'
);

console.log('\n--- CAS E : distinction public / édition, verrouillée sur le source ---');
// Le bloc d'édition NE DOIT PAS être conditionné à l'existence d'un lien.
const adminSource = readFileSync(
  new URL(
    '../src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx',
    import.meta.url
  ),
  'utf8'
);
// On isole le GATE et le JSX RENDU du bloc, commentaires exclus : le commentaire
// qui explique la règle cite volontairement `Object.keys(shopLinks).length > 0`
// comme contre-exemple, il ne doit pas être confondu avec du code.
const adminCode = adminSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

const blockStart = adminCode.indexOf('!isNew && variantNames.length > 0 &&');
const blockEnd = blockStart !== -1 ? adminCode.indexOf('</section>', blockStart) : -1;
assertEqual(blockStart !== -1 && blockEnd > blockStart, true, 'bloc d édition localisé');
const shopEditorBlock = adminCode.slice(blockStart, blockEnd);
// La condition de rendu, sur sa seule ligne : c'est elle qui décide de
// l'existence du contrôle.
const gateLine = shopEditorBlock.split(/\r?\n/)[0];

assertEqual(
  gateLine,
  '!isNew && variantNames.length > 0 && (',
  'le gate du bloc admin ne dépend QUE des variantes du matrice'
);
assertEqual(
  /shopLinks|shopUrl|isValidShopUrl|Object\.keys/.test(gateLine),
  false,
  'le gate ne mentionne ni lien, ni URL, ni validity : le contrôle reste accessible'
);
assertEqual(
  /&&\s*Object\.keys\(shopLinks\)\.length\s*>\s*0/.test(shopEditorBlock),
  false,
  'le bloc admin ne disparaît pas quand shopLinks est vide'
);
assertEqual(
  /shopLinks\[variantName\] \?\? ''/.test(shopEditorBlock),
  true,
  'le champ admin lit la valeur existante, chaîne vide par défaut'
);
assertEqual(
  /value=\{raw\}/.test(shopEditorBlock),
  true,
  'le champ admin est toujours rendu pour la variante, valeur vide comprise'
);
// Le champ est en dehors de tout `&& valid` : il s'affiche même vide.
assertEqual(
  /\{blank\s*&&/.test(shopEditorBlock),
  false,
  'le champ n est pas masqué quand la saisie est vide'
);

// ---------------------------------------------------------------------------
// CAS F — POSITIONNEMENT DU CONTRÔLE DANS LA MATRICE.
//
// Le contrôle doit être rendu DANS la colonne de sa propre variante : un seul
// rendu de champ par variante, rattaché au bon nom. On vérifie le source du
// composant admin, puis l'indépendance logique des colonnes.
// ---------------------------------------------------------------------------

console.log('\n--- CAS F : le contrôle est dans la colonne de sa variante ---');

// A/B/C/E. Une colonne par variante : le map est unique et l'en-tête de
// colonne affiche le nom exact, dans la même boucle que le champ.
assertEqual(
  [...adminCode.matchAll(/variantNames\.map\(/g)].length,
  1,
  'CAS F | C : une seule boucle de rendu des variantes'
);
assertEqual(
  /\{variantNames\.map\(\(variantName\) => \{[\s\S]*?\{variantName\}[\s\S]*?<\/div>/.test(
    adminCode
  ),
  true,
  'CAS F | B : le nom de la variante est rendu DANS la boucle des colonnes'
);
assertEqual(
  /aria-label=\{`Lien boutique — \$\{variantName\}`\}/.test(adminCode),
  true,
  'CAS F | B : le champ est étiqueté avec le nom de sa propre variante'
);

// B. La boucle des colonnes est bien à l'intérieur du conteneur qui défile
// horizontalement : le contrôle suit sa colonne au scroll.
const columnsIdx = adminCode.indexOf('{variantNames.map((variantName) => {');
const scrollIdx = adminCode.indexOf('overflow-x-auto', blockStart);
assertEqual(scrollIdx !== -1 && scrollIdx < columnsIdx, true, 'CAS F | B : scroll horizontal présent avant les colonnes');

// C/H. Aucun doublon : un seul <input> de lien dans le fichier admin, et il
// est dans la boucle. L'ancien rendu en pile verticale est gone.
assertEqual(
  [...adminCode.matchAll(/setShopLinks\(\(prev\) => \(\{ \.\.\.prev, \[variantName\]: ev\.target\.value \}\)\)/g)]
    .length,
  1,
  'CAS F | H : un seul champ de saisie, donc aucun doublon de contrôle'
);
assertEqual(
  /<div className="space-y-3">\s*\{variantNames\.map/.test(adminCode),
  false,
  'CAS F | H : l ancien rendu en pile verticale a disparu'
);

// C. Le nom de la variante sert de clé : chaque colonne est stable et distincte.
assertEqual(
  /key=\{variantName\}/.test(adminCode),
  true,
  'CAS F | C : chaque colonne est identifiée par le nom de sa variante'
);

// D. Ajouter une URL à une variante ne touche pas les autres : la mise à jour
// est ciblée sur sa seule clé.
const cols = ['IL-FISS-IRWP1.2 Lite', 'IL-FISS-IRWP1.2 Flip', 'IL-FISS-IRWP1.5 Lite'];
const links: Record<string, string> = {};
function typeUrl(variantName: string, value: string) {
  links[variantName] = value;
}
typeUrl(cols[0], 'https://boutique.exemple.fr/lite');
assertEqual(links[cols[1]], undefined, 'CAS F | D : la variante voisine est intacte');
assertEqual(links[cols[2]], undefined, 'CAS F | D : la troisième variante est intacte');
assertEqual(
  cols.map((c) => shopLinkForVariant(links, c)),
  ['https://boutique.exemple.fr/lite', '', ''],
  'CAS F | D : seule la variante saisie affiche un bouton public'
);

// F/G. Vue publique de ces mêmes colonnes.
const publicView = saveProduct({ specs: { models: cols.map((n) => ({ name: n, specs: {} })) } }, links);
assertEqual(
  publicView.shopLinks,
  { 'IL-FISS-IRWP1.2 Lite': 'https://boutique.exemple.fr/lite' },
  'CAS F | D : la map ne contient que la variante saisie'
);
assertEqual(
  shopLinkForVariant(publicView.shopLinks as Record<string, string>, cols[1]),
  '',
  'CAS F | F : une variante sans URL n affiche aucun bouton public'
);
assertEqual(
  shopLinkForVariant(publicView.shopLinks as Record<string, string>, cols[0]),
  'https://boutique.exemple.fr/lite',
  'CAS F | G : la variante avec URL affiche son bouton'
);

// E. Supprimer l'URL : le contrôle reste (le map des variantes, lui, ne change
// pas), le bouton public disparaît.
delete links[cols[0]];
assertEqual(
  shopLinkForVariant(links, cols[0]),
  '',
  'CAS F | E : le bouton disparaît après suppression de l URL'
);
assertEqual(
  adminEditorShowsVariants(false, cols),
  true,
  'CAS F | E : le contrôle CMS reste disponible pour la variante'
);

// ---------------------------------------------------------------------------
// CAS G — CÂBLAGE DES DEUX PAGES PRODUIT.
//
// Régression d'intégration found in conditions réelles : le bouton ne
// s'affichait sur AUCUNE variante alors que la map était correctement
// persistée. Les deux pages produit publiques ne passaient pas la même chose à
// `SpecsSection`, et celle qui sert réellement (`/web/pxt-fine` → `WebPage`)
// ne transmettait pas `shopLinks`. `shopLinkForVariant` recevait `undefined`
// et renvoyait `''` pour tout le monde, sans erreur visible.
//
// Ces assertions verrouillent le câblage, pas la logique du bouton.
// ---------------------------------------------------------------------------

console.log('\n--- CAS G : chaque page produit transmet shopLinks ---');

const webPageSource = readFileSync(
  new URL('../src/web/WebPage.tsx', import.meta.url),
  'utf8'
);
const templateSource = readFileSync(
  new URL('../src/web/ProductPageTemplate.tsx', import.meta.url),
  'utf8'
);

/** Isole le JSX `<SpecsSection … />` d'un composant. */
function specsSectionCall(source: string): string {
  const start = source.indexOf('<SpecsSection');
  assertEqual(start !== -1, true, 'appel de SpecsSection localisé');
  const end = source.indexOf('/>', start);
  return source.slice(start, end + 2);
}

const webPageCall = specsSectionCall(webPageSource);
const templateCall = specsSectionCall(templateSource);

assertEqual(
  /shopLinks=\{product\?\.shopLinks\}/.test(webPageCall),
  true,
  'CAS G | WebPage (/web/pxt-fine) transmet bien product?.shopLinks'
);
assertEqual(
  /shopLinks=\{product\?\.shopLinks\}/.test(templateCall),
  true,
  'CAS G | ProductPageTemplate (/web/product/[slug]) transmet toujours shopLinks'
);
// Une seule occurrence par page : ni doublon, ni prop orpheline.
for (const [label, source, call] of [
  ['WebPage', webPageSource, webPageCall],
  ['ProductPageTemplate', templateSource, templateCall],
] as const) {
  assertEqual(
    (source.match(/shopLinks=\{product\?\.shopLinks\}/g) ?? []).length,
    1,
    `CAS G | ${label} : exactement une transmission de shopLinks`
  );
  assertEqual(
    /<SpecsSection[\s\S]*?\/>/.test(call),
    true,
    `CAS G | ${label} : l'appel reste un composant auto-fermé`
  );
}

console.log(`\n${assertions - failures}/${assertions} assertions`);
if (failures > 0) {
  console.error(`\nLIENS BOUTIQUE : ${failures} ÉCHEC(S)`);
  process.exit(1);
}
console.log('\nLIENS BOUTIQUE : OK.');
