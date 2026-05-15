'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Truck,
  Archive,
  TrendingUp,
  Search,
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
  ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CommercialDashboardProps {
  userName?: string;
  userAvatar?: string;
  isDark?: boolean;
}

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ userName, userAvatar, isDark }) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const stats = [
    { label: 'En attente', value: 8, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Traitées', value: 15, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'En livraison', value: 6, icon: Truck, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Archivées', value: 23, icon: Archive, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  const quickActions: { label: string; action: string; icon: any; color: string; href: string; bg: string }[] = [];

  const recentEstimations = [
    { id: 'EST-2026-001', client: 'Jean Dupont', status: 'En attente', amount: '1 250,50 €', date: '25 mars 2026' },
    { id: 'EST-2026-002', client: 'Marie Curie', status: 'Traité', amount: '1 020,00 €', date: '26 mars 2026' },
    { id: 'EST-2026-006', client: 'Sophie Durand', status: 'En attente', amount: '4 080,00 €', date: '29 mars 2026' },
    { id: 'EST-2026-007', client: 'Luc Lefebvre', status: 'Traité', amount: '672,24 €', date: '29 mars 2026' },
  ];

  const topClients = [
    { name: 'Jean Dupont', deals: 5, revenue: '8 450 €', trend: '+15%', trendUp: true },
    { name: 'Marie Curie', deals: 3, revenue: '4 200 €', trend: '+8%', trendUp: true },
    { name: 'Sophie Durand', deals: 2, revenue: '2 850 €', trend: '-5%', trendUp: false },
    { name: 'Luc Lefebvre', deals: 1, revenue: '1 200 €', trend: '+12%', trendUp: true },
  ];

  const activities = [
    { id: 1, user: 'Jean Dupont', action: 'Nouvelle estimation', details: 'Estimation #EST-2026-001 pour 1 250€', time: '14:32', type: 'client' },
    { id: 2, user: 'Vous', action: 'Estimation validée', details: 'Estimation #EST-2026-002 traitée', time: '11:15', type: 'self' },
    { id: 3, user: 'Sophie Durand', action: 'Paiement reçu', details: 'Montant: 4 080€ pour #EST-2026-006', time: '09:45', type: 'payment' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-screen text-gray-900 px-3 md:px-0">
      <div className="flex-1 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bonjour, {userName || 'Commercial'} 👋</h1>
            <p className="text-sm mt-1 text-gray-500">
              Gérez vos estimations etSuivez votre activité.
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
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-md">
              <h2 className="text-xl font-semibold mb-2">Vous êtes en bonne voie !</h2>
              <p className="text-amber-100 text-sm mb-6">
                Vous avez traité <span className="font-bold text-white">15 estimations</span> ce mois-ci. Continuez vos efforts&nbsp;!
              </p>
              <Link href="/admin/quote-requests" className="inline-block px-6 py-2.5 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-colors shadow-lg shadow-black/10">
                Voir les détails
              </Link>

            </div>

            <div className="bg-black/90 backdrop-blur-md rounded-3xl p-4 flex items-center gap-2 shadow-2xl border border-white/10">
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-bold">8</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-bold">15</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Truck className="w-5 h-5 text-green-400" />
                <span className="text-lg font-bold">6</span>
              </div>
              <div className="flex flex-col items-center gap-1 min-w-[40px]">
                <Archive className="w-5 h-5 text-gray-400" />
                <span className="text-lg font-bold">23</span>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-full opacity-20 pointer-events-none">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 right-12 w-24 h-24 bg-amber-300 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#95d230] transition-colors" />
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
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        quote.status === 'En attente' ? 'bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20 group-hover:text-yellow-400' :
                        quote.status === 'Traité' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 group-hover:text-blue-400' :
                        quote.status === 'En livraison' ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20 group-hover:text-green-400' :
                        quote.status === 'Retourné' ? 'bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20 group-hover:text-violet-400' :
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

        {/* Top Clients */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Mes meilleurs clients</h3>
            <Link href="/admin/users" className="text-xs font-medium text-blue-500 cursor-pointer hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-4">
            {topClients.map((client, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-blue-500'
                  }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{client.name}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{client.deals} deals • {client.revenue}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${client.trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {client.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {client.trend}
                </div>
              </div>
            ))}
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
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-white/10 shadow-xl mx-auto bg-amber-500 flex items-center justify-center text-white font-bold text-2xl">
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold">{userName || 'Commercial'}</h3>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Commercial</p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              href="/admin/quote-requests"
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

        {/* Stats Summary */}
        <div className={`p-6 rounded-[2rem] border transition-colors duration-300 ${isDark ? 'bg-[#141414] border-white/5 text-white' : 'bg-white border-gray-200 shadow-sm text-gray-900'}`}>
          <h3 className="text-sm font-bold mb-4">Résumé du mois</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Revenus générés</span>
              </div>
              <span className="text-lg font-bold text-green-600">7 022 €</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Estimations créées</span>
              </div>
              <span className="text-lg font-bold text-blue-600">23</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Taux de conversion</span>
              </div>
              <span className="text-lg font-bold text-amber-600">65%</span>
            </div>
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
                <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-lg transition-all ${day === 2
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
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
                <div className={`absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-orange-500 border-orange-100 dark:border-orange-900' :
                  idx === 1 ? 'bg-blue-500 border-blue-100 dark:border-blue-900' :
                    'bg-green-500 border-green-100 dark:border-green-900'
                  }`}></div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? 'text-orange-500' : idx === 1 ? 'text-blue-500' : 'text-green-500'
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