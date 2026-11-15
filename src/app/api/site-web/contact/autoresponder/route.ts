import { NextRequest, NextResponse } from 'next/server';
import { getAutoResponderConfig, setAutoResponderConfig } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';
import type { AutoResponderConfig } from '@/lib/site-web/types';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await getAutoResponderConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const payload = (await request.json()) as Partial<AutoResponderConfig>;
    const updated = await setAutoResponderConfig(payload);
    return NextResponse.json({
      success: true,
      message: 'Configuration du répondeur automatique enregistrée.',
      data: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
