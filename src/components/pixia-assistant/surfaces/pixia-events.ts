'use client';

import {
  PIXIA_CHAT_STATE_EVENT,
  PIXIA_MASCOT_RELEASE_EVENT,
  PIXIA_MASCOT_TAKEOVER_EVENT,
  PIXIA_OPEN_CHATBOT_EVENT,
  notifyChatState,
  openPixiaChatbot,
  setMascotTakeover,
} from '@/lib/pixia-global';

export const PIXIA_EVENTS = {
  OPEN_CHATBOT: PIXIA_OPEN_CHATBOT_EVENT,
  CHAT_STATE: PIXIA_CHAT_STATE_EVENT,
  MASCOT_TAKEOVER: PIXIA_MASCOT_TAKEOVER_EVENT,
  MASCOT_RELEASE: PIXIA_MASCOT_RELEASE_EVENT,
} as const;

export function emitOpenChatbot(): void {
  openPixiaChatbot();
}

export function emitChatState(open: boolean): void {
  notifyChatState(open);
}

export function emitMascotTakeover(): void {
  setMascotTakeover(true);
}

export function emitMascotRelease(): void {
  setMascotTakeover(false);
}

export const EXCLUDED_FLOATING_ROUTES = [
  '/boutique/paiement',
  '/boutique/commande',
  '/admin',
  '/mon-compte',
];

export function shouldRenderFloatingChat(pathname: string, isWizardBotEnabled: boolean): boolean {
  if (!isWizardBotEnabled) return false;
  return !EXCLUDED_FLOATING_ROUTES.some((prefix) => pathname.startsWith(prefix));
}
