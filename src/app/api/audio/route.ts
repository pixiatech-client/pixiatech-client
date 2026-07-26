export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// Whitelist of allowed hosts to prevent SSRF (Server-Side Request Forgery).
// Only Firebase Storage origins are permitted; everything else is rejected.
const ALLOWED_HOSTS = new Set<string>([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'studio-9205859220-a6440.firebasestorage.app',
]);

function isPrivateOrLoopback(hostname: string): boolean {
  // Reject IP literals pointing at loopback, link-local, or private ranges.
  // This blocks SSRF to localhost, 169.254.169.254 (cloud metadata), 10.x, 192.168.x.x, etc.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only https URLs are allowed' }, { status: 403 });
    }

    if (isPrivateOrLoopback(parsed.hostname)) {
      return NextResponse.json({ error: 'Forbidden host' }, { status: 403 });
    }

    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
    }

    const response = await fetch(parsed.toString(), {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      // Don't follow redirects to prevent redirect-based SSRF
      return NextResponse.json({ error: 'Redirects not allowed' }, { status: 502 });
    }
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: response.status });
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'audio/webm';
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    console.error('[audio proxy] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
