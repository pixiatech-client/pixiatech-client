
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
  // 🔓 Added more origins for frame-ancestors to ensure the WordPress site isn't blocked
  const csp = "frame-ancestors 'self' *;"; // Temporarily permissive for debugging
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS for credentials (needed for cookies in iframes)
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  // In an iframe context, we need to be careful with Origin
  const origin = request.headers.get('origin');
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  return response;
}

export const config = {
  // This matcher applies the middleware to all routes under /admin,
  // including the root /admin page itself.
  matcher: ['/admin', '/admin/:path*'],
};
