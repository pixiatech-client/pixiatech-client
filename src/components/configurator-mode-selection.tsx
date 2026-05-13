'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ConfiguratorModeSelectionProps {
  onSelectMode: (mode: 'wizard' | 'manual') => void;
}

export function ConfiguratorModeSelection({ onSelectMode }: ConfiguratorModeSelectionProps) {
  const [exiting, setExiting] = useState<'wizard' | 'manual' | null>(null);
  const { t } = useI18n();

  const handleSelect = (mode: 'wizard' | 'manual') => {
    setExiting(mode);
    // Small delay so the exit animation is visible before switching view
    setTimeout(() => onSelectMode(mode), 220);
  };

  return (
    <AnimatePresence mode="wait">
      {!exiting && (
        <motion.div
          key="mode-select"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-xl ml-0 flex flex-col items-center justify-end h-full p-0 pb-2"
        >
          <div className='text-center mb-8 w-full'>
            <h1 className='text-3xl font-bold tracking-tight'>{t('modeSelection.title')}</h1>
            <p className='text-muted-foreground mt-2'>{t('modeSelection.description')}</p>
          </div>

          <div className="space-y-6 w-full">
            {/* Configuration Guidée */}
            <motion.div
              onClick={() => handleSelect('wizard')}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] bg-black text-white p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-black/40">
                {/* Lime accent glow */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#c6ff00]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center gap-3 font-black text-xl text-white">
                      <Zap className="w-6 h-6 text-[#c6ff00]" />
                      {t('modeSelection.wizardTitle')}
                    </h3>
                    <p className="text-sm text-white/60 mt-1">{t('modeSelection.wizardDesc')}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-[#c6ff00] transition-transform group-hover:translate-x-2 shrink-0" />
                </div>
              </div>
            </motion.div>

            {/* Configuration Manuelle */}
            <motion.div
              onClick={() => handleSelect('manual')}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-slate-200 bg-white/60 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:bg-blue-50 hover:shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center gap-3 font-black text-xl text-slate-900 transition-colors group-hover:text-blue-700">
                      <SlidersHorizontal className="w-6 h-6 text-slate-500 transition-colors group-hover:text-blue-500" />
                      {t('modeSelection.manualTitle')}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 transition-colors group-hover:text-blue-600/70">{t('modeSelection.manualDesc')}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-400 transition-transform group-hover:translate-x-2 shrink-0 group-hover:text-blue-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
