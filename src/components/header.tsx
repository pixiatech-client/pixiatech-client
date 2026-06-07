'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n, IntlHelpers } from '@/lib/i18n';
import settings from '@/data/settings.json';

export function Header({ pageTitle, pageIcon: PageIcon }: { pageTitle?: string; pageIcon?: React.ElementType } = {}) {
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr');
  };

  const LoginButton = () => {
    if (!isClient || isUserLoading) {
      return <Skeleton className="h-10 w-12 rounded-lg" />;
    }

    const isLoggedIn = user && !user.isAnonymous;

    return (
      <Button
        asChild
        variant="outline"
        size="icon"
        className="group w-12 border-zinc-200 hover:border-zinc-350"
      >
        <Link href={isLoggedIn ? "/admin" : "/admin/login"} title="Administration">
          <LogIn className="h-[18px] w-[18px] text-zinc-700 group-hover:text-zinc-900" />
        </Link>
      </Button>
    );
  }

  const Greeting = () => {
    if (!isClient || isUserLoading || !user || user.isAnonymous) return null;
    const displayName = user.displayName || t('common.user');
    const greeting = IntlHelpers.formatGreeting(displayName, locale);
    return (
      <span className="text-sm font-bold text-zinc-700 truncate max-w-[200px] hidden md:block">
        {greeting}
      </span>
    );
  }

  // Get logo URL from settings
  const logoUrl = settings.cardLogoUrl || "";

  return (
    <header className="bg-white/95 border-b border-zinc-200 backdrop-blur-sm px-4 py-2 h-[56px] flex items-center select-none">
      <div className="container mx-auto flex justify-between items-center">
         {/* Left column: Logo & Title */}
         <div className="w-1/2 flex items-center gap-3">
           <LoginButton />
           <Link href="/" className="flex items-center gap-3 group shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="PixiaTech" 
                className="h-8 w-auto object-contain max-h-[32px] transition-transform group-hover:scale-102"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : PageIcon ? (
              <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shadow-sm shrink-0">
                <PageIcon size={16} className="stroke-[2.5]" />
              </div>
            ) : null}
            {pageTitle && (
              <span className="text-[14px] font-extrabold font-heading tracking-tight text-zinc-900 hidden sm:inline-block">
                {pageTitle}
              </span>
            )}
          </Link>
        </div>

        {/* Center column: Greeting */}
        <div className="flex w-1/3 justify-center shrink-0">
          <Greeting />
        </div>

        {/* Right column: Language */}
        <div className="w-1/2 flex justify-end items-center gap-3 shrink-0">
          <Button variant="outline" size="icon" onClick={toggleLocale} className="group w-12 border-zinc-200 hover:border-zinc-350">
            <span className="font-bold text-xs text-zinc-700 group-hover:text-blue-650">{t('langName').toUpperCase()}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
