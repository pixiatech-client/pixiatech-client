'use client';

import { useSyncExternalStore } from 'react';

/**
 * Petits états d'interface partagés entre la barre de section, les panneaux et
 * les composants publics. Volontairement hors du contexte CMS : il ne s'agit
 * pas de données éditoriales, mais de quel panneau/section/photo est actif.
 */
type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: Listener) => () => void;
}

function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Section actuellement visible à l'écran (suivi du scroll, édition seule). */
export const visibleSectionStore = createStore<string | null>(null);

/** Section dont le panneau de style est ouvert (une seule à la fois). */
export const stylePanelStore = createStore<string | null>(null);

/** Index de la photo active du Hero (partagé barre ↔ section publique). */
export const heroSlideStore = createStore<number>(0);

export function useStoreValue<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
