import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import {
  loadWindows,
  aggregateSessions,
  computeNeighbors,
  fetchProductNames,
  ANALYTICS_CLOSED_MS,
} from '@/lib/analytics/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { slug } = await params;
    const safeSlug = decodeURIComponent(slug).slice(0, 120);
    const q = parseAnalyticsQuery(request);
    const productFilter = { ...q.filter, product: safeSlug };
    const windows = await loadWindows({ current: q.current, previous: q.previous, filter: productFilter });

    const aggregate = aggregateSessions(windows.rawCurrent, productFilter);
    const product = aggregate.products.find((p) => p.slug === safeSlug) ?? {
      slug: safeSlug,
      views: 0,
      clicks: 0,
      uniques: 0,
      interestRate: 0,
    };

    const neighbors = computeNeighbors(`/web/product/${safeSlug}`, windows.rawCurrent);

    const names = await fetchProductNames(Object.keys(neighbors.prev).concat(Object.keys(neighbors.next)));
    const productName = (await fetchProductNames([safeSlug]))[safeSlug] ?? safeSlug;

    const closedNow = Date.now() - ANALYTICS_CLOSED_MS;
    const durations: number[] = [];
    const vids = new Set<string>();
    for (const s of windows.rawCurrent) {
      if (!s.products || !s.products[safeSlug]) continue;
      if (s.vid) vids.add(s.vid);
      if (s.lastSeenAt && s.startedAt && s.lastSeenAt <= closedNow) durations.push(s.lastSeenAt - s.startedAt);
    }

    return NextResponse.json({
      success: true,
      slug: safeSlug,
      name: productName,
      product,
      wc: windows.current,
      wp: windows.previous,
      prevViews: windows.previous.products.find((p) => p.slug === safeSlug)?.views ?? 0,
      avgSessionMs: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      uniqueVisitors: vids.size,
      sources: windows.current.bySource,
      countries: windows.current.byCountry,
      langs: windows.current.byLang,
      devices: windows.current.byDevice,
      neighbors: {
        prev: topMap(neighbors.prev).map((e) => ({ path: e.key, count: e.count, name: names[e.key] ?? e.key })),
        next: topMap(neighbors.next).map((e) => ({ path: e.key, count: e.count, name: names[e.key] ?? e.key })),
      },
      series: buildSeries(windows.rawCurrent, safeSlug, q.current),
      treated: windows.rawCurrent.length,
      window: q.current,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

function topMap(map: Record<string, number>): { key: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ key, count }));
}

function buildSeries(
  docs: { startedAt?: number; lastSeenAt?: number; products?: Record<string, { views?: number; clicks?: number }> }[],
  slug: string,
  window: { from: number; to: number }
): { day: string; views: number; clicks: number; sessions: number }[] {
  const series: Record<string, { views: number; clicks: number; sessions: number }> = {};
  const current = new Date(window.from).toISOString().slice(0, 10);
  const end = new Date(window.to).toISOString().slice(0, 10);
  let cursor = current;
  while (cursor <= end) {
    series[cursor] = { views: 0, clicks: 0, sessions: 0 };
    cursor = addDays(cursor, 1);
  }
  for (const s of docs) {
    const p = s.products?.[slug];
    if (!p) continue;
    const day = new Date(s.startedAt || s.lastSeenAt || Date.now()).toISOString().slice(0, 10);
    const slot = series[day] ?? { views: 0, clicks: 0, sessions: 0 };
    slot.views += p.views ?? 0;
    slot.clicks += p.clicks ?? 0;
    slot.sessions += 1;
    series[day] = slot;
  }
  return Object.entries(series).map(([day, v]) => ({ day, ...v }));
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}