import { NextRequest, NextResponse } from 'next/server';
import { emptyTrashMessages } from '@/lib/site-web/firestore';
import { requireAdmin } from '@/lib/site-web/auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const count = await emptyTrashMessages();
    return NextResponse.json({
      success: true,
      count,
      message: `${count} message(s) supprimé(s) définitivement de la corbeille.`,
    });
  } catch (err: unknown) {
    console.error('[siteWeb empty-trash] Error:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Erreur lors du vidage de la corbeille.' },
      { status: 500 }
    );
  }
}
