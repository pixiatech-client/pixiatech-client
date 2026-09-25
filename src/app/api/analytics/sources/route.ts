import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import { loadWindows } from '@/lib/analytics/analytics-store';
import type { AnalyticsFilter } from '@/lib/analytics/analytics-store';
import type { AnalyticsSessionSummary } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SOURCE_ORDER = ['direct', 'search', 'social', 'referral', 'campaign', 'other'];

function matchesOther(s: AnalyticsSessionSummary, f: AnalyticsFilter, source: string): boolean {
  if (s.source !== source) return false;
  if (f.country && s.country !== f.country) return false;
  if (f.lang && s.lang !== f.lang) return false;
  if (f.device && s.device !== f.device) return false;
  if (f.page && s.pageCounts && !s.pageCounts[f.page]) return false;
  if (f.product && s.products && !s.products[f.product]) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const q = parseAnalyticsQuery(request);
    const windows = await loadWindows(q);

    const rows = SOURCE_ORDER.map((key) => {
      const docs = windows.rawCurrent.filter((s) => matchesOther(s, q.filter, key));
      const vids = new Set<string>();
      let visits = 0;
      let pageViews = 0;
      const mediums: Record<string, number> = {};
      const campaigns: Record<string, number> = {};
      const landings: Record<string, number> = {};
      for (const s of docs) {
        visits += 1;
        if (s.vid) vids.add(s.vid);
        pageViews += s.pageViews ?? 0;
        if (s.medium) mediums[s.medium] = (mediums[s.medium] ?? 0) + 1;
        if (s.campaign) campaigns[s.campaign] = (campaigns[s.campaign] ?? 0) + 1;
        if (s.landingPath) landings[s.landingPath] = (landings[s.landingPath] ?? 0) + 1;
      }
      return {
        key,
        visits,
        unique: vids.size,
        pageViews,
        mediums: topMap(mediums, 5),
        campaigns: topMap(campaigns, 5),
        landings: topMap(landings, 5),
      };
    }).filter((r) => r.visits > 0);

    return NextResponse.json({
      success: true,
      rows,
      current: windows.current,
      previous: windows.previous,
      treated: windows.rawCurrent.length,
      window: q.current,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

function topMap(map: Record<string, number>, n: number): { key: string; count: number }[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}