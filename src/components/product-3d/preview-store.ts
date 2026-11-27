'use client';

import { useSyncExternalStore } from 'react';

import { getProduct3DDefinition, type Product3DModelId } from './catalog';

/**
 * Sélection TEMPORAIRE du modèle dans l'éditeur visuel.
 *
 * Cette valeur ne part jamais sur le réseau : elle pilote uniquement le rendu
 * de la section pendant que l'administrateur compare les cinq modules. La
 * sauvegarde réelle se fait dans le document produit via `product3DModelPatch`.
 */
const previewBySlug = new Map<string, string>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setProduct3DPreviewModelId(slug: string, modelId: string | null) {
  if (!slug) return;
  if (modelId) previewBySlug.set(slug, modelId);
  else previewBySlug.delete(slug);
  emit();
}

export function clearProduct3DPreviewModelId(slug: string | null | undefined) {
  if (slug) setProduct3DPreviewModelId(slug, null);
}

export function getProduct3DPreviewModelId(slug: string | null | undefined): string | null {
  return slug ? previewBySlug.get(slug) ?? null : null;
}

/** Prévisualisation temporaire brute (utile pour savoir s'il reste à sauver). */
export function useRawProduct3DPreviewModelId(
  slug: string | null | undefined
): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getProduct3DPreviewModelId(slug),
    () => null
  );
}

/**
 * Modèle réellement affiché : prévisualisation temporaire si elle existe,
 * sinon le modèle enregistré sur le produit.
 */
export function useProduct3DPreviewModelId(
  slug: string | null | undefined,
  savedModelId: string | null | undefined
): Product3DModelId {
  const preview = useRawProduct3DPreviewModelId(slug);
  return getProduct3DDefinition(preview ?? savedModelId).id;
}
