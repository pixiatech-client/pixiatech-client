import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Apply baseline security headers to every response (defense in depth).
// CSP is permissive enough to keep the existing PayPal/Firebase/Three.js features working.
function applySecurityHeaders(response: NextResponse, isHttps: boolean): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.paypal.com https://*.firebaseio.com https://*.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss: https://*.paypal.com",
      "frame-src 'self' https://*.paypal.com https://www.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  if (isHttps) {
    // Only set HSTS over HTTPS so we don't brick localhost dev
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const clientSession = request.cookies.get('client_session')?.value;
  console.log('[Middleware] path=', pathname, 'session=', !!sessionCookie, 'client_session=', !!clientSession);

  // Resolve public base URL — Cloud Run exposes 0.0.0.0:8080 internally;
  // x-forwarded-host / x-forwarded-proto carry the real public domain.
  const fwdHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const fwdProto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  const baseUrl = `${fwdProto}://${fwdHost}`;

  // For internal API fetches, fall back to localhost if still 0.0.0.0
  let requestUrl = request.url;
  if (requestUrl.includes('://0.0.0.0')) {
    requestUrl = requestUrl.replace('://0.0.0.0', '://localhost');
  }

  // Public pages: cache on CDN
  const publicPages = ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify'];
  const isHttps = (request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')) === 'https';
  if (publicPages.includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return applySecurityHeaders(response, isHttps);
  }

  // Client espace routes: check client_session cookie
  const clientLoginUrl = `${baseUrl}/mon-compte/connexion`;
  const isClientAuthPage = pathname === '/mon-compte/connexion' || pathname.startsWith('/mon-compte/valider');
  const isClientRoute = pathname.startsWith('/mon-compte/');

  if (isClientRoute && !isClientAuthPage) {
    if (!clientSession) {
      return NextResponse.redirect(clientLoginUrl);
    }
  }

  // Admin routes: session check
  const loginUrl = `${baseUrl}/admin/login`;
  const adminUrl = `${baseUrl}/admin`;
  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');
  const isApiRoute = pathname.startsWith('/api/');

  if (!sessionCookie && !isAuthPage && !isApiRoute && pathname.startsWith('/admin')) {
    console.log('[Middleware] redirect to login (no session)');
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    console.log('[Middleware] redirect to admin (has session on auth page)');
    return NextResponse.redirect(adminUrl);
  }

  if (sessionCookie && pathname.startsWith('/admin')) {
    const MAX_RETRIES = 1;
    const TIMEOUT_MS = 2000;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const verifyUrl = new URL('/api/verify-session', requestUrl);
        const verifyRes = await fetch(verifyUrl, {
          headers: { cookie: request.headers.get('cookie') || '' },
          signal: controller.signal,
        });
        clearTimeout(timer);
        const data = await verifyRes.json();

        if (data.valid) {
          break; // session OK, let through
        }

        // Only delete cookies on definitive auth failures ('session_mismatch', 'expired', 'user_not_found')
        if (data.reason === 'session_mismatch' || data.reason === 'expired' || data.reason === 'user_not_found') {
          console.log('[Middleware] session invalid (reason=' + data.reason + '), redirecting to login');
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('session');
          response.cookies.delete('sessionToken');
          return response;
        }
        break; // Other reasons: fail open, let AdminLayout do the authoritative check
      } catch (err) {
        console.warn('[Middleware] verify-session attempt ' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ' failed (failing open):', err);
      }
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response, isHttps);
}

export const config = {
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/mon-compte', '/mon-compte/:path*', '/api/:path*'],
};
