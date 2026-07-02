
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { BoutiqueHeader } from '@/components/boutique-header';
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { RoleProvider } from '@/contexts/RoleContext';
import { SiteBanners } from './SiteBanners';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { Home, Store, ShoppingBag, User, LayoutDashboard, Package, Settings, LogOut } from 'lucide-react';

function useProtectMedia() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler, true);
    return () => document.removeEventListener('contextmenu', handler, true);
  }, []);
}

import { DynamicThemeProvider } from '@/contexts/DynamicThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProfileProvider } from '@/contexts/ProfileContext';

export function LayoutProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPage = pathname.startsWith('/admin');
  const isEmbedPage = pathname.startsWith('/embed') || pathname.startsWith('/chat-widget');
  const isQuotePage = pathname.startsWith('/quote');
  const isFrontendPage = !isAdminPage && !isEmbedPage;
  const isBoutiquePage = pathname.startsWith('/boutique');
  const isHomePage = pathname === '/';
  const isMonComptePage = pathname.startsWith('/mon-compte');
  const showBottomNav = isFrontendPage && !isHomePage;
  const isMonCompteProtected = pathname.startsWith('/mon-compte/tableau-de-bord') || pathname.startsWith('/mon-compte/commandes') || pathname.startsWith('/mon-compte/parametres') || pathname.startsWith('/mon-compte/litiges');

  const bottomNavTabs = isMonCompteProtected
    ? [
        { title: 'Tableau de bord', icon: LayoutDashboard },
        { title: 'Mes commandes', icon: Package },
        { title: 'Paramètres', icon: Settings },
        { title: 'Déconnexion', icon: LogOut, className: 'text-red-500 hover:text-red-600' },
      ]
    : [
        { title: 'Accueil', icon: Home },
        { title: 'Boutique', icon: Store },
        { title: 'Panier', icon: ShoppingBag },
        { title: 'Compte', icon: User },
      ];

  const handleBottomNavChange = (index: number | null) => {
    if (index === null) return;
    if (isMonCompteProtected && index === 3) {
      fetch('/api/boutique/logout', { method: 'POST' }).then(() => { window.location.href = '/'; });
      return;
    }
    const routes = isMonCompteProtected
      ? ['/mon-compte/tableau-de-bord', '/mon-compte/commandes', '/mon-compte/parametres']
      : ['/', '/boutique', '/boutique/panier', '/mon-compte/commandes'];
    router.push(routes[index]);
  };

  useProtectMedia();

  return (
    <FirebaseClientProvider>
      <RoleProvider>
        <DynamicThemeProvider>
          <ProfileProvider>
          <CartProvider>
          <div className="flex flex-col bg-background min-h-dvh">
            {isFrontendPage && !isMonComptePage && <BoutiqueHeader />}
            {isFrontendPage ? (
              <div className={`flex flex-col flex-1 ${isMonComptePage ? '' : 'pt-[72px]'} ${showBottomNav ? 'pb-20' : ''}`}>
                <SiteBanners />
                <main
                  className={cn(
                    'flex-1 flex items-start justify-center w-full',
                    isHomePage && 'px-4 pb-4 pt-8 md:px-6 md:pb-6 md:pt-8',
                    !isHomePage && !isQuotePage && !isBoutiquePage && !isMonComptePage && 'px-4 pb-4 md:px-6 md:pb-6',
                  )}
                >
                  {children}
                </main>
              </div>
            ) : (
              <main className="flex-1 flex items-start justify-center w-full">
                {children}
              </main>
            )}
            {showBottomNav && (
              <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center px-4 pb-3">
                <ExpandableTabs
                  tabs={bottomNavTabs}
                  onChange={handleBottomNavChange}
                  className="shadow-xl"
                />
              </div>
            )}
          </div>
          </CartProvider>
          </ProfileProvider>
        </DynamicThemeProvider>
        <ShadcnToaster />
        <SonnerToaster 
          position="bottom-right" 
          expand={true} 
          richColors 
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#1f2937'
            }
          }}
        />
      </RoleProvider>
    </FirebaseClientProvider>
  );
}
