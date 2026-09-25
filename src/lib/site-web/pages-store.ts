import fs from 'fs';
import path from 'path';
import { DEFAULT_CMS_SETTINGS, type CmsBackendSettings, type CmsDb, type CmsPageData } from './cms-types';

const DATA_FILE = path.join(process.cwd(), 'data', 'pixel-tech-web-pages.json');

function emptyDb(): CmsDb {
  return { pages: {} };
}

export function readCmsDb(): CmsDb {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CmsDb>;
    if (!parsed || typeof parsed !== 'object') return emptyDb();
    return {
      pages: parsed.pages && typeof parsed.pages === 'object' ? parsed.pages : {},
      settings: parsed.settings || undefined,
    } as CmsDb;
  } catch (err) {
    console.error('[site-web pages-store] Error reading CMS database:', err);
    return emptyDb();
  }
}

export function writeCmsDb(db: CmsDb): boolean {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[site-web pages-store] Error writing CMS database:', err);
    return false;
  }
}

export function getCmsPages(): Record<string, CmsPageData> {
  return readCmsDb().pages || {};
}

export function getCmsPage(pageId: string): CmsPageData | null {
  return getCmsPages()[pageId] || null;
}

export function saveCmsPage(pageId: string, page: CmsPageData): CmsDb {
  const db = readCmsDb();
  const existing = db.pages?.[pageId] || null;
  const merged: CmsPageData = {
    ...(existing || {}),
    ...page,
    id: pageId,
    updatedAt: new Date().toISOString(),
  };
  const next: CmsDb = {
    ...db,
    pages: { ...(db.pages || {}), [pageId]: merged },
    updatedAt: new Date().toISOString(),
  };
  writeCmsDb(next);
  return next;
}

export function getCmsSettings(): CmsBackendSettings {
  const db = readCmsDb();
  // Convention héritée de site/: settings vivaient aussi sous pages.contact.settings
  const legacy = db.pages?.contact && (db.pages.contact.sections as Record<string, unknown> | undefined)?.settings as CmsBackendSettings | undefined;
  return { ...DEFAULT_CMS_SETTINGS, ...(db.settings || {}), ...(legacy || {}) };
}

export function saveCmsSettings(partial: Partial<CmsBackendSettings>): CmsBackendSettings {
  const db = readCmsDb();
  const merged: CmsBackendSettings = { ...getCmsSettings(), ...partial };
  const next: CmsDb = { ...db, settings: merged, updatedAt: new Date().toISOString() };
  writeCmsDb(next);
  return merged;
}

export function resetCmsPages(): CmsDb {
  const next: CmsDb = { pages: {} };
  writeCmsDb(next);
  return next;
}

export function deleteCmsPage(pageId: string): CmsDb {
  const db = readCmsDb();
  if (!db.pages) return db;
  const next: CmsDb = {
    ...db,
    pages: Object.fromEntries(Object.entries(db.pages).filter(([id]) => id !== pageId)),
    updatedAt: new Date().toISOString(),
  };
  writeCmsDb(next);
  return next;
}
