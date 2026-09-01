/**
 * Comparaison SemVer (major.minor.patch) avec valeurs numériques réelles.
 * Accepte "0.1.1", "v0.1.1", "0.1.10" (compare 9 < 10 correctement),
 * ignore tout suffixe (pré-release, build) : "-beta", "+abc", etc.
 */

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Scinde une chaîne de version en [major, minor, patch] numériques.
 * Nettoyage : retire le préfixe "v"/"V" et tout suffixe après "-" ou "+".
 */
export function parseVersion(raw: string | undefined | null): ParsedVersion {
  if (!raw) return { major: 0, minor: 0, patch: 0 };

  const cleaned = String(raw)
    .trim()
    .replace(/^[vV]/, '')
    .split(/[-+]/)[0]
    .trim();

  const parts = cleaned.split('.');
  const toInt = (part: string | undefined): number => {
    if (part === undefined) return 0;
    const n = Number(part);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    major: toInt(parts[0]),
    minor: toInt(parts[1]),
    patch: toInt(parts[2]),
  };
}

/**
 * Compare deux versions SemVer.
 * @returns -1 si a < b, 0 si a === b, 1 si a > b
 */
export function compareVersions(
  a: string | undefined | null,
  b: string | undefined | null
): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

/**
 * Vraie promotion possible : simple comparaison de chaînes (~ancien bug)
 * ou JavaScript < sur des nombres est insuffisant (0.1.9 vs 0.1.10).
 * Retourne true UNIQUEMENT si latest > current (strictement).
 * latest === current → false. latest < current (rollback) → false.
 * Valeur manquante/invalide (current OU latest) → false (conservateur :
 * on ne signale jamais une mise à jour sans une valeur fiable de chaque côté).
 */
export function isVersionNewer(
  latest: string | undefined | null,
  current: string | undefined | null
): boolean {
  if (!latest || !current) return false;
  if (!String(latest).trim() || !String(current).trim()) return false;
  return compareVersions(latest, current) === 1;
}
