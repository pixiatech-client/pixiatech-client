'use client';

import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { EstimationStatus } from '../types';
import { Clock, CheckCircle2, Truck, Archive, Trash2, Calculator, Users, Hourglass, RotateCcw, Key, LucideIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const useStatusLabel = () => {
  const { t } = useI18n();
  
  const getStatusLabel = (status: EstimationStatus): string => {
    const statusMap: Record<EstimationStatus, string> = {
      'En attente': t('estimationStatus.pending'),
      'Traité': t('estimationStatus.processed'),
      'Retourné': t('estimationStatus.returned'),
      'Fournisseur': t('estimationStatus.supplier'),
      'Livraison': t('estimationStatus.delivery'),
      'Archivé': t('estimationStatus.archived'),
      'Corbeille': t('estimationStatus.trash'),
      'Loué': t('estimationStatus.rented'),
    };
    return statusMap[status] || status;
  };
  
  return getStatusLabel;
};

interface SummaryCardProps {
  total: number;
  selectedCount: number;
  isAdmin?: boolean;
  onResync?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ total, selectedCount, isAdmin, onResync }) => {
  return (
    <div className="flex items-center gap-3 bg-[#18181B] px-4 py-3 rounded-xl shadow-sm border border-zinc-700/50 w-full md:w-auto md:min-w-[150px]">
      <div className="relative group">
        <div className="p-1.5 rounded-lg transition-colors bg-[#A7E40C] group-hover:bg-[#95d00a]">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onResync?.();
            }}
            title="Synchroniser les données"
            className="flex items-center justify-center"
          >
            <Calculator className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[7px] uppercase tracking-[0.15em] text-white font-bold leading-none mb-0.5">
          {selectedCount > 0 ? `SELECTED (${selectedCount})` : 'TOTAL'}
        </span>
        <span className="text-sm font-black text-[#A7E40C] leading-none tracking-tight truncate">
          {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </span>
      </div>
    </div>
  );
};

interface TabNavigationProps {
  activeTab: EstimationStatus;
  onTabChange: (tab: EstimationStatus) => void;
  userRole?: string;
  tabCounts?: Record<EstimationStatus, number>;
  estimationMode?: 'vente' | 'location';
}

type TabDef = { label: EstimationStatus; icon: LucideIcon; color: string; hoverColor: string; hoverBg: string; roles: string[] };

const venteTabs: TabDef[] = [
  { label: 'En attente', icon: Hourglass, color: '#f4af07', hoverColor: '#ffb86a', hoverBg: '#451a03', roles: ['admin', 'commercial'] },
  { label: 'Traité', icon: CheckCircle2, color: '#3b82f6', hoverColor: '#8ec5ff', hoverBg: '#0e1c47', roles: ['admin', 'commercial'] },
  { label: 'Retourné', icon: RotateCcw, color: '#f97316', hoverColor: '#fdba74', hoverBg: '#7c2d12', roles: ['admin', 'fournisseur', 'commercial'] },
  { label: 'Fournisseur', icon: Users, color: '#a78bfa', hoverColor: '#ddd6fe', hoverBg: '#2e1065', roles: ['admin', 'fournisseur'] },
  { label: 'Livraison', icon: Truck, color: '#22c55e', hoverColor: '#86efac', hoverBg: '#052e16', roles: ['admin', 'commercial', 'fournisseur'] },
  { label: 'Archivé', icon: Archive, color: '#9ca3af', hoverColor: '#9ca3af', hoverBg: '#111827', roles: ['admin', 'commercial'] },
  { label: 'Corbeille', icon: Trash2, color: '#ef4444', hoverColor: '#fca5a5', hoverBg: '#450a0a', roles: ['admin', 'commercial'] },
];

const locationTabs: TabDef[] = [
  { label: 'En attente', icon: Hourglass, color: '#f4af07', hoverColor: '#ffb86a', hoverBg: '#451a03', roles: ['admin', 'commercial'] },
  { label: 'Traité', icon: CheckCircle2, color: '#3b82f6', hoverColor: '#8ec5ff', hoverBg: '#0e1c47', roles: ['admin', 'commercial'] },
  { label: 'Loué', icon: Key, color: '#a855f7', hoverColor: '#d8b4fe', hoverBg: '#2e1065', roles: ['admin', 'commercial'] },
  { label: 'Archivé', icon: Archive, color: '#9ca3af', hoverColor: '#9ca3af', hoverBg: '#111827', roles: ['admin', 'commercial'] },
  { label: 'Corbeille', icon: Trash2, color: '#ef4444', hoverColor: '#fca5a5', hoverBg: '#450a0a', roles: ['admin', 'commercial'] },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, userRole = 'admin', tabCounts = {}, estimationMode = 'vente' }) => {
  const getStatusLabel = useStatusLabel();
  const allTabs = estimationMode === 'location' ? locationTabs : venteTabs;
  const tabs = allTabs.filter(t => t.roles.includes(userRole));

  return (
    <div className="hidden 2xl:flex justify-center mb-6">
      <LayoutGroup id="estimation-tabs">
        <div className="relative flex items-center gap-3 bg-theme-card p-2 rounded-2xl border border-theme-card-border shadow-sm w-fit">
          {tabs.map(({ label, icon: Icon, color }) => {
            const isActive = activeTab === label;
            const count = tabCounts[label] || 0;

            return (
              <button
                key={label}
                data-tab={label}
                onClick={() => onTabChange(label)}
                className={`
                  relative flex items-center gap-2.5 px-6 py-3 text-xs font-bold uppercase tracking-[0.05em]
                  transition-all duration-300 rounded-xl group whitespace-nowrap
                    ${isActive
                      ? 'text-white cursor-default'
                      : 'text-zinc-500 hover:text-black hover:bg-[#A7E40C] hover:shadow-md'
                    }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-xl bg-[#18181B] shadow-lg"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon
                  className="w-5 h-5 transition-colors relative z-10"
                  style={{ color }}
                />
                <span className="relative z-10">{getStatusLabel(label)}</span>
                {count > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-lg text-[10px] font-black transition-all duration-300 relative z-10
                    ${isActive
                      ? 'bg-[#A7E40C]/20 text-[#A7E40C]'
                      : 'bg-zinc-100 text-zinc-600 group-hover:bg-black/10 group-hover:text-black'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
};