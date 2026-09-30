/**
 * Hook de résolution pour les tests Node.
 *
 * Le code applicatif importe sans extension (`./master-template`), comme
 * l'exige TypeScript en production. Le runner natif `node
 * --experimental-strip-types` n'ajoute pas `.ts` tout seul : sans ce hook, le
 * chargement du module échoue alors que `tsc` est perfectly content.
 *
 * Ce fichier n'est utilisé QUE par les scripts de test, jamais par le build.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';

const CANDIDATES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasKnownExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (!isRelative || hasKnownExtension) return nextResolve(specifier, context);

    const base = new URL(specifier, context.parentURL);
    for (const candidate of CANDIDATES) {
      const target = new URL(base.href + candidate);
      if (existsSync(fileURLToPath(target))) {
        return { url: pathToFileURL(fileURLToPath(target)).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
