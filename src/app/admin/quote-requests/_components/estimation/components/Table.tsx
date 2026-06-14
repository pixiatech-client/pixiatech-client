'use client';

import React from 'react';
import { EstimationStatus } from '../types';
import { Search, Phone, MoreVertical, Trash2, Send, RotateCcw, PlusCircle, Clock, CheckCircle2, Truck, Archive, User, Users, Pencil, AlertTriangle, Filter, DollarSign, Check, ChevronDown, X, Package, Mail, Undo2, Lock, Unlock, History, XCircle, ShieldCheck, Link, MessageSquare, ImageIcon, Paperclip, Key, Timer } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Estimation, TrackingInfo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { SummaryCard } from './Layout';
import { Calculator } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAdminT } from '@/hooks/useAdminT';

const useStatusLabel = () => {
  const { t, locale } = useI18n();
  
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



interface SearchHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  total: number;
  selectedCount: number;
  activeTab: EstimationStatus;
  onOpenMobileDrawer?: () => void;
  isFournisseur?: boolean;
  isAdmin?: boolean;
  onEmptyTrash?: () => void;
  onResync?: () => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  sortField?: 'price' | 'date' | 'time';
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: 'price' | 'date' | 'time') => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ searchTerm, onSearchChange, total, selectedCount, activeTab, onOpenMobileDrawer, isFournisseur = false, isAdmin = false, onEmptyTrash, onResync, onSelectAll, isAllSelected, sortField = 'price', sortDirection = 'asc', onSortChange }) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const { t } = useI18n();

  const filterItems = [
    { label: t('estimation.date'), field: 'date', icon: CalendarIcon, color: '#ff5c1a' },
    { label: t('estimation.time'), field: 'time', icon: Clock, color: '#22c55e' },
    ...(!isFournisseur ? [
      { label: t('estimation.price'), field: 'price', icon: DollarSign, color: '#3b82f6' },
      ...(activeTab !== 'En attente' ? [{ label: t('estimation.supplier'), field: null, icon: Users, color: '#9ca3af' }] : []),
    ] : []),
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6 w-full">
      {/* Summary card - full width on mobile, auto on desktop */}
      <div className="w-full md:w-auto shrink-0">
        <SummaryCard total={total} selectedCount={selectedCount} isAdmin={isAdmin} onResync={onResync} />
      </div>

      {/* Search + filters row */}
      <div className="flex items-center gap-3 w-full flex-1">
        <div className="relative flex-1 flex items-stretch h-11">
          {onSelectAll && (
            <div className="md:hidden flex items-center px-3 bg-theme-card border border-theme-card-border rounded-l-lg border-r-0 shadow-sm shrink-0">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-2 transition-all cursor-pointer accent-theme-sidebar-active-bg"
              />
            </div>
          )}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
<input
                type="text"
                placeholder={t('estimation.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full h-full pl-10 pr-2 bg-theme-card border border-theme-card-border text-theme-card-text text-sm focus:outline-none focus:ring-2 focus:ring-theme-sidebar-active-bg/20 focus:border-theme-sidebar-active-bg transition-all ${onSelectAll ? 'md:rounded-l-lg rounded-l-none' : 'rounded-l-lg'}`}
              />
          </div>
          <div className="relative flex shrink-0">
            {onOpenMobileDrawer && (
<button
              onClick={onOpenMobileDrawer}
              className="h-full flex 2xl:hidden items-center gap-2 px-3 bg-theme-card border-y border-r border-theme-card-border text-xs font-bold uppercase tracking-wide text-theme-card-text transition-all hover:bg-theme-hover"
            >
              {t('estimation.statusButton')}
              <div className="w-1.5 h-1.5 rounded-full bg-theme-sidebar-active-bg" />
            </button>
            )}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-full flex items-center gap-2 px-3 bg-zinc-100 border-y border-r border-zinc-200 rounded-r-lg text-xs font-bold uppercase tracking-wide hover:bg-theme-sidebar-active-bg hover:text-theme-sidebar-active-text transition-all group"
            >
              <Filter className="w-3.5 h-3.5 text-zinc-400 group-hover:text-theme-sidebar-active-text" />
              <span className="hidden sm:inline">{t('estimation.filters')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''} group-hover:text-theme-sidebar-active-text`} />
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[49] hidden md:block"
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsFilterOpen(false)}
                    className="fixed inset-0 bg-theme-sidebar-active-bg/60 z-[100] md:hidden"
                  />
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-x-0 bottom-0 pb-safe pt-2 bg-theme-card rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.15)] z-[101] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-52 md:bg-theme-card md:border md:border-theme-card-border md:rounded-xl md:shadow-lg md:z-50 md:pb-0 md:pt-0"
                  >
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-4 md:hidden" />
                    <div className="p-4 md:p-1">
<h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 ml-2 md:hidden">{t('estimation.sortBy')}</h3>
                       {filterItems.map((item) => {
                         const isActive = sortField === item.field;
                         const showIndicator = isActive && sortDirection === 'desc';
                         return (
<button
                              key={item.label}
                              onClick={() => {
                                if (item.field && onSortChange) {
                                  onSortChange(item.field as 'price' | 'date' | 'time');
                                }
                                setIsFilterOpen(false);
                              }}
                             className="w-full flex items-center gap-3 px-4 py-4 md:px-4 md:py-2.5 hover:bg-theme-hover md:hover:bg-theme-sidebar-active-bg text-sm md:text-xs font-bold uppercase tracking-wide text-theme-card-text md:hover:text-theme-sidebar-active-text transition-all text-left group rounded-xl md:rounded-none relative"
                           >
                             <item.icon className="w-5 h-5 md:w-3.5 md:h-3.5 transition-colors" style={{ color: item.color }} />
                             {item.label}
                             {showIndicator && (
                               <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-theme-sidebar-active-bg">↓</span>
                             )}
                           </button>
                         );
                       })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {activeTab === 'Corbeille' && isAdmin && onEmptyTrash && (
          <button
            onClick={onEmptyTrash}
            className="h-11 flex items-center gap-2 px-3 sm:px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-theme-sidebar-active-text border border-red-200 rounded-xl text-xs font-bold uppercase tracking-wide transition-all shrink-0 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('estimation.emptyTrash')}</span>
          </button>
        )}
      </div>
    </div>
  );
};

interface EstimationTableProps {
  estimations: Estimation[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  activeTab: EstimationStatus;
  onStatusClick: (id: string) => void;
  onBulkStatusClick: () => void;
  onSupplierClick: (id: string) => void;
  onSupplierAction: (ids: string[], action: 'approve' | 'refuse', data?: { trackingNumber?: string, reason?: string, subject?: string }) => void;
  onMarkAsDelivered: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, skipConfirm?: boolean) => void;
  onBulkDelete: (skipConfirm?: boolean) => void;
  onRestore: (id: string) => void;
  onBulkRestore: () => void;
  onToggleLock?: (id: string) => void;
  onUpdateTracking?: (id: string, info: TrackingInfo) => void;
  isFournisseur?: boolean;
  userRole?: string;
  currentUser?: any;
  suppliers?: any[];
  unreadCounts?: Record<string, number>;
  onViewMessage: (id: string) => void;
  onArchive?: (id: string) => void;
  loading?: boolean;
  exitingIds?: Set<string>;
  bulkProgress?: { total: number; remaining: number } | null;
  estimationMode?: 'vente' | 'location';
  sortField?: 'price' | 'date' | 'time';
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: 'price' | 'date' | 'time') => void;
}



function getStatusConfig(status: EstimationStatus, isReturned?: boolean) {
  if (isReturned || status === 'Retourné') return { bg: '#ffedd5', text: '#ea580c', hoverBg: '#7c2d12', hoverText: '#fdba74', icon: RotateCcw };
  if (status === 'En attente') return { bg: '#fff7ed', text: '#f4af07', hoverBg: '#451a03', hoverText: '#ffb86a', icon: Clock };
  if (status.startsWith('Trait')) return { bg: '#dbeafe', text: '#3b82f6', hoverBg: '#0e1c47', hoverText: '#8ec5ff', icon: CheckCircle2 };
  if (status === 'Loué') return { bg: '#f3e8ff', text: '#a855f7', hoverBg: '#2e1065', hoverText: '#d8b4fe', icon: Key };
  if (status === 'Fournisseur') return { bg: '#f5f3ff', text: '#a78bfa', hoverBg: '#2e1065', hoverText: '#ddd6fe', icon: Users };
  if (status === 'Livraison') return { bg: '#dcfce7', text: '#22c55e', hoverBg: '#052e16', hoverText: '#86efac', icon: Truck };
  if (status.startsWith('Archiv')) return { bg: '#e5e7eb', text: '#9ca3af', hoverBg: '#111827', hoverText: '#9ca3af', icon: Archive };
  if (status === 'Corbeille') {
    return { bg: '#fee2e2', text: '#ef4444', hoverBg: '#450a0a', hoverText: '#fca5a5', icon: Trash2 };
  }
  return { bg: '#f4f4f5', text: '#71717a', hoverBg: '#18181b', hoverText: '#d4d4d8', icon: Clock };
}

function getRemainingDays(rentalPeriod?: { from: string; to: string }): number | null {
  if (!rentalPeriod?.to) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(rentalPeriod.to);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

interface EstimationRowProps {
  est: Estimation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStatusClick: (id: string) => void;
  onViewMessage: (id: string) => void;
  onMarkAsDelivered: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleLock?: (id: string) => void;
  isFournisseur?: boolean;
  userRole?: string;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onDelete: (id: string, skipConfirm?: boolean) => void;
  onRestore: (id: string) => void;
  isExiting: boolean;
  activeTab: EstimationStatus;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  handleCall: (e: React.MouseEvent, phone: string) => void;
  setSelectedEstimation: (est: Estimation) => void;
  setIsTrackingPanelOpen: (open: boolean) => void;
  setIsRefusalPanelOpen: (open: boolean) => void;
  estimationMode?: 'vente' | 'location';
}

const EstimationRow: React.FC<EstimationRowProps> = ({
  est,
  isSelected,
  onSelect,
  onStatusClick,
  onViewMessage,
  onMarkAsDelivered,
  onEdit,
  onToggleLock,
  isFournisseur,
  userRole,
  confirmDeleteId,
  setConfirmDeleteId,
  onDelete,
  onRestore,
  isExiting,
  activeTab,
  expandedId,
  setExpandedId,
  handleCall,
  setSelectedEstimation,
  setIsTrackingPanelOpen,
  setIsRefusalPanelOpen,
  estimationMode = 'vente',
}) => {
   const { t } = useI18n();
   const { t: adt } = useAdminT();
   const getStatusLabel = useStatusLabel();
   const config = getStatusConfig(est.status, est.isReturned);
   const StatusIcon = config.icon;
   const isConfirming = confirmDeleteId === est.id;

   return (
     <AnimatePresence mode="sync">
       {!isExiting ? (
         <motion.div
          key={`row-${est.id}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 120, transition: { duration: 0.3 } }}
        >
          {/* ROW PC */}
          <motion.div
            layout
            className={`hidden md:flex relative overflow-hidden items-center px-8 py-4 rounded-2xl border transition-all duration-300 mb-3 group cursor-pointer hover:-translate-y-1 hover:shadow-2xl ${
              isSelected 
                ? (est.status === 'Corbeille' ? 'bg-red-600 border-red-600 text-white' : 'bg-theme-sidebar-active-bg border-theme-sidebar-active-bg text-theme-sidebar-active-text')
                : est.isReturned 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : est.status === 'Corbeille'
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors duration-300'
                  : est.status === 'Archivé'
                    ? 'bg-theme-app/50 border-theme-card-border text-theme-card-text/40 opacity-60 grayscale hover:opacity-100 hover:bg-theme-sidebar-active-bg hover:border-theme-sidebar-active-bg hover:text-theme-sidebar-active-text'
                    : 'bg-theme-card border-theme-card-border hover:bg-theme-sidebar-active-bg hover:border-theme-sidebar-active-bg hover:text-theme-sidebar-active-text'
            }`}
            onClick={() => onEdit(est.id)}
          >
            {/* Checkbox */}
            <div className="w-12 mr-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(est.id)}
                className={`w-5 h-5 rounded border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-theme-sidebar-active-bg border-theme-sidebar-active-bg text-theme-sidebar-active-text focus:ring-theme-sidebar-active-bg'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:ring-zinc-900'
                }`}
              />
            </div>

            {/* Attachment Column - FIXED WIDTH */}
            <div className="w-12 flex items-center justify-center">
              {est.sitePhoto ? (
                <div
                  className="shrink-0 relative group/photo cursor-pointer"
                  title={t('estimation.sitePhotoTooltip')}
                  onClick={(e) => { e.stopPropagation(); window.open(est.sitePhoto, '_blank'); }}
                >
                  <svg viewBox="0 0 504.41 363.26" className="w-5 h-5 transition-transform group-hover/photo:scale-110 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path 
                        d="M413.71,139.74l-28.34,29.31-82.34,82.35c-4.82,4.82-9.68,9.21-13.14,15.01-13.73,23.02-3.14,54.01,21.12,64.42,13.68,5.87,27.39,5.59,40.05-1.55,9.33-5.26,17.49-11.83,24.85-19.89,18.28-20.03,36.82-38.62,56.05-57.86l52.22-52.24,20.23,14.56c-7.94,12.01-15.91,22.47-25.97,32.16l-28.54,27.49c-5.84,5.63-11.29,11.18-16.95,16.94l-12.93,13.17c-18.94,19.29-40.16,44.02-65.02,54.13-19.5,7.93-41.02,7.69-59.35-3.03-38.75-22.65-53.88-77.99-24.9-110.34,14.36-16.03,28.98-30.73,44.47-45.58l26.09-25.01,43.69-44.16c7.88-7.96,15.39-15.3,24.8-21.48,17.27-11.34,40.27-10.96,57.26.94,15.71,10.99,24.71,28.69,25.31,47.68.45,14.33-5.52,26.05-14.84,36.15-8.66,9.39-17.17,17.88-26.27,27.01l-66.83,67.03c-8.4,8.42-16.77,16.12-26.85,22.29-8.57,5.25-19.67,4.14-28.48.12-8.15-3.72-14.39-10.19-18.54-17.67-7.68-13.84-4.45-28.47,5.54-39.89,12.44-14.23,24.88-27.51,38.72-40.45l30.5-28.51,19.58-19.33,19.06,19.64-44.14,43.26c-13,12.75-25.34,24.97-37.64,38.29-3.86,4.18-5.98,11.09-1.81,14.76,6.52,5.75,18.24-6.2,23.21-11.5,29.08-31.1,59.25-60.23,90.02-89.56,6.18-5.89,10.1-13.68,10.97-21.92.97-9.3-4.24-18.83-11.78-23.57-13.53-8.49-28.44-4.16-39.08,6.84Z" 
                        className={isSelected ? "fill-orange-400" : "fill-orange-500"} 
                      />
                      <g className={isSelected ? "fill-emerald-400" : "fill-emerald-500"}>
                        <path d="M43.49,42.95l-.07,236.65,188.28-.02,7.25,44.39-238.96-.03V.09s425.21-.09,425.21-.09l.12,76.51c-14.63,5.92-27.46,12.59-41.57,20.95l.14-54.52-340.41.02Z"/>
                        <path d="M170.35,243.62c-24.99.08-48.66.15-75.45-1.55l80.24-91.21,28.89,28.19,52.14-73.41,42.31,61.71-42.63,42.94c-9.43,10.77-17.97,21.17-26.35,33.14l-59.17.2Z"/>
                        <circle cx="119.61" cy="111.36" r="38.94"/>
                      </g>
                    </g>
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 opacity-0" />
              )}
            </div>

            {/* Number & Ref */}
            <div className="w-32 px-3 flex items-center gap-3">
              <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-theme-sidebar-active-text' : 'group-hover:text-theme-sidebar-active-text text-zinc-900 dark:text-zinc-100'}`}>
                {est.number}
              </span>
            </div>

            {/* Client */}
            <div className="flex-1 px-3 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-bold text-sm truncate ${isSelected ? 'text-theme-sidebar-active-text' : 'group-hover:text-theme-sidebar-active-text text-zinc-900 dark:text-zinc-100'}`}>
                  {est.client}
                </span>
                {est.emailVerified && (
                  <span title={t('estimation.emailVerified')} className="flex items-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-theme-sidebar-active-text" />
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <a 
                  href={`tel:${est.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 transition-all ${
                    isSelected 
                      ? 'bg-theme-app text-theme-card-text/60 hover:bg-theme-sidebar-active-bg hover:text-black' 
                      : 'bg-theme-app/50 text-theme-card-text/40 group-hover:bg-theme-app group-hover:text-theme-card-text/60 hover:!bg-theme-sidebar-active-bg hover:!text-black'
                  }`}
                >
                  <Phone className="w-2.5 h-2.5" />
                  {est.phone}
                </a>
              </div>
            </div>

            {/* Statut */}
            <div className="w-32 px-2 flex flex-col items-start gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onStatusClick(est.id); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : config.bg,
                  color: isSelected ? '#95d230' : config.text,
                  border: isSelected ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}
              >
                <StatusIcon className="w-3 h-3" />
                {est.isReturned ? getStatusLabel('Retourné') : getStatusLabel(est.status as EstimationStatus)}
              </button>
              {/* Rental remaining days indicator */}
              {estimationMode === 'location' && est.rentalPeriod && (est.status === 'Traité' || est.status === 'Loué') && (() => {
                const days = getRemainingDays(est.rentalPeriod);
                if (days === null) return null;
                const isExpired = days < 0;
                const isUrgent = days >= 0 && days <= 1;
                const isWarning = days >= 2 && days <= 3;
                return (
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      isExpired ? 'bg-red-100 text-red-600' :
                      isUrgent ? 'bg-orange-100 text-orange-600 animate-pulse' :
                      isWarning ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Timer className="w-2.5 h-2.5" />
                    {isExpired ? `Expired (${Math.abs(days)}d)` : days === 0 ? "Today" : `${days}d left`}
                  </span>
                );
              })()}
            </div>

            {/* Heure / Date */}
            <div className="w-28 px-3 flex flex-col justify-center">
              <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-theme-sidebar-active-text' : 'group-hover:text-theme-sidebar-active-text text-zinc-900 dark:text-zinc-100'}`}>
                {est.time || '--:--'}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-zinc-500' : 'group-hover:text-zinc-500 text-zinc-400'}`}>
                {est.date || '--/--/----'}
              </span>
              {est.trackingNumber && (
                <div className="mt-1 flex items-center gap-1.5 bg-theme-sidebar-active-bg/10 px-1.5 py-0.5 rounded w-max">
                  <Package className="w-3 h-3 text-theme-sidebar-active-text" />
                  <span className="text-[9px] font-bold text-theme-sidebar-active-text tracking-tighter">{est.trackingNumber}</span>
                </div>
              )}
            </div>

            {/* Price Column Hidden for Supplier (Except in specific tabs if needed) */}
            {!isFournisseur && (
              <div className="w-36 px-3 flex flex-col items-start justify-center">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isSelected ? 'text-zinc-600' : 'group-hover:text-zinc-600 text-zinc-300'}`}>{t('estimation.totalAmount')}</span>
                <span className={`font-black text-lg tracking-tighter whitespace-nowrap ${isSelected ? 'text-theme-sidebar-active-text' : 'group-hover:text-theme-sidebar-active-text text-zinc-900 dark:text-zinc-100'}`}>
                  {Math.max(est.totalClient, 0.01).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            )}

            {/* Email Verification Icon */}
            {!isFournisseur && (
              <div className="hidden 2xl:flex w-28 px-4 items-center justify-center">
                {(est.status === 'En attente' || est.status === 'Traité') && (
                  <span title={est.emailVerified ? adt('Email verified') : adt('Email not confirmed')} className="flex items-center">
                    <Mail 
                      className={`w-5 h-5 transition-all ${
                        est.emailVerified ? 'text-emerald-500' : 'text-red-500'
                      }`} 
                    />
                  </span>
                )}
              </div>
            )}

            {/* Action Column - State Machine Logic */}
            <div className="w-32 px-3 flex items-center justify-end gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
              {isFournisseur ? (
                <>
                  {est.status === 'Fournisseur' && (
                    <>
                      <button 
                        onClick={() => onViewMessage(est.id)}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-amber-500'}`}
                        title={t('estimation.viewReason')}
                      >
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
{est.supplierNotes && !est.supplierNotesRead && (
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
  )}
                         </div>
                      </button>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`}
                        title={t('estimation.addTracking')}
                      >
                         <Package className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onStatusClick(est.id)}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`}
                        title={t('estimation.sendDelivery')}
                      >
                         <Truck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-theme-sidebar-active-text/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`}
                        title={t('estimation.returnToCommercial')}
                      >
                         <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Livraison' && (
                    <>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`}
                        title={t('estimation.viewTracking')}
                      >
                         <Package className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onMarkAsDelivered(est.id)}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`}
                        title={t('estimation.markAsDelivered')}
                      >
                         <ShieldCheck className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-0.5">
                  {est.status === 'En attente' && (
                    <>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-theme-sidebar-active-text'}`} title={t('estimation.edit')}>
                         <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title={t('estimation.process')}>
                         <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Traité' && (
                    <>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-theme-sidebar-active-text'}`} title={t('estimation.edit')}>
                         <Pencil className="w-4 h-4" />
                      </button>
                      {estimationMode === 'location' ? (
                        <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-purple-500'}`} title={t('estimation.process')}>
                           <Key className="w-4 h-4" />
                        </button>
                      ) : (
                        <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title={t('estimation.transferToSupplier')}>
                           <Send className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  {est.status === 'Fournisseur' && (
                    <>
                      <button onClick={() => onViewMessage(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-amber-500'}`} title={t('estimation.viewReason')}>
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
{est.supplierNotes && !est.supplierNotesRead && (
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
  )}
                         </div>
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title={t('estimation.addTracking')}>
                         <Package className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title={t('estimation.sendDelivery')}>
                         <Truck className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-theme-sidebar-active-text/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`} title={t('estimation.returnToCommercial')}>
                         <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Retourné' && (
                    <>
                      <button onClick={() => onViewMessage(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-theme-sidebar-active-text'}`} title={t('estimation.viewReason')}>
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
{est.supplierNotes && !est.supplierNotesRead && (
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
  )}
                         </div>
                      </button>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-theme-sidebar-active-text'}`} title={t('estimation.edit')}>
                         <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title={t('estimation.transfer')}>
                         <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Livraison' && (
                    <>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-theme-sidebar-active-text'}`} title={t('estimation.consulter')}>
                         <PlusCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title={t('estimation.viewTracking')}>
                         <Package className="w-4 h-4" />
                      </button>
<button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title={t('estimation.archive')}>
                          <Archive className="w-4 h-4" />
                        </button>
                    </>
                  )}
                  {est.status === 'Corbeille' && (
                    <button onClick={() => onRestore(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title={t('estimation.restore')}>
                       <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                  {est.status === 'Archivé' && (
                    <>
                      {onToggleLock && (
                        <button
                          onClick={() => onToggleLock(est.id)}
                          className={`p-2 rounded-xl transition-all ${
                            est.isLocked
                              ? (isSelected ? 'hover:bg-white/10 text-amber-400 hover:text-amber-300' : 'hover:bg-amber-50 text-amber-500 group-hover:hover:bg-amber-500/20 group-hover:hover:text-amber-400')
                              : (isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-zinc-300')
                          }`}
                          title={est.isLocked ? adt('Unarchive (unlock)') : adt('Archive (lock)')}
                        >
                          {est.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => onRestore(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-theme-sidebar-active-text/60 hover:text-theme-sidebar-active-text' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title={t('estimation.restoreToPending')}>
                         <Undo2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status !== 'Archivé' && (est.status !== 'Livraison' || userRole === 'admin') && (
                    <button onClick={() => setConfirmDeleteId(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-theme-sidebar-active-text/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`} title={est.status === 'Corbeille' ? t('estimation.deletePermanently') : t('estimation.moveToTrash')}>
                       <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* DELETE CONFIRMATION OVERLAY (DESKTOP) */}
            <AnimatePresence>
              {isConfirming && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-between px-6 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-theme-sidebar-active-text" />
                    </div>
                    <div>
                      <h4 className="text-theme-sidebar-active-text font-bold text-sm">{activeTab === 'Corbeille' ? t('estimation.deletePermanently') : t('estimation.moveToTrash')}</h4>
                      <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">{activeTab === 'Corbeille' ? t('estimation.irreversibleAction') : t('estimation.reversibleAction')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="px-4 py-2 text-xs font-bold text-theme-sidebar-active-text hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {t('estimation.cancel')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(est.id, true);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> {t('estimation.confirmDelete')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ROW MOBILE */}
          <motion.div
            layout
            className={`md:hidden group relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden mb-3 shadow-sm ${
              est.isReturned ? 'bg-red-50 border-red-200' : est.status === 'Corbeille' ? 'bg-red-50 border-red-200' : activeTab === 'Archivé' && est.isLocked ? 'bg-theme-app/50 border-theme-card-border opacity-60 grayscale' : 'bg-theme-card border-theme-card-border hover:border-theme-sidebar-active-bg'
            } ${
              isSelected ? (est.status === 'Corbeille' ? 'border-red-600 ring-2 ring-red-600 ring-offset-1' : 'border-theme-sidebar-active-bg ring-2 ring-theme-sidebar-active-bg ring-offset-1') : ''
            }`}
          >
            <div 
              className="flex flex-col p-5 cursor-pointer hover:bg-theme-hover transition-colors w-full"
              onClick={() => setExpandedId(expandedId === est.id ? null : est.id)}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative z-10 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelect(est.id)}
                      className={`w-5 h-5 rounded border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-theme-sidebar-active-bg border-theme-sidebar-active-bg text-theme-sidebar-active-text focus:ring-theme-sidebar-active-bg'
                          : 'bg-theme-app border-theme-card-border text-theme-card-text focus:ring-theme-sidebar-active-bg'
                      }`}
                    />
                  </div>

                  {est.sitePhoto && (
                    <div
                      className="shrink-0 relative mr-1"
                      onClick={(e) => { e.stopPropagation(); window.open(est.sitePhoto, '_blank'); }}
                    >
                      <svg viewBox="0 0 504.41 363.26" className="w-5 h-5 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path d="M413.71,139.74l-28.34,29.31-82.34,82.35c-4.82,4.82-9.68,9.21-13.14,15.01-13.73,23.02-3.14,54.01,21.12,64.42,13.68,5.87,27.39,5.59,40.05-1.55,9.33-5.26,17.49-11.83,24.85-19.89,18.28-20.03,36.82-38.62,56.05-57.86l52.22-52.24,20.23,14.56c-7.94,12.01-15.91,22.47-25.97,32.16l-28.54,27.49c-5.84,5.63-11.29,11.18-16.95,16.94l-12.93,13.17c-18.94,19.29-40.16,44.02-65.02,54.13-19.5,7.93-41.02,7.69-59.35-3.03-38.75-22.65-53.88-77.99-24.9-110.34,14.36-16.03,28.98-30.73,44.47-45.58l26.09-25.01,43.69-44.16c7.88-7.96,15.39-15.3,24.8-21.48,17.27-11.34,40.27-10.96,57.26.94,15.71,10.99,24.71,28.69,25.31,47.68.45,14.33-5.52,26.05-14.84,36.15-8.66,9.39-17.17,17.88-26.27,27.01l-66.83,67.03c-8.4,8.42-16.77,16.12-26.85,22.29-8.57,5.25-19.67,4.14-28.48.12-8.15-3.72-14.39-10.19-18.54-17.67-7.68-13.84-4.45-28.47,5.54-39.89,12.44-14.23,24.88-27.51,38.72-40.45l30.5-28.51,19.58-19.33,19.06,19.64-44.14,43.26c-13,12.75-25.34,24.97-37.64,38.29-3.86,4.18-5.98,11.09-1.81,14.76,6.52,5.75,18.24-6.2,23.21-11.5,29.08-31.1,59.25-60.23,90.02-89.56,6.18-5.89,10.1-13.68,10.97-21.92.97-9.3-4.24-18.83-11.78-23.57-13.53-8.49-28.44-4.16-39.08,6.84Z" className={isSelected ? "fill-orange-400" : "fill-orange-500"} />
                          <g className={isSelected ? "fill-emerald-400" : "fill-emerald-500"}>
                            <path d="M43.49,42.95l-.07,236.65,188.28-.02,7.25,44.39-238.96-.03V.09s425.21-.09,425.21-.09l.12,76.51c-14.63,5.92-27.46,12.59-41.57,20.95l.14-54.52-340.41.02Z"/>
                            <path d="M170.35,243.62c-24.99.08-48.66.15-75.45-1.55l80.24-91.21,28.89,28.19,52.14-73.41,42.31,61.71-42.63,42.94c-9.43,10.77-17.97,21.17-26.35,33.14l-59.17.2Z"/>
                            <circle cx="119.61" cy="111.36" r="38.94"/>
                          </g>
                        </g>
                      </svg>
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-zinc-900 dark:text-zinc-100 text-base tracking-tighter truncate">{est.client}</span>
                      <Mail className={`w-3.5 h-3.5 shrink-0 ${est.emailVerified ? 'text-emerald-500' : 'text-red-500'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{est.number}</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusClick(est.id); }}
                  className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent transition-all shadow-sm"
                  style={{
                    backgroundColor: config.bg,
                    color: config.text,
                  }}
                >
                  <StatusIcon className="w-3 h-3" />
                  {est.isReturned ? getStatusLabel('Retourné') : getStatusLabel(est.status as EstimationStatus)}
                </button>
              </div>

              <div className="h-px bg-zinc-100/80 w-full my-4" />

              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex flex-col">
                   <span className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-0.5">{t('estimation.totalAmount')}</span>
                   <span className="font-black text-zinc-900 dark:text-zinc-100 text-lg tracking-tighter">
                     {est.totalClient.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                   </span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-zinc-50/50 rounded-xl p-1" onClick={(e) => e.stopPropagation()}>
                    {isFournisseur ? (
                      <>
                        {est.status === 'Fournisseur' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title={t('estimation.viewReason')}>
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.addTracking')}>
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.sendDelivery')}>
                              <Truck className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title={t('estimation.returnToCommercial')}>
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Livraison' && (
                          <>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.viewTracking')}>
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onMarkAsDelivered(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.markAsDelivered')}>
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        {est.status === 'En attente' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-theme-sidebar-active-text rounded-lg transition-colors" title={t('estimation.edit')}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.process')}>
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Traité' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-theme-sidebar-active-text rounded-lg transition-colors" title={t('estimation.edit')}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.transferToSupplier')}>
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Fournisseur' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title={t('estimation.viewReason')}>
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.addTracking')}>
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.sendDelivery')}>
                              <Truck className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title={t('estimation.returnToCommercial')}>
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Retourné' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title={t('estimation.viewReason')}>
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-theme-sidebar-active-text animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-theme-sidebar-active-text rounded-lg transition-colors" title={t('estimation.edit')}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.transfer')}>
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Livraison' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-theme-sidebar-active-text rounded-lg transition-colors" title={t('estimation.consulter')}>
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title={t('estimation.viewTracking')}>
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.archive')}>
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Corbeille' && (
                          <button onClick={() => onRestore(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.restore')}>
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                        {est.status === 'Archivé' && (
                          <>
                            {onToggleLock && (
                              <button
                                onClick={() => onToggleLock(est.id)}
                                className={`p-2 rounded-lg transition-colors ${est.isLocked ? 'text-amber-500 hover:bg-amber-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
title={est.isLocked ? t('estimation.unlock') : t('estimation.lock')}
                              >
                                {est.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            )}
                            <button onClick={() => onRestore(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title={t('estimation.restoreToPending')}>
                              <Undo2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
{est.status !== 'Archivé' && (est.status !== 'Livraison' || userRole === 'admin') && (
                           <button onClick={() => setConfirmDeleteId(est.id)} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title={est.status === 'Corbeille' ? t('estimation.deletePermanently') : t('estimation.moveToTrash')}>
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${expandedId === est.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === est.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-zinc-100 bg-zinc-50/50"
                >
                  <div className="p-4 grid grid-cols-1 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-zinc-100">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><PlusCircle className="w-3 h-3" /> {t('estimation.numberHeader')}</span>
                      <div className="text-sm font-medium text-zinc-900">{est.number}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-100">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {t('estimation.timeDateHeader')}</span>
                      <div className="text-sm font-medium text-zinc-900">{est.date} - {est.time}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-100">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {t('estimation.clientHeader')}</span>
                      <button
                        onClick={(e) => handleCall(e, est.phone)}
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        {est.phone}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DELETE CONFIRMATION OVERLAY (MOBILE) */}
            <AnimatePresence>
              {isConfirming && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 bg-red-600 rounded-2xl flex flex-col justify-center px-5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-theme-sidebar-active-text" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-theme-sidebar-active-text font-bold text-sm truncate">{activeTab === 'Corbeille' ? t('estimation.deletePermanently') : t('estimation.moveToTrash')}</h4>
                      <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">{activeTab === 'Corbeille' ? t('estimation.irreversibleAction') : t('estimation.reversibleAction')}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="px-4 py-2.5 text-xs font-bold text-theme-sidebar-active-text hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {t('estimation.cancel')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(est.id, true);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2.5 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> {t('estimation.confirmDelete')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export const EstimationTable: React.FC<EstimationTableProps> = ({
   estimations,
   selectedIds,
   onSelect,
   onSelectAll,
   activeTab,
   onStatusClick,
   onBulkStatusClick,
   onSupplierClick,
   onSupplierAction,
   onMarkAsDelivered,
   onEdit,
   onDelete,
   onBulkDelete,
   onRestore,
   onBulkRestore,
   onToggleLock,
   onUpdateTracking,
   isFournisseur = false,
   userRole = '',
   currentUser,
   suppliers = [],
   unreadCounts = {},
   onViewMessage,
   onArchive,
   loading = false,
   exitingIds = new Set(),
   bulkProgress = null,
   estimationMode = 'vente',
   sortField = 'price',
   sortDirection = 'asc',
   onSortChange,
  }) => {

   const { t } = useI18n();
   const RowSkeleton = () => (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 md:p-0 md:h-20 animate-pulse flex flex-col md:flex-row items-center gap-4">
      <div className="hidden md:flex w-12 mr-4 items-center justify-center">
        <div className="w-4 h-4 bg-zinc-100 rounded" />
      </div>
      <div className="w-full md:w-64 px-4 flex flex-col gap-2">
        <div className="h-4 bg-zinc-100 rounded w-2/3" />
        <div className="h-3 bg-zinc-50 rounded w-1/3" />
      </div>
      <div className="hidden md:block flex-1 px-4">
        <div className="h-4 bg-zinc-100 rounded w-1/2" />
      </div>
      <div className="hidden md:block w-40 px-4">
        <div className="h-6 bg-zinc-100 rounded-xl w-24" />
      </div>
      <div className="hidden md:block w-40 px-4">
        <div className="h-4 bg-zinc-100 rounded w-3/4" />
      </div>
      <div className="hidden md:block w-40 px-4">
        <div className="h-8 bg-zinc-100 rounded-xl w-32 ml-auto" />
      </div>
    </div>
  );

  const { userProfile } = useUser();
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [isBulkConfirming, setIsBulkConfirming] = React.useState(false);

  const [isTrackingPanelOpen, setIsTrackingPanelOpen] = React.useState(false);
  const [isRefusalPanelOpen, setIsRefusalPanelOpen] = React.useState(false);
  const [selectedEstimation, setSelectedEstimation] = React.useState<Estimation | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [refusalForm, setRefusalForm] = React.useState({ subject: '', message: '' });
  
  const savedTemplates = (userProfile as any)?.settings?.savedRefusalTemplates || [];
  const [trackingForm, setTrackingForm] = React.useState<TrackingInfo>({
    number: '',
    deliveryDate: '',
    receiptDate: ''
  });

  const handleCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

const isAllSelected = estimations.length > 0 && selectedIds.size === estimations.length;

  const sortedEstimations = React.useMemo(() => {
      return [...estimations].sort((a, b) => {
        if (sortField === 'price') {
          const valA = a.totalClient || 0;
          const valB = b.totalClient || 0;
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        if (sortField === 'date') {
          const dateA = a.date || '';
          const dateB = b.date || '';
          return sortDirection === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        }
        if (sortField === 'time') {
          const timeA = a.time || '';
          const timeB = b.time || '';
          return sortDirection === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
        }
        return 0;
      });
    }, [estimations, sortField, sortDirection]);

   const handlePriceHeaderClick = () => {
     if (onSortChange) {
       onSortChange('price');
     }
   };

return (
     <div className="flex flex-col gap-3">
       {/* HEADER PC */}
       <div className="hidden md:flex items-center px-8 py-4 bg-theme-sidebar-active-bg rounded-2xl border border-zinc-800 text-[10px] font-black text-theme-sidebar-active-text uppercase tracking-[0.15em] mb-4">
         <div className="w-12 mr-2 flex items-center justify-center">
           <input
             type="checkbox"
             checked={isAllSelected}
             onChange={onSelectAll}
             className="rounded-sm border-white bg-white text-black focus:ring-0 cursor-pointer w-4 h-4"
           />
         </div>
         <div className="w-8 flex items-center justify-center">
           <Paperclip className="w-4 h-4 text-theme-sidebar-active-text" />
         </div>
         <div className="w-32 px-3 flex items-center gap-2.5">
           <PlusCircle className="w-4 h-4 text-theme-sidebar-active-text" />
           {t('estimation.numberHeader')}
         </div>
         <div className="flex-1 px-3 flex items-center gap-2.5">
           <User className="w-4 h-4 text-theme-sidebar-active-text" />
           {t('estimation.clientHeader')}
         </div>
         <div className="w-32 px-2 flex items-center gap-2.5">
           <Clock className="w-4 h-4 text-theme-sidebar-active-text" />
           {t('estimation.statusHeader')}
         </div>
         <div className="w-28 px-3 flex items-center gap-2.5">
           <RotateCcw className="w-4 h-4 text-theme-sidebar-active-text" />
           {t('estimation.timeDateHeader')}
         </div>
{!isFournisseur && (
            <button
              onClick={handlePriceHeaderClick}
              className="w-36 px-3 flex items-center justify-start gap-2 font-black tracking-widest hover:text-theme-sidebar-active-text transition-colors group"
            >
              <DollarSign className="w-4 h-4 text-theme-sidebar-active-text shrink-0" />
              <span>{t('estimation.priceHeader')}</span>
              <span className={`text-[8px] transition-opacity ${sortField === 'price' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          )}
         {!isFournisseur && (
           <div className="hidden 2xl:flex w-28 px-4 items-center justify-center gap-2 font-black tracking-widest">
             <Mail className="w-4 h-4 text-theme-sidebar-active-text shrink-0" />
             <span>{t('estimation.emailHeader')}</span>
           </div>
         )}
         <div className="w-32 px-3 mr-2 flex items-center justify-end gap-2 font-black tracking-widest">
           <MoreVertical className="w-4 h-4 text-theme-sidebar-active-text shrink-0" />
           <span>{t('estimation.actionHeader')}</span>
         </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col gap-2"
        >
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 md:bottom-8 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-theme-sidebar-active-bg text-theme-sidebar-active-text px-4 md:px-6 py-4 md:py-3 md:rounded-2xl shadow-2xl z-50 flex flex-wrap items-center justify-between gap-3 md:gap-6 border-t md:border border-white/10 backdrop-blur-xl md:w-max"
              >
                <div className="flex items-center gap-3 border-r border-white/10 pr-3 md:pr-6 shrink-0">
                  {bulkProgress ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 shrink-0">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="12" fill="none" stroke="#ffffff20" strokeWidth="3" />
                          <circle
                            cx="16" cy="16" r="12" fill="none" stroke="#95d230" strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 12}`}
                            strokeDashoffset={`${2 * Math.PI * 12 * (bulkProgress.remaining / bulkProgress.total)}`}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-theme-sidebar-active-text">
                          {bulkProgress.remaining}
                        </span>
                      </div>
                      <div className="flex flex-col shrink-0">
<span className="text-[8px] font-bold uppercase tracking-wider text-theme-sidebar-active-text/40">{t('estimation.inProgress')}</span>
                         <span className="text-xs font-bold uppercase tracking-wide">{bulkProgress.total - bulkProgress.remaining}/{bulkProgress.total}</span>
                       </div>
                     </div>
                   ) : (
                     <>
                       <div className="w-8 h-8 bg-theme-sidebar-active-bg rounded-lg flex shrink-0 items-center justify-center text-black font-black text-sm">
                         {selectedIds.size}
                       </div>
                       <div className="flex flex-col shrink-0">
                         <span className="text-[8px] font-bold uppercase tracking-wider text-theme-sidebar-active-text/40">{t('admin.estimations')}</span>
                         <span className="text-xs font-bold uppercase tracking-wide">{t('estimation.selectedEstimates')}</span>
                       </div>
                     </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
                  {activeTab === 'Corbeille' && (
                    <button
                      onClick={onBulkRestore}
                      className="flex items-center gap-1.5 px-4 py-2 bg-theme-sidebar-active-bg hover:bg-[#a6e636] text-black rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
<Undo2 className="w-3.5 h-3.5" />
                       {t('estimation.restoreAll')}
                    </button>
                  )}
                  {activeTab === 'En attente' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#f4af07] hover:bg-[#ffb86a] text-black rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
{t('estimation.process')}
                    </button>
                  )}
                  {activeTab === 'Traité' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-theme-sidebar-active-bg hover:bg-[#1447e6] text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all group border border-white/10 shrink-0"
                    >
                      {estimationMode === 'location' ? (
                        <>
<Key className="w-3.5 h-3.5 text-purple-500 group-hover:text-theme-sidebar-active-text transition-colors" />
                           {t('estimation.rent')}
                        </>
                      ) : (
                        <>
<Send className="w-3.5 h-3.5 text-[#1447e6] group-hover:text-theme-sidebar-active-text transition-colors" />
                           {t('estimation.transfer')}
                        </>
                      )}
                    </button>
                  )}
                  {activeTab === 'Fournisseur' && (
                    <button
                      onClick={() => {
                        setRefusalForm({ subject: '', message: '' });
                        setIsRefusalPanelOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      {t('estimation.refuse')}
                    </button>
                  )}
                  {activeTab === 'Livraison' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {t('estimation.archive')}
                    </button>
                  )}
                  {activeTab === 'Archivé' && (
                    <button
                      onClick={onBulkRestore}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Undo2 className="w-3.5 w-3.5" />
                      {t('estimation.unarchive')}
                    </button>
                  )}
                  {!isFournisseur && (
                    <button
                      onClick={() => setIsBulkConfirming(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-red-600 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all group shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-theme-sidebar-active-text transition-colors" />
                      <span>{t('estimation.delete')}</span>
                    </button>
                  )}
                </div>

                {/* BULK DELETE CONFIRMATION OVERLAY */}
                <AnimatePresence>
                  {isBulkConfirming && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="absolute inset-0 bg-red-600 rounded-2xl flex items-center justify-between px-6 z-[60]"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-theme-sidebar-active-text" />
                        <div>
<h4 className="text-theme-sidebar-active-text font-bold text-xs uppercase tracking-tight">{t('estimation.deleteEstimates', { count: selectedIds.size })}</h4>
                           <p className="text-red-100 text-[8px] uppercase font-bold tracking-widest">{activeTab === 'Corbeille' ? t('estimation.irreversibleAction') : t('estimation.reversibleAction')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsBulkConfirming(false)}
className="px-4 py-2 text-[10px] font-bold text-theme-sidebar-active-text hover:bg-white/10 rounded-xl transition-colors uppercase"
                         >
                           {t('estimation.cancel')}
                         </button>
                         <button
                           onClick={() => {
                             onBulkDelete(true);
                             setIsBulkConfirming(false);
                           }}
                           className="px-4 py-2 text-[10px] font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2 uppercase"
                         >
                           <Trash2 className="w-3.5 h-3.5" /> {t('estimation.confirmDelete')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

{loading ? (
             <div className="flex flex-col gap-3">
               {[1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)}
             </div>
           ) : estimations.length === 0 ? (
 <div className="bg-white p-8 rounded-xl border border-zinc-200 text-center text-zinc-500 text-sm italic">
               {t('estimation.noEstimationFound')}
             </div>
           ) : (
             <AnimatePresence mode="popLayout">
               {sortedEstimations.map((est) => (
                <EstimationRow
                  key={est.id}
                  est={est}
                  isSelected={selectedIds.has(est.id)}
                  onSelect={onSelect}
                  onStatusClick={onStatusClick}
                  onViewMessage={onViewMessage}
                  onMarkAsDelivered={onMarkAsDelivered}
                  onEdit={onEdit}
                  onToggleLock={onToggleLock}
                  isFournisseur={isFournisseur}
                  userRole={userRole}
                  confirmDeleteId={confirmDeleteId}
                  setConfirmDeleteId={setConfirmDeleteId}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  isExiting={exitingIds.has(est.id)}
                  activeTab={activeTab}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  handleCall={handleCall}
                  setSelectedEstimation={setSelectedEstimation}
                  setIsTrackingPanelOpen={setIsTrackingPanelOpen}
                  setIsRefusalPanelOpen={setIsRefusalPanelOpen}
                  estimationMode={estimationMode}
                />
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>




       {/* Tracking Panel */}
      <AnimatePresence>
        {isTrackingPanelOpen && selectedEstimation && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackingPanelOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[400px] bg-white h-full shadow-xl flex flex-col border-l border-gray-200"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 tracking-tight uppercase">{t('estimation.trackingTitle')}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{selectedEstimation.number}</p>
                  </div>
                </div>
                <button onClick={() => setIsTrackingPanelOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-5 bg-white">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide ml-1">{t('estimation.trackingNumber')}</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input
                      type="text"
                      value={trackingForm.number}
                      onChange={(e) => setTrackingForm({ ...trackingForm, number: e.target.value })}
                      placeholder={t('estimation.trackingPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide ml-1">{t('estimation.deliveryDate')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-sky-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm">
                          <CalendarIcon className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className={trackingForm.deliveryDate ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                            {trackingForm.deliveryDate ? format(new Date(trackingForm.deliveryDate), 'dd MMM yyyy') : t('estimation.selectDate')}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="z-[200] w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={trackingForm.deliveryDate ? new Date(trackingForm.deliveryDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const formatted = format(date, 'yyyy-MM-dd');
                              setTrackingForm({ ...trackingForm, deliveryDate: formatted });
                              if (trackingForm.receiptDate && date > new Date(trackingForm.receiptDate)) {
                                setTrackingForm(prev => ({ ...prev, receiptDate: '' }));
                              }
                            }
                          }}
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide ml-1">{t('estimation.receiptDateLabel')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          disabled={!trackingForm.deliveryDate}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-sky-300 rounded-lg hover:border-sky-500 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm ${!trackingForm.deliveryDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <History className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className={trackingForm.receiptDate ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                            {trackingForm.receiptDate ? format(new Date(trackingForm.receiptDate), 'dd MMM yyyy') : t('estimation.selectDate')}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="z-[200] w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={trackingForm.receiptDate ? new Date(trackingForm.receiptDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setTrackingForm({ ...trackingForm, receiptDate: format(date, 'yyyy-MM-dd') });
                            }
                          }}
                          disabled={{ before: new Date(trackingForm.deliveryDate) }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button onClick={() => setIsTrackingPanelOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-[11px] font-semibold uppercase tracking-wide hover:bg-gray-100 transition-colors cursor-pointer">
                  {t('estimation.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (onUpdateTracking && selectedEstimation) {
                      onUpdateTracking(selectedEstimation.id, trackingForm);
                      setIsTrackingPanelOpen(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-[11px] font-semibold uppercase tracking-wide hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {t('estimation.save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Refusal Panel */}
      <AnimatePresence>
        {isRefusalPanelOpen && (selectedEstimation || selectedIds.size > 0) && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRefusalPanelOpen(false)}
              className="absolute inset-0 bg-theme-sidebar-active-bg/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[400px] bg-theme-sidebar-active-bg h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-theme-sidebar-active-text" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-theme-sidebar-active-text tracking-tight uppercase">{t('estimation.refuse')}</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      {selectedEstimation ? selectedEstimation.number : `${selectedIds.size} ${t('admin.estimations')}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsRefusalPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-6 bg-theme-sidebar-active-bg overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">{t('estimation.refusalReason')}</label>
                    {refusalForm.message && !savedTemplates.includes(refusalForm.message) && (
<button 
                          onClick={async () => {
                            if (!currentUser?.uid) return;
                            try {
                              await updateDoc(doc(db, 'users', currentUser.uid), {
                                'settings.savedRefusalTemplates': arrayUnion(refusalForm.message)
                              });
                            } catch (err) {
                              console.error('Failed to save template:', err);
                            }
                          }}
                          className="text-[9px] text-[#3b82f6] hover:underline flex items-center gap-1 font-bold"
                        >
                          <PlusCircle size={10} />
                          {t('estimation.saveTemplate')}
                        </button>
                    )}

                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'priceTooHigh', value: 'Price too high' },
                      { key: 'outOfStock', value: 'Product unavailable' },
                      { key: 'longLeadTimes', value: 'Lead times too long' },
                      { key: 'otherReason', value: 'Other reason' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setRefusalForm({ ...refusalForm, subject: item.value })}
                        className={`p-3 rounded-lg border text-left transition-all font-bold uppercase tracking-wide text-[10px] ${
                          refusalForm.subject === item.value
                            ? 'bg-red-500 border-red-500 text-theme-sidebar-active-text'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {t(`estimation.${item.key}`)}
                      </button>
                    ))}
                  </div>
                </div>

{savedTemplates.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">{t('estimation.savedTemplates')}</label>
                      <div className="flex flex-wrap gap-2">
                        {savedTemplates.map((template: string, idx: number) => (
                          <div key={idx} className="group/tpl relative">
                            <button
                              onClick={() => setRefusalForm({ subject: t('estimation.otherReason'), message: template })}
                            className={`px-3 py-1.5 text-[9px] bg-zinc-900 border rounded-lg transition-all font-bold uppercase tracking-wide pr-8 ${
                              refusalForm.message === template 
                                ? 'border-[#3b82f6] text-[#3b82f6] bg-blue-500/5' 
                                : 'border-white/10 text-zinc-500 hover:border-white/20'
                            }`}
                          >
                            {template.substring(0, 25)}{template.length > 25 ? '...' : ''}
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!currentUser?.uid) return;
                              try {
                                await updateDoc(doc(db, 'users', currentUser.uid), {
                                  'settings.savedRefusalTemplates': arrayRemove(template)
                                });
                              } catch (err) {
                                console.error('Failed to delete template:', err);
                              }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-red-500/50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">{t('estimation.clientMessage')}</label>
                  <textarea
                    value={refusalForm.message}
                    onChange={(e) => setRefusalForm({ ...refusalForm, message: e.target.value })}
                    placeholder={t('estimation.refusalPlaceholder')}
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none h-28 text-xs font-medium text-theme-sidebar-active-text"
                  />
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-white/10 flex gap-3">
                <button onClick={() => setIsRefusalPanelOpen(false)} className="flex-1 py-2.5 bg-theme-sidebar-active-bg border border-white/10 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-white/5 transition-all">
                  {t('estimation.cancel')}
                </button>
                <button
                  onClick={() => {
                    if (onSupplierAction) {
                      const ids = selectedEstimation ? [selectedEstimation.id] : Array.from(selectedIds);
                      onSupplierAction(ids, 'refuse', {
                        reason: refusalForm.message,
                        subject: refusalForm.subject
                      });
                      setIsRefusalPanelOpen(false);
                    }
                  }}
                  disabled={!refusalForm.subject || (refusalForm.subject === 'Autre raison' && !refusalForm.message)}
                  className="flex-1 py-2.5 bg-red-600 text-theme-sidebar-active-text rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t('estimation.confirmRefusal')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
