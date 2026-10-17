/**
 * Coordination événementielle entre l'animation globale de Pixia
 * (`components/pixia/PixiaGlobalAnimation`) et le chatbot flottant existant
 * (`components/chat/FloatingChatButton`).
 *
 * Objectifs :
 *   - un seul chatbot : l'animation réutilise `WizardBotFlow` via le bouton
 *     flottant, elle n'instancie aucune conversation parallèle ;
 *   - une seule mascotte visible à la fois : quand l'animation prend le relais
 *     (« takeover »), le robot flottant historique se masque ;
 *   - les drapeaux posés sur `window` couvrent le cas où un composant monte
 *     APRÈS que l'autre a émis son événement (les données du chatbot sont
 *     chargées en asynchrone). Les événements restent le canal « live », les
 *     drapeaux le référentiel du dernier état connu.
 *
 * Tout est client-side : ces helpers ne doivent être appelés que depuis des
 * effets React (jamais pendant le rendu, jamais au SSR).
 */

export const PIXIA_OPEN_CHATBOT_EVENT = 'pixia:open-chatbot';
export const PIXIA_CHAT_STATE_EVENT = 'pixia:chat-state';
export const PIXIA_MASCOT_TAKEOVER_EVENT = 'pixia:mascot-takeover';
export const PIXIA_MASCOT_RELEASE_EVENT = 'pixia:mascot-release';

type PixiaWindow = Window & {
  /** Un clic sur la mascotte a demandé l'ouverture avant que le chatbot soit monté. */
  __pixiaChatOpenPending?: boolean;
  /** L'animation globale contrôle la mascotte : le bouton flottant se retire. */
  __pixiaMascotTakeover?: boolean;
};

function pixiaWindow(): PixiaWindow {
  return window as PixiaWindow;
}

/**
 * Demande l'ouverture du chatbot existant (WizardBotFlow).
 * Idempotent : l'état ouvert est porté par `FloatingChatButton`.
 */
export function openPixiaChatbot(): void {
  if (typeof window === 'undefined') return;
  pixiaWindow().__pixiaChatOpenPending = true;
  window.dispatchEvent(new CustomEvent(PIXIA_OPEN_CHATBOT_EVENT));
}

/** Consomme la demande d'ouverture en attente (utilisé au montage du chatbot). */
export function consumePendingChatOpen(): boolean {
  if (typeof window === 'undefined') return false;
  const w = pixiaWindow();
  if (w.__pixiaChatOpenPending) {
    w.__pixiaChatOpenPending = false;
    return true;
  }
  return false;
}

/** Publie l'état ouvert/fermé du chatbot (lu par l'animation pour se retirer). */
export function notifyChatState(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PIXIA_CHAT_STATE_EVENT, { detail: { open } }));
}

/** Active/désactive le relais de mascotte de l'animation globale. */
export function setMascotTakeover(active: boolean): void {
  if (typeof window === 'undefined') return;
  pixiaWindow().__pixiaMascotTakeover = active;
  window.dispatchEvent(
    new CustomEvent(active ? PIXIA_MASCOT_TAKEOVER_EVENT : PIXIA_MASCOT_RELEASE_EVENT)
  );
}

/** Dernier état de relais connu (lu au montage du bouton flottant). */
export function isMascotTakeover(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(pixiaWindow().__pixiaMascotTakeover);
}
