import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { parseAnalyticsQuery } from '@/lib/analytics/query-params';
import { fetchSessionsInWindow } from '@/lib/analytics/analytics-store';
import type { AnalyticsFilter } from '@/lib/analytics/analytics-store';
import type { AnalyticsSessionSummary } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function matches(s: AnalyticsSessionSummary, f: AnalyticsFilter): boolean {
  if (f.source && s.source !== f.source) return false;
  if (f.country && s.country !== f.country) return false;
  if (f.lang && s.lang !== f.lang) return false;
  if (f.device && s.device !== f.device) return false;
  if (f.page && s.pageCounts && !s.pageCounts[f.page]) return false;
  if (f.product && s.products && !s.products[f.product]) return false;
  return true;
}

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const q = parseAnalyticsQuery(request);
    const qs = request.nextUrl.searchParams;
    const docs = (await fetchSessionsInWindow(q.current)).filter((s) => matches(s, q.filter));

    const header = [
      'debut_session',
      'duree_ms',
      'pages',
      'source',
      'medium',
      'campagne',
      'pays',
      'langue',
      'appareil',
      'os',
      'navigateur',
      'ecran',
      'page_entree',
      'page_sortie',
      'produits',
      'actions',
    ];

    const lines = docs.map((s) => {
      const duration = s.startedAt && s.lastSeenAt ? s.lastSeenAt - s.startedAt : 0;
      return [
        new Date(s.startedAt || s.createdAt || 0).toISOString(),
        duration,
        s.pageViews ?? 0,
        s.source,
        s.medium,
        s.campaign,
        s.country,
        s.lang,
        s.device,
        s.os,
        s.browser,
        s.screen,
        s.landingPath,
        s.lastPath,
        Object.entries(s.products ?? {})
          .map(([slug, p]) => `${slug}:${p.views ?? 0}/${p.clicks ?? 0}`)
          .join(' '),
        Object.entries(s.actions ?? {})
          .map(([k, v]) => `${k}:${v}`)
          .join(' '),
      ]
        .map(csvCell)
        .join(';');
    });

    const csv = `sep=;\n${header.join(';')}\n${lines.join('\n')}`;
    const safeFile = `pixiatech_analytics_${q.current.from}_${q.current.to}.csv`;

    return new NextResponse(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFile}"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}