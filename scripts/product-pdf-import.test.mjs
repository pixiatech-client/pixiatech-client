// Tests de la fusion « caractéristique existante → variante absente » lors de
// l'import PDF. Exécution : node scripts/product-pdf-import.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVariantText,
  mergeVariantValues,
  ensureCharacteristicVariant,
} from '../src/lib/characteristic-variants.ts';

// BASE — caractéristique « Puissance » avec variantes existantes
const PUISSANCE = {
  options: ['3000', '3500', '4500'],
  variants: [
    { id: '1', value: '3000' },
    { id: '2', value: '3500' },
    { id: '3', value: '4500' },
  ],
};

// Cas 1 — Caractéristique inexistante (pas encore en base) : la valeur est créée.
test('CAS 1. caractéristique inexistante -> variante créée', () => {
  const r = ensureCharacteristicVariant({}, '4000');
  assert.equal(r.changed, true);
  assert.deepEqual(r.options, ['4000']);
  assert.equal(r.variants.length, 1);
  assert.equal(r.variants[0].value, '4000');
});

// Cas 2 — Caractéristique existante, variante déjà présente : rien n'est créé.
test('CAS 2. variante existante -> aucune modification', () => {
  const r = mergeVariantValues(PUISSANCE, ['3500']);
  assert.equal(r.changed, false);
  assert.deepEqual(r.options, ['3000', '3500', '4500']);
  assert.equal(r.variants.length, 3);
});

// Cas 3 — Caractéristique existante, variante absente : ajout en fin + conservation.
test('CAS 3. variante absente -> 4000 ajouté, 3000/3500/4500 conservés', () => {
  const r = mergeVariantValues(PUISSANCE, ['4000']);
  assert.equal(r.changed, true);
  assert.deepEqual(r.options, ['3000', '3500', '4500', '4000']);
  assert.equal(r.variants.length, 4);
  assert.equal(r.variants[3].value, '4000');
});

// Cas 4 — Plusieurs caractéristiques/valeurs mélangées : réutiliser, ajouter seulement ce qui manque.
test('CAS 4. plusieurs variantes (existantes + absentes) -> ajout uniquement', () => {
  const r = mergeVariantValues(PUISSANCE, ['3500', '4000', '230V']);
  assert.equal(r.changed, true);
  assert.deepEqual(r.options, ['3000', '3500', '4500', '4000', '230V']);
  assert.equal(r.variants.length, 5);
});

// Cas 5 — Relancer deux fois le même import : aucune duplication.
test('CAS 5. ré-import -> idempotent, aucune duplication', () => {
  const first = mergeVariantValues(PUISSANCE, ['4000']);
  const second = mergeVariantValues(first, ['4000']);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.options, ['3000', '3500', '4500', '4000']);
  assert.equal(second.variants.length, 4);
});

// Déduplication de formatage — « 4000 » vs « 4000  », casse, accents.
test('déduplication de formatage (espaces, casse, accents)', () => {
  assert.equal(normalizeVariantText('4000'), normalizeVariantText('4000 '));
  assert.equal(normalizeVariantText('P2.5'), normalizeVariantText('p2.5'));
  assert.equal(normalizeVariantText('Système'), normalizeVariantText('Systeme'));

  const withTrailing = ensureCharacteristicVariant({ options: ['4000'] }, '4000 ');
  assert.equal(withTrailing.changed, false);

  const caseInsensitive = ensureCharacteristicVariant({ options: ['A+'] }, 'a+');
  assert.equal(caseInsensitive.changed, false);
});

// Les variants existants (avec id/value) sont conservés tels quels.
test('les variants existants sont conservés sans écrasement', () => {
  const r = mergeVariantValues(PUISSANCE, ['4000']);
  assert.ok(r.variants[0].id === '1' && r.variants[0].value === '3000');
  assert.ok(r.variants[1].value === '3500');
  assert.ok(r.variants[2].value === '4500');
});

// Caractéristique avec variants mais sans `options` -> options dérivées correctement.
test('options dérivées depuis variants si `options` absent', () => {
  const char = { variants: [{ id: 'a', value: '3000' }, { id: 'b', value: '3500' }] };
  const r = mergeVariantValues(char, ['4000']);
  assert.equal(r.changed, true);
  assert.deepEqual(r.options, ['3000', '3500', '4000']);
  assert.equal(r.variants.length, 3);
});