'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Package, Euro, Activity, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { getRentalOrders, updateRentalOrder, type RentalOrder, type RentalStatus } from '@/lib/rental-orders';
import { formatPrice } from '@/lib/boutique-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusLabels: Record<RentalStatus, string> = {
  pending_validation: 'En attente',
  validated: 'Validée',
  shipped: 'Expédiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const statusColors: Record<RentalStatus, string> = {
  pending_validation: 'bg-amber-100 text-amber-700 border-amber-200',
  validated: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const allStatuses: RentalStatus[] = [
  'pending_validation',
  'validated',
  'shipped',
  'completed',
  'cancelled',
];

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LocationPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RentalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRentalOrders(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      );
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch rental orders:', err);
      setError(true);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les locations.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.amountPaid || 0), 0);
    const active = orders.filter(
      (o) => o.status === 'pending_validation' || o.status === 'validated'
    ).length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    return { total, revenue, active, completed };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.renterCompany?.toLowerCase().includes(q) ||
        o.renterRepresentative?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const handleStatusChange = async (
    order: RentalOrder,
    newStatus: RentalStatus
  ) => {
    if (!order.id) return;
    const prevStatus = order.status;
    setLoadingId(order.id);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );
    try {
      await updateRentalOrder(order.id, { status: newStatus });
      toast({
        title: 'Statut mis à jour',
        description: `La location est maintenant "${statusLabels[newStatus]}".`,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: prevStatus } : o))
      );
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total locations" value={stats.total} icon={Package} />
        <StatCard
          label="Revenu locations"
          value={formatPrice(stats.revenue)}
          icon={Euro}
        />
        <StatCard label="Locations actives" value={stats.active} icon={Activity} />
        <StatCard
          label="Locations terminées"
          value={stats.completed}
          icon={CheckCircle2}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Erreur de chargement</p>
            <p className="text-xs text-red-600">Impossible de charger les locations. Réessayez plus tard.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setError(false); fetchOrders(); }} className="ml-auto rounded-lg text-xs">
            Réessayer
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher par client ou produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm focus:ring-slate-900"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val: string) => setStatusFilter(val === 'all' ? 'all' : val as RentalStatus)}
        >
          <SelectTrigger className="w-full sm:w-52 h-11 rounded-xl border-slate-200 bg-slate-50/50 shadow-sm">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Client
                </TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Produit
                </TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Dates
                </TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Montant
                </TableHead>
                <TableHead className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Statut
                </TableHead>
                <TableHead className="text-right text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100 animate-pulse">
                    <TableCell><div className="h-4 bg-slate-100 rounded w-32" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded w-24" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded w-36" /></TableCell>
                    <TableCell><div className="h-4 bg-slate-100 rounded w-16" /></TableCell>
                    <TableCell><div className="h-6 bg-slate-100 rounded-full w-20" /></TableCell>
                    <TableCell><div className="h-9 bg-slate-100 rounded w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {order.renterCompany || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.renterRepresentative || ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {order.productImage && (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        )}
                        <span className="font-semibold text-slate-900 text-sm">
                          {order.productName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium text-slate-900">
                          {formatDate(order.rentalStartDate)}
                        </span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="font-medium text-slate-900">
                          {formatDate(order.rentalEndDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-slate-900">
                        {formatPrice(order.amountPaid)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-sm',
                          statusColors[order.status]
                        )}
                      >
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {loadingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            {order.status === 'pending_validation' && (
                              <Button
                                size="sm"
                                className="rounded-lg font-bold text-xs h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-sm"
                                onClick={() =>
                                  handleStatusChange(order, 'validated')
                                }
                              >
                                Valider
                              </Button>
                            )}
                            {order.status === 'validated' && (
                              <Button
                                size="sm"
                                className="rounded-lg font-bold text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
                                onClick={() =>
                                  handleStatusChange(order, 'shipped')
                                }
                              >
                                Expédier
                              </Button>
                            )}
                            {order.status === 'shipped' && (
                              <Button
                                size="sm"
                                className="rounded-lg font-bold text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                                onClick={() =>
                                  handleStatusChange(order, 'completed')
                                }
                              >
                                Terminer
                              </Button>
                            )}
                            {order.status !== 'cancelled' &&
                              order.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg font-bold text-xs h-8 px-3 border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
                                  onClick={() =>
                                    handleStatusChange(order, 'cancelled')
                                  }
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Annuler
                                </Button>
                              )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-48 py-10 bg-slate-50/20"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Package className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-bold text-slate-900">
                        {searchQuery
                          ? 'Aucun résultat trouvé.'
                          : 'Aucune location'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchQuery
                          ? 'Essayez d\'autres termes de recherche.'
                          : 'Aucune commande de location pour le moment.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
