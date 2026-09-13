'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, MapPin, MessageSquareWarning, PackageCheck, Truck } from 'lucide-react';
import type { ClientOrder, ClientOrderItem, ClientOrderTracker } from '../../types';
import { formatDate, formatMoney, formatMonthYear } from '../../lib/format';
import { SlidingSwitch } from '../SlidingSwitch';

interface OrdersViewProps {
  orders: ClientOrder[];
  ordersCount: number;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenDispute: (defaultOrderId?: string) => void;
}

type SubFilter = 'all' | 'sale' | 'rental';

function buildTracker(order: ClientOrder): ClientOrderTracker[] {
  const steps: ClientOrderTracker[] = [
    { hour: '', label: 'Commande confirmÃ©e', status: 'done' },
    { hour: '', label: 'En prÃ©paration', status: 'pending' },
    { hour: '', label: 'ExpÃ©diÃ©e', status: 'pending' },
    { hour: '', label: 'LivrÃ©e', status: 'pending' },
  ];
  if (order.statusKey === 'cancelled') {
    return [
      { hour: '', label: 'Commande confirmÃ©e', status: 'done' },
      { hour: '', label: 'AnnulÃ©e', status: 'active' },
    ];
  }
  if (order.statusKey === 'in_transit') {
    steps[1].status = 'done';
    steps[2].status = 'active';
  }
  if (order.statusKey === 'delivered') {
    steps[1].status = 'done';
    steps[2].status = 'done';
    steps[3].status = 'done';
  }
  return steps;
}

const COUNTRY_LABELS: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
  MC: 'Monaco',
  DE: 'Allemagne',
  ES: 'Espagne',
  IT: 'Italie',
  NL: 'Pays-Bas',
};

function OrderCard({ order, onOpenInvoice, onOpenDispute }: { order: ClientOrder; onOpenInvoice: (id: string) => void; onOpenDispute: (id?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const item = order.items[0];
  const tracker = buildTracker(order);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-neutral-50/60"
      >
        <OrderImage item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-neutral-900">{item?.title || order.number}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              order.type === 'sale' ? 'bg-neutral-100 text-neutral-600' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {order.kindLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            {order.number} Â· {formatDate(order.date)}
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-400">
            {order.itemCount} article{order.itemCount > 1 ? 's' : ''} Â· {formatMoney(order.totalTTC)}
            <span className="ml-2 text-neutral-300">Â·</span>
            <span className="ml-2">{order.statusLabel}</span>
          </p>
        </div>
        <ChevronDown size={18} className={`shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-neutral-100"
          >
            <div className="space-y-5 p-5">
              <ItemDetail item={item} />
              <DeliveryDetail order={order} item={item} />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDispute(order.id)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  <MessageSquareWarning size={14} /> Ouvrir un litige
                </button>
                {order.hasInvoice && order.invoiceId && (
                  <button
                    type="button"
                    onClick={() => onOpenInvoice(order.invoiceId!)}
                    className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    <FileTextIcon /> Voir ma facture
                  </button>
                )}
              </div>

              <div>
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutral-400">Statut de livraison</p>
                <div className="space-y-2">
                  {tracker.map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                        step.status === 'done'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : step.status === 'active'
                          ? 'border-amber-400 bg-amber-400 text-white'
                          : 'border-neutral-200 bg-white text-neutral-400'
                      }`}>
                        {step.status === 'done' ? 'âœ“' : step.status === 'active' ? 'â—' : 'â—¦'}
                      </span>
                      <span className={`text-xs ${
                        step.status === 'done' ? 'font-semibold text-neutral-900' : step.status === 'active' ? 'font-semibold text-amber-600' : 'text-neutral-400'
                      }`}>
                        {step.label}
                      </span>
                      {i === tracker.length - 1 && step.status === 'active' && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">En temps rÃ©el</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OrderImage({ item }: { item?: ClientOrderItem }) {
  if (item?.img) {
    return <img src={item.img} alt={item.title} className="size-14 shrink-0 rounded-xl border border-neutral-100 object-cover" />;
  }
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
      <PackageCheck size={22} />
    </span>
  );
}

function ItemDetail({ item }: { item?: ClientOrderItem }) {
  if (!item) return null;
  return (
    <div>
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutral-400">Produit</p>
      <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900">{item.title}</p>
            <p className="text-xs text-neutral-500">{item.subtitle}</p>
            {item.note && <p className="mt-1 text-xs text-neutral-500">{item.note}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-400">Prix unitaire HT</p>
            <p className="text-sm font-bold text-neutral-900">{formatMoney(item.unitPriceHT)}</p>
            <p className="text-xs text-neutral-500">Ã— {item.quantity}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          <span>Prix unitaire TTC : <b className="text-neutral-900">{formatMoney(item.unitPriceTTC)}</b></span>
          <span>TVA : <b className="text-neutral-900">{(item.vatRate * 100).toFixed(0).replace('.0', '')}%</b></span>
          {item.estimatedDeliveryDate && <span>Fin prÃ©vue : <b className="text-neutral-900">{formatDate(item.estimatedDeliveryDate)}</b></span>}
        </div>
      </div>
    </div>
  );
}

function DeliveryDetail({ order, item }: { order: ClientOrder; item?: ClientOrderItem }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-neutral-400">Livraison</p>
      <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
              <MapPin size={13} className="shrink-0 text-neutral-400" />
              <span className="truncate">{item?.deliveryAddress || 'Adresse non renseignÃ©e'}</span>
            </p>
            <p className="mt-0.5 pl-[22px] text-xs text-neutral-500">
              {item?.deliveryPostalCode} {item?.deliveryCity}
              {item?.deliveryCountry ? `, ${COUNTRY_LABELS[item.deliveryCountry] || item.deliveryCountry}` : ''}
            </p>
          </div>
          <div className="text-xs">
            <p className="font-semibold text-neutral-700">Frais de livraison</p>
            <p className="text-neutral-500">{item?.deliveryFees ? `${formatMoney(item.deliveryFees)} (TTC)` : 'Offerts'}</p>
          </div>
          {item?.trackingNumber && (
            <div className="text-xs">
              <p className="flex items-center gap-1.5 font-semibold text-neutral-700">
                <Truck size={13} className="text-neutral-400" /> Suivi
              </p>
              <p className="text-neutral-500">
                {item.carrier} Â· <b className="text-neutral-800">{item.trackingNumber}</b>
                {item.deliveryPinCode && <span> Â· Code : {item.deliveryPinCode}</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

export function OrdersView({ orders, ordersCount, onOpenInvoice, onOpenDispute }: OrdersViewProps) {
  const [subFilter, setSubFilter] = useState<SubFilter>('all');

  const totalSpent = orders.filter((o) => o.statusKey !== 'cancelled').reduce((sum, o) => sum + o.totalTTC, 0);

  const filtered = orders.filter((o) => (subFilter === 'all' ? true : o.type === subFilter));

  const groups = filtered.reduce<Array<{ key: string; label: string; orders: ClientOrder[] }>>((acc, order) => {
    const key = formatMonthYear(order.date) || 'Autres';
    let group = acc.find((g) => g.key === key);
    if (!group) {
      group = { key, label: key, orders: [] };
      acc.push(group);
    }
    group.orders.push(order);
    return acc;
  }, []);

  const canOpenDispute = orders.some((o) => o.statusKey === 'delivered');

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Mes commandes</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {ordersCount} commande{ordersCount > 1 ? 's' : ''} au total Â· {orders.filter((o) => o.statusKey === 'delivered').length} livrÃ©e(s),{' '}
            {orders.filter((o) => o.statusKey === 'in_transit').length} en cours d'acheminement
          </p>
        </div>

        <SlidingSwitch
          options={[
            { key: 'all', label: 'Tout' },
            { key: 'sale', label: 'Achats' },
            { key: 'rental', label: 'Locations' },
          ]}
          active={subFilter}
          onChange={(k) => setSubFilter(k as SubFilter)}
          className="max-w-xs"
        />

        {groups.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center shadow-xs">
            <p className="text-sm font-bold text-neutral-700">Aucune commande Ã  afficher</p>
            <p className="mt-1 text-sm text-neutral-500">Vos commandes apparaÃ®tront ici dÃ¨s leur validation.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-400">
                {group.label} Â· {group.orders.length}
              </p>
              <div className="space-y-4">
                {group.orders.map((order) => (
                  <OrderCard key={order.id} order={order} onOpenInvoice={onOpenInvoice} onOpenDispute={onOpenDispute} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Total dÃ©pensÃ©</p>
          <p className="mt-1 text-2xl font-extrabold text-neutral-900">{formatMoney(totalSpent)}</p>
          <p className="text-xs text-neutral-500">TTC, toutes commandes confondues</p>
          <button
            type="button"
            onClick={() => onOpenDispute()}
            disabled={!canOpenDispute}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={canOpenDispute ? '' : 'Un litige nÃ©cessite une commande livrÃ©e'}
          >
            <MessageSquareWarning size={16} /> Ouvrir un litige
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
          <p className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-400">
            <Clock size={13} /> Suivi de livraison
          </p>
          {orders.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune commande Ã  suivre.</p>
          ) : (
            <div className="space-y-4">
              {[...orders].slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <MessageSquareWarning size={15} className="hidden" />
                    <PackageCheck size={15} className="text-neutral-500" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{order.number}</p>
                    <p className="text-xs text-neutral-500">{order.statusLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}