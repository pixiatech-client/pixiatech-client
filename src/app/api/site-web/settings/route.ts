import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';
import { getCmsSettings, saveCmsSettings } from '@/lib/site-web/pages-store';
import type { CmsBackendSettings } from '@/lib/site-web/cms-types';

export async function GET() {
  try {
    // Lecture publique : le rendu public utilise des valeurs de branding/settings.
    const settings = getCmsSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as Partial<CmsBackendSettings>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Paramètres invalides.' }, { status: 400 });
    }
    const settings = saveCmsSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Paramètres du site enregistrés avec succès.',
      settings,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}