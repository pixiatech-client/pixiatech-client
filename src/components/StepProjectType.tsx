'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Calendar as CalendarIcon, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfigState } from '@/lib/configurator-wizard-types';
import { WizardSettings } from '@/lib/types';
export function StepProjectType({ state, updateState, wizardSettings, t }: { state: ConfigState, updateState: any, wizardSettings: WizardSettings, t: any }) {
  const projectTypes = wizardSettings?.projectTypes;
  const images = {
    location: projectTypes?.location?.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=90&w=2000",
    vente: projectTypes?.vente?.imageUrl || "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=90&w=2000"
  };

  return (
    <div className="flex flex-col space-y-6 bg-transparent max-w-3xl mx-auto w-full">
      <div className="w-full bg-transparent">
        <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-tight mb-2 text-center">{t('wizard.projectType.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic">
          {t('wizard.projectType.description')}
        </p>
      </div>

      <div className="w-full h-72 md:h-[350px] lg:h-[300px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
        <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={state.projectType}
              src={images[state.projectType as keyof typeof images]}
              alt={state.projectType}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {projectTypes?.location?.enabled && (
            <div
              onClick={() => updateState({ projectType: 'location' })}
              className={cn(
                "group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center overflow-hidden bg-white/40 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center min-h-[160px]",
                state.projectType === 'location' ? 'border-blue-500' : 'border-border hover:border-blue-400'
              )}
            >
              <CalendarIcon className={cn("w-12 h-12 mb-3 text-muted-foreground transition-colors", state.projectType !== 'location' && "group-hover:text-blue-500")} />
              <h3 className={cn("font-bold text-lg text-foreground transition-colors", state.projectType !== 'location' && "group-hover:text-blue-500")}>{t('configurator.rental')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('wizard.projectType.rentalDesc')}</p>
              <div className="absolute top-4 right-4">
                {state.projectType === 'location'
                  ? <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center"><Check className="w-4 h-4" /></div>
                  : <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-blue-400" />
                }
              </div>
            </div>
          )}

          {projectTypes?.vente?.enabled && (
            <div
              onClick={() => updateState({ projectType: 'vente' })}
              className={cn(
                "group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center overflow-hidden bg-white/40 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center min-h-[160px]",
                state.projectType === 'vente' ? 'border-green-500' : 'border-border hover:border-green-400'
              )}
            >
              <ShoppingCart className={cn("w-12 h-12 mb-3 text-muted-foreground transition-colors", state.projectType !== 'vente' && "group-hover:text-green-500")} />
              <h3 className={cn("font-bold text-lg text-foreground transition-colors", state.projectType !== 'vente' && "group-hover:text-green-500")}>{t('configurator.sale')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('wizard.projectType.saleDesc')}</p>
              <div className="absolute top-4 right-4">
                {state.projectType === 'vente'
                  ? <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center"><Check className="w-4 h-4" /></div>
                  : <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-green-400" />
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}