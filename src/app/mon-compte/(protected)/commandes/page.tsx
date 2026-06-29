import { getServerT } from '@/lib/server-i18n';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { OrderFilters } from '@/components/member-order-filters';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function statusConfig(t: (key: string) => string, type: string, status: string): { label: string; icon: string; bg: string; text: string } {
  const sale: Record<string, any> = {
    commande: { label: t('client.orders.statusEnCours'), icon: 'hourglass_empty', bg: 'bg-[#ffdbcd]', text: 'text-[#943700]' },
    archive: { label: t('client.orders.statusLivre'), icon: 'check_circle', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    corbeille: { label: t('client.orders.statusAnnule'), icon: 'cancel', bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]' },
  };
  const rental: Record<string, any> = {
    pending_validation: { label: t('client.orders.statusEnCours'), icon: 'hourglass_empty', bg: 'bg-[#ffdbcd]', text: 'text-[#943700]' },
    validated: { label: t('client.orders.statusEnCours'), icon: 'local_shipping', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    shipped: { label: t('client.orders.statusEnCours'), icon: 'local_shipping', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    completed: { label: t('client.orders.statusLivre'), icon: 'check_circle', bg: 'bg-green-100', text: 'text-green-700' },
    cancelled: { label: t('client.orders.statusAnnule'), icon: 'cancel', bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]' },
  };
  return (type === 'sale' ? sale : rental)[status] || { label: status, icon: 'help', bg: 'bg-[#eaeef2]', text: 'text-[#505f76]' };
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
          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t('client.orders.tableProduct')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t('client.orders.tableId')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t('client.orders.tableDate')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Suivi</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">{t('client.orders.tablePrice')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t('client.orders.tableStatus')}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">{t('client.orders.tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order: any) => {
                    const cfg = statusConfig(t, order.type, order.status);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link
                            href={`/boutique/produit/${order.productId}`}
                            className="flex items-center gap-3 group"
                          >
                            {order.productImage ? (
                              <img
                                src={order.productImage}
                                alt={order.productName}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-100 group-hover:border-gray-300 transition-colors"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 group-hover:text-[#004ac6] transition-colors">
                              {order.productName}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-gray-700">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {order.trackingNumber ? (
                            <span className="text-[13px] font-semibold text-[#004ac6]">{order.trackingNumber}</span>
                          ) : (
                            <span className="text-[13px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[14px] font-bold text-gray-900">{formatPrice(order.amountPaid)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated') && (
                              <span className="px-3 py-1.5 border border-red-400 text-red-400 text-[12px] font-semibold rounded-lg opacity-40 cursor-not-allowed">{t('client.orders.cancelBtn')}</span>
                            )}
                            <Link href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                              className="px-3 py-1.5 border border-gray-200 text-gray-600 text-[12px] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                              {t('client.orders.detailsBtn')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <span className="text-[13px] text-gray-500">{t('client.orders.pagination').replace('{count}', String(orders.length))}</span>
              <div className="flex items-center gap-2">
                <button className="p-1 border border-gray-200 rounded hover:bg-gray-100 transition-all disabled:opacity-50" disabled>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[12px] font-semibold text-gray-900 px-2">1</span>
                <button className="p-1 border border-gray-200 rounded hover:bg-gray-100 transition-all">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>

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
