import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MonCompteLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;

  if (!sessionCookie) {
    redirect('/boutique/mon-compte/connexion');
  }

  try {
    await decrypt(sessionCookie);
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  return <>{children}</>;
}
