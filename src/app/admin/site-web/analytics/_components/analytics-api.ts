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

export function seedAnalyticsData(): Promise<{ sessions: number; messages: number }> {
  return postJson<{ sessions: number; messages: number }>(`/api/analytics/seed`);
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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const data = (await res.json()) as T & { success?: boolean; message?: string; error?: string };
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'Erreur lors du chargement des données.');
  }
  return data as T;
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