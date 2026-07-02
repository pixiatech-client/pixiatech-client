import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getServerT } from '@/lib/server-i18n';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ParametresPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/mon-compte/connexion');

  let customerId = '';
  let customerEmail = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
    customerEmail = payload.email;
  } catch {
    redirect('/mon-compte/connexion');
  }

  const t = await getServerT();

  const { adminDb } = getFirebaseAdmin();
  const customerSnap = await adminDb.collection('customers').doc(customerId).get();
  const customer = customerSnap.exists ? customerSnap.data() : null;
  const emailPrefix = customerEmail.split('@')[0];
  const maskedEmail = emailPrefix.length > 3
    ? emailPrefix.slice(0, 3) + '***@' + customerEmail.split('@')[1]
    : emailPrefix + '***@' + customerEmail.split('@')[1];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">{t('client.settings.title')}</h2>

      {/* Informations du compte */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#004ac6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-gray-900">{t('client.settings.accountInfo')}</span>
          </div>
          <Link
            href="/mon-compte/parametres/profil"
            className="w-full px-4 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-all text-center"
          >
            {t('client.settings.editProfile')}
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          <Link href="/mon-compte/parametres/profil" className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">{t('client.settings.myProfile')}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-gray-900">{t('client.settings.memberProfile')}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <Link href="/mon-compte/parametres/informations-fiscales" className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">{t('client.settings.fiscalInfo')}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Sécurité du compte */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-[#eef2ff] flex items-center justify-center">
            <svg className="w-4 h-4 text-[#004ac6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-900">{t('client.settings.security')}</span>
        </div>
        <div className="divide-y divide-gray-100">
          <Link href="/mon-compte/parametres/mot-de-passe" className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">{t('client.settings.changePassword')}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-gray-900">{t('client.settings.changeEmail')}</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-500">{maskedEmail}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          <Link href="/mon-compte/parametres/profil" className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">{t('client.settings.changePhone')}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5 hover:bg-red-50 transition-colors">
            <span className="text-sm text-red-600">{t('client.settings.deleteAccount')}</span>
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
