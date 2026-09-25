// ============================================================================
// Seed idempotent des catégories produits (taxonomie du CMS)
//
//   node scripts/seed-product-categories.mjs
//
// Règles :
//  - Ne crée JAMAIS un doublon : matching par (slug, type) sur les docs
//    existants de la collection `product_categories`.
//  - Le slug généré reproduit `slugify()` de src/lib/products/types.ts pour
//    garantir que les filtres legacy (libellés → slugs) résolvent bien.
//  - Si une catégorie existe déjà, on met à jour name/order/active mais on
//    conserve son ID (les produits y référencent par ID : aucun changement).
// ============================================================================

import { initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

const KEY_FILE = resolve(__dirname, '..', 'serviceAccountKey.json');
const ADC_FILE =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  resolve(homedir(), '.config', 'pixiatech', 'adc-pixiatech.json');

process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || ADC_FILE;

function initApp() {
  if (existsSync(KEY_FILE)) {
    const serviceAccount = JSON.parse(readFileSync(KEY_FILE, 'utf-8'));
    console.log('[seed] Utilisation de serviceAccountKey.json');
    return initializeApp({ credential: cert(serviceAccount) });
  }
  if (existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.log(`[seed] Utilisation des ADC (${process.env.GOOGLE_APPLICATION_CREDENTIALS})`);
    return initializeApp({ projectId: 'pixiatech-client' });
  }
  throw new Error('Aucun service account ni ADC trouvés (serviceAccountKey.json ou GOOGLE_APPLICATION_CREDENTIALS).');
}

const db = getFirestore(initApp());
const COLLECTION = 'product_categories';
const GROUP_COLLECTION = 'product_category_groups';

/** Reproduit slugify() de src/lib/products/types.ts. */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const SEED = [
  { name: 'Indoor', nameFr: 'Intérieur', type: 'environment', order: 1, active: true },
  { name: 'Outdoor', nameFr: 'Extérieur', type: 'environment', order: 2, active: true },
  { name: 'Corporate', nameFr: 'Entreprise', type: 'application', order: 1, active: true },
  { name: 'Retail', nameFr: 'Commerce', type: 'application', order: 2, active: true },
  { name: 'DOOH', type: 'application', order: 3, active: true },
  { name: 'Rental', nameFr: 'Location', type: 'application', order: 4, active: true },
  { name: 'Sports', type: 'application', order: 5, active: true },
  { name: 'XR / VP', type: 'application', order: 6, active: true },
  { name: 'Control Room', nameFr: 'Salle de contrôle', type: 'application', order: 7, active: true },
  { name: 'Creative', nameFr: 'Créatif', type: 'application', order: 8, active: true },
  { name: 'Kinetic', type: 'application', order: 9, active: true },
  { name: 'Transparent', type: 'application', order: 10, active: true },
].map((c) => ({ ...c, slug: slugify(c.name) }));

function newCategoryId() {
  return `cat_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function newGroupId() {
  return `grp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const GROUP_SEED = [
  { key: 'environment', label: 'Environment', labelFr: 'Environnement', order: 1 },
  { key: 'application', label: 'Application', labelFr: 'Application', order: 2 },
];

/** Groupes de filtres : write-if-absent (la clé `key` est l'identifiant stable
 *  référencé par `ProductCategory.type` — la renommer casserait les liens). */
async function seedGroups() {
  const snap = await db.collection(GROUP_COLLECTION).get();
  const existingByKey = new Map(snap.docs.map((d) => [(d.data() || {}).key, d.id]));
  let groupsCreated = 0;
  let groupsUnchanged = 0;
  const now = new Date().toISOString();

  for (const seed of GROUP_SEED) {
    const existingId = existingByKey.get(seed.key);
    if (existingId) {
      groupsUnchanged++;
      console.log(`  = groupe ${seed.key} (${seed.label}) -> existant (${existingId})`);
    } else {
      const id = newGroupId();
      await db.collection(GROUP_COLLECTION).doc(id).set({
        id,
        key: seed.key,
        label: seed.label,
        labelFr: seed.labelFr,
        active: true,
        order: seed.order,
        createdAt: now,
        updatedAt: now,
      });
      groupsCreated++;
      console.log(`  + groupe ${seed.key} (${seed.label}) -> créé (${id})`);
    }
  }
  return { groupsCreated, groupsUnchanged };
}

async function main() {
  const { groupsCreated, groupsUnchanged } = await seedGroups();

  const snap = await db.collection(COLLECTION).get();
  const existing = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const byKey = new Map(existing.map((d) => [`${d.slug}|${d.type}`, d.id]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let backfilled = 0;

  for (const seed of SEED) {
    const key = `${seed.slug}|${seed.type}`;
    const existingId = byKey.get(key);
    const now = new Date().toISOString();

    if (existingId) {
      const cur = existing.find((d) => d.id === existingId);
      const same =
        cur.name === seed.name &&
        cur.order === seed.order &&
        cur.active === seed.active;
      // Libellés localisés : backfill UNIQUEMENT si le champ est absent —
      // ne jamais écraser une traduction saisie dans l'admin.
      const i18nPatch = {};
      if (seed.nameFr && cur.nameFr == null) i18nPatch.nameFr = seed.nameFr;
      if (seed.nameEn && cur.nameEn == null) i18nPatch.nameEn = seed.nameEn;
      if (!same || Object.keys(i18nPatch).length > 0) {
        await db.collection(COLLECTION).doc(existingId).update({
          name: seed.name,
          order: seed.order,
          active: seed.active,
          updatedAt: now,
          ...i18nPatch,
        });
        if (!same && Object.keys(i18nPatch).length > 0) {
          updated++;
          console.log(`  ~ ${seed.name} (${seed.slug}) -> mise à jour + libellé(s) localisé(s) (id ${existingId})`);
        } else if (!same) {
          updated++;
          console.log(`  ~ ${seed.name} (${seed.slug}) -> mise à jour (id ${existingId})`);
        } else {
          backfilled++;
          console.log(`  +i18n ${seed.name} (${seed.slug}) -> libellé FR ajouté (id ${existingId})`);
        }
      } else {
        unchanged++;
        console.log(`  = ${seed.name} (${seed.slug}) -> inchangé`);
      }
    } else {
      const id = newCategoryId();
      await db.collection(COLLECTION).doc(id).set({
        id,
        name: seed.name,
        slug: seed.slug,
        type: seed.type,
        active: seed.active,
        order: seed.order,
        createdAt: now,
        updatedAt: now,
      });
      created++;
      console.log(`  + ${seed.name} (${seed.slug}) -> créée (${id})`);
    }
  }

  console.log(
    `\nGroupes de filtres : ${groupsCreated} créé(s), ${groupsUnchanged} inchangé(s).` +
      `\nCatégories : ${created} créée(s), ${updated} mise(s) à jour, ${backfilled} backfill i18n, ${unchanged} inchangée(s).`
  );

  if (groupsCreated > 0) {
    console.log(
      '\nLes groupes de filtres (product_category_groups) ont été initialisés avec les clés stables `environment` et `application`.'
    );
  }
}

main().catch((err) => {
  console.error('Échec du seed :', err);
  process.exit(1);
});