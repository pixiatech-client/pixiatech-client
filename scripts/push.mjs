#!/usr/bin/env node
// scripts/push.mjs
// Commande officielle pour pusher avec incrémentation automatique de version (+0.0.1)
// Usage: npm run push [-- <arguments git push supplémentaires>]
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

console.log('\n🚀 [PixiaTech Push] Début du processus de déploiement et d’incrémentation...\n');

// 1. Incrémenter la version patch (+0.0.1) et régénérer build-info.ts
try {
  execSync('node scripts/bump-version.mjs', { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.error('❌ Échec de l’incrémentation de la version :', e.message);
  process.exit(1);
}

// 2. Lire la nouvelle version depuis package.json
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const newVersion = pkg.version;

// 3. Ajouter les fichiers modifiés par le versioning au staging Git
try {
  execSync('git add package.json src/lib/build-info.ts', { cwd: root, stdio: 'inherit' });
  // Ajouter package-lock.json si présent et modifié
  try {
    execSync('git add package-lock.json', { cwd: root, stdio: 'ignore' });
  } catch {
    /* ignore si absent */
  }
} catch (e) {
  console.error('❌ Échec du staging Git :', e.message);
  process.exit(1);
}

// 4. Créer le commit de bump
try {
  execSync(`git commit -m "chore(version): v${newVersion}"`, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SKIP_PRE_PUSH_CHECK: '1' },
  });
  console.log(`\n📦 Commit de version créé : chore(version): v${newVersion}\n`);
} catch (e) {
  console.warn('⚠️ Aucun nouveau changement à committer ou commit déjà existant.');
}

// 5. Exécuter git push
const extraArgs = process.argv.slice(2);
console.log(`📤 Envoi vers le dépôt distant (git push ${extraArgs.join(' ')})...`);

const pushResult = spawnSync('git', ['push', ...extraArgs], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SKIP_PRE_PUSH_CHECK: '1' },
});

if (pushResult.status === 0) {
  console.log(`\n🎉 SUCCÈS : L’application a été poussée avec la version ${newVersion} !`);
  console.log(`   Dès que le serveur ou le CDN servira cette version, les administrateurs connectés`);
  console.log(`   recevront la pop-up pour mettre à jour l’application.\n`);
} else {
  console.error(`\n❌ Échec du push Git (code ${pushResult.status}).`);
  process.exit(pushResult.status || 1);
}
