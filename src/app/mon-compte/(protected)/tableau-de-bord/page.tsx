import { getServerT } from '@/lib/server-i18n';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DashboardNotifications } from '@/components/client-notifications';
import { ProfileButton } from '@/components/profile-button';
import { Package, Euro, CheckCircle2, Clock, ChevronRight, ShoppingBag } from 'lucide-react';

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

  const stats = [
    { label: t('client.dashboard.statsOrders'), icon: ShoppingBag, color: 'from-blue-500/10 via-blue-500/5 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
    { label: t('client.dashboard.statsTotalSpent'), icon: Euro, color: 'from-emerald-500/10 via-emerald-500/5 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
    { label: t('client.dashboard.statsDelivered'), icon: CheckCircle2, color: 'from-green-500/10 via-green-500/5 to-transparent', border: 'border-green-500/20', iconBg: 'bg-green-500/20', iconColor: 'text-green-600', textColor: 'text-green-700' },
    { label: t('client.dashboard.statsInProgress'), icon: Clock, color: 'from-orange-500/10 via-orange-500/5 to-transparent', border: 'border-orange-500/20', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-600', textColor: 'text-orange-700' },
  ];

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
  const recentOrders = allOrders.slice(0, 5);
  const statValues = [totalOrders, formatPrice(totalSpent), deliveredCount, pendingCount];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('client.dashboard.greeting').replace('{name}', customer.displayName || customerEmail.split('@')[0])}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{t('client.dashboard.subtitle')}</p>
        </div>
        <ProfileButton>
          {t('client.dashboard.editProfile')}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </ProfileButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-2xl border ${stat.border} p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
          >
            <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 opacity-[0.08]">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${statValues[i] === pendingCount && pendingCount > 0 ? '' : 'text-gray-900'}`}
               style={statValues[i] === pendingCount && pendingCount > 0 ? { color: '#c2410c' } : undefined}>
              {statValues[i]}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold tracking-tight text-gray-900">{t('client.dashboard.recentOrders')}</h3>
            {allOrders.length > 0 && (
              <Link href="/mon-compte/commandes" className="text-[13px] font-semibold text-[#004ac6] hover:text-[#0035a0] transition-colors">
                {t('client.dashboard.viewAll')}
              </Link>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200/60 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-5">{t('client.dashboard.emptyOrders')}</p>
              <Link href="/boutique" className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-black/10">
                <ShoppingBag className="w-4 h-4" />
                {t('client.dashboard.discoverShop')}
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden divide-y divide-gray-100">
              {recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {order.productImage ? (
                      <img src={order.productImage} alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100 shrink-0">
                        <Package className="w-4.5 h-4.5 text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#004ac6] transition-colors">{order.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-medium">{formatDate(order.createdAt)}</span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[11px] text-gray-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4 flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(order.amountPaid)}</p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg mt-0.5 ${
                        order.status === 'completed' || order.status === 'archive' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' || order.status === 'corbeille' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status === 'completed' || order.status === 'archive' ? t('client.dashboard.statusDelivered') :
                         order.status === 'cancelled' || order.status === 'corbeille' ? t('client.dashboard.statusCancelled') : t('client.orders.statusEnCours')}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
              {allOrders.length > 5 && (
                <Link href="/mon-compte/commandes" className="flex items-center justify-center gap-2 text-sm font-semibold text-[#004ac6] py-3.5 hover:bg-gray-50/80 transition-colors">
                  {t('client.dashboard.seeAllOrders').replace('{count}', String(allOrders.length))}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Notifications & Disputes */}
        <div>
          <h3 className="text-base font-bold tracking-tight text-gray-900 mb-5">{t('client.dashboard.notifications')}</h3>
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
            <DashboardNotifications
              customerId={customerId}
              disputes={disputes.map(d => ({
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
