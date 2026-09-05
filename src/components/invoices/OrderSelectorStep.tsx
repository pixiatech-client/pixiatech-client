'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Package, AlertCircle, ArrowLeft, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchEligibleOrders, type EligibleOrder } from '@/services/invoiceService';
import { EmptyState } from '@/components/invoices/EmptyState';

interface OrderSelectorStepProps {
  selectedOrder: EligibleOrder | null;
  onSelectOrder: (order: EligibleOrder) => void;
  onBack: () => void;
  onContinue: () => void;
  refreshKey: number;
}

function formatEuro(n: number): string {
  return `${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function TypeBadge({ orderType }: { orderType: EligibleOrder['orderType'] }) {
  return orderType === 'sale' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#dbeafe] text-[#1d4ed8]">
      Vente
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#ede9fe] text-[#6d28d9]">
      Location
    </span>
  );
}

export function OrderSelectorStep({
  selectedOrder,
  onSelectOrder,
  onBack,
  onContinue,
  refreshKey,
}: OrderSelectorStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<EligibleOrder[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEligibleOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger vos commandes facturables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Recharge quand la clé refresh change (ex : commande devenue déjà facturée).
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
        <div className="mx-auto w-8 h-8 border-2 border-gray-200 border-t-[#004ac6] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Chargement de vos commandes facturables…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="mt-3 text-sm font-semibold text-gray-900">Impossible de charger vos commandes</p>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-5 inline-block bg-[#004ac6] text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="Aucune commande en attente de facturation"
        description="Vous n'avez aucune commande en attente de facturation. Toutes vos commandes ont déjà été facturées."
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[17px] font-semibold text-gray-900">Choix de la commande</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Sélectionnez la commande à facturer
            {orders.length > 0 && ` (${orders.length} ${orders.length > 1 ? 'commandes' : 'commande'} éligible${orders.length > 1 ? 's' : ''})`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const selected = selectedOrder?.orderId === order.orderId && selectedOrder?.orderType === order.orderType;
          return (
            <button
              key={`${order.orderType}-${order.orderId}`}
              type="button"
              onClick={() => onSelectOrder(order)}
              aria-pressed={selected}
              className={cn(
                'w-full text-left rounded-xl border bg-white p-4 sm:p-5 transition-all duration-200',
                selected
                  ? 'border-[#004ac6] bg-[#004ac6]/[0.03] ring-2 ring-[#004ac6]/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    selected ? 'border-[#004ac6]' : 'border-gray-300'
                  )}
                >
                  {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]" />}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge orderType={order.orderType} />
                    <span className="text-[12px] font-medium text-gray-400">
                      #{order.orderId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{order.productName}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {formatDate(order.createdAt)}
                        {(typeof order.quantity === 'number' && order.quantity > 1) && ` · Quantité : ${order.quantity}`}
                        {order.orderType === 'rental' && order.rentalStartDate && order.rentalEndDate && (
                          <>
                            {' · '}du {formatDate(order.rentalStartDate)} au {formatDate(order.rentalEndDate)}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[12px] text-gray-400 font-medium">Montant TTC</p>
                  <p className="text-[15px] font-bold text-gray-900 mt-0.5">{formatEuro(order.totalTtc)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedOrder}
          className="inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="h-4 w-4" />
          Continuer vers la facturation
        </button>
      </div>
    </div>
  );
}