// ============================================================================
// Seed analytics standalone — remplit `analytics_sessions` et `siteWebMessages`
// avec des données fictives réalistes, directement via l'Admin SDK (ADC).
// Usage : node scripts/seed-analytics.mjs
// Les credentials sont lus depuis .env.local (GOOGLE_APPLICATION_CREDENTIALS)
// ou les variables d'environnement ADMIN_*.
// ============================================================================

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Charge .env.local (KEY=VALUE simple).
function loadEnv(file) {
  try {
    const raw = readFileSync(file, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = /^\s*[A-Z0-9_]+=(.*)\s*$/.exec(line);
      if (m && !process.env[line.split('=')[0]]) {
        const key = line.split('=')[0].trim();
        let value = m[1].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local absent : on s'en passe (env système attendu).
  }
}
loadEnv(resolve(root, '.env.local'));

if (getApps().length === 0) {
  const projectId = process.env.ADMIN_PROJECT_ID || 'pixiatech-client';
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ projectId });
  } else {
    initializeApp({ projectId });
  }
}
const adminDb = getFirestore(getApp());

const DAY = 24 * 3600 * 1000;
const NOW = Date.now();
const WINDOW_DAYS = 50;
const HOUR_PEAK = [9, 10, 11, 12, 14, 15, 16, 17, 18];

const makeId = () => crypto.randomUUID();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function weighted(table) {
  const entries = Object.entries(table);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

const COUNTRIES_LANG = {
  fr: 'fr', be: 'fr', ch: 'fr', ca: 'fr', ma: 'fr',
  us: 'en', gb: 'en', de: 'en', es: 'en', it: 'en', nl: 'en', cn: 'zh-CN',
};
const SOURCE_TABLE = { direct: 0.32, search: 0.3, social: 0.16, referral: 0.12, campaign: 0.07, other: 0.03 };
const COUNTRY_TABLE = { fr: 44, be: 12, ch: 8, ca: 6, ma: 6, us: 7, gb: 5, de: 4, es: 3, it: 3, nl: 2, cn: 3 };
const DEVICE_TABLE = { desktop: 52, mobile: 38, tablet: 10 };
const OS_BY_DEVICE = {
  desktop: { Windows: 62, macOS: 26, Linux: 12 },
  mobile: { Android: 55, iOS: 45 },
  tablet: { Android: 45, iOS: 55 },
};
const BROWSER_BY_OS = {
  Windows: { Chrome: 68, Edge: 20, Firefox: 12 },
  macOS: { Chrome: 70, Safari: 24, Firefox: 6 },
  Linux: { Chrome: 85, Firefox: 15 },
  Android: { Chrome: 92, Firefox: 8 },
  iOS: { Safari: 85, Chrome: 15 },
};
const SCREEN_TABLE = { xl: 40, lg: 30, md: 15, sm: 9, xs: 6 };
const PRODUCT_WEIGHTS = { 'pxt-fine': 42, 'wk-series': 28, 'pxt-ultra': 12, 'pxt-390': 8, 'wk-a': 6, 'pxt-pro': 4 };
const PAGES = ['/web', '/web/products', '/web/contact', '/web/mentions-legales', '/web/politique-confidentialite'];
const ACTION_TYPES = ['phone_click', 'email_click', 'whatsapp_click', 'download', 'form_submit'];

function buildJourney() {
  const l = 1 + Math.floor(Math.random() * 5.5);
  const steps = [];
  let path = Math.random() < 0.55 ? '/web' : Math.random() < 0.6 ? '/web/products' : PAGES[2 + Math.floor(Math.random() * (PAGES.length - 2))];
  for (let i = 0; i < l; i++) {
    if (i > 0) {
      const roll = Math.random();
      if (roll < 0.5) path = `/web/product/${weighted(PRODUCT_WEIGHTS)}`;
      else if (roll < 0.75) path = Math.random() < 0.5 ? '/web/products' : '/web';
      else path = pick(PAGES);
    }
    steps.push({ path, dwellMs: 4000 + Math.random() * 80000 });
  }
  return steps;
}

const visitsPerDay = (dayOffset) => {
  const weekend = [0, 6].includes(new Date(Math.floor(NOW / DAY) - dayOffset * DAY).getDay());
  const base = !weekend ? 15 + Math.floor(Math.random() * 12) : 8 + Math.floor(Math.random() * 7);
  return Math.max(3, Math.round(base * (1 + (WINDOW_DAYS - dayOffset) / 160)));
};

const dropUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

function makeSession(d, visitor) {
  const sid = makeId();
  const rawStarted = d.getTime() + (HOUR_PEAK[Math.floor(Math.random() * HOUR_PEAK.length)] * 3600 + Math.floor(Math.random() * 3600)) * 1000;
  const startedAt = Math.min(rawStarted, NOW - 10 * 60 * 1000);
  const journey = buildJourney();
  const pageCounts = {};
  const dwell = {};
  const lastN = [];
  const products = {};
  const actions = {};
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
    sid, vid: visitor.vid,
    createdAt: startedAt - 2000, startedAt, lastSeenAt, updatedAt: lastSeenAt,
    pageViews: journey.length, source,
    medium: source === 'direct' || source === 'other' ? undefined : source === 'search' ? 'organic' : source === 'social' ? 'social' : 'referral',
    campaign,
    landingPath: journey[0].path, lastPath: journey[journey.length - 1].path,
    pageCounts, dwell, lastN, products, actions,
    country, lang, device, os, browser, screen: weighted(SCREEN_TABLE),
  });
}

// --- Écriture ---
const BATCH = 450;
const visitors = Array.from({ length: 420 }).map(() => ({ vid: makeId() }));
const sessions = [];
const messages = [];

for (let day = 0; day <= WINDOW_DAYS; day++) {
  const d = new Date(NOW - day * DAY);
  d.setHours(0, 0, 0, 0);
  const count = visitsPerDay(day);
  for (let i = 0; i < count; i++) {
    sessions.push(makeSession(d, visitors[Math.floor(Math.random() * visitors.length)]));
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

for (let i = 0; i < 3; i++) {
  const live = makeSession(new Date(NOW - i * 60 * 1000), visitors[Math.floor(Math.random() * visitors.length)]);
  live.startedAt = Math.max(live.startedAt, NOW - 12 * 60 * 1000);
  live.lastSeenAt = NOW - Math.floor(Math.random() * 4 * 60 * 1000) - 1000;
  live.updatedAt = live.lastSeenAt;
  sessions.push(live);
}

const writeAll = async (ref, docs) => {
  let n = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = adminDb.batch();
    const chunk = docs.slice(i, i + BATCH);
    for (const item of chunk) {
      const { id, ...data } = item;
      batch.set(ref.doc(id ?? makeId()), data);
    }
    await batch.commit();
    n += chunk.length;
    console.log(`  → ${n}/${docs.length}`);
  }
  return n;
};

console.log(`🌱 Seed analytics (${sessions.length} sessions, ${messages.length} messages)...`);
await writeAll(adminDb.collection('analytics_sessions'), sessions);
await writeAll(adminDb.collection('siteWebMessages'), messages);
console.log(`✅ Terminé : ${sessions.length} sessions, ${messages.length} messages.`);