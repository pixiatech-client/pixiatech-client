'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, FileText, Users, Truck, Send, XCircle, ShoppingCart, Archive, ArchiveRestore, CheckCircle2, Settings, Bell, Trash2, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { NotificationFirestore } from '@/lib/types';

type NotificationCategory = 'all' | 'unread' | 'messages' | 'system';

function NotificationPage() {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [isLoading, setIsLoading] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  const notificationsQuery = useMemoFirebase(
    () => {
      if (!firestore || !user?.uid) return null;
      return query(
        collection(firestore, 'notifications'),
        where('userId', '==', user.uid)
      );
    },
    [firestore, user?.uid]
  );
  
  const { data: firestoreNotifications } = useCollection<NotificationFirestore>(notificationsQuery, { suppressPermissionError: true });

  const notifications = useMemo(() => {
    if (!firestoreNotifications) return [];
    // Tri manuel par date décroissante (évite les erreurs d'index Firestore)
    const sorted = [...firestoreNotifications].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ?? new Date(0);
      const bTime = b.createdAt?.toDate?.() ?? new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    return sorted.map((n) => {
      const createdAt = n.createdAt?.toDate ? n.createdAt.toDate() : null;
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        description: n.description,
        time: createdAt ? getRelativeTime(createdAt) : '',
        href: n.href,
        read: n.read,
        createdAt,
        quoteRequestId: n.quoteRequestId,
        supplierId: n.supplierId,
      };
    });
  }, [firestoreNotifications]);

  const filteredNotifications = useMemo(() => {
    switch (activeCategory) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'messages':
        return notifications.filter(n => n.type === 'message');
      case 'system':
        return notifications.filter(n => ['system', 'estimation', 'estimation_sent', 'estimation_rejected', 'order_created', 'estimation_archived', 'estimation_unarchived'].includes(n.type));
      default:
        return notifications;
    }
  }, [notifications, activeCategory]);

  const unreadCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    messages: notifications.filter(n => n.type === 'message').length,
    system: notifications.filter(n => ['system', 'estimation', 'estimation_sent', 'estimation_rejected', 'order_created', 'estimation_archived', 'estimation_unarchived'].includes(n.type)).length,
  }), [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'estimation': return { icon: FileText, color: 'bg-orange-50 text-orange-600' };
      case 'user': return { icon: Users, color: 'bg-blue-50 text-blue-600' };
      case 'message': return { icon: MessageSquare, color: 'bg-purple-50 text-purple-600' };
      case 'delivery': return { icon: Truck, color: 'bg-green-50 text-green-600' };
      case 'estimation_sent': return { icon: Send, color: 'bg-blue-50 text-blue-600' };
      case 'estimation_rejected': return { icon: XCircle, color: 'bg-red-50 text-red-600' };
      case 'order_created': return { icon: ShoppingCart, color: 'bg-green-50 text-green-600' };
      case 'estimation_archived': return { icon: Archive, color: 'bg-gray-50 text-gray-600' };
      case 'estimation_unarchived': return { icon: ArchiveRestore, color: 'bg-blue-50 text-blue-600' };
      default: return { icon: Bell, color: 'bg-gray-50 text-gray-600' };
    }
  };

  const markAsRead = async (id: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!firestore || notifications.length === 0) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(firestore);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(firestore, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const sections = [
    {
      title: "Boîte de réception",
      items: [
        { id: 'all' as const, label: 'Tous', icon: Bell, count: unreadCounts.all },
        { id: 'unread' as const, label: 'Non lu', icon: Mail, count: unreadCounts.unread },
      ]
    },
    {
      title: "Communication",
      items: [
        { id: 'messages' as const, label: 'Messages directs', icon: MessageSquare, count: unreadCounts.messages },
      ]
    },
    {
      title: "Opérations Système",
      items: [
        { id: 'system' as const, label: 'Activités & Estimations', icon: Settings, count: unreadCounts.system },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#E8F3EB] font-sans text-gray-900">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 hidden md:block">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500 hidden md:block">Restez informé des dernières activités de votre plateforme.</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={handleMarkAllAsRead}
              disabled={unreadCounts.unread === 0 || isLoading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Marquer tout comme lu</span>
              <span className="sm:hidden">Tout lire</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar / Categories */}
          <div className="w-full lg:w-64 shrink-0 space-y-6 lg:space-y-8 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
            <div className="flex lg:flex-col gap-6 lg:gap-8 min-w-max lg:min-w-0">
              {sections.map((section, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <h3 className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {section.title}
                  </h3>
                  <nav className="flex lg:flex-col gap-1">
                    {section.items.map((filter) => {
                      const Icon = filter.icon;
                      const isActive = activeCategory === filter.id;
                      
                      return (
                        <button
                          key={filter.id}
                          onClick={() => setActiveCategory(filter.id)}
                          className={`group flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap lg:whitespace-normal ${
                            isActive 
                              ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text shadow-lg" 
                              : "text-gray-600 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`} />
                            {filter.label}
                          </div>
                          {filter.count > 0 && (
                            <span className={`ml-3 flex h-5 w-fit min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                              isActive ? "bg-white/20 text-white" : "bg-red-50 text-red-600"
                            }`}>
                              {filter.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden rounded-[2rem] border border-white bg-white/60 backdrop-blur-xl shadow-xl shadow-black/5">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100/50">
                {filteredNotifications.map((notif) => {
                  const { icon: Icon, color } = getIcon(notif.type);
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative flex gap-4 p-5 transition-all hover:bg-white/80 ${!notif.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${color}`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h4 className={`text-base font-bold text-gray-900 ${!notif.read ? 'text-blue-900' : ''} truncate`}>
                            {notif.title}
                          </h4>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {notif.time}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                          {notif.description}
                        </p>

                        <div className="mt-3 flex items-center gap-6">
                          <Link 
                            href={notif.href || '#'}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-theme-sidebar-active-bg transition-colors"
                          >
                            Détails
                          </Link>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              Marquer lu
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all ml-auto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-gray-200 shadow-inner">
                  <Bell className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Aucune notification</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                  {activeCategory === 'unread' 
                    ? "Génial ! Vous avez lu toutes vos notifications importantes." 
                    : "Votre boîte de réception est vide pour le moment."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHr < 24) return `Il y a ${diffHr}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;
  return date.toLocaleDateString('fr-FR');
}

export default NotificationPage;