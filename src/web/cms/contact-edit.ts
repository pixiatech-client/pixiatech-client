'use client';

import type { ContactInfo, PageContentConfig } from '@/lib/site-web/types';

/**
 * Raccord d'édition inline pour la page Contact.
 *
 * SOURCE UNIQUE : les coordonnées de contact vivent dans un seul document
 * Firestore, `siteWeb/contactInfo` (exposé par `/api/site-web/contact/info`).
 * Le contenu de page (`siteWeb/content`, type `PageContentConfig`) ne porte que
 * la MISE EN FORME : titres, libellés, visibilité. C'est `ContactSections` qui
 * combine les deux, et qui affiche les valeurs issues de `contactInfo`.
 *
 * Conséquence : l'édition inline d'une VALEUR de contact doit écrire dans
 * `contactInfo`, sinon la modification serait enregistrée dans un document qui
 * n'est plus lu et disparaîtrait au rechargement. Les champs de valeur sont
 * donc traduits vers leur clé canonique via `CONTACT_INFO_KEY_BY_CONTENT_KEY`,
 * et enregistrés par l'API `info`. Tout le reste (héros, libellés, FAQ) passe
 * par l'API `page-content` existante.
 *
 * Chaque élément réellement éditable porte un attribut `data-contact-key`
 * explicite (ex. "contact.hero.titleLine1") correspondant à un vrai champ.
 * Seuls les champs des listes blanches ci-dessous sont acceptés : pas
 * d'écriture de clé inventée.
 *
 * NB : le contenu Contact est monolingue (source FR) — le toggle FR/EN de la
 * page ne traduit que l'habillage UI. Modifier un champ met donc à jour la
 * valeur partagée par FR et EN, exactement comme le fait `ContactModule`.
 */

export const CONTACT_REFRESH_EVENT = 'pixia:contact-content-saved';

const HERO_FIELDS = ['titleLine1', 'titleHighlight', 'subtitle', 'ctaButtonText'] as const;
const INFO_FIELDS = ['addressValue', 'phone1', 'phone2', 'emailValue'] as const;
const FAQ_PARTS = ['question', 'answer'] as const;

/**
 * Clés de contenu dont la VALEUR est détenue par `contactInfo`. Écrire dans
 * `PageContentConfig.info` n'aurait aucun effet visible : la page lit la
 * source canonique. On redirige donc l'écriture vers la bonne clé.
 */
const CONTACT_INFO_KEY_BY_CONTENT_KEY: Record<string, keyof ContactInfo> = {
  'contact.info.addressValue': 'address',
  'contact.info.phone1': 'phone1',
  'contact.info.phone2': 'phone2',
  'contact.info.emailValue': 'primaryEmail',
};

/** Vrai si cette clé d'édition inline est une valeur de contact canonique. */
export function isContactInfoKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(CONTACT_INFO_KEY_BY_CONTENT_KEY, key);
}

/**
 * Applique une modification de champ sur la config Contact (source Firestore).
 * Renvoie une NOUVELLE config complète (jamais une arborescence partielle), ce
 * qui reste compatible avec le PUT de l'admin qui remplace le document entier.
 *
 * Les valeurs de contact ne passent pas ici : elles sont écrites par
 * `saveContactField` directement dans `contactInfo` (cf. `isContactInfoKey`).
 */
export function applyContactPatch(
  current: PageContentConfig,
  key: string,
  value: string
): PageContentConfig {
  const parts = key.split('.');

  if (parts[0] !== 'contact') return current;

  if (
    parts[1] === 'hero' &&
    parts.length === 3 &&
    (HERO_FIELDS as readonly string[]).includes(parts[2])
  ) {
    return { ...current, hero: { ...current.hero, [parts[2]]: value } };
  }

  if (parts[1] === 'info' && parts.length === 3 && isContactInfoKey(key)) {
    // Hors de portée ici : la valeur appartient à `contactInfo`.
    return current;
  }

  if (
    parts[1] === 'info' &&
    parts.length === 3 &&
    (INFO_FIELDS as readonly string[]).includes(parts[2])
  ) {
    return { ...current, info: { ...current.info, [parts[2]]: value } };
  }

  if (
    parts[1] === 'faq' &&
    parts.length === 4 &&
    (FAQ_PARTS as readonly string[]).includes(parts[3])
  ) {
    const id = parts[2];
    return {
      ...current,
      faq: {
        ...current.faq,
        items: (current.faq.items ?? []).map((item) =>
          item.id === id ? { ...item, [parts[3]]: value } : item
        ),
      },
    };
  }

  return current;
}

/** Écrit une valeur de contact dans la source canonique `contactInfo`. */
async function saveContactInfoValue(key: string, value: string): Promise<void> {
  const infoKey = CONTACT_INFO_KEY_BY_CONTENT_KEY[key];
  const res = await fetch('/api/site-web/contact/info', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [infoKey]: value }),
  });
  if (!res.ok) throw new Error('échec de la sauvegarde contact');
}

/**
 * Sauvegarde une modification d'un champ Contact dans Firestore via l'API
 * existante. Ne résout la promesse qu'après le 200 du serveur ; sinon throw
 * (l'UI affichera l'erreur, sans prétendre que la sauvegarde a réussi).
 */
export async function saveContactField(key: string, value: string): Promise<void> {
  if (isContactInfoKey(key)) {
    await saveContactInfoValue(key, value);
    window.dispatchEvent(new CustomEvent(CONTACT_REFRESH_EVENT));
    return;
  }

  const getRes = await fetch('/api/site-web/contact/page-content', { cache: 'no-store' });
  if (!getRes.ok) throw new Error('contenu contact introuvable');
  const body = (await getRes.json()) as { success?: boolean; data?: PageContentConfig };
  const current = body?.data;
  if (!body?.success || !current) throw new Error('contenu contact introuvable');

  const next = applyContactPatch(current, key, value);
  if (next === current) throw new Error(`clé contact inconnue : ${key}`);

  const putRes = await fetch('/api/site-web/contact/page-content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(next),
  });
  if (!putRes.ok) throw new Error('échec de la sauvegarde contact');

  // Notifie `ContactSections` pour qu'il relise Firestore et affiche la
  // nouvelle valeur après save + reload.
  window.dispatchEvent(new CustomEvent(CONTACT_REFRESH_EVENT));
}