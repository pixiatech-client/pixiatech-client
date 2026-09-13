import { getServerT } from '@/lib/server-i18n';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { ClientOrdersView } from '@/components/client-orders-view';

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

  return (
    <ClientOrdersView orders={orders as any} translations={{
      tableProduct: t('client.orders.tableProduct'),
      tableId: t('client.orders.tableId'),
      tableDate: t('client.orders.tableDate'),
      tablePrice: t('client.orders.tablePrice'),
      tableStatus: t('client.orders.tableStatus'),
      tableActions: t('client.orders.tableActions'),
      cancelBtn: t('client.orders.cancelBtn'),
      detailsBtn: t('client.orders.detailsBtn'),
      pagination: t('client.orders.pagination'),
    }} />
  );
}
