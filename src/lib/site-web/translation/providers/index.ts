import { GeminiTranslationProvider } from './gemini';
import { TranslationError, type TranslationProvider } from '../types';

/**
 * Registre des providers de traduction.
 *
 * ── Point d'architecture ──────────────────────────────────────────────────
 * Le CMS ne connait QUE ce registre. Ni la liste des pages, ni le bouton
 * « Traduire EN », ni l'extracteur, ni la validation ne referencent un
 * fournisseur precis.
 *
 * Changer de modele revient donc a changer une ligne ici — soit le modele par
 * variable d'environnement, soit l'instance enregistree. Le reste du CMS
 * reste identique, ce qui est l'objectif : le modele ne doit pas etre disperse
 * dans le CMS.
 *
 * Pour brancher un deuxieme provider (API Responses d'OpenAI, service
 * interne…) :
 *   1. ecrire une classe implementant `TranslationProvider` ;
 *   2. l'enregistrer dans `PROVIDERS` ci-dessous.
 * Aucun autre fichier n'a besoin d'etre modifie.
 */

/**
 * Provider par defaut. Surchargable par variable d'environnement pour changer
 * de modele sans redemarrer quoi que ce soit de structurel.
 */
const DEFAULT_PROVIDER_ID = process.env.CMS_TRANSLATION_PROVIDER || 'gemini';

const providers = new Map<string, TranslationProvider>([
  ['gemini', new GeminiTranslationProvider()],
]);

/** Provider explicitement demande. */
export function getTranslationProvider(id?: string): TranslationProvider {
  const providerId = id || DEFAULT_PROVIDER_ID;
  const provider = providers.get(providerId);
  if (!provider) {
    throw new TranslationError(`Fournisseur de traduction inconnu : ${providerId}`);
  }
  return provider;
}

/**
 * Provider a utiliser, en tenant compte du fait que le provider par defaut
 * puisse manquer de configuration : on ne renvoie pas une erreur « inconnu »
 * lorsqu'il s'agit en realite d'une cle API absente, le message doit guider.
 */
export function resolveTranslationProvider(id?: string): TranslationProvider {
  const provider = getTranslationProvider(id);
  if (!provider.isConfigured()) {
    throw new TranslationError(
      `Erreur de connexion au service de traduction : le fournisseur « ${provider.id} » n’est pas configuré côté serveur.`
    );
  }
  return provider;
}

/** Identifiants disponibles, pour l'affichage et le diagnostic. */
export function listTranslationProviders(): { id: string; model: string; configured: boolean }[] {
  // `Array.from` et non `[...]` : la cible est ES5 sans `downlevelIteration`,
  // où le spread sur un `MapIterator` n'est pas typé.
  return Array.from(providers.values()).map((p) => ({
    id: p.id,
    model: p.model,
    configured: p.isConfigured(),
  }));
}
