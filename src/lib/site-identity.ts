/**
 * Identité par défaut du site marketing (`/web`).
 *
 * SOURCE UNIQUE des métadonnées historiques de la page d'accueil. Ces valeurs
 * servent de repli quand aucun titre/description SEO n'a encore été enregistré
 * (`settings/main` : `seoTitle` / `seoDescription`, bilingue FR/EN).
 *
 * Elles sont consommées par :
 *  - `src/app/web/layout.tsx` (métadonnées réellement servies) ;
 *  - l'admin « Paramètres généraux » (`/admin/site-web/parametres`), qui les
 *    pré-remplit pour que l'administrateur puisse éditer directement le texte
 *    actuellement affiché, sans avoir à le retaper.
 *
 * Aucune duplication de chaîne ailleurs : modifier ici suffit.
 */
export const DEFAULT_SITE_TITLE = 'PixiaTech PXT Fine - Indoor LED Display';

export const DEFAULT_SITE_DESCRIPTION =
  'Official product template for PixiaTech PXT Fine indoor LED display, featuring animated LED canvas, ColdLED technology, interactive architectural specs, and 3D cabinet visualization.';

/** Description Open Graph de repli (plus courte, sans la liste de technologies). */
export const DEFAULT_SITE_OG_DESCRIPTION =
  'Official product template for PixiaTech PXT Fine indoor LED display.';
