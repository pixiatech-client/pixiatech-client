// ============================================================================
// RÈGLE UNIQUE — QUEL PRODUIT EST LE TEMPLATE SYSTÈME.
//
// Le template est une RESSOURCE SYSTÈME : il sert de base à la génération des
// fiches produits. Le supprimer casse la génération, et rien dans l'interface
// ne l'indiquait. Ce module regroupe donc, en un seul endroit, la définition de
// cette ressource et les seules opérations qui ont le droit de la toucher.
//
// Une seule règle, redéfinie nulle part ailleurs : le template système est le
// produit dont le slug est celui du template maître. Aucune propriété Firestore
// n'est ajoutée (`isSystemTemplate` serait un second mensonge à maintenir : il
// suffirait qu'un jour le document soit recopié sans le champ pour que la
// protection disparaisse).
//
// La source de vérité du slug est `master-template.ts`, module verrouillé qui
// définit déjà ce produit. On l'importe au lieu de recopier la chaîne : deux
// constantes à synchroniser finiraient par divergir, et c'est exactement le
// genre d'oubli qui coûte une base de production.
//
// PORTÉE : la suppression, uniquement. Le template reste éditable, duplicable
// et publiable, et il peut rester en `draft` — la génération n'exige aucun
// statut particulier.
// ============================================================================

import { MASTER_TEMPLATE_SLUG } from './master-template';

/** Slug du template système, issu de l'identifiant déjà existant. */
export const SYSTEM_TEMPLATE_SLUG = MASTER_TEMPLATE_SLUG;

/** Raison affichée à l'administrateur quand la suppression est refusée. */
export const SYSTEM_TEMPLATE_PROTECTED_MESSAGE =
  'Ce produit est le template système et ne peut pas être supprimé.';

/** Code stable, pour que l'interface puisse distinguer ce refus d'une panne. */
export const SYSTEM_TEMPLATE_PROTECTED_CODE = 'SYSTEM_TEMPLATE_PROTECTED';

/** Étiquette du cadenas dans la liste des produits. */
export const SYSTEM_TEMPLATE_LABEL = 'TEMPLATE SYSTÈME';

/**
 * Le slug est comparé en normalisé (casse, espaces) parce que c'est ce que fait
 * Firestore pour un identifiant de document : `Template-Maitre` et
 * `template-maitre` désignent le même produit, donc la même ressource.
 */
export function isSystemTemplateSlug(slug: string | null | undefined): boolean {
  return typeof slug === 'string' && slug.trim().toLowerCase() === SYSTEM_TEMPLATE_SLUG;
}

/** Même règle, appliquée à un produit plutôt qu'à son slug. */
export function isSystemTemplate(product: { slug?: string } | null | undefined): boolean {
  return Boolean(product) && isSystemTemplateSlug(product?.slug);
}

/** Erreur identifiable par le serveur, distincte d'une panne Firestore. */
export class SystemTemplateProtectedError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(SYSTEM_TEMPLATE_PROTECTED_MESSAGE);
    this.name = 'SystemTemplateProtectedError';
    this.slug = slug;
  }
}

/**
 * Point d'entrée unique des chemins de suppression.
 *
 * Appelé AVANT tout accès à Firestore : le document doit rester intact, et pas
 * seulement ne pas être renvoyé. Une garde placée après la lecture du document
 * laisserait passer un batch, une corbeille ou un appel direct.
 */
export function assertDeletableProduct(slug: string): void {
  if (isSystemTemplateSlug(slug)) throw new SystemTemplateProtectedError(slug);
}

/**
 * Sépare une sélection en supprimables et protégés.
 *
 * Sert à la suppression groupée : les produits ordinaires partent, le template
 * reste. Ne jamais renvoyer uniquement la liste filtrée — l'appelant doit
 * pouvoir annoncer ce qu'il a refusé, sinon un « Tout sélectionner » suivi
 * d'une suppression donnerait l'impression d'avoir tout effacé.
 */
export function partitionDeletableProducts<T extends { slug?: string }>(items: readonly T[]): {
  deletable: T[];
  protectedItems: T[];
} {
  const deletable: T[] = [];
  const protectedItems: T[] = [];
  for (const item of items) {
    if (isSystemTemplate(item)) protectedItems.push(item);
    else deletable.push(item);
  }
  return { deletable, protectedItems };
}
