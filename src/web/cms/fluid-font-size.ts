/**
 * Taille de police fluide pour les tailles saisies dans l'éditeur CMS.
 *
 * ── Principe (source unique, aucun second éditeur) ─────────────────────────
 * La valeur réellement enregistrée reste le px choisi par le client :
 *  - `sections[key]._elements[el].fontSize` (barre contextuelle) ;
 *  - `sections[key].titleFontSize` (panneau de section).
 * Ces px sont la RÉFÉRENCE DESKTOP : ils ne sont jamais réécrits.
 *
 * À l'affichage, chaque px est multiplié par la variable CSS globale
 * `--cms-text-scale` (voir `cms-text-scale.css`) : 1 sur grand écran, réduite
 * par media query sur mobile. Le rendu s'adapte donc automatiquement à chaque
 * écran pendant que la donnée du client reste intacte.
 *
 * Une valeur déjà fluide (`clamp()`, `em`, `rem`, `%`, `calc()`) est laissée
 * telle quelle : la transformation est idempotente.
 */

const PX_PATTERN = /^(\d+(?:\.\d+)?)px$/;

/** Convertit `"48px"` → `"calc(48px * var(--cms-text-scale, 1))"` ; sinon inchangé. */
export function fluidFontSize(value: string): string {
  const v = value.trim();
  const m = PX_PATTERN.exec(v);
  return m ? `calc(${m[1]}px * var(--cms-text-scale, 1))` : v;
}

/** Variante pour une valeur numérique (ex. `titleFontSize`). */
export function fluidFontSizePx(px: number): string {
  return `calc(${px}px * var(--cms-text-scale, 1))`;
}
