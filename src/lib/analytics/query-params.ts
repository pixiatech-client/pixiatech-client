import type { NextRequest } from 'next/server';
import type { AnalyticsFilter } from './analytics-store';

export const ANALYTICS_MAX_RANGE_MS = 400 * 24 * 3600 * 1000;

export interface AnalyticsQuery {
  current: { from: number; to: number };
  previous: { from: number; to: number };
  filter: AnalyticsFilter;
  limit: number;
}

function num(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown, max = 120): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t ? t.slice(0, max) : undefined;
}

/**
 * Analyse la fenêtre temporelle + filtres d'une requête admin analytics.
 * `from`/`to` en ms ou ISO ; la période précédente est la fenêtre de même
 * longueur immédiatement avant la période courante. Fenêtre plafonnée
 * (400 jours) pour borner le coût des lectures Firestore.
 */
export function parseAnalyticsQuery(request: NextRequest, searchParamsOverride?: URLSearchParams): AnalyticsQuery {
  const sp = searchParamsOverride ?? request.nextUrl.searchParams;

  const rawFrom = sp.get('from');
  const rawTo = sp.get('to');
  const fallbackTo = Date.now();
  const fallbackFrom = fallbackTo - 30 * 24 * 3600 * 1000;

  const to = rawTo ? parseTs(rawTo, fallbackTo) : fallbackTo;
  let from = rawFrom ? parseTs(rawFrom, fallbackFrom) : fallbackFrom;
  if (to - from > ANALYTICS_MAX_RANGE_MS) from = to - ANALYTICS_MAX_RANGE_MS;
  if (from >= to) from = to - 3600_000;
  if (from < 0) from = 0;

  const len = to - from;
  const previousTo = Math.max(0, from - 1);
  const previousFrom = Math.max(0, from - len);

  return {
    current: { from, to },
    previous: { from: previousFrom, to: previousTo },
    filter: {
      product: str(sp.get('product')),
      page: str(sp.get('page')),
      country: str(sp.get('country'), 8),
      lang: str(sp.get('lang'), 8),
      device: str(sp.get('device'), 20),
      source: str(sp.get('source'), 20),
    },
    limit: Math.min(500, Math.max(1, num(sp.get('limit'), 50))),
  };
}

function parseTs(value: string, fallback: number): number {
  if (/^\d+$/.test(value)) return Number(value);
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : fallback;
}