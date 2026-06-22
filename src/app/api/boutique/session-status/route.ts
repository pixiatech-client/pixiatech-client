import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('client_session')?.value;
  if (!sessionCookie) {
    return NextResponse.json({ loggedIn: false });
  }

  try {
    const payload = await decrypt(sessionCookie);
    return NextResponse.json({
      loggedIn: true,
      email: payload.email || '',
    });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
