import { NextRequest, NextResponse } from 'next/server';
import { getContactInfo, setContactInfo } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';
import type { ContactInfo } from '@/lib/site-web/types';

export async function GET() {
  try {
    const data = await getContactInfo();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = (await request.json()) as Partial<ContactInfo>;
    const data = await setContactInfo(body);
    return NextResponse.json({
      success: true,
      message: 'Coordonnées de contact mises à jour avec succès.',
      data,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
