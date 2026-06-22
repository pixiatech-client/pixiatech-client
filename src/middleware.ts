import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages: cache on CDN
  const publicPages = ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify'];
  if (publicPages.includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120');
    return response;
  }

  // Client espace routes: check client_session cookie
  const clientLoginUrl = new URL('/boutique/mon-compte/connexion', request.url);
  const isClientAuthPage = pathname === '/boutique/mon-compte/connexion' || pathname.startsWith('/boutique/mon-compte/valider');
  const isClientRoute = pathname.startsWith('/boutique/mon-compte/');

  if (isClientRoute && !isClientAuthPage) {
    const clientSession = request.cookies.get('client_session')?.value;
    if (!clientSession) {
      return NextResponse.redirect(clientLoginUrl);
    }
  }

  if (isClientAuthPage && request.cookies.get('client_session')?.value) {
    return NextResponse.redirect(new URL('/boutique/mon-compte/commandes', request.url));
  }

  // Admin routes: session check
  const sessionCookie = request.cookies.get('session')?.value;
  const loginUrl = new URL('/admin/login', request.url);
  const adminUrl = new URL('/admin', request.url);
  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');
  const isApiRoute = pathname.startsWith('/api/');

  if (!sessionCookie && !isAuthPage && !isApiRoute && pathname.startsWith('/admin')) {
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(adminUrl);
  }

  if (sessionCookie && pathname.startsWith('/admin')) {
    try {
      const verifyUrl = new URL('/api/verify-session', request.url);
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
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/boutique/mon-compte', '/boutique/mon-compte/:path*', '/api/:path*'],
};
