
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;
  
  const loginUrl = new URL('/admin/login', request.url);
  const adminUrl = new URL('/admin', request.url);

  const isAuthPage = pathname.startsWith('/admin/login') || pathname.startsWith('/admin/register');

  // If there's no session cookie and the user is trying to access a protected admin page
  if (!sessionCookie && !isAuthPage) {
    // Redirect to the login page
    return NextResponse.redirect(loginUrl);
  }

  // If there is a session cookie and the user is trying to access an auth page
  if (sessionCookie && isAuthPage) {
    // Redirect to the admin dashboard
    return NextResponse.redirect(adminUrl);
  }

  // For all other cases, allow the request to proceed.
  const response = NextResponse.next();

  // Security Headers for Production and Iframe Support
  response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://pixiatech.com https://www.pixiatech.com https://*.pixiatech.com;");
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS for credentials (needed for cookies in iframes)
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  // Note: Access-Control-Allow-Origin cannot be '*' when Credentials is true.
  // It must be the specific origin of the WordPress site if making cross-origin fetch calls.
  // For document-level iframe embedding, it's mostly the CSP frame-ancestors that matters.

  return response;
}

export const config = {
  // This matcher applies the middleware to all routes under /admin,
  // including the root /admin page itself.
  matcher: ['/admin', '/admin/:path*'],
};
