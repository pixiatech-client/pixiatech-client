'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrackingLink } from '@/components/tracking/tracking-link'

interface Order {
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusConfig(type: string, status: string): { label: string; icon: string; bg: string; text: string } {
  const sale: Record<string, any> = {
    commande: { label: 'En cours', icon: 'hourglass_empty', bg: 'bg-[#ffdbcd]', text: 'text-[#943700]' },
    archive: { label: 'Livré', icon: 'check_circle', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    corbeille: { label: 'Annulé', icon: 'cancel', bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]' },
  }
  const rental: Record<string, any> = {
    pending_validation: { label: 'En cours', icon: 'hourglass_empty', bg: 'bg-[#ffdbcd]', text: 'text-[#943700]' },
    validated: { label: 'En cours', icon: 'local_shipping', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    shipped: { label: 'En cours', icon: 'local_shipping', bg: 'bg-[#d0e1fb]', text: 'text-[#38485d]' },
    completed: { label: 'Livré', icon: 'check_circle', bg: 'bg-green-100', text: 'text-green-700' },
    cancelled: { label: 'Annulé', icon: 'cancel', bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]' },
  }
  return (type === 'sale' ? sale : rental)[status] || { label: status, icon: 'help', bg: 'bg-[#eaeef2]', text: 'text-[#505f76]' }
}

function OrderBottomSheet({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
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
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <h3 className="text-lg font-semibold text-gray-900">Détails de la commande</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-5">
              {/* Product */}
              <div className="flex items-center gap-4">
                {order.productImage ? (
                  <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                    <Package className="w-6 h-6 text-gray-300" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{order.productName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Montant</p>
                  <p className="text-sm font-semibold text-gray-900">{order.amountPaid ? formatPrice(order.amountPaid) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{order.type === 'sale' ? 'Achat' : 'Location'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Statut</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Tracking */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Suivi</p>
                <TrackingLink trackingNumber={order.trackingNumber} carrier={order.carrier} />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {(order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated') && (
                  <span className="flex-1 text-center px-3 py-2.5 border border-red-400 text-red-400 text-sm font-semibold rounded-lg opacity-40 cursor-not-allowed">
                    Annuler
                  </span>
                )}
                <Link
                  href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                  className="flex-1 text-center px-3 py-2.5 bg-[#004ac6] text-white text-sm font-semibold rounded-lg hover:bg-[#003ea8] transition-colors"
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

interface OrdersTranslations {
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

export function MemberOrders({ orders, translations }: { orders: Order[]; translations: OrdersTranslations }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

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
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:border-gray-300 transition-colors"
            >
              {order.productImage ? (
                <img src={order.productImage} alt={order.productName} className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                  <Package className="w-5 h-5 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{order.productName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatPrice(order.amountPaid || 0)}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
            </button>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{translations.tableProduct}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{translations.tableId}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{translations.tableDate}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Suivi</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">{translations.tablePrice}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{translations.tableStatus}</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider text-right">{translations.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: any) => {
                const cfg = statusConfig(order.type, order.status)
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/boutique/produit/${order.productId}`}
                        className="flex items-center gap-3 group"
                      >
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 group-hover:border-gray-300 transition-colors"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 group-hover:text-[#004ac6] transition-colors">
                          {order.productName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[14px] text-gray-700">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <TrackingLink trackingNumber={order.trackingNumber} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[14px] font-bold text-gray-900">{formatPrice(order.amountPaid)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(order.status === 'commande' || order.status === 'pending_validation' || order.status === 'validated') && (
                          <span className="px-3 py-1.5 border border-red-400 text-red-400 text-[12px] font-semibold rounded-lg opacity-40 cursor-not-allowed">{translations.cancelBtn}</span>
                        )}
                        <Link href={`/mon-compte/commande/${order.id}?type=${order.type}`}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-[12px] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
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

        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <span className="text-[13px] text-gray-500">{translations.pagination.replace('{count}', String(orders.length))}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 border border-gray-200 rounded hover:bg-gray-100 transition-all disabled:opacity-50" disabled>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[12px] font-semibold text-gray-900 px-2">1</span>
            <button className="p-1 border border-gray-200 rounded hover:bg-gray-100 transition-all">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
