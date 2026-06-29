import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getServerT } from '@/lib/server-i18n';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DisputeForm } from '@/components/dispute-form';
import { InvoiceButton } from '@/components/invoice-button';
import { getPdfSettings } from '@/app/actions/quote-actions';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function CommandeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
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
  const type = resolvedSearch.type || 'sale';
  const collection = type === 'sale' ? 'sale_orders' : 'rental_orders';

  const doc = await adminDb.collection(collection).doc(resolvedParams.id).get();
  if (!doc.exists) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900 mb-1">{t('client.orderDetail.notFound')}</p>
          <Link href="/mon-compte/commandes" className="text-sm font-medium text-[#004ac6] hover:underline">
            {t('client.orderDetail.backToOrders')}
          </Link>
        </div>
      </div>
    );
  }

  const order = { id: doc.id, ...doc.data() } as any;
  if (order.customerId !== customerId) redirect('/mon-compte/commandes');

  const orderRef = order.id.slice(0, 8).toUpperCase();
  const unitPrice = order.productPrice || order.amountPaid / (order.quantity || 1);
  const subtotal = unitPrice * (order.quantity || 1);
  const pdfSettings = await getPdfSettings(true);

  return (
    <div className="p-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 mb-6 text-xs font-semibold tracking-wider uppercase text-gray-500">
        <Link href="/mon-compte/commandes" className="hover:text-gray-900 transition-colors">
          {t('client.orderDetail.breadcrumb')}
        </Link>
        <span className="text-gray-300 text-sm">/</span>
        <span className="text-gray-900">{orderRef}</span>
      </nav>

      {/* Success Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t('client.orderDetail.confirmedTitle')}</h2>
        <p className="text-sm text-gray-500">{t('client.orderDetail.confirmedMsg')}</p>
      </div>

      {/* Invoice Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm max-w-4xl mx-auto">
        {/* Invoice Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50/50">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500 mb-0.5">{t('client.orderDetail.transactionId')}</p>
            <p className="text-base font-semibold text-gray-900">TXN{orderRef}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ffdbcd] rounded text-[12px] font-semibold text-[#7d2d00] mb-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {t('client.orderDetail.paidViaPaypal')}
            </div>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Billing + Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 pb-1 border-b border-gray-200">
              {t('client.orderDetail.billingInfo')}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">{t('client.orderDetail.client')}</p>
                <p className="text-sm font-medium text-gray-900">{order.customerName || order.renterRepresentative || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">{t('client.orderDetail.email')}</p>
                <p className="text-sm text-gray-900">{order.customerEmail || order.renterEmail}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-500">{t('client.orderDetail.address')}</p>
                <p className="text-sm text-gray-900">
                  {order.customerAddress || order.renterAddress || '—'}<br />
                  {order.customerPostcode || ''} {order.customerCity || ''}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 pb-1 border-b border-gray-200">
              {t('client.orderDetail.paymentDetails')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">{t('client.orderDetail.orderNumber')}</p>
                <p className="text-sm font-semibold text-gray-900">ORD{orderRef}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">{t('client.orderDetail.method')}</p>
                <p className="text-sm text-gray-900">{t('client.orderDetail.paypalExpress')}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">{t('client.orderDetail.currency')}</p>
                <p className="text-sm text-gray-900">{t('client.orderDetail.eur')}</p>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Suivi</p>
                  <p className="text-sm font-semibold text-[#004ac6]">{order.trackingNumber}</p>
                </div>
              )}
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">{t('client.orderDetail.quantity')}</p>
                <p className="text-sm text-gray-900">{order.quantity || 1}</p>
              </div>
              {type === 'rental' && (
                <>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">{t('client.orderDetail.rentalStart')}</p>
                    <p className="text-sm text-gray-900">{order.rentalStartDate || '—'}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">{t('client.orderDetail.rentalEnd')}</p>
                    <p className="text-sm text-gray-900">{order.rentalEndDate || '—'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-gray-500">{t('client.orderDetail.product')}</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-gray-500 text-center">{t('client.orderDetail.quantity')}</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-gray-500 text-right">{t('client.orderDetail.unitPrice')}</th>
                  <th className="px-4 py-2.5 text-xs font-semibold tracking-wider uppercase text-gray-500 text-right">{t('client.orderDetail.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3">
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
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-[#004ac6] transition-colors">{order.productName}</p>
                          <p className="text-xs text-gray-500">
                            {type === 'rental' ? t('client.orderDetail.rental') : t('client.orderDetail.purchase')}
                            {order.status === 'commande' || order.status === 'pending_validation' ? ' — ' + t('client.orders.statusEnCours') : ''}
                          </p>
                        </div>
                      </Link>
                    </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">{order.quantity || 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatPrice(unitPrice)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatPrice(subtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-6 bg-gray-900 text-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-4">
            <div>
              <p className="text-xs opacity-70">{t('client.orderDetail.subtotal')}</p>
              <p className="text-sm">{formatPrice(subtotal)}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">{t('client.orderDetail.vat')}</p>
              <p className="text-sm">{formatPrice(subtotal * 0.2)}</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-xs opacity-70">{t('client.orderDetail.totalPaid')}</p>
            <p className="text-2xl font-semibold">{formatPrice(order.amountPaid)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center max-w-4xl mx-auto">
        <InvoiceButton
          pdfSettings={pdfSettings}
          data={{
            orderRef,
            customerName: order.customerName || order.renterRepresentative || '',
            customerEmail: order.customerEmail || order.renterEmail || '',
            customerAddress: order.customerAddress || order.renterAddress || '',
            customerPostcode: order.customerPostcode || '',
            customerCity: order.customerCity || '',
            productName: order.productName || '',
            quantity: order.quantity || 1,
            unitPrice,
            subtotal,
            vat: subtotal * 0.2,
            amountPaid: order.amountPaid || 0,
            createdAt: order.createdAt || '',
            type: type as 'sale' | 'rental',
            rentalStartDate: order.rentalStartDate,
            rentalEndDate: order.rentalEndDate,
          }}
        />
        <Link
          href="/boutique"
          className="w-full sm:w-auto px-6 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {t('client.orderDetail.backShopBtn')}
        </Link>
      </div>

      {/* Dispute */}
      <div className="mt-8 max-w-4xl mx-auto border-t border-gray-200 pt-6">
        <details className="group">
          <summary className="flex items-center gap-2 text-sm font-medium text-red-600 cursor-pointer hover:text-red-700 transition-colors list-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t('client.orderDetail.reportProblem')}
            <svg className="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <DisputeForm orderId={order.id} orderRef={orderRef} />
        </details>
      </div>

      {/* Trust Section */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto opacity-80">
        <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-xl flex flex-col items-center text-center">
          <svg className="w-7 h-7 text-[#003594] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('client.orderDetail.trustSecure')}</h4>
          <p className="text-xs text-gray-500">{t('client.orderDetail.trustSecureDesc')}</p>
        </div>
        <div className="p-4 bg-green-50/30 border border-gray-200 border-dashed rounded-xl flex flex-col items-center text-center">
          <svg className="w-7 h-7 text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('client.orderDetail.trustSupport')}</h4>
          <p className="text-xs text-gray-500">{t('client.orderDetail.trustSupportDesc')}</p>
        </div>
        <div className="p-4 bg-[#ffdbcd]/20 border border-gray-200 border-dashed rounded-xl flex flex-col items-center text-center">
          <svg className="w-7 h-7 text-[#7d2d00] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{t('client.orderDetail.trustCarbon')}</h4>
          <p className="text-xs text-gray-500">{t('client.orderDetail.trustCarbonDesc')}</p>
        </div>
      </div>
    </div>
  );
}
