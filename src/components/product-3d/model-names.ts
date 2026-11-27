'use client';

import { useSyncExternalStore } from 'react';
import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';

import { firestore } from '@/firebase/config';
import {
  getProduct3DDefinition,
  isProduct3DModelId,
  type Product3DModelId,
} from './catalog';
import {
  PRODUCT_3D_NAMES_SETTING_ID,
  normalizeProduct3DModelNames,
  type EditableProduct3DModelNames,
  type Product3DModelNames,
} from './model-names-shared';

export {
  PRODUCT_3D_NAMES_SETTING_ID,
  type EditableProduct3DModelNames,
  type Product3DModelNames,
} from './model-names-shared';

/**
 * Noms commerciaux globaux des cinq modules. Les identifiants techniques ne
 * changent jamais : seul ce document Firestore est éditable.
 */
const STORAGE_KEY = 'pixiatech_product_3d_model_names_v1';
const EMPTY_NAMES: Product3DModelNames = Object.freeze({});

let names: Product3DModelNames = EMPTY_NAMES;
const listeners = new Set<() => void>();
let firestoreUnsubscribe: Unsubscribe | null = null;

function readLocal(): EditableProduct3DModelNames {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProduct3DModelNames(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function writeLocal(next: Product3DModelNames) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Cache best-effort seulement : Firestore reste la source de vérité.
  }
}

function commit(next: EditableProduct3DModelNames) {
  names = Object.freeze({ ...next });
  writeLocal(names);
  listeners.forEach((listener) => listener());
}

function startFirestoreSubscription() {
  if (firestoreUnsubscribe) return;
  firestoreUnsubscribe = onSnapshot(
    doc(firestore, 'settings', PRODUCT_3D_NAMES_SETTING_ID),
    (snapshot) => {
      const stored = snapshot.data();
      commit(normalizeProduct3DModelNames(stored?.names));
    },
    (error) => {
      // L'UI reste utilisable avec le cache local ; la prochaine connexion
      // rétablira la synchronisation.
      console.warn('[Product3DNames] Lecture Firestore impossible :', error);
    }
  );
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  startFirestoreSubscription();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Product3DModelNames {
  return names;
}

function getServerSnapshot(): Product3DModelNames {
  return EMPTY_NAMES;
}

export function useProduct3DModelNames(): Product3DModelNames {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function defaultProduct3DModelName(modelId: string): string {
  const definition = getProduct3DDefinition(modelId);
  return `Modèle ${definition.number}`;
}

/** Nom affiché dans toutes les interfaces, avec repli sur « Modèle N ». */
export function product3DModelDisplayName(
  modelId: string,
  customNames?: Product3DModelNames | null
): string {
  if (!isProduct3DModelId(modelId)) return defaultProduct3DModelName(modelId);
  const custom = customNames?.[modelId] ?? names[modelId];
  return custom?.trim() || defaultProduct3DModelName(modelId);
}

/**
 * Repli serveur : le CMS public n'a pas toujours de session Firebase côté
 * navigateur, alors que les rules Firestore exigent `isAdmin()` pour écrire
 * dans `settings`. L'endpoint applique `requireAdmin` côté serveur.
 */
async function writeNamesViaApi(
  modelId: Product3DModelId,
  name: string | null
): Promise<void> {
  const response = await fetch('/api/site-web/product-3d-model-names', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId, name }),
  });
  const data = (await response.json().catch(() => null)) as
    | { success?: boolean; message?: string }
    | null;
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Enregistrement des noms impossible.');
  }
}

/** Écrit un nom global (ou `null` pour restaurer le nom par défaut). */
export async function setProduct3DModelName(
  modelId: Product3DModelId,
  name: string | null
): Promise<void> {
  if (!isProduct3DModelId(modelId)) return;
  const previous: EditableProduct3DModelNames = { ...names };
  const next: EditableProduct3DModelNames = { ...previous };
  const clean = name?.trim().slice(0, 80) ?? '';
  if (clean) next[modelId] = clean;
  else delete next[modelId];

  commit(next);
  try {
    try {
      await setDoc(
        doc(firestore, 'settings', PRODUCT_3D_NAMES_SETTING_ID),
        { names: next, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch {
      // Écriture client refusée (session Firebase absente) : on tente la même
      // écriture via l'API admin, sans toucher aux identifiants techniques.
      await writeNamesViaApi(modelId, clean || null);
    }
  } catch (error) {
    commit(previous);
    throw error;
  }
}

export async function resetProduct3DModelName(modelId: Product3DModelId): Promise<void> {
  await setProduct3DModelName(modelId, null);
}

/** Initialise le cache local avant le premier rendu côté client. */
export function hydrateProduct3DModelNames() {
  if (typeof window === 'undefined' || listeners.size > 0) return;
  commit(readLocal());
}
