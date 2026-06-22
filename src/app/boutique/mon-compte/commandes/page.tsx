import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, CalendarRange, Package, Euro, ArrowRight, LogOut } from 'lucide-react';

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
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getStatusLabel(type: string, status: string): string {
  if (type === 'sale') {
    const labels: Record<string, string> = { commande: 'En préparation', archive: 'Archivé', corbeille: 'Corbeille' };
    return labels[status] || status;
  }
  const labels: Record<string, string> = {
    pending_validation: 'En attente de validation',
    validated: 'Validée',
    shipped: 'Expédiée',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
}

export default async function CommandesPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/boutique/mon-compte/connexion');

  let customerId = '';
  let customerEmail = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
    customerEmail = payload.email;
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  const orders = await getCustomerOrders(customerId);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b border-gray-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Mon espace client</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{customerEmail}</span>
            <form action="/api/boutique/logout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Mes commandes</h2>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune commande pour le moment</p>
            <Link href="/boutique" className="mt-4 inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link key={order.id} href={`/boutique/mon-compte/commande/${order.id}?type=${order.type}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.productName}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Quantité : {order.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900">{formatPrice(order.amountPaid)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : order.status === 'shipped'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : order.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {order.type === 'rental' ? <CalendarRange className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {order.type === 'rental' ? 'Location' : 'Achat'}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">{getStatusLabel(order.type, order.status)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
