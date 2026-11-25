import type { LocationCity } from '../../core/types';

export interface CitySuggestion {
  id: string;
  name: string;
}

/**
 * Suggestions affichées par le champ « ville de livraison ».
 *
 * Les enregistrements Firestore peuvent contenir plusieurs villes réelles
 * portant le même nom (Saint-Denis 93000 / 93200, par exemple). Le champ ne
 * sélectionne qu'un NOM : afficher deux chips identiques serait ambigu et
 * produirait des clés React dupliquées. On conserve donc le premier
 * enregistrement par nom normalisé, avec son vrai identifiant comme clé.
 * Le bootstrap complet, lui, n'est pas modifié.
 */
export function buildCitySuggestions(villes: LocationCity[]): CitySuggestion[] {
  const seen = new Set<string>();
  const suggestions: CitySuggestion[] = [];

  for (const ville of villes) {
    const name = typeof ville?.name === 'string' ? ville.name.trim() : '';
    if (!name) continue;

    const normalized = name.toLocaleLowerCase('fr');
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const id = ville.id?.trim() ||
      `${name}|${ville.postcode ?? ''}|${ville.zoneId ?? ''}`;
    suggestions.push({ id, name });
  }

  return suggestions;
}
