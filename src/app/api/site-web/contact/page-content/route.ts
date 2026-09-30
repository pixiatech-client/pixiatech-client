import { NextRequest, NextResponse } from 'next/server';
import { getPageContent, setPageContent } from '@/lib/site-web/firestore';
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

    // SOURCE UNIQUE : ce document ne porte que la MISE EN FORME de la page
    // (titres, libellés, visibilité). Les VALEURS de contact (adresse,
    // téléphones, e-mail, WhatsApp, horaires) appartiennent à
    // `siteWeb/contactInfo`, le seul document qui les définit.
    //
    // Ce PUT ne recopie donc plus les valeurs vers `contactInfo` : la
    // synchronisation inverse écrasait la source canonique avec un contenu de
    // page partiel, et une seule des deux copies se mettait à jour selon le
    // module utilisé. `ContactSections` lit désormais `contactInfo`.
    await setPageContent(updated);

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
