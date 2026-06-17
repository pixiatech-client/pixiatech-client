'use client';

import React, { useState, useMemo } from 'react';
import { Bell, FileText, Users, Truck, Send, XCircle, ShoppingCart, Archive, ArchiveRestore, X, Video, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationFirestore } from '@/lib/types';
import { useAdminT } from '@/hooks/useAdminT';
import { useI18n } from '@/lib/i18n';
import { translateNotificationDesc } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'estimation' | 'user' | 'message' | 'delivery' | 'estimation_sent' | 'estimation_rejected' | 'order_created' | 'estimation_archived' | 'estimation_unarchived';
  title: string;
  description: string;
  time: string;
  href: string;
  read: boolean;
}

interface NotificationBellProps {
  isDark?: boolean;
  userRole?: string;
}

export function NotificationBell({ isDark = false, userRole }: NotificationBellProps) {
  const { t } = useAdminT();
  const { locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close when navigating
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const firestore = useFirestore();
  const { user } = useUser();



  const notificationsQuery = useMemoFirebase(
    () => firestore && user?.uid ? query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      limit(20)
    ) : null,
    [firestore, user?.uid]
  );
  const { data: firestoreNotifications } = useCollection<NotificationFirestore>(notificationsQuery, { suppressPermissionError: true });

  const notifications = useMemo(() => {
    if (!firestoreNotifications) return [];
    
    // Sort in-memory to avoid Firestore composite index requirement
    const sorted = [...firestoreNotifications].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() ?? new Date(0);
      const bTime = b.createdAt?.toDate?.() ?? new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    return sorted.map((n) => {
      const createdAt = n.createdAt?.toDate ? n.createdAt.toDate() : null;
      const timeAgo = createdAt ? getRelativeTime(createdAt, t, locale) : '';
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        description: translateNotificationDesc(n.type, n.description),
        time: timeAgo,
        href: n.href,
        read: n.read,
      };
    });
  }, [firestoreNotifications]);

  // Mark all as read when opening
  React.useEffect(() => {
    if (isOpen && firestore && user?.uid && notifications.length > 0) {
      const unread = notifications.filter(n => !n.read);
      unread.forEach(notif => {
        updateDoc(doc(firestore, 'notifications', notif.id), { read: true });
      });
    }
  }, [isOpen, firestore, user?.uid, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'estimation': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'user': return <Users className="w-4 h-4 text-blue-500" />;
      case 'message': return <Bell className="w-4 h-4 text-purple-500" />;
      case 'delivery': return <Truck className="w-4 h-4 text-green-500" />;
      case 'estimation_sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'estimation_rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'order_created': return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'estimation_archived': return <Archive className="w-4 h-4 text-gray-500" />;
      case 'estimation_unarchived': return <ArchiveRestore className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative p-2.5 rounded-xl transition-all outline-none focus:outline-none focus-visible:outline-none ${isDark ? 'bg-white/5 hover:bg-theme-sidebar-active-bg' : 'bg-white hover:bg-theme-sidebar-active-bg'} shadow-sm border border-transparent`}
      >
        <Bell className={`w-5 h-5 transition-colors ${isDark ? 'text-gray-400 group-hover:text-rose-400' : 'text-gray-500 group-hover:text-rose-500'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff4d4d] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#E8F3EB] dark:border-zinc-900 shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="fixed md:absolute right-4 md:right-0 top-20 md:top-full mt-3 w-[calc(100vw-2rem)] md:w-[360px] bg-white dark:bg-zinc-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{t("Notifications")}</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] font-bold text-[#ff4d4d] uppercase tracking-wider mt-0.5">
                      {t(`${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`)}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.href}
                      onClick={() => {
                        setIsOpen(false);
                        if (firestore && !notif.read) {
                          updateDoc(doc(firestore, 'notifications', notif.id), { read: true });
                        }
                      }}
                      className="flex items-start gap-4 p-5 hover:bg-theme-sidebar-active-bg/10 dark:hover:bg-white/5 transition-all border-b border-gray-50 dark:border-white/5 last:border-0 relative group"
                    >
                      <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} transition-colors group-hover:bg-white dark:group-hover:bg-white/10`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{t(notif.title)}</p>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-[#3b82f6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{t(notif.description)}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">{notif.time}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t("No notifications")}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("You are up to date!")}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50/50 dark:bg-white/5">
                <Link 
                  href="/admin/notification" 
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold text-gray-600 dark:text-gray-400 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm uppercase tracking-widest"
                >
                  {t("View all notifications")}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function getRelativeTime(date: Date, t: (s: string) => string, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('Just now');
  if (diffMin < 60) return `${diffMin} ${t('min ago')}`;
  if (diffHr < 24) return `${diffHr} ${t('h ago')}`;
  if (diffDay < 7) return `${diffDay} ${t('d ago')}`;
  return date.toLocaleDateString(locale);
}
