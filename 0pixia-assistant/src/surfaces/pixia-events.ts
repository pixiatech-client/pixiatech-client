declare global {
  interface Window {
    __pixiaChatOpenPending?: boolean;
    __pixiaMascotTakeover?: boolean;
  }
}

export const PIXIA_EVENTS = {
  OPEN_CHATBOT: 'pixia:open-chatbot',
  CHAT_STATE: 'pixia:chat-state',
  MASCOT_TAKEOVER: 'pixia:mascot-takeover',
  MASCOT_RELEASE: 'pixia:mascot-release',
} as const;

export function emitOpenChatbot(): void {
  window.__pixiaChatOpenPending = true;
  window.dispatchEvent(new CustomEvent(PIXIA_EVENTS.OPEN_CHATBOT));
}

export function emitChatState(open: boolean): void {
  if (open) {
    window.__pixiaChatOpenPending = false;
  }
  window.dispatchEvent(new CustomEvent(PIXIA_EVENTS.CHAT_STATE, { detail: { open } }));
}

export function emitMascotTakeover(): void {
  window.__pixiaMascotTakeover = true;
  window.dispatchEvent(new CustomEvent(PIXIA_EVENTS.MASCOT_TAKEOVER));
}

export function emitMascotRelease(): void {
  window.__pixiaMascotTakeover = false;
  window.dispatchEvent(new CustomEvent(PIXIA_EVENTS.MASCOT_RELEASE));
}

export function notifyIframeParentClose(): void {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'close-chatbot' }, '*');
  }
}

export const EXCLUDED_FLOATING_ROUTES = [
  '/boutique/paiement',
  '/boutique/commande',
  '/admin',
  '/embed',
  '/chat-widget',
  '/mon-compte',
];

export function shouldRenderFloatingChat(pathname: string, isWizardBotEnabled: boolean): boolean {
  if (!isWizardBotEnabled) return false;
  return !EXCLUDED_FLOATING_ROUTES.some((prefix) => pathname.startsWith(prefix));
}
