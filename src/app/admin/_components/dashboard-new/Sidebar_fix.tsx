import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  User as UserIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu,
  FileText,
  Package,
  Wand2,
  Truck,
  HardHat,
  GripVertical,
  Edit2,
  Upload,
  X,
  Check,
  Trash2,
  MessageSquare,
  MessageSquareText,
  Clock,
  EyeOff,
  Box,
  Palette,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { UserRole } from './dashboard-new-types';
import { usePathname, useRouter } from 'next/navigation';

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
  imagesSub: '/admin/settings/images',
  contentSub: '/admin/settings/content',
  appearanceSub: '/admin/settings/themes',
  wizardSub: '/admin/settings/wizard',
  deliverySub: '/admin/settings/livraison',
  laborSub: '/admin/settings/main-doeuvre',
  pdfSub: '/admin/settings/pdf',
  emergencySub: '/admin/settings/emergency',
  produit: '/admin/produits',
  messages: '/admin/messages',
};

const ROUTE_TO_VIEW: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/quote-requests': 'estimations',
  '/admin/produits': 'produit',
  '/admin/history': 'history',
  '/admin/settings': 'settings',
  '/admin/settings/general': 'settingsMain',
  '/admin/settings/images': 'imagesSub',
  '/admin/settings/content': 'contentSub',
  '/admin/settings/themes': 'appearanceSub',
  '/admin/settings/wizard': 'wizardSub',
  '/admin/settings/livraison': 'deliverySub',
  '/admin/settings/main-doeuvre': 'laborSub',
  '/admin/settings/pdf': 'pdfSub',
  '/admin/settings/emergency': 'emergencySub',
  '/admin/messages': 'messages',
};

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
  userId
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [tempLogoConfig, setTempLogoConfig] = useState(logoConfig);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);

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

  const initialItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'text-blue-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'users', label: 'Utilisateurs', icon: Users, color: 'text-emerald-500', roles: [UserRole.ADMINISTRATEUR] },
    { id: 'estimations', label: 'Estimations', icon: FileText, color: 'text-orange-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'history', label: 'Historique', icon: Clock, color: 'text-cyan-400', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'produit', label: 'Produits', icon: Box, color: 'text-red-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'text-blue-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'profile', label: 'Mon Profil', icon: UserIcon, color: 'text-purple-500', roles: [UserRole.ADMINISTRATEUR, UserRole.FOURNISSEUR, UserRole.COMMERCIAL] },
    { id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-fuchsia-500', roles: [UserRole.ADMINISTRATEUR], subItems: [
      { id: 'settings-main', label: 'Général', icon: Settings, color: 'text-blue-500' },
      { id: 'images-sub', label: 'Images', icon: Upload, color: 'text-green-500' },
      { id: 'content-sub', label: 'Contenu', icon: MessageSquareText, color: 'text-purple-500' },
      { id: 'appearance-sub', label: 'Apparence', icon: Palette, color: 'text-pink-500' },
      { id: 'wizard-sub', label: 'Wizard', icon: Wand2, color: 'text-orange-500' },
      { id: 'delivery-sub', label: 'Livraison', icon: Truck, color: 'text-cyan-500' },
      { id: 'labor-sub', label: 'Main d\'œuvre', icon: HardHat, color: 'text-yellow-500' },
      { id: 'pdf-sub', label: 'PDF', icon: FileText, color: 'text-red-500' },
      { id: 'emergency-sub', label: 'Urgence', icon: AlertTriangle, color: 'text-rose-500' },
    ] },
  ];

  const [items, setItems] = useState(() => {
    const savedOrder = localStorage.getItem('sidebar-order');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const orderedItems = orderIds.map((id: string) => initialItems.find(item => item.id === id)).filter(Boolean);
        const newItems = initialItems.filter(item => !orderIds.includes(item.id));
        return [...orderedItems, ...newItems];
      } catch (e) {
        return initialItems;
      }
    }
    return initialItems;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-order', JSON.stringify(items.map((item: any) => item.id)));
  }, [items]);

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
    toast.success('Configuration du logo mise à jour !');
  };

  const sidebarClasses = `
    fixed lg:sticky top-0 z-50 h-screen transition-colors duration-300 flex flex-col
    ${isDark ? 'bg-[#141414] text-white border-white/5' : 'bg-white text-gray-900 border-gray-200'}
    border-r overflow-hidden
  `;

  const itemClasses = (isActive: boolean) => `
    w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
    ${isActive
      ? 'bg-black text-white shadow-lg'
      : 'text-gray-500 dark:text-gray-400 hover:bg-black hover:text-white'
    }
  `;

  const filteredItems = items.filter((item: any) =>
    !item.roles || item.roles.includes(role)
  );

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isHidden ? 0 : (isCompact ? 80 : 256),
        opacity: isHidden ? 0 : 1,
        x: isHidden ? -20 : 0
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={sidebarClasses}
    >
      <div className={`${isCompact ? 'w-20' : 'w-64'} h-full flex flex-col transition-all duration-300`}>
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between relative group/logo">
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
                <span className="font-bold text-xl tracking-tight group-hover/logowrapper:text-blue-600 transition-colors">{logoConfig.text}</span>
              </motion.div>
          )}
          {isCompact && (
            <motion.div
              key="compact-logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-10 h-10 flex items-center justify-center cursor-pointer"
              onClick={() => {
                if (role === UserRole.ADMINISTRATEUR) {
                  setTempLogoConfig(logoConfig);
                  setIsEditingLogo(true);
                }
              }}
            >
              {logoConfig.image ? (
                <img src={logoConfig.image} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className={`w-8 h-8 ${logoConfig.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                  {logoConfig.letter}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar">
        <div className="space-y-1">
          {filteredItems.map((item: any) => (
            <div key={item.id}>
              {item.subItems ? (
                <div className="mb-2">
                  <button
                    onClick={() => setExpandedSubmenu(expandedSubmenu === item.id ? null : item.id)}
                    className={cn(
                      itemClasses(activeView === item.id),
                      "w-full"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
                    {!isCompact && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expandedSubmenu === item.id && "rotate-90"
                        )} />
                      </>
                    )}
                  </button>
                  
                  {!isCompact && expandedSubmenu === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-4 mt-1 space-y-0.5 overflow-hidden"
                    >
                      {item.subItems.map((subItem: any) => {
                        const IconComponent = subItem.icon;
                        const isSubActive = activeView === subItem.id;
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setActiveView(subItem.id)}
                            className={cn(
                              "w-full relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm",
                              isSubActive
                                ? 'bg-black text-white shadow-lg font-medium'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 hover:text-gray-900 dark:hover:text-white'
                            )}
                          >
                            <IconComponent className={cn("h-4 w-4 flex-shrink-0", subItem.color)} />
                            <span>{subItem.label}</span>
                            {isSubActive && (
                              <motion.div
                                layoutId="activeSettings"
                                className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                              />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setActiveView(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    itemClasses(activeView === item.id),
                    "relative"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", item.color)} />
                  {!isCompact && (
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                  )}
                  {activeView === item.id && (
                    <motion.div
                      layoutId="activeNav"
                      className={cn(
                        "absolute left-0 w-1 h-8 rounded-r-full",
                        isDark ? "bg-white" : "bg-black"
                      )}
                    />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200 dark:border-white/10">
        {!isCompact && (
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</span>
            <div className="flex gap-1">
              <button
                onClick={() => setIsEditingOrder(!isEditingOrder)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Réorganiser"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={toggleState}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            "text-gray-500 dark:text-gray-400 hover:bg-black hover:text-white"
          )}
        >
          {isCompact ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!isCompact && <span className="font-medium">Réduire</span>}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              "text-gray-500 dark:text-gray-400 hover:bg-black hover:text-white"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isCompact && <span className="font-medium">Déconnexion</span>}
          </button>
        )}
      </div>

      {/* Logo Edit Modal */}
      <AnimatePresence>
        {isEditingLogo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={() => setIsEditingLogo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Modifier le Logo</h3>
                <button
                  onClick={() => setIsEditingLogo(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Texte</label>
                  <input
                    type="text"
                    value={tempLogoConfig.text}
                    onChange={(e) => setTempLogoConfig(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Lettre</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={tempLogoConfig.letter}
                    onChange={(e) => setTempLogoConfig(prev => ({ ...prev, letter: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {logoColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setTempLogoConfig(prev => ({ ...prev, color }))}
                        className={cn(
                          "w-10 h-10 rounded-lg transition-transform hover:scale-110",
                          color,
                          tempLogoConfig.color === color && "ring-2 ring-offset-2 ring-blue-500"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image (optionnel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoImageUpload}
                    className="w-full text-sm"
                  />
                  {tempLogoConfig.image && (
                    <div className="mt-2 relative inline-block">
                      <img src={tempLogoConfig.image} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                      <button
                        onClick={() => setTempLogoConfig(prev => ({ ...prev, image: null }))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsEditingLogo(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveLogoConfig}
                  className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Sauvegarder
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
