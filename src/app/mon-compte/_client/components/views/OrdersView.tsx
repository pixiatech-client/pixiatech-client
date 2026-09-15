'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Tag,
  KeyRound,
  Search
} from 'lucide-react';
import type { Order, OrderItem, Invoice } from '../../types';
import { SlidingSwitch } from '../SlidingSwitch';
import { useProductCatalog } from '../../lib/useProductStatus';

interface OrdersViewProps {
  orders: Order[];
  invoices?: Invoice[];
  onOpenStore?: () => void;
  onOpenDisputeForOrder?: (order: Order) => void;
  onRequestInvoiceForOrder?: (order: Order) => void;
  onViewInvoiceDetails?: (invoice: Invoice) => void;
  onViewProductInStore?: (item: OrderItem) => void;
  onOpenDisputeModal?: (order: Order) => void;
  onOpenInvoiceModal?: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  invoices = [],
  onOpenStore = () => {},
  onOpenDisputeForOrder,
  onRequestInvoiceForOrder,
  onViewInvoiceDetails = () => {},
  onViewProductInStore,
  onOpenDisputeModal,
  onOpenInvoiceModal
}) => {
  const handleOpenDispute = (order: Order) => {
    if (onOpenDisputeForOrder) onOpenDisputeForOrder(order);
    else if (onOpenDisputeModal) onOpenDisputeModal(order);
  };

  const handleRequestInvoice = (order: Order) => {
    if (onRequestInvoiceForOrder) onRequestInvoiceForOrder(order);
    else if (onOpenInvoiceModal) onOpenInvoiceModal(order);
  };

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { getProductStatus } = useProductCatalog();

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'delivered' && order.status !== 'delivered') return false;
    if (filterStatus === 'in_transit' && order.status !== 'in_transit') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesNum = order.orderNumber.toLowerCase().includes(q);
      const matchesProduct = order.items.some((i) =>
        i.productName.toLowerCase().includes(q)
      );
      if (!matchesNum && !matchesProduct) return false;
    }
    return true;
  });

  return (
    <div id="pixiatech-orders-view" className="space-y-6">
      {/* 1. Header Card with Connect style icon badge */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0A0D0E] text-white flex items-center justify-center shrink-0 shadow-md">
            <Package className="w-6 h-6 text-[#38E044]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Mes Commandes
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Historique de vos achats certifiés, suivi des expéditions et gestion de vos demandes de factures.
            </p>
          </div>
        </div>

        {/* Action Button: Boutique */}
        <Link
          href="/boutique"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A0D0E] text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-[#38E044]" />
          <span>Accéder à la boutique</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
        </Link>
      </div>

      {/* 2. Controls & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SlidingSwitch
          options={[
            { id: 'all', label: 'Toutes les commandes', badge: orders.length },
            {
              id: 'in_transit',
              label: "En cours d'acheminement",
              badge: orders.filter((o) => o.status === 'in_transit').length
            },
            {
              id: 'delivered',
              label: 'Livrées',
              badge: orders.filter((o) => o.status === 'delivered').length
            }
          ]}
          activeId={filterStatus}
          onChange={setFilterStatus}
          size="sm"
        />

        {/* Search */}
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

      {/* 3. Orders List or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            Aucune commande pour le moment
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Votre historique de commande est actuellement vide. Découvrez nos équipements informatiques professionnels sur notre boutique en ligne.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#38E044]" />
            <span>Découvrir notre boutique</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const matchingInvoice = invoices.find((inv) => inv.orderId === order.id || inv.orderNumber === order.orderNumber);
            const invoiceStatus = matchingInvoice?.status || order.invoiceStatus;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-xs hover:border-neutral-300 transition-all space-y-5"
              >
                {/* Order Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-sm text-neutral-900">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-neutral-400">• Commandée le {order.date}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : order.status === 'in_transit'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {order.status === 'delivered'
                        ? '✓ Colis Livré'
                        : order.status === 'in_transit'
                        ? "🚚 En cours d'acheminement"
                        : '⏳ En préparation'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Invoice Action Button */}
                    {!matchingInvoice && !invoiceStatus ? (
                      <button
                        onClick={() => handleRequestInvoice(order)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Demander une facture pour cette commande"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#38E044]" />
                        <span>Demander une facture</span>
                      </button>
                    ) : invoiceStatus === 'EN ATTENTE' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Demande en attente</span>
                      </span>
                    ) : invoiceStatus === 'EN COURS' ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200">
                        <Clock className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                        <span>Traitement en cours</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => matchingInvoice && onViewInvoiceDetails(matchingInvoice)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors cursor-pointer"
                        title="Consulter et télécharger la facture définitive"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Facture disponible</span>
                      </button>
                    )}

                    {/* Dispute Button */}
                    <button
                      onClick={() => handleOpenDispute(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-neutral-200 hover:border-amber-300 text-neutral-600 hover:text-amber-800 text-xs font-medium transition-colors cursor-pointer"
                      title="Signaler une avarie ou un problème"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Litige</span>
                    </button>
                  </div>
                </div>

                {/* Products List in this Order */}
                <div className="space-y-4">
                  {order.items.map((item, idx) => {
                    const statusInfo = getProductStatus(item.productId, item.productName);

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-neutral-50/60 border border-neutral-100 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {statusInfo.href ? (
                            <Link
                              href={statusInfo.href}
                              className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-200 shrink-0 hover:opacity-85 transition-opacity"
                              title="Consulter la fiche produit sur la boutique"
                            >
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <div
                              className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100"
                              title="Produit indisponible"
                            >
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover grayscale opacity-70"
                              />
                            </div>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {statusInfo.href ? (
                                <Link
                                  href={statusInfo.href}
                                  className="text-left font-bold text-sm text-neutral-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5 group"
                                  title="Consulter la fiche produit sur la boutique"
                                >
                                  <span className="truncate">{item.productName}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-700 shrink-0" />
                                </Link>
                              ) : (
                                <span
                                  className="text-left font-bold text-sm text-neutral-600 inline-flex items-center gap-1.5 cursor-not-allowed"
                                  title="Ce produit n'est plus disponible dans le catalogue"
                                >
                                  <span className="truncate line-through decoration-neutral-300">{item.productName}</span>
                                </span>
                              )}

                              {statusInfo.label && (
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${statusInfo.badgeClass}`}
                                >
                                  {statusInfo.type === 'not_found' && <AlertCircle className="w-3 h-3 shrink-0" />}
                                  {statusInfo.type === 'out_of_stock' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                                  {statusInfo.type === 'unavailable' && <XCircle className="w-3 h-3 shrink-0" />}
                                  {statusInfo.type === 'available' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                                  <span>{statusInfo.label}</span>
                                </span>
                              )}
                            </div>

                            {item.productDescription && (
                              <p className="text-xs text-neutral-500 line-clamp-1">
                                {item.productDescription}
                              </p>
                            )}

                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                              <span>Quantité : <strong className="text-neutral-800">{item.quantity}</strong></span>
                              <span>•</span>
                              <span>Prix unitaire HT : <strong className="text-neutral-800 font-mono">{item.unitPriceHT.toFixed(2)} €</strong></span>
                              <span>•</span>
                              <span>TVA : <strong>{(item.vatRate * 100).toFixed(0)}%</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-neutral-900 font-mono">
                            {(item.unitPriceHT * item.quantity * (1 + item.vatRate)).toFixed(2)} € TTC
                          </div>
                          {statusInfo.href ? (
                            <Link
                              href={statusInfo.href}
                              className="text-[11px] text-emerald-700 hover:underline font-semibold mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Voir sur la boutique</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-[11px] text-red-500 font-semibold mt-0.5 inline-flex items-center gap-1 cursor-not-allowed">
                              <span>Non disponible</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Financial & Logistics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                  {/* Logistics info */}
                  <div className="p-3.5 rounded-2xl bg-neutral-100/50 border border-neutral-200/60 space-y-1.5">
                    <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Expédition {order.carrier}</span>
                    </div>
                    <div className="text-neutral-500 font-mono">
                      N° suivi : {order.trackingNumber}
                    </div>
                    <div className="text-neutral-500 flex items-center gap-1.5">
                      <KeyRound className="w-3 h-3 text-emerald-600" />
                      <span>Code PIN remise : <strong className="font-mono text-neutral-900 font-bold">{order.deliveryPinCode}</strong></span>
                    </div>
                    <div className="text-neutral-500">
                      Adresse : {order.deliveryAddress}
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="p-3.5 rounded-2xl bg-neutral-100/50 border border-neutral-200/60 space-y-1.5 text-neutral-600">
                    <div className="flex justify-between">
                      <span>Sous-total HT :</span>
                      <span className="font-mono text-neutral-900">{order.subtotalHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (20%) :</span>
                      <span className="font-mono text-neutral-900">{order.vatAmount.toFixed(2)} €</span>
                    </div>
                    {order.discountCode && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Code promo : {order.discountCode}
                        </span>
                        <span className="font-mono">-{order.discountAmount?.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-neutral-200 font-bold text-neutral-900 text-sm">
                      <span>Montant Total TTC :</span>
                      <span className="font-mono">{order.totalTTC.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
