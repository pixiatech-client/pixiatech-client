'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Bell,
  MessageSquare,
  Share2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  Settings,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { useAdminT } from '@/hooks/useAdminT';

const formatDate = (date: Date | null | undefined, locale: string) => {
  if (!date) return '';
  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const getQuoteAmount = (quote: any): number => {
  if (quote.totalAmount != null) return Number(quote.totalAmount);
  if (quote.products?.length) {
    return quote.products.reduce((sum: number, p: any) => sum + (Number(p.totalPrice || p.price || 0) * (p.quantity || 1)), 0);
  }
  return 0;
};

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  processed: { label: 'Traité', color: 'text-blue-600', bg: 'bg-blue-50' },
  in_progress: { label: 'En cours', color: 'text-orange-600', bg: 'bg-orange-50' },
  sent: { label: 'Livré', color: 'text-green-600', bg: 'bg-green-50' },
  delivered: { label: 'Livré', color: 'text-green-600', bg: 'bg-green-50' },
  archived: { label: 'Archivé', color: 'text-gray-600', bg: 'bg-gray-50' },
  returned: { label: 'Retourné', color: 'text-purple-600', bg: 'bg-purple-50' },
  rented: { label: 'Loué', color: 'text-teal-600', bg: 'bg-teal-50' },
};

interface FournisseurDashboardProps {
  userName?: string;
  userAvatar?: string;
  isDark?: boolean;
}

export const FournisseurDashboard: React.FC<FournisseurDashboardProps> = ({ userName, userAvatar, isDark }) => {
  const { t, locale } = useI18n();
  const { t: adt } = useAdminT();
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const uid = userProfile?.uid;

  // Fetch quotes where supplierId matches the current user
  const supplierQuery = useMemoFirebase(() => {
    if (!firestore || !uid) return null;
    return query(
      collection(firestore, 'quotes'),
      where('supplierId', '==', uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, uid]);
  const { data: supplierQuotes, isLoading: loadingSupplier } = useCollection<any>(supplierQuery);

  // Fetch all quotes for status-based filtering (fournisseur visibility)
  const allQuotesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'quotes'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: allQuotesRaw, isLoading: loadingAll } = useCollection<any>(allQuotesQuery);

  // Fetch products count
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  const { data: allProducts } = useCollection<any>(productsQuery);

  // Derive the quotes visible to this fournisseur
  const visibleQuotes = useMemo(() => {
    if (!allQuotesRaw) return [];
    return allQuotesRaw.filter((q: any) => {
      const status = q.status;
      return status === 'in_progress' || status === 'sent' || status === 'delivered' || status === 'returned';
    });
  }, [allQuotesRaw]);

  // Stats
  const stats = useMemo(() => {
    if (!visibleQuotes.length && !supplierQuotes) return { received: 0, inProgress: 0, delivered: 0, products: 0 };

    const assigned = supplierQuotes || [];
    const received = assigned.filter((q: any) => q.status === 'pending' || q.status === 'processed').length;
    const inProgress = visibleQuotes.filter((q: any) => q.status === 'in_progress').length;
    const delivered = visibleQuotes.filter((q: any) => q.status === 'sent' || q.status === 'delivered').length;
    const products = allProducts?.length || 0;

    return { received, inProgress, delivered, products };
  }, [visibleQuotes, supplierQuotes, allProducts]);

  // Recent estimations
  const recentEstimations = useMemo(() => {
    const items = supplierQuotes || visibleQuotes;
    if (!items.length) return [];
    return items.slice(0, 5).map((q: any) => {
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
  }, [supplierQuotes, visibleQuotes, locale]);

  // Quick actions
  const quickActions = [
    { label: adt('Voir les demandes'), icon: Eye, color: 'text-orange-500', bg: 'bg-orange-50', href: '/admin/quote-requests' },
    { label: adt('Gérer les livraisons'), icon: Truck, color: 'text-green-500', bg: 'bg-green-50', href: '/admin/quote-requests?status=sent' },
    { label: adt('Messagerie'), icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', href: '/admin/messages' },
  ];

  const activities = [
    { id: 1, user: 'Admin', action: adt('Nouvelle demande affectée'), details: `Estimation #${recentEstimations[0]?.id || '---'}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'admin' },
  ];

  const isLoading = loadingSupplier && loadingAll;

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen text-gray-900 px-3 md:px-0">
      <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {t('admin.fournisseurDashboard.greeting', { userName: userName || 'Fournisseur' })}
            </h1>
            <p className="text-sm mt-1 text-gray-500">
              {t('admin.fournisseurDashboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/quote-requests"
              className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:bg-theme-sidebar-active-bg transition-colors`}
            >
              <Search className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="/admin/notifications"
              className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'} hover:bg-theme-sidebar-active-bg transition-colors`}
            >
              <Bell className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold mb-2">{t('admin.fournisseurDashboard.heroTitle')}</h2>
              <p className="text-emerald-100 text-sm mb-6">
                {t('admin.fournisseurDashboard.heroBody', { count: stats.delivered })}
              </p>
              <Link href="/admin/quote-requests" className="inline-block px-6 py-2.5 bg-white text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10">
                {t('admin.fournisseurDashboard.heroCta')}
              </Link>
            </div>

            <div className="bg-black/90 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 shadow-2xl border border-white/10">
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-bold">{stats.received}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.fournisseurDashboard.statReceived')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-bold">{stats.inProgress}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.fournisseurDashboard.statInProgress')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Truck className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold">{stats.delivered}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.fournisseurDashboard.statDelivered')}</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-bold">{stats.products}</span>
                <span className="text-[9px] text-gray-400 uppercase tracking-wider">{t('admin.fournisseurDashboard.statProducts')}</span>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-12 w-24 h-24 bg-emerald-300 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:bg-theme-sidebar-active-bg hover:border-zinc-800 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center transition-colors`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 group-hover:text-white transition-colors">{action.label}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#95d230] transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent Estimations Table */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">{t('admin.recentEstimations')}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-500 cursor-pointer hover:underline">
              <Link href="/admin/quote-requests">{t('admin.viewAll')}</Link> <ChevronRight className="w-3 h-3" />
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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : recentEstimations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 italic">
                      {t('admin.noEstimations') || 'Aucune estimation pour le moment'}
                    </td>
                  </tr>
                ) : recentEstimations.map((quote) => (
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
                          href={`/admin/quote-requests?id=${quote.raw?.id}`}
                          className="p-2 rounded-lg text-gray-400 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-2 rounded-lg text-gray-400 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{t('admin.fournisseurDashboard.totalRevenue') || 'Chiffre d\'affaires'}</h3>
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-black">
              {visibleQuotes.reduce((sum: number, q: any) => sum + getQuoteAmount(q), 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {visibleQuotes.length} {t('admin.estimations') || 'estimations'}
            </p>
          </div>
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{t('admin.fournisseurDashboard.avgPerQuote') || 'Moyen par devis'}</h3>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-black">
              {visibleQuotes.length > 0
                ? (visibleQuotes.reduce((sum: number, q: any) => sum + getQuoteAmount(q), 0) / visibleQuotes.length).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })
                : '0 €'}
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('admin.fournisseurDashboard.estimatesProcessed') || 'Devis traités'}
            </p>
          </div>
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">{t('admin.fournisseurDashboard.productsManaged') || 'Produits gérés'}</h3>
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-black">{stats.products}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t('admin.products') || 'Produits'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[320px] space-y-8">
        {/* Profile Card */}
        <div className={`p-6 rounded-[2rem] border text-center relative transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="absolute top-6 right-6 flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{t('admin.fournisseurDashboard.online')}</span>
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
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-white/10 shadow-xl mx-auto bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold">{userName || 'Fournisseur'}</h3>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t('admin.supplier')}</p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/admin/messages"
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/quote-requests"
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-4">{t('admin.monthlySummary')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">{t('admin.fournisseurDashboard.totalRevenue')}</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {visibleQuotes.reduce((sum: number, q: any) => sum + getQuoteAmount(q), 0).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">{t('admin.fournisseurDashboard.estimatesCompleted') || 'Devis complétés'}</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{stats.delivered}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{t('admin.fournisseurDashboard.inProgress') || 'En cours'}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats.inProgress}</span>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-6">{t('admin.fournisseurDashboard.activitiesRecent')}</h3>
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5"></div>
            {activities.length === 0 ? (
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
                {t('admin.noRecentActivity') || 'Aucune activité récente'}
              </p>
            ) : activities.map((activity, idx) => (
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
