/**
 * Résolution contextuelle de la destination du bouton « Accéder au site ».
 *
 * PixiaTech fait tourner deux univers distincts sur deux hôtes (voir
 * `src/middleware.ts`) :
 *
 *   - l'APPLICATION  (app.pixiatech.com) : `/` sert le configurateur
 *     (`src/app/[[...step]]/page.tsx` → `QuoteBuilder`), et `/admin`,
 *     `/mon-compte`, `/boutique`, `/quote` en dépendent.
 *   - le SITE WEB PUBLIC (pixiatech.com) : toute route est réécrite en interne
 *     vers `/web/...`, servie par `src/app/web/`.
 *
 * Le même chemin ne signifie donc PAS la même chose selon l'hôte : `/web`
 * ouvert depuis l'admin affiche le site public sur le domaine de
 * l'application (mauvais contexte), alors que `/` y affiche l'application.
 *
 * D'où une seule source de vérité pour la destination, dépendante du
 * contexte appelant, au lieu d'un `/web` codé en dur aux deux endroits.
 */
export type SiteAccessContext = 'admin' | 'web';

/**
 * Chemin du « site » correspondant au contexte appelant.
 *
 * - `admin` : l'application PixiaTech (configurateur), pas le site vitrine.
 * - `web`   : le site Web public, à son adresse canonique
 *             `https://pixiatech.com/`. L'ancienne route interne `/web`
 *             affichait le site sur le domaine de l'application (mauvais
 *             contexte) : le contexte « web » doit donc pointer vers l'hôte
 *             public, pas vers une route de l'application.
 */
export function getSiteAccessPath(context: SiteAccessContext): string {
  return context === 'admin' ? '/' : 'https://pixiatech.com/';
}

/** Ouvre le site du contexte dans un nouvel onglet, de façon sûre. */
export function openSiteAccess(context: SiteAccessContext): void {
  if (typeof window === 'undefined') return;
  window.open(getSiteAccessPath(context), '_blank', 'noopener,noreferrer');
}
