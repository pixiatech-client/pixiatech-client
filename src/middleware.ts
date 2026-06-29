import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const clientSession = request.cookies.get('client_session')?.value;
  console.log('[Middleware] path=', pathname, 'session=', !!sessionCookie, 'client_session=', !!clientSession);

  // Sanitize base URL to avoid 0.0.0.0 redirects
  let requestUrl = request.url;
  if (requestUrl.includes('://0.0.0.0')) {
    requestUrl = requestUrl.replace('://0.0.0.0', '://localhost');
  }

  // Public pages: cache on CDN
  const publicPages = ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify'];
  if (publicPages.includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return response;
  }

  // Client espace routes: check client_session cookie
  const clientLoginUrl = new URL('/mon-compte/connexion', requestUrl);
  const isClientAuthPage = pathname === '/mon-compte/connexion' || pathname.startsWith('/mon-compte/valider');
  const isClientRoute = pathname.startsWith('/mon-compte/');

  if (isClientRoute && !isClientAuthPage) {
    if (!clientSession) {
      return NextResponse.redirect(clientLoginUrl);
    }
  }

  // Admin routes: session check
  const loginUrl = new URL('/admin/login', requestUrl);
  const adminUrl = new URL('/admin', requestUrl);
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
    try {
      const verifyUrl = new URL('/api/verify-session', requestUrl);
      const verifyRes = await fetch(verifyUrl, {
        headers: { cookie: request.headers.get('cookie') || '' },
      });
      const data = await verifyRes.json();

      if (!data.valid && data.reason === 'session_mismatch') {
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('session');
        response.cookies.delete('sessionToken');
        return response;
      }
    } catch (err) {
      console.error('[Middleware] verify-session error:', err);
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/mon-compte', '/mon-compte/:path*', '/api/:path*'],
};
