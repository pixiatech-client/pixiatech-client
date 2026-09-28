import type {
  AnalyticsFilter,
  BehaviorResponse,
  DevicesResponse,
  GeoResponse,
  LanguagesResponse,
  OverviewResponse,
  ProductDetailResponse,
  ProductsResponse,
  RealtimeResponse,
  SourcesResponse,
} from './analytics-types';

// ---------------------------------------------------------------------------
// In-memory SWR cache — avoids refetching on tab focus / filter bounce
// ---------------------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  promise: Promise<T>;
}

const STALE_MS = 30_000;   // serve from cache if <30 s old
const TTL_MS  = 5 * 60_000; // evict after 5 min

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): { data: T; stale: boolean } | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  const age = Date.now() - entry.fetchedAt;
  if (age > TTL_MS) { cache.delete(key); return null; }
  return { data: entry.data, stale: age > STALE_MS };
}

function setCache<T>(key: string, data: T, promise: Promise<T>): void {
  cache.set(key, { data, fetchedAt: Date.now(), promise } as CacheEntry<unknown>);
}

/** Call to wipe the cache when the user manually resets data */
export function invalidateAnalyticsCache(): void {
  cache.clear();
}

function buildQuery(from: number, to: number, filter: AnalyticsFilter): string {
  const params = new URLSearchParams({
    from: String(from),
    to: String(to),
  });
  if (filter.source) params.set('source', filter.source);
  if (filter.country) params.set('country', filter.country);
  if (filter.lang) params.set('lang', filter.lang);
  if (filter.device) params.set('device', filter.device);
  if (filter.product) params.set('product', filter.product);
  if (filter.page) params.set('page', filter.page);
  return params.toString();
}

async function postJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST', credentials: 'include' });
  const data = (await res.json()) as T & { success?: boolean; message?: string; error?: string };
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'Erreur lors de l’opération.');
  }
  return data as T;
}

export function resetAnalyticsData(): Promise<{
  sessionsDeleted: number;
  eventsDeleted: number;
  seedMessagesDeleted: number;
}> {
  return postJson<{ sessionsDeleted: number; eventsDeleted: number; seedMessagesDeleted: number }>(
    `/api/analytics/reset`
  );
}

async function fetchRemote<T>(url: string): Promise<T> {
  // Allow browser to use its own HTTP cache; server sets cache-control headers
  const res = await fetch(url, { credentials: 'include' });
  const data = (await res.json()) as T & { success?: boolean; message?: string; error?: string };
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'Erreur lors du chargement des données.');
  }
  return data as T;
}

/**
 * SWR-aware fetch:
 *  - Returns cached data immediately if fresh (<30 s)
 *  - Returns cached data immediately + revalidates in background if stale
 *  - Deduplicates in-flight requests
 */
async function getJson<T>(url: string): Promise<T> {
  const hit = getCached<T>(url);

  if (hit && !hit.stale) {
    // Fresh — return immediately
    return hit.data;
  }

  // Check if there's already an in-flight promise (dedup)
  const existing = cache.get(url) as CacheEntry<T> | undefined;
  if (existing?.promise && !hit) {
    return existing.promise;
  }

  const promise = fetchRemote<T>(url).then((data) => {
    setCache(url, data, promise);
    return data;
  });

  if (hit?.stale) {
    // Stale: return old data immediately, revalidate in background
    // Store promise so concurrent callers deduplicate
    cache.set(url, { ...(cache.get(url) as CacheEntry<unknown>), promise } as CacheEntry<unknown>);
    void promise; // fire and forget
    return hit.data;
  }

  // No cache hit — await the promise
  setCache(url, await promise, promise);
  return (cache.get(url) as CacheEntry<T>).data;
}

export function fetchOverview(from: number, to: number, filter: AnalyticsFilter): Promise<OverviewResponse> {
  return getJson<OverviewResponse>(`/api/analytics/overview?${buildQuery(from, to, filter)}`);
}

export function fetchProducts(from: number, to: number, filter: AnalyticsFilter): Promise<ProductsResponse> {
  return getJson<ProductsResponse>(`/api/analytics/products?limit=100&${buildQuery(from, to, filter)}`);
}

export function fetchPages(from: number, to: number, filter: AnalyticsFilter): Promise<ProductsResponse> {
  return getJson<ProductsResponse>(`/api/analytics/pages?limit=100&${buildQuery(from, to, filter)}`);
}

export function fetchSources(from: number, to: number, filter: AnalyticsFilter): Promise<SourcesResponse> {
  return getJson<SourcesResponse>(`/api/analytics/sources?${buildQuery(from, to, filter)}`);
}

export function fetchGeo(from: number, to: number, filter: AnalyticsFilter): Promise<GeoResponse> {
  return getJson<GeoResponse>(`/api/analytics/geo?${buildQuery(from, to, filter)}`);
}

export function fetchLanguages(from: number, to: number, filter: AnalyticsFilter): Promise<LanguagesResponse> {
  return getJson<LanguagesResponse>(`/api/analytics/languages?${buildQuery(from, to, filter)}`);
}

export function fetchDevices(from: number, to: number, filter: AnalyticsFilter): Promise<DevicesResponse> {
  return getJson<DevicesResponse>(`/api/analytics/devices?${buildQuery(from, to, filter)}`);
}

export function fetchBehavior(from: number, to: number, filter: AnalyticsFilter): Promise<BehaviorResponse> {
  return getJson<BehaviorResponse>(`/api/analytics/behavior?${buildQuery(from, to, filter)}`);
}

export function fetchProductDetail(
  slug: string,
  from: number,
  to: number,
  filter: AnalyticsFilter
): Promise<ProductDetailResponse> {
  return getJson<ProductDetailResponse>(`/api/analytics/product/${encodeURIComponent(slug)}?${buildQuery(from, to, filter)}`);
}

export function fetchRealtime(): Promise<RealtimeResponse> {
  return getJson<RealtimeResponse>(`/api/analytics/realtime`);
}

export async function downloadVisitorsCsv(from: number, to: number, filter: AnalyticsFilter): Promise<void> {
  const res = await fetch(`/api/analytics/export?${buildQuery(from, to, filter)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || 'Impossible d’exporter les visiteurs.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pixiatech_visitors_${from}_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}