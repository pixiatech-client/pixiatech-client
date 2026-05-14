'use client';

import React from 'react';
import { Search, Phone, MoreVertical, Trash2, Send, RotateCcw, PlusCircle, Clock, CheckCircle2, Truck, Archive, User, Users, Pencil, AlertTriangle, Filter, Calendar, DollarSign, Check, ChevronDown, X, Package, Mail, Undo2, Lock, Unlock, History, XCircle, ShieldCheck, Link, MessageSquare, ImageIcon, Paperclip } from 'lucide-react';
import { Estimation, EstimationStatus, TrackingInfo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { translateStatus } from '@/lib/utils';
import { SummaryCard } from './Layout';
import { Calculator } from 'lucide-react';



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
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ searchTerm, onSearchChange, total, selectedCount, activeTab, onOpenMobileDrawer, isFournisseur = false, isAdmin = false, onEmptyTrash, onResync, onSelectAll, isAllSelected }) => {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const filterItems = [
    { label: 'Date', icon: Calendar, color: '#ff5c1a' },
    { label: 'Heure', icon: Clock, color: '#22c55e' },
    ...(!isFournisseur ? [
      { label: 'Prix', icon: DollarSign, color: '#3b82f6' },
      ...(activeTab !== 'En attente' ? [{ label: 'Fournisseur', icon: Users, color: '#9ca3af' }] : []),
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
        <div className="relative flex-1 flex items-stretch h-11 overflow-hidden">
          {onSelectAll && (
            <div className="md:hidden flex items-center px-3 bg-white border border-zinc-200 rounded-l-lg border-r-0 shadow-sm shrink-0">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="w-4 h-4 rounded border-2 transition-all cursor-pointer accent-black"
              />
            </div>
          )}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full h-full pl-10 pr-2 bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 transition-all ${onSelectAll ? 'md:rounded-l-lg rounded-l-none' : 'rounded-l-lg'}`}
            />
          </div>
          <div className="relative flex shrink-0">
            {onOpenMobileDrawer && (
              <button
                onClick={onOpenMobileDrawer}
                className="h-full flex 2xl:hidden items-center gap-2 px-3 bg-white border-y border-r border-zinc-200 text-xs font-bold uppercase tracking-wide text-zinc-600 transition-all hover:bg-zinc-50"
              >
                Statuts
                <div className="w-1.5 h-1.5 rounded-full bg-[#95d230]" />
              </button>
            )}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-full flex items-center gap-2 px-3 bg-zinc-100 border-y border-r border-zinc-200 rounded-r-lg text-xs font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-all group"
            >
              <Filter className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#95d230]" />
              <span className="hidden sm:inline">Filtres</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? 'rotate-180' : ''} group-hover:text-[#95d230]`} />
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
                    className="fixed inset-0 bg-black/60 z-[100] md:hidden"
                  />
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed inset-x-0 bottom-0 pb-safe pt-2 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.15)] z-[101] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-52 md:bg-white md:border md:border-zinc-200 md:rounded-xl md:shadow-lg md:z-50 md:pb-0 md:pt-0"
                  >
                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-4 md:hidden" />
                    <div className="p-4 md:p-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 ml-2 md:hidden">Trier par</h3>
                      {filterItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setIsFilterOpen(false)}
                          className="w-full flex items-center gap-3 px-4 py-4 md:px-4 md:py-2.5 hover:bg-zinc-100 md:hover:bg-black text-sm md:text-xs font-bold uppercase tracking-wide text-zinc-600 md:hover:text-white transition-all text-left group rounded-xl md:rounded-none"
                        >
                          <item.icon className="w-5 h-5 md:w-3.5 md:h-3.5 transition-colors" style={{ color: item.color }} />
                          {item.label}
                        </button>
                      ))}
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
            className="h-11 flex items-center gap-2 px-3 sm:px-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-xl text-xs font-bold uppercase tracking-wide transition-all shrink-0 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Vider la corbeille</span>
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
}



function getStatusConfig(status: EstimationStatus, isReturned?: boolean) {
  if (isReturned || status === 'Retourné') return { bg: '#ffedd5', text: '#ea580c', hoverBg: '#7c2d12', hoverText: '#fdba74', icon: RotateCcw };
  if (status === 'En attente') return { bg: '#fff7ed', text: '#f4af07', hoverBg: '#451a03', hoverText: '#ffb86a', icon: Clock };
  if (status.startsWith('Trait')) return { bg: '#dbeafe', text: '#3b82f6', hoverBg: '#0e1c47', hoverText: '#8ec5ff', icon: CheckCircle2 };
  if (status === 'Fournisseur') return { bg: '#f5f3ff', text: '#a78bfa', hoverBg: '#2e1065', hoverText: '#ddd6fe', icon: Users };
  if (status === 'Livraison') return { bg: '#dcfce7', text: '#22c55e', hoverBg: '#052e16', hoverText: '#86efac', icon: Truck };
  if (status.startsWith('Archiv')) return { bg: '#e5e7eb', text: '#9ca3af', hoverBg: '#111827', hoverText: '#9ca3af', icon: Archive };
  if (status === 'Corbeille') {
    return { bg: '#fee2e2', text: '#ef4444', hoverBg: '#450a0a', hoverText: '#fca5a5', icon: Trash2 };
  }
  return { bg: '#f4f4f5', text: '#71717a', hoverBg: '#18181b', hoverText: '#d4d4d8', icon: Clock };
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
}) => {
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
                ? (est.status === 'Corbeille' ? 'bg-[#b20000] border-[#b20000] text-white' : 'bg-black border-black text-white')
                : est.isReturned 
                  ? 'bg-red-50 border-red-200 text-red-900' 
                  : est.status === 'Corbeille'
                    ? 'bg-[#fff1f2] border-[#fecdd3] text-[#b20000] hover:bg-[#b20000] hover:border-[#b20000] hover:text-white transition-colors duration-300'
                  : est.status === 'Archivé'
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-500 opacity-60 grayscale hover:opacity-100 hover:bg-zinc-900 hover:border-zinc-800 hover:text-white hover:grayscale-0'
                    : 'bg-white border-zinc-100 hover:bg-zinc-900 hover:border-zinc-800 text-zinc-900 shadow-sm'
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
                    ? 'bg-[#95d230] border-[#95d230] text-black focus:ring-[#95d230]'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:ring-zinc-900'
                }`}
              />
            </div>

            {/* Attachment Column - FIXED WIDTH */}
            <div className="w-12 flex items-center justify-center">
              {est.sitePhoto ? (
                <div
                  className="shrink-0 relative group/photo cursor-pointer"
                  title="Photo du site jointe"
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

            {/* Numéro & Ref */}
            <div className="w-32 px-3 flex items-center gap-3">
              <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-white' : 'group-hover:text-white text-zinc-900'}`}>
                {est.number}
              </span>
            </div>

            {/* Client */}
            <div className="flex-1 px-3 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'group-hover:text-white text-zinc-900'}`}>
                  {est.client}
                </span>
                {est.emailVerified && (
                  <span title="Email vérifié" className="flex items-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#95d230]" />
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <a 
                  href={`tel:${est.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 transition-all ${
                    isSelected 
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-[#95d230] hover:text-black' 
                      : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-400 hover:!bg-[#95d230] hover:!text-black'
                  }`}
                >
                  <Phone className="w-2.5 h-2.5" />
                  {est.phone}
                </a>
              </div>
            </div>

            {/* Statut */}
            <div className="w-32 px-2 flex items-center">
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
                {est.isReturned ? 'Retourné' : translateStatus(est.status)}
              </button>
            </div>

            {/* Heure / Date */}
            <div className="w-28 px-3 flex flex-col justify-center">
              <span className={`font-bold text-sm tracking-tight ${isSelected ? 'text-white' : 'group-hover:text-white text-zinc-900'}`}>
                {est.time || '--:--'}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-zinc-500' : 'group-hover:text-zinc-500 text-zinc-400'}`}>
                {est.date || '--/--/----'}
              </span>
              {est.trackingNumber && (
                <div className="mt-1 flex items-center gap-1.5 bg-[#95d230]/10 px-1.5 py-0.5 rounded w-max">
                  <Package className="w-3 h-3 text-[#95d230]" />
                  <span className="text-[9px] font-bold text-[#95d230] tracking-tighter">{est.trackingNumber}</span>
                </div>
              )}
            </div>

            {/* Price Column Hidden for Supplier (Except in specific tabs if needed) */}
            {!isFournisseur && (
              <div className="w-36 px-3 flex flex-col items-start justify-center">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isSelected ? 'text-zinc-600' : 'group-hover:text-zinc-600 text-zinc-300'}`}>PRIX TOTAL</span>
                <span className={`font-black text-lg tracking-tighter whitespace-nowrap ${isSelected ? 'text-[#95d230]' : 'group-hover:text-[#95d230] text-zinc-900'}`}>
                  {Math.max(est.totalClient, 0.01).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            )}

            {/* Email Verification Icon */}
            {!isFournisseur && (
              <div className="hidden 2xl:flex w-28 px-4 items-center justify-center">
                {(est.status === 'En attente' || est.status === 'Traité') && (
                  <span title={est.emailVerified ? 'Email validé' : 'Email non confirmé'} className="flex items-center">
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
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-amber-500'}`}
                        title="Lire instructions"
                      >
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                           {est.supplierNotes && (
                             <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                           )}
                         </div>
                      </button>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`}
                        title="Ajouter Suivi (Colis)"
                      >
                         <Package className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onStatusClick(est.id)}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`}
                        title="Expédier en livraison"
                      >
                         <Truck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-white/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`}
                        title="Retourner au commercial"
                      >
                         <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Livraison' && (
                    <>
                      <button 
                        onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`}
                        title="Voir Suivi"
                      >
                         <Package className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onMarkAsDelivered(est.id)}
                        className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`}
                        title="Terminer (Livré)"
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
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-[#95d230]'}`} title="Modifier">
                         <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title="Valider (Traiter)">
                         <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Traité' && (
                    <>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-[#95d230]'}`} title="Modifier">
                         <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title="Transférer au fournisseur">
                         <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Fournisseur' && (
                    <>
                      <button onClick={() => onViewMessage(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-amber-500'}`} title="Lire instructions">
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                           {est.supplierNotes && (
                             <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                           )}
                         </div>
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title="Ajouter Suivi (Colis)">
                         <Package className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title="Expédier">
                         <Truck className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-white/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`} title="Retourner">
                         <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Retourné' && (
                    <>
                      <button onClick={() => onViewMessage(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-[#95d230]'}`} title="Voir motif refus">
                         <div className="relative">
                           <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                           {est.supplierNotes && (
                             <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                           )}
                         </div>
                      </button>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-[#95d230]'}`} title="Modifier">
                         <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title="Transférer à nouveau">
                         <Send className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Livraison' && (
                    <>
                      <button onClick={() => onEdit(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-[#95d230]'}`} title="Consulter">
                         <PlusCircle className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-blue-500'}`} title="Voir Suivi">
                         <Package className="w-4 h-4" />
                      </button>
                      <button onClick={() => onStatusClick(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title="Archiver">
                         <Archive className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status === 'Corbeille' && (
                    <button onClick={() => onRestore(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title="Restaurer">
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
                              : (isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-zinc-300')
                          }`}
                          title={est.isLocked ? 'Désarchiver (déverrouiller)' : 'Archiver (verrouiller)'}
                        >
                          {est.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => onRestore(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 group-hover:hover:bg-white/10 group-hover:hover:text-emerald-500'}`} title="Restaurer (retour En attente)">
                         <Undo2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {est.status !== 'Archivé' && (est.status !== 'Livraison' || userRole === 'admin') && (
                    <button onClick={() => setConfirmDeleteId(est.id)} className={`p-2 rounded-xl transition-all ${isSelected ? 'hover:bg-red-500/20 text-white/40 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 group-hover:hover:bg-red-500/20 group-hover:hover:text-red-500'}`} title={est.status === 'Corbeille' ? "Supprimer définitivement" : "Corbeille"}>
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
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{activeTab === 'Corbeille' ? 'Supprimer définitivement ?' : 'Mettre à la corbeille ?'}</h4>
                      <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">{activeTab === 'Corbeille' ? 'Action irréversible' : 'Action réversible'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="px-4 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(est.id, true);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Confirmer
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
              est.isReturned ? 'bg-[#fff1f2] border-[#fecdd3]' : est.status === 'Corbeille' ? 'bg-[#fff1f2] border-[#fecdd3]' : activeTab === 'Archivé' && est.isLocked ? 'bg-zinc-100 border-zinc-300 opacity-60 grayscale' : 'bg-white border-zinc-100 hover:border-black'
            } ${
              isSelected ? (est.status === 'Corbeille' ? 'border-[#b20000] ring-2 ring-[#b20000] ring-offset-1' : 'border-[#1447e6] ring-2 ring-[#1447e6] ring-offset-1') : ''
            }`}
          >
            <div 
              className="flex flex-col p-5 cursor-pointer hover:bg-zinc-50/50 transition-colors w-full"
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
                          ? 'bg-[#95d230] border-[#95d230] text-black focus:ring-[#95d230]'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-900 focus:ring-zinc-900'
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
                      <span className="font-black text-zinc-900 text-base tracking-tighter truncate">{est.client}</span>
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
                  {est.isReturned ? 'Retourné' : translateStatus(est.status)}
                </button>
              </div>

              <div className="h-px bg-zinc-100/80 w-full my-4" />

              <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex flex-col">
                   <span className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-0.5">MONTANT TOTAL</span>
                   <span className="font-black text-zinc-900 text-lg tracking-tighter">
                     {est.totalClient.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                   </span>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1 bg-zinc-50/50 rounded-xl p-1" onClick={(e) => e.stopPropagation()}>
                    {isFournisseur ? (
                      <>
                        {est.status === 'Fournisseur' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title="Lire instructions">
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Ajouter Suivi (Colis)">
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Expédier en livraison">
                              <Truck className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title="Retourner au commercial">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Livraison' && (
                          <>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Voir Suivi">
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onMarkAsDelivered(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Terminer (Livré)">
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        {est.status === 'En attente' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-[#95d230] rounded-lg transition-colors" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Valider (Traiter)">
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Traité' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-[#95d230] rounded-lg transition-colors" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Transférer au fournisseur">
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Fournisseur' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title="Lire instructions">
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Ajouter Suivi (Colis)">
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Expédier">
                              <Truck className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsRefusalPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title="Retourner">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Retourné' && (
                          <>
                            <button onClick={() => onViewMessage(est.id)} className="p-2 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors" title="Voir motif refus">
                              <div className="relative">
                                <Mail className={`w-4 h-4 ${est.supplierNotes ? 'text-[#95d230] animate-pulse' : ''}`} />
                                {est.supplierNotes && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                              </div>
                            </button>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-[#95d230] rounded-lg transition-colors" title="Modifier">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Transférer à nouveau">
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Livraison' && (
                          <>
                            <button onClick={() => onEdit(est.id)} className="p-2 text-zinc-400 hover:text-[#95d230] rounded-lg transition-colors" title="Consulter">
                              <PlusCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedEstimation(est); setIsTrackingPanelOpen(true); }} className="p-2 text-zinc-400 hover:text-blue-500 rounded-lg transition-colors" title="Voir Suivi">
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => onStatusClick(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Archiver">
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status === 'Corbeille' && (
                          <button onClick={() => onRestore(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Restaurer">
                            <Undo2 className="w-4 h-4" />
                          </button>
                        )}
                        {est.status === 'Archivé' && (
                          <>
                            {onToggleLock && (
                              <button
                                onClick={() => onToggleLock(est.id)}
                                className={`p-2 rounded-lg transition-colors ${est.isLocked ? 'text-amber-500 hover:bg-amber-50' : 'text-zinc-400 hover:bg-zinc-100'}`}
                                title={est.isLocked ? 'Désarchiver (déverrouiller)' : 'Archiver (verrouiller)'}
                              >
                                {est.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            )}
                            <button onClick={() => onRestore(est.id)} className="p-2 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors" title="Restaurer (retour En attente)">
                              <Undo2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {est.status !== 'Archivé' && (est.status !== 'Livraison' || userRole === 'admin') && (
                          <button onClick={() => setConfirmDeleteId(est.id)} className="p-2 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title={est.status === 'Corbeille' ? "Supprimer définitivement" : "Corbeille"}>
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
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Numéro</span>
                      <div className="text-sm font-medium text-zinc-900">{est.number}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-100">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Date et Heure</span>
                      <div className="text-sm font-medium text-zinc-900">{est.date} - {est.time}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-100">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact Client</span>
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
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-bold text-sm truncate">{activeTab === 'Corbeille' ? 'Supprimer définitivement ?' : 'Mettre à la corbeille ?'}</h4>
                      <p className="text-red-100 text-[10px] uppercase font-bold tracking-wider">{activeTab === 'Corbeille' ? 'Action irréversible' : 'Action réversible'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(est.id, true);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2.5 text-xs font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Confirmer
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
}) => {

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


  return (
    <div className="flex flex-col gap-3">
      {/* HEADER PC */}
      <div className="hidden md:flex items-center px-8 py-4 bg-black rounded-2xl border border-zinc-800 text-[10px] font-black text-white uppercase tracking-[0.15em] mb-4">
        <div className="w-12 mr-2 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onSelectAll}
            className="rounded-sm border-white bg-white text-black focus:ring-0 cursor-pointer w-4 h-4"
          />
        </div>
        <div className="w-8 flex items-center justify-center">
          <Paperclip className="w-4 h-4 text-[#95d230]" />
        </div>
        <div className="w-32 px-3 flex items-center gap-2.5">
          <PlusCircle className="w-4 h-4 text-[#95d230]" />
          NUMERO
        </div>
        <div className="flex-1 px-3 flex items-center gap-2.5">
          <User className="w-4 h-4 text-[#95d230]" />
          CLIENT
        </div>
        <div className="w-32 px-2 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#95d230]" />
          STATUT
        </div>
        <div className="w-28 px-3 flex items-center gap-2.5">
          <RotateCcw className="w-4 h-4 text-[#95d230]" />
          HEURE / DATE
        </div>
        {!isFournisseur && (
          <div className="w-36 px-3 flex items-center justify-start gap-2 font-black tracking-widest">
            <DollarSign className="w-4 h-4 text-[#95d230] shrink-0" />
            <span>PRIX</span>
          </div>
        )}
        {!isFournisseur && (
          <div className="hidden 2xl:flex w-28 px-4 items-center justify-center gap-2 font-black tracking-widest">
            <Mail className="w-4 h-4 text-[#95d230] shrink-0" />
            <span>EMAIL</span>
          </div>
        )}
        <div className="w-32 px-3 mr-2 flex items-center justify-end gap-2 font-black tracking-widest">
          <MoreVertical className="w-4 h-4 text-[#95d230] shrink-0" />
          <span>ACTION</span>
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
                className="fixed bottom-0 md:bottom-8 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:right-auto bg-black text-white px-4 md:px-6 py-4 md:py-3 md:rounded-2xl shadow-2xl z-50 flex flex-wrap items-center justify-between gap-3 md:gap-6 border-t md:border border-white/10 backdrop-blur-xl md:w-max"
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
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-[#95d230]">
                          {bulkProgress.remaining}
                        </span>
                      </div>
                      <div className="flex flex-col shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">En cours</span>
                        <span className="text-xs font-bold uppercase tracking-wide">{bulkProgress.total - bulkProgress.remaining}/{bulkProgress.total}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-[#95d230] rounded-lg flex shrink-0 items-center justify-center text-black font-black text-sm">
                        {selectedIds.size}
                      </div>
                      <div className="flex flex-col shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Estimations</span>
                        <span className="text-xs font-bold uppercase tracking-wide">Sélectionnées</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
                  {activeTab === 'Corbeille' && (
                    <button
                      onClick={onBulkRestore}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#95d230] hover:bg-[#a6e636] text-black rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Restaurer tout
                    </button>
                  )}
                  {activeTab === 'En attente' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#f4af07] hover:bg-[#ffb86a] text-black rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Traiter
                    </button>
                  )}
                  {activeTab === 'Traité' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-[#1447e6] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all group border border-white/10 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-[#1447e6] group-hover:text-white transition-colors" />
                      Transférer
                    </button>
                  )}
                  {activeTab === 'Fournisseur' && (
                    <button
                      onClick={() => {
                        setRefusalForm({ subject: '', message: '' });
                        setIsRefusalPanelOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Refuser
                    </button>
                  )}
                  {activeTab === 'Livraison' && (
                    <button
                      onClick={onBulkStatusClick}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archiver
                    </button>
                  )}
                  {activeTab === 'Archivé' && (
                    <button
                      onClick={onBulkRestore}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      Désarchiver
                    </button>
                  )}
                  {!isFournisseur && (
                    <button
                      onClick={() => setIsBulkConfirming(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all group shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-white transition-colors" />
                      <span>Supprimer</span>
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
                        <AlertTriangle className="w-5 h-5 text-white" />
                        <div>
                          <h4 className="text-white font-bold text-xs uppercase tracking-tight">Supprimer {selectedIds.size} estimation(s) ?</h4>
                          <p className="text-red-100 text-[8px] uppercase font-bold tracking-widest">{activeTab === 'Corbeille' ? 'Action irréversible' : 'Action réversible'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsBulkConfirming(false)}
                          className="px-4 py-2 text-[10px] font-bold text-white hover:bg-white/10 rounded-xl transition-colors uppercase"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => {
                            onBulkDelete(true);
                            setIsBulkConfirming(false);
                          }}
                          className="px-4 py-2 text-[10px] font-bold bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-lg flex items-center gap-2 uppercase"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Confirmer
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
              Aucune estimation trouvée dans cette catégorie.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {estimations.map((est) => (
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[400px] bg-black h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight uppercase">Suivi</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">{selectedEstimation.number}</p>
                  </div>
                </div>
                <button onClick={() => setIsTrackingPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-6 bg-black">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Numéro de suivi</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={trackingForm.number}
                      onChange={(e) => setTrackingForm({ ...trackingForm, number: e.target.value })}
                      placeholder="Ex: FR123456789"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Livraison</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="date"
                        value={trackingForm.deliveryDate}
                        onChange={(e) => setTrackingForm({ ...trackingForm, deliveryDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Réception</label>
                    <div className="relative">
                      <History className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="date"
                        value={trackingForm.receiptDate}
                        onChange={(e) => setTrackingForm({ ...trackingForm, receiptDate: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-white/10 flex gap-3">
                <button onClick={() => setIsTrackingPanelOpen(false)} className="flex-1 py-2.5 bg-black border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-white/5 transition-all">
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (onUpdateTracking && selectedEstimation) {
                      onUpdateTracking(selectedEstimation.id, trackingForm);
                      setIsTrackingPanelOpen(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#1447e6] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-blue-500 transition-all"
                >
                  Enregistrer
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[400px] bg-black h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight uppercase">Refuser</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      {selectedEstimation ? selectedEstimation.number : `${selectedIds.size} Estimations`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsRefusalPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-6 bg-black overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Motif du refus</label>
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
                        Sauvegarder modèle
                      </button>
                    )}

                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {['Prix trop élevé', 'Produit indisponible', 'Délais trop longs', 'Autre raison'].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setRefusalForm({ ...refusalForm, subject: reason })}
                        className={`p-3 rounded-lg border text-left transition-all font-bold uppercase tracking-wide text-[10px] ${
                          refusalForm.subject === reason
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {savedTemplates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Modèles enregistrés</label>
                    <div className="flex flex-wrap gap-2">
                      {savedTemplates.map((template: string, idx: number) => (
                        <div key={idx} className="group/tpl relative">
                          <button
                            onClick={() => setRefusalForm({ subject: 'Autre raison', message: template })}
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
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide ml-3">Message au client (optionnel)</label>
                  <textarea
                    value={refusalForm.message}
                    onChange={(e) => setRefusalForm({ ...refusalForm, message: e.target.value })}
                    placeholder="Expliquez la raison du refus..."
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none h-28 text-xs font-medium text-white"
                  />
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border-t border-white/10 flex gap-3">
                <button onClick={() => setIsRefusalPanelOpen(false)} className="flex-1 py-2.5 bg-black border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-white/5 transition-all">
                  Annuler
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
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Confirmer le refus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
