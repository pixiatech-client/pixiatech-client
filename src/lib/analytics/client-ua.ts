export interface DeviceInfo {
  device: string;
  os: string;
  browser: string;
  screen: string;
}

function matchUserAgent(pattern: RegExp | string): string | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
  const m = re.exec(ua);
  return m ? m[0] : null;
}

/** Détection côté client (aucune donnée stockée : champs courts uniquement). */
export function detectDeviceInfo(): DeviceInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const device = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  let os = 'unknown';
  let browser = 'unknown';
  try {
    const ua = navigator.userAgent || '';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    if (/edg\//i.test(ua)) browser = 'Edge';
    else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
    else if (/firefox\//i.test(ua)) browser = 'Firefox';
    else if (/chrome|chromium/i.test(ua)) browser = 'Chrome';
    else if (/safari/i.test(ua)) browser = 'Safari';

    void matchUserAgent;
  } catch {
    os = 'unknown';
    browser = 'unknown';
  }

  let screen = 'xl';
  if (width >= 1440) screen = 'xl';
  else if (width >= 1280) screen = 'lg';
  else if (width >= 1024) screen = 'md';
  else if (width >= 768) screen = 'sm';
  else screen = 'xs';

  return { device, os, browser, screen };
}

/** Referrer externe uniquement (jamais les URLs internes). */
export function getExternalReferrer(): string | undefined {
  try {
    const ref = document.referrer;
    if (!ref) return undefined;
    const origin = window.location.origin;
    return new URL(ref).origin === origin ? undefined : ref;
  } catch {
    return undefined;
  }
}

/** Paramètres UTM présents dans l'URL courante. */
export function getUrlParams(): { source?: string; medium?: string; campaign?: string } {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      source: p.get('utm_source') ?? undefined,
      medium: p.get('utm_medium') ?? undefined,
      campaign: p.get('utm_campaign') ?? undefined,
    };
  } catch {
    return {};
  }
}