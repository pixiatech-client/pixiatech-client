'use client';

/**
 * Transitions de navigation directionnelles pour le back-office.
 *
 * Le chemin natif documenté (« transitionTypes » / React ViewTransition) n'est
 * pas disponible dans la version de React installée (pas d'export
 * `addTransitionType`), et Next appelle cet export sans garde. On s'appuie donc
 * sur l'API navigateur `document.startViewTransition`, avec la direction
 * pilotée par une classe sur <html> :
 *   - « forward »  (→ PIXIATECH SITE WEB) : la nouvelle interface arrive de
 *     gauche (gauche → droite).
 *   - « back »     (→ PIXIATECH ADMIN)    : la nouvelle interface arrive de
 *     droite (droite → gauche).
 *
 * La nav est toujours appliquée (même sans support View Transition) : simple
 * dégradation élégante vers push() normal.
 */

export type SlideDirection = 'forward' | 'back';

type StartViewTransition = (callback: () => void | Promise<unknown>) => {
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  ready: Promise<void>;
};

interface DocumentWithVt extends Document {
  startViewTransition?: StartViewTransition;
}

export function slideNavigate(direction: SlideDirection, navigate: () => void | Promise<unknown>): void {
  if (typeof document === 'undefined') {
    void navigate();
    return;
  }

  const doc = document as DocumentWithVt;
  if (typeof doc.startViewTransition !== 'function') {
    void navigate();
    return;
  }

  const root = document.documentElement;
  root.classList.remove('vt-forward', 'vt-back');
  root.classList.add(direction === 'forward' ? 'vt-forward' : 'vt-back');

  try {
    const transition = doc.startViewTransition(async () => {
      await navigate();
    });
    void transition.finished.finally(() => {
      root.classList.remove('vt-forward', 'vt-back');
    });
  } catch {
    root.classList.remove('vt-forward', 'vt-back');
    void navigate();
  }
}