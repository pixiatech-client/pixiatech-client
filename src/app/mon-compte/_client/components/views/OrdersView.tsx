'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Package,
  Search,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import type { ClientOrder, ClientOrderItem, ClientTab } from '../../types';
import { formatMoney, formatShortDate } from '../../lib/format';
import { SlidingSwitch } from '../SlidingSwitch';

interface OrdersViewProps {
  orders: ClientOrder[];
  ordersCount: number;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenDispute: (defaultOrderId?: string) => void;
  onNavigate: (tab: ClientTab) => void;
}

function statusChip(order: ClientOrder) {
  if (order.statusKey === 'delivered') {
    return {
      text: '✓ Colis Livré',
      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    };
  }
  if (order.statusKey === 'in_transit') {
    return {
      text: 'En cours d\'acheminement',
      cls: 'bg-sky-50 text-sky-700 border border-sky-200',
    };
  }
  if (order.statusKey === 'cancelled') {
    return { text: 'Annulée', cls: 'bg-red-50 text-red-600 border border-red-200' };
  }
  return { text: 'En préparation', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
}

function InvoiceAction({ order, onOpenInvoice, onNavigate }: { order: ClientOrder; onOpenInvoice: (id: string) => void; onNavigate: (tab: ClientTab) => void }) {
  if (order.hasInvoice && order.invoiceId) {
    return (
      <button
        onClick={() => onOpenInvoice(order.invoiceId!)}
        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors cursor-pointer"
        title="Consulter et télécharger la facture définitive"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Voir ma facture</span>
      </button>
    );
  }
  if (order.invoiceStatusLabel === 'En attente' || order.invoiceStatusLabel === 'En attente de validation') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        <span>Demande en attente</span>
      </span>
    );
  }
  if (order.invoiceStatusLabel === 'En cours') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
        <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
        <span>Traitement en cours</span>
      </span>
    );
  }
  return (
    <button
      onClick={() => onNavigate('invoices')}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
      title="Demander une facture pour cette commande"
    >
      <FileText className="w-3.5 h-3.5 text-[#38E044]" />
      <span>Demander une facture</span>
    </button>
  );
}

export function OrdersView({ orders, ordersCount, onOpenInvoice, onOpenDispute, onNavigate }: OrdersViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'delivered' && order.statusKey !== 'delivered') return false;
    if (filterStatus === 'in_transit' && order.statusKey !== 'in_transit') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesNum = order.number.toLowerCase().includes(q);
      const matchesProduct = order.items.some((i) => i.title.toLowerCase().includes(q));
      if (!matchesNum && !matchesProduct) return false;
    }
    return true;
  });

  return (
    <div id="pixiatech-orders-view" className="space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <Package className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Mes Commandes</h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              {ordersCount} commande{ordersCount > 1 ? 's' : ''} au total ·{' '}
              {orders.filter((o) => o.statusKey === 'delivered').length} livrée(s),{' '}
              {orders.filter((o) => o.statusKey === 'in_transit').length} en cours d'acheminement
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
          title="Retour au tableau de bord"
        >
          <ShoppingBag className="w-4 h-4 text-[#38E044]" />
          <span>Accéder à la boutique</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SlidingSwitch
          options={[
            { id: 'all', label: 'Toutes les commandes', badge: orders.length },
            {
              id: 'in_transit',
              label: 'En cours d\'acheminement',
              badge: orders.filter((o) => o.statusKey === 'in_transit').length,
            },
            {
              id: 'delivered',
              label: 'Livrées',
              badge: orders.filter((o) => o.statusKey === 'delivered').length,
            },
          ]}
          activeId={filterStatus}
          onChange={setFilterStatus}
          size="sm"
        />

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par n° ou produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-neutral-200/90 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Aucune commande pour le moment</h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Votre historique de commande est actuellement vide. Découvrez nos équipements informatiques professionnels sur
            notre boutique en ligne.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#38E044]" />
            <span>Découvrir notre boutique</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const chip = statusChip(order);
            return (
              <div key={order.id} className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs hover:border-neutral-300 transition-all space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-neutral-900">{order.number}</span>
                      <span className="text-xs text-neutral-400">• Commandée le {formatShortDate(order.date)}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${chip.cls}`}>
                      {chip.text}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {order.kindLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <InvoiceAction order={order} onOpenInvoice={onOpenInvoice} onNavigate={onNavigate} />
                    <button
                      onClick={() => onOpenDispute(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-neutral-200 hover:border-amber-300 text-neutral-600 hover:text-amber-800 text-xs font-medium transition-colors cursor-pointer"
                      title="Signaler une avarie ou un problème"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Litige</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <OrderItemRow key={item.id || idx} item={item} />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  <OrderLogistics item={order.items[0]} />
                  <OrderFinance order={order} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderItemRow({ item }: { item: ClientOrderItem }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-neutral-50/60 border border-neutral-100 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        {item.img ? (
          <img src={item.img} alt={item.title} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 shrink-0" />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0">
            <Package className="w-7 h-7" />
          </span>
        )}
        <div className="min-w-0">
          <div className="text-left font-bold text-sm text-neutral-900 line-clamp-1">{item.title}</div>
          {item.subtitle && <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{item.subtitle}</p>}
          {item.note && <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{item.note}</p>}
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
            <span>
              Quantité : <strong className="text-neutral-800">{item.quantity}</strong>
            </span>
            <span>•</span>
            <span>
              Prix unitaire HT : <strong className="text-neutral-800 font-mono">{formatMoney(item.unitPriceHT)}</strong>
            </span>
            <span>•</span>
            <span>
              TVA : <strong>{(item.vatRate * 100).toFixed(0)}%</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-extrabold text-neutral-900 font-mono">
          {formatMoney(item.unitPriceHT * item.quantity * (1 + item.vatRate))} TTC
        </div>
        <div className="text-[11px] text-neutral-400 mt-0.5">ligne HT : {formatMoney(item.unitPriceHT * item.quantity)}</div>
      </div>
    </div>
  );
}

function OrderLogistics({ item }: { item?: ClientOrderItem }) {
  return (
    <div className="p-3.5 rounded-2xl bg-neutral-100/50 border border-neutral-200/60 space-y-1.5">
      <div className="font-bold text-neutral-800 flex items-center gap-1.5">
        <Truck className="w-3.5 h-3.5 text-neutral-600" />
        <span>Expédition {item?.carrier || 'à définir'}</span>
      </div>
      {item?.trackingNumber ? (
        <div className="text-neutral-500 font-mono">
          N° suivi : <strong className="text-neutral-800">{item.trackingNumber}</strong>
          {item.deliveryPinCode && (
            <span className="ml-2 not-mono text-emerald-700">· Code PIN : {item.deliveryPinCode}</span>
          )}
        </div>
      ) : (
        <div className="text-neutral-500">Suivi non disponible pour le moment.</div>
      )}
      <div className="text-neutral-500">
        Adresse : {item?.deliveryAddress || 'Adresse non renseignée'}
        {item?.deliveryCity ? `, ${item.deliveryPostalCode} ${item.deliveryCity}` : ''}
      </div>
    </div>
  );
}

function OrderFinance({ order }: { order: ClientOrder }) {
  return (
    <div className="p-3.5 rounded-2xl bg-neutral-100/50 border border-neutral-200/60 space-y-1.5 text-neutral-600">
      <div className="flex justify-between">
        <span>Sous-total HT :</span>
        <span className="font-mono text-neutral-900">{formatMoney(order.totalHT)}</span>
      </div>
      <div className="flex justify-between">
        <span>TVA :</span>
        <span className="font-mono text-neutral-900">{formatMoney(order.totalVAT)}</span>
      </div>
      <div className="flex justify-between pt-1.5 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
        <span>Montant Total TTC :</span>
        <span className="font-mono">{formatMoney(order.totalTTC)}</span>
      </div>
    </div>
  );
}