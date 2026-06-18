'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import {
  ListTodo,
  Package,
  Settings,
  Users,
  LayoutGrid,
  Loader2,
  User,
  History,
  Menu,
  Palette,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  LogOut,
  Globe,
  X,
  FileText,
  LayoutDashboard,
  Wand2,
  Truck,
  HardHat,
  FileType,
  Calculator,
  ShieldCheck,
  Zap,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { logout, getThemes, getSettings, saveSidebarConfig } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { canAccessRoute } from '@/lib/permissions';
import type { Theme, Settings as AppSettings, UserProfile, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { getAvatarUrl } from '@/lib/avatar';
import { collection, orderBy, query, doc, onSnapshot } from 'firebase/firestore';
import { Sidebar, type SidebarState, type SidebarTheme, type SettingsSection } from './dashboard-new/Sidebar';
import { UserRole as UserRoleEnum } from './dashboard-new/dashboard-new-types';
import { NotificationBell } from './NotificationBell';
import { ChatPanel } from './ChatPanel';
import { SettingsContent } from '../settings/_components/settings-content';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingCalculator } from './FloatingCalculator';

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
  text: 'BOT LUMI',
  letter: 'B',
  color: 'bg-blue-600',
  image: null as string | null,
};

const SidebarContentWrapper = ({ children, pageTitle, pageSubtitle, headerColor, userProfile, roles, logout, mainNavItems, secondaryNavItems, activeSettingsSection, onSettingsSectionChange, isSettingsPage, role, onOpenAccountDrawer, initialSettings }: { children: React.ReactNode, pageTitle: string, pageSubtitle: string, headerColor: string, userProfile: any, roles: any[], logout: any, mainNavItems: any[], secondaryNavItems: any[], activeSettingsSection?: SettingsSection, onSettingsSectionChange?: (section: SettingsSection) => void, isSettingsPage?: boolean, role?: UserRoleEnum, onOpenAccountDrawer?: () => void, initialSettings?: AppSettings | null }) => {
  const { t, locale, setLocale } = useI18n();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [settings, setSettings] = useState<any>(initialSettings);
  const firestore = useFirestore();
  useEffect(() => {
    console.log('isProfileOpen changed:', isProfileOpen);
  }, [isProfileOpen]);
  const pathname = usePathname();
  const router = useRouter();
  const roleName = roles?.find(r => r.id === userProfile?.role)?.name;

  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'hidden';
      if (window.innerWidth < 1024) return 'compact';
      const saved = localStorage.getItem('sidebar-state');
      // Never restore 'hidden' from localStorage - hidden is a temporary state
      if (saved === 'expanded' || saved === 'compact') return saved;
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
        // Only auto-expand if currently hidden (from a resize), not if user manually hid it
        setSidebarState(prev => prev === 'hidden' ? 'expanded' : prev);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save sidebar state to localStorage (only non-hidden states)
  useEffect(() => {
    if (sidebarState !== 'hidden') {
      localStorage.setItem('sidebar-state', sidebarState);
    }
  }, [sidebarState]);

  // Close sidebar on mobile when navigating to a new page
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarState('hidden');
    }
  }, [pathname]);

  useEffect(() => {
    if (!firestore) return;
    const unsub = onSnapshot(doc(firestore, 'settings', 'main'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    return () => unsub();
  }, [firestore]);

  const canShowMessaging = useMemo(() => {
    if (!settings?.messaging?.enabled) return false;
    if (userProfile?.role === 'admin') return true;
    if (userProfile?.role === 'commercial') return settings?.messaging?.allowCommercialMessaging;
    if (userProfile?.role === 'fournisseur') return settings?.messaging?.allowSupplierMessaging;
    return true;
  }, [settings, userProfile]);

  const [sidebarTheme, setSidebarTheme] = useState<SidebarTheme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-theme') : null;
    return (saved === 'light' || saved === 'dark') ? saved as SidebarTheme : 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-theme', sidebarTheme);
    }
  }, [sidebarTheme]);

  const handleSetTheme = (newTheme: SidebarTheme) => {
    setSidebarTheme(newTheme);
  };

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

  // Sync logoConfig when settings are loaded or changed in real-time
  useEffect(() => {
    const currentSettings = settings || initialSettings;
    if (currentSettings?.logoConfig) {
      const config = { ...currentSettings.logoConfig };
      if (config.text === 'ASSISTANT ESTIMATION') {
        config.text = 'BOT LUMI';
        config.letter = 'B';
      }
      setLogoConfig(config);
    }
  }, [settings?.logoConfig, initialSettings?.logoConfig]);

  const handleSaveLogo = async (newConfig: any) => {
    if (userProfile?.role === 'admin') {
      try {
        const result = await saveSidebarConfig({ logoConfig: newConfig });
        if (result.success) {
          sonnerToast.success('Logo saved successfully!', {
            description: 'The change is applied for all users.',
          });
        } else {
          sonnerToast.error('Error saving logo.', {
            description: typeof result.error === 'string' ? result.error : 'Please try again.',
          });
        }
      } catch (error) {
        sonnerToast.error('Network error while saving.');
      }
    }
  };

  const handleSaveOrder = async (newOrder: string[]) => {
    if (userProfile?.role === 'admin') {
      try {
        const result = await saveSidebarConfig({ sidebarOrder: newOrder });
        if (result.success) {
          sonnerToast.success('Menu order saved!', {
            description: 'The new order is applied for all users.',
          });
        } else {
          sonnerToast.error('Error saving order.', {
            description: typeof result.error === 'string' ? result.error : 'Please try again.',
          });
        }
      } catch (error) {
        sonnerToast.error('Network error while saving.');
      }
    }
  };

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

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
    <div id="admin-root" className="relative flex min-h-screen w-full text-theme-text bg-theme-app">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarState !== 'hidden' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarState('hidden')}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] lg:hidden"
          />
        )}
      </AnimatePresence>

      <Sidebar
        state={sidebarState}
        setState={setSidebarState}
        theme={sidebarTheme}
        setTheme={handleSetTheme}
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
          "px-4 py-4 md:px-8 border-b border-white/5 backdrop-blur-md sticky top-0 z-[40]",
          "bg-theme-nav-bg text-theme-nav-text",
          "bg-gradient-to-br flex-shrink-0"
        )}>
          <div className="absolute inset-0 bg-white/10 -z-10" />
          {userProfile?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex justify-center -mt-4"
            >
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ef4444] shadow-lg shadow-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">
                  {t('admin.adminSpace')}
                </span>
              </div>
            </motion.div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow">
              {sidebarState === 'hidden' && (
                <button
                  type="button"
                  onClick={() => { setSidebarState('expanded'); }}
                  style={{ zIndex: 50 }}
                  className={cn(
                    "group flex items-center justify-center h-11 w-11 rounded-xl mt-1 border-0 shadow-sm transition-all duration-200 cursor-pointer",
                    "bg-white hover:bg-theme-sidebar-active-bg text-gray-700 hover:text-emerald-500"
                  )}
                  aria-label="Show menu"
                >
                  <Menu className="h-5 w-5 pointer-events-none" />
                </button>
              )}
              {isSettingsPage && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsSettingsMenuOpen(true)}
                  className={cn(
                    "group h-11 px-4 rounded-xl mt-2 border-0 shadow-lg transition-all duration-200 lg:hidden",
                    "bg-black text-white hover:bg-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">MENU</span>
                  </div>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "group h-11 w-11 rounded-xl border-0 shadow-sm transition-all duration-200",
                  "bg-white hover:bg-theme-sidebar-active-bg"
                )}
                onClick={() => router.back()}
                title="Previous page"
              >
                <ChevronDown className="h-5 w-5 transition-all duration-200 text-gray-500 group-hover:text-emerald-500 rotate-90" />
              </Button>
              <div>
                <h1 className={cn(
                  "text-3xl font-bold tracking-tight leading-tight transition-colors duration-200 hidden md:block"
                )} style={{ color: 'var(--theme-nav-text)' }}>
                  {pageTitle}
                </h1>
                <p className={cn(
                  "mt-1 text-sm hidden md:block",
                  "text-slate-500"
                )}>
                  {pageSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">

              {/* ── 1. Calculatrice flottante ── */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCalculatorOpen(prev => !prev)}
                title="Calculator"
                className={cn(
                  "group h-11 w-11 rounded-xl shadow-sm transition-all duration-200 hidden md:flex",
                  isCalculatorOpen
                    ? "bg-black text-white"
                    : "bg-white hover:bg-theme-sidebar-active-bg"
                )}
              >
                <Calculator className={cn(
                  "h-5 w-5 transition-colors",
                  isCalculatorOpen
                    ? "text-indigo-400"
                    : "text-gray-500 group-hover:text-indigo-400"
                )} />
                <span className="sr-only">Calculator</span>
              </Button>

              {/* ── 2. Notifications ── */}
              <NotificationBell userRole={userProfile?.role} />

              {/* ── 3. Messagerie ── */}
              {userProfile && canShowMessaging && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatPanelOpen(true)}
                  className={cn("group h-11 w-11 rounded-xl shadow-sm transition-all duration-200", "bg-white hover:bg-theme-sidebar-active-bg")}
                >
                  <MessageSquare className={cn("h-5 w-5 transition-colors", "text-gray-400 group-hover:text-blue-500")} />
                </Button>
              )}

              {/* ── 4. Access the front-end site (Globe icon) ── */}
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
                <Globe className={cn(
                  "h-5 w-5 transition-colors",
                  "text-gray-400 group-hover:text-emerald-500"
                )} />
                <span className="sr-only">{t('admin.siteAccess')}</span>
              </Button>

              <div className={cn("h-9 w-px mx-1 hidden sm:block", "bg-gray-200")} />

              {/* ── 5. Language Switcher (FR / EN) ── */}
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

              {userProfile && (
                <div className="relative group/profile">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-500 transition-all outline-none"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                      <img
                        src={getAvatarUrl(userProfile.photoURL, userProfile.role, userProfile.displayName)}
                        alt={userProfile.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={cn(
          "min-h-0 bg-theme-app",
          pathname === '/admin/messages'
            ? "h-[calc(100vh-88px)] overflow-hidden p-4 md:p-6 w-full"
            : "flex-1 px-4 py-4 md:px-6 md:py-6"
        )}>
          {children}
        </main>
      </div>

      {/* ── Calculatrice flottante (toujours au premier plan, draggable) ── */}
      <FloatingCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <ChatPanel
        isOpen={isChatPanelOpen}
        onClose={() => {
          setIsChatPanelOpen(false);
          setActiveChatId(null);
        }}
        initialChatId={activeChatId}
      />

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
                "bg-white border-t border-gray-100",
                "md:absolute md:inset-auto md:right-6 md:top-24 md:bottom-auto md:w-72 md:rounded-[24px] md:p-0 md:pb-0 md:shadow-[0_20px_50px_rgba(0,0,0,0.2)] md:border md:border-gray-200/50 md:z-[101] md:backdrop-blur-none"
              )}
            >
              <div className="absolute inset-0 bg-white -z-10" />
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6 md:hidden" />

              <div className="p-6 md:p-6 border-b border-gray-50">
                <div className="flex items-center justify-between mb-1 md:block">
                  <div>
                    <h4 className="text-lg font-black text-gray-900 leading-none">{userProfile.displayName}</h4>
                    <p className="text-[10px] font-bold text-[#c6ff00] uppercase tracking-[0.2em] mt-2 bg-black w-fit px-2 py-0.5 rounded-sm">{roleName}</p>
                  </div>
                  <button onClick={() => setIsProfileOpen(false)} className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-gray-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-2 md:p-2 flex flex-col">
                <Link
                  href={`/admin/users/${userProfile.uid}`}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-all group/item border-b border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('admin.profile')}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-all group/item border-b border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <Settings size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('admin.settings')}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </Link>

                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-all group/item border-b border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform shadow-sm">
                      <Globe size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">{t('admin.siteAccess')}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                </a>

                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between px-4 py-6 hover:bg-red-50 transition-all group/logout"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 group-hover/logout:scale-110 transition-transform shadow-sm">
                      <LogOut size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-red-600 uppercase tracking-wide">{t('admin.logout')}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-red-200 -rotate-90" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsMenuOpen && isSettingsPage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-[320px] bg-[#F8FAFC] z-[80] shadow-2xl flex flex-col border-l border-white/20"
            >
               <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
                 <h2 className="text-lg font-black uppercase tracking-tighter text-gray-900">{t('admin.menu')}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSettingsMenuOpen(false)}
                  className="rounded-xl hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {[
                  { id: 'general', label: t('admin.settingsMenu.general'), icon: Settings, color: 'text-blue-600', bg: 'bg-blue-100/80', href: '/admin/settings/general' },
                  { id: 'content', label: t('admin.settingsMenu.content'), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100/80', href: '/admin/settings/content' },
                  { id: 'appearance', label: t('admin.settingsMenu.appearance'), icon: Palette, color: 'text-pink-600', bg: 'bg-pink-100/80', href: '/admin/settings/themes' },
                  { id: 'wizard', label: t('admin.settingsMenu.wizard', { defaultValue: 'Assistant & Images' }), icon: Wand2, color: 'text-indigo-600', bg: 'bg-indigo-100/80', href: '/admin/settings/wizard' },
                  { id: 'livraison', label: t('admin.settingsMenu.delivery'), icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-100/80', href: '/admin/settings/livraison' },
                  { id: 'labor', label: t('admin.settingsMenu.labor'), icon: HardHat, color: 'text-orange-600', bg: 'bg-orange-100/80', href: '/admin/settings/main-doeuvre' },
                  { id: 'pdf', label: t('admin.settingsMenu.pdf'), icon: FileType, color: 'text-rose-600', bg: 'bg-rose-100/80', href: '/admin/settings/pdf' },
                  { id: 'messaging', label: t('admin.settingsMenu.messaging'), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100/80', href: '/admin/settings/messaging' },
                  { id: 'emergency', label: t('admin.settingsMenu.emergency', { defaultValue: 'Urgence' }), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100/80', href: '/admin/settings/emergency' },
                  { id: 'software', label: t('admin.settingsMenu.software', { defaultValue: 'Serveur SMTP' }), icon: Mail, color: 'text-slate-600', bg: 'bg-slate-100/80', href: '/admin/settings/software' },
                  { id: 'email-verification', label: t('admin.emailVerification', { defaultValue: 'Vérification Email' }), icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-100/80', href: '/admin/settings/email-verification' },
                  { id: 'flow', label: t('admin.settingsMenu.flow', { defaultValue: 'Parcours client' }), icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100/80', href: '/admin/settings/flow' },
                 ].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsSettingsMenuOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 group",
                      pathname === item.href 
                        ? "bg-theme-sidebar-active-bg text-theme-sidebar-active-text shadow-xl translate-x-1" 
                        : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                      pathname === item.href ? "bg-white/10" : item.bg
                    )}>
                      <item.icon className={cn(
                        "w-4.5 h-4.5 transition-all duration-300",
                        pathname === item.href ? "text-white scale-110" : item.color
                      )} />
                    </div>
                    <span className="font-black uppercase tracking-wider text-[11px] md:text-xs">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="p-3 bg-white border-t border-gray-100 mt-auto">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-10 font-bold uppercase tracking-widest text-[10px] border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all gap-2"
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    setSidebarState('expanded');
                  }}
                >
                  <LayoutDashboard size={14} />
                  MENU
                </Button>
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
  const { t } = useI18n();

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

  // Timeout fallback - if loading takes more than 15s, display the content anyway
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
     if (pathname.includes('/settings/images')) setActiveSettingsSection('wizard');
     else if (pathname.includes('/settings/content')) setActiveSettingsSection('content');
     else if (pathname.includes('/settings/themes') || pathname.includes('/settings/appearance')) setActiveSettingsSection('appearance');
     else if (pathname.includes('/settings/wizard')) setActiveSettingsSection('wizard');
     else if (pathname.includes('/settings/livraison')) setActiveSettingsSection('livraison');
     else if (pathname.includes('/settings/main-doeuvre')) setActiveSettingsSection('main-doeuvre');
     else if (pathname.includes('/settings/pdf')) setActiveSettingsSection('pdf');
     else if (pathname.includes('/settings/emergency')) setActiveSettingsSection('emergency');
     else if (pathname.includes('/settings/software')) setActiveSettingsSection('software');
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
        toast({ variant: 'destructive', title: 'Error', description: 'Unable to load initial data.' });
      } finally {
        setLocalLoading(false);
      }
    }
  }, [settings, themes.length, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const buildMainNavItems = () => {
    if (userProfile?.role === 'fournisseur') {
      return [
        { href: '/admin', label: t('admin.dashboard'), icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: t('admin.dashboardSubtitle') },
        { href: '/admin/quote-requests', label: t('admin.estimations'), icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: t('admin.estimationsSubtitle') },
      ];
    }
    if (userProfile?.role === 'commercial') {
      return [
        { href: '/admin', label: t('admin.dashboard'), icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: t('admin.dashboardSubtitle') },
        { href: '/admin/quote-requests', label: t('admin.estimations'), icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: t('admin.estimationsSubtitle') },
      ];
    }
    return [
      { href: '/admin', label: t('admin.dashboard'), icon: LayoutGrid, exact: true, color: 'text-blue-500', subtitle: t('admin.dashboardSubtitle') },
      { href: '/admin/quote-requests', label: t('admin.estimations'), icon: ListTodo, exact: false, color: 'text-orange-500', subtitle: t('admin.estimationsSubtitle') },
      { href: '/admin/produits', label: t('admin.products'), icon: Package, exact: false, color: 'text-yellow-500', subtitle: t('admin.productsSubtitle') },
      { href: '/admin/users', label: t('admin.users'), icon: Users, exact: true, color: 'text-emerald-500', subtitle: '' },
      { href: '/admin/settings', label: t('admin.settings'), icon: Settings, exact: true, color: 'text-fuchsia-500', subtitle: t('admin.settingsSubtitle') },
      { href: '/admin/history', label: t('admin.history'), icon: History, exact: true, color: 'text-blue-400', subtitle: t('admin.historySubtitle') },
    ];
  };

  const buildSecondaryNavItems = () => {
    const items: any[] = [];
    if (userProfile?.uid) {
      items.push({ href: `/admin/users/${userProfile.uid}`, label: t('admin.myProfile'), icon: User, exact: true, color: 'text-purple-500', subtitle: t('admin.profileSubtitle') });
    }
    return items;
  };

  const mainNavItems = buildMainNavItems();
  const secondaryNavItems = buildSecondaryNavItems();
  const allNavItems = [...mainNavItems, ...secondaryNavItems];

  const activeNavItem = useMemo(() => {
    const sorted = [...allNavItems].sort((a, b) => b.href.length - a.href.length);
    return sorted.find(item => {
      if (item.href === '/admin' && pathname === '/admin') return true;
      return item.href !== '/admin' && pathname.startsWith(item.href);
    });
  }, [allNavItems, pathname]);

  const pageTitle = activeNavItem?.label || t('admin.dashboard');
  const pageSubtitle = activeNavItem?.subtitle || t('admin.dashboardSubtitle');

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
      mainNavItems={mainNavItems}
      secondaryNavItems={secondaryNavItems}
      activeSettingsSection={activeSettingsSection}
      onSettingsSectionChange={handleSettingsSectionChange}
      isSettingsPage={isSettingsPage}
      role={userProfile?.role ? mapRoleToUserRoleEnum(userProfile.role) : undefined}
      onOpenAccountDrawer={() => { }}
      initialSettings={settings}
    />
  );
}
