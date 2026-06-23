import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getServerT } from '@/lib/server-i18n';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PasswordForm } from '@/components/password-form';

export default async function MotDePassePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/mon-compte/connexion');

  let customerId = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
  } catch {
    redirect('/mon-compte/connexion');
  }

  const t = await getServerT();

  const { adminDb } = getFirebaseAdmin();
  const customerSnap = await adminDb.collection('customers').doc(customerId).get();
  const hasPassword = customerSnap.exists ? !!customerSnap.data()?.passwordHash : false;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/mon-compte/parametres"
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-semibold text-gray-900">
          {hasPassword ? t('client.password.changeTitle') : t('client.password.addTitle')}
        </h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <PasswordForm customerId={customerId} hasPassword={hasPassword} />
      </div>
    </div>
  );
}
