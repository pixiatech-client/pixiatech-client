'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LogIn, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n, IntlHelpers } from '@/lib/i18n';

export function Header() {
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
        className={cn(
          "group",
          "bg-transparent border-transparent hover:bg-black"
        )}
        size={'icon'}
      >
        <Link href={isLoggedIn ? "/admin" : "/admin/login"}>
          <LogIn className={cn(
            "h-4 w-4",
            'text-white group-hover:text-white',
          )} />
        </Link>
      </Button>
    );
  }

  const Greeting = () => {
    if (!isClient || isUserLoading || !user || user.isAnonymous) return null;
    const displayName = user.displayName || t('common.user');
    const greeting = IntlHelpers.formatGreeting(displayName, locale);
    return (
      <span className="text-sm font-bold text-white truncate max-w-[200px] hidden md:block">
        {greeting}
      </span>
    );
  }

  return (
    <header className="bg-card/80 border-b backdrop-blur-sm px-4 py-2 h-[56px] flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <div className="w-1/3">
          <LoginButton />
        </div>

        <div className="flex w-1/3 justify-center">
          <Greeting />
        </div>

        <div className="w-1/3 flex justify-end items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleLocale} className="group w-12">
              <span className='font-semibold text-sm text-foreground group-hover:text-blue-700'>{t('langName')}</span>
            </Button>
          </div>
      </div>
    </header>
  );
}
