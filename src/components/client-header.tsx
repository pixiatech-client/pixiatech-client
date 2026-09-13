'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Globe, ExternalLink, ChevronDown, FileText, LogOut, UserCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function ClientHeader({ customerEmail, customerId }: { customerEmail: string; customerId?: string }) {
  const { t, locale, setLocale } = useI18n();
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

  return (
    <div className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 pt-3">
      <header className="w-full max-w-[1536px] mx-auto bg-[#0A0D0E] text-white border border-[#262D30] rounded-2xl px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 select-none">
        {/* Branding */}
        <Link href="/mon-compte/tableau-de-bord" className="flex items-center gap-2 cursor-pointer group shrink-0" title="Accueil PIXIATECH Client">
          <span className="font-extrabold text-lg sm:text-xl tracking-wider text-white font-mono">PIXIATECH</span>
          <span className="bg-[#38E044] text-black font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full tracking-wide shadow-[0_0_12px_rgba(56,224,68,0.45)]">
            CLIENT
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Accéder au site PIXIATECH (nouvel onglet)"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-xs">{t('admin.siteAccess')}</span>
            <ExternalLink className="w-3 h-3 text-neutral-400 ml-0.5" />
          </a>

          {/* Notifications dropdown */}
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-xl bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title={t('client.dashboard.notifications')}
            >
              <NotifBadge />
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#12181B] border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-2 pb-2 border-b border-neutral-800 text-xs font-bold text-white">
                  {t('client.dashboard.notifications')}
                </div>
                <div className="p-4 text-center text-xs text-neutral-400">
                  <p>Vos notifications de litiges sont visibles depuis votre tableau de bord.</p>
                  <Link
                    href="/mon-compte/litiges"
                    onClick={() => setShowNotifMenu(false)}
                    className="inline-block mt-2.5 px-3 py-1.5 rounded-xl bg-[#38E044] text-black font-bold text-[11px] hover:opacity-90 transition-opacity"
                  >
                    Voir mes litiges
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            title={t('admin.switchLanguage')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold uppercase">{locale === 'fr' ? 'FR' : 'EN'}</span>
          </button>

          {/* User profile chip & menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#141B1E] hover:bg-[#1C2529] border border-neutral-800 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-full bg-[#38E044] text-black text-[11px] font-black flex items-center justify-center border border-neutral-700 uppercase">
                {initials(customerEmail)}
              </span>
              <span className="hidden sm:inline text-xs font-semibold text-neutral-200 max-w-[140px] truncate">
                {customerEmail.split('@')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#12181B] border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="p-3 border-b border-neutral-800/80">
                  <div className="text-[11px] text-neutral-400 truncate">{customerEmail}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                    <span>Espace Client</span>
                  </div>
                </div>
                <div className="py-1">
                  <Link
                    href="/mon-compte/parametres/profil"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-neutral-400" />
                    <span>{t('client.settings.myProfile')}</span>
                  </Link>
                  <Link
                    href="/mon-compte/factures"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>{t('client.invoices.title')}</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-neutral-800">
                  <form action="/api/boutique/logout" method="POST">
                    <button type="submit" className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer">
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>{t('admin.logout')}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

function initials(email: string) {
  const local = email.split('@')[0] || 'C';
  const parts = local.split(/[._\-\s]+/).filter(Boolean);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]) : local.slice(0, 2);
}

function NotifBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/boutique/litige/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <>
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#38E044] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </>
  );
}