import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import { loadWindows, fetchProductNames } from '@/lib/analytics/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const q = parseAnalyticsQuery(request);
    const windows = await loadWindows(q);
    const slugs = windows.current.products.map((p) => p.slug).slice(0, q.limit);
    const names = await fetchProductNames(slugs);
    return NextResponse.json({
      success: true,
      current: {
        ...windows.current,
        products: windows.current.products.slice(0, q.limit).map((p) => ({ ...p, name: names[p.slug] ?? p.slug })),
      },
      previous: windows.previous,
      treated: windows.rawCurrent.length,
      window: q.current,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}