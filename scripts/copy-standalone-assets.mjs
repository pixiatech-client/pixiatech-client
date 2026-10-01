// Recopie public/ et .next/static dans .next/standalone/ après `next build`.
// Exécuté via le script "postbuild" dans package.json.
//
// Pourquoi : Firebase App Hosting exécute le build avec l'adaptateur Google
// (apphosting-adapter-nextjs-build), qui réécrit next.config.mjs pour forcer
// `output: 'standalone'` avant de lancer notre `npm run build`. Or un build
// standalone Next ne recopie JAMAIS `public/` dans `.next/standalone/`.
// Le serveur déployé démarre alors sur `node .next/standalone/server.js` sans
// aucun fichier statique : toute URL de /public/ est servie par le catch-all
// `src/app/[[...step]]/page.tsx`, qui renvoie la page d'accueil en text/html.
// Les images des pages produit apparaissent alors cassées en production alors
// qu'elles s'affichent en local (localhost sert bien le dossier public/).
//
// Sans effet de bord hors standalone : si `.next/standalone` est absent (build
// classique, `next dev`, `next start`), le script sort sans rien modifier.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  console.log('[standalone-assets] build non-standalone, rien à copier.');
  process.exit(0);
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    total += statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return total;
}

const copies = [
  { from: join(root, 'public'), to: join(standalone, 'public') },
  { from: join(root, '.next', 'static'), to: join(standalone, '.next', 'static') },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.log(`[standalone-assets] source absente, ignorée : ${from}`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, force: true });
  console.log(
    `[standalone-assets] ${to.replace(root + '\\', '')} <- ${countFiles(to)} fichier(s) depuis ${from.replace(root + '\\', '')}`
  );
}

console.log('[standalone-assets] copie terminée.');
