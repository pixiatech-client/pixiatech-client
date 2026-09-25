import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/site-web/auth';

// Endpoint protégé : sert au client à savoir si l'éditeur CMS peut être activé.
// Le cookie `session` étant HttpOnly, c'est la SEULE source de vérité côté client.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    success: true,
    isAdmin: true,
    uid: auth.uid,
  });
}
