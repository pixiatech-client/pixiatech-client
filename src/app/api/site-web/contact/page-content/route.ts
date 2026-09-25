import { NextRequest, NextResponse } from 'next/server';
import { getPageContent, setPageContent, getContactInfo, setContactInfo } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';
import type { PageContentConfig } from '@/lib/site-web/types';

export async function GET() {
  try {
    const data = await getPageContent();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const updated = (await request.json()) as PageContentConfig;
    if (!updated || !updated.visibility || !updated.hero) {
      return NextResponse.json({ success: false, message: 'Configuration de page invalide.' }, { status: 400 });
    }
    await setPageContent(updated);

    // Synchronize basic contactInfo fields
    if (updated.info) {
      const sync: Record<string, string> = {};
      if (updated.info.phone1) sync.phone1 = updated.info.phone1;
      if (updated.info.phone2) sync.phone2 = updated.info.phone2;
      if (updated.info.emailValue) sync.primaryEmail = updated.info.emailValue;
      if (updated.info.addressValue) sync.address = updated.info.addressValue;
      if (updated.info.whatsappNumber) sync.whatsappNumber = updated.info.whatsappNumber;
      if (updated.info.hoursValue) sync.workingHours = updated.info.hoursValue;
      if (Object.keys(sync).length > 0) await setContactInfo(sync);
    }

    const data = await getPageContent();
    return NextResponse.json({
      success: true,
      message: 'Page et visibilité sauvegardées avec succès !',
      data,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
