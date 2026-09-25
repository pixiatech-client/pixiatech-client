export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitExceeded } from '@/lib/rate-limit';
import { ingestAnalyticsEvents, normalizeCountry } from '@/lib/analytics/analytics-store';

function pickCountry(req: NextRequest): string | undefined {
  return normalizeCountry(
    req.headers.get('x-country-code') ??
      req.headers.get('x-appengine-country') ??
      req.headers.get('x-vercel-ip-country')
  );
}

/**
 * Point d'entrée du tracker du site public (aucune authentification).
 * - Ne stocke AUCUNE donnée sans consentement analytics (`x-analytics-consent: 1`).
 * - Rate-limité par IP (même mécanique que contact/send).
 * - Le pays est résolu côté serveur depuis les en-têtes de la plateforme ;
 *   aucune adresse IP n'est jamais persistée.
 */
export async function POST(request: NextRequest) {
  if (rateLimitExceeded(request, 120, 4000, 60_000)) {
    return NextResponse.json({ success: false, message: 'Trop de requêtes' }, { status: 429 });
  }

  if (request.headers.get('x-analytics-consent') !== '1') {
    return NextResponse.json({ success: true, accepted: 0, dropped: 0, reason: 'consent_required' });
  }

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const events = Array.isArray(body) ? body : (body as { events?: unknown })?.events;
    const result = await ingestAnalyticsEvents(events, pickCountry(request));
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    console.error('POST /api/analytics/track', err);
    return NextResponse.json(
      { success: false, message: 'Erreur interne', error: (err as Error).message },
      { status: 500 }
    );
  }
}