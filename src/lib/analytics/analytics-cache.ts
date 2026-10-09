// Cache mémoïsé en mémoire (par instance serveur) pour les lectures analytics.
//
// Pourquoi : le tableau de bord Analytics monte 8 endpoints en parallèle, et
// chacun refait le même full-scan Firestore des sessions (jusqu'à 25 000 docs ×
// 2 fenêtres). Un cache court (quelques secondes) + déduplication des appels en
// vol réduit ce coût d'un ordre de grandeur sans détester les données : la
// fenêtre est de plusieurs jours, une latence de 30 s est invisible.
//
// La cache n'est PAS distribuée : sur plusieurs instances chacun garde la
// sienne, ce qui est suffisant — le gain est de ne pas rescanner la collection
// à chaque requête, pas de partager des données cross-instance.
// `clearAnalyticsCache()` est appelé quand un admin réinitialise les données.

export const ANALYTICS_CACHE_TTL_MS = 30_000;
const MAX_ENTRIES = 16;

interface Entry<T = unknown> {
  value?: T;
  resolvedAt?: number;
  promise?: Promise<T>;
}

const cache = new Map<string, Entry>();

function sweep(now: number): void {
  const staleKeys: string[] = [];
  cache.forEach((entry, key) => {
    if (entry.promise) return;
    if (entry.resolvedAt === undefined || now - entry.resolvedAt > ANALYTICS_CACHE_TTL_MS) {
      staleKeys.push(key);
    }
  });
  for (const key of staleKeys) cache.delete(key);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Exécute `compute()` une seule fois par clé tant qu'un résultat valide est en
 * cache (TTL) ou qu'une exécution est déjà en vol. Les échecs ne sont pas
 * mis en cache : le prochain appel relance le calcul.
 */
export async function memoAsync<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const now = Date.now();
  sweep(now);

  const existing = cache.get(key) as Entry<T> | undefined;
  if (existing) {
    if (existing.promise) return existing.promise;
    if (existing.resolvedAt !== undefined && now - existing.resolvedAt < ANALYTICS_CACHE_TTL_MS) {
      return existing.value as T;
    }
    cache.delete(key);
  }

  const entry: Entry<T> = {};
  cache.set(key, entry);
  const promise = (async () => {
    try {
      const value = await compute();
      entry.value = value;
      entry.resolvedAt = Date.now();
      return value;
    } finally {
      entry.promise = undefined;
    }
  })();
  entry.promise = promise;
  return promise;
}

/** Vide entièrement la cache (appelé lors d'une réinitialisation des données). */
export function clearAnalyticsCache(): void {
  cache.clear();
}