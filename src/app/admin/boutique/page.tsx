'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, CalendarRange, Search, Package, Euro, Loader2, Archive, Trash2, RotateCcw, X, RefreshCw, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSaleOrders, updateSaleOrder, type SaleOrder, type SaleStatus } from '@/lib/sale-orders';
import { getRentalOrders, updateRentalOrder, type RentalOrder, type RentalStatus } from '@/lib/rental-orders';
import { formatPrice } from '@/lib/boutique-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Mode = 'vente' | 'location';

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

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailModal({ open, onClose, order, mode }: {
  open: boolean;
  onClose: () => void;
  order: SaleOrder | RentalOrder | null;
  mode: Mode;
}) {
  if (!open || !order) return null;

  const isSale = mode === 'vente';
  const s = order as SaleOrder;
  const r = order as RentalOrder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Détails de la commande</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
            <div>
              <p className="font-semibold text-gray-900">{order.productName}</p>
              <p className="text-sm text-gray-500">Quantité : {order.quantity}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Montant</p>
              <p className="font-semibold text-gray-900">{formatPrice(order.amountPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PayPal ID</p>
              <p className="font-mono text-xs text-gray-600 truncate">{order.paypalOrderId || '-'}</p>
            </div>
          </div>
          {isSale ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Client</p>
                <p className="font-semibold text-gray-900">{s.customerName || 'Anonyme'}</p>
                <p className="text-gray-500">{s.customerEmail}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Locataire</p>
                <p className="font-semibold text-gray-900">{r.renterCompany}</p>
                <p className="text-gray-500">{r.renterRepresentative}</p>
                <p className="text-gray-500">{r.renterEmail}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Début</p>
                <p className="font-semibold text-gray-900">{r.rentalStartDate}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fin</p>
                <p className="font-semibold text-gray-900">{r.rentalEndDate}</p>
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </div>
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [saleRes, rentalRes] = await Promise.all([
        getSaleOrders(),
        getRentalOrders(),
      ]);
      setSaleOrders(saleRes);
      setRentalOrders(rentalRes);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const filteredSaleOrders = useMemo(() => {
    let result = saleOrders.filter(o => o.status === saleStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.productName.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [saleOrders, saleStatus, search]);

  const filteredRentalOrders = useMemo(() => {
    let result = rentalStatus === 'all' ? rentalOrders : rentalOrders.filter(o => o.status === rentalStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.productName.toLowerCase().includes(q) ||
        o.renterCompany.toLowerCase().includes(q) ||
        o.renterEmail.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rentalOrders, rentalStatus, search]);

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

  return (
    <div className="space-y-6">
      <DetailModal open={!!detailOrder} onClose={() => setDetailOrder(null)} order={detailOrder} mode={mode} />

      <div className="relative flex w-full max-w-md rounded-xl bg-white border border-slate-200 h-11 p-1 shadow-sm">
        {(['vente', 'location'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={cn("relative w-full flex justify-center font-bold px-4 py-2 text-[10px] uppercase tracking-widest items-center gap-2 z-20 transition-all duration-300", mode === m ? "text-white" : "text-slate-500 hover:text-slate-900")}>
            {mode === m && (
              <motion.span layoutId="boutique-mode-bubble" className="absolute inset-0 z-10 bg-slate-900 rounded-lg shadow-sm" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />
            )}
            {m === 'vente' ? <ShoppingBag className="w-3.5 h-3.5 z-20" /> : <CalendarRange className="w-3.5 h-3.5 z-20" />}
            <span className="z-20">{m === 'vente' ? 'Vente' : 'Location'}</span>
          </button>
        ))}
      </div>

      {mode === 'vente' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Total commandes" value={saleStats.total} icon={Package} />
            <StatCard label="Revenu total" value={formatPrice(saleStats.revenue)} icon={Euro} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(Object.entries(saleStatusLabels) as [SaleStatus, string][]).map(([key, label]) => (
                <button key={key} onClick={() => { setSaleStatus(key); setSearch(''); }}
                  className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", saleStatus === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 h-9 w-52 text-sm rounded-xl border-slate-200" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>

          <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Produit</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Client</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Montant</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Date</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Statut</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                  ) : filteredSaleOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-slate-400">Aucune commande trouvée</TableCell></TableRow>
                  ) : filteredSaleOrders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={o.productImage} alt={o.productName} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          <span className="font-medium text-sm text-slate-900 truncate max-w-[160px]">{o.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{o.customerName || '—'}</TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">{formatPrice(o.amountPaid)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", saleStatusColors[o.status])}>{saleStatusLabels[o.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOrder(o)} title="Détails"><Eye className="w-4 h-4" /></Button>
                          {o.status === 'commande' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => o.id && handleSaleAction(o.id, 'archive')} disabled={updating === o.id} title="Archiver"><Archive className="w-4 h-4" /></Button>
                          )}
                          {o.status === 'archive' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => o.id && handleSaleAction(o.id, 'commande')} disabled={updating === o.id} title="Restaurer"><RotateCcw className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => o.id && handleSaleAction(o.id, 'corbeille')} disabled={updating === o.id} title="Corbeille"><Trash2 className="w-4 h-4" /></Button>
                            </>
                          )}
                          {o.status === 'corbeille' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => o.id && handleSaleAction(o.id, 'commande')} disabled={updating === o.id} title="Restaurer"><RotateCcw className="w-4 h-4" /></Button>
                          )}
                          {updating === o.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Locations actives" value={rentalStats.active} icon={Package} />
            <StatCard label="Terminées" value={rentalStats.completed} icon={Package} />
            <StatCard label="Revenu total" value={formatPrice(rentalStats.revenue)} icon={Euro} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setRentalStatus('all')}
                className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", rentalStatus === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                Toutes
              </button>
              {rentalMainStatuses.map(s => (
                <button key={s} onClick={() => setRentalStatus(s)}
                  className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", rentalStatus === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                  {rentalStatusLabels[s]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9 h-9 w-52 text-sm rounded-xl border-slate-200" />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>

          <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Produit</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Client</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Période</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Montant</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase">Statut</TableHead>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                  ) : filteredRentalOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-slate-400">Aucune location trouvée</TableCell></TableRow>
                  ) : filteredRentalOrders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={o.productImage} alt={o.productName} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          <span className="font-medium text-sm text-slate-900 truncate max-w-[160px]">{o.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{o.renterCompany || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-500 whitespace-nowrap">{o.rentalStartDate} → {o.rentalEndDate}</TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">{formatPrice(o.amountPaid)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", rentalStatusColors[o.status])}>{rentalStatusLabels[o.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailOrder(o)} title="Détails"><Eye className="w-4 h-4" /></Button>
                          {o.status === 'pending_validation' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => o.id && handleRentalAction(o.id, 'validated')} disabled={updating === o.id} title="Valider">✓</Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => o.id && handleRentalAction(o.id, 'cancelled')} disabled={updating === o.id} title="Annuler"><X className="w-4 h-4" /></Button>
                            </>
                          )}
                          {o.status === 'validated' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => o.id && handleRentalAction(o.id, 'shipped')} disabled={updating === o.id} title="Expédier">
                              <Package className="w-4 h-4" />
                            </Button>
                          )}
                          {o.status === 'shipped' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => o.id && handleRentalAction(o.id, 'completed')} disabled={updating === o.id} title="Terminer">
                              ✓
                            </Button>
                          )}
                          {(o.status === 'completed' || o.status === 'cancelled') && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => o.id && handleRentalAction(o.id, 'pending_validation')} disabled={updating === o.id} title="Restaurer">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                          {updating === o.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
