'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Store, ShoppingBag, Package, AlertTriangle, EyeOff, Archive, Search,
  Plus, Upload, Download, RefreshCw, SlidersHorizontal, Star, Sparkles, Tag,
  MoreHorizontal, Edit3, Copy, Eye, BarChart3, Trash2, X, ChevronDown,
  ImageOff, CircleDollarSign, Building2, Users, Box, Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { fetchBoutiqueProducts } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';
import { useProfile } from '@/contexts/ProfileContext';
import { PriceLabel } from '@/components/B2BProfileSelector';

type TabId = 'all' | 'sale' | 'rental' | 'out-of-stock' | 'hidden' | 'archived';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'low-stock': { label: 'Stock faible', color: 'text-amber-700', bg: 'bg-amber-100' },
  'out-of-stock': { label: 'Rupture', color: 'text-red-700', bg: 'bg-red-100' },
  rental: { label: 'En location', color: 'text-blue-700', bg: 'bg-blue-100' },
  disabled: { label: 'Désactivé', color: 'text-gray-700', bg: 'bg-gray-100' },
};

function getProductStatus(product: Product): string {
  if (product.badges?.includes('rupture')) return 'out-of-stock';
  if (product.badges?.includes('desactive')) return 'disabled';
  if (product.availableFor?.length === 1 && product.availableFor[0] === 'rental') return 'rental';
  return Math.random() > 0.7 ? 'low-stock' : 'available';
}

function getProductRef(product: Product): string {
  return `REF-${product.id.toUpperCase().padStart(4, '0').slice(0, 4)}`;
}

function getProductQty(product: Product): number {
  const status = getProductStatus(product);
  if (status === 'out-of-stock') return 0;
  if (status === 'low-stock') return Math.floor(Math.random() * 5) + 1;
  return Math.floor(Math.random() * 50) + 10;
}

function getProductDate(product: Product): string {
  const base = new Date('2025-01-01');
  const offset = product.id.charCodeAt(product.id.length - 1) * 7;
  base.setDate(base.getDate() + offset);
  return base.toLocaleDateString('fr-FR');
}

function getSalePrice(product: Product): number {
  return product.price;
}

function getRentalPrice(product: Product): number {
  return Math.round(product.price * 0.15);
}

export default function BoutiquePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { showHT, showTTC } = useProfile();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'price' | 'rating'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBoutiqueProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeTab === 'sale') result = result.filter(p => p.availableFor?.includes('sale'));
    else if (activeTab === 'rental') result = result.filter(p => p.availableFor?.includes('rental'));
    else if (activeTab === 'out-of-stock') result = result.filter(p => getProductStatus(p) === 'out-of-stock');
    else if (activeTab === 'hidden') result = result.filter(p => getProductStatus(p) === 'disabled');
    else if (activeTab === 'archived') result = result.filter(p => false);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        getProductRef(p).toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) result = result.filter(p => p.category === categoryFilter);
    if (statusFilter) result = result.filter(p => getProductStatus(p) === statusFilter);

    result.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mul * a.name.localeCompare(b.name);
      if (sortField === 'price') return mul * (a.price - b.price);
      return mul * (a.rating - b.rating);
    });

    return result;
  }, [products, activeTab, search, categoryFilter, statusFilter, sortField, sortDir]);

  const tabCounts = useMemo(() => ({
    all: products.length,
    sale: products.filter(p => p.availableFor?.includes('sale')).length,
    rental: products.filter(p => p.availableFor?.includes('rental')).length,
    'out-of-stock': products.filter(p => getProductStatus(p) === 'out-of-stock').length,
    hidden: products.filter(p => getProductStatus(p) === 'disabled').length,
    archived: 0,
  }), [products]);

  const stats = useMemo(() => ({
    total: products.length,
    available: products.filter(p => getProductStatus(p) === 'available').length,
    rental: tabCounts.rental,
    sale: tabCounts.sale,
    outOfStock: tabCounts['out-of-stock'],
    disabled: tabCounts.hidden,
  }), [products, tabCounts]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, category: product.category, type: 'purchase' });
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return <ChevronDown className={`w-3 h-3 inline ml-1 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Boutique</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gérez votre catalogue de produits, suivez les stocks et les ventes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              {stats.total} produits
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
              {stats.available} actifs
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              {stats.outOfStock} ruptures
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
              <EyeOff className="w-3.5 h-3.5 text-gray-400" />
              {stats.disabled} masqués
            </span>
          </div>
        </div>

        {/* ===== STATS CARDS ===== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total produits', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Disponibles', value: stats.available, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'En location', value: stats.rental, icon: Timer, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'En vente', value: stats.sale, icon: CircleDollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rupture', value: stats.outOfStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Désactivés', value: stats.disabled, icon: EyeOff, color: 'text-gray-600', bg: 'bg-gray-100' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ===== ACTION BAR ===== */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.97] shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all border border-gray-200 shadow-sm">
            <Upload className="w-4 h-4" />
            Importer
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all border border-gray-200 shadow-sm">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all border border-gray-200 shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-sm ${
              showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
          </button>
          {selectedIds.size > 0 && (
            <span className="text-xs text-gray-500 ml-2 font-medium">{selectedIds.size} sélectionné(s)</span>
          )}
        </div>

        {/* ===== FILTERS BAR ===== */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher un produit..."
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Toutes catégories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Tous statuts</option>
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== TABS ===== */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
          {[
            { id: 'all' as TabId, label: 'Tous' },
            { id: 'sale' as TabId, label: 'Vente' },
            { id: 'rental' as TabId, label: 'Location' },
            { id: 'out-of-stock' as TabId, label: 'Rupture' },
            { id: 'hidden' as TabId, label: 'Masqués' },
            { id: 'archived' as TabId, label: 'Archives' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-gray-900 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
              <span className={`relative z-10 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {/* ===== PRODUCT TABLE ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun produit trouvé</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {search || categoryFilter || statusFilter
                  ? 'Essayez de modifier vos filtres de recherche.'
                  : 'Aucun produit dans cette catégorie.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={() => {
                          if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
                          else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Produit</th>
                    <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Catégorie</th>
                    <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer select-none" onClick={() => handleSort('price')}>
                      Prix vente <SortIcon field="price" />
                    </th>
                    <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Prix location</th>
                    <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Stock</th>
                    <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Statut</th>
                    <th className="text-right px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                    <th className="w-12 px-4 py-4" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => {
                      const ref = getProductRef(product);
                      const status = getProductStatus(product);
                      const sc = statusConfig[status] || statusConfig.available;
                      const qty = getProductQty(product);
                      const date = getProductDate(product);
                      const isSelected = selectedIds.has(product.id);
                      const isMenuOpen = openMenu === product.id;

                      return (
                        <motion.tr
                          key={product.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-b border-gray-50 group transition-colors hover:bg-blue-50/20 cursor-pointer ${
                            isSelected ? 'bg-blue-50/40' : ''
                          }`}
                          onClick={() => router.push(`/boutique/produit/${product.id}`)}
                        >
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                isSelected ? next.delete(product.id) : next.add(product.id);
                                setSelectedIds(next);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageOff className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{ref}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{product.category}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">{getSalePrice(product).toLocaleString('fr-FR')} €</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-600">{getRentalPrice(product).toLocaleString('fr-FR')} €<span className="text-[10px] text-gray-400">/jr</span></span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-semibold ${qty === 0 ? 'text-red-500' : qty < 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                              {qty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-500">{date}</span>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenu(isMenuOpen ? null : product.id)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {isMenuOpen && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-xl border border-gray-100 shadow-xl py-1">
                                    {[
                                      { icon: Edit3, label: 'Modifier', color: 'text-gray-700' },
                                      { icon: Copy, label: 'Dupliquer', color: 'text-gray-700' },
                                      { icon: Eye, label: 'Voir', color: 'text-gray-700' },
                                      { icon: BarChart3, label: 'Gérer le stock', color: 'text-gray-700' },
                                      { icon: Archive, label: 'Archiver', color: 'text-gray-700' },
                                      { icon: Trash2, label: 'Supprimer', color: 'text-red-600' },
                                    ].map((item, idx) => {
                                      const Icon = item.icon;
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => { setOpenMenu(null); if (idx === 3) toast.info('Gestion du stock'); else if (idx === 5) toast.error('Supprimer'); else toast.success(item.label); }}
                                          className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors ${item.color}`}
                                        >
                                          <Icon className="w-4 h-4" />
                                          {item.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* ===== FOOTER ===== */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            <span>{filteredProducts.length} produit(s) sur {products.length}</span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Trié par {sortField === 'name' ? 'nom' : sortField === 'price' ? 'prix' : 'note'}</span>
              <PriceLabel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
