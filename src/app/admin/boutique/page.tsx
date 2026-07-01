'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, ShoppingBag, Package, AlertTriangle, EyeOff, Search,
  RefreshCw, SlidersHorizontal, X, ChevronDown,
  ImageOff, CircleDollarSign, Building2, Users, Timer, Box,
  Euro, RotateCcw, Trash2, Archive, Eye,
  CalendarRange, Check, Loader2, User, Clock, Send, Phone, MessageSquare,
  DollarSign, ExternalLink, Truck,
} from 'lucide-react';
import { getSaleOrders, updateSaleOrder, deleteSaleOrder, type SaleOrder, type SaleStatus } from '@/lib/sale-orders';
import { getRentalOrders, updateRentalOrder, type RentalOrder, type RentalStatus } from '@/lib/rental-orders';
import { formatPrice } from '@/lib/boutique-data';
import { normalizeSearchText } from '@/lib/utils';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { TrackingDetailDrawer } from '@/components/tracking/tracking-detail-drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { listQuoteRequests, updateQuoteRequest } from '@/lib/quote-requests-service';
import type { QuoteRequest, QuoteRequestStatus } from '@/lib/quote-requests';

type Mode = 'vente' | 'location' | 'sur-commande';

const saleStatusLabels: Record<SaleStatus, string> = {
  commande: 'Commande',
  archive: 'Archivé',
  corbeille: 'Corbeille',
};

const saleStatusColors: Record<SaleStatus, string> = {
  commande: 'bg-blue-100 text-blue-700 border-blue-200',
  archive: 'bg-gray-100 text-gray-600 border-gray-200',
  corbeille: 'bg-red-100 text-red-700 border-red-200',
};

const rentalStatusLabels: Record<RentalStatus, string> = {
  pending_validation: 'En attente',
  validated: 'Validée',
  shipped: 'Expédiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const rentalStatusColors: Record<RentalStatus, string> = {
  pending_validation: 'bg-amber-100 text-amber-700 border-amber-200',
  validated: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const rentalMainStatuses: RentalStatus[] = ['pending_validation', 'validated', 'shipped', 'completed', 'cancelled'];

const quoteStatusLabels: Record<QuoteRequestStatus, string> = {
  pending_supplier: 'En attente fournisseur',
  offer_sent: 'Offre envoyée',
  accepted: 'Accepté',
  declined: 'Refusé',
  expired: 'Expiré',
  awaiting_delivery: 'En attente de livraison',
};

const quoteStatusColors: Record<QuoteRequestStatus, string> = {
  pending_supplier: 'bg-amber-100 text-amber-700 border-amber-200',
  offer_sent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-700 border-gray-200',
  awaiting_delivery: 'bg-blue-100 text-blue-700 border-blue-200',
};

function DetailModal({ open, onClose, order, mode }: {
  open: boolean;
  onClose: () => void;
  order: SaleOrder | RentalOrder | null;
  mode: Mode;
}) {
  const [trackingInput, setTrackingInput] = useState(order?.trackingNumber || '');
  const [trackingDrawerOpen, setTrackingDrawerOpen] = useState(false);

  useEffect(() => {
    setTrackingInput(order?.trackingNumber || '');
  }, [order?.trackingNumber]);

  if (!order) return null;

  const isSale = mode === 'vente';
  const s = order as SaleOrder;
  const r = order as RentalOrder;

  const handleSaveTracking = async () => {
    if (!order.id) return;
    try {
      if (isSale) {
        await updateSaleOrder(order.id, { trackingNumber: trackingInput });
      } else {
        await updateRentalOrder(order.id, { trackingNumber: trackingInput });
      }
      toast.success('Numéro de suivi mis à jour');
    } catch (err) {
      console.error('Failed to save tracking number:', err);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const statusLabel = isSale
    ? saleStatusLabels[order.status as SaleStatus] || order.status
    : rentalStatusLabels[order.status as RentalStatus] || order.status;

  const statusColor = isSale
    ? saleStatusColors[order.status as SaleStatus] || 'bg-gray-100 text-gray-600'
    : rentalStatusColors[order.status as RentalStatus] || 'bg-gray-100 text-gray-600';

  const isPending = order.status === 'commande' || order.status === 'pending_validation';
  const orderIdShort = order.id ? `#${order.id.slice(0, 8)}` : '';

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto p-0">
        <SheetTitle className="sr-only">Détails de la commande</SheetTitle>
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Détails de la commande</h3>
              <p className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">{orderIdShort}</p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-6">

          {/* PRODUIT */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Produit</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {order.productImage ? (
                    <img src={order.productImage} alt={order.productName} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{order.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-slate-400">Qté: {order.quantity}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-medium text-slate-400">{formatPrice(order.amountPaid)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CLIENT / LOCATAIRE */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {isSale ? <Building2 className="w-4 h-4 text-slate-400" /> : <User className="w-4 h-4 text-slate-400" />}
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {isSale ? 'Client' : 'Locataire'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                  {isSale ? <Building2 className="w-4 h-4 text-slate-500" /> : <User className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {isSale ? 'Nom' : 'Société'}
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {isSale ? (s.customerName || 'Non renseigné') : (r.renterCompany || 'Non renseigné')}
                  </p>
                </div>
              </div>
              {!isSale && r.renterRepresentative && (
                <>
                  <div className="h-px bg-slate-200/60" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Représentant</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{r.renterRepresentative}</p>
                    </div>
                  </div>
                </>
              )}
              <div className="h-px bg-slate-200/60" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {isSale ? (s.customerEmail || 'Non renseigné') : (r.renterEmail || 'Non renseigné')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Téléphone</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {isSale ? (s.customerPhone || 'Non renseigné') : (r.renterPhone || 'Non renseigné')}
                    </p>
                  </div>
                </div>
              </div>
              {(isSale ? s.customerAddress : r.renterAddress) && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adresse</p>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {isSale
                        ? `${s.customerAddress}${s.customerCity ? `, ${s.customerCity} ${s.customerPostcode || ''}` : ''}`
                        : `${r.renterAddress}${r.renterCity ? `, ${r.renterCity} ${r.renterPostcode || ''}` : ''}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COMMANDE / LOCATION */}
          {isSale ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Commande</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Type</p>
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-extrabold text-emerald-600">Vente</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Montant</p>
                    <p className="text-xs font-extrabold text-blue-600">{formatPrice(order.amountPaid)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">PayPal ID</p>
                  <p className="text-xs font-bold text-slate-700 font-mono truncate">{order.paypalOrderId || '-'}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date de commande</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`bg-white rounded-xl p-3 border ${isPending ? 'border-amber-200/60 bg-amber-50/50' : 'border-slate-200/60'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Statut actuel</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {isPending && <Clock className="w-5 h-5 text-amber-400" />}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarRange className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Location</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Type</p>
                    <div className="flex items-center gap-1.5">
                      <CalendarRange className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-xs font-extrabold text-violet-600">Location</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Montant</p>
                    <p className="text-xs font-extrabold text-blue-600">{formatPrice(order.amountPaid)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Début</p>
                    <p className="text-xs font-bold text-slate-700">{r.rentalStartDate}</p>
                    <p className="text-[10px] text-slate-500">{r.rentalStartTime}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Fin</p>
                    <p className="text-xs font-bold text-slate-700">{r.rentalEndDate}</p>
                    <p className="text-[10px] text-slate-500">{r.rentalEndTime}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">PayPal ID</p>
                  <p className="text-xs font-bold text-slate-700 font-mono truncate">{order.paypalOrderId || '-'}</p>
                </div>
                {r.additionalNotes && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Notes</p>
                    <p className="text-xs font-bold text-slate-700">{r.additionalNotes}</p>
                  </div>
                )}
                <div className={`bg-white rounded-xl p-3 border ${isPending ? 'border-amber-200/60 bg-amber-50/50' : 'border-slate-200/60'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Statut actuel</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    {isPending && <Clock className="w-5 h-5 text-amber-400" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUIVI */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Suivi</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={e => setTrackingInput(e.target.value)}
                  placeholder="Ajouter un numéro de suivi..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all bg-white placeholder:text-slate-300"
                />
                <button
                  onClick={handleSaveTracking}
                  disabled={trackingInput === (order.trackingNumber || '')}
                  className="px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Enregistrer
                </button>
              </div>
              {order.trackingNumber && (
                <button
                  onClick={() => setTrackingDrawerOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 transition-colors text-left w-full"
                >
                  Suivi actuel : <span className="font-bold text-slate-700 hover:text-indigo-700 underline-offset-2 hover:underline">{order.trackingNumber}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <TrackingDetailDrawer
          open={trackingDrawerOpen}
          onClose={() => setTrackingDrawerOpen(false)}
          trackingNumber={order.trackingNumber || ''}
        />
      </SheetContent>
    </Sheet>
  );
}

export default function BoutiquePage() {
  const [mode, setMode] = useState<Mode>('vente');
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>([]);
  const [rentalOrders, setRentalOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('commande');
  const [rentalStatus, setRentalStatus] = useState<RentalStatus | 'all'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<SaleOrder | RentalOrder | null>(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [trackingDrawerNumber, setTrackingDrawerNumber] = useState<string | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<QuoteRequestStatus | 'all'>('all');
  const [detailQuote, setDetailQuote] = useState<QuoteRequest | null>(null);
  const [quoteSupplierPrice, setQuoteSupplierPrice] = useState('');
  const [quoteFinalPrice, setQuoteFinalPrice] = useState('');
  const [quoteUpdating, setQuoteUpdating] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [saleRes, rentalRes, quoteRes] = await Promise.all([
        getSaleOrders(),
        getRentalOrders(),
        listQuoteRequests(),
      ]);
      setSaleOrders(saleRes);
      setRentalOrders(rentalRes);
      setQuoteRequests(quoteRes);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); setDetailOrder(null); setDetailQuote(null); }, [saleStatus, rentalStatus, quoteStatus, search, mode]);

  const saleStats = useMemo(() => {
    const commandes = saleOrders.filter(o => o.status === 'commande');
    const total = commandes.reduce((sum, o) => sum + o.amountPaid, 0);
    return { total: commandes.length, revenue: total };
  }, [saleOrders]);

  const rentalStats = useMemo(() => {
    const active = rentalOrders.filter(o => o.status === 'pending_validation' || o.status === 'validated' || o.status === 'shipped');
    const completed = rentalOrders.filter(o => o.status === 'completed');
    const total = rentalOrders.reduce((sum, o) => sum + o.amountPaid, 0);
    return { active: active.length, completed: completed.length, revenue: total };
  }, [rentalOrders]);

  const filteredQuoteRequests = useMemo(() => {
    let result = quoteStatus === 'all' ? quoteRequests : quoteRequests.filter(q => q.status === quoteStatus);
    if (search.trim()) {
      const q = normalizeSearchText(search);
      result = result.filter(r =>
        normalizeSearchText(r.productName).includes(q) ||
        normalizeSearchText(r.customerName).includes(q) ||
        normalizeSearchText(r.customerEmail).includes(q)
      );
    }
    return result;
  }, [quoteRequests, quoteStatus, search]);

  const quotePage = (page - 1) * PAGE_SIZE;
  const paginatedQuotes = filteredQuoteRequests.slice(quotePage, quotePage + PAGE_SIZE);

  const handleQuoteStatus = async (q: QuoteRequest, status: QuoteRequestStatus) => {
    if (!q.id) return;
    setQuoteUpdating(q.id);
    try {
      // Use API route when email should be sent
      if (status === 'offer_sent') {
        const res = await fetch('/api/quote-requests/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: q.id, status, finalPrice: q.finalPrice }),
        });
        if (!res.ok) throw new Error('API error');
      } else {
        await updateQuoteRequest(q.id, { status });
      }
      setQuoteRequests(prev => prev.map(r => r.id === q.id ? { ...r, status } : r));
      if (detailQuote?.id === q.id) setDetailQuote({ ...q, status });
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setQuoteUpdating(null);
  };

  const filteredSaleOrders = useMemo(() => {
    let result = saleOrders.filter(o => o.status === saleStatus);
    if (search.trim()) {
      const q = normalizeSearchText(search);
      result = result.filter(o =>
        normalizeSearchText(o.productName).includes(q) ||
        normalizeSearchText(o.customerName).includes(q) ||
        normalizeSearchText(o.customerEmail).includes(q)
      );
    }
    return result;
  }, [saleOrders, saleStatus, search]);

  const filteredRentalOrders = useMemo(() => {
    let result = rentalStatus === 'all' ? rentalOrders : rentalOrders.filter(o => o.status === rentalStatus);
    if (search.trim()) {
      const q = normalizeSearchText(search);
      result = result.filter(o =>
        normalizeSearchText(o.productName).includes(q) ||
        normalizeSearchText(o.renterCompany).includes(q) ||
        normalizeSearchText(o.renterEmail).includes(q)
      );
    }
    return result;
  }, [rentalOrders, rentalStatus, search]);

  const salePage = (page - 1) * PAGE_SIZE;
  const paginatedSales = filteredSaleOrders.slice(salePage, salePage + PAGE_SIZE);
  const paginatedRentals = filteredRentalOrders.slice(salePage, salePage + PAGE_SIZE);

  const handleSaleAction = async (id: string, status: SaleStatus) => {
    setUpdating(id);
    try {
      await updateSaleOrder(id, { status });
      setSaleOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setUpdating(null);
  };

  const handleRentalAction = async (id: string, status: RentalStatus) => {
    setUpdating(id);
    try {
      await updateRentalOrder(id, { status });
      setRentalOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DetailModal open={!!detailOrder} onClose={() => setDetailOrder(null)} order={detailOrder} mode={mode} />
      <ConfirmDialog
        open={!!confirmDialog}
        onOpenChange={(o) => { if (!o) setConfirmDialog(null); }}
        title={confirmDialog?.title || ''}
        description={confirmDialog?.description || ''}
        confirmText="Confirmer"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        onConfirm={() => confirmDialog?.onConfirm()}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Commandes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les commandes et locations de votre boutique.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            {saleOrders.filter(o => o.status === 'commande').length} ventes
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
            <CalendarRange className="w-3.5 h-3.5 text-violet-500" />
            {rentalOrders.filter(o => o.status === 'pending_validation' || o.status === 'validated' || o.status === 'shipped').length} locations
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
            <Euro className="w-3.5 h-3.5 text-emerald-500" />
            {formatPrice(saleOrders.reduce((s, o) => s + o.amountPaid, 0) + rentalOrders.reduce((s, o) => s + o.amountPaid, 0))}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
            <Send className="w-3.5 h-3.5 text-amber-500" />
            {quoteRequests.filter(q => q.status === 'pending_supplier').length} demandes
          </span>
        </div>
      </div>

      {/* MODE TOGGLE */}
      <div className="inline-flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
        {(['vente', 'location', 'sur-commande'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all"
          >
            {mode === m && (
              <motion.span layoutId="admin-mode-bubble" className="absolute inset-0 bg-gray-900 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
            )}
            <span className="relative z-10" style={{ color: mode === m ? '#fff' : undefined }}>
              {m === 'vente' ? <ShoppingBag className="w-4 h-4" /> : m === 'location' ? <CalendarRange className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </span>
            <span className="relative z-10" style={{ color: mode === m ? '#fff' : undefined }}>
              {m === 'vente' ? 'Vente' : m === 'location' ? 'Location' : 'Sur commande'}
            </span>
          </button>
        ))}
      </div>

      {/* STATS CARDS */}
      {mode === 'vente' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total commandes', value: saleStats.total, icon: ShoppingBag, gradient: 'from-blue-500/10 via-blue-500/5 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
            { label: 'Revenu total', value: formatPrice(saleStats.revenue), icon: Euro, gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
            { label: 'Archivées', value: saleOrders.filter(o => o.status === 'archive').length, icon: Archive, gradient: 'from-gray-500/10 via-gray-500/5 to-transparent', border: 'border-gray-500/20', iconBg: 'bg-gray-500/20', iconColor: 'text-gray-600', textColor: 'text-gray-700' },
            { label: 'Corbeille', value: saleOrders.filter(o => o.status === 'corbeille').length, icon: Trash2, gradient: 'from-red-500/10 via-red-500/5 to-transparent', border: 'border-red-500/20', iconBg: 'bg-red-500/20', iconColor: 'text-red-600', textColor: 'text-red-700' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} backdrop-blur-md rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
              >
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 opacity-[0.08]">
                  <Icon className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
              </motion.div>
            );
          })}
        </div>
      ) : mode === 'location' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Locations actives', value: rentalStats.active, icon: Timer, gradient: 'from-violet-500/10 via-violet-500/5 to-transparent', border: 'border-violet-500/20', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-600', textColor: 'text-violet-700' },
            { label: 'Terminées', value: rentalStats.completed, icon: Check, gradient: 'from-green-500/10 via-green-500/5 to-transparent', border: 'border-green-500/20', iconBg: 'bg-green-500/20', iconColor: 'text-green-600', textColor: 'text-green-700' },
            { label: 'Annulées', value: rentalOrders.filter(o => o.status === 'cancelled').length, icon: X, gradient: 'from-red-500/10 via-red-500/5 to-transparent', border: 'border-red-500/20', iconBg: 'bg-red-500/20', iconColor: 'text-red-600', textColor: 'text-red-700' },
            { label: 'Revenu total', value: formatPrice(rentalStats.revenue), icon: Euro, gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} backdrop-blur-md rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
              >
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 opacity-[0.08]">
                  <Icon className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'En attente', value: quoteRequests.filter(q => q.status === 'pending_supplier').length, icon: Clock, gradient: 'from-amber-500/10 via-amber-500/5 to-transparent', border: 'border-amber-500/20', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
            { label: 'Offres envoyées', value: quoteRequests.filter(q => q.status === 'offer_sent').length, icon: Send, gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-600', textColor: 'text-indigo-700' },
            { label: 'Acceptées', value: quoteRequests.filter(q => q.status === 'accepted').length, icon: Check, gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
            { label: 'En attente livraison', value: quoteRequests.filter(q => q.status === 'awaiting_delivery').length, icon: Truck, gradient: 'from-blue-500/10 via-blue-500/5 to-transparent', border: 'border-blue-500/20', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
            { label: 'Total demandes', value: quoteRequests.length, icon: ShoppingBag, gradient: 'from-gray-500/10 via-gray-500/5 to-transparent', border: 'border-gray-500/20', iconBg: 'bg-gray-500/20', iconColor: 'text-gray-600', textColor: 'text-gray-700' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} backdrop-blur-md rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all duration-300 group`}
              >
                <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 opacity-[0.08]">
                  <Icon className="w-24 h-24" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={fetchData} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all border border-gray-200 shadow-sm active:scale-[0.97]">
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        {mode === 'vente' && saleStatus === 'corbeille' && saleOrders.filter(o => o.status === 'corbeille').length > 0 && (
          <button onClick={async () => {
            const ids = saleOrders.filter(o => o.status === 'corbeille' && o.id).map(o => o.id!);
            setConfirmDialog({
              title: 'Vider la corbeille',
              description: `${ids.length} commande(s) seront définitivement supprimées.`,
              onConfirm: async () => {
                for (const id of ids) {
                  try { await deleteSaleOrder(id); } catch { /* skip */ }
                }
                setSaleOrders(prev => prev.filter(o => o.status !== 'corbeille'));
                setConfirmDialog(null);
                toast.success('Corbeille vidée');
              },
            });
          }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-xs transition-all border border-red-200 shadow-sm">
            <Trash2 className="w-3.5 h-3.5" /> Vider la corbeille
          </button>
        )}
        {selectedIds.size > 0 && (
          <>
            <span className="w-px h-5 bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">{selectedIds.size} sélectionné(s)</span>
            <span className="w-px h-5 bg-gray-200" />
            {mode === 'vente' ? (
              <>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => saleOrders.find(o => o.id === id)?.status === 'commande');
                  for (const id of ids) await handleSaleAction(id, 'archive');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Archive className="w-3.5 h-3.5" /> Archiver
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => {
                    const o = saleOrders.find(o => o.id === id);
                    return o?.status === 'archive' || o?.status === 'corbeille';
                  });
                  for (const id of ids) await handleSaleAction(id, 'commande');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => saleOrders.find(o => o.id === id)?.status === 'archive');
                  for (const id of ids) await handleSaleAction(id, 'corbeille');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Trash2 className="w-3.5 h-3.5" /> Corbeille
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => saleOrders.find(o => o.id === id)?.status === 'corbeille');
                  setConfirmDialog({
                    title: 'Supprimer définitivement',
                    description: `${ids.length} commande(s) seront définitivement supprimées.`,
                    onConfirm: async () => {
                      for (const id of ids) {
                        try { await deleteSaleOrder(id); } catch { /* skip */ }
                      }
                      setSaleOrders(prev => prev.filter(o => !ids.includes(o.id!)));
                      setSelectedIds(new Set());
                      setConfirmDialog(null);
                      toast.success('Commandes supprimées');
                    },
                  });
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-lg font-semibold text-xs transition-all border border-red-200 shadow-sm">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer définitivement
                </button>
              </>
            ) : mode === 'location' ? (
              <>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => rentalOrders.find(o => o.id === id)?.status === 'pending_validation');
                  for (const id of ids) await handleRentalAction(id, 'validated');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Check className="w-3.5 h-3.5" /> Valider
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => rentalOrders.find(o => o.id === id)?.status === 'pending_validation');
                  for (const id of ids) await handleRentalAction(id, 'cancelled');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <X className="w-3.5 h-3.5" /> Annuler
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => rentalOrders.find(o => o.id === id)?.status === 'validated');
                  for (const id of ids) await handleRentalAction(id, 'shipped');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Package className="w-3.5 h-3.5" /> Expédier
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => rentalOrders.find(o => o.id === id)?.status === 'shipped');
                  for (const id of ids) await handleRentalAction(id, 'completed');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Check className="w-3.5 h-3.5" /> Terminer
                </button>
                <button onClick={async () => {
                  const ids = Array.from(selectedIds).filter(id => {
                    const o = rentalOrders.find(o => o.id === id);
                    return o?.status === 'completed' || o?.status === 'cancelled';
                  });
                  for (const id of ids) await handleRentalAction(id, 'pending_validation');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                </button>
              </>
            ) : (
              <>
                <button onClick={async () => {
                  const qs = quoteRequests.filter(q => q.id && selectedIds.has(q.id) && q.status === 'pending_supplier');
                  for (const q of qs) await handleQuoteStatus(q, 'offer_sent');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <Send className="w-3.5 h-3.5" /> Offre envoyée
                </button>
                <button onClick={async () => {
                  const qs = quoteRequests.filter(q => q.id && selectedIds.has(q.id) && q.status !== 'declined' && q.status !== 'expired' && q.status !== 'accepted' && q.status !== 'awaiting_delivery');
                  for (const q of qs) await handleQuoteStatus(q, 'declined');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <X className="w-3.5 h-3.5" /> Refuser
                </button>
                <button onClick={async () => {
                  const qs = quoteRequests.filter(q => q.id && selectedIds.has(q.id) && (q.status === 'declined' || q.status === 'expired' || q.status === 'accepted' || q.status === 'awaiting_delivery'));
                  for (const q of qs) await handleQuoteStatus(q, 'pending_supplier');
                  setSelectedIds(new Set());
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 rounded-lg font-semibold text-xs transition-all border border-gray-200 shadow-sm">
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurer
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit, client..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none shadow-sm"
          />
        </div>
        {mode === 'vente' ? (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            {(Object.entries(saleStatusLabels) as [SaleStatus, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setSaleStatus(key); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${saleStatus === key ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        ) : mode === 'location' ? (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <button onClick={() => setRentalStatus('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${rentalStatus === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Toutes
            </button>
            {rentalMainStatuses.map(s => (
              <button key={s} onClick={() => setRentalStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${rentalStatus === s ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {rentalStatusLabels[s]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <button onClick={() => setQuoteStatus('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${quoteStatus === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Toutes
            </button>
            {(Object.entries(quoteStatusLabels) as [QuoteRequestStatus, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setQuoteStatus(key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${quoteStatus === key ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {mode === 'vente' ? (
          filteredSaleOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune commande trouvée</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {search ? 'Essayez de modifier votre recherche.' : 'Aucune commande dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="w-10 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === paginatedSales.length && paginatedSales.length > 0}
                          onChange={() => {
                            if (selectedIds.size === paginatedSales.length) setSelectedIds(new Set());
                            else setSelectedIds(new Set(paginatedSales.filter(p => p.id).map(p => p.id!)));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Produit</th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Client</th>
                      <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Montant</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Suivi</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                      <th className="w-12 px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {paginatedSales.map((o, idx) => {
                        const isSelected = o.id ? selectedIds.has(o.id) : false;
                        return (
                          <motion.tr key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className={`border-b border-gray-50 group transition-colors hover:bg-blue-50/20 cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}`}
                            onClick={() => o && setDetailOrder(o)}
                          >
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => { if (!o.id) return; const next = new Set(selectedIds); isSelected ? next.delete(o.id) : next.add(o.id); setSelectedIds(next); }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {o.productImage ? (
                                    <img src={o.productImage} alt={o.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageOff className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{o.productName}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">Qté: {o.quantity}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{o.customerName || '—'}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">{o.customerEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-gray-900">{formatPrice(o.amountPaid)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {(o as any).trackingNumber ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTrackingDrawerNumber((o as any).trackingNumber); }}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  {(o as any).trackingNumber}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${saleStatusColors[o.status]}`}>
                                {saleStatusLabels[o.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setDetailOrder(o); }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Détails">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {o.status === 'commande' && (
                                  <button onClick={(e) => { e.stopPropagation(); o.id && handleSaleAction(o.id, 'archive'); }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Archiver">
                                    <Archive className="w-4 h-4" />
                                  </button>
                                )}
                                {o.status === 'archive' && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); o.id && handleSaleAction(o.id, 'commande'); }}
                                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                      title="Restaurer">
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); o.id && handleSaleAction(o.id, 'corbeille'); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Corbeille">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {o.status === 'corbeille' && (
                                  <button onClick={(e) => { e.stopPropagation(); o.id && handleSaleAction(o.id, 'commande'); }}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                    title="Restaurer">
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                {updating === o.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                <span>{filteredSaleOrders.length} commande(s)</span>
              </div>
              <Pagination current={page} total={filteredSaleOrders.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )
        ) : mode === 'location' ? (
          filteredRentalOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <CalendarRange className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune location trouvée</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {search ? 'Essayez de modifier votre recherche.' : 'Aucune location dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="w-10 px-4 py-4">
                        <input type="checkbox"
                          checked={selectedIds.size === paginatedRentals.length && paginatedRentals.length > 0}
                          onChange={() => {
                            if (selectedIds.size === paginatedRentals.length) setSelectedIds(new Set());
                            else setSelectedIds(new Set(paginatedRentals.filter(p => p.id).map(p => p.id!)));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Produit</th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Client</th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Période</th>
                      <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Montant</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Suivi</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                      <th className="w-12 px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {paginatedRentals.map((o, idx) => {
                        const isSelected = o.id ? selectedIds.has(o.id) : false;
                        return (
                          <motion.tr key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className={`border-b border-gray-50 group transition-colors hover:bg-violet-50/20 cursor-pointer ${isSelected ? 'bg-violet-50/40' : ''}`}
                            onClick={() => o && setDetailOrder(o)}
                          >
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => { if (!o.id) return; const next = new Set(selectedIds); isSelected ? next.delete(o.id) : next.add(o.id); setSelectedIds(next); }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {o.productImage ? (
                                    <img src={o.productImage} alt={o.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageOff className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{o.productName}</p>
                                  <p className="text-[11px] text-gray-400 mt-0.5">Qté: {o.quantity}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{o.renterCompany || '—'}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">{o.renterEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600 whitespace-nowrap">{o.rentalStartDate} → {o.rentalEndDate}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-gray-900">{formatPrice(o.amountPaid)}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {(o as any).trackingNumber ? (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTrackingDrawerNumber((o as any).trackingNumber); }}
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                >
                                  {(o as any).trackingNumber}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${rentalStatusColors[o.status]}`}>
                                {rentalStatusLabels[o.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setDetailOrder(o); }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Détails">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {o.status === 'pending_validation' && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); o.id && handleRentalAction(o.id, 'validated'); }}
                                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Valider">
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); o.id && handleRentalAction(o.id, 'cancelled'); }}
                                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Annuler">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {o.status === 'validated' && (
                                  <button onClick={(e) => { e.stopPropagation(); o.id && handleRentalAction(o.id, 'shipped'); }}
                                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Expédier">
                                    <Package className="w-4 h-4" />
                                  </button>
                                )}
                                {o.status === 'shipped' && (
                                  <button onClick={(e) => { e.stopPropagation(); o.id && handleRentalAction(o.id, 'completed'); }}
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                                    title="Terminer">
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                {(o.status === 'completed' || o.status === 'cancelled') && (
                                  <button onClick={(e) => { e.stopPropagation(); o.id && handleRentalAction(o.id, 'pending_validation'); }}
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                    title="Restaurer">
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                {updating === o.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                <span>{filteredRentalOrders.length} location(s)</span>
              </div>
              <Pagination current={page} total={filteredRentalOrders.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )
        ) : (
          filteredQuoteRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <Send className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune demande de devis</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {search ? 'Essayez de modifier votre recherche.' : 'Aucune demande pour le moment.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="w-10 px-4 py-4">
                        <input type="checkbox"
                          checked={selectedIds.size === paginatedQuotes.length && paginatedQuotes.length > 0}
                          onChange={() => {
                            if (selectedIds.size === paginatedQuotes.length) setSelectedIds(new Set());
                            else setSelectedIds(new Set(paginatedQuotes.filter(p => p.id).map(p => p.id!)));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Produit</th>
                      <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Client</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Qté</th>
                      <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Prix fournisseur</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                      <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                      <th className="w-12 px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {paginatedQuotes.map((q) => {
                        const isSelected = q.id ? selectedIds.has(q.id) : false;
                        return (
                          <motion.tr key={q.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className={`border-b border-gray-50 group transition-colors hover:bg-amber-50/20 cursor-pointer ${isSelected ? 'bg-amber-50/40' : ''}`}
                            onClick={() => { setDetailQuote(q); setQuoteSupplierPrice(q.supplierPrice?.toString() || ''); setQuoteFinalPrice(q.finalPrice?.toString() || ''); }}
                          >
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={isSelected}
                                onChange={() => { if (!q.id) return; const next = new Set(selectedIds); isSelected ? next.delete(q.id) : next.add(q.id); setSelectedIds(next); }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {q.productImage ? (
                                    <img src={q.productImage} alt={q.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageOff className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{q.productName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{q.customerName}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">{q.customerEmail}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-bold text-gray-900">{q.quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold text-gray-900">{q.supplierPrice ? formatPrice(q.supplierPrice) : '—'}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-500">{new Date(q.createdAt).toLocaleDateString('fr-FR')}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${quoteStatusColors[q.status]}`}>
                                {quoteStatusLabels[q.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={(e) => { e.stopPropagation(); setDetailQuote(q); setQuoteSupplierPrice(q.supplierPrice?.toString() || ''); setQuoteFinalPrice(q.finalPrice?.toString() || ''); }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Détails">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {q.status === 'pending_supplier' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleQuoteStatus(q, 'offer_sent'); }}
                                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="Offre envoyée">
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                {q.status === 'offer_sent' && (
                                  <button onClick={async (e) => {
                                    e.stopPropagation();
                                    setQuoteUpdating(q.id || '');
                                    try {
                                      const res = await fetch('/api/quote-requests/update', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: q.id, status: 'offer_sent', finalPrice: q.finalPrice }),
                                      });
                                      if (!res.ok) throw new Error();
                                      toast.success('Email renvoyé');
                                    } catch {
                                      toast.error("Erreur lors de l'envoi");
                                    }
                                    setQuoteUpdating(null);
                                  }}
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                    title="Renvoyer l'email">
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                {q.status !== 'declined' && q.status !== 'expired' && q.status !== 'accepted' && q.status !== 'awaiting_delivery' && (
                                  <button onClick={(e) => { e.stopPropagation(); handleQuoteStatus(q, 'declined'); }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Refuser">
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                                {(q.status === 'declined' || q.status === 'expired' || q.status === 'accepted' || q.status === 'awaiting_delivery') && (
                                  <button onClick={(e) => { e.stopPropagation(); handleQuoteStatus(q, 'pending_supplier'); }}
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                                    title="Restaurer">
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                )}
                                {quoteUpdating === q.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
                <span>{filteredQuoteRequests.length} demande(s)</span>
              </div>
              <Pagination current={page} total={filteredQuoteRequests.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )
        )}
      </div>

      {/* Quote detail sheet */}
      <Sheet open={!!detailQuote} onOpenChange={(o) => { if (!o) setDetailQuote(null); }}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto p-0">
          <SheetTitle className="sr-only">Détails de la demande de devis</SheetTitle>
          {detailQuote && (
            <>
              <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-200">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Demande de devis</h3>
                    <p className="text-[10px] font-medium text-slate-400 font-mono tracking-tight">#{detailQuote.id?.slice(0, 8)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Produit */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Produit</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {detailQuote.productImage ? (
                          <img src={detailQuote.productImage} alt={detailQuote.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{detailQuote.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-slate-400">Qté: {detailQuote.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Client</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Nom</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{detailQuote.customerName}</p>
                      </div>
                    </div>
                    {detailQuote.customerCompany && (
                      <>
                        <div className="h-px bg-slate-200/60" />
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Société</p>
                            <p className="text-sm font-bold text-slate-800 truncate">{detailQuote.customerCompany}</p>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="h-px bg-slate-200/60" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Email</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{detailQuote.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Téléphone</p>
                          <p className="text-xs font-semibold text-slate-700 truncate">{detailQuote.customerPhone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Adresse</p>
                        <p className="text-xs font-semibold text-slate-700">{detailQuote.customerAddress}{detailQuote.customerCity ? `, ${detailQuote.customerCity}` : ''}{detailQuote.customerPostcode ? ` ${detailQuote.customerPostcode}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pays</p>
                        <p className="text-xs font-semibold text-slate-700">{detailQuote.customerCountry}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commentaire */}
                {detailQuote.comment && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Commentaire</span>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <p className="text-sm text-slate-700">{detailQuote.comment}</p>
                    </div>
                  </div>
                )}

                {/* Prix */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Prix</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Prix fournisseur (€)</label>
                      <input type="number" min={0} step="0.01" value={quoteSupplierPrice}
                        onChange={e => setQuoteSupplierPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white"
                        placeholder="Saisir le prix fournisseur" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Prix final client (€)</label>
                      <input type="number" min={0} step="0.01" value={quoteFinalPrice}
                        onChange={e => setQuoteFinalPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white"
                        placeholder="Saisir le prix final" />
                    </div>
                    <button onClick={async () => {
                      if (!detailQuote.id) return;
                      setQuoteUpdating(detailQuote.id);
                      const payload: any = {};
                      const sp = parseFloat(quoteSupplierPrice);
                      const fp = parseFloat(quoteFinalPrice);
                      if (!isNaN(sp) && sp > 0) payload.supplierPrice = sp;
                      if (!isNaN(fp) && fp > 0) payload.finalPrice = fp;
                      try {
                        await updateQuoteRequest(detailQuote.id, payload);
                        setQuoteRequests(prev => prev.map(r => r.id === detailQuote.id ? { ...r, ...payload } : r));
                        toast.success('Prix mis à jour');
                      } catch {
                        toast.error('Erreur lors de la mise à jour');
                      }
                      setQuoteUpdating(null);
                    }} disabled={quoteUpdating === detailQuote.id}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {quoteUpdating === detailQuote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Enregistrer les prix
                    </button>
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Statut</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${quoteStatusColors[detailQuote.status]}`}>
                          {quoteStatusLabels[detailQuote.status]}
                        </span>
                      </div>
                    </div>
                    {detailQuote.status === 'offer_sent' && (
                      <button onClick={async () => {
                        if (!detailQuote.id) return;
                        setQuoteUpdating(detailQuote.id);
                        try {
                          const res = await fetch('/api/quote-requests/update', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: detailQuote.id, status: 'offer_sent', finalPrice: detailQuote.finalPrice }),
                          });
                          if (!res.ok) throw new Error();
                          toast.success('Email renvoyé');
                        } catch {
                          toast.error("Erreur lors de l'envoi");
                        }
                        setQuoteUpdating(null);
                      }} disabled={quoteUpdating === detailQuote.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-all border border-amber-200 disabled:opacity-50">
                        {quoteUpdating === detailQuote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Renvoyer l'email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <TrackingDetailDrawer
        open={!!trackingDrawerNumber}
        onClose={() => setTrackingDrawerNumber(null)}
        trackingNumber={trackingDrawerNumber || ''}
      />
    </div>
  );
}
