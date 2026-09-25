import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { fetchActiveSessions } from '@/lib/analytics/analytics-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const sessions = await fetchActiveSessions();
    const now = Date.now();
    return NextResponse.json({
      success: true,
      online: sessions.length,
      now,
      sessions: sessions.map((s) => ({
        ...s,
        idleMs: now - s.lastSeenAt,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}