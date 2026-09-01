'use client';

import { signOut, getAuth } from 'firebase/auth';

export type ResetStep = 'caches' | 'storage' | 'session' | 'reload';

export interface ResetOptions {
  /**
   * true = purge radicale manuelle : vide storage local + sessionNav + IndexedDB (Firebase) + signOut.
   * false = mise à jour de version : vide uniquement les caches navigateur et recharge,
   *         on conserve la session et le storage (non destructif).
   */
  radical?: boolean;
  /**
   * Signature (issue du build) vers laquelle on met à jour.
   * Utilisée en mode "mise à jour" pour écrire la nouvelle signature AVANT le reload,
   * afin d'éviter une boucle infinie de "nouvelle version disponible" au rechargement.
   */
  targetSignature?: string;
  /**
   * Route vers laquelle rediriger à la fin d'une purge radicale après déconnexion.
   * Défaut : /admin/login. Ignoré en mode mise à jour.
   */
  redirectTo?: string;
}

/**
 * Purge de l'état local du navigateur uniquement.
 * NE supprime JAMAIS de données métier côté serveur (Firestore / Storage).
 */
export async function resetApplication(
  options: ResetOptions = {},
  onStep?: (step: ResetStep) => void
): Promise<void> {
  const { radical = false, targetSignature } = options;

  onStep?.('caches');
  await wait(150);
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }

  if (radical) {
    onStep?.('storage');
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    await wait(150);

    onStep?.('session');
    // Firebase Auth utilise browserLocalPersistence (IndexedDB) : un simple
    // localStorage.clear() ne suffit pas. On se déconnecte proprement et on
    // nettoie les bases IndexedDB de Firebase.
    try {
      await signOut(getAuth());
    } catch {
      /* ignore */
    }
    try {
      await clearFirebaseIndexedDB();
    } catch {
      /* ignore */
    }
  } else if (targetSignature) {
    // Mise à jour : on enregistre la nouvelle signature pour éviter de
    // re-proposer la mise à jour au rechargement (pas de boucle).
    try {
      localStorage.setItem('app-build-signature', targetSignature);
    } catch {
      /* ignore */
    }
  }

  onStep?.('reload');
  await wait(350);

  if (radical) {
    // Purge radicale : après signOut + nettoyage, on redirige DIRECTEMENT vers la
    // page de connexion. N'utilise surtout pas location.reload() qui resterait sur
    // /admin, laissant la sidebar/le contenu admin visibles après déconnexion.
    const target = options.redirectTo || '/admin/login';
    window.location.href = target;
  } else {
    // Mise à jour : non destructive, on recharge simplement la page avec la
    // nouvelle version (la session et le storage sont conservés).
    window.location.reload();
  }
}

async function clearFirebaseIndexedDB() {
  if (typeof indexedDB === 'undefined') return;
  let databases: IDBDatabaseInfo[] = [];
  try {
    databases = await indexedDB.databases();
  } catch {
    return;
  }
  await Promise.all(
    databases
      .map((d) => d.name)
      .filter((name): name is string => !!name && /firebase/i.test(name))
      .map((name) => new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      }))
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
