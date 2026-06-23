'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function MemberHeader({ customerEmail, customerId }: { customerEmail: string; customerId?: string }) {
  const { t, locale, setLocale } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/80">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-3">
          <img src="/bot-avatars/logo.png" alt="PIXIATECH.PRO" className="w-7 h-7 rounded-lg object-cover shadow-lg" />
          <span className="font-bold text-[15px] tracking-tight text-gray-900">PIXIATECH.PRO</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit" style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">{t('admin.clientSpace')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <BellButton customerId={customerId} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('/', '_blank')}
            title={t('admin.siteAccess')}
            className={cn(
              "group h-11 w-11 rounded-xl shadow-sm transition-all duration-200 hidden md:flex",
              "bg-white hover:bg-theme-sidebar-active-bg"
            )}
          >
            <Globe className={cn("h-5 w-5 transition-colors", "text-gray-400 group-hover:text-emerald-500")} />
            <span className="sr-only">{t('admin.siteAccess')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            title={t('admin.switchLanguage')}
            className={cn(
              "group h-11 w-11 rounded-xl shadow-sm transition-all duration-200 hidden md:flex",
              "bg-white hover:bg-theme-sidebar-active-bg hover:text-blue-700"
            )}
          >
            <span className="text-xs font-black uppercase tracking-wider">{locale === 'fr' ? 'FR' : 'EN'}</span>
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1.5" />
          <span className="text-[13px] text-gray-500 hidden sm:block">{customerEmail}</span>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <form action="/api/boutique/logout" method="POST">
            <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white shadow-sm border border-gray-200/60 text-[12px] font-semibold text-red-600 hover:bg-red-50 hover:border-red-200/60 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('admin.logout')}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function BellButton({ customerId }: { customerId?: string }) {
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
    <Link
      href="/mon-compte/litiges"
      className="group relative p-2.5 rounded-xl transition-all outline-none focus:outline-none focus-visible:outline-none bg-white hover:bg-theme-sidebar-active-bg shadow-sm border border-transparent"
    >
      <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-red-500' : 'text-gray-500 group-hover:text-rose-500'}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ff4d4d] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#E8F3EB] shadow-lg">
          <span className="absolute inset-0 rounded-full animate-ping bg-[#ff4d4d] opacity-50" />
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
