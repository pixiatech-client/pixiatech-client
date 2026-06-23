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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
            className="px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-all"
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
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm text-gray-900">{t('client.settings.connectedAccounts')}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
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
