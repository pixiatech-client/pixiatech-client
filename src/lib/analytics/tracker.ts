import type { AnalyticsEventType } from '@/lib/analytics/constants';
import { getAnalyticsConsent, watchAnalyticsConsent } from '@/lib/analytics/client-consent';
import { detectDeviceInfo, getExternalReferrer, getUrlParams } from '@/lib/analytics/client-ua';

const SID_KEY = 'pixi_ana_sid';
const VID_KEY = 'pixi_ana_vid';
const SID_TTL_MS = 30 * 60_000;
const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_QUEUE_SIZE = 12;
const HEARTBEAT_MS = 60_000;
const TRACK_ENDPOINT = '/api/analytics/track';

export interface TrackPayload {
  type: AnalyticsEventType;
  path?: string;
  title?: string;
  productSlug?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  lang?: string;
  dwell?: number;
}

type Entry = TrackPayload & {
  device?: string;
  os?: string;
  browser?: string;
  screen?: string;
  ref?: string;
};

let enabled = false;
let started = false;
let sid: string | undefined;
let vid: string | undefined;
let currentLang: string | undefined;
let currentPath: string | undefined;
let queue: Entry[] = [];
let lastFlush = 0;
let lastPagePath: string | undefined;
let lastPageAt = 0;
let lastNavAt = Date.now();
let flushTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let unlistenConsent: (() => void) | null = null;

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* noop */
  }
  return `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function readStored(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function loadOrCreateSession(): void {
  const now = Date.now();
  try {
    const raw = window.localStorage.getItem(SID_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { v?: string; t?: number };
        if (parsed.v && typeof parsed.t === 'number' && now - parsed.t < SID_TTL_MS) {
          sid = parsed.v;
        }
      } catch {
        sid = raw;
      }
    }
    if (!sid || !/^[A-Za-z0-9_-]{8,80}$/.test(sid)) {
      sid = makeId();
      window.localStorage.setItem(SID_KEY, JSON.stringify({ v: sid, t: now }));
    }
    if (!vid) {
      vid = readStored(VID_KEY) ?? makeId();
      window.localStorage.setItem(VID_KEY, vid);
    }
  } catch {
    sid = sid ?? makeId();
    vid = vid ?? makeId();
  }
}

function push(entry: TrackPayload): void {
  if (!enabled || typeof window === 'undefined') return;
  const info = detectDeviceInfo();
  queue.push({ ...entry, lang: entry.lang ?? currentLang, ...info });
  if (queue.length >= FLUSH_QUEUE_SIZE || Date.now() - lastFlush >= FLUSH_INTERVAL_MS) {
    void flush();
  }
}

async function post(batch: Entry[]): Promise<boolean> {
  if (!sid || !vid) return false;
  const body = JSON.stringify(
    batch.map((e) => ({
      ...e,
      sid,
      vid,
      ref: e.type === 'session_start' ? getExternalReferrer() : undefined,
    }))
  );
  try {
    const res = await fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-analytics-consent': '1',
      },
      body,
      keepalive: true,
      credentials: 'same-origin',
    });
    return res.ok;
  } catch {
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        return navigator.sendBeacon(TRACK_ENDPOINT, new Blob([body], { type: 'application/json' }));
      }
    } catch {
      /* noop */
    }
    return false;
  }
}

async function flush(): Promise<void> {
  if (!enabled || queue.length === 0) return;
  const batch = queue;
  queue = [];
  lastFlush = Date.now();
  const ok = await post(batch);
  if (!ok) {
    queue = [...batch, ...queue].slice(0, 50);
  }
}

function onConsent(granted: boolean): void {
  const wasEnabled = enabled;
  enabled = granted;
  if (!granted) return;
  loadOrCreateSession();
  if (!wasEnabled) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    currentPath = path;
    if (getAnalyticsConsent()) {
      // Début de session (sid créé) : premier événement avec referrer/UTM.
      if (!started) {
        started = true;
        push({ type: 'session_start', path, ...getUrlParams() });
      }
      push({ type: 'page_view', path, title: typeof document !== 'undefined' ? document.title : undefined });
    }
  }
}

/**
 * Initialisation (idempotente) — à appeler depuis un composant client monté
 * globalement. Ne collecte qu'après consentement analytics.
 */
export function initTracker(): void {
  if (unlistenConsent || typeof window === 'undefined') return;
  if (getAnalyticsConsent()) {
    onConsent(true);
  }
  unlistenConsent = watchAnalyticsConsent((granted) => onConsent(granted));

  window.addEventListener('pagehide', () => {
    void flush();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void flush();
    }
  });

  window.addEventListener('pixia:set-lang', ((e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (typeof detail === 'string') currentLang = detail;
  }) as EventListener);

  flushTimer = setInterval(() => {
    void flush();
  }, FLUSH_INTERVAL_MS);

  heartbeatTimer = setInterval(() => {
    if (enabled) push({ type: 'heartbeat', path: currentPath });
  }, HEARTBEAT_MS);
}

export function trackEvent(type: AnalyticsEventType, opts: Omit<TrackPayload, 'type'> = {}): void {
  push({ type, ...opts });
}

export function trackPageView(path: string, title?: string): void {
  const now = Date.now();
  if (lastPagePath === path && now - lastPageAt < 1500) return;
  lastPagePath = path;
  lastPageAt = now;
  currentPath = path;
  const dwell = now - lastNavAt;
  lastNavAt = now;
  push({
    type: 'page_view',
    path,
    title,
    dwell: dwell > 0 && dwell <= 36e5 ? dwell : undefined,
  });
}

/** Clic sur un produit (cartes listing, méga-menu, recherche). */
export function trackProductClick(slug: string, lang?: string): void {
  push({ type: 'product_click', productSlug: slug, path: currentPath, lang });
}

export function trackFormSubmit(): void {
  push({ type: 'form_submit', path: currentPath });
}

export function setLang(lang: string | undefined): void {
  currentLang = lang;
}

export function getTrackerConsent(): boolean {
  return enabled;
}

export function getSessionId(): string | undefined {
  return sid;
}