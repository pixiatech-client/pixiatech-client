#!/usr/bin/env node
/**
 * scripts/clean-i18n-entries.mjs
 *
 * Purge les entrees NON TEXTUELLES qui se sont glisse dans le magasin
 * `_i18n` des pages CMS.
 *
 * Origine du probleme : `autoTranslateSection` (src/lib/site-web/cms-context.tsx)
 * filtrait les champs avec une LISTE NOIRE (`ignorable`). Toute cle absente de
 * cette liste passait le filtre — chemins d'images, couleurs hexadecimales et
 * noms de fichiers se sont donc retrouve stockes comme du "texte traduisible".
 *
 * Regle de securite inconditionnelle : ce script ne SUPPRIME QUE des entrees
 * `_i18n[field]`. Il ne touche jamais au champ plat racine `section[field]`,
 * qui reste la source de verite FR. Une image supprimee de `_i18n` est donc
 * toujours rendue, une couleur reste appliquee.
 *
 * Usage :
 *   node scripts/clean-i18n-entries.mjs            # rapport seul, aucune ecriture
 *   node scripts/clean-i18n-entries.mjs --write    # applique et ecrit le fichier
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(root, 'data', 'pixel-tech-web-pages.json');
const SHOULD_WRITE = process.argv.includes('--write');

/**
 * Cles dont la valeur n'est JAMAIS du texte editorial, quel que soit le
 * contenu. Le motif est teste sans ancrage pour couvrir les variantes
 * indexees (`market_rental_image`, `feature_3_image`, `insight_1_image`...).
 */
const NON_TEXTUAL_KEY = [
  /^_/u, // metadonnees internes (_i18n, _elements)
  /image$/iu,
  /^img/iu,
  /^bg/iu, // bgColor, background
  /^url$/iu,
  /^src$/iu,
  /^href$/iu,
  /color$/iu,
  /colour$/iu,
  /^font/iu,
  /padding/iu,
  /^margin/iu,
  /^gap$/iu,
  /^(min|max)?(width|height)$/iu,
  /^(position|zIndex|opacity|overflow|visibility|display)$/iu,
  /^visible$/iu,
  /^id$/iu,
  /^slug$/iu,
  /^key$/iu,
  /^type$/iu,
];

/** Valeurs manifestement techniques, meme sous une cle de texte. */
const NON_TEXTUAL_VALUE = [
  /^#[0-9a-f]{3,8}$/iu, // couleur hexadecimale
  /^(rgb|rgba|hsl|hsla)\(/iu,
  /^\/?[\w./-]*\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|mov|pdf)$/iu, // chemin de fichier
  /^\d+(\.\d+)?(px|rem|em|%|vh|vw|deg|ms|s)$/iu, // dimension
  /^(auto|none|flex|grid|block|inline|center|left|right)$/iu,
];

const isNonTextualKey = (key) => NON_TEXTUAL_KEY.some((re) => re.test(key));

const isNonTextualValue = (value) =>
  typeof value === 'string' && NON_TEXTUAL_VALUE.some((re) => re.test(value.trim()));

function main() {
  const raw = readFileSync(DATA_FILE, 'utf-8');
  const db = JSON.parse(raw);
  const removals = [];

  for (const [pageId, page] of Object.entries(db.pages ?? {})) {
    for (const [sectionKey, section] of Object.entries(page?.sections ?? {})) {
      const i18n = section?._i18n;
      if (!i18n || typeof i18n !== 'object') continue;

      for (const fieldKey of Object.keys(i18n)) {
        const store = i18n[fieldKey];
        if (!store || typeof store !== 'object') continue;

        const langs = Object.keys(store);
        // Le champ plat racine doit rester : c'est lui qui alimente le rendu.
        const rootValue = section[fieldKey];

        const dropByKey = isNonTextualKey(fieldKey);
        const dropByValue = typeof rootValue === 'string' && isNonTextualValue(rootValue);

        if (!dropByKey && !dropByValue) continue;

        removals.push({
          pageId,
          sectionKey,
          fieldKey,
          langs,
          reason: dropByKey ? 'cle non textuelle' : 'valeur non textuelle',
          rootValueKept: typeof rootValue === 'string' ? rootValue.slice(0, 60) : '(absent)',
        });

        if (SHOULD_WRITE) delete i18n[fieldKey];
      }

      if (SHOULD_WRITE) {
        // Retire `_i18n` devenu vide plutot que de laisser un objet vide.
        if (Object.keys(i18n).length === 0) delete section._i18n;
      }
    }
  }

  if (SHOULD_WRITE && removals.length > 0) {
    db.updatedAt = new Date().toISOString();
    writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }

  console.log(
    removals.length === 0
      ? 'Aucun entree _i18n non textuelle detectee.'
      : `${removals.length} entree(s) _i18n a purger :`
  );
  for (const r of removals) {
    console.log(
      `  - ${r.pageId}.${r.sectionKey}._i18n.${r.fieldKey} [${r.langs.join(', ')}] (${r.reason}) — racine conservee : "${r.rootValueKept}"`
    );
  }

  if (!SHOULD_WRITE && removals.length > 0) {
    console.log('\nMode rapport. Relancer avec --write pour appliquer.');
  }
}

main();
