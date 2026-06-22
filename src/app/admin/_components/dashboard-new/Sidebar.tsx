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
  Store
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { UserRole } from './dashboard-new-types';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { useI18n } from '@/lib/i18n';

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
  deliverySub: '/admin/settings/livraison',
  laborSub: '/admin/settings/main-doeuvre',
  pdfSub: '/admin/settings/pdf',
  emergencySub: '/admin/settings/emergency',
  produit: '/admin/produits',
  boutique: '/admin/boutique',
  messages: '/admin/messages',
  notifications: '/admin/notification',
};

const ROUTE_TO_VIEW: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/quote-requests': 'estimations',
  '/admin/produits': 'produit',
  '/admin/boutique': 'boutique',
  '/admin/history': 'history',
  '/admin/settings': 'settings',
  '/admin/settings/general': 'settingsMain',
  '/admin/settings/images': 'wizardSub',
  '/admin/settings/themes': 'appearanceSub',
  '/admin/settings/wizard': 'wizardSub',
  '/admin/settings/livraison': 'deliverySub',
  '/admin/settings/main-doeuvre': 'laborSub',
  '/admin/settings/pdf': 'pdfSub',
  '/admin/settings/emergency': 'emergencySub',
  '/admin/settings/software': 'software',
  '/admin/messages': 'messages',
  '/admin/notification': 'notifications',
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
  };
  setLogoConfig: React.Dispatch<React.SetStateAction<{
    text: string;
    letter: string;
    color: string;
    image: string | null;
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
  initialOrder
}) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogoConfig, setTempLogoConfig] = useState(logoConfig);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>('settings');
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
    // Check if on user's own profile page first (most specific)
    if (userId && pathname === `/admin/users/${userId}`) {
      return 'profile';
    }

    // Dashboard exact match
    if (pathname === '/admin') return 'dashboard';

    // Check exact route match
    if (ROUTE_TO_VIEW[pathname]) {
      return ROUTE_TO_VIEW[pathname];
    }

    // Check prefix match (for sub-routes)
    for (const [route, view] of Object.entries(ROUTE_TO_VIEW)) {
      if (route !== '/admin' && pathname.startsWith(route)) {
        return view;
      }
    }

    // Fallback for profile sub-routes not matching user's own profile
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
    { id: 'boutique', label: 'Boutique', icon: Store, color: 'text-sky-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'messages', label: t('admin.messages'), icon: MessageSquare, color: 'text-blue-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell, color: 'text-amber-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
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
  }, [initialItems, initialOrder]);

  // We no longer save to localStorage for everyone.
  // We'll save to Firestore when the user finishes editing.
  const handleToggleEditOrder = () => {
    if (isEditingOrder) {
      // Saving
      if (role === UserRole.ADMINISTRATEUR && onSaveOrder) {
        onSaveOrder(items.map(item => item.id));
      }
    }
    setIsEditingOrder(!isEditingOrder);
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

  const saveLogoConfig = () => {
    setLogoConfig(tempLogoConfig);
    setIsEditingLogo(false);
    if (role === UserRole.ADMINISTRATEUR && onSaveLogo) {
        onSaveLogo(tempLogoConfig);
    }
    toast.success('Logo configuration updated!');
  };

  const sidebarClasses = `
    admin-sidebar fixed lg:sticky top-0 z-[1000] min-h-screen transition-colors duration-300 flex flex-col
    bg-theme-sidebar-bg text-theme-sidebar-text border-theme-sidebar-border
    border-r
  `;

  const itemClasses = (isActive: boolean) => `
    w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
    ${isActive
      ? 'bg-theme-sidebar-active-bg text-theme-sidebar-active-text shadow-lg'
      : 'text-theme-sidebar-text opacity-70 hover:opacity-100 hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text'
    }
  `;

  const filteredItems = items.filter((item: any) => {
    if (item.roles && !item.roles.includes(role)) return false;
    
    // Messaging visibility logic
    if (item.id === 'messages') {
      if (!settings?.messaging?.enabled) return false;
      
      // Admins always see messages
      if (role === UserRole.ADMINISTRATEUR) return true;
      
      // Check commercial access
      if (role === UserRole.COMMERCIAL && !settings?.messaging?.allowCommercialMessaging) {
        return false;
      }
      
      // Check supplier access
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
      {/* Floating Sidebar Controls (Stacked with matching theme backgrounds - No shadows, No borders) */}
      {!isHidden && (
        <div className="absolute right-[-18px] top-[195px] flex flex-col gap-3 z-[101]">
          {/* Hide Button Container */}
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

          {/* Reduce/Expand Button Container */}
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
        {/* Header / Logo */}
        <div className="p-6 flex items-start justify-between relative group/logo">
          <AnimatePresence mode="wait">
            {!isCompact && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 cursor-pointer group/logowrapper"
                onClick={() => {
                  if (role === UserRole.ADMINISTRATEUR) {
                    setTempLogoConfig(logoConfig);
                    setIsEditingLogo(true);
                  }
                }}
              >
                {logoConfig.image ? (
                  <img src={logoConfig.image} alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-lg group-hover/logowrapper:ring-2 group-hover/logowrapper:ring-blue-500 transition-all" />
                ) : (
                  <div className={`w-8 h-8 ${logoConfig.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover/logowrapper:scale-110 transition-transform`}>
                    {logoConfig.letter}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight group-hover/logowrapper:text-blue-600 transition-colors">{logoConfig.text}</span>
                  {userRoleName && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit -mt-0.5"
                      style={{ backgroundColor: userRoleColor || '#3b82b6', boxShadow: `0 4px 6px -1px ${userRoleColor || '#3b82b6'}33` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
                        {locale === 'fr' ? `Espace ${userRoleName}` : `${userRoleName} Space`}
                      </span>
                    </div>
                  )}
                </div>
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
                    setTempLogoConfig(logoConfig);
                    setIsEditingLogo(true);
                  }
                }}
              >
                {logoConfig.image ? (
                  <img src={logoConfig.image} alt="Logo" className={`w-8 h-8 rounded-lg object-cover shadow-lg mx-auto transition-all ${role === UserRole.ADMINISTRATEUR ? 'group-hover/logowrapper:ring-2 group-hover/logowrapper:ring-blue-500' : ''}`} />
                ) : (
                  <div className={`w-8 h-8 ${logoConfig.color} rounded-lg flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-blue-500/20 transition-transform ${role === UserRole.ADMINISTRATEUR ? 'group-hover/logowrapper:scale-110' : ''}`}>
                    {logoConfig.letter}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Edit Logo Button */}
          {!isCompact && !isEditingOrder && (
            <button
              onClick={() => {
                setTempLogoConfig(logoConfig);
                setIsEditingLogo(true);
              }}
              className="p-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg opacity-20 group-hover/logo:opacity-100 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/30 group/editbtn"
               title={t('admin.editLogo')}
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-400 group-hover/editbtn:text-blue-600 transition-colors" />
            </button>
          )}

          {/* Logo Editing Modal */}
          <AnimatePresence>
            {isEditingLogo && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsEditingLogo(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
                >
                <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] pointer-events-auto mx-4">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('admin.logoConfigTitle')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin.logoConfigDesc')}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingLogo(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Preview Section */}
                    <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center gap-4 min-h-[120px]">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.livePreview')}</span>
                      <div className="flex items-center justify-center gap-3 scale-110 origin-center w-full overflow-hidden px-4">
                        {tempLogoConfig.image ? (
                          <img src={tempLogoConfig.image} alt="Preview" className="w-10 h-10 rounded-lg object-cover shadow-lg shrink-0" />
                        ) : (
                          <div className={`w-10 h-10 ${tempLogoConfig.color} rounded-lg flex items-center justify-center text-white font-bold shadow-lg shrink-0`}>
                            {tempLogoConfig.letter}
                          </div>
                        )}
                        <span className="font-bold text-2xl tracking-tight dark:text-white truncate">{tempLogoConfig.text}</span>
                      </div>
                    </div>

                    {/* Text Input */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.appName')}</label>
                      <input
                        type="text"
                        placeholder="Ex: Mon App"
                        value={tempLogoConfig.text}
                        onChange={(e) => setTempLogoConfig(prev => ({ ...prev, text: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Letter Input */}
                      {!tempLogoConfig.image && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.initial')}</label>
                          <input
                            type="text"
                            maxLength={1}
                            placeholder="P"
                            value={tempLogoConfig.letter}
                            onChange={(e) => setTempLogoConfig(prev => ({ ...prev, letter: e.target.value.toUpperCase() }))}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white text-center font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* Color Picker */}
                      {!tempLogoConfig.image && (
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.brandColor')}</label>
                          <div className="flex flex-wrap gap-2.5">
                            {logoColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setTempLogoConfig(prev => ({ ...prev, color }))}
                                className={`w-8 h-8 rounded-lg ${color} transition-all hover:scale-110 flex items-center justify-center shadow-sm ${tempLogoConfig.color === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#1c1c1e] scale-110' : 'opacity-80 hover:opacity-100'}`}
                              >
                                {tempLogoConfig.color === color && <Check className="w-4 h-4 text-white" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">{t('admin.customImage')}</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/upload">
                          <Upload className="w-4 h-4 text-gray-400 group-hover/upload:text-blue-500" />
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.uploadImage')}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoImageUpload} />
                        </label>
                        {tempLogoConfig.image && (
                          <button
                            onClick={() => setTempLogoConfig(prev => ({ ...prev, image: null }))}
                            className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                             title={t('admin.removeImage')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={saveLogoConfig}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        {t('admin.saveChanges')}
                      </button>
                    </div>
                  </div>
                </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 overflow-y-auto custom-scrollbar py-4">
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
                    className={`${itemClasses(isActive)} ${isEditingOrder ? 'cursor-grab active:cursor-grabbing' : ''} ${hasSubItems ? 'w-full' : ''}`}
                    onClick={() => {
                      if (isEditingOrder) return;
                      if (hasSubItems) {
                        if (item.id === 'settings') {
                          setActiveView('settings');
                        } else {
                          setExpandedSubmenu(isExpanded ? null : item.id);
                        }
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
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 20 }}
                        className={`absolute left-full ml-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-[100] shadow-xl ${isDark ? 'bg-white text-black' : 'bg-black text-white'
                          }`}
                      >
                        {item.label}
                        <div className={`absolute left-[-4px] top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] ${isDark ? 'border-r-white' : 'border-r-black'
                          }`} />
                      </motion.div>
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
          {/* Footer Actions (moved inside scroll container) */}
          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'} space-y-4`}>
          {/* Theme/Controls Section Empty as per personalization request */}

          <div className="flex flex-col gap-2">
            {/* Old State Toggle & Hide Buttons Removed */}
          </div>

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
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
