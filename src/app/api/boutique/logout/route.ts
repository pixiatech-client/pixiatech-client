import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // In Cloud Run, req.nextUrl resolves to http://0.0.0.0:8080 — use forwarded headers instead.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  const loginUrl = `${proto}://${host}/mon-compte/connexion`;
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('client_session');
  return response;
}
