'use client';

/**
 * Assistant Bot Pixia — Nouveau socle visuel et moteur conversationnel.
 * Phase 1 : socle UI/FSM intégré et compatible Next.js / React 19 / Tailwind v3.
 * Les connecteurs métier (Firestore, session client, pricing-engine, devis/PDF)
 * seront branchés en Phase 2 & 3.
 */

export { PixiaChatWorkspace } from './features/pixia-bot/PixiaChatWorkspace';
export { usePixiaEngine } from './features/pixia-bot/usePixiaEngine';
export { PixiaFloatingMascot } from './features/pixia-bot/components/PixiaFloatingMascot';
export {
  PixiaDynamicIslandExpanded,
  PixiaDynamicIslandPill,
} from './features/pixia-bot/components/PixiaDynamicIsland';
export { PixiaOrb } from './features/pixia-bot/components/PixiaOrb';
export { FloatingChatWidget } from './surfaces/FloatingChatWidget';
export * from './surfaces/pixia-events';
export * from './core/types';
