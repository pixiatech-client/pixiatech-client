'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  X,
} from 'lucide-react';
import type { ClientProfile, ClientTab } from '../types';

interface NavigationProps {
  activeTab: ClientTab;
  onNavigate: (tab: ClientTab) => void;
  ordersCount: number;
  invoicesCount: number;
  onOpenDisputeModal: () => void;
  onOpenStore: () => void;
  onLogout: () => void;
  user: Pick<ClientProfile, 'name' | 'email' | 'avatarUrl' | 'companyName'> | null;
}

export function Navigation({
  activeTab,
  onNavigate,
  ordersCount,
  invoicesCount,
  onOpenDisputeModal,
  onOpenStore,
  onLogout,
  user,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: 'dashboard' as ClientTab,
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'orders' as ClientTab,
      label: 'Mes commandes',
      icon: <Package className="w-4 h-4" />,
      badge: ordersCount > 0 ? ordersCount : undefined,
    },
    {
      id: 'invoices' as ClientTab,
      label: 'Mes factures',
      icon: <FileText className="w-4 h-4" />,
      badge: invoicesCount > 0 ? invoicesCount : undefined,
    },
    {
      id: 'disputes' as ClientTab,
      label: 'Litiges & Réclamations',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    {
      id: 'settings' as ClientTab,
      label: 'Paramètres du compte',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const mobileAvatarFallback = (user?.name || 'C').charAt(0).toUpperCase();

  return (
    <>
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <nav
            id="pixiatech-top-capsule-nav"
            className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0F1214]/90 backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-x-auto select-none"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 cursor-pointer select-none ${
                    isActive ? 'text-white' : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-top-nav-capsule"
                      className="absolute inset-0 bg-[#161B1E] rounded-xl shadow-md border border-[#38E044]/30 pointer-events-none"
                      transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.7 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2">
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#38E044] shadow-[0_0_8px_#38E044] shrink-0" />}

                    <span className={isActive ? 'text-white' : 'text-neutral-400'}>{item.icon}</span>

                    <span className="whitespace-nowrap">{item.label}</span>

                    {item.badge !== undefined && (
                      <span
                        className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-[#38E044]/15 text-[#38E044] border border-[#38E044]/30'
                            : 'bg-white/[0.06] text-neutral-400 border border-white/[0.08]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              id="btn-open-dispute-nav"
              type="button"
              onClick={onOpenDisputeModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F1214] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-500/30 text-neutral-300 hover:text-amber-300 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Signaler un incident ou ouvrir une réclamation"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Ouvrir un litige</span>
            </button>
          </div>

          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white capitalize">
                {navItems.find((i) => i.id === activeTab)?.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-open-dispute-mobile"
                type="button"
                onClick={onOpenDisputeModal}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Litige</span>
              </button>
              <button
                id="btn-toggle-mobile-menu"
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-[#0F1214] border border-white/[0.08] text-white shadow-xs"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="relative w-4/5 max-w-xs bg-[#0F1214] border-r border-white/[0.08] h-full shadow-2xl flex flex-col z-50 text-white"
            >
              <div className="p-4 bg-[#0A0D0E] text-white flex items-center justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider font-mono">PIXIATECH</span>
                  <span className="bg-[#38E044] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    CLIENT
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-white/[0.08] bg-[#0A0D0E]/60">
                <div className="flex items-center gap-3">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#161B1E] text-[#38E044] text-lg font-bold flex items-center justify-center border border-white/10">
                      {mobileAvatarFallback}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">{user?.name || 'Client'}</div>
                    <div className="text-xs text-neutral-400 truncate">{user?.email || ''}</div>
                    {user?.companyName ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {user.companyName}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-neutral-300 bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full mt-1 inline-block">
                        Espace Client
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-semibold text-neutral-500 px-3 py-1 uppercase tracking-wider">
                  Navigation Principale
                </div>
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#161B1E] text-white border border-[#38E044]/30'
                          : 'text-neutral-300 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isActive && <span className="w-2 h-2 rounded-full bg-[#38E044]" />}
                        <span className={isActive ? 'text-[#38E044]' : 'text-neutral-400'}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-[#38E044]/15 text-[#38E044] border border-[#38E044]/30'
                              : 'bg-white/[0.06] text-neutral-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pt-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDisputeModal();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Ouvrir un litige</span>
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenStore();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-neutral-400" />
                    <span>Accéder à la boutique</span>
                  </button>
                </div>
              </div>

              <div className="p-3 border-t border-white/[0.08]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
