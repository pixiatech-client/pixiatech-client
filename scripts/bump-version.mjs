// Incrémente la version patch de package.json (+0.0.1) puis régénère build-info.ts.
// Utilisé avant chaque push : à chaque push, la version SemVer monte de 0.0.1
// (0.1.1 → 0.1.2 → 0.1.3 ...), ce qui déclenche la détection "nouvelle version disponible".
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pkgPath = join(root, 'package.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const [major, minor, patch] = String(pkg.version || '0.0.0')
  .replace(/^v/, '')
  .split('.')
  .map((n) => parseInt(n, 10) || 0);

const newVersion = `${major}.${minor}.${patch + 1}`;
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`[version] package.json incrémenté : ${pkg.version} -> ${newVersion}`);

// Régénère build-info.ts avec la nouvelle version + commit + timestamp (même logique que write-build-info.mjs).
let commit = 'dev';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
} catch {
  /* pas de dépôt git */
}

const buildTime = new Date().toISOString();
const outPath = join(root, 'src', 'lib', 'build-info.ts');
const content = `// Auto-généré par scripts/write-build-info.mjs au moment du build.
// Régénéré à chaque \`next build\` via le script "prebuild". Peut être committé
// (sert de valeur par défaut pour \`next dev\`), la compilation l'actualise toujours.
export const APP_VERSION = ${JSON.stringify(newVersion)};
export const BUILD_COMMIT = ${JSON.stringify(commit)};
export const BUILD_TIME = ${JSON.stringify(buildTime)};
export const BUILD_SIGNATURE = ${JSON.stringify(`${newVersion}-${commit}-${buildTime}`)};
`;
const ctime = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
if (ctime !== content) {
  writeFileSync(outPath, content, 'utf8');
  console.log(`[build-info] écrit ${outPath} (v${newVersion} @ ${commit} @ ${buildTime})`);
}
