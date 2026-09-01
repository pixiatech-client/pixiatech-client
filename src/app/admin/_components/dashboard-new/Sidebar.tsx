'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  GripVertical,
  Edit2,
  Upload,
  X,
  Check,
  Trash2,
  MessageSquare,
  Clock,
  EyeOff,
  Box,
  Bell,
  ClipboardList,
  Tag,
  AlertTriangle,
  Globe,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { UserRole } from './dashboard-new-types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { useI18n } from '@/lib/i18n';
import { APP_VERSION } from '@/lib/build-info';

export type SidebarState = 'expanded' | 'compact' | 'hidden';
export type SidebarTheme = 'light' | 'dark';

const VIEW_TO_ROUTE: Record<string, string> = {
  dashboard: '/admin',
  users: '/admin/users',
  estimations: '/admin/quote-requests',
  history: '/admin/history',
  profile: '/admin/users',
  settings: '/admin/settings',
  settingsMain: '/admin/settings/general',
  imagesSub: '/admin/settings/wizard',
  appearanceSub: '/admin/settings/themes',
  wizardSub: '/admin/settings/wizard',
  livraisonSub: '/admin/settings/livraison',
  laborSub: '/admin/settings/main-doeuvre',
  pdfSub: '/admin/settings/pdf',
  emergencySub: '/admin/settings/emergency',
  software: '/admin/settings/software',
  produit: '/admin/produits',
  boutique: '/admin/boutique',
  'codes-promo': '/admin/codes-promo',
  membres: '/admin/membres',
  messages: '/admin/messages',
  notification: '/admin/notifications',
  alertesSysteme: '/admin/alertes-systeme',
  litigesSub: '/admin/litiges',
  paypal: '/admin/settings/paypal',
};

const ROUTE_TO_VIEW: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/quote-requests': 'estimations',
  '/admin/produits': 'produit',
  '/admin/boutique': 'boutique',
  '/admin/codes-promo': 'codes-promo',
  '/admin/membres': 'membres',
  '/admin/history': 'history',
  '/admin/settings': 'settings',
  '/admin/settings/general': 'settingsMain',
  '/admin/settings/images': 'imagesSub',
  '/admin/settings/appearance': 'appearanceSub',
  '/admin/settings/themes': 'appearanceSub',
  '/admin/settings/wizard': 'wizardSub',
  '/admin/settings/livraison': 'deliverySub',
  '/admin/settings/main-doeuvre': 'laborSub',
  '/admin/settings/pdf': 'pdfSub',
  '/admin/settings/emergency': 'emergencySub',
  '/admin/settings/software': 'software',
  '/admin/messages': 'messages',
  '/admin/notifications': 'notification',
  '/admin/alertes-systeme': 'alertesSysteme',
  '/admin/litiges': 'litigesSub',
};

export type SettingsSection = 'general' | 'images' | 'appearance' | 'wizard' | 'livraison' | 'main-doeuvre' | 'pdf' | 'emergency' | 'messaging' | 'software' | 'email-verification' | 'flow' | 'content';

interface SidebarProps {
  state: SidebarState;
  setState: (state: SidebarState) => void;
  theme: SidebarTheme;
  setTheme: (theme: SidebarTheme) => void;
  role: UserRole;
  logoConfig: {
    text: string;
    letter: string;
    color: string;
    image: string | null;
    compactImage?: string | null;
    displayMode?: 'text_image' | 'image_only';
    showRoleBadge?: boolean;
    favicon?: string | null;
  };
  setLogoConfig: React.Dispatch<React.SetStateAction<{
    text: string;
    letter: string;
    color: string;
    image: string | null;
    compactImage?: string | null;
    displayMode?: 'text_image' | 'image_only';
    showRoleBadge?: boolean;
    favicon?: string | null;
  }>>;
  onOpenAccountDrawer: () => void;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  userId?: string;
  userRoleName?: string;
  userRoleColor?: string;
  onSettingsSectionSelect?: (section: SettingsSection) => void;
  selectedSettingsSection?: SettingsSection;
  onSaveOrder?: (newOrder: string[]) => void;
  onSaveLogo?: (newConfig: SidebarProps['logoConfig']) => void;
  onCheckUpdate?: () => void;
  initialOrder?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  setState,
  theme,
  setTheme,
  role,
  logoConfig,
  setLogoConfig,
  onOpenAccountDrawer,
  onLogout,
  userName,
  userEmail,
  userAvatar,
  userId,
  userRoleName,
  userRoleColor,
  onSettingsSectionSelect,
  selectedSettingsSection,
  onSaveOrder,
  onSaveLogo,
  onCheckUpdate,
  initialOrder
}) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [modalPreviewTab, setModalPreviewTab] = useState<'expanded' | 'compact' | 'favicon'>('expanded');
  const [tempLogoConfig, setTempLogoConfig] = useState(logoConfig);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !user?.uid) return;
    const q = query(collection(firestore, 'chats'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, (snap) => {
      let count = 0;
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[user.uid]) {
          count += data.unreadCount[user.uid];
        }
      });
      setUnreadMessages(count);
    });
  }, [firestore, user?.uid]);

  useEffect(() => {
    if (!firestore) return;
    return onSnapshot(doc(firestore, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });
  }, [firestore]);

  const activeView = useMemo(() => {
    if (userId && pathname === `/admin/users/${userId}`) {
      return 'profile';
    }
    if (pathname === '/admin') return 'dashboard';
    if (ROUTE_TO_VIEW[pathname]) {
      return ROUTE_TO_VIEW[pathname];
    }
    for (const [route, view] of Object.entries(ROUTE_TO_VIEW)) {
      if (route !== '/admin' && pathname.startsWith(route)) {
        return view;
      }
    }
    if (pathname.startsWith('/admin/users/')) {
      return 'users';
    }
    return 'dashboard';
  }, [pathname, userId]);

  const setActiveView = (view: string) => {
    if (view === 'profile' && userId) {
      router.push(`/admin/users/${userId}`);
      return;
    }
    const route = VIEW_TO_ROUTE[view];
    if (route) {
      router.push(route);
    }
  };

  const initialItems = useMemo(() => [
    { id: 'dashboard', label: t('admin.dashboard'), icon: LayoutDashboard, color: 'text-blue-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'users', label: t('admin.users'), icon: Users, color: 'text-emerald-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'estimations', label: t('admin.estimations'), icon: FileText, color: 'text-orange-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'history', label: t('admin.history'), icon: Clock, color: 'text-cyan-400', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'produit', label: t('admin.products'), icon: Box, color: 'text-red-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'boutique', label: t('admin.navOrders'), icon: ClipboardList, color: 'text-sky-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'codes-promo', label: t('admin.navCodesPromo'), icon: Tag, color: 'text-emerald-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'membres', label: t('admin.memberSpace'), icon: Users, color: 'text-violet-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'messages', label: t('admin.messages'), icon: MessageSquare, color: 'text-blue-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell, color: 'text-amber-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'alertes-systeme', label: t('admin.systemAlerts.title'), icon: AlertTriangle, color: 'text-red-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'profile', label: t('admin.myProfile'), icon: UserIcon, color: 'text-purple-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'settings', label: t('admin.settings'), icon: Settings, color: 'text-fuchsia-500', roles: [UserRole.ADMINISTRATEUR] },
  ], [t]);

  const [items, setItems] = useState(() => {
    if (initialOrder && initialOrder.length > 0) {
        const orderedItems = initialOrder.map((id: string) => initialItems.find(item => item.id === id)).filter(Boolean);
        const newItems = initialItems.filter(item => !initialOrder.includes(item.id));
        return [...orderedItems, ...newItems];
    }
    return initialItems;
  });

  useEffect(() => {
    if (initialOrder && initialOrder.length > 0) {
        const orderedItems = initialOrder.map((id: string) => initialItems.find(item => item.id === id)).filter(Boolean);
        const newItems = initialItems.filter(item => !initialOrder.includes(item.id));
        setItems([...orderedItems, ...newItems]);
    } else {
        setItems(initialItems);
    }
  }, [initialOrder, initialItems]);

  const handleToggleEditOrder = () => {
    if (isEditingOrder) {
        setIsEditingOrder(false);
        if (role === UserRole.ADMINISTRATEUR && onSaveOrder) {
            const currentOrderIds = items.map((item: any) => item.id);
            onSaveOrder(currentOrderIds);
        }
    } else {
        setIsEditingOrder(true);
    }
  };

  const toggleState = () => {
    if (state === 'expanded') setState('compact');
    else setState('expanded');
  };

  const hideSidebar = () => setState('hidden');

  const isCompact = state === 'compact';
  const isHidden = state === 'hidden';
  const isDark = theme === 'dark';

  const logoColors = [
    'bg-blue-600', 'bg-rose-600', 'bg-emerald-600',
    'bg-amber-600', 'bg-indigo-600', 'bg-purple-600',
    'bg-gray-900', 'bg-orange-600'
  ];

  const handleLogoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogoConfig(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompactLogoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogoConfig(prev => ({ ...prev, compactImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempLogoConfig(prev => ({ ...prev, favicon: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openLogoModal = () => {
    setTempLogoConfig({
      text: logoConfig.text || 'BOT LUMI',
      letter: logoConfig.letter || 'B',
      color: logoConfig.color || 'bg-blue-600',
      image: logoConfig.image || null,
      compactImage: logoConfig.compactImage || null,
      displayMode: logoConfig.displayMode || 'text_image',
      showRoleBadge: logoConfig.showRoleBadge !== false,
      favicon: logoConfig.favicon || null,
    });
    setModalPreviewTab('expanded');
    setIsEditingLogo(true);
  };

  const saveLogoConfig = () => {
    setLogoConfig(tempLogoConfig);
    setIsEditingLogo(false);
    if (role === UserRole.ADMINISTRATEUR && onSaveLogo) {
      onSaveLogo(tempLogoConfig);
    }
    toast.success(t('admin.sidebar.logoUpdated'));
  };

  const sidebarClasses = `
    admin-sidebar fixed lg:sticky top-0 z-[1000] h-dvh transition-colors duration-300 flex flex-col
    bg-theme-sidebar-bg text-theme-sidebar-text border-theme-sidebar-border
    border-r
  `;

  const itemClasses = (isActive: boolean, hasSubItems?: boolean, isExpanded?: boolean) => `
    w-full relative flex items-center gap-3 px-4 py-3 rounded-xl group
    ${isActive
      ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text shadow-lg'
      : isExpanded
        ? 'bg-theme-sidebar-active-bg/30 text-theme-sidebar-text font-semibold'
        : 'text-theme-sidebar-text opacity-70 hover:opacity-100 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text'
    }
  `;

  const filteredItems = items.filter((item: any) => {
    if (item.roles && !item.roles.includes(role)) return false;
    
    if (item.id === 'messages') {
      if (!settings?.messaging?.enabled) return false;
      if (role === UserRole.ADMINISTRATEUR) return true;
      if (role === UserRole.COMMERCIAL && !settings?.messaging?.allowCommercialMessaging) {
        return false;
      }
      if (role === UserRole.FOURNISSEUR && !settings?.messaging?.allowSupplierMessaging) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isHidden ? 0 : (isCompact ? 80 : 256),
        opacity: isHidden ? 0 : 1,
        x: isHidden ? '-100%' : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`${sidebarClasses} ${isHidden ? 'overflow-hidden pointer-events-none' : 'overflow-visible pointer-events-auto'}`}
    >
      {!isHidden && (
        <div className="absolute right-[-18px] top-[195px] flex flex-col gap-3 z-[101]">
          <div className="p-1 rounded-full bg-theme-sidebar-bg">
            <button
              onClick={hideSidebar}
              onMouseEnter={() => setHoveredItem('control-hide')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'
              } active:scale-95 group relative`}
              title={t('admin.hideMenu')}
            >
              <EyeOff className={`w-3.5 h-3.5 transition-all duration-300 text-amber-500/80 ${
                hoveredItem === 'control-hide' ? 'text-amber-500' : ''
              }`} />
            </button>
          </div>
          <div className="p-1 rounded-full bg-theme-sidebar-bg">
            <button
              onClick={toggleState}
              onMouseEnter={() => setHoveredItem('control-state')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'
              } active:scale-95 group relative`}
              title={isCompact ? t('admin.expandMenu') : t('admin.reduceMenu')}
            >
              {isCompact ? (
                <ChevronRight className={`w-3.5 h-3.5 transition-all duration-300 text-blue-500/80 ${
                  hoveredItem === 'control-state' ? 'text-blue-500' : ''
                }`} />
              ) : (
                <ChevronLeft className={`w-3.5 h-3.5 transition-all duration-300 text-blue-500/80 ${
                  hoveredItem === 'control-state' ? 'text-blue-500' : ''
                }`} />
              )}
            </button>
          </div>
        </div>
      )}
      <div className={`${isCompact ? 'w-20' : 'w-64'} flex-1 flex flex-col transition-all duration-300`}>
        <div className="p-6 flex items-start justify-between relative group/logo">
          <AnimatePresence mode="wait">
            {!isCompact && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 cursor-pointer group/logowrapper w-full min-w-0 pr-6"
                onClick={() => {
                  if (role === UserRole.ADMINISTRATEUR) {
                    openLogoModal();
                  }
                }}
              >
                {logoConfig.displayMode === 'image_only' && logoConfig.image ? (
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <img
                      src={logoConfig.image}
                      alt={t('common.logo')}
                      className="max-h-12 w-auto max-w-[180px] object-contain transition-all group-hover/logowrapper:opacity-90"
                    />
                    {userRoleName && (logoConfig.showRoleBadge !== false) && (
                      <div
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit mt-1"
                        style={{ backgroundColor: userRoleColor || '#3b82b6', boxShadow: `0 4px 6px -1px ${userRoleColor || '#3b82b6'}33` }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                          {t('admin.sidebar.userRoleSpace', { roleName: userRoleName })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {logoConfig.image ? (
                      <img src={logoConfig.image} alt={t('common.logo')} className="w-8 h-8 rounded-lg object-cover shadow-lg group-hover/logowrapper:ring-2 group-hover/logowrapper:ring-blue-500 transition-all shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 ${logoConfig.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover/logowrapper:scale-110 transition-transform shrink-0`}>
                        {logoConfig.letter}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xl tracking-tight group-hover/logowrapper:text-blue-600 transition-colors truncate">{logoConfig.text}</span>
                      {userRoleName && (logoConfig.showRoleBadge !== false) && (
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit -mt-0.5"
                          style={{ backgroundColor: userRoleColor || '#3b82b6', boxShadow: `0 4px 6px -1px ${userRoleColor || '#3b82b6'}33` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                            {t('admin.sidebar.userRoleSpace', { roleName: userRoleName })}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
            {isCompact && (
              <motion.div
                key="compact-logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex items-center justify-center group/logowrapper ${role === UserRole.ADMINISTRATEUR ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => {
                  if (role === UserRole.ADMINISTRATEUR) {
                    openLogoModal();
                  }
                }}
              >
                {(logoConfig.compactImage || logoConfig.image) ? (
                  <img
                    src={logoConfig.compactImage || logoConfig.image!}
                    alt={t('common.logo')}
                    className={`w-8 h-8 object-contain mx-auto transition-all ${role === UserRole.ADMINISTRATEUR ? 'group-hover/logowrapper:opacity-80' : ''}`}
                  />
                ) : (
                  <div className={`w-8 h-8 ${logoConfig.color} rounded-lg flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-blue-500/20 transition-transform ${role === UserRole.ADMINISTRATEUR ? 'group-hover/logowrapper:scale-110' : ''}`}>
                    {logoConfig.letter}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Logo Button: subtle, fully invisible by default (opacity-0), pushed to the top right corner */}
          {!isCompact && !isEditingOrder && (
            <button
              onClick={openLogoModal}
              className="absolute right-3 top-5 p-1.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-blue-50 dark:hover:bg-blue-500/20 border border-gray-200/80 dark:border-white/10 rounded-lg opacity-0 group-hover/logo:opacity-100 transition-all duration-200 shadow-sm group/editbtn z-10"
              title={t('admin.editLogo')}
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover/editbtn:text-blue-600 dark:group-hover/editbtn:text-blue-400 transition-colors" />
            </button>
          )}

          <AnimatePresence>
            {isEditingLogo && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsEditingLogo(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4"
                >
                <div className="w-full max-w-lg bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[92vh]">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {t('admin.logoConfigTitle')}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('admin.logoConfigDesc')}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingLogo(false)}
                      className="p-2 rounded-xl hover:bg-gray-200/60 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Live Preview with subtabs */}
                    <div className="p-4 bg-gradient-to-b from-gray-50 to-gray-100/70 dark:from-white/5 dark:to-white/[0.02] rounded-2xl border border-gray-200/80 dark:border-white/10 flex flex-col items-center justify-center gap-3">
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.livePreview')}</span>
                        <div className="flex items-center gap-1 p-0.5 bg-gray-200/60 dark:bg-white/10 rounded-lg text-[10px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setModalPreviewTab('expanded')}
                            className={`px-2 py-0.5 rounded-md transition-all ${modalPreviewTab === 'expanded' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {t('admin.previewExpanded')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalPreviewTab('compact')}
                            className={`px-2 py-0.5 rounded-md transition-all ${modalPreviewTab === 'compact' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {t('admin.previewCompact')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setModalPreviewTab('favicon')}
                            className={`px-2 py-0.5 rounded-md transition-all ${modalPreviewTab === 'favicon' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            Favicon
                          </button>
                        </div>
                      </div>
                      
                      {modalPreviewTab === 'expanded' && (
                        <div className="w-full max-w-xs bg-white dark:bg-[#202024] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
                          {tempLogoConfig.displayMode === 'image_only' && tempLogoConfig.image ? (
                            <div className="flex flex-col gap-1 w-full items-start">
                              <img
                                src={tempLogoConfig.image}
                                alt={t('common.preview')}
                                className="max-h-10 w-auto max-w-full object-contain rounded"
                              />
                              {userRoleName && (tempLogoConfig.showRoleBadge !== false) && (
                                <div
                                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit mt-1"
                                  style={{ backgroundColor: userRoleColor || '#3b82b6', boxShadow: `0 4px 6px -1px ${userRoleColor || '#3b82b6'}33` }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                  <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                                    {t('admin.sidebar.userRoleSpace', { roleName: userRoleName })}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 min-w-0 w-full">
                              {tempLogoConfig.image ? (
                                <img src={tempLogoConfig.image} alt={t('common.preview')} className="w-9 h-9 rounded-lg object-cover shadow-sm shrink-0" />
                              ) : (
                                <div className={`w-9 h-9 ${tempLogoConfig.color} rounded-lg flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
                                  {tempLogoConfig.letter}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-lg tracking-tight dark:text-white truncate">{tempLogoConfig.text || 'BOT LUMI'}</span>
                                {userRoleName && (tempLogoConfig.showRoleBadge !== false) && (
                                  <div
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit -mt-0.5"
                                    style={{ backgroundColor: userRoleColor || '#3b82b6', boxShadow: `0 4px 6px -1px ${userRoleColor || '#3b82b6'}33` }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                                      {t('admin.sidebar.userRoleSpace', { roleName: userRoleName })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {modalPreviewTab === 'compact' && (
                        <div className="w-16 h-16 bg-white dark:bg-[#202024] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center">
                          {(tempLogoConfig.compactImage || tempLogoConfig.image) ? (
                            <img
                              src={tempLogoConfig.compactImage || tempLogoConfig.image!}
                              alt={t('common.preview')}
                              className="w-10 h-10 rounded-lg object-cover shadow-sm"
                            />
                          ) : (
                            <div className={`w-10 h-10 ${tempLogoConfig.color} rounded-lg flex items-center justify-center text-white font-bold shadow-sm`}>
                              {tempLogoConfig.letter}
                            </div>
                          )}
                        </div>
                      )}

                      {modalPreviewTab === 'favicon' && (
                        <div className="w-full max-w-xs flex items-center gap-2 bg-gray-200/80 dark:bg-black/40 px-3 py-2 rounded-t-lg border-b border-gray-300 dark:border-white/10 text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate">
                          {tempLogoConfig.favicon ? (
                            <img src={tempLogoConfig.favicon} alt="Favicon" className="w-4 h-4 object-contain shrink-0 rounded-sm" />
                          ) : (
                            <img src="/favicon.ico" alt="Favicon" className="w-4 h-4 object-contain shrink-0 rounded-sm" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          )}
                          <span className="truncate">{tempLogoConfig.text || 'PixiaTech'} — Administration</span>
                        </div>
                      )}
                    </div>

                    {/* Mode d'affichage Switch */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                        {t('admin.displayMode')}
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setTempLogoConfig(prev => ({ ...prev, displayMode: 'text_image' }))}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            tempLogoConfig.displayMode !== 'image_only'
                              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-white/10'
                              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                          }`}
                        >
                          <Type className="w-3.5 h-3.5" />
                          <span>{t('admin.modeTextImage')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempLogoConfig(prev => ({ ...prev, displayMode: 'image_only' }))}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            tempLogoConfig.displayMode === 'image_only'
                              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200/50 dark:border-white/10'
                              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{t('admin.modeImageOnly')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Nom de l'application */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                        {t('admin.appName')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('admin.sidebar.appNamePlaceholder')}
                        value={tempLogoConfig.text}
                        onChange={(e) => setTempLogoConfig(prev => ({ ...prev, text: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>

                    {/* 1. Image du Logo (Menu Déployé) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('admin.customImage')}
                        </label>
                        {tempLogoConfig.displayMode === 'image_only' && !tempLogoConfig.image && (
                          <span className="text-[10px] text-amber-500 font-semibold">
                            (Image requise pour ce mode)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/upload">
                          <Upload className="w-4 h-4 text-gray-400 group-hover/upload:text-blue-500" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.uploadImage')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoImageUpload} />
                        </label>
                        {tempLogoConfig.image && (
                          <button
                            type="button"
                            onClick={() => setTempLogoConfig(prev => ({ ...prev, image: null }))}
                            className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            title={t('admin.removeImage')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Icône Menu Réduit (Optionnelle) */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white block">
                          {t('admin.compactLogoImage')}
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {t('admin.compactLogoImageDesc')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                          {(tempLogoConfig.compactImage || tempLogoConfig.image) ? (
                            <img src={tempLogoConfig.compactImage || tempLogoConfig.image!} alt="Compact Icon" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className={`w-full h-full ${tempLogoConfig.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                              {tempLogoConfig.letter}
                            </div>
                          )}
                        </div>
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-white/20 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-all group/cicon">
                          <Upload className="w-3.5 h-3.5 text-gray-400 group-hover/cicon:text-blue-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('admin.uploadImage')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCompactLogoImageUpload} />
                        </label>
                        {tempLogoConfig.compactImage && (
                          <button
                            type="button"
                            onClick={() => setTempLogoConfig(prev => ({ ...prev, compactImage: null }))}
                            className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shrink-0"
                            title={t('admin.removeImage')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Initiale & Couleur (si pas d'image et mode texte) */}
                    {!tempLogoConfig.image && tempLogoConfig.displayMode !== 'image_only' && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.initial')}</label>
                          <input
                            type="text"
                            maxLength={1}
                            placeholder={t('admin.sidebar.initialPlaceholder')}
                            value={tempLogoConfig.letter}
                            onChange={(e) => setTempLogoConfig(prev => ({ ...prev, letter: e.target.value.toUpperCase() }))}
                            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white text-center font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.brandColor')}</label>
                          <div className="flex flex-wrap gap-2.5">
                            {logoColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setTempLogoConfig(prev => ({ ...prev, color }))}
                                className={`w-7 h-7 rounded-lg ${color} transition-all hover:scale-110 flex items-center justify-center shadow-sm ${tempLogoConfig.color === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#1c1c1e] scale-110' : 'opacity-80 hover:opacity-100'}`}
                              >
                                {tempLogoConfig.color === color && <Check className="w-3.5 h-3.5 text-white" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Switch Espace Administrateur (Badge de Rôle) */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">
                          {t('admin.roleBadgeTitle')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {t('admin.roleBadgeDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={tempLogoConfig.showRoleBadge !== false}
                        onClick={() => setTempLogoConfig(prev => ({ ...prev, showRoleBadge: prev.showRoleBadge === false ? true : false }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          tempLogoConfig.showRoleBadge !== false ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            tempLogoConfig.showRoleBadge !== false ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Favicon du site (favicon.ico / .png) */}
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-3">
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-blue-500" />
                          {t('admin.faviconSectionTitle')}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('admin.faviconSectionDesc')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1.5">
                          {tempLogoConfig.favicon ? (
                            <img src={tempLogoConfig.favicon} alt="Favicon" className="w-full h-full object-contain rounded" />
                          ) : (
                            <img src="/favicon.ico" alt="Favicon" className="w-full h-full object-contain rounded" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          )}
                        </div>
                        
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-white/20 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-all group/fav">
                          <Upload className="w-3.5 h-3.5 text-gray-400 group-hover/fav:text-blue-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t('admin.uploadFavicon')}</span>
                          <input type="file" accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml" className="hidden" onChange={handleFaviconUpload} />
                        </label>

                        {tempLogoConfig.favicon && (
                          <button
                            type="button"
                            onClick={() => setTempLogoConfig(prev => ({ ...prev, favicon: null }))}
                            className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shrink-0"
                            title={t('admin.removeFavicon')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                    <button
                      type="button"
                      onClick={saveLogoConfig}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {t('admin.saveChanges')}
                    </button>
                  </div>
                </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto custom-scrollbar py-4 min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            {!isCompact && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('admin.mainMenu')}
              </span>
            )}
            {role === UserRole.ADMINISTRATEUR && (
              <button
                onClick={handleToggleEditOrder}
                className={`p-1.5 rounded-lg transition-colors ${isEditingOrder
                  ? 'bg-blue-600 text-white'
                  : `${isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`
                  }`}
                 title={isEditingOrder ? t('admin.finishReorganize') : t('admin.reorganizeMenu')}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Reorder.Group axis="y" values={filteredItems} onReorder={setItems} className="space-y-1">
            {filteredItems.map((item: any) => {
              const isActive = activeView === item.id;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedSubmenu === item.id;

              return (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  dragListener={isEditingOrder}
                  className="relative"
                >
                  <button
                    className={`${itemClasses(isActive, hasSubItems, isExpanded)} ${isEditingOrder ? 'cursor-grab active:cursor-grabbing' : ''} ${hasSubItems ? 'w-full' : ''}`}
                    onClick={() => {
                      if (isEditingOrder) return;
                      if (hasSubItems) {
                        setActiveView(item.id);
                        setExpandedSubmenu(isExpanded ? null : item.id);
                      } else {
                        setActiveView(item.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <item.icon className={`${isCompact ? 'w-5 h-5 mx-auto' : 'w-4 h-4'} transition-colors duration-200 ${isActive || hoveredItem === item.id ? item.color : ''}`} />
                      {!isCompact && <span className="text-sm font-semibold tracking-tight truncate">{item.label}</span>}
                      {item.id === 'messages' && unreadMessages > 0 && (
                        <span className={`absolute ${isCompact ? 'top-2 right-2' : 'right-4'} flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white`}>
                          {unreadMessages}
                        </span>
                      )}
                      {!isCompact && hasSubItems && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </div>

                    {isEditingOrder && !isCompact && (
                      <GripVertical className="w-3.5 h-3.5 text-gray-500 opacity-50" />
                    )}

                    {/* Tooltip for compact mode */}
                    {isCompact && hoveredItem === item.id && !isEditingOrder && (
                      <div className={`absolute left-full ml-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-[100] shadow-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {item.label}
                        <div className={`absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] ${isDark ? 'border-r-white' : 'border-r-black'}`} />
                      </div>
                    )}
                  </button>

                  {/* Sub-items */}
                  {hasSubItems && !isCompact && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((subItem: any) => {
                        // Map subItem id to SettingsSection
                        const subItemToSection: Record<string, SettingsSection> = {
                          'settings-main': 'general',
                          'images-sub': 'images',
                          'appearance-sub': 'appearance',
                          'wizard-sub': 'wizard',
                          'delivery-sub': 'livraison',
                          'labor-sub': 'main-doeuvre',
                          'pdf-sub': 'pdf',
                          'emergency-sub': 'emergency',
                        };
                        const isSubItemActive = selectedSettingsSection === subItemToSection[subItem.id];

                        return (
                          <button
                            key={subItem.id}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isSubItemActive
                              ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text'
                              : 'text-theme-sidebar-text opacity-70 hover:opacity-100 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const section = subItemToSection[subItem.id];
                              if (section && onSettingsSectionSelect) {
                                onSettingsSectionSelect(section);
                              } else {
                                setActiveView(subItem.id);
                              }
                            }}
                          >
                            <subItem.icon className={`w-4 h-4 ${subItem.color || ''}`} />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        {/* Footer Actions (toujours visible, hors zone scrollable) */}
        <div className="px-4 pb-4">
          <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <button
              onClick={onLogout}
              onMouseEnter={() => isCompact && setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold group hover:bg-red-50 hover:text-red-600 text-red-500`}
            >
              <LogOut className={`${isCompact ? 'w-4 h-4 mx-auto' : 'w-4 h-4'} transition-colors duration-200 group-hover:text-red-500`} />
              {!isCompact && <span>{t('admin.logout')}</span>}

              {isCompact && hoveredItem === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 20 }}
                  className={`absolute left-full ml-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-[100] shadow-xl bg-red-500 text-white`}
                >
                  {t('admin.logout')}
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-red-500" />
                </motion.div>
              )}
            </button>

            {!isCompact ? (
              <div
                onClick={onCheckUpdate}
                role={onCheckUpdate ? 'button' : undefined}
                tabIndex={onCheckUpdate ? 0 : undefined}
                className={`mt-2 px-2 text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 opacity-90 select-none whitespace-nowrap transition-colors ${
                  onCheckUpdate ? 'cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 hover:opacity-100' : ''
                }`}
                title={onCheckUpdate ? "Cliquer pour vérifier les mises à jour" : `© ${new Date().getFullYear()} PixiaTech — Version ${APP_VERSION}`}
              >
                © {new Date().getFullYear()} PixiaTech | <span className="font-mono">Version {APP_VERSION}</span>
              </div>
            ) : (
              <div
                onClick={onCheckUpdate}
                role={onCheckUpdate ? 'button' : undefined}
                tabIndex={onCheckUpdate ? 0 : undefined}
                className={`mt-2 text-center text-[10px] font-mono text-slate-400 dark:text-slate-500 opacity-80 select-none transition-colors ${
                  onCheckUpdate ? 'cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 hover:opacity-100' : ''
                }`}
                title={onCheckUpdate ? "Cliquer pour vérifier les mises à jour" : `© ${new Date().getFullYear()} PixiaTech — Version ${APP_VERSION}`}
              >
                v{APP_VERSION}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
