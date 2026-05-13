'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Truck,
  Wrench,
  Calculator,
  Check,
  Circle,
  Sun,
  CloudRain,
  CloudSun,
  Maximize,
  Monitor,
  Zap,
  Cpu,
  User,
  Info,
  Eye,
  Grid3X3,
  Layers,
  Grid,
  ArrowDown,
  Plus,
  ArrowRight,
  Search,
  Play,
  X,
  Calendar as CalendarIcon,
  ShoppingCart,
  SlidersHorizontal,
  Clock,
  Camera,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfigState, INITIAL_STATE, ProjectType, Environment, ViewingDistance, PixelPitch } from '@/lib/configurator-wizard-types';
import { Button } from './ui/button';
import { ConfiguredProduct, Product, Settings, UserProfile, WizardSettings } from '@/lib/types';
import Preview from './preview';
import { Label } from './ui/label';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useI18n } from '@/lib/i18n';
import type { DateRange } from 'react-day-picker';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { preloadImages } from '@/lib/image-preload';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProductNotFound, ProductNotFoundProps } from './ProductNotFound';

// --- Wizard Component ---
interface ConfiguratorWizardProps {
  onComplete: (product: ConfiguredProduct) => void;
  onBack: () => void;
  allProducts: Product[];
  settings: Settings;
  wizardSettings: WizardSettings;
  initialStep?: number;
}

function HorizontalStepper({ currentStep, onStepClick, isMobile, t }: { currentStep: number, onStepClick: (step: number) => void, isMobile: boolean, t: any }) {
  const steps = [
    { id: 1, icon: <Grid size={18} />, label: t('wizard.steps.project') },
    { id: 2, icon: <Monitor size={18} />, label: t('wizard.steps.config') },
    { id: 5, icon: <Wrench size={18} />, label: t('wizard.steps.install') },
    { id: 7, icon: <Calculator size={18} />, label: t('wizard.steps.estimate') },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 w-full py-2">
      {steps.map((step, index) => {
        const isActive = currentStep >= step.id;
        const isPast = currentStep > step.id;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => (isPast || isActive) && onStepClick(step.id)}
              disabled={!isPast && !isActive}
              className={cn(
                "relative flex flex-col items-center group transition-all duration-500",
                isPast || isActive ? "cursor-pointer" : "cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2 z-10",
                isActive
                  ? "bg-black border-black text-white shadow-[0_0_20px_rgba(0,0,0,0.2)] scale-110"
                  : isPast
                    ? "bg-white border-black text-black"
                    : "bg-gray-50 border-gray-100 text-gray-300"
              )}>
                {React.cloneElement(step.icon as React.ReactElement, { size: isMobile ? 14 : 18 })}
              </div>
            </button>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-6 md:w-12 rounded-full transition-all duration-700 shrink-0",
                isPast ? "bg-black" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function ConfiguratorWizard({ onComplete, onBack, allProducts, settings, wizardSettings, initialStep = 1 }: ConfiguratorWizardProps) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<ConfigState>(() => ({
    ...INITIAL_STATE,
    step: initialStep
  }));
  const { userProfile } = useUser();
  const isMobile = useIsMobile();
  const [isInteracting, setIsInteracting] = useState(false);
  const [direction, setDirection] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [state.step]);

  // Preload all wizard images for smooth transitions
  useEffect(() => {
    if (wizardSettings) {
      const urls: string[] = [];

      // Project types images
      const locationImg = wizardSettings.projectTypes?.location?.imageUrl;
      const venteImg = wizardSettings.projectTypes?.vente?.imageUrl;

      if (locationImg) urls.push(locationImg);
      if (venteImg) urls.push(venteImg);

      // Environment images
      const indoorImg = wizardSettings.environments?.interieur?.imageUrl;
      const semiOutdoorImg = wizardSettings.environments?.['semi-exterieur']?.imageUrl;
      const outdoorImg = wizardSettings.environments?.exterieur?.imageUrl;

      if (indoorImg) urls.push(indoorImg);
      if (semiOutdoorImg) urls.push(semiOutdoorImg);
      if (outdoorImg) urls.push(outdoorImg);

      // Pixel pitch images
      wizardSettings.pixelPitches?.forEach(pp => {
        if (pp.imageUrl) urls.push(pp.imageUrl);
      });

      // Viewing distance images
      wizardSettings.viewingDistances?.forEach(vd => {
        if (vd.imageUrl) urls.push(vd.imageUrl);
      });

      if (urls.length > 0) {
        preloadImages(urls);
      }
    }
  }, [wizardSettings]);

  const updateState = useCallback((updates: Partial<ConfigState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Expose setIsInteracting to steps via a window hack or props
  useEffect(() => {
    (window as any).setIsInteracting = setIsInteracting;
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.step === 8) {
        if (!prev.selectedProduct) return prev; // Prevent completion without selection

        const matchingProduct = allProducts.find(p =>
          p.availableFor.includes((prev.projectType === 'vente' ? 'sale' : 'rental') as 'sale' | 'rental') &&
          p.type.includes(prev.environment as any)
        );

        // Use the explicitly selected product from Step 8, fallback to matching product
        const productId = prev.selectedProduct !== null ? String(prev.selectedProduct) : (matchingProduct?.id ?? allProducts[0]?.id ?? 'fallback-product-id');
        const isRental = prev.projectType === 'location';

        const rentalPeriod = isRental && prev.rentalStartDate && prev.rentalEndDate
          ? { from: new Date(prev.rentalStartDate), to: new Date(prev.rentalEndDate) }
          : isRental ? { from: new Date(), to: new Date() } : undefined;

        const envMap: Record<string, 'indoor' | 'outdoor' | 'showcase'> = {
          'interieur': 'indoor',
          'semi-exterieur': 'showcase',
          'exterieur': 'outdoor'
        };

        const configuredProduct: ConfiguredProduct = {
          id: `config_${Date.now()}`,
          productId: productId,
          productType: envMap[prev.environment] || 'indoor',
          width: prev.width,
          height: prev.height,
          quantity: prev.quantity || 1,
          transactionType: prev.projectType === 'vente' ? 'sale' : 'rental',
          rentalDuration: 1,
          rentalUnit: 'day',
          rentalPeriod: rentalPeriod,
          rentalDate: isRental && prev.rentalStartDate ? new Date(prev.rentalStartDate) : undefined,
          rentalStartTime: isRental ? prev.rentalStartTime || '08:00' : undefined,
          rentalEndTime: isRental ? prev.rentalEndTime || '18:00' : undefined,
          installationPhoto: prev.installationPhoto || undefined,
        };
        onComplete(configuredProduct);
        return prev;
      }
      setDirection(1);
      return { ...prev, step: Math.min(prev.step + 1, 8) };
    });
  }, [allProducts, onComplete]);

  useEffect(() => {
    if (state.step === 1 && wizardSettings?.projectTypes) {
      const { vente, location } = wizardSettings.projectTypes;
      if (vente && location) {
        // Check if exactly one is enabled
        if (vente.enabled && !location.enabled) {
          updateState({ projectType: 'vente' });
          nextStep();
        } else if (!vente.enabled && location.enabled) {
          updateState({ projectType: 'location' });
          nextStep();
        }
      }
    }
  }, [wizardSettings?.projectTypes, state.step, updateState, nextStep]);

  const prevStep = () => {
    if (state.step === 1) {
      onBack();
    } else if (state.step === 2 &&
      wizardSettings?.projectTypes?.vente &&
      wizardSettings?.projectTypes?.location &&
      ((wizardSettings.projectTypes.vente.enabled && !wizardSettings.projectTypes.location.enabled) ||
        (!wizardSettings.projectTypes.vente.enabled && wizardSettings.projectTypes.location.enabled))) {
      // If step 1 was automatically skipped, pressing back on step 2 should trigger onBack
      onBack();
    } else {
      setDirection(-1);
      setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
    }
  };

  const handleStepClick = (step: number) => {
    setState(prev => ({ ...prev, step }));
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-white h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto flex flex-col bg-white relative scrollbar-hide overflow-x-hidden overscroll-contain"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: direction >= 0 ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -20 : 20 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{ willChange: 'transform, opacity' }}
              className="flex-1 flex flex-col items-start p-0"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (window as any).touchStartX = touch.clientX;
                (window as any).touchStartY = touch.clientY;
              }}
              onTouchEnd={(e) => {
                const touch = e.changedTouches[0];
                const startX = (window as any).touchStartX || 0;
                const startY = (window as any).touchStartY || 0;
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;

                if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 50) {
                  if (deltaX < 0) nextStep();
                  else prevStep();
                }
              }}
            >
              <div className="w-full max-w-5xl mx-auto flex-col pt-0 pb-6">
                <HorizontalStepper
                  currentStep={state.step}
                  onStepClick={handleStepClick}
                  isMobile={isMobile}
                  t={t}
                />
                <div>
                  {renderStep(state, updateState, userProfile, wizardSettings, settings, allProducts, setIsInteracting, t, locale)}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="p-4 md:p-6 bg-transparent fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] pointer-events-auto w-full max-w-[650px] mx-auto before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-[24px] after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
            <div className="relative z-10 flex items-center gap-2 w-full">
              {/* Bouton Retour */}
              <button
                onClick={prevStep}
                className="w-12 h-12 rounded-[16px] bg-black text-white flex items-center justify-center transition-all duration-300 hover:bg-[#c6ff00] hover:text-black hover:shadow-[0_0_20px_rgba(198,255,0,0.4)] active:scale-90 shadow-lg shrink-0"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>

              {/* Bouton Suivant (Capsule Noire) */}
              <button
                onClick={nextStep}
                disabled={state.step === 8 && !state.selectedProduct}
                className={cn(
                  "flex-1 h-12 bg-black rounded-[18px] flex items-center px-6 transition-all duration-300 group hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-[0.98] shadow-lg overflow-hidden relative",
                  state.step === 8 && !state.selectedProduct && "opacity-50 cursor-not-allowed grayscale"
                )}
              >
                <div className="absolute inset-0 bg-black group-hover:bg-gray-900 transition-colors duration-300"></div>
                <span className="relative z-10 text-white font-black uppercase tracking-[0.3em] text-[10px] ml-2 transition-colors duration-300 group-hover:text-[#c6ff00]">
                  {state.step === 8 ? t('common.finish') : t('common.next')}
                </span>
                <div className="relative z-10 ml-auto w-8 h-8 rounded-[12px] bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#c6ff00] group-hover:scale-105">
                  <ChevronRight size={14} strokeWidth={3} className="text-white group-hover:text-black transition-colors duration-300" />
                </div>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}


function getStepTitle(step: number, projectType: ProjectType, t: any): string {
  switch (step) {
    case 1: return t('wizard.projectType.title');
    case 2: return t('wizard.environment.title');
    case 3: return t('wizard.viewingDistance.title');
    case 4: return t('wizard.pixelPitch.title');
    case 5: return t('wizard.dimensions.title');
    case 6: return projectType === 'location' ? t('wizard.rental.title') : t('wizard.photo.title');
    case 7: return t('wizard.summary.title');
    case 8: return t('wizard.products.title');
    default: return "";
  }
}

function renderStep(state: ConfigState, updateState: (updates: Partial<ConfigState>) => void, userProfile: UserProfile | null, wizardSettings: WizardSettings, settings: Settings, products: Product[], setIsInteracting: (val: boolean) => void, t: any, locale?: string) {
  switch (state.step) {
    case 1: return <StepProjectType state={state} updateState={updateState} wizardSettings={wizardSettings} t={t} />;
    case 2: return <StepEnvironment state={state} updateState={updateState} wizardSettings={wizardSettings} t={t} />;
    case 3: return <StepViewingDistance state={state} updateState={updateState} userProfile={userProfile} wizardSettings={wizardSettings} t={t} />;
    case 4: return <StepPixelPitch state={state} updateState={updateState} userProfile={userProfile} wizardSettings={wizardSettings} t={t} />;
    case 5: return <StepDimensions state={state} updateState={updateState} settings={settings} setIsInteracting={setIsInteracting} t={t} />;
    case 6: return state.projectType === 'location' ? <StepRentalDatesAndPhoto state={state} updateState={updateState} t={t} /> : <StepInstallationPhoto state={state} updateState={updateState} t={t} />;
    case 7: return <StepSummary state={state} t={t} locale={locale} />;
    case 8: return <StepFinal state={state} updateState={updateState} products={products} settings={settings} t={t} locale={locale!} hideBackButton={true} />;
    default: return null;
  }
}

export function StepProjectType({ state, updateState, wizardSettings, t }: { state: ConfigState, updateState: any, wizardSettings: WizardSettings, t: any }) {
  const projectTypes = wizardSettings?.projectTypes;
  const images = {
    location: projectTypes?.location?.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=90&w=2000",
    vente: projectTypes?.vente?.imageUrl || "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=90&w=2000"
  };

  return (
    <div className="flex flex-col space-y-6 bg-transparent">
      <div className="w-full">
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

export function StepEnvironment({ state, updateState, wizardSettings, t }: { state: ConfigState, updateState: any, wizardSettings: WizardSettings, t: any }) {
  const environments = wizardSettings?.environments;
  const envs = [
    {
      id: 'interieur',
      title: t('wizard.environment.indoorTitle'),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="24" y="24" width="24" height="24" fill="#e0f2fe" />
          <path d="M12 24L32 12L52 24V56H12V24Z" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 24L24 32V56" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M52 24L40 32V56" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M24 32H40" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 12V20" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="24" r="4" stroke="#475569" strokeWidth="2" />
          <path d="M14 40H20V56H14V40Z" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 56H56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      subIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" stroke="#64748b" strokeWidth="1.5" />
          <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.636 5.636L7.05 7.05M16.95 16.95L18.364 18.364M5.636 18.364L7.05 16.95M16.95 7.05L18.364 5.636" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      sub: t('wizard.environment.brightnessLow'),
      desc: t('wizard.environment.indoorDesc'),
      image: environments?.interieur?.imageUrl || 'https://picsum.photos/seed/led-interior-lobby/800/1200',
      caption: 'Simulation: ' + t('wizard.environment.indoorTitle') + ', Lobby'
    },
    {
      id: 'semi-exterieur',
      title: t('wizard.environment.semiOutdoorTitle'),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="16" r="6" stroke="#475569" strokeWidth="2" />
          <path d="M20 6V8M20 24V26M10 16H12M28 16H30M13 9L14.5 10.5M25.5 21.5L27 23M13 23L14.5 21.5M25.5 10.5L27 9" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 24C36 20.6863 38.6863 18 42 18C44.887 18 47.3006 20.0407 47.8826 22.7554C48.2415 22.6841 48.6154 22.6452 49 22.6452C52.3137 22.6452 55 25.3315 55 28.6452C55 31.9589 52.3137 34.6452 49 34.6452H38C34.6863 34.6452 32 31.9589 32 28.6452C32 26.2366 33.4187 24.1593 35.4241 23.2107" fill="#e0f2fe" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 38L38 42M46 38L44 42M52 38L50 42" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 28L52 40" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 29V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M48 39V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M24 48H40" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M32 48V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 56V44H26" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 56V44H38" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 56H56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      subIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 7A5 5 0 0 0 12 17V7Z" fill="#64748b" />
          <circle cx="12" cy="12" r="5" stroke="#64748b" strokeWidth="1.5" />
          <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.636 5.636L7.05 7.05M16.95 16.95L18.364 18.364M5.636 18.364L7.05 16.95M16.95 7.05L18.364 5.636" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      sub: t('wizard.environment.brightnessMedium'),
      desc: t('wizard.environment.semiOutdoorDesc'),
      image: environments?.['semi-exterieur']?.imageUrl || 'https://picsum.photos/seed/led-atrium/800/1200',
      caption: 'Simulation: ' + t('wizard.environment.semiOutdoorTitle') + ', Atrium'
    },
    {
      id: 'exterieur',
      title: t('wizard.environment.outdoorTitle'),
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="5" stroke="#475569" strokeWidth="2" />
          <path d="M16 7V9M16 23V25M7 16H9M23 16H25M9.5 9.5L11 11M21 21L22.5 22.5M9.5 22.5L11 21M21 11L22.5 9.5" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 20C36 17.2386 38.2386 15 41 15C43.406 15 45.4172 16.6994 45.9022 18.9628C46.2012 18.9034 46.5128 18.871 46.8333 18.871C49.5948 18.871 51.8333 21.1095 51.8333 23.871C51.8333 26.6324 49.5948 28.871 46.8333 28.871H37.6667C34.9052 28.871 32.6667 26.6324 32.6667 23.871C32.6667 21.8638 34.0203 20.1327 35.8576 19.434" fill="#e0f2fe" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M40 32L38 36M46 32L44 36" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="40" r="6" fill="#e0f2fe" stroke="#475569" strokeWidth="2" />
          <path d="M16 46V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="48" cy="40" r="6" fill="#e0f2fe" stroke="#475569" strokeWidth="2" />
          <path d="M48 46V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <rect x="24" y="36" width="16" height="12" fill="#e0f2fe" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
          <path d="M28 48V56M36 48V56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 56H56" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      subIcon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="5" fill="#64748b" stroke="#64748b" strokeWidth="1.5" />
          <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.636 5.636L7.05 7.05M16.95 16.95L18.364 18.364M5.636 18.364L7.05 16.95M16.95 7.05L18.364 5.636" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      sub: t('wizard.environment.brightnessHigh'),
      desc: t('wizard.environment.outdoorDesc'),
      image: environments?.exterieur?.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=90&w=2000',
      caption: 'Simulation: ' + t('wizard.environment.outdoorTitle') + ', Urban Façade'
    },
  ];

  const currentEnv = envs.find(e => e.id === state.environment) || envs[0];

  const selectionColors = {
    interieur: {
      border: 'border-[#82c4e6]',
      bg: 'bg-[#eaf4fc]',
      checkmark: 'bg-[#82c4e6]',
      hoverBorder: 'hover:border-[#82c4e6]'
    },
    'semi-exterieur': {
      border: 'border-amber-400',
      bg: 'bg-amber-50',
      checkmark: 'bg-amber-400',
      hoverBorder: 'hover:border-amber-400'
    },
    exterieur: {
      border: 'border-teal-400',
      bg: 'bg-teal-50',
      checkmark: 'bg-teal-400',
      hoverBorder: 'hover:border-teal-400'
    },
  };

  return (
    <div className="flex flex-col space-y-4 bg-transparent">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[28px] font-bold text-black leading-tight mb-2 text-center">{t('wizard.environment.title')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="w-full max-w-[320px] ml-auto h-72 md:h-[450px] lg:h-[520px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentEnv.image}
                  src={currentEnv.image}
                  alt={currentEnv.title}
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
          <p className="text-center lg:text-center text-[15px] font-medium text-slate-500 px-4 max-w-[320px] ml-auto">
            {currentEnv.caption}
          </p>
        </div>

        {/* Right: Selection */}
        <div className="w-full space-y-3">
          {envs.map((env) => {
            const isSelected = state.environment === env.id;
            const colors = selectionColors[env.id as keyof typeof selectionColors];

            return (
              <div
                key={env.id}
                onClick={() => updateState({ environment: env.id as Environment })}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col relative group",
                  isSelected
                    ? `${colors.border} ${colors.bg} shadow-sm`
                    : `border-slate-200 bg-white/40 backdrop-blur-md hover:shadow-lg hover:-translate-y-1 ${colors.hoverBorder}`
                )}
              >
                {isSelected && (
                  <div className={cn("absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center", colors.checkmark)}>
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    {env.icon}
                  </div>
                  <div className="flex flex-col items-center mr-12 mt-1">
                    <div className="mb-1 text-slate-500">
                      {env.subIcon}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{env.sub}</span>
                  </div>
                </div>
                <div>
                  <h3 className={cn(
                    "font-bold text-xl text-black mb-2 transition-colors",
                    !isSelected && {
                      'group-hover:text-[#82c4e6]': env.id === 'interieur',
                      'group-hover:text-amber-400': env.id === 'semi-exterieur',
                      'group-hover:text-teal-400': env.id === 'exterieur',
                    }
                  )}>{env.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{env.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export function StepViewingDistance({ state, updateState, userProfile, wizardSettings, t }: { state: ConfigState, updateState: any, userProfile: UserProfile | null, wizardSettings: WizardSettings, t: any }) {
  const allDistances = wizardSettings?.viewingDistances || [];
  const uniqueDistances = Array.from(new Map(allDistances.map(d => [d.value, d])).values());
  const viewingDistances = uniqueDistances;
  const viewingDistanceImageUrl = wizardSettings?.viewingDistanceImageUrl;
  const [customImage, setCustomImage] = useState<string | null>(null);
  const mainImage = customImage || viewingDistanceImageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=90&w=2000";

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
    }
  };

  return (
    <div className="flex flex-col space-y-4 bg-transparent">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-tight mb-2 text-center">{t('wizard.viewingDistance.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic">
          {t('wizard.viewingDistance.vizLabel')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="w-full max-w-[300px] ml-auto h-72 md:h-[350px] lg:h-[480px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative group">
              <img
                src={mainImage}
                alt="Viewing Distance Context"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              {userProfile?.role === 'admin' && (
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-2">
                  <Maximize className="w-8 h-8 rotate-45" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">{t('wizard.viewingDistance.replacePhoto')}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
          <p className="text-center lg:text-center text-[12px] font-medium text-slate-500 italic px-4 max-w-[300px] ml-auto">
            {t('wizard.summary.simulation')}: {state.environment === 'exterieur' ? t('configurator.outdoor') : state.environment === 'semi-exterieur' ? t('wizard.environment.semiOutdoorTitle') : t('configurator.indoor')}, {state.projectType === 'location' ? t('configurator.rental') : t('configurator.sale')}
          </p>
        </div>

        {/* Right: Selection */}
        <div className="w-full space-y-3">
          <div className="space-y-3 py-1">
            {/* Small Buttons Grid */}
            <div className="grid grid-cols-2 gap-3">
              {viewingDistances.map((d) => (
                <button
                  key={d.id}
                  onClick={() => updateState({ viewingDistance: d.value })}
                  className={cn(
                    "group py-4 px-6 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-between",
                    state.viewingDistance === d.value
                      ? "bg-black border-black text-[#c6ff00] shadow-2xl scale-[1.02]"
                      : "bg-white/40 backdrop-blur-md border-white/50 text-slate-500 hover:border-black"
                  )}
                >
                  <span>{d.value}</span>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    state.viewingDistance === d.value ? "border-[#c6ff00] bg-[#c6ff00] text-black" : "border-slate-200 group-hover:border-black"
                  )}>
                    {state.viewingDistance === d.value && <Check className="w-3 h-3" strokeWidth={4} />}
                  </div>
                </button>
              ))}
            </div>

            {/* Distance Illustration */}
            <div className="flex flex-col items-center justify-center py-6 bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30">
              <div className="relative w-full max-w-[220px] aspect-[4/3]">
                <svg viewBox="0 0 300 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Floor with hatching */}
                  <line x1="20" y1="200" x2="280" y2="200" stroke="#334155" strokeWidth="1.5" />
                  <g stroke="#94A3B8" strokeWidth="1">
                    {[...Array(26)].map((_, i) => (
                      <line key={i} x1={20 + i * 10} y1="200" x2={15 + i * 10} y2="210" />
                    ))}
                  </g>

                  {/* Wall and Screen */}
                  <rect x="250" y="20" width="12" height="180" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                  <rect x="238" y="40" width="12" height="120" fill="#475569" rx="1" />
                  <rect x="235" y="45" width="3" height="110" fill="#3B82F6" />

                  {/* Person (Profile) */}
                  <g transform="translate(60, 70)" fill="#64748B">
                    {/* Head */}
                    <circle cx="0" cy="0" r="10" />
                    {/* Nose */}
                    <path d="M 8,-2 L 12,2 L 8,5 Z" />
                    {/* Body */}
                    <path d="M -5,12 C 5,12 10,15 10,25 L 10,60 L -5,60 Z" />
                    {/* Arm */}
                    <path d="M 0,20 C 5,20 8,25 8,45 L 3,45 C 3,30 1,25 -2,25 Z" fill="#94A3B8" />
                    {/* Legs */}
                    <path d="M -5,60 L -2,125 L -10,125 L -12,130 L 5,130 L 2,60 Z" />
                    <path d="M 2,60 L 5,125 L -3,125 L -5,130 L 12,130 L 10,60 Z" fill="#475569" />
                  </g>

                  {/* Viewing Angle Dashed Lines */}
                  <g stroke="#64748B" strokeWidth="1.5" strokeDasharray="4,4" fill="none">
                    <line x1="72" y1="72" x2="235" y2="45" />
                    <line x1="72" y1="72" x2="235" y2="155" />
                    <line x1="72" y1="72" x2="235" y2="72" />
                  </g>

                  {/* Angle Arc with Arrows */}
                  <g stroke="#64748B" strokeWidth="1.5" fill="none">
                    <path d="M 150,58 A 90,90 0 0,0 150,115" />
                    {/* Top Arrow */}
                    <polygon points="150,58 145,65 155,62" fill="#64748B" stroke="none" />
                    {/* Bottom Arrow */}
                    <polygon points="150,115 145,108 155,111" fill="#64748B" stroke="none" />
                  </g>

                  {/* Distance Dimension Line */}
                  <g stroke="#64748B" strokeWidth="1.5">
                    <line x1="80" y1="150" x2="220" y2="150" />
                    {/* Left Arrow */}
                    <polygon points="80,150 88,146 88,154" fill="#64748B" stroke="none" />
                    {/* Right Arrow */}
                    <polygon points="220,150 212,146 212,154" fill="#64748B" stroke="none" />
                    {/* Vertical boundary lines */}
                    <line x1="80" y1="140" x2="80" y2="160" />
                    <line x1="220" y1="140" x2="220" y2="160" />
                  </g>
                </svg>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{t('wizard.viewingDistance.vizLabel')}</p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl flex gap-3 items-start border border-white/20 mb-10">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {t('wizard.viewingDistance.infoBox')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepPixelPitch({ state, updateState, userProfile, wizardSettings, t }: { state: ConfigState, updateState: any, userProfile: UserProfile | null, wizardSettings: WizardSettings, t: any }) {
  const allPitches = wizardSettings?.pixelPitches || [];
  const uniquePitches = Array.from(new Map(allPitches.map(p => [p.value, p])).values());
  const pixelPitches = uniquePitches;
  const pixelPitchImageUrl = wizardSettings?.pixelPitchImageUrl;
  const [customImage, setCustomImage] = useState<string | null>(null);
  const mainImage = customImage || pixelPitchImageUrl || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=90&w=2000"; // City skyline

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
    }
  };

  // Mock technical details based on pitch and dimensions
  const pitchValue = parseFloat(state.pixelPitch.replace('P', '')) || 0;
  const resX = Math.round((state.width * 1000) / pitchValue);
  const resY = Math.round((state.height * 1000) / pitchValue);
  const brightness = state.environment === 'exterieur' ? '5500 nits' : state.environment === 'semi-exterieur' ? '3500 nits' : '1200 nits';

  return (
    <div className="flex flex-col space-y-4 bg-transparent">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 leading-tight mb-2 text-center">{t('wizard.pixelPitch.title')}</h2>
        <div className="center flex justify-center items-center gap-2">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('wizard.viewingDistance.label')}</p>
          <p className="text-slate-900 text-[11px] font-black">{state.viewingDistance}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: Image Preview */}
        <div className="space-y-4">
          <div className="w-full max-w-[300px] ml-auto h-72 md:h-[350px] lg:h-[480px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative group">
              <img
                src={mainImage}
                alt="LED Content"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              {userProfile?.role === 'admin' && (
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-2">
                  <Maximize className="w-8 h-8 rotate-45" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">Remplacer la photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
              <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay pointer-events-none" />
            </div>
          </div>
          <p className="text-center lg:text-center text-xs text-slate-500 leading-relaxed px-4 max-w-[300px] ml-auto">
            {t('wizard.pixelPitch.description')}
          </p>
        </div>

        {/* Right: Selection */}
        <div className="w-full space-y-4">
          <div className="space-y-3 py-1">
            {/* Small Buttons Grid */}
            <div className="grid grid-cols-2 gap-3">
              {pixelPitches.map((p) => (
                <div key={p.id} className="relative">
                  <button
                    onClick={() => updateState({ pixelPitch: p.value })}
                    className={cn(
                      "group w-full py-3 px-6 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all flex items-center justify-between",
                      state.pixelPitch === p.value
                        ? "bg-black border-black text-[#c6ff00] shadow-2xl scale-[1.02]"
                        : "bg-white/40 backdrop-blur-md border-white/50 text-slate-500 hover:border-black"
                    )}
                  >
                    <span>{p.value}</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                      state.pixelPitch === p.value ? "border-[#c6ff00] bg-[#c6ff00] text-black" : "border-slate-200 group-hover:border-black"
                    )}>
                      {state.pixelPitch === p.value && <Check className="w-3 h-3" strokeWidth={4} />}
                    </div>
                  </button>
                  {p.recommended && (
                    <span className="absolute -top-2.5 right-2 bg-blue-500 text-[10px] text-white px-2 py-0.5 rounded-full font-medium shadow-sm z-20">
                      {t('wizard.pixelPitch.recommended')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Technical Details Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-sm font-black text-slate-900 mb-2">{t('wizard.pixelPitch.technicalDetails')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('wizard.pixelPitch.resolution')}</p>
                    <p className="text-xs font-black text-slate-900">{resX}x{resY}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('wizard.pixelPitch.brightness')}</p>
                    <p className="text-xs font-black text-slate-900">{brightness.split(' ')[0]} nits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepDimensions({ state, updateState, settings, setIsInteracting, t }: { state: ConfigState, updateState: any, settings: Settings, setIsInteracting?: (val: boolean) => void, t: any }) {
  return (
    <div className="flex flex-col space-y-5 bg-transparent">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[28px] font-bold text-slate-900 text-center">{t('wizard.dimensions.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic mt-1">
          {t('wizard.dimensions.description')}
        </p>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative w-full h-52 md:h-[320px] lg:h-[400px] xl:h-[450px] rounded-[2.5rem] p-[2px] bg-transparent overflow-hidden">
          <div className="w-full h-full rounded-[2.3rem] overflow-hidden relative bg-transparent">
            <Preview
              width={state.width}
              height={state.height}
              screenImageUrl={settings.previewScreenImageUrl}
              humanScaleImageUrl={settings.previewHumanScaleImageUrl}
              noAnimation={true}
              humanPosition={'side'}
              fixedHuman={true}
            />
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); setIsInteracting?.(true); }}
        onPointerUp={() => setIsInteracting?.(false)}
        onPointerLeave={() => setIsInteracting?.(false)}
        className="relative p-5 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/40 shadow-xl space-y-5 before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-br before:from-white/30 before:to-transparent before:opacity-50 before:pointer-events-none"
      >
        <div className="relative z-10 space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-bold text-slate-800">{t('wizard.dimensions.width')}</Label>
            <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200">
              <button onClick={() => updateState({ width: Math.max(0.5, state.width - 0.5) })} className="p-1 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="w-12 text-center font-black text-sm">{state.width.toFixed(2)}</span>
              <button onClick={() => updateState({ width: Math.min(20, state.width + 0.5) })} className="p-1 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <input
            type="range" min="0.5" max="20" step="0.5"
            value={state.width}
            onChange={(e) => updateState({ width: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200/60 rounded-lg appearance-none cursor-pointer accent-[#c6ff00]"
          />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-bold text-slate-800">{t('wizard.dimensions.height')}</Label>
            <div className="flex items-center gap-2 bg-slate-50/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200">
              <button onClick={() => updateState({ height: Math.max(0.5, state.height - 0.5) })} className="p-1 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <span className="w-12 text-center font-black text-sm">{state.height.toFixed(2)}</span>
              <button onClick={() => updateState({ height: Math.min(12, state.height + 0.5) })} className="p-1 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <input
            type="range" min="0.5" max="12" step="0.5"
            value={state.height}
            onChange={(e) => updateState({ height: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-200/60 rounded-lg appearance-none cursor-pointer accent-[#c6ff00]"
          />
        </div>
      </div>

      <div className="info-box p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
        <div className="info-title flex items-center gap-2 text-slate-800">
          <Calculator className="w-5 h-5 text-orange-500" />
          <span>{t('wizard.dimensions.aspectRatio')}</span>
        </div>
        <div className="info-value text-primary mb-3">
          {t('wizard.dimensions.calculated')} : {calculateRatio(state.width, state.height)}
        </div>

        <div className="info-note text-blue-600/80 uppercase">
          <Info className="w-4 h-4 shrink-0" />
          <span>{t('wizard.dimensions.note')}</span>
        </div>

        {/* Configuration dalles */}
        <div className="mt-6 pt-4 border-t border-blue-200/60">
          {(() => {
            const DALLE_SIZE_M = 0.5;
            const dallesLargeur = Math.ceil(state.width / DALLE_SIZE_M);
            const dallesHauteur = Math.ceil(state.height / DALLE_SIZE_M);
            const totalDalles = dallesLargeur * dallesHauteur;
            return (
              <>
                <div className="info-title flex items-center gap-2 text-slate-800" style={{ marginTop: 0 }}>
                  <Grid className="w-5 h-5 text-orange-500" />
                  <span>{t('wizard.dimensions.tileConfig')}</span>
                </div>
                <div className="info-note text-blue-700">
                  <Info className="w-4 h-4 shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: t('wizard.dimensions.tileCount', { count: totalDalles, w: dallesLargeur, h: dallesHauteur }) }} />
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export function StepInstallationPhoto({ state, updateState, t }: { state: ConfigState, updateState: any, t: any }) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateState({ installationPhoto: url });
    }
  };

  return (
    <div className="flex flex-col space-y-6 bg-transparent">
      <div className="w-full">
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#0f172a] leading-tight mb-2 text-center">{t('wizard.photo.title')}</h2>
        <p className="text-[14px] text-slate-600 leading-relaxed text-center">
          {t('wizard.photo.description')}
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto h-72 md:h-[350px] lg:h-[300px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
        <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
          <AnimatePresence mode="wait">
            {state.installationPhoto ? (
              <motion.img
                key="uploaded"
                src={state.installationPhoto}
                alt="Installation"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#1a202c] flex items-center justify-center"
              >
                <div className="w-[75%] h-[75%] bg-white shadow-[0_0_60px_rgba(255,255,255,0.9)]" />
                <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-gradient-to-r from-black/80 to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-[12%] bg-gradient-to-l from-black/80 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div>
        <div className="p-5 md:p-8 border-2 border-dashed border-white/50 rounded-3xl bg-white/20 backdrop-blur-md flex flex-col items-center mb-8">
          <div className="flex items-center gap-6 md:gap-10 mb-6">
            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Camera size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.camera')}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="w-px h-12 bg-slate-200" />

            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Upload size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.gallery')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
            {state.installationPhoto ? t('wizard.photo.change') : t('wizard.photo.add')}
          </p>
        </div>

        <div className="p-5 bg-white/10 backdrop-blur-md rounded-xl flex gap-3.5 items-start border border-white/20">
          <Info className="w-5 h-5 text-[#2b4c7e] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-bold text-[#2b4c7e] uppercase tracking-wider mb-1.5">{t('wizard.photo.expertAdviceTitle')}</h4>
            <p className="text-[14px] text-[#2b4c7e] leading-relaxed">
              {t('wizard.photo.expertAdviceDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepRentalDatesAndPhoto({ state, updateState, t }: { state: ConfigState, updateState: any, t: any }) {
  const handleDateChange = (range: DateRange | undefined) => {
    if (range?.from) {
      updateState({ rentalStartDate: range.from.toISOString() });
    }
    if (range?.to) {
      updateState({ rentalEndDate: range.to.toISOString() });
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateState({ installationPhoto: url });
    }
  };

  const startDate = state.rentalStartDate ? new Date(state.rentalStartDate) : undefined;
  const endDate = state.rentalEndDate ? new Date(state.rentalEndDate) : undefined;

  return (
    <div className="flex flex-col flex-1 p-0 space-y-6 bg-transparent">
      <div className="w-full px-6 pt-2">
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#0f172a] leading-tight mb-2 text-center">{t('wizard.rental.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic">
          {t('wizard.rental.description')}
        </p>
      </div>

      <div className="px-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('wizard.rental.datesLabel')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate && endDate ? (
                      <>
                        {format(startDate, "dd LLL, y")} -{" "}
                        {format(endDate, "dd LLL, y")}
                      </>
                    ) : (
                      <span>{t('wizard.rental.pickRange')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={handleDateChange}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>{t('wizard.rental.hoursLabel')}</Label>
              <div className="flex items-center gap-2">
                <Select value={state.rentalStartTime || '08:00'} onValueChange={(value) => updateState({ rentalStartTime: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`).map(hour => (
                      <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">{t('wizard.rental.to')}</span>
                <Select value={state.rentalEndTime || '18:00'} onValueChange={(value) => updateState({ rentalEndTime: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`).map(hour => (
                      <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h3 className="text-xl font-bold text-[#0f172a] leading-tight mb-3">{t('wizard.photo.title')} ({t('wizard.photo.optional') || 'Optionnel'})</h3>
        <div className="w-full h-48 md:h-64 relative rounded-xl overflow-hidden shadow-inner bg-slate-900 shrink-0">
          <AnimatePresence mode="wait">
            {state.installationPhoto ? (
              <motion.img
                key="uploaded"
                src={state.installationPhoto}
                alt="Installation"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#1a202c] flex items-center justify-center"
              >
                <div className="w-[75%] h-[75%] bg-white shadow-[0_0_60px_rgba(255,255,255,0.9)]" />
                <div className="absolute left-0 top-0 bottom-0 w-[12%] bg-gradient-to-r from-black/80 to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-[12%] bg-gradient-to-l from-black/80 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-[#f4f6f9] flex flex-col items-center mt-8">
          <div className="flex items-center gap-10 mb-6">
            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Camera size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.camera')}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="w-px h-12 bg-slate-200" />

            <label className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Upload size={28} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.gallery')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
            {state.installationPhoto ? t('wizard.photo.change') : t('wizard.photo.add')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StepSummary({ state, t, locale }: { state: ConfigState, t: any, locale?: string }) {
  const dateLocale = locale === 'en' ? enUS : fr;
  const area = state.width * state.height;
  const pitchValue = parseFloat(state.pixelPitch.replace('P', '')) || 2.5;
  const resX = Math.round((state.width * 1000) / pitchValue);
  const resY = Math.round((state.height * 1000) / pitchValue);
  const modules = Math.ceil(state.width / 0.5) * Math.ceil(state.height / 0.5);
  const powerMax = area * (state.environment === 'exterieur' ? 0.8 : 0.6);
  const powerAvg = powerMax * 0.35;
  const amps = Math.ceil((powerMax * 1000) / 230 / 3);

  return (
    <div className="flex-1 flex flex-col bg-transparent relative scrollbar-hide">
      <div className="w-full px-6 pt-2 pb-4">
        <h2 className="text-[24px] md:text-[28px] font-black text-[#0f172a] text-center">{t('wizard.summary.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic mt-1">
          {t('wizard.summary.description')}
        </p>
      </div>

      <div className="relative h-[280px] md:h-[400px] shrink-0 flex items-center justify-center overflow-hidden bg-transparent rounded-[2.5rem]">
        <div className="relative w-full max-w-[300px] sm:max-w-[420px] aspect-[16/9] mt-0 z-10 ml-14" style={{ perspective: '1200px' }}>
          <div className="relative w-full h-full" style={{ transform: 'rotateY(15deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-[#0f172a] border border-slate-700 shadow-2xl rounded-sm" style={{ transform: 'translateZ(-10px)' }}></div>
            <div className="absolute top-0 bottom-0 left-0 w-[10px] bg-[#1e293b] border-y border-l border-slate-600 rounded-l-sm" style={{ transform: 'rotateY(-90deg)', transformOrigin: 'left' }}></div>
            <div className="absolute inset-0 bg-[#0a192f] border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden flex items-center justify-center rounded-sm">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen" alt="LED Content" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)]" style={{ backgroundSize: '3px 3px' }}></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-purple-900/20 mix-blend-overlay"></div>
            </div>
            <div className="absolute -bottom-10 left-0 right-0 flex items-center text-[#3b82f6] font-medium text-sm" style={{ transform: 'translateZ(10px)' }}>
              <div className="h-[2px] flex-1 bg-[#3b82f6]"></div>
              <span className="whitespace-nowrap px-4 text-black md:text-white text-sm font-bold">{t('wizard.dimensions.width')} <span className="text-[#3b82f6] font-normal">{state.width.toFixed(2)} m</span></span>
              <div className="h-[2px] flex-1 bg-[#3b82f6]"></div>
            </div>
            <div className="absolute -left-10 top-0 bottom-0 flex flex-col items-center text-[#3b82f6] font-medium text-sm" style={{ transform: 'translateZ(10px)' }}>
              <div className="w-[2px] flex-1 bg-[#3b82f6]"></div>
              <span className="whitespace-nowrap py-4 text-black md:text-white text-sm font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                {t('wizard.dimensions.height')} <span className="text-[#3b82f6] font-normal">{state.height.toFixed(2)} m</span>
              </span>
              <div className="w-[2px] flex-1 bg-[#3b82f6]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-transparent p-4 sm:p-6 flex-1 relative z-20 flex flex-col items-center">
        <div className="w-full">
          <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-5 ml-1">{t('wizard.summary.technicalDetails')}</h4>
          <div className="w-full p-4 sm:p-6 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem icon={<Maximize className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" label={t('wizard.summary.area')} value={`${area.toFixed(2)} m²`} />
              <DetailItem icon={<Monitor className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" label={t('wizard.summary.resolution')} value={`${resX} x ${resY} pixels`} />
              <DetailItem icon={<Cpu className="w-5 h-5 text-fuchsia-500" />} iconBg="bg-fuchsia-50" label={t('wizard.summary.modules')} value={modules.toString()} />
              <DetailItem icon={<Zap className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" label={t('wizard.summary.powerMax')} value={`${powerMax.toFixed(1)} kW`} />
              <DetailItem icon={<Zap className="w-5 h-5 text-sky-500" />} iconBg="bg-sky-50" label={t('wizard.summary.powerAvg')} value={`${powerAvg.toFixed(1)} kW`} />
              <DetailItem icon={<Zap className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" label={t('wizard.summary.breaker')} value={`${amps}A ${t('wizard.summary.breakerType') || 'Tripolaire'}`} />

              <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>

              <DetailItem icon={<Truck className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" label={t('wizard.summary.projectType')} value={state.projectType === 'location' ? t('configurator.rental') : t('configurator.sale')} />
              <DetailItem icon={<Sun className="w-5 h-5 text-teal-500" />} iconBg="bg-teal-50" label={t('wizard.summary.environment')} value={state.environment === 'exterieur' ? t('configurator.outdoor') : state.environment === 'semi-exterieur' ? t('wizard.environment.semiOutdoorTitle') : t('configurator.indoor')} />
              <DetailItem icon={<Eye className="w-5 h-5 text-cyan-500" />} iconBg="bg-cyan-50" label={t('wizard.summary.distance')} value={state.viewingDistance} />
              <DetailItem icon={<Grid className="w-5 h-5 text-rose-500" />} iconBg="bg-rose-50" label={t('wizard.summary.pitch')} value={state.pixelPitch} />

              {state.projectType === 'location' && state.rentalStartDate && state.rentalEndDate && (
                <>
                  <div className="col-span-1 md:col-span-2 h-px bg-slate-100 my-2"></div>
                  <DetailItem icon={<CalendarIcon className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label={t('wizard.summary.rentalPeriod')} value={`${format(new Date(state.rentalStartDate), 'dd/MM/yyyy', { locale: dateLocale })} - ${format(new Date(state.rentalEndDate), 'dd/MM/yyyy', { locale: dateLocale })}`} />
                  <DetailItem icon={<Clock className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label={t('wizard.summary.hours')} value={`${state.rentalStartTime || '08:00'} ${t('wizard.rental.to')} ${state.rentalEndTime || '18:00'}`} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, iconBg = "bg-slate-100", label, value }: { icon: React.ReactNode, iconBg?: string, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-none mb-1">{label}</span>
        <span className="text-[14px] font-black text-slate-900 leading-none">{value}</span>
      </div>
    </div>
  );
}

export function StepFinal({ state, updateState, products, settings, t, locale, hideBackButton }: { state: ConfigState, updateState: any, products?: Product[], settings: Settings, t: any, locale: string, hideBackButton?: boolean }) {
  const area = state.width * state.height;
  const pitchValue = parseFloat(state.pixelPitch.replace('P', '')) || 2.5;

  const filteredProducts = (products || []).filter(p => {
    if (!p.pitch && !p.distance) return true;
    const productPitch = p.pitch ? parseFloat(String(p.pitch).replace('P', '')) : null;
    if (productPitch !== null) {
      const diff = Math.abs(productPitch - pitchValue);
      if (diff > 1.5) return false;
    }
    return true;
  });

  const hasMatchingProducts = filteredProducts.length > 0;

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPitch = a.pitch ? parseFloat(String(a.pitch).replace('P', '')) || 999 : 999;
    const bPitch = b.pitch ? parseFloat(String(b.pitch).replace('P', '')) || 999 : 999;
    return Math.abs(aPitch - pitchValue) - Math.abs(bPitch - pitchValue);
  });

  return (
    <div className="bg-transparent font-sans flex flex-col">
      <div className="w-full p-6 text-center">
        <h2 className="text-[24px] md:text-[28px] font-black text-[#0f172a] uppercase tracking-[0.2em]">{t('wizard.products.title')}</h2>
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-2">
          {t('wizard.products.config')} {state.pixelPitch} • {area.toFixed(2)}m²
        </p>
      </div>

      <div className="flex-1 p-0 scrollbar-hide px-6">
        {!hasMatchingProducts && (
          <ProductNotFound
            onReset={() => updateState({ step: 1 })}
            onBack={() => updateState({ step: 7 })}
            pitch={state.pixelPitch}
            environment={state.environment === 'exterieur' ? t('configurator.outdoor') : state.environment === 'semi-exterieur' ? t('wizard.environment.semiOutdoorTitle') : t('configurator.indoor')}
            hideBackButton={hideBackButton}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {sortedProducts.map((product) => {
            const isSelected = state.selectedProduct === product.id;
            const area = state.width * state.height;
            const quantity = state.quantity || 1;
            let unitPrice = 0;
            if (state.projectType === 'vente') {
              unitPrice = (product.salePricePerSqM || 0) * area;
            } else {
              unitPrice = (product.rentalPricePerDay || 0) * area;
            }
            const totalPrice = unitPrice * quantity;

            return (
              <div
                key={product.id}
                className={cn(
                  "group cursor-pointer transition-all duration-500",
                  isSelected ? "opacity-100" : "opacity-90 hover:opacity-100"
                )}
                onClick={() => updateState({ selectedProduct: product.id })}
              >
                <div className={cn(
                  "relative aspect-square bg-gray-50 rounded-2xl border transition-all duration-500 overflow-hidden mb-4",
                  isSelected ? "border-[#c6ff00] border-4 shadow-2xl shadow-black/10 scale-[1.02]" : "border-gray-100 group-hover:border-gray-300"
                )}>
                  <img
                    src={product.imageUrl || product.image || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=90&w=1200"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    {product.videoUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(product.videoUrl, '_blank'); }}
                        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {product.productUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(product.productUrl, '_blank'); }}
                        className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all"
                      >
                        <Info size={16} />
                      </button>
                    )}
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                      <div className="w-12 h-12 bg-[#c6ff00] text-black rounded-full flex items-center justify-center shadow-2xl">
                        <Check size={28} strokeWidth={4} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black uppercase tracking-[0.1em] text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                    {product.pitch && <span className="font-black text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">{product.pitch}</span>}
                  </div>
                  <p className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">
                    {product.type.join(' • ')}
                  </p>

                  <div className="pt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('wizard.products.priceLabel')}</p>
                    {settings.isPriceHidden && totalPrice > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-black/30 animate-pulse blur-[2px] select-none">{t('configurator.estimating')}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg font-black text-slate-900">
                          {totalPrice > 0 ? `${totalPrice.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} €` : t('wizard.products.onEstimate') || 'Sur estimation'}
                        </p>
                        {quantity > 1 && (
                          <p className="text-[10px] font-bold text-slate-400 italic">
                            {t('wizard.products.perUnit', { price: unitPrice.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US') })}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-4 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="font-black uppercase tracking-[0.1em] text-[9px] ml-2 text-gray-400">{t('wizard.products.quantity')}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateState({ quantity: Math.max(1, (state.quantity || 1) - 1) }) }}
                          className="w-8 h-8 rounded-full bg-[#c6ff00] text-black flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronLeft size={14} strokeWidth={3} />
                        </button>
                        <span className="font-black text-xs w-4 text-center">{state.quantity || 1}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateState({ quantity: (state.quantity || 1) + 1 }) }}
                          className="w-8 h-8 rounded-full bg-[#c6ff00] text-black flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronRight size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); updateState({ selectedProduct: product.id }) }}
                  className={cn(
                    "w-full mt-6 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center transition-all active:scale-95 shadow-sm",
                    isSelected
                      ? "bg-black text-[#c6ff00] shadow-2xl shadow-black/20"
                      : "bg-white/40 backdrop-blur-md text-black border border-gray-100 hover:bg-black hover:text-[#c6ff00] hover:shadow-2xl hover:shadow-black/10"
                  )}
                >
                  {isSelected ? t('wizard.products.selected') : t('wizard.products.select')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---
function calculateRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const common = gcd(Math.round(w * 100), Math.round(h * 100));
  const rw = Math.round(w * 100) / common;
  const rh = Math.round(h * 100) / common;

  // Common ratios detection
  const ratio = w / h;
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9 (HD)";
  if (Math.abs(ratio - 4 / 3) < 0.05) return "4:3 (Standard)";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9 (Ultrawide)";
  if (Math.abs(ratio - 1) < 0.05) return "1:1";

  return `${rw}:${rh}`;
}
