import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { MemberSidebar } from '@/components/member-sidebar';
import { MemberHeader } from '@/components/member-header';
import { SecurityBanner } from '@/components/security-banner';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;

  if (!sessionCookie) {
    redirect('/mon-compte/connexion');
  }

  let customerId = '';
  let customerEmail = '';
  let hasPassword = false;
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
    customerEmail = payload.email;

    const { adminDb } = getFirebaseAdmin();
    const customerSnap = await adminDb.collection('customers').doc(customerId).get();
    hasPassword = !!customerSnap.data()?.passwordHash;
  } catch {
    redirect('/mon-compte/connexion');
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5]">
      <MemberHeader customerEmail={customerEmail} customerId={customerId} />

      <MemberSidebar />

      <main className="pl-0 md:pl-64 pt-14 min-h-screen">
        {!hasPassword && <div className="px-6 pt-6"><SecurityBanner customerId={customerId} /></div>}
        {children}
      </main>
    </div>
  );
}
