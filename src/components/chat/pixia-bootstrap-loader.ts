'use client';

import { getPixiaAssistantBootstrap } from '@/app/actions/pixia-assistant-actions';
import { isBootstrapPayloadValid } from '@/components/pixia-assistant/core/bootstrap-validation';
import type { BootstrapPayload } from '@/components/pixia-assistant/core/types';

/**
 * Unique source de bootstrap de l'Assistant Bot Pixia.
 *
 * La Server Action ne prend aucun argument et résout le client depuis
 * `client_session`. Toute erreur, absence de service ou payload invalide
 * retourne `null` : aucun assistant de repli, aucune donnée de démonstration.
 */
export async function loadPixiaBootstrap(): Promise<BootstrapPayload | null> {
  try {
    const result = await getPixiaAssistantBootstrap();
    if (!result.ok) return null;
    if (!isBootstrapPayloadValid(result.bootstrap)) return null;
    return result.bootstrap;
  } catch {
    return null;
  }
}
