import type { City } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// RÉSOLUTION CENTRALISÉE VILLE / CODE POSTAL → ZONE → RÈGLE → TARIF
//
// Fonction pure, sans Firestore : tous les flux (Configurateur, SignatureFlow,
// WizardBot, QuickRent, Boutique) doivent passer par ici pour qu'un même panier
// et une même destination produisent le MÊME coût de livraison.
//
// Catalogues acceptés :
//  - locations.villes (Firestore) : portent les vrais ids + zoneId,
//  - CITIES (liste statique) : secours hors-ligne sans zoneId.
// Le résolveur fusionne les deux : Firestore est prioritaire, puis statique.
// ─────────────────────────────────────────────────────────────────────────────

export interface DestinationInput {
  cityId?: string | null;
  postcode?: string;
  cityName?: string;
}

export interface ResolvedDestination {
  city: City | null;
  cityId: string | null;
  zoneId: string | null;
  cityName: string;
  postcode: string;
  resolved: boolean;      // trouvée dans au moins un catalogue
  fallbackUsed: boolean;  // résolue via la liste statique (sans zoneId fiable)
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''-]/g, ' ')
    .trim();
}

function findById(cities: City[], id: string): City | undefined {
  return cities.find(c => c.id === id);
}

function findByPostcode(cities: City[], postcode: string): City | undefined {
  const norm = postcode.trim();
  if (!norm) return undefined;
  return cities.find(c => String(c.postalCode).trim() === norm || String(c.postalCode).trim().startsWith(norm));
}

function findByName(cities: City[], name: string): City | undefined {
  const norm = normalizeName(name);
  if (!norm) return undefined;
  return cities.find(c => normalizeName(c.name) === norm);
}

/**
 * Résout une destination à partir d'un catalogue de villes Firestore (`locations`)
 * et d'une liste statique de secours (`CITIES`). L'ordre de priorité :
 *   1. id exact (Firestore puis statique)
 *   2. code postal (Firestore puis statique)
 *   3. nom de ville (Firestore puis statique)
 */
export function resolveDestination(
  input: DestinationInput,
  firestoreCities: City[] | null | undefined,
  staticCities: City[]
): ResolvedDestination {
  const firestore = Array.isArray(firestoreCities) ? firestoreCities : [];
  const lookup = (find: (list: City[], value: string) => City | undefined, value: string | null | undefined) => {
    if (!value) return undefined;
    return find(firestore, value) ?? find(staticCities, value);
  };

  let city: City | undefined;
  if (input.cityId) {
    city = findByPostcode(firestore, input.cityId) && findById(firestore, input.cityId)
      ? findById(firestore, input.cityId)
      : findById(staticCities, input.cityId);
  }
  const postcode = input.postcode?.trim();
  const cityName = input.cityName?.trim();
  if (!city && (postcode || cityName)) {
    city = postcode ? lookup(findByPostcode, postcode) : undefined;
    if (!city && cityName) city = lookup(findByName, cityName);
  }

  if (!city) {
    return {
      city: null,
      cityId: input.cityId ?? null,
      zoneId: null,
      cityName: cityName ?? '',
      postcode: postcode ?? '',
      resolved: false,
      fallbackUsed: true,
    };
  }

  const firestoreMatch = firestore.some(c => c.id === city.id);
  return {
    city,
    cityId: city.id,
    zoneId: city.zoneId ?? null,
    cityName: city.name,
    postcode: city.postalCode,
    resolved: true,
    fallbackUsed: !firestoreMatch || !city.zoneId,
  };
}