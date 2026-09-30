import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

/**
 * Modules serveur-only. Les atteindre depuis un composant 'use client' fait
 * echouer le bundle navigateur : firebase-admin tire grpc-js / google-gax, qui
 * utilisent des builtins Node (fs, http2, net, tls, child_process, dns).
 * Symptome : page Admin blanche/500 cote client alors que le serveur compile.
 */
const SERVER_ONLY = [
  { re: /from ['"]@\/lib\/firebase-admin['"]/, name: '@/lib/firebase-admin' },
  { re: /from ['"]@\/lib\/site-web\/firestore['"]/, name: '@/lib/site-web/firestore' },
  { re: /from ['"]firebase-admin/, name: 'firebase-admin' },
];

const files = new Map(); // absPath -> source
const roots = []; // 'use client' files

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) {
      const src = fs.readFileSync(full, 'utf8');
      files.set(full, src);
      if (/^\s*['"]use client['"]/m.test(src)) roots.push(full);
    }
  }
}
walk(SRC);

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

/** Resout un specifier vers un fichier du repo, ou null si externe/inconnu. */
function resolve(spec, fromFile) {
  let base;
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // paquet npm : hors perimetre
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (files.has(base + ext)) return base + ext;
  }
  return null;
}

const importRe = /(?:^|\n)\s*import\s+(?:type\s+)?(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/g;

/**
  * Marche en profondeur depuis chaque racine client. `import type` est elimine
  * : il disparait a la compilation et ne peut pas peser sur le bundle.
  *
  * Un fichier `'use server'` est une FRONTIERE : Next le compile en stubs
  * d'actions serveur, son corps ne part jamais dans le bundle navigateur. On
  * s'arrete donc la sans descendre dans ses imports, sinon chaque `actions.ts`
  * serait signale a tort.
  */
function findServerOnlyPath(start) {
  const seen = new Set();
  const stack = [[start, [start]]];
  while (stack.length) {
    const [file, pathSoFar] = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const src = files.get(file);
    if (!src) continue;
    if (/^\s*['"]use server['"]/m.test(src)) continue; // frontiere : ne pas descendre
    if (SERVER_ONLY.some((s) => s.re.test(src))) {
      return { file, pathSoFar };
    }
    let m;
    const re = new RegExp(importRe.source, 'g');
    while ((m = re.exec(src))) {
      if (/\bimport\s+type\b/.test(m[0])) continue;
      const target = resolve(m[1], file);
      if (target && !seen.has(target)) stack.push([target, [...pathSoFar, target]]);
    }
  }
  return null;
}

const offenders = [];
for (const root of roots) {
  const hit = findServerOnlyPath(root);
  if (!hit) continue;
  const which = SERVER_ONLY.find((s) => s.re.test(files.get(hit.file)));
  offenders.push({
    entry: rel(root),
    via: hit.pathSoFar.map(rel),
    target: `${rel(hit.file)} (${which.name})`,
  });
}

console.log(`Racines client scannées : ${roots.length} (fichiers 'use client' dans src/)`);
if (offenders.length === 0) {
  console.log('CLIENT-SERVER-BOUNDARY-PASS (aucun chemin client -> firebase-admin)');
  process.exit(0);
}
console.log(`CLIENT-SERVER-BOUNDARY-FAIL (${offenders.length})`);
for (const o of offenders) {
  console.log(`  ${o.entry}`);
  console.log(`    via ${o.via.join(' -> ')}`);
}
process.exit(1);
