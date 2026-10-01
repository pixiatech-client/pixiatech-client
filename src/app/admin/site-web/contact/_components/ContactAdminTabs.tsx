/**
 * Langage visuel partagé par les trois onglets Contact.
 *
 * Ces classes sont copiées à l'identique du module Produits
 * (`src/app/admin/site-web/produits/_components/SiteWebProduitsModule.tsx`) :
 * bandeau sombre, cartes blanches, champs `rounded-xl`, boutons `active:scale-95`.
 * Les extraire ici évite de dupliquer les chaînes dans chaque onglet tout en
 * gardant une source unique alignée sur Produits.
 */

/** Bandeau titre : reproduit `BACKOFFICE_HEADER` du module Produits. */
export const BACKOFFICE_HEADER =
  'flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl';

/** Carte / panneau blanc utilisé pour chaque bloc de formulaire. */
export const CARD =
  'bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-sm';

/** Tuile d'icône du bandeau (12x12, fond #141B1E). */
export const HEADER_ICON_TILE =
  'w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0';

/** Badge « BACKOFFICE » vert vif. */
export const BACKOFFICE_BADGE =
  'text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]';

/** Bouton secondaire (« Actualiser »). */
export const BTN_SECONDARY =
  'flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

/** Bouton tertiaire / fantôme (secondaire hors bandeau). */
export const BTN_GHOST =
  'flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

/** Bouton primaire vert (action d'enregistrement). */
export const BTN_PRIMARY =
  'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed';

/** Bouton danger (suppression). */
export const BTN_DANGER =
  'flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

/** Libellé de champ : même hierarchie que les blocs de formulaire Produits. */
export const FIELD_LABEL =
  'block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400';

/** Champ texte / email / nombre. */
export const FIELD_INPUT =
  'w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 transition-colors';

/** Champ multi-lignes. */
export const FIELD_TEXTAREA = `${FIELD_INPUT} min-h-[120px] leading-relaxed resize-y`;

/** Grille de la barre d'onglet + filtres. */
export const TOOLBAR_ROW =
  'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm';

/** Bandeau d'erreur. */
export const ERROR_BANNER =
  'flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold';

/** Pastille d'état dans un onglet. */
export function tabPillClass(active: boolean, tone: 'neutral' | 'amber' | 'emerald' | 'sky' = 'neutral') {
  const activeTone =
    tone === 'amber'
      ? 'bg-amber-600 text-white shadow-sm'
      : tone === 'emerald'
        ? 'bg-emerald-600 text-white shadow-sm'
        : tone === 'sky'
          ? 'bg-sky-600 text-white shadow-sm'
          : 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-sm';
  const idleTone =
    tone === 'amber'
      ? 'text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10'
      : tone === 'emerald'
        ? 'text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10'
        : tone === 'sky'
          ? 'text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-500/10'
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5';
  return `px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${active ? activeTone : idleTone}`;
}