/**
 * Doublure d'essai de `@/lib/firebase-admin`.
 *
 * Le module réel ne se charge pas sous le runner de test : il importe `App`
 * comme une valeur alors que c'est un type, et le retirer à la main revient à
 * modifier du code applicatif pour les besoins d'un test. Cette doublure
 * évite ce détour : elle expose la même forme (`adminDb.collection().doc()`)
 * sur une base en mémoire, ce qui permet d'appeler POUR DE VRAI
 * `deleteProduct` et de vérifier ce qu'il reste du document ensuite.
 *
 * Usage unique : `scripts/test-system-template-lock.ts`. Rien en production ne
 * l'importe.
 */

type Row = Record<string, unknown>;

const store = new Map<string, Map<string, Row>>();

/** Réinitialise la base en mémoire. */
export function __reset(entries: Record<string, Record<string, Row>>): void {
  store.clear();
  for (const [collection, docs] of Object.entries(entries)) {
    store.set(collection, new Map(Object.entries(docs)));
  }
}

/** Le document existe-t-il encore ? */
export function __exists(collection: string, docId: string): boolean {
  return store.get(collection)?.has(docId) ?? false;
}

/** Liste des identifiants présents, pour constater ce qui a survécu. */
export function __ids(collection: string): string[] {
  return [...(store.get(collection)?.keys() ?? [])];
}

export function getFirebaseAdmin() {
  return {
    adminDb: {
      collection(name: string) {
        return {
          doc(docId: string) {
            return {
              async get() {
                const row = store.get(name)?.get(docId);
                return { exists: row !== undefined, data: () => row };
              },
              async set(payload: Row) {
                if (!store.has(name)) store.set(name, new Map());
                store.get(name)!.set(docId, payload);
              },
              async delete() {
                store.get(name)?.delete(docId);
              },
            };
          },
        };
      },
    },
  };
}
