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

  const postcode = input.postcode?.trim();
  const cityName = input.cityName?.trim();

  let city: City | undefined;

  // 1) Résolution par id EXACT dans Firestore (vrais doc-ids créés par l'admin).
  //    Un id statique ('1', '2', …) ne matche aucun doc Firestore → ici on n'obtient rien.
  if (input.cityId) {
    city = findById(firestore, input.cityId);
  }

  // 2) Si l'on n'a pas encore de ville Firestore (ou que celle résolue est sans zone),
  //    on tente le repli par code postal PUIS par nom DANS Firestore. La liste statique
  //    ne doit JAMAIS court-circuiter cette étape, car elle ne porte pas de zoneId fiable.
  if (!city || city.zoneId == null) {
    if (postcode) {
      const byPost = findByPostcode(firestore, postcode);
      if (byPost) {
        city = byPost;
      }
    }
    if ((!city || city.zoneId == null) && cityName) {
      const byName = findByName(firestore, cityName);
      if (byName) city = byName;
    }
  }

  // 3) Dernier recours : liste statique (hors-ligne / ville jamais configurée côté admin),
  //    uniquement si aucune ville Firestore (avec ou sans zone) n'a été trouvée.
  if (!city) {
    if (input.cityId) city = findById(staticCities, input.cityId);
    if (!city && postcode) city = findByPostcode(staticCities, postcode);
    if (!city && cityName) city = findByName(staticCities, cityName);
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