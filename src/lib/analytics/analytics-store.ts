import { getFirebaseAdmin } from '@/lib/firebase-admin';
import {
  ANALYTICS_ACTION_TYPES,
  ANALYTICS_EVENTS_COLLECTION,
  ANALYTICS_EVENT_TYPES,
  ANALYTICS_SESSIONS_COLLECTION,
  MAX_STRLEN,
  SID_RE,
  VID_RE,
} from '@/lib/analytics/constants';
import type { AnalyticsEventPayload, AnalyticsEventRecord, AnalyticsSessionSummary } from '@/lib/analytics/types';

function pickStr(value: unknown, max = MAX_STRLEN): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function pickOptionalStr(value: unknown, max = MAX_STRLEN): string | undefined {
  const s = pickStr(value, max);
  return s ?? undefined;
}

/** Classification de la source de trafic à partir du referrer et des UTM. */
export function classifySource(
  ref?: string,
  source?: string,
  medium?: string,
  campaign?: string
): { source: 'direct' | 'search' | 'social' | 'referral' | 'campaign' | 'other'; medium?: string; campaign?: string } {
  const utmSource = pickStr(source, 60);
  const utmMedium = pickStr(medium, 60);
  const utmCampaign = pickStr(campaign, 120) || utmSource;
  if (utmSource) {
    return { source: 'campaign', medium: utmMedium, campaign: utmCampaign };
  }
  const raw = ref || '';
  if (!raw) return { source: 'direct' };
  let host = '';
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    host = raw.toLowerCase();
  }
  const SEARCH = ['google', 'bing', 'duckduckgo', 'qwant', 'ecosia', 'yandex', 'baidu', 'startpage', 'search'];
  const SOCIAL = ['facebook', 'instagram', 'linkedin', 'x.com', 'twitter', 'youtube', 'tiktok', 'pinterest', 'reddit', 'whatsapp', 'wa.me', 't.me', 'telegram'];
  if (SEARCH.some((h) => host.includes(h))) return { source: 'search' };
  if (SOCIAL.some((h) => host.includes(h))) return { source: 'social' };
  return { source: 'referral' };
}

function cleanEventList(raw: unknown): AnalyticsEventPayload[] {
  if (!Array.isArray(raw)) return [];
  const out: AnalyticsEventPayload[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const ev = item as Record<string, unknown>;
    const type = ev.type;
    if (typeof type !== 'string' || !(ANALYTICS_EVENT_TYPES as readonly string[]).includes(type)) continue;
    const sid = pickStr(ev.sid, 80);
    if (!sid || !SID_RE.test(sid)) continue;
    const vid = pickOptionalStr(ev.vid, 80);
    if (vid && !VID_RE.test(vid)) continue;
    out.push({
      type: type as AnalyticsEventPayload['type'],
      sid,
      vid,
      path: pickStr(ev.path, 500),
      title: pickOptionalStr(ev.title, 200),
      ref: pickOptionalStr(ev.ref, 1000),
      source: pickOptionalStr(ev.source, 60),
      medium: pickOptionalStr(ev.medium, 60),
      campaign: pickOptionalStr(ev.campaign, 120),
      lang: pickOptionalStr(ev.lang, 16),
      device: pickOptionalStr(ev.device, 32),
      os: pickOptionalStr(ev.os, 32),
      browser: pickOptionalStr(ev.browser, 32),
      screen: pickOptionalStr(ev.screen, 32),
      productSlug: pickOptionalStr(ev.productSlug, 120),
      dwell: typeof ev.dwell === 'number' && ev.dwell > 0 && ev.dwell <= 36e5 ? Math.floor(ev.dwell) : undefined,
    });
  }
  return out;
}

function cleanPath(path?: string): string | undefined {
  if (!path) return undefined;
  // Normalise et retire la chaîne de requête / fragment pour agréger les pages.
  try {
    const url = new URL(path, 'https://pixiatech.com');
    return `${url.pathname.replace(/\/+$/, '') || '/'}${url.search ? `?${url.search.slice(1, 120)}` : ''}`;
  } catch {
    const cleaned = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    return cleaned;
  }
}

const PRODUCT_PATH_RE = /^\/web\/product\/([^/?#]+)$/;

function applyEventToSession(s: AnalyticsSessionSummary, ev: AnalyticsEventPayload, ts: number): void {
  s.updatedAt = ts;
  s.lastSeenAt = ts;
  s.vid = s.vid ?? ev.vid;

  if (!s.lang && ev.lang) s.lang = ev.lang;
  if (!s.device && ev.device) s.device = ev.device;
  if (!s.os && ev.os) s.os = ev.os;
  if (!s.browser && ev.browser) s.browser = ev.browser;
  if (!s.screen && ev.screen) s.screen = ev.screen;

  const path = cleanPath(ev.path);

  switch (ev.type) {
    case 'session_start': {
      if (!s.landingPath && path) s.landingPath = path;
      if (!s.lastPath && path) s.lastPath = path;
      break;
    }
    case 'page_view': {
      s.pageViews += 1;
      if (path) {
        s.lastPath = path;
        if (!s.landingPath) s.landingPath = path;
        s.pageCounts = s.pageCounts ?? {};
        s.pageCounts[path] = (s.pageCounts[path] ?? 0) + 1;
        s.lastN = s.lastN ?? [];
        if (s.lastN[s.lastN.length - 1] !== path) s.lastN.push(path);
        if (s.lastN.length > 8) s.lastN = s.lastN.slice(-8);
        if (ev.dwell && ev.dwell > 0) {
          s.dwell = s.dwell ?? {};
          const cur = s.dwell[path] ?? { n: 0, totalMs: 0 };
          cur.n += 1;
          cur.totalMs += ev.dwell;
          s.dwell[path] = cur;
        }
        const m = PRODUCT_PATH_RE.exec(path);
        if (m) {
          const slug = m[1];
          s.products = s.products ?? {};
          s.products[slug] = { ...(s.products[slug] ?? {}), views: (s.products[slug]?.views ?? 0) + 1 };
        }
      }
      break;
    }
    case 'product_click': {
      const slug = pickStr(ev.productSlug, 120);
      if (slug) {
        s.products = s.products ?? {};
        s.products[slug] = { ...(s.products[slug] ?? {}), clicks: (s.products[slug]?.clicks ?? 0) + 1 };
      }
      break;
    }
    default: {
      if ((ANALYTICS_ACTION_TYPES as readonly string[]).includes(ev.type)) {
        s.actions = s.actions ?? {};
        s.actions[ev.type] = (s.actions[ev.type] ?? 0) + 1;
      }
      break;
    }
  }
}

async function applyEventsToSession(evts: AnalyticsEventPayload[], country?: string): Promise<void> {
  const { adminDb } = getFirebaseAdmin();
  const sessionRef = adminDb.collection(ANALYTICS_SESSIONS_COLLECTION).doc(evts[0].sid);
  // Les événements arrivent éventuellement dans le désordre ; on applique la
  // source (session_start) en premier puis les autres par ordre chronologique.
  const sorted = [...evts].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  const first = sorted[0];
  const { source, medium, campaign } = classifySource(first?.ref, first?.source, first?.medium, first?.campaign);

  await adminDb.runTransaction(async (txn) => {
    const snap = await txn.get(sessionRef);
    let s = snap.exists ? (snap.data() as AnalyticsSessionSummary) : null;
    if (!s) {
      s = {
        sid: evts[0].sid,
        createdAt: sorted[0].ts ?? Date.now(),
        startedAt: sorted[0].ts ?? Date.now(),
        lastSeenAt: sorted[0].ts ?? Date.now(),
        pageViews: 0,
        source,
        medium,
        campaign,
        products: {},
        actions: {},
        updatedAt: sorted[0].ts ?? Date.now(),
      };
    }
    if (!s.country && country) s.country = country;
    for (const ev of sorted) {
      applyEventToSession(s, ev, ev.ts ?? Date.now());
    }
    txn.set(sessionRef, s, { merge: false });
  });
}

export interface AnalyticsIngestResult {
  accepted: number;
  dropped: number;
}

/**
 * Ingère un lot d'événements (envoi par sendBeacon/fetch keepalive depuis le tracker).
 * Écrit les événements bruts et met à jour l'agrégat de session via transaction.
 * N'accepte QUE des données anonymisées et déjà consenties.
 */
export async function ingestAnalyticsEvents(
  rawEvents: unknown,
  country?: string
): Promise<AnalyticsIngestResult> {
  const events = cleanEventList(rawEvents);
  if (events.length === 0) return { accepted: 0, dropped: 0 };

  const { adminDb } = getFirebaseAdmin();
  const eventsRef = adminDb.collection(ANALYTICS_EVENTS_COLLECTION);

  const bySid = new Map<string, AnalyticsEventPayload[]>();
  const ts = Date.now();
  for (const ev of events) {
    ev.ts = ts;
  }

  const writeEvent = (ev: AnalyticsEventPayload): Promise<unknown> =>
    eventsRef.add({ ...ev, ts, country } as AnalyticsEventRecord);

  try {
    await Promise.all(
      events.map(async (ev) => {
        await writeEvent(ev);
        const list = bySid.get(ev.sid);
        if (list) list.push(ev);
        else bySid.set(ev.sid, [ev]);
      })
    );
  } catch (err) {
    console.error('[analytics] erreur écriture événements bruts:', err);
  }

  await Promise.all(
    Array.from(bySid.values()).map((evts) =>
      applyEventsToSession(evts, country).catch((err) => {
        console.error('[analytics] erreur agrégat session:', err);
      })
    )
  );

  return { accepted: events.length, dropped: 0 };
}

export function normalizeCountry(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const c = raw.trim().toLowerCase().slice(0, 2);
  return /^[a-z]{2}$/.test(c) ? c : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lecture / agrégation (lecture admin uniquement, bornée par période).
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsFilter {
  product?: string;
  page?: string;
  country?: string;
  lang?: string;
  device?: string;
  source?: string;
}

export interface AnalyticsWindow {
  from: number;
  to: number;
}

export const ANALYTICS_MAX_DOCS = 25_000;
export const ANALYTICS_CLOSED_MS = 5 * 60_000;

function matchesFilter(s: AnalyticsSessionSummary, f?: AnalyticsFilter): boolean {
  if (!f) return true;
  if (f.source && s.source !== f.source) return false;
  if (f.country && s.country !== f.country) return false;
  if (f.lang && s.lang !== f.lang) return false;
  if (f.device && s.device !== f.device) return false;
  if (f.page && s.pageCounts && !s.pageCounts[f.page]) return false;
  if (f.product && s.products && !s.products[f.product]) return false;
  return true;
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function sumArray(values: Record<string, number> | undefined): number {
  if (!values) return 0;
  let total = 0;
  for (const k of Object.keys(values)) total += values[k] ?? 0;
  return total;
}

/** Agrégat global d'un fenêtre de sessions. */
export interface AnalyticsAggregate {
  sessions: number;
  uniqueVisitors: number;
  pageViews: number;
  productViews: number;
  distinctProducts: number;
  bounceRate: number;
  avgDurationMs: number;
  actions: Record<string, number>;
  bySource: Record<string, number>;
  byCountry: Record<string, { sessions: number; unique: number; pageViews: number }>;
  byLang: Record<string, number>;
  byDevice: Record<string, number>;
  byOs: Record<string, number>;
  byBrowser: Record<string, number>;
  byScreen: Record<string, number>;
  byDay: Record<string, { sessions: number; unique: number; pageViews: number; productViews: number }>;
  byHour: Record<string, number>;
  products: {
    slug: string;
    views: number;
    clicks: number;
    uniques: number;
    interestRate: number;
  }[];
  pages: {
    path: string;
    views: number;
    uniques: number;
    exits: number;
    avgDwellMs: number;
  }[];
}

export function aggregateSessions(docs: AnalyticsSessionSummary[], filter?: AnalyticsFilter): AnalyticsAggregate {
  const agg: AnalyticsAggregate = {
    sessions: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    productViews: 0,
    distinctProducts: 0,
    bounceRate: 0,
    avgDurationMs: 0,
    actions: {},
    bySource: {},
    byCountry: {},
    byLang: {},
    byDevice: {},
    byOs: {},
    byBrowser: {},
    byScreen: {},
    byDay: {},
    byHour: {},
    products: [],
    pages: [],
  };

  const vids = new Set<string>();
  const dayUnique = new Map<string, Set<string>>();
  const geoUnique = new Map<string, Set<string>>();
  const productsMap = new Map<string, { views: number; clicks: number; uniques: number }>();
  const pagesMap = new Map<string, { views: number; uniques: number; exits: number; n: number; totalMs: number }>();
  const durations: number[] = [];
  const closedNow = Date.now() - ANALYTICS_CLOSED_MS;

  for (const s of docs) {
    if (!matchesFilter(s, filter)) continue;
    agg.sessions += 1;
    if (s.vid) vids.add(s.vid);

    const views = s.pageViews ?? 0;
    agg.pageViews += views;
    if (views <= 1) agg.bounceRate += 1;

    if (s.lastSeenAt && s.startedAt && s.lastSeenAt <= closedNow) {
      durations.push(s.lastSeenAt - s.startedAt);
    }

    const where = dayKey(s.startedAt || s.createdAt || Date.now());
    const day = agg.byDay[where] ?? { sessions: 0, unique: 0, pageViews: 0, productViews: 0 };
    day.sessions += 1;
    day.pageViews += views;
    if (s.vid) {
      let uniq = dayUnique.get(where);
      if (!uniq) {
        uniq = new Set<string>();
        dayUnique.set(where, uniq);
      }
      if (!uniq.has(s.vid)) {
        uniq.add(s.vid);
        day.unique += 1;
      }
    }
    agg.byDay[where] = day;

    agg.bySource[s.source] = (agg.bySource[s.source] ?? 0) + 1;

    const country = s.country || 'zz';
    const geo = agg.byCountry[country] ?? { sessions: 0, unique: 0, pageViews: 0 };
    geo.sessions += 1;
    geo.pageViews += views;
    if (s.vid) {
      let uniq = geoUnique.get(country);
      if (!uniq) {
        uniq = new Set<string>();
        geoUnique.set(country, uniq);
      }
      if (!uniq.has(s.vid)) {
        uniq.add(s.vid);
        geo.unique += 1;
      }
    }
    agg.byCountry[country] = geo;

    if (s.lang) agg.byLang[s.lang] = (agg.byLang[s.lang] ?? 0) + 1;
    const device = s.device || 'unknown';
    agg.byDevice[device] = (agg.byDevice[device] ?? 0) + 1;
    if (s.os) agg.byOs[s.os] = (agg.byOs[s.os] ?? 0) + 1;
    if (s.browser) agg.byBrowser[s.browser] = (agg.byBrowser[s.browser] ?? 0) + 1;
    if (s.screen) agg.byScreen[s.screen] = (agg.byScreen[s.screen] ?? 0) + 1;

    const hour = new Date(s.startedAt || s.createdAt || Date.now()).getUTCHours();
    const hourKey = `${hour}:00`;
    agg.byHour[hourKey] = (agg.byHour[hourKey] ?? 0) + 1;

    for (const [slug, p] of Object.entries(s.products ?? {})) {
      const cur = productsMap.get(slug) ?? { views: 0, clicks: 0, uniques: 0 };
      cur.views += p.views ?? 0;
      cur.clicks += p.clicks ?? 0;
      if (s.vid) cur.uniques += 1;
      agg.productViews += p.views ?? 0;
      productsMap.set(slug, cur);
    }

    for (const path of Object.keys(s.pageCounts ?? {})) {
      const count = s.pageCounts?.[path] ?? 0;
      const cur = pagesMap.get(path) ?? { views: 0, uniques: 0, exits: 0, n: 0, totalMs: 0 };
      cur.views += count;
      if (s.vid) cur.uniques += 1;
      if (s.lastPath === path) cur.exits += 1;
      const d = s.dwell?.[path];
      if (d) {
        cur.n += d.n;
        cur.totalMs += d.totalMs;
      }
      pagesMap.set(path, cur);
    }

    for (const [k, v] of Object.entries(s.actions ?? {})) {
      agg.actions[k] = (agg.actions[k] ?? 0) + v;
    }
  }

  agg.uniqueVisitors = vids.size;
  agg.distinctProducts = productsMap.size;
  agg.bounceRate = agg.sessions > 0 ? agg.bounceRate / agg.sessions : 0;
  agg.avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  agg.products = Array.from(productsMap.entries())
    .map(([slug, p]) => ({
      slug,
      views: p.views,
      clicks: p.clicks,
      uniques: p.uniques,
      interestRate: p.views > 0 ? p.clicks / p.views : 0,
    }))
    .sort((a, b) => b.views - a.views);

  agg.pages = Array.from(pagesMap.entries())
    .map(([path, p]) => ({
      path,
      views: p.views,
      uniques: p.uniques,
      exits: p.exits,
      avgDwellMs: p.n > 0 ? Math.round(p.totalMs / p.n) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  return agg;
}

/** Lit toutes les sessions d'une période (bornée). */
export async function fetchSessionsInWindow(window: AnalyticsWindow): Promise<AnalyticsSessionSummary[]> {
  const { adminDb } = getFirebaseAdmin();
  const snap = await adminDb
    .collection(ANALYTICS_SESSIONS_COLLECTION)
    .where('startedAt', '>=', window.from)
    .where('startedAt', '<=', window.to)
    .orderBy('startedAt', 'asc')
    .limit(ANALYTICS_MAX_DOCS)
    .get();
  return snap.docs.map((d) => d.data() as AnalyticsSessionSummary);
}

export function filterSessions(docs: AnalyticsSessionSummary[], filter?: AnalyticsFilter): AnalyticsSessionSummary[] {
  return docs.filter((s) => matchesFilter(s, filter));
}

/** Comptage des conversions = demandes de contact enregistrées dans la période. */
export async function countConversions(window: AnalyticsWindow): Promise<number> {
  try {
    const { adminDb } = getFirebaseAdmin();
    const fromIso = new Date(window.from).toISOString();
    const toIso = new Date(window.to).toISOString();
    const snapshot = await adminDb
      .collection('siteWebMessages')
      .where('createdAt', '>=', fromIso)
      .where('createdAt', '<=', toIso)
      .select('createdAt')
      .get();
    return snapshot.size;
  } catch (err) {
    console.error('[analytics] comptage conversions:', err);
    return 0;
  }
}

/** Sessions actives (temps réel) : dernières 5 minutes. */
export async function fetchActiveSessions(): Promise<
  { sid: string; lastPath?: string; device?: string; country?: string; lang?: string; lastSeenAt: number }[]
> {
  const { adminDb } = getFirebaseAdmin();
  const now = Date.now();
  const snap = await adminDb
    .collection(ANALYTICS_SESSIONS_COLLECTION)
    .where('lastSeenAt', '>=', now - ANALYTICS_CLOSED_MS)
    .orderBy('lastSeenAt', 'desc')
    .limit(500)
    .get();
  return snap.docs.map((d) => {
    const s = d.data() as AnalyticsSessionSummary;
    return {
      sid: s.sid,
      lastPath: s.lastPath,
      device: s.device,
      country: s.country,
      lang: s.lang,
      lastSeenAt: s.lastSeenAt,
    };
  });
}

export interface AnalyticsWindows {
  current: AnalyticsAggregate;
  previous: AnalyticsAggregate;
  rawCurrent: AnalyticsSessionSummary[];
  rawPrevious: AnalyticsSessionSummary[];
}

/** Charge et agrège les deux fenêtres (courante + précédente) en parallèle. */
export async function loadWindows(q: {
  current: AnalyticsWindow;
  previous: AnalyticsWindow;
  filter?: AnalyticsFilter;
}): Promise<AnalyticsWindows> {
  const [curDocs, prevDocs] = await Promise.all([
    fetchSessionsInWindow(q.current),
    fetchSessionsInWindow(q.previous),
  ]);
  return {
    current: aggregateSessions(curDocs, q.filter),
    previous: aggregateSessions(prevDocs, q.filter),
    rawCurrent: curDocs,
    rawPrevious: prevDocs,
  };
}

/** Noms lisibles des produits (collections `site_web_products`, slug = id). */
export async function fetchProductNames(slugs: string[]): Promise<Record<string, string>> {
  const limited = Array.from(new Set(slugs)).slice(0, 300);
  const { adminDb } = getFirebaseAdmin();
  const results: Record<string, string> = {};
  await Promise.all(
    limited.map(async (slug) => {
      try {
        const d = await adminDb.collection('site_web_products').doc(slug).get();
        const data = d.data();
        if (data && typeof data.name === 'string' && data.name) results[slug] = data.name;
      } catch {
        /* document inexistant ou lecture refusée — on garde le slug */
      }
    })
  );
  return results;
}

/** Chemins précédent/suivant autour d'une page, depuis les séquences de session. */
export function computeNeighbors(
  path: string,
  docs: AnalyticsSessionSummary[]
): { prev: Record<string, number>; next: Record<string, number> } {
  const prev: Record<string, number> = {};
  const next: Record<string, number> = {};
  for (const s of docs) {
    const seq = s.lastN ?? [];
    for (let i = 0; i < seq.length; i++) {
      if (seq[i] !== path) continue;
      if (i > 0) prev[seq[i - 1]] = (prev[seq[i - 1]] ?? 0) + 1;
      if (i < seq.length - 1) next[seq[i + 1]] = (next[seq[i + 1]] ?? 0) + 1;
    }
  }
  return { prev, next };
}