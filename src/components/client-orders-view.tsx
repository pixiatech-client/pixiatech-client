'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Euro, Truck, LifeBuoy, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { ClientPageHeader } from '@/components/client-ui/client-page-header';
import { ClientStatCard } from '@/components/client-ui/client-stat-card';
import { ClientNavCapsule } from '@/components/client-ui/client-nav-capsule';
import { MemberOrders, type MemberOrder, type OrdersTranslations } from '@/components/member-orders';
import { OrderFilters } from '@/components/member-order-filters';

export function ClientOrdersView({
  orders,
  translations,
}: {
  orders: MemberOrder[];
  translations: OrdersTranslations;
}) {
  const { t } = useI18n();
  const [category, setCategory] = useState<'all' | 'sale' | 'rental'>('all');

  const saleCount = orders.filter((o) => o.type === 'sale').length;
  const rentalCount = orders.filter((o) => o.type === 'rental').length;

  const filteredOrders =
    category === 'all' ? orders : orders.filter((o) => o.type === category);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === 'completed' || o.status === 'archive').length;
  const deliveryRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;

  return (
    <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <ClientPageHeader
        title={t('client.orders.title')}
        subtitle={`${orders.length} commande(s) — achats & locations suivis en temps réel.`}
        icon={Package}
      />

      {orders.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <ClientNavCapsule
            items={[
              { id: 'all', label: 'Toutes', badge: orders.length },
              { id: 'sale', label: 'Achats', badge: saleCount },
              { id: 'rental', label: 'Locations', badge: rentalCount },
            ]}
            activeId={category}
            onChange={(id) => setCategory(id as 'all' | 'sale' | 'rental')}
          />
          <OrderFilters />
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <Package className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-neutral-900 mb-1">{t('client.orders.emptyTitle')}</p>
          <p className="text-sm text-neutral-500 mb-6">{t('client.orders.emptyDesc')}</p>
          <Link href="/boutique" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-md">
            {t('client.orders.discoverShop')}
            <ArrowRight className="w-3.5 h-3.5 text-[#38E044]" />
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-12 text-center">
          <p className="text-sm font-medium text-neutral-500">
            Aucune commande dans cette catégorie pour le moment.
          </p>
        </div>
      ) : (
        <>
          <MemberOrders orders={filteredOrders} translations={translations} />

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClientStatCard
              label={t('client.orders.cardTotalSpent')}
              value={formatPrice(totalRevenue)}
              icon={Euro}
              iconClassName="bg-emerald-50 text-emerald-700"
              sub={<ProgressBar value={100} className="bg-emerald-500" />}
            />
            <ClientStatCard
              label={t('client.orders.cardDeliveryRate')}
              value={`${deliveryRate}%`}
              icon={Truck}
              iconClassName="bg-emerald-50 text-emerald-700"
              sub={<span className="text-emerald-600 font-medium">{t('client.orders.cardOptimized')}</span>}
              subRight={<div className="flex gap-1">{bars(deliveryRate)}</div>}
            />
            <ClientStatCard
              label={t('client.orders.cardSupport')}
              value={t('client.orders.cardSupport')}
              icon={LifeBuoy}
              iconClassName="bg-amber-50 text-amber-700"
              sub={
                <Link href="/boutique" className="font-semibold text-neutral-700 hover:underline">
                  {t('client.orders.contactUs')}
                </Link>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <span className="block w-full bg-neutral-100 h-1.5 rounded-full mt-1">
      <span className={`block h-full rounded-full ${className}`} style={{ width: `${value}%` }} />
    </span>
  );
}

function bars(rate: number) {
  return [1, 2, 3, 4, 5].map((i) => (
    <span key={i} className={`h-4 w-full rounded-sm ${i <= Math.round(rate / 20) ? 'bg-emerald-500' : 'bg-neutral-100'}`} />
  ));
}
