import { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function getClientSessionCustomerId(req: NextRequest): Promise<string | null> {
  const sessionCookie = req.cookies.get('client_session')?.value;
  if (!sessionCookie) return null;
  try {
    const payload = await decrypt(sessionCookie);
    return typeof payload.customerId === 'string' && payload.customerId ? payload.customerId : null;
  } catch (err) {
    console.error('[ClientSession] Failed to decrypt client_session:', err);
    return null;
  }
}