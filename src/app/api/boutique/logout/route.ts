import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const loginUrl = new URL('/boutique/mon-compte/connexion', req.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('client_session');
  return response;
}
