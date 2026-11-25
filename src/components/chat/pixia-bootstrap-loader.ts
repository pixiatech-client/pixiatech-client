'use client';

import { getPixiaAssistantBootstrap } from '@/app/actions/pixia-assistant-actions';
import { isBootstrapPayloadValid } from '@/components/pixia-assistant/core/bootstrap-validation';
import { registerPixiaBootstrapLoader } from './pixia-assistant-switch';

/**
 * Branche la source réelle sur la bascule contrôlée.
 *
 * L'enregistrement se fait à l'import du module, donc avant le premier rendu
 * des deux surfaces qui utilisent `resolvePixiaBootstrap()`. Le drapeau
 * `NEW_PIXIA_ASSISTANT_ENABLED` reste à `false` : ce branchement ne rend pas
 * le nouveau widget visible pour les visiteurs.
 */
async function loadRealPixiaBootstrap() {
  const result = await getPixiaAssistantBootstrap();
  if (!result.ok) return null;
  if (!isBootstrapPayloadValid(result.bootstrap)) return null;
  return result.bootstrap;
}

registerPixiaBootstrapLoader(loadRealPixiaBootstrap);

export {};
