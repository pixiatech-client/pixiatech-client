import { getServerT } from '@/lib/server-i18n';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { OrderFilters } from '@/components/member-order-filters';
import { MemberOrders } from '@/components/member-orders';

async function getCustomerOrders(customerId: string) {
  const { adminDb } = getFirebaseAdmin();
  const [saleSnap, rentalSnap] = await Promise.all([
    adminDb.collection('sale_orders').where('customerId', '==', customerId).orderBy('createdAt', 'desc').get(),
    adminDb.collection('rental_orders').where('customerId', '==', customerId).orderBy('createdAt', 'desc').get(),
  ]);
  const saleOrders: any[] = saleSnap.docs.map(d => ({ id: d.id, type: 'sale' as const, ...d.data() }));
  const rentalOrders: any[] = rentalSnap.docs.map(d => ({ id: d.id, type: 'rental' as const, ...d.data() }));
  return [...saleOrders, ...rentalOrders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

export default async function CommandesPage() {
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

  const orders = await getCustomerOrders(customerId);
  const totalRevenue = orders.reduce((sum, o: any) => sum + (o.amountPaid || 0), 0);
  const deliveredCount = orders.filter((o: any) => o.status === 'completed' || o.status === 'archive').length;
  const deliveryRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;

  return (
    <div className="p-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-[24px] font-semibold tracking-tight text-gray-900">{t('client.orders.title')}</h2>
        <OrderFilters />
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-gray-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-[16px] font-semibold text-gray-900 mb-1">{t('client.orders.emptyTitle')}</p>
          <p className="text-[13px] text-gray-500 mb-6">{t('client.orders.emptyDesc')}</p>
          <Link href="/boutique" className="inline-block bg-[#004ac6] text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors">
            {t('client.orders.discoverShop')}
          </Link>
        </div>
      ) : (
        <>
          <MemberOrders orders={orders as any} t={t} />

          {/* Summary Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-900">{t('client.orders.cardTotalSpent')}</span>
                <svg className="w-5 h-5 text-[#004ac6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-[28px] font-semibold text-gray-900">{formatPrice(totalRevenue)}</span>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-1">
                <div className="bg-[#004ac6] h-full rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-900">{t('client.orders.cardDeliveryRate')}</span>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-semibold text-gray-900">{deliveryRate}%</span>
                <span className="text-[11px] font-medium text-gray-400">{t('client.orders.cardOptimized')}</span>
              </div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-4 w-full rounded-sm ${i <= Math.round(deliveryRate / 20) ? 'bg-green-500' : 'bg-gray-100'}`} />
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-gray-900">{t('client.orders.cardSupport')}</span>
                <svg className="w-5 h-5 text-[#943700]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-[28px] font-semibold text-gray-900">{t('client.orders.cardSupport')}</span>
              <Link href="/boutique" className="text-[13px] font-semibold text-[#004ac6] hover:underline">
                {t('client.orders.contactUs')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
