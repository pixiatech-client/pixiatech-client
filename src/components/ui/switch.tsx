'use client';

/**
 * Point d'entrée unique des interrupteurs de l'application.
 * Tous les `<Switch>` existants héritent désormais du Goo Switch partagé
 * (couleur `--ui-accent`, sons ON/OFF, accessible clavier et reduced-motion).
 */
export { GooSwitch as Switch, default } from './goo-switch';
export type { GooSwitchProps as SwitchProps } from './goo-switch';
