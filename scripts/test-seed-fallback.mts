/**
 * Test de REGRESSION du filet de securite produit (le seed).
 *
 * Regression couverte : `106465f` — un commit de sauvegarde, pas un commit de
 * fonctionnalite — a vide `data/products-seed.json` (2 produits, -936 lignes).
 * Or `pxt-fine` et `wk-series` sont ABSENTS de `site_web_products`, et
 * `getSeedProductBySlug` est strict (`products.find(...) ?? null`) : sur un
 * tableau vide il renvoie toujours `null`. La route publique rendait donc
 * `notFound()` et `/web/product/pxt-fine` comme `/web/product/wk-series`
 * passaient de 200 a 404 des le deploiement.
 *
 * Ce test verrouille les DEUX moities de la correction :
 *   1. le seed contient bien les deux slugs attendus (resolution) ;
 *   2. le tableau de specifications se remplit reellement (rendu).
 *
 * Le point 2 est indispensable : une page 200 dont les cellules sont vides
 * ou remplies de tirets passerait le point 1 et resterait un defaut. On ne
 * teste donc pas qu'une donnee existe, mais ce que le composant produit
 * reellement — meme exigence que `test-specs-render.mts`, dont ce fichier est
 * le pendant pour le chemin « produit absent de Firestore ».
 *
 * Aucune ecriture : ce test lit le seed et rend du HTML.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync } from 'node:fs';
import { SpecsSection } from '@/web/components/SpecsSection';
import { getSeedProductBySlug } from '@/lib/products/seed';

let assertions = 0;
let failures = 0;

function check(label: string, ok: boolean, detail?: string): void {
  assertions += 1;
  if (ok) return;
  failures += 1;
  console.error(`  ECHEC  ${label}${detail ? ` -> ${detail}` : ''}`);
}

function section(title: string): void {
  console.log(`\n--- ${title}`);
}

/**
 * Slugs servis par le seed parce qu'ils n'existent pas dans Firestore.
 * Volontairement ecrit en dur : si un jour l'un d'eux est publie en base, ce
 * test doit le signaler — c'est exactement le moment ou le seed peut mourir
 * sans que plus personne ne s'en apercoive.
 */
const SEED_SLUGS = ['pxt-fine', 'wk-series'];

// ---------------------------------------------------------------------------
// 1. Resolution : le seed doit repondre pour chaque slug.
// ---------------------------------------------------------------------------
section('RESOLUTION : le seed repond pour chaque slug attendu');

for (const slug of SEED_SLUGS) {
  const product = getSeedProductBySlug(slug);

  check(`${slug} : le seed le resout`, product !== null, 'getSeedProductBySlug a renvoye null -> la route rendrait 404');
  if (!product) continue;

  const models = product.specs?.models?.length ?? 0;
  const groups = product.specs?.groups?.length ?? 0;

  console.log(`  ${slug.padEnd(12)} ${product.name} : ${models} modeles, ${groups} groupes`);
  check(`${slug} : au moins un modele`, models > 0, 'aucun modele dans specs.models');
  check(`${slug} : au moins un groupe de lignes`, groups > 0, 'aucun groupe dans specs.groups');
}

// ---------------------------------------------------------------------------
// 2. Rendu : la page doit afficher des valeurs, pas des tirets ni du vide.
// ---------------------------------------------------------------------------
section('RENDU : cellules remplies, aucun tiret de gabarit');

for (const slug of SEED_SLUGS) {
  const product = getSeedProductBySlug(slug);
  if (!product) continue;

  const html = renderToStaticMarkup(
    React.createElement(SpecsSection, {
      lang: 'fr' as never,
      specs: product.specs as never,
    })
  );

  // Le TEXTE de chaque cellule : ce qui se trouve entre la balise ouvrante et
  // le `</div>` qui la ferme. Extraire le texte, et non la balise : sinon un
  // « — » passerait inaperçu dans un fragment de markup.
  const cells = [...html.matchAll(/class="spec-val"[\s\S]*?>([^<]*)<\/div>/g)].map((m) => (m[1] ?? '').trim());

  const dashes = cells.filter((v) => v === '\u2014' || v === '\u2015' || v === '-');
  const populated = cells.filter((v) => v.length > 0);
  // Une cellule VIDE est un manque de donnee reel dans le seed (un modele qui
  // n'a pas cette cle), pas un defect du renderer. Le renderer doit la laisser
  // vide plutot que d'y mettre un tiret : d'ou l'absence d'assertion « zero
  // vide ». Le compte est affiche pour que laderive reste visible.
  const empties = cells.length - populated.length;

  console.log(
    `  ${slug.padEnd(12)} ${cells.length} cellules, ${populated.length} remplies, ` +
      `${dashes.length} tiret(s), ${empties} vide(s)`
  );

  check(`${slug} : le tableau est rendu`, cells.length > 0, 'aucune cellule spec-val dans le HTML');
  check(`${slug} : des cellules remplies`, populated.length > 0, 'aucune valeur affichee');
  check(`${slug} : aucun tiret de gabarit`, dashes.length === 0, `${dashes.length} cellule(s) en tiret`);

  // Une valeur temoin : si le renderer s'emptrait plus, on le voit tout de suite.
  check(
    `${slug} : une valeur temoin est presente`,
    html.includes('INDOOR'),
    'aucune valeur connue du seed dans le HTML'
  );
}

// ---------------------------------------------------------------------------
// 3. Resolution de la route reelle — optionnel, necessite des credentials.
// ---------------------------------------------------------------------------
// `resolvePublicProduct` interroge Firestore, donc ce controle ne peut pas
// faire partie du socle hermetique du test : sans credentials, l'Admin SDK
// leve une erreur non rattrapable et emporte le processus. Il ne s'execute
// donc que si des credentials sont reellement disponibles, et son absence
// est rapportee explicitement plutot que silencieuse.
//
//   GOOGLE_APPLICATION_CREDENTIALS=<chemin> npm run test:seed-fallback
section('RESOLUTION ROUTE (optionnel, necessite des credentials Firestore)');

const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentials || !existsSync(credentials)) {
  console.log('  IGNORE : GOOGLE_APPLICATION_CREDENTIALS absent ou introuvable.');
  console.log('  Les controles 1 et 2 couvrent la regression sans reseau.');
} else {
  try {
    const { resolvePublicProduct } = await import('@/lib/products/resolve-public-product');

    for (const slug of SEED_SLUGS) {
      const resolved = await resolvePublicProduct(slug);
      check(`${slug} : la route reelle le resout`, resolved !== null, 'resolvePublicProduct -> null => 404');
      console.log(`  ${slug.padEnd(12)} -> ${resolved ? resolved.name : 'NULL => 404'}`);
    }
  } catch (error) {
    // On ne laisse pas une panne de credentials faire echouer le test : elle
    // ne dit rien du seed. Elle est signalee, et le statut reste decide par
    // les controles hermetiques.
    console.log(`  IGNORE : lecture Firestore impossible (${(error as Error).message.split('\n')[0]})`);
    console.log('  Les controles 1 et 2 couvrent la regression sans reseau.');
  }
}

console.log(
  failures === 0
    ? `\n${assertions}/${assertions} assertions passées.\nFilet de securite produit : OK.`
    : `\n${assertions - failures}/${assertions} assertions passees, ${failures} ECHEC(S).`
);
process.exit(failures === 0 ? 0 : 1);
