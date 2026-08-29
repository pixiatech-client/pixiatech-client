// Tests de la règle métier « statut déterminé par stockQuantity uniquement ».
// Exécution : node scripts/product-status.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  getProductStatus,
  normalizeStockQuantity,
  isProductInStock,
  isProductOutOfStockForSale,
  getSaleBlockReason,
} from '../src/lib/product-status.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Produit stock 0 -> Rupture ; 5. stock 10 -> En vente
test('1/5. statut selon stockQuantity', () => {
  assert.equal(getProductStatus(0), 'out_of_stock');
  assert.equal(getProductStatus(-5), 'out_of_stock');
  assert.equal(getProductStatus(10), 'sale');
});

test('normalizeStockQuantity : fail-closed & arrondi', () => {
  assert.equal(normalizeStockQuantity(0), 0);
  assert.equal(normalizeStockQuantity(10), 10);
  assert.equal(normalizeStockQuantity(undefined), 0);
  assert.equal(normalizeStockQuantity(null), 0);
  assert.equal(normalizeStockQuantity('5'), 5);
  assert.equal(normalizeStockQuantity('abc'), 0);
  assert.equal(normalizeStockQuantity(3.9), 3);
});

// 8. stock 10 -> 0 : rupture ; 9. stock 0 -> 10 : en vente
test('8/9. transition de stock (10->0, 0->10)', () => {
  assert.equal(isProductInStock(10), true);
  assert.equal(isProductInStock(0), false);
  assert.equal(isProductOutOfStockForSale({ stock: 10, availableFor: ['sale'] }), false);
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['sale'] }), true);
});

// 1/2/3. Rupture persistante : favoris & sélection ne changent jamais le statut
// (les fonctions de statut sont pures : aucun paramètre favoris, elles ne mutent rien).
test('2/3. statut rupture inchangé par favoris/sélection (fonctions pures)', () => {
  const rupture = { stock: 0, availableFor: ['sale'] };
  assert.equal(isProductOutOfStockForSale(rupture), true);
  // Re-évaluation après simulation d'actions panier/favoris (aucune écriture) :
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['sale'], favorited: true }), true);
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['sale'], selectedFromFavs: true }), true);
});

// 6/7. Produit stock 10 : reste en vente après favoris / ajout panier
test('6/7. statut vente inchangé par favoris/panier', () => {
  assert.equal(isProductOutOfStockForSale({ stock: 10, availableFor: ['sale'] }), false);
  assert.equal(isProductOutOfStockForSale({ stock: 10, availableFor: ['sale'], inCart: 3 }), false);
});

// 4. Ajout panier produit en rupture -> bloqué (prédicat serveur).
test('4. blocage serveur : vente directe refusée si stock <= 0', () => {
  assert.equal(getSaleBlockReason({ stock: 0, availableFor: ['sale'] }), 'Produit en rupture de stock');
  assert.equal(getSaleBlockReason({ availableFor: ['sale'] }), 'Produit en rupture de stock');
  assert.equal(getSaleBlockReason({ stock: 10, availableFor: ['sale'] }), '');
  assert.equal(getSaleBlockReason({ stock: 0, availableFor: ['sale', 'rental'] }), 'Produit en rupture de stock');
});

// Exceptions : sur-commande / rental-only ne sont pas des ventes directes.
test('exceptions sur-commande & location', () => {
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['sur-commande'] }), false);
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['quoteOnly'] }), false);
  assert.equal(isProductOutOfStockForSale({ stock: 0, availableFor: ['rental'] }), false);
});

// 10. Aucune action panier/favoris n'écrit status/stockQuantity sur le produit.
test('10. structural : panier & favoris (CartContext) n\'écrivent jamais de produit', () => {
  const cartSrc = readFileSync(path.join(__dirname, '../src/contexts/CartContext.tsx'), 'utf8');
  for (const forbidden of ['setDoc(', 'updateDoc(', 'addDoc(', 'stockQuantity', 'status:']) {
    assert.ok(!cartSrc.includes(forbidden), `CartContext ne doit pas contenir "${forbidden}"`);
  }
  assert.ok(!cartSrc.includes('"status"') && !cartSrc.includes("'status'"), 'CartContext ne doit pas contenir de champ status');
});