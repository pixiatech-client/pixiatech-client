'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package,
  Archive,
  Trash2,
  Users,
  TrendingUp,
  Calendar as CalendarIcon,
  Filter,
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
  Package as PackageIcon,
  ShoppingCart,
  AlertCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FournisseurDashboardProps {
  userName?: string;
  userAvatar?: string;
  isDark?: boolean;
}

export const FournisseurDashboard: React.FC<FournisseurDashboardProps> = ({ userName, userAvatar, isDark }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const stats = [
    { label: 'Estimations reçues', value: 12, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'En cours', value: 5, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Livrées', value: 47, icon: Truck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Produits', value: 23, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const recentEstimations = [
    { id: 'EST-2026-001', client: 'Jean Dupont', status: 'En attente', amount: '1 250,50 €', date: '25 mars 2026' },
    { id: 'EST-2026-003', client: 'Robert Martin', status: 'Livrée', amount: '2 100,25 €', date: '27 mars 2026' },
    { id: 'EST-2026-008', client: 'Emma Leroy', status: 'En cours', amount: '1 750,00 €', date: '30 mars 2026' },
    { id: 'EST-2026-009', client: 'Lucas Bernard', status: 'En attente', amount: '890,00 €', date: '01 avr. 2026' },
  ];

  const topProducts = [
    { name: 'Module Solar X1', sales: 15, revenue: '12 450 €', trend: '+12%', trendUp: true },
    { name: 'Panneau Photovoltaïque Pro', sales: 8, revenue: '8 320 €', trend: '+5%', trendUp: true },
    { name: 'Kit Installation Complete', sales: 6, revenue: '6 180 €', trend: '-2%', trendUp: false },
    { name: 'Batterie Stockage Ultra', sales: 4, revenue: '4 800 €', trend: '+8%', trendUp: true },
  ];

  const quickActions: { label: string; action: string; icon: any; color: string; href: string; bg: string }[] = [];

  const activities = [
    { id: 1, user: 'Jean Dupont', action: 'Nouvelle estimation', details: 'Estimation #EST-2026-009 pour 890€', time: '10:32', type: 'client' },
    { id: 2, user: 'Admin', action: 'Estimation validée', details: 'Estimation #EST-2026-003 approuvée', time: '09:15', type: 'admin' },
    { id: 3, user: 'Sophie Durand', action: 'Paiement reçu', details: 'Montant: 2 100€ pour #EST-2026-003', time: '14:22', type: 'payment' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen text-gray-900 px-3 md:px-0">
      <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bonjour, {userName || 'Fournisseur'} 👋</h1>
            <p className="text-sm mt-1 text-gray-500">
              Voici ce qui se passe sur vos estimations aujourd'hui.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <Search className="w-5 h-5 text-gray-400" />
            </button>
            <button className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold mb-2">Vos performances sont excellentes !</h2>
              <p className="text-emerald-100 text-sm mb-6">
                Vous avez traité <span className="font-bold text-white">47 commandes</span> ce mois-ci. Continuez comme ça !
              </p>
              <Link href="/admin/quote-requests" className="inline-block px-6 py-2.5 bg-white text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10">
                Voir les détails
              </Link>
            </div>

            <div className="bg-black/90 backdrop-blur-md rounded-3xl p-4 flex items-center gap-2 shadow-2xl border border-white/10">
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <FileText className="w-5 h-5 text-orange-400" />
                <span className="text-lg font-bold">12</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-bold">5</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Truck className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold">47</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-bold">23</span>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-12 w-24 h-24 bg-emerald-300 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:bg-black hover:border-zinc-800 transition-all"
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
            <h3 className="text-lg font-bold">Estimations récentes</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-500 cursor-pointer hover:underline">
              <Link href="/admin/quote-requests">Voir tout</Link> <ChevronRight className="w-3 h-3" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <th className="pb-4 font-semibold">Numéro</th>
                  <th className="pb-4 font-semibold">Client</th>
                  <th className="pb-4 font-semibold">Statut</th>
                  <th className="pb-4 font-semibold">Montant</th>
                  <th className="pb-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {recentEstimations.map((quote) => (
                  <tr key={quote.id} className="group hover:bg-black transition-colors">
                    <td className="py-4">
                      <span className="text-sm font-semibold group-hover:text-white transition-colors">{quote.id}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-zinc-400'} transition-colors`}>
                        {quote.client}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        quote.status === 'En attente' ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 group-hover:text-yellow-400' :
                        quote.status === 'Livrée' ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20 group-hover:text-green-400' :
                        quote.status === 'En cours' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 group-hover:text-blue-400' :
                        'bg-gray-500/10 text-gray-500 group-hover:bg-zinc-800 group-hover:text-zinc-400'
                      } transition-colors`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-bold group-hover:text-white transition-colors">{quote.amount}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-zinc-400'} transition-colors`}>
                        {quote.date}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white group-hover:text-zinc-400 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:bg-zinc-800 hover:text-white group-hover:text-zinc-400 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products & Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Products */}
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Produits les plus vendus</h3>
              <Link href="/admin/produits" className="text-xs font-medium text-blue-500 cursor-pointer hover:underline">Voir tout</Link>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-purple-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{product.name}</h4>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{product.sales} ventes • {product.revenue}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${product.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {product.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {product.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Alertes & Notifications</h3>
              <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full">3 nouvelles</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Stock faible</p>
                  <p className="text-xs text-gray-500">Module Solar X1 - 3 unités restantes</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Estimation en attente</p>
                  <p className="text-xs text-gray-500">EST-2026-009 en attente depuis 2 jours</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Paiement reçu</p>
                  <p className="text-xs text-gray-500">2 100€ pour estimation #EST-2026-003</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[320px] space-y-8">
        {/* Profile Card */}
        <div className={`p-6 rounded-[2rem] border text-center relative transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="absolute top-6 right-6 flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">En ligne</span>
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
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-white/10 shadow-xl mx-auto bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold">{userName || 'Fournisseur'}</h3>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Fournisseur</p>
          
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link 
              href={`/admin/users/`}
              className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <MessageSquare className="w-4 h-4 text-gray-400" />
            </Link>
            <button className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <Bell className="w-4 h-4 text-gray-400" />
            </button>
            <button className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <Share2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold">Avril 2026</h3>
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer" />
              <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(day => (
              <span key={day} className={`text-[10px] font-bold uppercase ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{day}</span>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <div key={day} className="flex items-center justify-center py-1">
                <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  day === 2 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : `${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'}`
                }`}>
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-6">Activités récentes</h3>
          <div className="relative space-y-6 pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-white/5"></div>
            {activities.map((activity, idx) => (
              <div key={activity.id} className="relative">
                <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                  idx === 0 ? 'bg-orange-500 border-orange-100 dark:border-orange-900' : 
                  idx === 1 ? 'bg-blue-500 border-blue-100 dark:border-blue-900' :
                  'bg-green-500 border-green-100 dark:border-green-900'
                }`}></div>
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