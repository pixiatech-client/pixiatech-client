import { GoogleGenAI } from '@google/genai';
import { extractJson } from '../validate';
import {
  TranslationError,
  type TranslationInput,
  type TranslationProvider,
  type TranslationResult,
} from '../types';

/**
 * Provider de traduction Google Gemini.
 *
 * Premier provider livre : le SDK `@google/genai` est deja installe et
 * `GEMINI_API_KEY` est deja declare dans `.env.example`. Aucun client ne voit
 * cette cle : l'appel part d'ici, cote serveur uniquement.
 *
 * Pour ajouter un deuxieme provider (par exemple l'API Responses d'OpenAI), il
 * suffit d'ecrire une classe qui implemente `TranslationProvider` et de la
 * declarer dans `providers/index.ts`. Ni le CMS, ni le bouton « Traduire EN »,
 * ni la validation n'ont besoin d'etre modifies.
 */

/**
 * Modele par defaut. Un modele multilingue economique suffit largement pour de
 * la traduction de contenu web ; il reste configurable par variable
 * d'environnement sans toucher au code.
 */
const DEFAULT_MODEL = process.env.GEMINI_TRANSLATION_MODEL || 'gemini-2.5-flash';

/**
 * Consigne systeme. Volontairement prescriptive sur les points qui degradent
 * une traduction de site : fidelite au sens, preservation des noms propres et
 * des references techniques, et surtout un format de sortie strictement
 * exploitable — aucune explication, aucun Markdown, un item par champ.
 */
function buildSystemInstruction(sourceLang: string, targetLang: string): string {
  return `You are a professional ${sourceLang}→${targetLang} translator for the PIXIATECH corporate website.

Translate the supplied website content into natural, professional ${targetLang}.

Rules:
- Translate only the provided text.
- Preserve the original meaning exactly.
- Do not invent information and do not add marketing claims.
- Do not remove information.
- Preserve product names, series names and brand names unless they are common words.
- Preserve technical terminology when a standard ${targetLang} term exists.
- Preserve numbers, units and measurements exactly.
- Preserve placeholders, HTML markup and line breaks when present.
- Never translate ids, slugs, urls or technical keys: the "id" field must be returned unchanged.
- If a source text is already in ${targetLang}, return it unchanged.
- Return exactly one translation per input item, preserving every "id" verbatim.
- Return only JSON. No explanations, no Markdown fences, no commentary.

Output shape:
{"translations":[{"id":"<id unchanged>","text":"<translation>"}]}`;
}

export class GeminiTranslationProvider implements TranslationProvider {
  readonly id = 'gemini';
  readonly model: string;

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model;
  }

  isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async translate(input: TranslationInput): Promise<TranslationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new TranslationError(
        'Erreur de connexion au service de traduction : clé GEMINI_API_KEY absente.'
      );
    }
    if (input.items.length === 0) {
      return { translations: [], model: this.model };
    }

    // On limite la taille d'un lot : au-dela, le modele degrade la fidelity et
    // le risque qu'il oublie un item augmente. L'appelant decoupe la page.
    const BATCH = 40;
    const batches: TranslationInput['items'][] = [];
    for (let i = 0; i < input.items.length; i += BATCH) {
      batches.push(input.items.slice(i, i + BATCH));
    }

    const collected = [];
    for (const items of batches) {
      collected.push(...(await this.translateBatch(apiKey, items, input)));
    }

    return { translations: collected, model: this.model };
  }

  private async translateBatch(
    apiKey: string,
    items: TranslationInput['items'],
    input: TranslationInput
  ): Promise<TranslationResult['translations']> {
    const ai = new GoogleGenAI({ apiKey });

    const payload = {
      items: items.map((f) => ({ id: f.id, text: f.source })),
    };

    const response = await ai.models.generateContent({
      model: this.model,
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: buildSystemInstruction(input.sourceLang, input.targetLang),
        // Le JSON structure evite tout au dela de la reponse utile.
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const raw = response.text ?? '';
    if (!raw.trim()) {
      throw new TranslationError('La traduction a retourné une réponse vide.');
    }

    // Le provider ne fait QUE la traduction de protocole : il rend un JSON en
    // paires `{ id, text }`. Il ne verifie ni les identifiants, ni le nombre
    // d'elements, ni les chaines vides — c'est le role de `validate.ts`, seul
    // habilite a decider que la reponse est exploitable.
    const parsed = asRecord(extractJson(raw));
    const list = Array.isArray(parsed.translations) ? parsed.translations : [];

    return list.map((entry) => {
      const record = asRecord(entry);
      return {
        id: String(record.id ?? ''),
        text: typeof record.text === 'string' ? record.text : '',
      };
    });
  }
}

/** Garantit un objet : toute autre forme est une reponse inexploitable. */
function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new TranslationError('La traduction a retourné un format invalide.');
}
