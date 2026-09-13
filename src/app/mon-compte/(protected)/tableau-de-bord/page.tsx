import { getServerT } from '@/lib/server-i18n';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DashboardNotifications } from '@/components/client-notifications';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';
import { ClientStatCard } from '@/components/client-ui/client-stat-card';
import { ClientStatusBadge } from '@/components/client-ui/client-status-badge';
import { Package, Euro, CheckCircle2, Clock, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function TableauDeBordPage() {
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

  const [saleSnap, rentalSnap, customerSnap, disputesSnap] = await Promise.all([
    adminDb.collection('sale_orders').where('customerId', '==', customerId).get(),
    adminDb.collection('rental_orders').where('customerId', '==', customerId).get(),
    adminDb.collection('customers').doc(customerId).get(),
    adminDb.collection('disputes').where('customerId', '==', customerId).get(),
  ]);

  const saleOrders: any[] = saleSnap.docs.map(d => ({ id: d.id, type: 'sale', ...d.data() }));
  const rentalOrders: any[] = rentalSnap.docs.map(d => ({ id: d.id, type: 'rental', ...d.data() }));
  const allOrders = [...saleOrders, ...rentalOrders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const customer = customerSnap.exists ? customerSnap.data() : {};
  const disputes = (disputesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const totalOrders = allOrders.length;
  const totalSpent = allOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const deliveredCount = allOrders.filter(o => o.status === 'completed' || o.status === 'archive').length;
  const pendingCount = allOrders.filter(o => o.status === 'commande' || o.status === 'pending_validation' || o.status === 'validated' || o.status === 'shipped').length;
  const openDisputesCount = disputes.filter((d: any) => d.status === 'open' || d.status === 'in_progress').length;
  const recentOrders = allOrders.slice(0, 5);

  const displayName = (customer as any).displayName || customerEmail.split('@')[0];

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ClientPageHeader
        title={t('client.dashboard.greeting').replace('{name}', displayName)}
        subtitle={t('client.dashboard.subtitle')}
        icon={Package}
        online
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/mon-compte/parametres/profil"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
            >
              {t('client.dashboard.editProfile')}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/boutique"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm"
            >
              {t('client.dashboard.discoverShop')}
              <ArrowRight className="w-3.5 h-3.5 text-[#38E044]" />
            </Link>
          </div>
        }
      />

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClientStatCard
          label={t('client.dashboard.statsOrders')}
          value={totalOrders}
          icon={ShoppingBag}
          sub={`${deliveredCount} ${t('client.dashboard.statsDelivered')}`}
          subRight={<span className="text-emerald-600 font-medium">{pendingCount > 0 ? `${pendingCount} en cours` : 'À jour'}</span>}
        />
        <ClientStatCard
          label={t('client.dashboard.statsTotalSpent')}
          value={formatPrice(totalSpent)}
          icon={Euro}
          iconClassName="bg-emerald-50 text-emerald-700"
        />
        <ClientStatCard
          label={t('client.dashboard.statsDelivered')}
          value={deliveredCount}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-700"
          sub={`${totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 0}% des commandes`}
        />
        <ClientStatCard
          label={t('client.dashboard.statsInProgress')}
          value={pendingCount}
          icon={Clock}
          iconClassName="bg-sky-50 text-sky-700"
          sub={`${openDisputesCount} litige(s) en cours`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-neutral-900" />
                <h2 className="text-base font-bold text-neutral-900">{t('client.dashboard.recentOrders')}</h2>
              </div>
              {allOrders.length > 0 && (
                <Link href="/mon-compte/commandes" className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1 transition-colors">
                  {t('client.dashboard.viewAll')}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">{t('client.dashboard.emptyOrders')}</h3>
                <Link href="/boutique" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md mt-5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#38E044]" />
                  {t('client.dashboard.discoverShop')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {order.productImage ? (
                        <img src={order.productImage} alt="" className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200 shrink-0">
                          <Package className="w-5 h-5 text-neutral-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate group-hover:text-neutral-950 transition-colors">{order.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-neutral-400 font-medium">{formatDate(order.createdAt)}</span>
                          <span className="text-neutral-200">·</span>
                          <span className="text-[11px] text-neutral-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{formatPrice(order.amountPaid)}</p>
                        <div className="mt-1 flex justify-end">
                          <OrderBadge status={order.status} t={t} />
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
                {allOrders.length > 5 && (
                  <Link href="/mon-compte/commandes" className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-700 py-3.5 hover:bg-neutral-50/80 transition-colors">
                    {t('client.dashboard.seeAllOrders').replace('{count}', String(allOrders.length))}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications & Litiges */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6">
            <h3 className="text-base font-bold text-neutral-900 mb-4">{t('client.dashboard.notifications')}</h3>
            <DashboardNotifications
              customerId={customerId}
              disputes={disputes.map((d: any) => ({
                id: d.id,
                reason: d.reason,
                status: d.status,
                createdAt: d.createdAt,
                unreadByClient: d.unreadByClient,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderBadge({ status, t }: { status: string; t: (k: string) => string }) {
  if (status === 'completed' || status === 'archive') {
    return <ClientStatusBadge label={t('client.dashboard.statusDelivered')} tone="emerald" dot />;
  }
  if (status === 'cancelled' || status === 'corbeille') {
    return <ClientStatusBadge label={t('client.dashboard.statusCancelled')} tone="red" dot />;
  }
  return <ClientStatusBadge label={t('client.orders.statusEnCours')} tone="amber" dot />;
}