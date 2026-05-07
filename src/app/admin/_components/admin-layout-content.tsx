'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ListTodo,
  Package,
  Settings,
  Users,
  LayoutGrid,
  Loader2,
  Sun,
  Moon,
  User,
  History,
  Menu,
  Image as ImageIcon,
  Palette,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  LogOut,
  Globe,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { logout, getThemes, updateSettings, getSettings, updateUser, type UserRole, getUsers, saveSidebarConfig } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { canAccessRoute } from '@/lib/permissions';
import type { Theme, Settings as AppSettings, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { collection, orderBy, query } from 'firebase/firestore';
import { Sidebar, type SidebarState, type SidebarTheme, type SettingsSection } from './dashboard-new/Sidebar';
import { UserRole as UserRoleEnum } from './dashboard-new/dashboard-new-types';
import { NotificationBell } from './NotificationBell';
import { ChatPanel } from './ChatPanel';
import { SettingsContent } from '../settings/_components/settings-content';
import { motion, AnimatePresence } from 'framer-motion';

const mapRoleToUserRoleEnum = (role: string | undefined): UserRoleEnum => {
  switch (role) {
    case 'admin':
      return UserRoleEnum.ADMINISTRATEUR;
    case 'fournisseur':
      return UserRoleEnum.FOURNISSEUR;
    case 'commercial':
      return UserRoleEnum.COMMERCIAL;
    default:
      return UserRoleEnum.COMMERCIAL;
  }
};

const DEFAULT_LOGO_CONFIG = {
  text: 'PIXIATECH',
  letter: 'P',
  color: 'bg-blue-600',
  image: null as string | null,
};

const SidebarContentWrapper = ({ children, pageTitle, pageSubtitle, headerColor, userProfile, roles, logout, toggleTheme, mainNavItems, secondaryNavItems, mode, setMode, activeSettingsSection, onSettingsSectionChange, isSettingsPage, role, onOpenAccountDrawer, initialSettings }: { children: React.ReactNode, pageTitle: string, pageSubtitle: string, headerColor: string, userProfile: any, roles: any[], logout: any, toggleTheme: any, mainNavItems: any[], secondaryNavItems: any[], mode: string, setMode: (theme: string) => void, activeSettingsSection?: SettingsSection, onSettingsSectionChange?: (section: SettingsSection) => void, isSettingsPage?: boolean, role?: UserRoleEnum, onOpenAccountDrawer?: () => void, initialSettings?: AppSettings | null }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  useEffect(() => {
    console.log('isProfileOpen changed:', isProfileOpen);
  }, [isProfileOpen]);
  const pathname = usePathname();
  const router = useRouter();
  const roleName = roles?.find(r => r.id === userProfile?.role)?.name;
  const isDark = mode === 'dark';

  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'hidden';
      if (window.innerWidth < 1024) return 'compact';
      const saved = localStorage.getItem('sidebar-state');
      if (saved === 'expanded' || saved === 'compact' || saved === 'hidden') return saved;
    }
    return 'expanded';
  });

  // Responsive sidebar effect
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarState('hidden');
      } else if (window.innerWidth < 1024) {
        setSidebarState('compact');
      } else {
        setSidebarState('expanded');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating to a new page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarState('hidden');
    }
  }, [pathname]);

  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return (mode as SidebarTheme) || 'light';
  });

  const [logoConfig, setLogoConfig] = useState(() => {
    if (initialSettings?.logoConfig) return initialSettings.logoConfig;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-logo-config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return DEFAULT_LOGO_CONFIG;
        }
      }
    }
    return DEFAULT_LOGO_CONFIG;
  });

  // Sync logoConfig when settings are loaded
  useEffect(() => {
    if (initialSettings?.logoConfig) {
      setLogoConfig(initialSettings.logoConfig);
    }
  }, [initialSettings?.logoConfig]);

  const handleSaveLogo = async (newConfig: any) => {
    if (userProfile?.role === 'admin') {
      try {
        const result = await saveSidebarConfig({ logoConfig: newConfig });
        if (result.success) {
          sonnerToast.success('Logo sauvegardé avec succès !', {
            description: 'Le changement est appliqué pour tous les utilisateurs.',
          });
        } else {
          sonnerToast.error('Erreur lors de la sauvegarde du logo.', {
            description: typeof result.error === 'string' ? result.error : 'Veuillez réessayer.',
          });
        }
      } catch (error) {
        sonnerToast.error('Erreur réseau lors de la sauvegarde.');
      }
    }
  };

  const handleSaveOrder = async (newOrder: string[]) => {
    if (userProfile?.role === 'admin') {
      try {
        const result = await saveSidebarConfig({ sidebarOrder: newOrder });
        if (result.success) {
          sonnerToast.success('Ordre du menu sauvegardé !', {
            description: 'Le nouvel ordre est appliqué pour tous les utilisateurs.',
          });
        } else {
          sonnerToast.error('Erreur lors de la sauvegarde de l\'ordre.', {
            description: typeof result.error === 'string' ? result.error : 'Veuillez réessayer.',
          });
        }
      } catch (error) {
        sonnerToast.error('Erreur réseau lors de la sauvegarde.');
      }
    }
  };

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenChat = (e: any) => {
      const { chatId } = e.detail;
      if (chatId) {
        setActiveChatId(chatId);
        setIsChatPanelOpen(true);
      } else {
        setIsChatPanelOpen(true);
      }
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const isExpanded = sidebarState === 'expanded';

  return (
    <div id="admin-root" className="relative flex h-screen w-full text-gray-900 overflow-hidden" style={{ backgroundColor: '#E8F3EB' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarState !== 'hidden' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarState('hidden')}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        state={sidebarState}
        setState={setSidebarState}
        theme={sidebarTheme}
        setTheme={setSidebarTheme}
        role={role}
        logoConfig={logoConfig}
        setLogoConfig={setLogoConfig}
        initialOrder={initialSettings?.sidebarOrder}
        onSaveOrder={handleSaveOrder}
        onSaveLogo={handleSaveLogo}
        onOpenAccountDrawer={onOpenAccountDrawer}
        onLogout={handleLogout}
        userName={userProfile?.displayName}
        userEmail={userProfile?.email}
        userAvatar={userProfile?.photoURL}
        userId={userProfile?.uid}
        onSettingsSectionSelect={onSettingsSectionChange}
        selectedSettingsSection={activeSettingsSection}
      />

      <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
        <header className={cn(
          "px-6 py-4 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300",
          "border-b border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]",
          isDark 
            ? "bg-zinc-900/40 from-zinc-900/40 to-zinc-900/10" 
            : "bg-white/40 from-white/60 to-white/20",
          "bg-gradient-to-br flex-shrink-0"
        )}>
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 -z-10" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow">
              {sidebarState === 'hidden' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSidebarState('expanded')}
                  className={cn(
                    "group h-11 w-11 rounded-xl border-0 shadow-sm transition-all duration-200",
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-100"
                  )}
                >
                  <Menu className={cn("h-5 w-5", isDark ? "text-gray-400 group-hover:text-white" : "text-gray-400 group-hover:text-gray-700")} />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "group h-11 w-11 rounded-xl border-0 shadow-sm transition-all duration-200 hidden md:inline-flex",
                  isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-100"
                )}
                asChild
              >
                <Link href="/">
                  <ArrowLeft className={cn("h-5 w-5 transition-colors duration-200", isDark ? "text-gray-400 group-hover:text-white" : "text-gray-400 group-hover:text-gray-700")} />
                </Link>
              </Button>
              <div>
                <h1 className={cn(
                  "text-3xl font-bold tracking-tight leading-tight transition-colors duration-200 hidden md:block",
                  headerColor
                )}>
                  {pageTitle}
                </h1>
                <p className={cn(
                  "mt-1 text-sm hidden md:block",
                  isDark ? "text-gray-400" : "text-slate-500"
                )}>
                  {pageSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className={cn("group h-11 w-11 rounded-xl shadow-sm transition-all duration-200 hidden md:flex", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-100")}>
                <Sun className={cn("h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 group-hover:text-amber-400")} />
                <Moon className={cn("absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400 group-hover:text-indigo-300")} />
                <span className="sr-only">Toggle theme</span>
              </Button>

              <NotificationBell isDark={isDark} userRole={userProfile?.role} />

              {userProfile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatPanelOpen(true)}
                  className={cn("group h-11 w-11 rounded-xl shadow-sm transition-all duration-200", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-100")}
                >
                  <MessageSquare className={cn("h-5 w-5 transition-colors", isDark ? "text-gray-400 group-hover:text-blue-400" : "text-gray-400 group-hover:text-blue-500")} />
                </Button>
              )}

              {userProfile?.role === 'admin' && (
                <Button variant="ghost" size="icon" className={cn("group h-11 w-11 rounded-xl shadow-sm transition-all duration-200 hidden md:flex", isDark ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-100")} asChild>
                  <Link href="/admin/settings">
                    <Settings className={cn("h-5 w-5 transition-colors", isDark ? "text-gray-400 group-hover:text-blue-400" : "text-gray-400 group-hover:text-blue-500")} />
                  </Link>
                </Button>
              )}

              <div className={cn("h-9 w-px mx-1 hidden sm:block", isDark ? "bg-white/10" : "bg-gray-200")} />

              {userProfile && (
                <div className="relative group/profile">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-500 transition-all outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm relative">
                      {userProfile.photoURL ? (
                        <img
                          src={userProfile.photoURL}
                          alt={userProfile.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                          {userProfile.displayName?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                  </button>


                </div>
              )}
            </div>
          </div>
        </header>

        <main className={cn(
          "flex-1 min-h-0",
          pathname === '/admin/messages' 
            ? "h-[calc(100vh-88px)] overflow-hidden p-6 w-full" 
            : "px-6 py-6"
        )} style={{ backgroundColor: '#E8F3EB' }}>
          {children}
        </main>
      </div>

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => {
          setIsChatPanelOpen(false);
          setActiveChatId(null);
        }}
        isDark={isDark}
        initialChatId={activeChatId}
      />

      {/* Profile Menu Drawer (Moved outside header to avoid backdrop-filter issues) */}
      <AnimatePresence>
        {isProfileOpen && userProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.8 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150 || info.velocity.y > 500) {
                  setIsProfileOpen(false);
                }
              }}
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed left-0 right-0 bottom-0 z-[101] rounded-t-[32px] p-6 pb-12 shadow-2xl overflow-hidden",
                isDark ? "bg-[#141414] border-t border-white/5" : "bg-white border-t border-gray-100",
                "md:absolute md:inset-auto md:right-6 md:top-24 md:bottom-auto md:w-72 md:rounded-[24px] md:p-0 md:pb-0 md:shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border md:border-gray-200/50 md:dark:border-white/10 md:z-[101] md:backdrop-blur-none"
              )}
            >
              <div className="absolute inset-0 bg-white dark:bg-[#141414] -z-10" />
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6 md:hidden" />

              <div className="p-6 md:p-6 border-b border-gray-50 dark:border-white/5">
                <div className="flex items-center justify-between mb-1 md:block">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white leading-none">{userProfile.displayName}</h4>
                    <p className="text-[10px] font-bold text-[#c6ff00] uppercase tracking-[0.2em] mt-2 bg-black w-fit px-2 py-0.5 rounded-sm">{roleName}</p>
                  </div>
                  <button onClick={() => setIsProfileOpen(false)} className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full text-gray-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-2 md:p-2 flex flex-col">
                <Link
                  href={`/admin/users/${userProfile.uid}`}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group/item border-b border-gray-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Profil</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group/item border-b border-gray-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <Settings size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Paramètres</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </Link>

                <Link
                  href="/"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group/item border-b border-gray-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Accéder au Site</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between px-4 py-6 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group/logout"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 group-hover/logout:scale-110 transition-transform shadow-sm">
                      <LogOut size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-red-600 uppercase tracking-wide">Déconnexion</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-red-200 -rotate-90" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, userProfile, isUserLoading: authLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { theme: mode, setTheme: setMode } = useTheme();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('general');
  const isSettingsPage = pathname.startsWith('/admin/settings');
  console.log('[AdminLayoutContent] pathname:', pathname, 'isSettingsPage:', isSettingsPage, 'activeSettingsSection:', activeSettingsSection);

  const handleSettingsSectionChange = (section: SettingsSection) => {
    console.log('[AdminLayoutContent] handleSettingsSectionChange called:', section);
    setActiveSettingsSection(section);
  };

  // Timeout fallback - si le chargement prennent plus de 15s, on affiche le contenu quand même
  const [forceLoaded, setForceLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localLoading || authLoading) {
        console.warn('Loading timeout - forcing content display');
        setForceLoaded(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [localLoading, authLoading]);

  const isUserLoading = authLoading && !forceLoaded;

  // Determine initial settings section from pathname
  useEffect(() => {
    if (pathname.includes('/settings/images')) setActiveSettingsSection('images');
    else if (pathname.includes('/settings/content')) setActiveSettingsSection('content');
    else if (pathname.includes('/settings/themes') || pathname.includes('/settings/appearance')) setActiveSettingsSection('appearance');
    else if (pathname.includes('/settings/wizard')) setActiveSettingsSection('wizard');
    else if (pathname.includes('/settings/livraison')) setActiveSettingsSection('livraison');
    else if (pathname.includes('/settings/main-doeuvre')) setActiveSettingsSection('main-doeuvre');
    else if (pathname.includes('/settings/pdf')) setActiveSettingsSection('pdf');
    else if (pathname.includes('/settings/emergency')) setActiveSettingsSection('emergency');
    else setActiveSettingsSection('general');
  }, [pathname]);

  const firestore = useFirestore();
  const auth = useAuth();

  const rolesQuery = useMemoFirebase(
    () => (firestore && auth.currentUser && !isUserLoading) ? query(collection(firestore, 'roles'), orderBy('name')) : null,
    [firestore, auth.currentUser, isUserLoading]
  );
  const { data: roles } = useCollection<UserRole>(rolesQuery, { suppressPermissionError: true });

  const fetchData = useCallback(async () => {
    if (!settings || themes.length === 0) {
      setLocalLoading(true);
      try {
        const [fetchedThemes, fetchedSettings] = await Promise.all([getThemes(), getSettings()]);
        setThemes(fetchedThemes);
        setSettings(fetchedSettings);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données initiales.' });
      } finally {
        setLocalLoading(false);
      }
    }
  }, [settings, themes.length, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (userProfile) {
      const role = userProfile.role as 'admin' | 'fournisseur' | 'commercial';

      // Check route permissions
      if (!canAccessRoute(role, pathname)) {
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/admin/quote-requests');
        }
      }
    }
  }, [pathname, userProfile, router]);

  const childrenWithProps = useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        let props: any = {};

        if ((child.type as any).displayName === 'ThemesPage') {
          props.onDataChange = fetchData;
        }

        return React.cloneElement(child as React.ReactElement<any>, props);
      }
      return child;
    });
  }, [children, fetchData]);

  const mainNavItems = useMemo(() => {
    if (userProfile?.role === 'fournisseur') {
      return [
        { href: '/admin', label: 'Tableau de bord', icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: 'Vue d\'ensemble de votre activité.' },
        { href: '/admin/quote-requests', label: 'Estimations', icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: 'Consultez et gérez le cycle de vie des estimations.' },
      ];
    }
    if (userProfile?.role === 'commercial') {
      return [
        { href: '/admin', label: 'Tableau de bord', icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: 'Vue d\'ensemble de votre activité.' },
        { href: '/admin/quote-requests', label: 'Estimations', icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: 'Consultez et gérez le cycle de vie des estimations.' },
      ];
    }
    return [
      { href: '/admin', label: 'Tableau de bord', icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: 'Vue d\'ensemble de votre activité et statistiques.' },
      { href: '/admin/quote-requests', label: 'Estimations', icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: 'Consultez et gérez le cycle de vie des estimations.' },
      { href: '/admin/produits', label: 'Produits', icon: Package, exact: false, color: 'text-yellow-500', subtitle: 'Gérez les produits et leurs fiches techniques.' },
      { href: '/admin/users', label: 'Utilisateurs', icon: Users, exact: true, color: 'text-emerald-500', subtitle: '' },
      { href: '/admin/settings', label: 'Paramètres', icon: Settings, exact: true, color: 'text-fuchsia-500', subtitle: 'Paramètres de l\'application.' },
      { href: '/admin/history', label: 'Historique', icon: History, exact: true, color: 'text-blue-400', subtitle: 'Historique des modifications.' },
    ];
  }, [userProfile?.role]);

  const secondaryNavItems = useMemo(() => {
    const items = [];
    if (userProfile?.uid) {
      items.push({ href: `/admin/users/${userProfile.uid}`, label: 'Mon Profil', icon: User, exact: true, color: 'text-purple-500', subtitle: 'Gérez vos informations personnelles.' });
    }
    return items;
  }, [userProfile?.uid]);

  const allNavItems = useMemo(() => [...mainNavItems, ...secondaryNavItems], [mainNavItems, secondaryNavItems]);

  const activeNavItem = useMemo(() => {
    const sorted = [...allNavItems].sort((a, b) => b.href.length - a.href.length);
    return sorted.find(item => {
      if (item.href === '/admin' && pathname === '/admin') return true;
      return item.href !== '/admin' && pathname.startsWith(item.href);
    });
  }, [allNavItems, pathname]);

  const pageTitle = activeNavItem?.label || (userProfile?.role === 'fournisseur' ? 'Estimations à traiter' : (userProfile?.role === 'commercial' ? 'Estimations' : 'Administration'));
  const pageSubtitle = activeNavItem?.subtitle || 'Console d\'administration';

  if ((isUserLoading || localLoading) && !forceLoaded) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarContentWrapper
      children={isSettingsPage ? <SettingsContent initialSection={activeSettingsSection} onSectionChange={handleSettingsSectionChange} /> : childrenWithProps}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      headerColor={activeNavItem?.color || 'text-gray-900'}
      userProfile={userProfile}
      roles={roles || []}
      logout={logout}
      toggleTheme={toggleTheme}
      mainNavItems={mainNavItems}
      secondaryNavItems={secondaryNavItems}
      mode={mode || 'light'}
      setMode={setMode}
      activeSettingsSection={activeSettingsSection}
      onSettingsSectionChange={handleSettingsSectionChange}
      isSettingsPage={isSettingsPage}
      role={userProfile?.role ? mapRoleToUserRoleEnum(userProfile.role) : undefined}
      onOpenAccountDrawer={() => { }}
      initialSettings={settings}
    />
  );
}
