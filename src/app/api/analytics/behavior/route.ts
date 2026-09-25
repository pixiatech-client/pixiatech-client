import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import { loadWindows } from '@/lib/analytics/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const q = parseAnalyticsQuery(request);
    const windows = await loadWindows(q);

    const map = new Map<string, { views: number; entries: number; exits: number; n: number; totalMs: number }>();
    for (const s of windows.rawCurrent) {
      for (const path of Object.keys(s.pageCounts ?? {})) {
        const cur = map.get(path) ?? { views: 0, entries: 0, exits: 0, n: 0, totalMs: 0 };
        cur.views += s.pageCounts?.[path] ?? 0;
        if (s.landingPath === path) cur.entries += 1;
        if (s.lastPath === path) cur.exits += 1;
        const d = s.dwell?.[path];
        if (d) {
          cur.n += d.n;
          cur.totalMs += d.totalMs;
        }
        map.set(path, cur);
      }
    }
    const rows = Array.from(map.entries())
      .map(([path, v]) => ({
        path,
        views: v.views,
        entries: v.entries,
        exits: v.exits,
        avgDwellMs: v.n > 0 ? Math.round(v.totalMs / v.n) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return NextResponse.json({
      success: true,
      rows: rows.slice(0, q.limit),
      actions: windows.current.actions,
      current: windows.current,
      previous: windows.previous,
      treated: windows.rawCurrent.length,
      window: q.current,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}