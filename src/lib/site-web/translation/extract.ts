import type { CmsPageData } from '../cms-types';
import type { TranslatableField } from './types';

/**
 * Extraction des champs textuels traduisibles d'une page CMS.
 *
 * ── Pourquoi une liste BLANCHE ────────────────────────────────────────────
 * L'extraction precedente (`autoTranslateSection`, cms-context.tsx) filtrait
 * avec une liste NOIRE : elle ignorait uneliste de cles connues, laissait
 * passer tout le reste. Des chemins d'images et des couleurs hexadecimales
 * se sont donc retrouve stockes comme du texte traduisible — voir
 * `scripts/clean-i18n-entries.mjs` qui les a purges de la base.
 *
 * Ici l'inverse : une cle n'est traduite que si elle correspond POSITIVEMENT a
 * un motif editorial. Toute cle inconnue est ignoree. Une page CMS contient
 * des champs libres, donc aucun inventaire statique n'est possible : le motif
 * est donc semantique (`/…Title$/`, `/^text_/`) plutot qu'une liste de noms.
 *
 * ── Perimetre : champs PLATS uniquement ───────────────────────────────────
 * Les champs de niveau 1 sont deja resolus par `getCmsText(section, key, lang)`,
 * que les sections appellent : une traduction ecrite ici s'affiche sans
 * modifier un seul renderer.
 *
 * Les champs imbriques (`items[2].desc`, `stats[].label`,
 * `_elements[].text`) sont lus DIRECTEMENT par les composants, sans passer par
 * `getCmsText`. Les traduire exigerait un resolveur cote lecture ; ecrire ces
 * traductions sans lui produirait de l'Anglais stocke et jamais affiche, ce qui
 * est plus trompeur que de ne pas traduire. Ils sont donc explicitement hors
 * perimetre — voir `useCmsElementStyles.ts:121` et les sites de lecture
 * `useCms().pages[…].sections` pour la pose du resolveur (etape 2).
 */

/**
 * Motifs de cles editoriales. Une cle doit correspondre a l'un d'eux pour etre
 * traduite. Volontairement stricts : mieux vaut laisser un titre non traduit
 * que traduire un identifiant.
 */
const TEXTUAL_KEY_PATTERNS: RegExp[] = [
  /** Cles generees par l'editeur en place pour un texte sans cle declaree. */
  /^text_/u,
  /** Noms editorialement explicites. */
  /^(title|subtitle|description|body|eyebrow|tagline|badge|headline|kicker|intro|label|caption|alt|altText|question|answer|quote|cta|ctaText|primaryCta|secondaryCta)$/iu,
  /** Suffixes editoriaux, qui couvrent les variantes indexees (`stat1Label`). */
  /(title|subtitle|description|desc|eyebrow|tagline|badge|headline|label|caption|alt|question|answer|quote|text|cta|buttonText|subtext|reassurance)$/iu,
];

/**
 * Filet de securite sur la VALEUR. Un champ deja retenu par la liste blanche
 * peut ne pas contenir de texte : c'est le cas pour un champ dont le nom est
 * editorial mais dont le contenu est technique.
 */
const NON_TEXTUAL_VALUE_PATTERNS: RegExp[] = [
  /^#[0-9a-f]{3,8}$/iu,
  /^(rgb|rgba|hsl|hsla)\(/iu,
  /^\/?[\w./-]*\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|mov|pdf|webp)$/iu,
  /^\d+(\.\d+)?(px|rem|em|%|vh|vw|deg|ms|s)$/iu,
  /^(auto|none|flex|grid|block|inline|center|left|right|cover|contain)$/iu,
];

export function isTextualKey(key: string): boolean {
  return TEXTUAL_KEY_PATTERNS.some((re) => re.test(key));
}

export function isNonTextualValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return NON_TEXTUAL_VALUE_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Un texte FR eligible : non vide, et suffisamment long pour valoir une
 * traduction. En dessous de 2 caracteres, traduire n'a aucun sens et le cout
 * d'appel au modele n'est pas justifie.
 */
function isTranslatableSource(value: string): boolean {
  return value.trim().length >= 2 && !isNonTextualValue(value);
}

/**
 * Extrait les champs traduisibles d'une page.
 *
 * L'ordre de parcours est deterministe (ordre d'insertion des cles), donc
 * l'extraction d'une meme page produit toujours les memes identifiants — exigence
 * pour que la validation puisse comparer entree et sortie.
 */
export function extractTranslatableFields(page: CmsPageData | null | undefined): TranslatableField[] {
  if (!page?.sections || typeof page.sections !== 'object') return [];

  const fields: TranslatableField[] = [];

  for (const sectionKey of Object.keys(page.sections)) {
    const section = page.sections[sectionKey];
    if (!section || typeof section !== 'object') continue;

    for (const key of Object.keys(section)) {
      // `_i18n`, `_elements` et toute metadonnee interne : jamais traduisibles.
      if (key.startsWith('_')) continue;

      const value = (section as Record<string, unknown>)[key];
      if (typeof value !== 'string') continue;

      if (!isTextualKey(key)) continue;
      if (!isTranslatableSource(value)) continue;

      fields.push({
        id: `${sectionKey}.${key}`,
        sectionKey,
        path: key,
        source: value,
      });
    }
  }

  return fields;
}

/** Champs dont la source FR a change depuis une empreinte donnee. */
export function filterChangedFields(
  fields: TranslatableField[],
  unchangedIds: ReadonlySet<string>
): TranslatableField[] {
  return fields.filter((f) => !unchangedIds.has(f.id));
}
