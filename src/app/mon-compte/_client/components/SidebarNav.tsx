'use client';

import { motion } from 'framer-motion';
import { FileText, HelpCircle, LayoutDashboard, MessageSquareWarning, Settings, ShoppingBag, Store, Package } from 'lucide-react';
import { SlidingSwitch } from './SlidingSwitch';

interface SidebarNavProps {
  active: string;
  onChange: (key: string) => void;
  unreadDisputes: number;
  onOpenBoutique: () => void;
  children?: React.ReactNode;
}

const MAIN_OPTIONS = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={17} /> },
  { key: 'orders', label: 'Mes commandes', icon: <Package size={17} /> },
  { key: 'invoices', label: 'Mes factures', icon: <FileText size={17} /> },
  { key: 'disputes', label: 'Mes litiges', icon: <MessageSquareWarning size={17} /> },
  { key: 'settings', label: 'Mes paramètres', icon: <Settings size={17} /> },
];

const MOBILE_OPTIONS = [
  { key: 'dashboard', label: 'Accueil' },
  { key: 'orders', label: 'Commandes' },
  { key: 'invoices', label: 'Factures' },
  { key: 'disputes', label: 'Litiges' },
  { key: 'settings', label: 'Paramètres' },
];

export function SidebarNav({ active, onChange, unreadDisputes, onOpenBoutique }: SidebarNavProps) {
  return (
    <>
      <nav className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-[104px] space-y-6">
          <div>
            <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Mes espaces</p>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-xs">
              <button
                type="button"
                onClick={onOpenBoutique}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
              >
                <Store size={17} className="text-neutral-400" />
                Boutique
                <ShoppingBag size={14} className="ml-auto text-neutral-300" />
              </button>
              <a
                href="/estimation"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
              >
                <HelpCircle size={17} className="text-neutral-400" />
                Demande d’estimation
              </a>
            </div>
          </div>

          <div>
            <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Mon compte</p>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-xs">
              <div className="flex flex-col gap-1">
                {MAIN_OPTIONS.map((option) => {
                  const isActive = option.key === active;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => onChange(option.key)}
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-pill"
                          className="absolute inset-0 rounded-xl bg-[#0A0D0E]"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        <span className={isActive ? 'text-[#38E044]' : 'text-neutral-400'}>{option.icon}</span>
                        {option.label}
                        {option.key === 'disputes' && unreadDisputes > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#38E044] px-1.5 text-[10px] font-bold text-black">
                            {unreadDisputes}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="sticky top-[88px] z-30 -mx-1 px-1 pt-3 md:hidden">
        <SlidingSwitch options={MOBILE_OPTIONS} active={active} onChange={onChange} className="!rounded-2xl" />
      </div>
    </>
  );
}