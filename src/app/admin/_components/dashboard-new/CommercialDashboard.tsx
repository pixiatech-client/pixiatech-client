'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Truck,
  Archive,
  TrendingUp,
  Search,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  DollarSign,
  ArrowRight,
  Download,
  MoreHorizontal,
  MessageSquare,
  Share2,
  ShoppingCart,
  Eye,
  RefreshCw,
  FileText,
  Users,
  ExternalLink,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useAdminT } from '@/hooks/useAdminT';
import { cn } from '@/lib/utils';

const formatDate = (date: Date | null | undefined, locale: string) => {
  if (!date) return '';
  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const getQuoteAmount = (quote: any): number => {
  if (quote.totalClient != null) return Number(quote.totalClient);
  if (quote.totalQuote != null) return Number(quote.totalQuote);
  if (quote.totalAmount != null) return Number(quote.totalAmount);
  if (quote.products?.length) {
    return quote.products.reduce((sum: number, p: any) => sum + (Number(p.totalPrice || p.price || 0) * (p.quantity || 1)), 0);
  }
  return 0;
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  processed: { label: 'Traité', color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { label: 'Chez fournisseur', color: 'text-orange-600', bg: 'bg-orange-50' },
  sent: { label: 'Livré', color: 'text-green-600', bg: 'bg-green-50' },
  delivered: { label: 'Livré', color: 'text-green-600', bg: 'bg-green-50' },
  archived: { label: 'Archivé', color: 'text-gray-600', bg: 'bg-gray-50' },
  returned: { label: 'Retourné', color: 'text-purple-600', bg: 'bg-purple-50' },
  rented: { label: 'Loué', color: 'text-teal-600', bg: 'bg-teal-50' },
  trashed: { label: 'Corbeille', color: 'text-red-600', bg: 'bg-red-50' },
};

interface CommercialDashboardProps {
  userName?: string;
  userAvatar?: string;
  isDark?: boolean;
}

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ userName, userAvatar, isDark }) => {
  const { t, locale } = useI18n();
  const { t: adt } = useAdminT();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [estimationMode, setEstimationMode] = useState<'vente' | 'location'>('vente');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch all quotes that the commercial can see
  const quotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore]);
  const { data: allQuotesRaw, isLoading: loadingQuotes } = useCollection<any>(quotesQuery, { suppressPermissionError: true });

  // Fetch users for client stats
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(200));
  }, [firestore]);
  const { data: allUsers } = useCollection<any>(usersQuery, { suppressPermissionError: true });

  // Derive the quotes visible to this commercial
  const visibleQuotes = useMemo(() => {
    if (!allQuotesRaw) return [];
    const txType = estimationMode === 'location' ? 'rental' : 'sale';
    return allQuotesRaw.filter((q: any) => {
      const status = q.status;
      const typeMatch = !q.transactionType || q.transactionType === txType;
      return typeMatch && ['pending', 'processed', 'sent', 'delivered', 'archived', 'returned', 'rented'].includes(status);
    });
  }, [allQuotesRaw, estimationMode]);

  // Stats
  const stats = useMemo(() => {
    if (!visibleQuotes.length) return { pending: 0, processed: 0, inDelivery: 0, archived: 0 };
    return {
      pending: visibleQuotes.filter((q: any) => q.status === 'pending').length,
      processed: visibleQuotes.filter((q: any) => q.status === 'processed').length,
      inDelivery: visibleQuotes.filter((q: any) => q.status === 'sent' || q.status === 'delivered').length,
      archived: visibleQuotes.filter((q: any) => q.status === 'archived').length,
    };
  }, [visibleQuotes]);

  // Revenue / conversion
  const revenue = useMemo(() => {
    const completed = visibleQuotes.filter((q: any) => q.status === 'sent' || q.status === 'delivered' || q.status === 'archived');
    const total = completed.reduce((sum: number, q: any) => sum + getQuoteAmount(q), 0);
    const totalAll = visibleQuotes.reduce((sum: number, q: any) => sum + getQuoteAmount(q), 0);
    const processedCount = stats.pending + stats.processed > 0
      ? Math.round((stats.processed / (stats.pending + stats.processed)) * 100)
      : 0;
    return { total, totalAll, conversionRate: processedCount };
  }, [visibleQuotes, stats]);

  // Recent estimations
  const recentEstimations = useMemo(() => {
    if (!visibleQuotes.length) return [];
    return visibleQuotes.slice(0, 5).map((q: any) => {
      const statusStr = q.status || 'pending';
      const meta = statusMeta[statusStr] || { label: statusStr, color: 'text-gray-600', bg: 'bg-gray-50' };
      return {
        id: q.estimationNumber || q.id?.slice(0, 8) || 'N/A',
        client: q.clientName || q.clientEmail || q.userName || 'Client',
        statusLabel: meta.label,
        statusColor: meta.color,
        statusBg: meta.bg,
        amount: getQuoteAmount(q),
        date: q.createdAt?.toDate ? formatDate(q.createdAt.toDate(), locale) : q.createdAt || '',
        raw: q,
      };
    });
  }, [visibleQuotes, locale]);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const filteredEstimations = useMemo(() => {
    if (!searchQuery.trim()) return recentEstimations;
    const q = searchQuery.toLowerCase();
    return recentEstimations.filter(e =>
      e.id.toLowerCase().includes(q) ||
      e.client.toLowerCase().includes(q) ||
      e.statusLabel.toLowerCase().includes(q)
    );
  }, [recentEstimations, searchQuery]);

  // Top clients
  const topClients = useMemo(() => {
    if (!visibleQuotes.length) return [];
    const clientMap = new Map<string, { count: number; revenue: number }>();
    visibleQuotes.forEach((q: any) => {
      const name = q.clientName || q.clientEmail || 'Inconnu';
      const existing = clientMap.get(name) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += getQuoteAmount(q);
      clientMap.set(name, existing);
    });
    return Array.from(clientMap.entries())
      .map(([name, data]) => ({ name, deals: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [visibleQuotes]);

  // Quick actions
  const quickActions = [
    { label: adt('Créer un devis'), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', href: '/admin/quote-requests' },
    { label: adt('Voir le pipeline'), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', href: '/admin/quote-requests' },
    { label: adt('Messagerie'), icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50', href: '/admin/messages' },
  ];

  const activities = [
    { id: 1, user: userName || 'Vous', action: adt('Bienvenue sur votre tableau de bord'), details: adt('Consultez vos devis et clients'), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'self' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen text-gray-900 px-3 md:px-0">
      <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('admin.commercialDashboard.greeting', { userName: userName || 'Commercial' })}
            </h1>
            <p className="text-sm mt-1 text-gray-500">
              {t('admin.commercialDashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:bg-theme-sidebar-active-bg transition-colors ${isSearchOpen ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text ring-2 ring-theme-sidebar-active-bg' : ''}`}
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5 text-gray-400" />}
            </button>

          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`p-4 rounded-2xl border transition-colors ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('admin.fournisseurDashboard.searchPlaceholder') || 'Rechercher une estimation...'}
                    className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-white/20'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {filteredEstimations.length} résultat{filteredEstimations.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#F0830B] to-orange-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold mb-2">{t('admin.encouragementGood')}</h2>
              <p className="text-amber-100 text-sm mb-6">
                {t('admin.commercialDashboard.heroBody', { count: stats.processed })}
              </p>
              <Link href="/admin/quote-requests" className="inline-block px-6 py-2.5 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-colors shadow-lg shadow-black/10">
                {t('admin.commercialDashboard.heroCta')}
              </Link>
            </div>

            <div className="bg-black/90 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 shadow-2xl border border-white/10">
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-bold">{stats.pending}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.commercialDashboard.pending')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold">{stats.processed}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.commercialDashboard.processed')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Truck className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold">{stats.inDelivery}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.commercialDashboard.inDelivery')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Archive className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-bold">{stats.archived}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.commercialDashboard.archivedPl')}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-12 w-24 h-24 bg-amber-300 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 bg-white static-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:bg-[#F0830B] hover:border-[#F0830B] transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center transition-colors duration-200 group-hover:bg-white/10`}>
                <action.icon className={`w-6 h-6 ${action.color} group-hover:text-white transition-colors duration-200`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 group-hover:text-white transition-colors">{action.label}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent Estimations Table */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">
              {isSearchOpen && searchQuery
                ? `${t('admin.searchResults') || 'Résultats de recherche'}`
                : t('admin.recentEstimations')}
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative flex bg-white p-0.5 gap-1 rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setEstimationMode('vente')}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-3 h-7 text-[9px] font-bold transition-all z-20 uppercase tracking-widest rounded-lg",
                    estimationMode === 'vente' ? "text-white" : "text-zinc-400 hover:text-zinc-900"
                  )}
                >
                  {estimationMode === 'vente' && (
                    <motion.span
                      layoutId="commercial-est-mode"
                      className="absolute inset-0 z-10 bg-[#18181B] rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <ShoppingBag className={cn("w-3 h-3 z-20", estimationMode === 'vente' ? "text-[#A7E40C]" : "text-zinc-400")} />
                  <span className="z-20">{t('admin.saleMode')}</span>
                </button>
                <button
                  onClick={() => setEstimationMode('location')}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-3 h-7 text-[9px] font-bold transition-all z-20 uppercase tracking-widest rounded-lg",
                    estimationMode === 'location' ? "text-white" : "text-zinc-400 hover:text-zinc-900"
                  )}
                >
                  {estimationMode === 'location' && (
                    <motion.span
                      layoutId="commercial-est-mode"
                      className="absolute inset-0 z-10 bg-[#18181B] rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <Calendar className={cn("w-3 h-3 z-20", estimationMode === 'location' ? "text-[#A7E40C]" : "text-zinc-400")} />
                  <span className="z-20">{t('admin.rentalMode')}</span>
                </button>
              </div>
              <Link
                href="/admin/quote-requests"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 group"
              >
                {t('admin.viewAll')}
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <th className="pb-4 font-semibold">{t('admin.number')}</th>
                  <th className="pb-4 font-semibold">{t('admin.client')}</th>
                  <th className="pb-4 font-semibold">{t('admin.status')}</th>
                  <th className="pb-4 font-semibold">{t('admin.amount')}</th>
                  <th className="pb-4 font-semibold">{t('admin.date')}</th>
                  <th className="pb-4 font-semibold text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {loadingQuotes ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredEstimations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                      {searchQuery ? t('admin.noSearchResults') || 'Aucun résultat pour cette recherche' : t('admin.noEstimations') || 'Aucune estimation pour le moment'}
                    </td>
                  </tr>
                ) : filteredEstimations.map((quote) => (
                  <tr key={quote.id} className="group hover:bg-theme-sidebar-active-bg/10 transition-colors">
                    <td className="py-4">
                      <span className="text-sm font-semibold group-hover:text-white transition-colors">{quote.id}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-zinc-400'} transition-colors`}>
                        {quote.client}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${quote.statusBg} ${quote.statusColor} transition-colors`}>
                        {quote.statusLabel}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-bold group-hover:text-white transition-colors">
                        {quote.amount.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-zinc-400'} transition-colors`}>
                        {quote.date}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/quote-requests`}
                          className="p-2 rounded-lg text-gray-400 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Clients */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t('admin.commercialDashboard.topClientsTitle')}</h3>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 group"
            >
              {t('admin.viewAll')}
              <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          {topClients.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
              {t('admin.noClientsYet') || 'Aucun client pour le moment'}
            </p>
          ) : (
            <div className="space-y-4">
              {topClients.map((client, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                    idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{client.name}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {client.deals} devis · {client.revenue.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[320px] space-y-8">
        {/* Profile Card */}
        <div className={`p-6 rounded-[2rem] border text-center relative transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="absolute top-6 right-6 flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t('admin.commercialDashboard.onlineBadge')}</span>
          </div>
          <div className="relative inline-block mb-4">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white dark:border-white/10 shadow-xl mx-auto object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-white/10 shadow-xl mx-auto bg-amber-500 flex items-center justify-center text-white font-bold text-2xl">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold">{userName || 'Commercial'}</h3>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.commercial')}</p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/admin/messages"
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/notifications"
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <Bell className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/quote-requests"
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-4">{t('admin.monthlySummary')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">{t('admin.commercialDashboard.revenueGenerated')}</span>
              </div>
              <span className="text-sm font-bold text-green-600">
                {revenue.total.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{t('admin.commercialDashboard.estimatesCreated')}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{visibleQuotes.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">{t('admin.commercialDashboard.conversionRate')}</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{revenue.conversionRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">{t('admin.commercialDashboard.totalClients') || 'Clients'}</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{topClients.length}</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-6">{t('admin.commercialDashboard.recentActivities')}</h3>
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5"></div>
            {activities.map((activity, idx) => (
              <div key={activity.id} className="relative">
                <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                  idx === 0 ? 'bg-orange-500 border-orange-100 dark:border-orange-900' :
                  idx === 1 ? 'bg-blue-500 border-blue-100 dark:border-blue-900' :
                  'bg-green-500 border-green-100 dark:border-green-900'
                }`} />
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    idx === 0 ? 'text-orange-500' : idx === 1 ? 'text-blue-500' : 'text-green-500'
                  }`}>{activity.user}</span>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {activity.time}
                  </span>
                </div>
                <h4 className="text-xs font-bold mb-1">{activity.action}</h4>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{activity.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
