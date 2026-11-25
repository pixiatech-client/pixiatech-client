import type { BootstrapPayload, ClientProfile } from '../../components/pixia-assistant/core/types';

/**
 * Résultat public d'une tentative de construction du bootstrap.
 * Les détails d'erreur reste côté serveur : le client ne reçoit qu'un motif
 * générique, sufficient pour conserver l'ancien assistant.
 */
export type PixiaBootstrapResult =
  | { ok: true; bootstrap: BootstrapPayload }
  | { ok: false; reason: 'service_unavailable' | 'invalid_bootstrap' };

/** Snapshot de session dérivé uniquement du cookie signé `client_session`. */
export interface PixiaAssistantSessionSnapshot {
  loggedIn: boolean;
  customerId: string | null;
  email: string;
  profile: ClientProfile | null;
}

/** Entrées brutes des services officiels, avant conversion sans invention. */
export interface PixiaBootstrapSourceData {
  settings: unknown;
  wizardSettings: unknown;
  deliverySettings: unknown;
  laborSettings: unknown;
  products: unknown[];
  locations: unknown;
  blockedPeriods: unknown[];
  pdfSettings: unknown;
}

export interface PixiaBootstrapBuildInput {
  session: PixiaAssistantSessionSnapshot;
  data: PixiaBootstrapSourceData;
}
