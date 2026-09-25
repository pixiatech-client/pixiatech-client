const CONSENT_KEY = 'pixiatech_cookie_consent_v2';

/**
 * Consentement analytics : lit le choix CNIL déjà géré par CookieConsentBanner
 * (localStorage.pixiatech_cookie_consent_v2.analytics). Si l'utilisateur n'a
 * pas encore choisi ou a refusé, la collecte est désactivée.
 */
export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { analytics?: boolean };
    return data.analytics === true;
  } catch {
    return false;
  }
}

/** Se branche sur l'événement rejoué par le bandeau de consentement. */
export function watchAnalyticsConsent(cb: (granted: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handler = () => cb(getAnalyticsConsent());
  window.addEventListener('pixiatech_consent_updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('pixiatech_consent_updated', handler);
    window.removeEventListener('storage', handler);
  };
}