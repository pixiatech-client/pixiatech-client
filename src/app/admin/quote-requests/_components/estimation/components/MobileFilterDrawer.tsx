import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Check, Filter, ChevronDown, LayoutGrid } from 'lucide-react';
import { EstimationStatus } from '../types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: EstimationStatus;
  onTabChange: (tab: EstimationStatus) => void;
  tabCounts: Record<string, number>;
  userRole: string;
}

const allTabs: { label: EstimationStatus; color: string; roles: string[] }[] = [
  { label: 'En attente', color: '#f4af07', roles: ['admin', 'commercial'] },
  { label: 'Traité', color: '#3b82f6', roles: ['admin', 'commercial'] },
  { label: 'Retourné', color: '#f97316', roles: ['admin', 'fournisseur', 'commercial'] },
  { label: 'Fournisseur', color: '#a78bfa', roles: ['admin', 'fournisseur'] },
  { label: 'Livraison', color: '#22c55e', roles: ['admin', 'commercial', 'fournisseur'] },
  { label: 'Archivé', color: '#9ca3af', roles: ['admin', 'commercial'] },
  { label: 'Corbeille', color: '#ef4444', roles: ['admin', 'commercial'] },
];

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  tabCounts,
  userRole,
}) => {
  const tabs = allTabs.filter(t => t.roles.includes(userRole));
  const [selectedTab, setSelectedTab] = React.useState<EstimationStatus>(activeTab);

  // Reset selection when drawer opens
  React.useEffect(() => {
    if (isOpen) setSelectedTab(activeTab);
  }, [isOpen, activeTab]);

  const handleApply = () => {
    onTabChange(selectedTab);
    onClose();
  };

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with pronounced blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ opacity }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[110] 2xl:hidden"
          />

          {/* Floating Pill Modal with Drag to Close */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 150 || info.velocity.y > 500) {
                onClose();
              }
            }}
            style={{ y }}
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-4 right-4 z-[120] bg-white dark:bg-[#111111] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden 2xl:hidden max-h-[80vh]"
          >
            {/* Drag Handle Area */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-white/10 rounded-full" />
            </div>

            {/* Header Studio Style */}
            <div className="px-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-[#c6ff00] shadow-lg">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">
                    Statuses
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                    Filter by category
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-400 hover:text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters List (Studio Style - Image 5) */}
            <div className="px-4 py-2 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col">
                {tabs.map(({ label, color }, index) => {
                  const isActive = selectedTab === label;
                  const count = tabCounts[label] || 0;

                  return (
                    <button
                      key={label}
                      onClick={() => {
                        onTabChange(label);
                        onClose();
                      }}
                      className={`flex items-center justify-between px-4 py-4 transition-all duration-300 ${index !== tabs.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''
                        } ${isActive ? 'bg-zinc-50 dark:bg-white/5' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform shadow-sm"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          {isActive ? <Check size={20} strokeWidth={3} /> : <Filter size={20} />}
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-6">
                            <span className={`text-base font-black uppercase tracking-tight ${isActive ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-400'
                              }`}>
                              {label}
                            </span>
                            <div className="w-14 h-8 bg-black dark:bg-[#c6ff00] rounded-xl shadow-sm flex items-center justify-center">
                              <span className="text-sm font-black text-[#c6ff00] dark:text-black">
                                {count}
                              </span>
                            </div>
                          </div>
                          {count > 0 && (
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 opacity-60">
                              {count} estimation{count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-[#c6ff00] shadow-[0_0_10px_#c6ff00]" />
                        )}
                        <ChevronDown className="w-4 h-4 text-zinc-300 -rotate-90" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
