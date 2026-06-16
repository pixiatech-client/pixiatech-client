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

  // Admin routes: session check
  const sessionCookie = request.cookies.get('session')?.value;
  const loginUrl = new URL('/admin/login', request.url);
  const adminUrl = new URL('/admin', request.url);
  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');
  const isApiRoute = pathname.startsWith('/api/');

  // Don't redirect API routes — they handle auth themselves via JSON
  if (!sessionCookie && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(adminUrl);
  }

  // For authenticated admin pages, check sessionToken mismatch via internal API
  if (sessionCookie && !isAuthPage && pathname.startsWith('/admin')) {
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
      // Fail open: let the request through, client polling will catch it
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
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/api/:path*'],
};
