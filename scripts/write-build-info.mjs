// Génère src/lib/build-info.ts avec le commit Git réel et l'horodatage du build.
// Exécuté avant chaque `next build` (voir le script "prebuild" dans package.json).
// Écrit un module réellement lié au build déployé : une nouvelle compilation produit
// toujours une nouvelle signature (commit + buildTime), contrairement à un timestamp runtime.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Commit Git court (ou fallback 'dev' en l'absence de dépôt).
let commit = 'dev';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root })
    .toString()
    .trim();
} catch {
  /* pas de dépôt git : on garde 'dev' */
}

// Version lue depuis package.json.
let version = '0.0.0';
try {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  version = pkg.version || '0.0.0';
} catch {
  /* ignore */
}

// Horodatage ISO réel de la compilation.
const buildTime = new Date().toISOString();

const outPath = join(root, 'src', 'lib', 'build-info.ts');
const ctime = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';

const content = `// Auto-généré par scripts/write-build-info.mjs au moment du build.
// Régénéré à chaque \`next build\` via le script "prebuild". Peut être committé
// (sert de valeur par défaut pour \`next dev\`), la compilation l'actualise toujours.
export const APP_VERSION = ${JSON.stringify(version)};
export const BUILD_COMMIT = ${JSON.stringify(commit)};
export const BUILD_TIME = ${JSON.stringify(buildTime)};
export const BUILD_SIGNATURE = ${JSON.stringify(`${version}-${commit}-${buildTime}`)};
`;

if (ctime !== content) {
  writeFileSync(outPath, content, 'utf8');
  console.log(`[build-info] écrit ${outPath} (v${version} @ ${commit} @ ${buildTime})`);
} else {
  console.log('[build-info] inchangé, aucune écriture nécessaire.');
}
