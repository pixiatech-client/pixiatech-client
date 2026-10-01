/**
 * Contrats du module de traduction du CMS.
 *
 * Le module ne connait AUCUN fournisseur : il parle uniquement a
 * `TranslationProvider`. Changer de modele se fait dans `providers/index.ts`,
 * sans toucher a l'extraction, a la validation, a la sauvegarde ni au CMS.
 */

/** Un champ texte FR eligible a la traduction, extrait d'une page. */
export interface TranslatableField {
  /**
   * Identifiant unique et stable dans la page. C'est aussi la CLE utilisee
   * dans `_i18n` : `sections[sectionKey]._i18n[<id>][<lang>]`.
   * Exemple : `hero.title`, `manifesto.body`.
   */
  id: string;
  /** Section porteuse, ex. `hero`. */
  sectionKey: string;
  /** Cle plate dans la section, ex. `title`. Toujours de niveau 1. */
  path: string;
  /** Valeur FR de reference. Jamais modifiee par le module. */
  source: string;
}

/** Ce que le CMS demande au provider. */
export interface TranslationInput {
  /** Champs a traduire. deja filtres : aucun champ vide n'arrive ici. */
  items: TranslatableField[];
  sourceLang: string;
  targetLang: string;
}

/** Un texte traduit, valide. */
export interface TranslatedText {
  id: string;
  text: string;
}

/**
 * Reponse du provider. `raw` est conserve pour le diagnostic d'erreur :
 * un provider qui repond du HTML ou du Markdown ne doit jamais passer
 * silencieusement.
 */
export interface TranslationResult {
  translations: TranslatedText[];
  model: string;
  /** Reponse brute, pour le journal serveur uniquement. */
  raw?: string;
}

/**
 * Abstraction d'un fournisseur de traduction.
 *
 * Le CMS appelle toujours le provider a travers cette interface : changer de
 * modele, de fournisseur ou d'API n'a donc aucun effet sur le reste du CMS.
 */
export interface TranslationProvider {
  /** Identifiant stable, utilise dans les logs et le `translationMeta`. */
  readonly id: string;
  /** Modele effectivement utilise, pour la tracabilite. */
  readonly model: string;
  /** `false` si la cle API manque : l'API peut alors repondre 503. */
  isConfigured(): boolean;
  translate(input: TranslationInput): Promise<TranslationResult>;
}

/**
 * Metadonnees de traduction conservees sur la page.
 *
 * `sourceHash` permet de detecter qu'un texte FR a change depuis la derniere
 * traduction, donc de ne retraduire que ce qui est necessaire.
 */
export interface TranslationMeta {
  sourceLanguage: string;
  targetLanguage: string;
  translatedAt: string;
  provider: string;
  model: string;
  /** Empreinte des sources FR au moment de la traduction. */
  sourceHash: string;
  /** Nombre de champs effectivement ecrits. */
  translatedFields: number;
}

/** Erreur de validation metier. `fatal` = rien ne doit etre ecrit. */
export class TranslationError extends Error {
  constructor(
    message: string,
    readonly fatal = true
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}
