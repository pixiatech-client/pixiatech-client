import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getServerT } from '@/lib/server-i18n';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings, ChevronRight, User, Lock, PencilLine, AtSign, Trash2 } from 'lucide-react';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';

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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ClientPageHeader
        title={t('client.settings.title')}
        subtitle={t('client.settings.accountInfo')}
        icon={Settings}
      />

      {/* Informations du compte */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A0D0E] flex items-center justify-center">
              <User className="w-4 h-4 text-[#38E044]" />
            </div>
            <span className="text-base font-bold text-neutral-900">{t('client.settings.accountInfo')}</span>
          </div>
          <Link
            href="/mon-compte/parametres/profil"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0D0E] text-white text-[13px] font-semibold rounded-xl hover:bg-black transition-all"
          >
            <PencilLine className="w-3.5 h-3.5 text-[#38E044]" />
            {t('client.settings.editProfile')}
          </Link>
        </div>
        <div className="divide-y divide-neutral-100">
          <Link href="/mon-compte/parametres/profil" className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors">
            <span className="text-sm font-medium text-neutral-900">{t('client.settings.myProfile')}</span>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm font-medium text-neutral-500">{t('client.settings.memberProfile')}</span>
            <ChevronRight className="w-4 h-4 text-neutral-200" />
          </div>
          <Link href="/mon-compte/parametres/informations-fiscales" className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors">
            <span className="text-sm font-medium text-neutral-900">{t('client.settings.fiscalInfo')}</span>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </Link>
        </div>
      </div>

      {/* Sécurité du compte */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl bg-[#0A0D0E] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[#38E044]" />
          </div>
          <span className="text-base font-bold text-neutral-900">{t('client.settings.security')}</span>
        </div>
        <div className="divide-y divide-neutral-100">
          <Link href="/mon-compte/parametres/mot-de-passe" className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors">
            <span className="text-sm font-medium text-neutral-900">{t('client.settings.changePassword')}</span>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5">
            <span className="text-sm font-medium text-neutral-500">{t('client.settings.changeEmail')}</span>
            <div className="flex items-center gap-2 text-neutral-400 font-mono text-[13px]">
              <AtSign className="w-3.5 h-3.5" />
              {maskedEmail}
            </div>
          </div>
          <Link href="/mon-compte/parametres/profil" className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors">
            <span className="text-sm font-medium text-neutral-900">{t('client.settings.changePhone')}</span>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </Link>
          <div className="flex items-center justify-between px-6 py-3.5 hover:bg-red-50 transition-colors">
            <span className="flex items-center gap-2 text-sm font-medium text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
              {t('client.settings.deleteAccount')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
