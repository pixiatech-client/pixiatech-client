'use client';

import { signOut, getAuth } from 'firebase/auth';
import { clearSession } from '@/app/admin/actions';

export type ResetStep = 'caches' | 'storage' | 'session' | 'reload';
export type StepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface StepEvent {
  step: ResetStep;
  status: StepStatus;
  error?: string;
}

export type StepProgressCallback = (event: StepEvent) => void;

export interface ResetOptions {
  /**
   * true = purge radicale manuelle : vide storage local + sessionNav + cookies + IndexedDB (Firebase) + signOut.
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
 * Purge de l'état local du navigateur et des cookies de session uniquement.
 * NE supprime JAMAIS de données métier côté serveur (Firestore / Storage).
 */
export async function resetApplication(
  options: ResetOptions = {},
  onProgress?: StepProgressCallback,
  legacyOnStep?: (step: ResetStep) => void,
  legacyOnStepDone?: (step: ResetStep) => void
): Promise<void> {
  const { radical = false, targetSignature } = options;

  const notify = (step: ResetStep, status: StepStatus, error?: string) => {
    onProgress?.({ step, status, error });
    if (status === 'running') legacyOnStep?.(step);
    if (status === 'completed') legacyOnStepDone?.(step);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Étape : CACHES NAVIGATEUR & SERVICE WORKERS
  // ─────────────────────────────────────────────────────────────
  notify('caches', 'running');
  await wait(100);
  try {
    // 1.1 Cache Storage
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        console.warn('[resetApplication] Avertissement suppression CacheStorage:', e);
      }
    }

    // 1.2 Service Workers (désenregistrement)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      } catch (e) {
        console.warn('[resetApplication] Avertissement désenregistrement ServiceWorker:', e);
      }
    }

    notify('caches', 'completed');
  } catch (err: unknown) {
    console.warn('[resetApplication] Erreur non bloquante sur caches:', err);
    notify('caches', 'completed');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Étape : STOCKAGE LOCAL (LocalStorage, SessionStorage, Cookies JS)
  // ─────────────────────────────────────────────────────────────
  if (radical) {
    notify('storage', 'running');
    await wait(100);
    try {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('[resetApplication] Avertissement localStorage.clear:', e);
      }

      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('[resetApplication] Avertissement sessionStorage.clear:', e);
      }

      // Nettoyage des cookies accessibles en JavaScript
      try {
        if (typeof document !== 'undefined' && document.cookie) {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.slice(0, eqPos).trim() : cookie.trim();
            if (name) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            }
          }
        }
      } catch (e) {
        console.warn('[resetApplication] Avertissement purge document.cookie:', e);
      }

      notify('storage', 'completed');
    } catch (err: unknown) {
      console.warn('[resetApplication] Erreur storage:', err);
      notify('storage', 'completed');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Étape : SESSION NAVIGATEUR & FIREBASE AUTH (IndexedDB)
    // ─────────────────────────────────────────────────────────────
    notify('session', 'running');
    await wait(100);
    try {
      // 3.1 Suppression serveur des cookies HTTP-Only (session, sessionToken, client_session)
      try {
        await clearSession();
      } catch (e) {
        console.warn('[resetApplication] clearSession server action fallback:', e);
      }

      try {
        await fetch('/api/auth/clear-session', { method: 'POST', cache: 'no-store' });
      } catch (e) {
        console.warn('[resetApplication] endpoint /api/auth/clear-session fallback:', e);
      }

      // 3.2 Déconnexion propre de Firebase Auth (vide automatiquement les identifiants locaux d'IndexedDB)
      try {
        const auth = getAuth();
        await signOut(auth);
      } catch (e) {
        console.warn('[resetApplication] Avertissement signOut Firebase:', e);
      }

      notify('session', 'completed');
    } catch (err: unknown) {
      console.warn('[resetApplication] Erreur session:', err);
      notify('session', 'completed');
    }
  } else if (targetSignature) {
    // Mode mise à jour : on enregistre la nouvelle signature pour éviter de
    // re-proposer la mise à jour au rechargement (pas de boucle infinie).
    try {
      localStorage.setItem('app-build-signature', targetSignature);
    } catch (e) {
      console.warn('[resetApplication] Impossible d’écrire targetSignature:', e);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Étape : REDIRECTION OU RECHARGEMENT
  // ─────────────────────────────────────────────────────────────
  notify('reload', 'running');
  await wait(200);
  notify('reload', 'completed');

  if (radical) {
    // Purge radicale : redirection DIRECTE vers /admin/login sans coquille admin
    const target = options.redirectTo || '/admin/login';
    window.location.replace(target);
  } else {
    // Mise à jour : rechargement propre
    window.location.reload();
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
