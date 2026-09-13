import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;

  if (!sessionCookie) {
    redirect('/mon-compte/connexion');
  }

  try {
    const payload = await decrypt(sessionCookie);
    if (!payload.customerId) {
      throw new Error('invalid session');
    }
  } catch {
    redirect('/mon-compte/connexion');
  }

  return <>{children}</>;
}