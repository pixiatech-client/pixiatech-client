'use client';

/**
 * Assistant Bot Pixia — assistant unique intégré à l'application Next.js.
 * Le bootstrap est alimenté par les services PixiaTech réels via Server Action ;
 * aucun mode démonstration ni assistant de repli n'est admis.
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
