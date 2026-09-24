import { NextRequest, NextResponse } from 'next/server';
import { resetPageContent } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await resetPageContent();
    return NextResponse.json({
      success: true,
      message: 'Contenu réinitialisé aux valeurs d’origine avec succès.',
      data,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}