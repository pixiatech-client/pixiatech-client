// ============================================================================
// Générateur de données fictives pour le dashboard analytics.
// Fonction pure (aucun import runtime, aucun accès à Firestore) : partagée
// entre la route API `POST /api/analytics/seed` et le script CLI les scripts
// `seed-analytics.mjs`. Les champs optionnels non définis sont retirés de
// l'objet (Firestore rejette les valeurs `undefined`).
// ============================================================================

import type { AnalyticsSessionSummary } from './types';

const DAY = 24 * 3600 * 1000;
const NOW = Date.now();
const WINDOW_DAYS = 50;
const HOUR_PEAK = [9, 10, 11, 12, 14, 15, 16, 17, 18];

interface SeededVisitor {
  vid: string;
  returning: boolean;
}

function makeId(): string {
  return crypto.randomUUID();
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weighted<T extends string>(table: Record<T, number>): T {
  const entries = Object.entries(table) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

const COUNTRIES_LANG: Record<string, string> = {
  fr: 'fr',
  be: 'fr',
  ch: 'fr',
  ca: 'fr',
  ma: 'fr',
  us: 'en',
  gb: 'en',
  de: 'en',
  es: 'en',
  it: 'en',
  nl: 'en',
  cn: 'zh-CN',
};

const SOURCE_TABLE = {
  direct: 0.32,
  search: 0.3,
  social: 0.16,
  referral: 0.12,
  campaign: 0.07,
  other: 0.03,
} as const;

const COUNTRY_TABLE = {
  fr: 44,
  be: 12,
  ch: 8,
  ca: 6,
  ma: 6,
  us: 7,
  gb: 5,
  de: 4,
  es: 3,
  it: 3,
  nl: 2,
  cn: 3,
} as const;

const DEVICE_TABLE = { desktop: 52, mobile: 38, tablet: 10 } as const;

const OS_BY_DEVICE: Record<string, Record<string, number>> = {
  desktop: { Windows: 62, macOS: 26, Linux: 12 },
  mobile: { Android: 55, iOS: 45 },
  tablet: { Android: 45, iOS: 55 },
};

const BROWSER_BY_OS: Record<string, Record<string, number>> = {
  Windows: { Chrome: 68, Edge: 20, Firefox: 12 },
  macOS: { Chrome: 70, Safari: 24, Firefox: 6 },
  Linux: { Chrome: 85, Firefox: 15 },
  Android: { Chrome: 92, Firefox: 8 },
  iOS: { Safari: 85, Chrome: 15 },
};

const SCREEN_TABLE = { xl: 40, lg: 30, md: 15, sm: 9, xs: 6 } as const;

const PRODUCT_SLUGS = ['pxt-fine', 'wk-series', 'pxt-ultra', 'pxt-390', 'wk-a', 'pxt-pro'];
const PRODUCT_WEIGHTS: Record<string, number> = {
  'pxt-fine': 42,
  'wk-series': 28,
  'pxt-ultra': 12,
  'pxt-390': 8,
  'wk-a': 6,
  'pxt-pro': 4,
};

const PAGES = ['/web', '/web/products', '/web/contact', '/web/mentions-legales', '/web/politique-confidentialite'];
const ACTION_TYPES = ['phone_click', 'email_click', 'whatsapp_click', 'download', 'form_submit'];

interface JourneyStep {
  path: string;
  dwellMs: number;
}

function buildJourney(): JourneyStep[] {
  const l = 1 + Math.floor(Math.random() * 5.5);
  const steps: JourneyStep[] = [];
  const landing = Math.random() < 0.55 ? '/web' : Math.random() < 0.6 ? '/web/products' : PAGES[2 + Math.floor(Math.random() * (PAGES.length - 2))];

  let path = landing;
  for (let i = 0; i < l; i++) {
    if (i > 0) {
      const roll = Math.random();
      if (roll < 0.5) {
        const slug = weighted(PRODUCT_WEIGHTS);
        path = `/web/product/${slug}`;
      } else if (roll < 0.75) {
        path = Math.random() < 0.5 ? '/web/products' : '/web';
      } else {
        path = pick(PAGES);
      }
    }
    const dwellMs = 4000 + Math.random() * 80000;
    steps.push({ path, dwellMs });
  }
  return steps;
}

function makeVisitCountByDay(dayOffset: number, startDay: number): number {
  const weekend = [0, 6].includes(new Date(startDay - dayOffset * DAY).getDay());
  const base = !weekend ? 15 + Math.floor(Math.random() * 12) : 8 + Math.floor(Math.random() * 7);
  const growth = 1 + (WINDOW_DAYS - dayOffset) / 160;
  return Math.max(3, Math.round(base * growth));
}

function dropUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function makeSession(d: Date, visitor: SeededVisitor): AnalyticsSessionSummary {
  const sid = makeId();
  const rawStarted =
    d.getTime() + (HOUR_PEAK[Math.floor(Math.random() * HOUR_PEAK.length)] * 3600 + Math.floor(Math.random() * 3600)) * 1000;
  const startedAt = Math.min(rawStarted, NOW - 10 * 60 * 1000);

  const journey = buildJourney();
  const pageCounts: Record<string, number> = {};
  const dwell: Record<string, { n: number; totalMs: number }> = {};
  const lastN: string[] = [];
  const products: Record<string, { views?: number; clicks?: number }> = {};
  const actions: Record<string, number> = {};

  for (const step of journey) {
    pageCounts[step.path] = (pageCounts[step.path] ?? 0) + 1;
    if (lastN[lastN.length - 1] !== step.path) {
      lastN.push(step.path);
      if (lastN.length > 8) lastN.shift();
    }
    const slug = /^\/web\/product\/([^/?#]+)$/.exec(step.path)?.[1];
    if (slug) {
      products[slug] = { views: (products[slug]?.views ?? 0) + 1, clicks: products[slug]?.clicks ?? 0 };
      if (Math.random() < 0.14) products[slug].clicks = (products[slug]?.clicks ?? 0) + 1;
    }
    if (step.dwellMs > 0) {
      const cur = dwell[step.path] ?? { n: 0, totalMs: 0 };
      cur.n += 1;
      cur.totalMs += step.dwellMs;
      dwell[step.path] = cur;
    }
  }

  const actionCount = Math.random() < 0.22 ? 1 + Math.floor(Math.random() * 2) : 0;
  for (let i = 0; i < actionCount; i++) {
    const type = pick(ACTION_TYPES);
    actions[type] = (actions[type] ?? 0) + 1;
  }
  if (Math.random() < 0.06) actions.form_submit = (actions.form_submit ?? 0) + 1;

  const totalDwell = journey.reduce((s, x) => s + x.dwellMs, 0);
  const lastSeenAt = Math.min(startedAt + totalDwell, NOW - 6 * 60 * 1000);

  const country = weighted(COUNTRY_TABLE);
  const lang = COUNTRIES_LANG[country] ?? 'fr';
  const device = weighted(DEVICE_TABLE);
  const os = weighted(OS_BY_DEVICE[device]);
  const browser = weighted(BROWSER_BY_OS[os]);

  const source = weighted(SOURCE_TABLE);
  const campaign = source === 'campaign' ? pick(['print-led', 'rentree-2026', 'noel-2025', 'led-week']) : undefined;

  return dropUndefined({
    sid,
    vid: visitor.vid,
    createdAt: startedAt - 2000,
    startedAt,
    lastSeenAt,
    updatedAt: lastSeenAt,
    pageViews: journey.length,
    source,
    medium: source === 'direct' || source === 'other' ? undefined : source === 'search' ? 'organic' : source === 'social' ? 'social' : 'referral',
    campaign,
    landingPath: journey[0].path,
    lastPath: journey[journey.length - 1].path,
    pageCounts,
    dwell,
    lastN,
    products,
    actions,
    country,
    lang,
    device,
    os,
    browser,
    screen: weighted(SCREEN_TABLE),
  });
}

export interface DemoSeed {
  sessions: AnalyticsSessionSummary[];
  messages: Record<string, unknown>[];
}

export function generateDemoSeed(): DemoSeed {
  const visitors: SeededVisitor[] = Array.from({ length: 420 }).map(() => ({
    vid: makeId(),
    returning: Math.random() < 0.35,
  }));

  const sessions: AnalyticsSessionSummary[] = [];
  const messages: Record<string, unknown>[] = [];

  for (let day = 0; day <= WINDOW_DAYS; day++) {
    const d = new Date(NOW - day * DAY);
    d.setHours(0, 0, 0, 0);
    const startDay = Math.floor(NOW / DAY);
    const count = makeVisitCountByDay(day, startDay);
    for (let i = 0; i < count; i++) {
      const visitor = visitors[Math.floor(Math.random() * visitors.length)];
      sessions.push(makeSession(d, visitor));
    }
    if (Math.random() < 0.5) {
      messages.push({
        id: `seed-msg-${day}-${Math.floor(Math.random() * 999)}`,
        name: pick(['Marc D.', 'Sophie L.', 'David K.', 'Amina B.', 'Hugo P.']),
        email: `client${day}@example.com`,
        phone: '+33' + String(600000000 + Math.floor(Math.random() * 99999999)),
        company: Math.random() < 0.4 ? pick(['TechWorld', 'NordEvents', 'StudioXL', 'CityMall']) : '',
        projectType: 'led',
        subject: 'Demande de devis écran LED',
        message: 'Bonjour, nous recherchons une solution d’écran LED pour notre hall d’exposition.',
        consent: true,
        createdAt: new Date(NOW - day * DAY - Math.floor(Math.random() * 8 * 3600 * 1000)).toISOString(),
        status: 'unread',
        emailDeliveryStatus: 'simulated',
        deliveryNote: 'seed',
        __seed: true,
      });
    }
  }

  const liveCount = 3;
  for (let i = 0; i < liveCount; i++) {
    const live = makeSession(new Date(NOW - i * 60 * 1000), visitors[Math.floor(Math.random() * visitors.length)]);
    live.startedAt = Math.max(live.startedAt, NOW - 12 * 60 * 1000);
    live.lastSeenAt = NOW - Math.floor(Math.random() * 4 * 60 * 1000) - 1000;
    live.updatedAt = live.lastSeenAt;
    sessions.push(live);
  }

  return { sessions, messages };
}