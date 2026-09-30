/**
 * Hook de résolution pour les tests Node.
 *
 * Le code applicatif importe sans extension (`./master-template`), comme
 * l'exige TypeScript en production. Le runner natif `node
 * --experimental-strip-types` n'ajoute pas `.ts` tout seul : sans ce hook, le
 * chargement du module échoue alors que `tsc` est perfectly content.
 *
 * L'alias `@/` est également résolu ici, pour la même raison : sans lui, un
 * module applicatif qui importe `@/lib/...` ne peut pas être chargé par un test
 * qui veut l'exécuter pour de vrai plutôt que d'en lire la source.
 *
 * Ce fichier n'est utilisé QUE par les scripts de test, jamais par le build.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
const SRC_ROOT = new URL('../src/', import.meta.url);

/** Résout une URL en essayant les extensions usuelles, comme le fait `tsc`. */
function resolveWithExtension(base) {
  for (const candidate of CANDIDATES) {
    const target = new URL(base.href + candidate);
    if (existsSync(fileURLToPath(target))) {
      return { url: pathToFileURL(fileURLToPath(target)).href, shortCircuit: true };
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const isAlias = specifier.startsWith('@/');
    const hasKnownExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (!isRelative && !isAlias) return nextResolve(specifier, context);
    if (hasKnownExtension) return nextResolve(specifier, context);

    const base = isAlias
      ? new URL(specifier.slice(2), SRC_ROOT)
      : new URL(specifier, context.parentURL);
    return resolveWithExtension(base) ?? nextResolve(specifier, context);
  },
});
