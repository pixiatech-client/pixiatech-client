#!/usr/bin/env node
// scripts/install-git-hooks.mjs
// Installe le hook pre-push dans .git/hooks pour s'assurer que les versions
// sont systématiquement incrémentées à chaque déploiement/push.
import { writeFileSync, existsSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const hooksDir = join(root, '.git', 'hooks');

if (!existsSync(hooksDir)) {
  console.log('ℹ️ Pas de répertoire .git/hooks trouvé (non initialisé ou archive).');
  process.exit(0);
}

const prePushContent = `#!/bin/sh
# Hook de garde PixiaTech pre-push
# Empêche un push accidentel sans incrémentation de version.

if [ "$SKIP_PRE_PUSH_CHECK" = "1" ]; then
  exit 0
fi

# Vérifie si le dernier commit est un bump de version
last_commit_msg=$(git log -1 --pretty=%B 2>/dev/null)

case "$last_commit_msg" in
  chore\\(version\\)*)
    # Déjà bumpé, on laisse passer
    exit 0
    ;;
  *)
    echo ""
    echo "========================================================================"
    echo "⚠️  [PIXIATECH VERSION CHECK]"
    echo "Attention : Vous tentez de faire un push sans avoir incrémenté la version !"
    echo ""
    echo "👉 Pour que la version soit automatiquement incrémentée (+0.0.1) et que"
    echo "   vos utilisateurs reçoivent le popup de mise à jour, lancez :"
    echo ""
    echo "      npm run push"
    echo ""
    echo "(Pour forcer le push sans incrémentation : git push --no-verify)"
    echo "========================================================================"
    echo ""
    exit 1
    ;;
esac
`;

const hookPath = join(hooksDir, 'pre-push');
writeFileSync(hookPath, prePushContent, { encoding: 'utf8', mode: 0o755 });
try {
  chmodSync(hookPath, 0o755);
} catch {
  /* Windows ignore chmod */
}

console.log('✅ Hook Git pre-push installé avec succès dans .git/hooks/pre-push !');
