import { TranslationError, type TranslatableField, type TranslatedText } from './types';

/**
 * Validation STRICTE de la reponse d'un provider.
 *
 * Principe : une reponse non conforme ne doit jamais produire une ecriture
 * partielle. Toutes les verifications sont faites AVANT tout appel a
 * `applyTranslations`. Le module echoue donc entierement plutot que de laisser
 * une page a moitie traduite.
 */

/**
 * Extrait le JSON d'une reponse de modele.
 *
 * Un LLM peut entourer sa sortie d'un bloc ```json ou la preceder d'un
 * commentaire. On tolere ces enveloppes, mais on ne tolere RIEN d'autre : le
 * contenu est ensuite valide champ par champ.
 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/iu);
  const candidate = (fenced ? fenced[1] : raw).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // Deuxieme essai : le modele a peut-etre preface son JSON.
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
      } catch {
        /* tombe dans le throw ci-dessous */
      }
    }
    throw new TranslationError('La traduction a retourné un format invalide.');
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new TranslationError('La traduction a retourné un format invalide.');
}

/**
 * Valide la reponse contre la liste exacte des champs envoyes.
 *
 * Verifie, dans l'ordre :
 *  1. la forme du JSON (`{ translations: [...] }`) ;
 *  2. qu'il n'y a pas d'identifiant inconnu (le modele n'invente rien) ;
 *  3. qu'il n'y a pas d'identifiant duplique ;
 *  4. que tout identifiant attendu est present ;
 *  5. que chaque valeur est une chaine non vide.
 */
export function validateTranslationResponse(
  expected: readonly TranslatableField[],
  payload: unknown
): TranslatedText[] {
  const root = asRecord(payload);
  const list = Array.isArray(root.translations)
    ? root.translations
    : Array.isArray(payload)
      ? (payload as unknown[])
      : null;

  if (!list) {
    throw new TranslationError('La traduction a retourné un format invalide.');
  }

  const expectedIds = new Set(expected.map((f) => f.id));
  const byId = new Map<string, string>();
  const seen = new Set<string>();

  for (const entry of list) {
    const record = asRecord(entry);
    const id = record.id;
    const text = record.text;

    if (typeof id !== 'string' || id.length === 0) {
      throw new TranslationError('Un élément traduit est dépourvu d’identifiant.');
    }
    if (!expectedIds.has(id)) {
      throw new TranslationError(`Identifiant inattendu dans la réponse : ${id}`);
    }
    if (seen.has(id)) {
      throw new TranslationError(`Identifiant dupliqué dans la réponse : ${id}`);
    }
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new TranslationError(`Traduction vide pour le champ : ${id}`);
    }

    seen.add(id);
    byId.set(id, text);
  }

  const missing = [...expectedIds].filter((id) => !seen.has(id));
  if (missing.length > 0) {
    throw new TranslationError(
      `Réponse incomplète : ${missing.length} champ(s) absent(s) (${missing.slice(0, 3).join(', ')}…).`
    );
  }

  // Ordre canonique : celui des champs envoyes. Evite qu'une difference
  // d'ordre entre la requete et la reponse soit interpretee comme un changement.
  return expected.map((f) => ({ id: f.id, text: byId.get(f.id) as string }));
}
