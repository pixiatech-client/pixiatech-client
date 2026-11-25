'use client';

import { isBootstrapPayloadValid } from '@/components/pixia-assistant/core/bootstrap-validation';
import type { BootstrapPayload } from '@/components/pixia-assistant/core/types';

/**
 * Bascule contrôlée entre l'ancien Assistant Bot Pixia et le nouveau module.
 *
 * L'ancien assistant reste le comportement par défaut. Le nouveau module ne
 * peut être rendu que si une source de bootstrap RÉELLE est enregistrée et si
 * le drapeau est explicitement activé après validation. Aucune donnée de
 * démonstration ne peut passer ce filtre.
 */
export const NEW_PIXIA_ASSISTANT_ENABLED = false;

export type PixiaBootstrapLoader = () => Promise<BootstrapPayload | null>;

let bootstrapLoader: PixiaBootstrapLoader | null = null;

/**
 * Branche la source de bootstrap réelle (services PixiaTech) sur la bascule.
 * Sans loader enregistré, le nouveau module reste indisponible même si le
 * drapeau est activé plus tard.
 */
export function registerPixiaBootstrapLoader(loader: PixiaBootstrapLoader | null): void {
  bootstrapLoader = loader;
}

export function isNewPixiaAssistantAvailable(): boolean {
  return NEW_PIXIA_ASSISTANT_ENABLED && bootstrapLoader !== null;
}

/**
 * Retourne un bootstrap utilisable ou `null`. Toute erreur, absence de source
 * ou mode démonstration fait revenir l'ancien assistant.
 */
export async function resolvePixiaBootstrap(): Promise<BootstrapPayload | null> {
  if (!NEW_PIXIA_ASSISTANT_ENABLED || !bootstrapLoader) return null;

  try {
    const bootstrap = await bootstrapLoader();
    if (!bootstrap || bootstrap.demoMode || !isBootstrapPayloadValid(bootstrap)) {
      return null;
    }
    return bootstrap;
  } catch {
    return null;
  }
}
