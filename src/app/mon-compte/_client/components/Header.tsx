'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  LogOut,
  Truck,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientNotification, ClientProfile, ClientTab } from '../types';

interface HeaderProps {
  user: Pick<ClientProfile, 'name' | 'email' | 'avatarUrl' | 'companyName'> | null;
  notifications: ClientNotification[];
  onNavigate: (tab: ClientTab) => void;
  onLogout: () => void;
  onMarkNotificationsAsRead: () => void;
}

export function Header({ user, notifications, onNavigate, onLogout, onMarkNotificationsAsRead }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) setShowNotifMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const firstName = user?.name?.split(' ')[0] || 'Client';
  const avatarFallback = (user?.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="w-full max-w-[1536px] mx-auto px-3 sm:px-6 pt-3 pb-1">
      <header
        id="pixiatech-main-header"
        className="w-full bg-[#0A0D0E] text-white border border-[#262D30] rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 select-none"
      >
        <div className="flex items-center gap-3 shrink-0">
          <div
            id="brand-logo-client"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group select-none"
            title="Accueil PIXIATECH Client"
          >
            <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white font-mono">PIXIATECH</span>
            <span className="bg-[#38E044] text-black font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full tracking-wide shadow-[0_0_12px_rgba(56,224,68,0.45)]">
              CLIENT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            id="btn-access-site"
            href="/boutique"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Accéder au site PIXIATECH"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 flex items-center justify-center text-neutral-400">
                <FileText className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-xs">Accéder au site</span>
              <ExternalLink className="w-3 h-3 text-neutral-400 ml-0.5" />
            </span>
          </a>

          <div className="relative" ref={notifMenuRef}>
            <button
              id="header-notifications-button"
              type="button"
              onClick={() => {
                setShowNotifMenu((v) => {
                  if (!v && unreadCount > 0) onMarkNotificationsAsRead();
                  return !v;
                });
              }}
              className="relative p-2 rounded-xl bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#38E044] text-black text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#12181B] border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 px-2">
                    <div className="font-bold text-sm text-white">Notifications</div>
                    <span className="text-[11px] text-neutral-400">{notifications.length} événement(s)</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/60 mt-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-400">Aucune notification pour le moment.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 hover:bg-neutral-800/40 rounded-xl transition-colors cursor-pointer text-left"
                          onClick={() => {
                            if (notif.linkTab) onNavigate(notif.linkTab as ClientTab);
                            setShowNotifMenu(false);
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-neutral-800 shrink-0 mt-0.5">
                              {notif.type === 'invoice' && <FileText className="w-3.5 h-3.5 text-[#38E044]" />}
                              {notif.type === 'delivery' && <Truck className="w-3.5 h-3.5 text-sky-400" />}
                              {notif.type === 'dispute' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                              {notif.type === 'order' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-neutral-200">{notif.title}</div>
                              <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{notif.message}</div>
                              <div className="text-[10px] text-neutral-500 mt-1">{notif.date}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              id="header-user-profile-button"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 transition-colors cursor-pointer select-none"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-[#38E044] text-black text-xs font-bold flex items-center justify-center border border-neutral-700">
                  {avatarFallback}
                </span>
              )}
              <span className="hidden sm:inline text-xs font-semibold text-neutral-200 max-w-[120px] truncate">{firstName}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2 w-64 bg-[#12181B] border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50"
                >
                  <div className="p-3 border-b border-neutral-800/80">
                    <div className="font-bold text-sm text-white truncate">{user?.name || 'Client'}</div>
                    <div className="text-[11px] text-neutral-400 truncate">{user?.email || ''}</div>
                    {user?.companyName ? (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-[10px] text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                        <span className="truncate max-w-[170px]">{user.companyName}</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                        <span>Espace Client</span>
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-neutral-400" />
                      <span>Mon Profil & Paramètres</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('invoices');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <span>Mes Factures</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-neutral-800">
                    <button
                      id="btn-logout-header"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </div>
  );
}