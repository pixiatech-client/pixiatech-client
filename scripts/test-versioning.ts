// Tests SemVer obligatoires pour le système de versionnement.
// Exécution : node --experimental-strip-types scripts/test-versioning.ts
import { compareVersions, isVersionNewer, parseVersion } from '../src/lib/version.ts';

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

console.log('--- Règle absolue : notification UNIQUEMENT si latest > current ---');
assertEqual(isVersionNewer('0.1.0', '0.1.0'), false, 'current=0.1.0 latest=0.1.0 → AUCUNE notification');
assertEqual(isVersionNewer('0.1.1', '0.1.0'), true, 'current=0.1.0 latest=0.1.1 → notification');
assertEqual(isVersionNewer('0.1.1', '0.1.1'), false, 'current=0.1.1 latest=0.1.1 → AUCUNE notification');
assertEqual(isVersionNewer('0.1.10', '0.1.9'), true, 'current=0.1.9 latest=0.1.10 → notification');
assertEqual(isVersionNewer('0.1.9', '0.1.10'), false, 'current=0.1.10 latest=0.1.9 → AUCUNE notification (rollback)');
assertEqual(isVersionNewer('0.2.0', '0.1.3'), true, 'current=0.1.3 latest=0.2.0 → notification');

console.log('--- Cas supplémentaires ---');
assertEqual(isVersionNewer('1.0.0', '0.1.99'), true, 'current=0.1.99 latest=1.0.0 → notification');
assertEqual(isVersionNewer('0.1.1', '0.1.2'), false, 'current=0.1.2 latest=0.1.1 → AUCUNE notification');
assertEqual(isVersionNewer('v0.1.1', '0.1.0'), true, 'préfixe "v" accepté');
assertEqual(isVersionNewer('0.1.1', undefined), false, 'current inconnu → aucune notification');
assertEqual(isVersionNewer(undefined, '0.1.1'), false, 'latest inconnu → aucune notification');

console.log('--- Comparaison réelle (compareVersions) ---');
assertEqual(compareVersions('0.1.9', '0.1.10'), -1, '0.1.9 < 0.1.10');
assertEqual(compareVersions('0.1.10', '0.1.9'), 1, '0.1.10 > 0.1.9');
assertEqual(compareVersions('0.2.0', '0.1.99'), 1, '0.2.0 > 0.1.99');
assertEqual(compareVersions('0.1.1', '0.1.1'), 0, '0.1.1 === 0.1.1');
assertEqual(compareVersions('0.1.0', '0.1.0'), 0, '0.1.0 === 0.1.0');
assertEqual(compareVersions('1.0.0', '0.2.0'), 1, '1.0.0 > 0.2.0');

console.log('--- parseVersion ---');
assertEqual(parseVersion('0.1.1'), { major: 0, minor: 1, patch: 1 }, 'parse 0.1.1');
assertEqual(parseVersion('v0.1.10'), { major: 0, minor: 1, patch: 10 }, 'parse v0.1.10');
assertEqual(parseVersion('0.1.1-beta.2'), { major: 0, minor: 1, patch: 1 }, 'parse ignore pré-release');
assertEqual(parseVersion(''), { major: 0, minor: 0, patch: 0 }, 'parse chaîne vide');

console.log('--- Scénarios de cycle release/update ---');
// Installé 0.1.0 (bundle ancien), serveur passe à 0.1.1
assertEqual(isVersionNewer('0.1.1', '0.1.0'), true, 'cycle: installé 0.1.0, build 0.1.1 → NOTIFICATION');
// Après Mettre à jour + reload : installé = 0.1.1, serveur = 0.1.1
assertEqual(isVersionNewer('0.1.1', '0.1.1'), false, 'cycle: après update installé=0.1.1, serveur=0.1.1 → AUCUNE notification');

console.log('--- Output JSON ---');
const output = {
  testCount: assertions,
  failures,
  rules: {
    equal: isVersionNewer('0.1.1', '0.1.1'),
    newer: isVersionNewer('0.1.1', '0.1.0'),
    rollback: isVersionNewer('0.1.0', '0.1.1'),
  },
};
console.log(JSON.stringify(output, null, 2));

if (failures > 0) {
  console.error(`${failures} test(s) ÉCHOUÉ(S) sur ${assertions}`);
  process.exit(1);
}
console.log(`Tous les ${assertions} tests passent.`);
process.exit(0);
