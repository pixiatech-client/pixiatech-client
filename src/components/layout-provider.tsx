
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { BoutiqueHeader } from '@/components/boutique-header';
import { FirebaseClientProvider } from '@/firebase';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { FloatingChatWrapper } from '@/components/chat/FloatingChatWrapper';
import { PixiaGlobalAnimation } from '@/components/pixia/PixiaGlobalAnimation';
import { RoleProvider } from '@/contexts/RoleContext';
import { SiteBanners } from './SiteBanners';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { CookieConsentBanner } from '@/components/cookies/CookieConsentBanner';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { DynamicFavicon } from '@/components/ui/DynamicFavicon';
import { Home, Store, ShoppingBag, User, LayoutDashboard, Package, Settings, LogOut } from 'lucide-react';
import { BottomSheetProvider } from '@/components/ui/bottom-sheet';

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

import { ThemeProvider } from '@/contexts/ThemeProvider';
import { CartProvider } from '@/contexts/CartContext';
import { ProfileProvider } from '@/contexts/ProfileContext';


export function LayoutProvider({
  children,
  initialBoutiqueB2B = false,
  initialBoutiqueEnabled = true,
  initialThemeName,
  isWebHost = false,
}: Readonly<{
  children: React.ReactNode;
  initialBoutiqueB2B?: boolean;
  initialBoutiqueEnabled?: boolean;
  initialThemeName?: string;
  isWebHost?: boolean;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  /* Configuration Guidée (`/?step=...`, mode `wizard`) : le configurateur
     occupe tout l'écran. On masque uniquement l'enveloppe visuelle Pixia —
     sans démonter le moteur ni relâcher le relais de mascotte, ce qui ferait
     réapparaître l'ancien robot. */
  const [guidedConfigActive, setGuidedConfigActive] = useState(false);
  useEffect(() => {
    const syncFromUrl = () => {
      setGuidedConfigActive(
        pathname === '/' && new URLSearchParams(window.location.search).has('step')
      );
    };
    const onMode = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: string }>).detail?.mode;
      setGuidedConfigActive(pathname === '/' && mode === 'wizard');
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('quote-mode', onMode);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('quote-mode', onMode);
    };
  }, [pathname]);

  const isWebDomain =
    isWebHost ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'pixiatech.com' ||
        window.location.hostname === 'www.pixiatech.com'));
  const isAdminPage = pathname.startsWith('/admin');
  const isEmbedPage = pathname.startsWith('/embed') || pathname.startsWith('/chat-widget');
  const isLegalPage =
    pathname.startsWith('/mentions-legales') ||
    pathname.startsWith('/politique-confidentialite') ||
    pathname.startsWith('/gestion-cookies');
  const isWebPage =
    pathname.startsWith('/web') ||
    isLegalPage ||
    (isWebDomain &&
      !isAdminPage &&
      !isEmbedPage &&
      !pathname.startsWith('/mon-compte') &&
      !pathname.startsWith('/boutique') &&
      !pathname.startsWith('/quote'));
  const isQuotePage = pathname.startsWith('/quote');
  const isFrontendPage = !isAdminPage && !isEmbedPage && !isWebPage;
  const isBoutiquePage = pathname.startsWith('/boutique');
  const isBoutiqueIndexPage = pathname === '/boutique';
  const isHomePage = pathname === '/' && !isWebDomain;
  const isMonComptePage = pathname.startsWith('/mon-compte');
  const isContactPage = pathname.startsWith('/contact');
  const showBottomNav = isFrontendPage && !isHomePage && !isContactPage && !isWebDomain;
  const isMonCompteProtected = pathname.startsWith('/mon-compte/tableau-de-bord') || pathname.startsWith('/mon-compte/commandes') || pathname.startsWith('/mon-compte/parametres') || pathname.startsWith('/mon-compte/litiges');

  const bottomNavTabs = isMonCompteProtected
    ? [
        { title: 'Tableau de bord', icon: LayoutDashboard },
        { title: 'Mes commandes', icon: Package },
        { title: 'Paramètres', icon: Settings },
        { title: 'Déconnexion', icon: LogOut, className: 'text-red-500 hover:text-red-600' },
      ]
    : initialBoutiqueEnabled
      ? [
          { title: 'Accueil', icon: Home },
          { title: 'Boutique', icon: Store },
          { title: 'Panier', icon: ShoppingBag },
          { title: 'Compte', icon: User },
        ]
      : [
          { title: 'Accueil', icon: Home },
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
      : initialBoutiqueEnabled
        ? ['/', '/boutique', '/boutique/panier', '/mon-compte/commandes']
        : ['/', '/mon-compte/commandes'];
    router.push(routes[index]);
  };

  // Synchronisation de l'onglet actif avec la route actuelle
  const currentNavIndex = (() => {
    if (isMonCompteProtected) {
      if (pathname.startsWith('/mon-compte/tableau-de-bord')) return 0;
      if (pathname.startsWith('/mon-compte/commandes') || pathname.startsWith('/mon-compte/litiges')) return 1;
      if (pathname.startsWith('/mon-compte/parametres')) return 2;
      return 0;
    }
    if (initialBoutiqueEnabled) {
      if (pathname === '/') return 0;
      if (pathname.startsWith('/boutique/panier') || pathname.startsWith('/boutique/paiement')) return 2;
      if (pathname.startsWith('/boutique')) return 1;
      if (pathname.startsWith('/mon-compte')) return 3;
      return 0;
    }
    if (pathname.startsWith('/mon-compte')) return 1;
    return 0;
  })();

  useProtectMedia();

  return (
    <FirebaseClientProvider>
      <BottomSheetProvider>
      <DynamicFavicon />
      <RoleProvider>
        <ThemeProvider initialThemeName={initialThemeName}>
          <ProfileProvider initialBoutiqueB2B={initialBoutiqueB2B}>
          <CartProvider>
          <div className={cn("flex flex-col min-h-dvh", isFrontendPage ? "bg-[#F5F5F5]" : "bg-background")}>
            {isFrontendPage && !isMonComptePage && !isBoutiqueIndexPage && <BoutiqueHeader boutiqueEnabled={initialBoutiqueEnabled} />}
            {isFrontendPage ? (
              <div
                className={`flex flex-col flex-1 ${isMonComptePage || isBoutiqueIndexPage ? '' : 'pt-[68px]'} bg-[#F5F5F5]`}
                style={showBottomNav ? { paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' } : undefined}
              >
                <SiteBanners />
                <main
                  className={cn(
                    'flex-1 flex w-full bg-[#F5F5F5]',
                    isBoutiquePage ? 'flex-col items-stretch' : 'items-start justify-center',
                    isHomePage && 'px-4 pb-4 pt-8 md:px-6 md:pb-6 md:pt-8',
                    !isHomePage && !isQuotePage && !isBoutiquePage && !isMonComptePage && !isContactPage && 'px-4 pb-4 md:px-6 md:pb-6',
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
              <div
                className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center px-4 md:hidden"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
              >
                <div data-pixia-bottom-nav className="flex w-full justify-center">
                  <ExpandableTabs
                    tabs={bottomNavTabs}
                    activeIndex={currentNavIndex}
                    onChange={handleBottomNavChange}
                    className="shadow-xl"
                  />
                </div>
              </div>
            )}
            {(isFrontendPage || isWebPage) && <FloatingChatWrapper />}
            {/* Une seule enveloppe visuelle Pixia pour le site ET l'application.
                Le moteur conversationnel reste porté par FloatingChatWrapper →
                WizardBotFlow (props, API, auth, historique inchangés). */}
            <PixiaGlobalAnimation
              active={isWebPage || isFrontendPage}
              heroSelector={isFrontendPage ? 'main' : undefined}
              dockBottomInset={isFrontendPage && showBottomNav ? 72 : 0}
              dockBarSelector={
                isFrontendPage && showBottomNav ? '[data-pixia-bottom-nav]' : undefined
              }
              hidden={guidedConfigActive}
            />
          </div>
          </CartProvider>
          </ProfileProvider>
        </ThemeProvider>
        {!isAdminPage && !isEmbedPage && <CookieConsentBanner />}
        {!isAdminPage && !isEmbedPage && <AnalyticsTracker />}
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
      </BottomSheetProvider>
    </FirebaseClientProvider>
  );
}
