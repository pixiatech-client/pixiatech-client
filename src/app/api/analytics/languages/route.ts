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
    const rows = Object.entries(windows.current.byLang)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
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