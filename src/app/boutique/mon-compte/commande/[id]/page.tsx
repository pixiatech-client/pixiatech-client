import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, CalendarRange, Euro, Package, FileText } from 'lucide-react';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const saleStatusLabels: Record<string, string> = {
  commande: 'En préparation',
  archive: 'Archivé',
  corbeille: 'Corbeille',
};

const rentalStatusLabels: Record<string, string> = {
  pending_validation: 'En attente de validation',
  validated: 'Validée',
  shipped: 'Expédiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export default async function CommandeDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { type?: string } }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session')?.value;
  if (!sessionCookie) redirect('/boutique/mon-compte/connexion');

  let customerId = '';
  try {
    const payload = await decrypt(sessionCookie);
    customerId = payload.customerId;
  } catch {
    redirect('/boutique/mon-compte/connexion');
  }

  const { adminDb } = getFirebaseAdmin();
  const type = searchParams.type || 'sale';
  const collection = type === 'sale' ? 'sale_orders' : 'rental_orders';

  const doc = await adminDb.collection(collection).doc(params.id).get();
  if (!doc.exists) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Commande introuvable</h1>
          <Link href="/boutique/mon-compte/commandes" className="text-sm font-semibold text-gray-900 underline underline-offset-2">
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const order = { id: doc.id, ...doc.data() } as any;

  // Security check: make sure the order belongs to this customer
  if (order.customerId !== customerId) {
    redirect('/boutique/mon-compte/commandes');
  }

  const statusLabels = type === 'sale' ? saleStatusLabels : rentalStatusLabels;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b border-gray-200/60 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/boutique/mon-compte/commandes" className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Détail de la commande</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{order.productName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                    {type === 'rental' ? <CalendarRange className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                    {type === 'rental' ? 'Location' : 'Achat'}
                  </span>
                  <span className="text-sm text-gray-500">{statusLabels[order.status] || order.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Montant</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(order.amountPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantité</p>
                <p className="text-lg font-bold text-gray-900">{order.quantity}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date de commande</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Statut</p>
                <p className="text-sm font-semibold text-gray-900">{statusLabels[order.status] || order.status}</p>
              </div>
            </div>

            {type === 'rental' && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Début location</p>
                  <p className="text-sm font-semibold text-gray-900">{order.rentalStartDate || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fin location</p>
                  <p className="text-sm font-semibold text-gray-900">{order.rentalEndDate || '—'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-900">{order.customerEmail || order.renterEmail || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Adresse</p>
                <p className="text-sm font-semibold text-gray-900">{order.customerAddress || order.renterAddress || '—'}</p>
              </div>
              {type === 'rental' && order.renterCompany && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Société</p>
                  <p className="text-sm font-semibold text-gray-900">{order.renterCompany}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 p-6 flex justify-between">
            <Link href="/boutique/mon-compte/commandes" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              ← Retour aux commandes
            </Link>
            <Link href="/boutique" className="text-sm font-semibold text-gray-900 underline underline-offset-2">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
