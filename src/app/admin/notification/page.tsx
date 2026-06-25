'use client';

import React, { useState, useMemo } from 'react';
import { MessageSquare, FileText, Users, Truck, Send, XCircle, ShoppingCart, Archive, ArchiveRestore, CheckCircle2, Settings, Bell, Trash2, Mail, Clock, Database } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { motion } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import Link from 'next/link';
import { NotificationFirestore } from '@/lib/types';
import { useI18n } from '@/lib/i18n';
import { useAdminT } from '@/hooks/useAdminT';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { translateNotificationDesc } from '@/lib/utils';

type NotificationCategory = 'all' | 'unread' | 'messages' | 'system';

function NotificationPage() {
  const { t } = useI18n();
  const { t: nt } = useAdminT();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('notification.justNow');
    if (diffMin < 60) return t('notification.minAgo', { min: String(diffMin) });
    if (diffHr < 24) return t('notification.hAgo', { h: String(diffHr) });
    if (diffDay < 7) return t('notification.dAgo', { d: String(diffDay) });
    return date.toLocaleDateString('en-US');
  };

  const notifications = useMemo(() => {
    if (!firestoreNotifications) return [];
    // Manual sort by descending date (avoids Firestore index errors)
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
        description: translateNotificationDesc(n.type, n.description),
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
        return notifications.filter(n => ['system', 'estimation', 'delivery', 'estimation_sent', 'estimation_rejected', 'order_created', 'estimation_archived', 'estimation_unarchived'].includes(n.type));
      default:
        return notifications;
    }
  }, [notifications, activeCategory]);

  const unreadCounts = useMemo(() => ({
    all: notifications.filter(n => !n.read).length,
    unread: notifications.filter(n => !n.read).length,
    messages: notifications.filter(n => n.type === 'message' && !n.read).length,
    system: notifications.filter(n => ['system', 'estimation', 'delivery', 'estimation_sent', 'estimation_rejected', 'order_created', 'estimation_archived', 'estimation_unarchived'].includes(n.type) && !n.read).length,
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
    if (!firestore || unreadCounts.unread === 0) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(firestore);
      const unreadNotifs = notifications.filter(n => !n.read);
      
      unreadNotifs.forEach(n => {
        batch.update(doc(firestore, 'notifications', n.id), { read: true });
      });
      
      await batch.commit();
      sonnerToast.success(t('notification.markedAsRead', { count: unreadNotifs.length }));
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      sonnerToast.error(t('notification.errorMarkRead', { message: error.message }));
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

  const handleDeleteAll = async () => {
    if (!firestore || !notifications || notifications.length === 0) {
      sonnerToast.error(t('notification.noNotifsToDelete'));
      return;
    }
    
    setIsLoading(true);
    try {
      // Process in chunks of 500 (Firestore batch limit)
      const chunks = [];
      for (let i = 0; i < notifications.length; i += 500) {
        chunks.push(notifications.slice(i, i + 500));
      }
      
      for (const chunk of chunks) {
        const batch = writeBatch(firestore);
        chunk.forEach(notif => {
          if (notif.id) {
            batch.delete(doc(firestore, 'notifications', notif.id));
          }
        });
        await batch.commit();
      }
      
      sonnerToast.success(t('notification.deletedSuccess', { count: notifications.length }));
    } catch (error: any) {
      console.error('Error during bulk delete:', error);
      sonnerToast.error(t('notification.errorDeleting', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    {
        title: t('notification.inbox'),
      items: [
        { id: 'all' as const, label: t('notification.all'), icon: Bell, count: unreadCounts.all },
        { id: 'unread' as const, label: t('notification.unread'), icon: Mail, count: unreadCounts.unread },
      ]
    },
    {
      title: t('notification.communication'),
      items: [
        { id: 'messages' as const, label: t('notification.directMessages'), icon: MessageSquare, count: unreadCounts.messages },
      ]
    },
    {
      title: t('notification.systemOperations'),
      items: [
        { id: 'system' as const, label: t('notification.activitiesEstimates'), icon: Settings, count: unreadCounts.system },
      ]
    }
  ];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--theme-page-bg)', color: 'var(--theme-sidebar-text)' }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight hidden md:block" style={{ color: 'var(--theme-sidebar-text)' }}>{t('notification.title')}</h1>
            <p className="mt-1 text-sm opacity-60 hidden md:block">{t('notification.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={handleMarkAllAsRead}
              disabled={unreadCounts.unread === 0 || isLoading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs md:text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('notification.markAllAsRead')}</span>
              <span className="sm:hidden">{t('notification.readAll')}</span>
            </button>
            <button 
              onClick={() => setConfirmDeleteAll(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-600 px-4 py-2.5 text-xs md:text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('notification.deleteAll')}</span>
              <span className="sm:hidden">{t('notification.deleteAll')}</span>
            </button>

            <ConfirmDialog
              open={confirmDeleteAll}
              onOpenChange={setConfirmDeleteAll}
              title={t('notification.deleteAll')}
              subtitle="Cette action est irréversible"
              description={t('notification.confirmDeleteAll', { count: notifications.length })}
              confirmText={t('notification.deleteAll')}
              headerColor="bg-red-600"
              confirmButtonClass="bg-red-600 hover:bg-red-700"
              icon={<Trash2 className="w-6 h-6 text-white" />}
              onConfirm={() => {
                setConfirmDeleteAll(false);
                handleDeleteAll();
              }}
            />
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
          <div className="flex-1 overflow-hidden rounded-[2rem] border border-theme-card-border bg-theme-card/60 backdrop-blur-xl shadow-xl shadow-black/5">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-theme-card-border/50">
                {filteredNotifications.map((notif) => {
                  const { icon: Icon, color } = getIcon(notif.type);
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative flex gap-4 p-5 transition-all hover:bg-theme-hover/80 ${!notif.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${color}`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <h4 className={`text-base font-bold text-theme-text ${!notif.read ? 'text-blue-600' : ''} truncate`}>
                            {nt(notif.title)}
                          </h4>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                            <Clock className="h-3 w-3" />
                            {notif.time}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                          {nt(notif.description)}
                        </p>

                        <div className="mt-3 flex items-center gap-6">
                          <Link 
                            href={notif.href || '#'}
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-theme-sidebar-active-bg transition-colors"
                          >
                            {t('notification.details')}
                          </Link>
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              {t('notification.markRead')}
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
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-theme-card text-theme-text-secondary shadow-inner">
                  <Bell className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-theme-text">{t('notification.noNotifications')}</h3>
                <p className="mt-2 text-sm text-theme-text-secondary max-w-xs">
                  {activeCategory === 'unread' 
                    ? t('notification.allRead')
                    : t('notification.inboxEmpty')}
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

export default NotificationPage;