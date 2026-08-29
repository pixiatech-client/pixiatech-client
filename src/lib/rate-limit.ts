const WINDOW_MS = 60_000;
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, { count: number; resetAt: number }>();

function isExceeded(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function getIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Rate limiting in-memory (fenêtre glissante) par IP + par route, avec un plafond
 * global par route. Fail-open : en cas d'erreur interne la requête passe.
 * NOTE : en déploiement multi-instances le compteur est par instance.
 */
export function rateLimitExceeded(
  req: Request,
  perIpLimit: number,
  globalLimit: number,
  windowMs: number = WINDOW_MS
): boolean {
  try {
    if (buckets.size > MAX_BUCKETS) {
      const now = Date.now();
      buckets.forEach((v, k) => {
        if (v.resetAt <= now) buckets.delete(k);
      });
    }
    const path = new URL(req.url).pathname;
    const ip = getIp(req);
    return isExceeded(`${ip}:${path}`, perIpLimit, windowMs) || isExceeded(`global:${path}`, globalLimit, windowMs);
  } catch {
    return false;
  }
}