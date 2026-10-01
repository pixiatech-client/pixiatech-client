// ============================================================================
// Affichage public d'un produit — règles d'affichage, PAS de données.
//
// Règle unique et non négociable : la page publique n'affiche que ce qui est
// réellement présent dans le document du produit. Aucun texte de repli issu
// d'un autre produit, aucune valeur inventée, aucun rendu partiel qui laisserait
// croire à une caractéristique inexistante. Ce module ne fait QUE décider de
// l'affichage (visible / masqué) et formater des valeurs déjà présentes.
//
// L'exception assumée est l'identité de marque (nom de société du site), qui
// n'appartient pas au produit : voir DEFAULT_COMPANY_NAME.
// ============================================================================

import type {
  Product,
  ProductDesign,
  ProductFeatures,
  ProductFieldwork,
  ProductMediaSlot,
  ProductNextSeries,
  ProductOverview,
  ProductSpecs,
} from './types';

/**
 * Société du site. Ce n'est PAS une donnée produit : le gabarit porte un
 * emplacement logo/entreprise, mais l'identité du site reste une constante de
 * la marque. Utilisé uniquement quand le produit ne renseigne pas `company`.
 */
export const DEFAULT_COMPANY_NAME = 'PixiaTech';

// ---------------------------------------------------------------------------
// Tests de présence
//
// Toutes les réponses passent par `text()` / `hasMedia()` : un tiret de gabarit
// (`—`), un slot `[ … ]` ou une chaîne vide ne sont PAS du contenu. Sans cela
// une sectionVIDE mais marquée (`title: '—'`) s'afficherait quand même, avec un
// plan sans cote et aucun texte — exactement le rendu partiel à éviter.
// ---------------------------------------------------------------------------

/** Vrai si au moins un des champs textuels porte une valeur réelle. */
const anyText = (...values: (string | undefined | null)[]): boolean => values.some((v) => text(v));

/** Un objet média compte s'il a un titre OU un fichier rattaché. */
const hasSlot = (slot?: ProductMediaSlot): boolean => hasMedia(slot);

/**
 * LECTEUR UNIQUE DE VALEUR DE SPÉCIFICATION.
 *
 * Une même valeur de caractéristique circule sous deux formes dans le code :
 *   - `string`            → forme PRODUIT (`types.ts` : `ProductSpecModel.specs`)
 *     et forme PARSER : `"1.2 mm"` ;
 *   - `{ v: string }`     → forme RENDU (`web/types.ts` : `SpecValue`), obtenue
 *     par la conversion `toSpecModel` de `SpecsSection`.
 *
 * Toute décision « cette valeur existe-t-elle ? » passe par ici. Avant, la
 * lecture était faite avec `typeof value === 'string'` : sur un `{ v }`, elle
 * renvoyait une chaîne vide, donc « pas de valeur », et le filtre de lignes
 * écartait TOUTES les caractéristiques alors que les données étaient
 * parfaitement renseignées.
 *
 * `text()` reste, et reste SEUL, la définition de ce qui vaut « pas de
 * valeur » (vide, tiret gabarit, slot `[ … ]`) : ce lecteur ne fait que
 * normaliser la FORME, jamais la significabilité.
 */
export function specValue(value: unknown): string | undefined {
  if (typeof value === 'string') return text(value);
  if (value !== null && typeof value === 'object') {
    const inner = (value as { v?: unknown }).v;
    if (typeof inner === 'string') return text(inner);
  }
  return undefined;
}

/** Une section n'est rendue que si elle porte au moins un contenu réel. */
export function hasOverview(o?: ProductOverview): boolean {
  if (!o) return false;
  return Boolean(
    anyText(o.title, o.description, o.image) ||
      hasSlot(o.photo) ||
      hasSlot(o.video) ||
      (o.video?.sources ?? []).some((s) => text(s.src)) ||
      (o.stats ?? []).some((s) => anyText(s.value, s.label, s.labelFr, s.labelEn)) ||
      (o.technologies ?? []).some((t) => anyText(t.num, t.title, t.description))
  );
}

export function hasDesign(d?: ProductDesign): boolean {
  if (!d) return false;
  return Boolean(
    anyText(
      d.title,
      d.moduleDim,
      d.cabinetDim,
      d.depth,
      d.weight,
      d.material,
      d.image
    ) ||
      (d.specsList ?? []).some((row) => anyText(row.label, row.value)) ||
      (d.configs ?? []).some((c) => anyText(c.num, c.title, c.description)) ||
      (d.visuals ?? []).some((slot) => hasSlot(slot))
  );
}

export function hasFeatures(f?: ProductFeatures): boolean {
  if (!f) return false;
  return Boolean(
    text(f.title) ||
      hasSlot(f.visual) ||
      (f.items ?? []).some((i) => anyText(i.num, i.title, i.description, i.image))
  );
}

export function hasSpecs(s?: ProductSpecs): boolean {
  if (!s) return false;
  // Une variante sans nom et sans valeur réelle ne peut pas comparaison :
  // elle ne justifie pas l'affichage de la matrice. Les valeurs sont lues par
  // `specValue`, qui tolère les deux formes (`"1.2 mm"` et `{ v: '1.2 mm' }`) :
  // sans lui, une matrice entièrement renseignée était déclarée vide.
  return (s.models ?? []).some(
    (m) => text(m.name) || Object.values(m.specs ?? {}).some((v) => specValue(v))
  );
}

export function hasFieldwork(fw?: ProductFieldwork): boolean {
  if (!fw) return false;
  return Boolean(
    text(fw.title) ||
      (fw.projects ?? []).some((p) => anyText(p.title, p.location, p.pitch, p.caption, p.image))
  );
}

export function hasNext(n?: Product['next']): boolean {
  if (!n) return false;
  const series = (s?: ProductNextSeries) =>
    Boolean(s && anyText(s.name, s.url, s.tagline));
  return Boolean(
    anyText(n.headline, n.headlineHighlight, n.cta) || series(n.prev) || series(n.next)
  );
}

// ---------------------------------------------------------------------------
// Rendu conditionnel des blocs
// ---------------------------------------------------------------------------

/** Vrai si un objet média décrit un contenu affichable (titre ou fichier). */
export function hasMedia(slot?: ProductMediaSlot): boolean {
  return Boolean(slot && (text(slot.title) || text(slot.url)));
}

/**
 * Valeur prête à afficher : `undefined` si le champ est absent OU s'il ne
 * contient qu'un tiret gabarit. `—` est le « pas de valeur » du modèle, pas
 * une valeur : l'afficher reviendrait à inventer.
 */
export function text(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[\u2010-\u2015\u2212-]+$/.test(trimmed)) return undefined;
  if (/^\[.*]$/.test(trimmed)) return undefined;
  return trimmed;
}

/** Liste de valeurs filtrée : ne contient que des chaînes réellement là. */
export function texts(values?: (string | undefined | null)[]): string[] {
  return (values ?? []).map((v) => text(v)).filter((v): v is string => Boolean(v));
}

/**
 * Une ligne de caractéristiques a-t-elle quelque chose à dire ?
 *
 * Le template maître définit la structure ; le PDF ne fournit que des valeurs.
 * Une ligne dont AUCUNE variante ne porte de valeur réelle n'est donc pas une
 * donnée manquante à signaler : elle n'a rien à dire. L'afficher produirait un
 * tableau de libellés suivis de tirets, qui donne l'illusion d'une
 * caractéristique relevée alors qu'aucune valeur n'existe — et alourdit la fiche
 * de lignes vides sur les produits incomplets.
 *
 * Une seule variante renseignée suffit : la ligne est affichée, et les cellules
 * des autres restent VIDES. Remplir un tiret pour « remplisser » la ligne
 * réintroduirait exactement le-placeholder qu'on vient d'éliminer.
 *
 * `specValue()` lit les deux formes possibles de la valeur et délègue le
 * « pas de valeur » à `text()`, qui en reste la seule définition (chaîne
 * vide, tiret ASCII, tiret cadratin, slot `[ … ]`). Le paramètre est donc
 * tolérant : lui passer des `string` bruts (`ProductSpecModel`, forme
 * produit) ou des `{ v }` (`SpecModel`, forme renderer) donne le même
 * résultat. C'est exactement cette frontière que le composant franchit, et
 * l'écart de forme y faisait perdre toutes les lignes.
 */
export function specRowHasValue(
  models: readonly { specs?: Record<string, unknown> }[] | undefined,
  key: string
): boolean {
  return (models ?? []).some((m) => Boolean(specValue(m.specs?.[key])));
}

// ---------------------------------------------------------------------------
// Formatage des cotes pour les illustrations
// ---------------------------------------------------------------------------

/** `500×1000 mm` → `500×1000` (unité retirée pour un schéma). */
export function dimensionOnly(value?: string): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  return raw.replace(/\s*(mm|cm|m)\s*$/i, '').trim() || undefined;
}

/** Profondeur : `90 mm` → `90` (unité rendue séparément dans le schéma). */
export function depthValue(value?: string): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  return raw.replace(/\s*mm\s*$/i, '').trim() || undefined;
}

/**
 * Cote d'illustration à partir d'une valeur qui peut être une plage
 * (`1.2–3.1 mm`) ou une cote simple (`90 mm`).
 */
export function dimensionForArt(value?: string): string | undefined {
  return dimensionOnly(value) ?? depthValue(value);
}

/**
 * Mention d'unité affichée à côté d'une cote débarrassée de son unité.
 * Un gabarit sans unité ne permet pas d'inventer « mm ».
 */
export function dimensionUnit(value?: string): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const m = raw.match(/\s(mm|cm|m)\s*$/i);
  return m ? m[1] : undefined;
}
