import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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

  if (!sessionCookie && !isAuthPage) {
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(adminUrl);
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/', '/embed', '/chat-widget', '/quote/success', '/quote/verify', '/admin', '/admin/:path*', '/api/:path*'],
};
