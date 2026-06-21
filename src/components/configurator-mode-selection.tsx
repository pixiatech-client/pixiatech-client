'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Zap } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { SparklesText } from '@/components/ui/sparkles-text';

export function ConfiguratorModeSelection({ onSelectGuide }: { onSelectGuide?: () => void }) {
  const { t } = useI18n();

  return (
    <motion.div
      key="mode-select"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-xl ml-0 flex flex-col items-center justify-end p-0 pb-2 h-full"
    >
      <div className='text-center mb-8 w-full'>
        <SparklesText
          text={t('modeSelection.title')}
          sparklesCount={4}
          colors={{ first: "#6366f1", second: "#c084fc" }}
          className="text-[22px] md:text-[26px] font-black text-slate-900 uppercase"
        />
        <p className='text-muted-foreground mt-2'>{t('modeSelection.description')}</p>
      </div>

      <div className="space-y-6 w-full">
        {/* Configuration Guidée */}
        <motion.div
          onClick={() => onSelectGuide?.()}
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-[1.5rem] bg-black text-white p-8 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-black/40">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#c6ff00]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="flex items-center gap-3 font-black text-xl text-white">
                  <Zap className="w-6 h-6 text-[#c6ff00]" />
                  {t('modeSelection.boutiqueTitle')}
                </h3>
                <p className="text-sm text-white/60 mt-1">{t('modeSelection.boutiqueDesc')}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-[#c6ff00] transition-transform group-hover:translate-x-2 shrink-0" />
            </div>
          </div>
        </motion.div>

        {/* Achat de produits */}
        <motion.div
          onClick={() => window.location.href = '/boutique'}
          whileTap={{ scale: 0.98 }}
          className="group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-emerald-200 bg-emerald-50/40 backdrop-blur-sm p-8 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-200/50">
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="flex items-center gap-3 font-black text-xl text-slate-900 transition-colors group-hover:text-emerald-700">
                  <ShoppingBag className="w-6 h-6 text-emerald-500" />
                  {t('modeSelection.boutiqueShopTitle')}
                </h3>
                <p className="text-sm text-emerald-800/70 mt-1 leading-relaxed">
                  {t('modeSelection.boutiqueShopDesc')}
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-emerald-400 transition-transform group-hover:translate-x-2 shrink-0 group-hover:text-emerald-500" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
