'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ConfiguratorModeSelectionProps {
  onSelectMode: (mode: 'wizard' | 'manual') => void;
}

export function ConfiguratorModeSelection({ onSelectMode }: ConfiguratorModeSelectionProps) {
  const [exiting, setExiting] = useState<'wizard' | 'manual' | null>(null);

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
          className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-full p-4"
        >
          <div className='text-center mb-10'>
            <h1 className='text-3xl font-bold tracking-tight'>Choisissez votre mode</h1>
            <p className='text-muted-foreground mt-2'>La méthode qui vous convient le mieux.</p>
          </div>

          <div className="space-y-4 w-full">
            {/* Configuration Guidée */}
            <motion.div
              onClick={() => handleSelect('wizard')}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] bg-black text-white p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-black/30">
                {/* Lime accent glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#c6ff00]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center gap-2 font-black text-lg text-white">
                      <Zap className="w-5 h-5 text-[#c6ff00]" />
                      Configuration Guidée
                    </h3>
                    <p className="text-sm text-white/60 mt-1">Recommandé — Rapide, simple et sans prise de tête.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#c6ff00] transition-transform group-hover:translate-x-1 shrink-0" />
                </div>
              </div>
            </motion.div>

            {/* Configuration Manuelle */}
            <motion.div
              onClick={() => handleSelect('manual')}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-slate-200 bg-white/60 backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:border-slate-400 hover:shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center gap-2 font-black text-lg text-slate-900">
                      <SlidersHorizontal className="w-5 h-5 text-slate-500" />
                      Configuration Manuelle
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Avancé — Pour ceux qui savent déjà ce qu'ils veulent.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 transition-transform group-hover:translate-x-1 shrink-0" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
