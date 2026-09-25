// ============================================================================
// Méga-menu — normalisation stricte (Phase E)
// Le menu ne référence les produits que par catalogSlug/productSlug. Aucune
// donnée produit (name, description, image, specs…) ne doit y être stockée :
// le payload est réduit à une liste blanche de clés et rejeté sinon.
// ============================================================================

import { isValidSlug, type MegaMenu, type MegaMenuItem, type MegaMenuColumn } from './types';

const ALLOWED_MENU_KEYS = ['columns', 'updatedAt'];
const ALLOWED_COLUMN_KEYS = ['id', 'titleEn', 'titleFr', 'items'];
const ALLOWED_ITEM_KEYS = ['id', 'label', 'catalogSlug', 'productSlug', 'visible'];
const PRODUCT_DATA_HINT =
  'Seules les références (catalogSlug / productSlug) sont admises — aucune donnée produit dans le menu.';

export const MAX_COLUMNS = 12;
export const MAX_ITEMS_PER_COLUMN = 60;

export function generateId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}-${rand}`;
}

export function emptyMegaMenu(): MegaMenu {
  return {
    columns: [
      {
        id: generateId('col'),
        titleEn: 'NEW COLUMN',
        titleFr: 'NOUVELLE COLONNE',
        items: [],
      },
    ],
  };
}

function str(value: unknown, label: string, required: boolean): string {
  if (value == null) {
    if (required) throw new Error(`${label} requis.`);
    return '';
  }
  if (typeof value !== 'string') throw new Error(`${label} invalide (texte attendu).`);
  return value.trim();
}

/** Convertit une valeur en slug nullable ; `''`/`null` → null. */
function slugOrNull(value: unknown, label: string): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${label} invalide (texte attendu).`);
  const slug = value.trim();
  if (!slug) return null;
  if (!isValidSlug(slug)) {
    throw new Error(`${label} invalide : « ${slug} » (uniquement lettres, chiffres, tirets).`);
  }
  return slug;
}

function sanitizeItem(raw: unknown, columnLabel: string, index: number): MegaMenuItem {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${columnLabel} : élément ${index + 1} invalide.`);
  }
  const item = raw as Record<string, unknown>;
  for (const key of Object.keys(item)) {
    if (!ALLOWED_ITEM_KEYS.includes(key)) {
      throw new Error(
        `${columnLabel} : l'élément « ${item.label ?? index + 1} » contient la clé « ${key} » non autorisée. ${PRODUCT_DATA_HINT}`
      );
    }
  }
  const productSlug = slugOrNull(item.productSlug, `${columnLabel} : productSlug « ${item.label ?? index + 1} »`);
  const catalogSlug = slugOrNull(item.catalogSlug, `${columnLabel} : catalogSlug « ${item.label ?? index + 1} »`);
  const label = str(item.label, `${columnLabel} : label`, false);
  const id =
    typeof item.id === 'string' && item.id.trim() ? item.id.trim() : generateId('item');
  const parsed: MegaMenuItem = {
    id,
    label,
    productSlug: productSlug ?? null,
    catalogSlug: catalogSlug ?? null,
  };
  if (typeof item.visible === 'boolean') parsed.visible = item.visible;
  return parsed;
}

function sanitizeColumn(raw: unknown, index: number): MegaMenuColumn {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Colonne ${index + 1} invalide (objet attendu).`);
  }
  const col = raw as Record<string, unknown>;
  for (const key of Object.keys(col)) {
    if (!ALLOWED_COLUMN_KEYS.includes(key)) {
      throw new Error(`Colonne ${index + 1} : clé « ${key} » non autorisée. ${PRODUCT_DATA_HINT}`);
    }
  }
  const id =
    typeof col.id === 'string' && col.id.trim() ? col.id.trim() : generateId('col');
  const columnLabel = `Colonne « ${id} »`;
  const itemsRaw = Array.isArray(col.items) ? col.items : [];
  if (itemsRaw.length > MAX_ITEMS_PER_COLUMN) {
    throw new Error(`${columnLabel} : trop d'éléments (max ${MAX_ITEMS_PER_COLUMN}).`);
  }
  const items = itemsRaw.map((rawItem, i) => sanitizeItem(rawItem, columnLabel, i));
  const seen = new Set<string>();
  const uniqueItems = items.map((it) => {
    let idOut = it.id;
    while (seen.has(idOut)) {
      idOut = `${it.id}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seen.add(idOut);
    return { ...it, id: idOut };
  });
  return {
    id,
    titleEn: str(col.titleEn, `${columnLabel} : titleEn`, false),
    titleFr: str(col.titleFr, `${columnLabel} : titleFr`, false),
    items: uniqueItems,
  };
}

/**
 * Valide et normalise un payload de méga-menu. Jette une Error si le payload
 * est invalide ou contient des données produit embarquées.
 */
export function sanitizeMegaMenu(payload: unknown): MegaMenu {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload invalide : un objet méga-menu est attendu.');
  }
  const raw = payload as Record<string, unknown>;
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_MENU_KEYS.includes(key)) {
      throw new Error(`Méga-menu : clé « ${key} » non autorisée. ${PRODUCT_DATA_HINT}`);
    }
  }
  const columnsRaw = raw.columns;
  if (!Array.isArray(columnsRaw)) {
    throw new Error('Méga-menu invalide : « columns » doit être un tableau.');
  }
  if (columnsRaw.length > MAX_COLUMNS) {
    throw new Error(`Méga-menu invalide : trop de colonnes (max ${MAX_COLUMNS}).`);
  }
  return { columns: columnsRaw.map((rawCol, i) => sanitizeColumn(rawCol, i)) };
}

/** Récap pour la boîte de confirmation de réinitialisation. */
export function menuSummary(menu: MegaMenu): { columns: number; items: number } {
  const items = menu.columns.reduce((acc, col) => acc + col.items.length, 0);
  return { columns: menu.columns.length, items };
}