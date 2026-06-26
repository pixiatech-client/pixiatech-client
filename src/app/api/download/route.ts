export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

const ALLOWED_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

function isIpPrivate(ip: string): boolean {
  // IPv4 Private/Local networks
  if (
    ip.startsWith('127.') || 
    ip.startsWith('10.') || 
    ip.startsWith('169.254.') || 
    ip.startsWith('192.168.') ||
    ip === '0.0.0.0'
  ) {
    return true;
  }
  if (ip.startsWith('172.')) {
    const parts = ip.split('.').map(Number);
    if (parts[1] >= 16 && parts[1] <= 31) {
      return true;
    }
  }

  // IPv6 Private/Local networks
  const lowerIp = ip.toLowerCase();
  if (
    ip === '::1' || 
    ip === '::' || 
    lowerIp.startsWith('fe80:') || 
    lowerIp.startsWith('fc00:') || 
    lowerIp.startsWith('fd00:')
  ) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download';

    if (!urlParam) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // 1. Parse and validate URL structure
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlParam);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // 2. Validate Protocol
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Protocol not allowed' }, { status: 400 });
    }

    // 3. Check Hostname Whitelist
    const hostname = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 });
    }

    // 4. Resolve DNS and check if IP is private (prevent SSRF)
    try {
      const lookupResult = await dnsLookup(parsedUrl.hostname);
      if (isIpPrivate(lookupResult.address)) {
        return NextResponse.json({ error: 'Access to private networks is forbidden' }, { status: 403 });
      }
    } catch (dnsErr) {
      console.error('[download proxy] DNS lookup failed:', dnsErr);
      return NextResponse.json({ error: 'Failed to resolve domain name' }, { status: 400 });
    }

    // 5. Fetch content with redirects disabled to avoid redirect-based SSRF bypass
    const response = await fetch(urlParam, {
      redirect: 'manual',
    });

    // Check for manual redirect response (3xx statuses)
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: 'Redirects are not allowed' }, { status: 400 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[download proxy] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

