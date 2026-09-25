'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrackingLink } from '@/components/tracking/tracking-link'

export interface MemberOrder {
  id: string
  type: 'sale' | 'rental'
  productId?: string
  productName?: string
  productImage?: string
  createdAt: string
  amountPaid?: number
  status: string
  trackingNumber?: string | null
  carrier?: number
}

export interface OrdersTranslations {
  tableProduct: string
  tableId: string
  tableDate: string
  tablePrice: string
  tableStatus: string
  tableActions: string
  cancelBtn: string
  detailsBtn: string
  pagination: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusConfig(type: string, status: string): { label: string; bg: string; text: string; border: string } {
  const sale: Record<string, any> = {
    commande: { label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    archive: { label: 'Livré', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    corbeille: { label: 'Annulé', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  }
  const rental: Record<string, any> = {
    pending_validation: { label: 'En cours', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    validated: { label: 'En cours', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    shipped: { label: 'En cours', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    completed: { label: 'Livré', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    cancelled: { label: 'Annulé', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  }
  return (type === 'sale' ? sale : rental)[status] || { label: status, bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' }
}

function OrderBottomSheet({ order, open, onClose }: { order: MemberOrder | null; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open || !order) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, order])

  if (!order) return null

  const cfg = statusConfig(order.type, order.status)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-2xl z-50 flex flex-col rounded-t-3xl max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 shrink-0">
              <div className="w-8 h-1 rounded-full bg-neutral-300 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <h3 className="text-lg font-bold text-neutral-900">Détails de la commande</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-5">
              {/* Product */}
              <div className="flex items-center gap-4">
                {order.productImage ? (
                  <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
                    <Package className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-neutral-900">{order.productName}</p>
                  <p className="text-sm text-neutral-500 mt-0.5 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="h-px bg-neutral-100" />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Date</p>
                  <p className="text-sm font-semibold text-neutral-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Montant</p>
                  <p className="text-sm font-bold text-neutral-900">{order.amountPaid ? formatPrice(order.amountPaid) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Type</p>
                  <p className="text-sm font-semibold text-neutral-900 capitalize">{order.type === 'sale' ? 'Achat' : 'Location'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Statut</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="h-px bg-neutral-100" />

              {/* Tracking */}
              <div>
                <p className="text-xs text-neutral-500 mb-2">Suivi</p>
                <TrackingLink trackingNumber={order.trackingNumber} carrier={order.carrier} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {(order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated') && (
                  <span className="flex-1 text-center px-3 py-2.5 border border-neutral-300 text-neutral-400 text-sm font-semibold rounded-xl cursor-not-allowed">
                    Annuler
                  </span>
                )}
                <Link
                  href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                  className="flex-1 text-center px-3 py-2.5 bg-[#0A0D0E] text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Voir les détails
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function MemberOrders({ orders, translations }: { orders: MemberOrder[]; translations: OrdersTranslations }) {
  const [selectedOrder, setSelectedOrder] = useState<MemberOrder | null>(null)

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => {
          const cfg = statusConfig(order.type, order.status)
          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full text-left bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3 hover:border-neutral-300 transition-colors shadow-xs"
            >
              {order.productImage ? (
                <img src={order.productImage} alt={order.productName} className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200 shrink-0">
                  <Package className="w-5 h-5 text-neutral-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">{order.productName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-700">{formatPrice(order.amountPaid || 0)}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300 shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">{translations.tableProduct}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">{translations.tableId}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">{translations.tableDate}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">Suivi</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider text-right">{translations.tablePrice}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider">{translations.tableStatus}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-neutral-500 uppercase tracking-wider text-right">{translations.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order: any) => {
                const cfg = statusConfig(order.type, order.status)
                return (
                  <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/boutique/produit/${order.productId}`}
                        className="flex items-center gap-3 group"
                      >
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-200 group-hover:border-neutral-300 transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
                            <Package className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950 transition-colors">
                          {order.productName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-neutral-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-neutral-700">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <TrackingLink trackingNumber={order.trackingNumber} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[14px] font-bold text-neutral-900">{formatPrice(order.amountPaid)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated') && (
                          <span className="px-3 py-1.5 border border-neutral-300 text-neutral-400 text-[12px] font-semibold rounded-xl cursor-not-allowed">{translations.cancelBtn}</span>
                        )}
                        <Link href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                          className="px-3 py-1.5 border border-neutral-200 text-neutral-600 text-[12px] font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
                        >
                          {translations.detailsBtn}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <span className="text-[13px] text-neutral-500">{translations.pagination.replaceAll('{count}', String(orders.length))}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-all disabled:opacity-50" disabled>
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[12px] font-semibold text-neutral-900 px-2">1</span>
            <button className="p-1 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-all">
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Order detail bottom sheet */}
      <OrderBottomSheet
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  )
}
