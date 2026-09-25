import { NextRequest, NextResponse } from 'next/server';
import { listMessages } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const messages = await listMessages();
    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
      unreadCount: messages.filter(m => m.status === 'unread').length,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
