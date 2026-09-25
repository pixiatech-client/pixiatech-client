import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import { loadWindows, countConversions } from '@/lib/analytics/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const q = parseAnalyticsQuery(request);
    const [windows, conversions, prevConversions] = await Promise.all([
      loadWindows(q),
      countConversions(q.current),
      countConversions(q.previous),
    ]);
    return NextResponse.json({
      success: true,
      current: windows.current,
      previous: windows.previous,
      conversions,
      prevConversions,
      treated: windows.rawCurrent.length,
      window: q.current,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}