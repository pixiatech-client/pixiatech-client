// Fusion « caractéristique → variante(s) » pour l'import PDF.
// Garantit qu'une (ou plusieurs) valeur(s) issue(s) d'un PDF existe(nt) dans les
// options/variantes d'une caractéristique SANS jamais écraser les valeurs
// existantes : ajout uniquement si absente, en fin de liste, avec déduplication.
// `options` est la source qui alimente réellement la liste déroulante (CustomSelect).

export interface CharacteristicSlice {
  options?: unknown;
  variants?: unknown;
}

export interface CharacteristicVariantState {
  options: string[];
  variants: { id: string; value: string }[];
}

export interface MergeVariantResult extends CharacteristicVariantState {
  changed: boolean;
}

// Même normalisation que `normalizeSearchText` (src/lib/utils.ts) : insensible à la
// casse et aux accents, espaces de début/fin ignorés. « 4000 » et « 4000 » avec un
// espace final sont donc considérés identiques et ne créent pas deux variantes.
export function normalizeVariantText(text: unknown): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function characteristicOptions(char: CharacteristicSlice): string[] {
  if (Array.isArray(char.options)) {
    return (char.options as unknown[]).map((o) => String(o ?? '').trim()).filter(Boolean);
  }
  if (Array.isArray(char.variants)) {
    return (char.variants as { value?: unknown }[])
      .map((v) => String(v?.value ?? '').trim())
      .filter(Boolean);
  }
  return [];
}

export function characteristicVariants(
  char: CharacteristicSlice,
  fallbackOptions?: string[]
): CharacteristicVariantState['variants'] {
  if (Array.isArray(char.variants)) {
    return (char.variants as { id?: unknown; value?: unknown }[]).map((v) => ({
      id: String(v?.id ?? ''),
      value: String(v?.value ?? ''),
    }));
  }
  return (fallbackOptions ?? characteristicOptions(char)).map((v, i) => ({
    id: String(i),
    value: v,
  }));
}

/**
 * Ajoute les valeurs absentes (normalisées) aux options/variantes de la
 * caractéristique. Retourne la liste enrichie (valeurs existantes conservées)
 * dans l'ordre, plus un drapeau `changed` si au moins une valeur a été ajoutée.
 */
export function mergeVariantValues(
  char: CharacteristicSlice,
  values: unknown[]
): MergeVariantResult {
  const options = characteristicOptions(char);
  const variants = characteristicVariants(char, options);
  let mergedOptions = [...options];
  let mergedVariants = [...variants];
  let changed = false;

  for (const raw of values ?? []) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    if (mergedOptions.some((o) => normalizeVariantText(o) === normalizeVariantText(value))) {
      continue;
    }
    mergedOptions = [...mergedOptions, value];
    mergedVariants = [...mergedVariants, { id: String(Date.now() + Math.random()), value }];
    changed = true;
  }

  return { options: mergedOptions, variants: mergedVariants, changed };
}

/**
 * Variante d'appel pour une valeur unique (cas « Puissance : 4000 »).
 */
export function ensureCharacteristicVariant(
  char: CharacteristicSlice,
  value: unknown
): MergeVariantResult {
  return mergeVariantValues(char, [value]);
}