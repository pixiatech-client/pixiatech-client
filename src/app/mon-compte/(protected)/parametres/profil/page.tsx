import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getServerT } from '@/lib/server-i18n';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProfileEditForm } from '@/components/profile-edit-form';
import { ArrowLeft } from 'lucide-react';

export default async function EditProfilPage() {
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
  const customer = customerSnap.exists ? (customerSnap.data() as any) : {};

  return (
    <div className="relative bg-[#f8f9fa] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.05),transparent_22%)]" />
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/mon-compte/parametres"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('client.profile.title')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t('client.profile.subtitle')}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-md">
                <span className="text-xl font-bold">
                  {((customer.displayName || customerEmail || '?')[0] || '?').toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{customer.displayName || 'Vous'}</p>
                <p className="text-sm text-slate-500">{customerEmail}</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
            <ProfileEditForm
              customerId={customerId}
              customerEmail={customerEmail}
              initialData={{
                displayName: customer.displayName || '',
                phone: customer.phone || '',
                companyName: customer.companyName || '',
                companyAddress: customer.companyAddress || '',
                country: customer.country || '',
                city: customer.city || '',
                state: customer.state || '',
                zipCode: customer.zipCode || '',
                officePhone: customer.officePhone || '',
                companyEmail: customer.companyEmail || '',
                position: customer.position || '',
                employees: customer.employees || '',
                website: customer.website || '',
                fax: customer.fax || '',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
