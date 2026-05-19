
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { LogIn, Moon, Sun } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useTheme } from 'next-themes';

export function Header() {
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();


  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const toggleLocale = () => {
    setLocale(locale === 'fr' ? 'en' : 'fr');
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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

  return (
    <header className="bg-card/80 border-b backdrop-blur-sm px-4 py-2 h-[56px] flex items-center">
      <div className="container mx-auto flex justify-between items-center">
        <div className="w-1/3">
          <LoginButton />
        </div>

        <div className="flex w-1/3 justify-center">
           {/* Test button removed as requested */}
        </div>

        <div className="w-1/3 flex justify-end items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} className="group hover:bg-black">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-500 group-hover:text-yellow-400" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-500 group-hover:text-blue-400" />
              <span className="sr-only">Toggle theme</span>
            </Button>
           <Button variant="outline" size="icon" onClick={toggleLocale} className="group hover:bg-black w-12">
               <span className='font-semibold text-sm group-hover:text-white'>{t('langName')}</span>
           </Button>
        </div>
      </div>
    </header>
  );
}
