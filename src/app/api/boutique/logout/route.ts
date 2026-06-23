import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') ?? 'localhost:3000';
  const protocol = req.nextUrl.protocol ?? 'http:';
  const loginUrl = new URL('/mon-compte/connexion', `${protocol}//${host}`);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('client_session');
  return response;
}
