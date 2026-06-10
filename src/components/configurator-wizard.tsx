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
  Settings2,
  ChevronDown,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfigState, INITIAL_STATE, ProjectType, Environment, ViewingDistance, PixelPitch } from '@/lib/configurator-wizard-types';
import { Button } from './ui/button';
import { ConfiguredProduct, Product, Settings, UserProfile, WizardSettings } from '@/lib/types';
import { getBlockedPeriods, getProductRentalAvailabilityAction, getProductBlockedPeriodsAction } from '@/app/actions/quote-actions';
import Preview from './preview';
import StepDimensionsOriginal from './StepDimensions';
import { StepProjectType } from './StepProjectType';
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
import { ProductComparator } from './product-comparator';

// --- Wizard Component ---
interface ConfiguratorWizardProps {
  onComplete: (product: ConfiguredProduct | ConfiguredProduct[]) => void;
  onBack: () => void;
  allProducts: Product[];
  settings: Settings;
  wizardSettings: WizardSettings;
  initialStep?: number;
  initialConfiguredProduct?: ConfiguredProduct;
}

function HorizontalStepper({ currentStep, onStepClick, isMobile, t }: { currentStep: number, onStepClick: (step: number) => void, isMobile: boolean, t: any }) {
  const steps = [
    { id: 1, icon: <Grid size={18} />, label: t('wizard.steps.project') },
    { id: 2, icon: <Monitor size={18} />, label: t('wizard.steps.config') },
    { id: 5, icon: <Wrench size={18} />, label: t('wizard.steps.install') },
    { id: 7, icon: <Calculator size={18} />, label: t('wizard.steps.estimate') },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 w-full py-2">
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

export function ConfiguratorWizard({ onComplete, onBack, allProducts, settings, wizardSettings, initialStep = 1, initialConfiguredProduct }: ConfiguratorWizardProps) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<ConfigState>(() => {
    if (initialConfiguredProduct) {
      const projectType = initialConfiguredProduct.transactionType === 'rental' ? 'location' : 'vente';
      const envRevMap: Record<'indoor' | 'outdoor' | 'showcase', 'interieur' | 'semi-exterieur' | 'exterieur'> = {
        'indoor': 'interieur',
        'showcase': 'semi-exterieur',
        'outdoor': 'exterieur'
      };
      const environment = envRevMap[initialConfiguredProduct.productType] || 'interieur';
      
      const prod = allProducts.find(p => p.id === initialConfiguredProduct.productId);
      const pixelPitch = prod?.pitch || 'P2.5';
      const viewingDistance = prod?.distance || '2-5m';

      return {
        ...INITIAL_STATE,
        step: initialStep,
        projectType,
        width: initialConfiguredProduct.width,
        height: initialConfiguredProduct.height,
        quantity: initialConfiguredProduct.quantity || 1,
        selectedProduct: initialConfiguredProduct.productId,
        selectedProducts: [initialConfiguredProduct.productId],
        environment,
        pixelPitch,
        viewingDistance,
        rentalStartDate: initialConfiguredProduct.rentalPeriod?.from ? new Date(initialConfiguredProduct.rentalPeriod.from).toISOString() : null,
        rentalEndDate: initialConfiguredProduct.rentalPeriod?.to ? new Date(initialConfiguredProduct.rentalPeriod.to).toISOString() : null,
        rentalStartTime: initialConfiguredProduct.rentalStartTime || '08:00',
        rentalEndTime: initialConfiguredProduct.rentalEndTime || '18:00',
        installationPhoto: initialConfiguredProduct.installationPhoto || null,
        isCurved: initialConfiguredProduct.isCurved || false,
        is360: initialConfiguredProduct.is360 || false,
        diameter: initialConfiguredProduct.diameter || 2,
        cabinetAngle: initialConfiguredProduct.cabinetAngle || 5.625,
        curveLeft: initialConfiguredProduct.curveLeft || 0,
        curveRight: initialConfiguredProduct.curveRight || 0,
      };
    }
    return {
      ...INITIAL_STATE,
      step: initialStep
    };
  });
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
      if (prev.step === 6 && prev.projectType === 'location' && (!prev.rentalStartDate || !prev.rentalEndDate)) {
        return prev;
      }
      if (prev.step === 8) {
        const isMulti = prev.selectionMode === 'multi';
        if (!isMulti && !prev.selectedProduct) return prev; // Prevent completion without selection
        if (isMulti && (!prev.selectedProducts || prev.selectedProducts.length === 0)) return prev;

        const matchingProduct = allProducts.find(p =>
          p.availableFor.includes((prev.projectType === 'vente' ? 'sale' : 'rental') as 'sale' | 'rental') &&
          p.type.includes(prev.environment as any)
        );

        const isRental = prev.projectType === 'location';

        const rentalPeriod = isRental && prev.rentalStartDate && prev.rentalEndDate
          ? { from: new Date(prev.rentalStartDate), to: new Date(prev.rentalEndDate) }
          : isRental ? { from: new Date(), to: new Date() } : undefined;

        let calculatedDuration = 1;
        if (isRental && prev.rentalStartDate && prev.rentalEndDate) {
          const fromDate = new Date(prev.rentalStartDate);
          const toDate = new Date(prev.rentalEndDate);
          calculatedDuration = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        }

        const envMap: Record<string, 'indoor' | 'outdoor' | 'showcase'> = {
          'interieur': 'indoor',
          'semi-exterieur': 'showcase',
          'exterieur': 'outdoor'
        };

        if (isMulti) {
          const configuredProductsList: ConfiguredProduct[] = prev.selectedProducts.map((productId, idx) => {
            const productQty = prev.quantities?.[productId] || 1;
            return {
              id: `config_${Date.now()}_${idx}`,
              productId: productId,
              productType: envMap[prev.environment] || 'indoor',
              width: prev.width,
              height: prev.height,
              quantity: productQty,
              transactionType: prev.projectType === 'vente' ? 'sale' : 'rental',
              rentalDuration: calculatedDuration,
              rentalUnit: 'day',
              rentalPeriod: rentalPeriod,
              rentalDate: isRental && prev.rentalStartDate ? new Date(prev.rentalStartDate) : undefined,
              rentalStartTime: isRental ? prev.rentalStartTime || '08:00' : undefined,
              rentalEndTime: isRental ? prev.rentalEndTime || '18:00' : undefined,
              installationPhoto: prev.installationPhoto || undefined,
              screenLayout: prev.is360 ? 'cylindrical' : prev.isCurved ? 'curved' : 'flat',
              isCurved: prev.isCurved,
              is360: prev.is360,
              diameter: prev.is360 ? prev.diameter : undefined,
              cabinetAngle: prev.cabinetAngle,
              curveLeft: prev.isCurved ? prev.curveLeft : undefined,
              curveRight: prev.isCurved ? prev.curveRight : undefined,
            };
          });
          onComplete(configuredProductsList as any);
        } else {
          const productId = prev.selectedProduct !== null ? String(prev.selectedProduct) : (matchingProduct?.id ?? allProducts[0]?.id ?? 'fallback-product-id');
          const configuredProduct: ConfiguredProduct = {
            id: `config_${Date.now()}`,
            productId: productId,
            productType: envMap[prev.environment] || 'indoor',
            width: prev.width,
            height: prev.height,
            quantity: prev.quantity || 1,
            transactionType: prev.projectType === 'vente' ? 'sale' : 'rental',
            rentalDuration: calculatedDuration,
            rentalUnit: 'day',
            rentalPeriod: rentalPeriod,
            rentalDate: isRental && prev.rentalStartDate ? new Date(prev.rentalStartDate) : undefined,
            rentalStartTime: isRental ? prev.rentalStartTime || '08:00' : undefined,
            rentalEndTime: isRental ? prev.rentalEndTime || '18:00' : undefined,
            installationPhoto: prev.installationPhoto || undefined,
            screenLayout: prev.is360 ? 'cylindrical' : prev.isCurved ? 'curved' : 'flat',
            isCurved: prev.isCurved,
            is360: prev.is360,
            diameter: prev.is360 ? prev.diameter : undefined,
            cabinetAngle: prev.cabinetAngle,
            curveLeft: prev.isCurved ? prev.curveLeft : undefined,
            curveRight: prev.isCurved ? prev.curveRight : undefined,
          };
          onComplete(configuredProduct);
        }
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
    if (step === 1) {
      onBack();
    } else {
      setState(prev => ({ ...prev, step }));
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 bg-[#FAF8F5] md:h-full md:overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <main
          ref={mainRef}
          className="flex-1 md:overflow-y-auto flex flex-col bg-[#FAF8F5] relative scrollbar-hide overflow-x-hidden"
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
            >
              <div className={cn(
                "w-full mx-auto flex-col pt-0 pb-6 transition-all duration-500",
                state.step === 5 ? "max-w-[1550px] px-6" : (state.step === 1 ? "max-w-7xl px-4" : "max-w-5xl")
              )}>
                <HorizontalStepper
                  currentStep={state.step}
                  onStepClick={handleStepClick}
                  isMobile={isMobile}
                  t={t}
                />
                <div>
                  {renderStep(state, updateState, userProfile, wizardSettings, settings, allProducts, setIsInteracting, t, locale)}
                </div>
                
                <footer className="p-4 md:p-6 bg-transparent mt-4">
                  <div className="relative p-1.5 bg-black/20 backdrop-blur-md border border-white/50 rounded-[24px] pointer-events-auto w-full max-w-[650px] mx-auto before:absolute before:inset-0 before:rounded-[24px] before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-[24px] after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
                    <div className="relative z-10 flex items-center gap-2 w-full">
                      {/* Bouton Retour */}
                      <button
                        onClick={prevStep}
                        className="w-12 h-12 rounded-[16px] bg-black text-white flex items-center justify-center transition-all duration-300 hover:bg-[#c6ff00] hover:text-black active:scale-90 shrink-0"
                      >
                        <ChevronLeft size={20} strokeWidth={3} />
                      </button>

                      {/* Bouton Suivant (Capsule Noire) */}
                      <button
                        onClick={nextStep}
                        disabled={
                          (state.step === 8 && (state.selectionMode === 'multi' ? (!state.selectedProducts || state.selectedProducts.length === 0) : !state.selectedProduct)) ||
                          (state.step === 6 && state.projectType === 'location' && (!state.rentalStartDate || !state.rentalEndDate))
                        }
                        className={cn(
                          "flex-1 h-12 bg-black rounded-[18px] flex items-center px-6 transition-all duration-300 group active:scale-[0.98] overflow-hidden relative",
                          ((state.step === 8 && (state.selectionMode === 'multi' ? (!state.selectedProducts || state.selectedProducts.length === 0) : !state.selectedProduct)) ||
                           (state.step === 6 && state.projectType === 'location' && (!state.rentalStartDate || !state.rentalEndDate))) &&
                          "opacity-50 cursor-not-allowed grayscale"
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
            </motion.div>
          </AnimatePresence>
        </main>

        
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
    case 4: return <StepPixelPitch state={state} updateState={updateState} userProfile={userProfile} wizardSettings={wizardSettings} t={t} locale={locale} />;
    case 5: return <StepDimensions state={state} updateState={updateState} settings={settings} setIsInteracting={setIsInteracting} t={t} />;
    case 6: return state.projectType === 'location' ? <StepRentalDatesAndPhoto state={state} updateState={updateState} products={products} t={t} locale={locale} /> : <StepInstallationPhoto state={state} updateState={updateState} t={t} />;
    case 7: return <StepSummary state={state} t={t} locale={locale} />;
    case 8: return <StepFinal state={state} updateState={updateState} products={products} settings={settings} t={t} locale={locale!} hideBackButton={true} />;
    default: return null;
  }
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
          <div className="w-full lg:max-w-[320px] lg:ml-auto h-72 md:h-[450px] lg:h-[520px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
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
          <p className="text-center text-[15px] font-medium text-slate-500 px-4 w-full lg:max-w-[320px] lg:ml-auto">
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
                    : `border-slate-200 bg-[#FAF8F5] hover:shadow-lg hover:-translate-y-1 ${colors.hoverBorder}`
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
  const mainImage = viewingDistanceImageUrl || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=90&w=2000";

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
          <div className="w-full lg:max-w-[300px] lg:ml-auto h-72 md:h-[350px] lg:h-[480px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
              <img
                src={mainImage}
                alt="Viewing Distance Context"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
              />
            </div>
          </div>
          <p className="text-center text-[12px] font-medium text-slate-500 italic px-4 w-full lg:max-w-[300px] lg:ml-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepPixelPitch({ state, updateState, userProfile, wizardSettings, t, locale = 'en' }: { state: ConfigState, updateState: any, userProfile: UserProfile | null, wizardSettings: WizardSettings, t: any, locale?: string }) {
  const allPitches = wizardSettings?.pixelPitches || [];
  const uniquePitches = Array.from(new Map(allPitches.map(p => [p.value, p])).values());
  const pixelPitches = uniquePitches;
  const pixelPitchImageUrl = wizardSettings?.pixelPitchImageUrl;
  const mainImage = pixelPitchImageUrl || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=90&w=2000"; // City skyline

  // Mock technical details based on pitch and dimensions
  const pitchValue = parseFloat(state.pixelPitch.replace('P', '')) || 0;
  const resX = Math.round((state.width * 1000) / pitchValue);
  const resY = Math.round((state.height * 1000) / pitchValue);
  const brightness = state.environment === 'exterieur' ? '5500 nits' : state.environment === 'semi-exterieur' ? '3500 nits' : '1200 nits';

  const marketingEquivalents: Record<string, string> = {
    'P1': 'Ultra HD / Retina',
    'P1.2': '4K+ Premium',
    'P1.5': '4K Premium',
    'P2': 'Full HD+ / 2K',
    'P2.5': 'Full HD',
    'P3': 'HD+',
    'P4': 'HD',
    'P5': 'HD Outdoor',
    'P6': 'HD Large Format',
    'P8': 'Affichage urbain',
    'P10': 'Billboard LED',
    'P16': 'Very Large Display',
    'P18': 'Very Large Display',
    'P19': 'Very Large Display'
  };

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
          <div className="w-full lg:max-w-[300px] lg:ml-auto h-72 md:h-[350px] lg:h-[480px] relative rounded-[2.5rem] overflow-hidden shadow-sm p-2 bg-transparent shrink-0">
            <div className="w-full h-full rounded-[2.2rem] overflow-hidden relative">
              <img
                src={mainImage}
                alt="LED Content"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay pointer-events-none" />
              {/* Technical specs at bottom of card */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-5 pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg flex items-center justify-center shrink-0">
                    <Maximize className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-white/60 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{t('wizard.pixelPitch.resolution')}</span>
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] leading-tight">{resX}x{resY}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[10px] bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg flex items-center justify-center shrink-0">
                    <Sun className="w-4 h-4 text-orange-300" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-bold text-white/60 uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{t('wizard.pixelPitch.brightness')}</span>
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] leading-tight">{brightness.split(' ')[0]} nits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 leading-relaxed px-4 w-full lg:max-w-[300px] lg:ml-auto">
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
                    <div className="flex items-center gap-1.5">
                      <span>{p.value}</span>
                      {marketingEquivalents[p.value] && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className={cn(
                            "text-[10px] normal-case tracking-normal font-bold",
                            state.pixelPitch === p.value ? "text-[#c6ff00]" : "text-slate-400"
                          )}>
                            {marketingEquivalents[p.value]}
                          </span>
                        </>
                      )}
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                      state.pixelPitch === p.value ? "border-[#c6ff00] bg-[#c6ff00] text-black" : "border-slate-200 group-hover:border-black"
                    )}>
                      {state.pixelPitch === p.value && <Check className="w-3 h-3" strokeWidth={4} />}
                    </div>
                  </button>
                  {p.recommended && (
                    <span className="absolute -top-2.5 right-2 bg-blue-500 text-[10px] text-white px-2 py-0.5 rounded-full font-medium shadow-sm z-20">
                      {locale === 'fr' ? 'Recommandé' : 'Recommended'}
                    </span>
                  )}
                </div>
              ))}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

export function StepDimensions(props: any) {
  return <StepDimensionsOriginal {...props} />;
}

export function StepInstallationPhoto({ state, updateState, t }: { state: ConfigState, updateState: any, t: any }) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFile = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      updateState({ installationPhoto: url });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  };

  return (
    <div className="flex flex-col space-y-4 bg-transparent w-full">
      <div className="w-full bg-transparent">
        <h2 className="text-[24px] md:text-[28px] font-bold text-[#0f172a] leading-tight mb-2 text-center">{t('wizard.photo.title')}</h2>
        <p className="text-[14px] text-slate-600 leading-relaxed text-center">
          {t('wizard.photo.description')}
        </p>
      </div>

      {/* Mobile Upload Controls */}
      <div className="md:hidden max-w-3xl mx-auto w-full">
        <div className="p-4 border rounded-2xl bg-white/20 backdrop-blur-md flex flex-col items-center">
          <div className="flex items-center gap-4 mb-3">
            <label className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Camera size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.camera')}</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
            </label>
            <div className="w-px h-10 bg-slate-200" />
            <label className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-black group-hover:text-[#c6ff00] transition-all duration-300">
                <Upload size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">{t('wizard.photo.gallery')}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
            </label>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">
            {state.installationPhoto ? t('wizard.photo.change') : t('wizard.photo.add')}
          </p>
        </div>
      </div>

      {/* Desktop/Tablet: Single unified zone */}
      <div className="max-w-3xl mx-auto w-full">
        {!state.installationPhoto ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('installation-photo-dropzone-input')?.click()}
            className="relative rounded-2xl border border-dashed transition-all duration-300 cursor-pointer p-4 hidden md:block w-full"
            style={{
              backgroundColor: '#F6FBE2',
              borderColor: '#DFFF00',
            }}
          >
            <input
              id="installation-photo-dropzone-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
            <div className="flex flex-col items-center justify-center py-12 text-center min-h-[320px] w-full">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300"
                style={{
                  backgroundColor: isDragging ? '#DFFF00' : '#0f172a',
                  color: isDragging ? '#0f172a' : '#DFFF00',
                }}
              >
                <Upload size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">
                {t('wizard.photo.dropzoneTitle')}
              </h3>
              <p className="text-sm text-slate-500">
                {t('wizard.photo.dropzoneSubtitle')}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 min-h-[320px] w-full">
            <img
              src={state.installationPhoto}
              alt="Installation"
              className="w-full h-full object-cover"
              style={{ minHeight: '320px' }}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-end justify-center gap-3 pb-6 opacity-0 hover:opacity-100">
              <button
                onClick={() => document.getElementById('installation-photo-replace-input')?.click()}
                className="px-5 py-2.5 bg-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ color: '#0f172a' }}
              >
                {t('wizard.photo.replacePhoto')}
              </button>
              <button
                onClick={() => updateState({ installationPhoto: null })}
                className="px-5 py-2.5 bg-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                style={{ color: '#ef4444' }}
              >
                Supprimer
              </button>
            </div>
            <input
              id="installation-photo-replace-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}
      </div>

      {/* Expert Advice - aligned with dropzone/preview width */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="p-4 rounded-2xl flex gap-3 items-start border w-full" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#1D4ED8' }}>{t('wizard.photo.expertAdviceTitle')}</h4>
            <p className="text-[13px] leading-relaxed" style={{ color: '#1E3A5F' }}>
              {t('wizard.photo.expertAdviceDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepRentalDatesAndPhoto({ state, updateState, products = [], t, locale }: { state: ConfigState, updateState: any, products?: Product[], t: any, locale: string }) {
  const dateLocale = locale === 'en' ? enUS : fr;

  const handleDateChange = (range: DateRange | undefined) => {
    if (range?.from) {
      updateState({ rentalStartDate: range.from.toISOString() });
    }
    if (range?.to) {
      updateState({ rentalEndDate: range.to.toISOString() });
    }
  }

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
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Left: Dates */}
            <div className="space-y-1.5 flex flex-col">
              <div className="h-5 flex items-center">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('wizard.rental.datesLabel')}</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal border-slate-200 rounded-xl",
                      !startDate && "text-muted-foreground"
                    )}
                    style={{ height: '40px' }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                    {startDate && endDate ? (
                      <span className="text-slate-800 font-bold text-sm">
                        {format(startDate, "dd LLL, y")} - {format(endDate, "dd LLL, y")}
                      </span>
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
                    disabled={[
                      { before: new Date(new Date().setHours(0, 0, 0, 0)) }
                    ]}
                    onSelect={handleDateChange}
                    numberOfMonths={1}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Right: Times */}
            <div className="space-y-1.5 flex flex-col">
              <div className="h-5 flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-1">{t('wizard.rental.startTime')}</Label>
                <div className="w-8 shrink-0" />
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-1">{t('wizard.rental.endTime')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={state.rentalStartTime || '08:00'} onValueChange={(value) => updateState({ rentalStartTime: value })}>
                    <SelectTrigger className="border-slate-200 rounded-xl font-bold text-slate-800 text-sm w-full" style={{ height: '40px' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`).map(hour => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="font-semibold text-slate-400 text-sm px-1 text-center w-8 shrink-0">
                  {t('wizard.rental.to')}
                </div>

                <div className="flex-1">
                  <Select value={state.rentalEndTime || '18:00'} onValueChange={(value) => updateState({ rentalEndTime: value })}>
                    <SelectTrigger className="border-slate-200 rounded-xl font-bold text-slate-800 text-sm w-full" style={{ height: '40px' }}>
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
      </div>

      <div className="border-t pt-6">
        <StepInstallationPhoto state={state} updateState={updateState} t={t} />
      </div>
    </div>
  );
}

export function StepSummary({ state, t, locale }: { state: ConfigState, t: any, locale: string }) {
  const [showMoreDetails, setShowMoreDetails] = React.useState(false);
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
      <div className="w-full px-6 pt-2 pb-1">
        <h2 className="text-[24px] md:text-[28px] font-black text-[#0f172a] text-center">{t('wizard.summary.title')}</h2>
        <p className="text-center text-[12px] font-medium text-slate-500 italic mt-1">
          {t('wizard.summary.description')}
        </p>
      </div>

      <div className="relative h-[280px] md:h-[350px] shrink-0 flex items-center justify-center overflow-hidden bg-transparent rounded-[2.5rem]">
        <div className="relative w-full max-w-[300px] sm:max-w-[420px] aspect-[16/9] mt-0 z-10 ml-14" style={{ perspective: '1200px' }}>
          <div className="relative w-full h-full" style={{ transform: 'rotateY(15deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-[#0f172a] border border-slate-700 shadow-2xl rounded-sm" style={{ transform: 'translateZ(-10px)' }}></div>
            <div className="absolute top-0 bottom-0 left-0 w-[10px] bg-[#1e293b] border-y border-l border-slate-600 rounded-l-sm" style={{ transform: 'rotateY(-90deg)', transformOrigin: 'left' }}></div>
            <div className="absolute inset-0 bg-[#0a192f] border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.15)] overflow-hidden flex items-center justify-center rounded-sm">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1080&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen" alt="LED Content" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)]" style={{ backgroundSize: '3px 3px' }}></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-transparent to-purple-900/20 mix-blend-overlay"></div>
            </div>
            <div className="absolute -bottom-10 left-0 right-0 flex items-center text-[#3b82f6] font-medium text-sm pb-4" style={{ transform: 'translateZ(10px)' }}>
              <div className="h-[2px] flex-1 bg-[#3b82f6]"></div>
              <span className="whitespace-nowrap px-4 text-black text-sm font-bold">{t('wizard.dimensions.width')} <span className="text-[#3b82f6] font-normal">{state.width.toFixed(2)} m</span></span>
              <div className="h-[2px] flex-1 bg-[#3b82f6]"></div>
            </div>
            <div className="absolute -left-10 top-0 bottom-0 flex flex-col items-center text-[#3b82f6] font-medium text-sm" style={{ transform: 'translateZ(10px)' }}>
              <div className="w-[2px] flex-1 bg-[#3b82f6]"></div>
              <span className="whitespace-nowrap py-4 text-black text-sm font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                {t('wizard.dimensions.height')} <span className="text-[#3b82f6] font-normal">{state.height.toFixed(2)} m</span>
              </span>
              <div className="w-[2px] flex-1 bg-[#3b82f6]"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-transparent p-2 sm:p-3 flex-1 relative z-20 flex flex-col items-center">
        <div className="w-full">
          <h4 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{t('wizard.summary.technicalDetails')}</h4>
          <div className="w-full p-3 sm:p-4 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <DetailItem icon={<Maximize className="w-5 h-5 text-blue-500" />} iconBg="bg-blue-50" label={t('wizard.summary.area')} value={`${area.toFixed(2)} m²`} />
              <DetailItem icon={<Monitor className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" label={t('wizard.summary.resolution')} value={`${resX} x ${resY} pixels`} />
              <DetailItem icon={<Cpu className="w-5 h-5 text-fuchsia-500" />} iconBg="bg-fuchsia-50" label={t('wizard.summary.modules')} value={modules.toString()} />
              <DetailItem icon={<Zap className="w-5 h-5 text-green-500" />} iconBg="bg-green-50" label={t('wizard.summary.powerMax')} value={`${powerMax.toFixed(1)} kW`} />
              <DetailItem icon={<Zap className="w-5 h-5 text-sky-500" />} iconBg="bg-sky-50" label={t('wizard.summary.powerAvg')} value={`${powerAvg.toFixed(1)} kW`} />
              <DetailItem icon={<Zap className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" label={t('wizard.summary.breaker')} value={`${amps}A ${t('wizard.summary.breakerType') || 'Tripolaire'}`} />
              {state.is360 ? (
                <>
                  <DetailItem icon={<Monitor className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label="Écran 360°" value={`Diamètre: ${state.diameter}m / Hauteur: ${state.height}m`} />
                  <DetailItem icon={<SlidersHorizontal className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label="Vue circulaire 360" value={state.cabinetAngle > 0 ? 'Intérieur' : 'Extérieur'} />
                </>
              ) : state.isCurved ? (
                <>
                  <DetailItem icon={<Monitor className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label="Écran incurvé" value={`${state.width}m × ${state.height}m`} />
                  <DetailItem icon={<SlidersHorizontal className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label="Inclinaison G/D" value={`${state.curveLeft || 0}° / ${state.curveRight || 0}°`} />
                </>
              ) : (
                <DetailItem icon={<Monitor className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label="Écran plat" value={`${state.width}m × ${state.height}m`} />
              )}

              <div className="col-span-1 md:col-span-3 h-px bg-slate-100 my-2"></div>
            </div>

            {/* Accordion for More Details */}
            <div className="w-full">
              <button
                onClick={() => setShowMoreDetails(!showMoreDetails)}
                className="w-full flex items-center justify-between py-2 px-1 text-slate-500 hover:text-slate-800 transition-colors group"
              >
                <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {showMoreDetails ? t('wizard.summary.lessDetails') || 'Moins de détails' : t('wizard.summary.moreDetails') || 'Plus de détails'}
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showMoreDetails ? "rotate-180" : "")} />
              </button>

              <AnimatePresence>
                {showMoreDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-slate-100 mt-2">
                      <DetailItem icon={<Truck className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" label={t('wizard.summary.projectType')} value={state.projectType === 'location' ? t('configurator.rental') : t('configurator.sale')} />
                      <DetailItem icon={<Sun className="w-5 h-5 text-teal-500" />} iconBg="bg-teal-50" label={t('wizard.summary.environment')} value={state.environment === 'exterieur' ? t('configurator.outdoor') : state.environment === 'semi-exterieur' ? t('wizard.environment.semiOutdoorTitle') : t('configurator.indoor')} />
                      <DetailItem icon={<Eye className="w-5 h-5 text-cyan-500" />} iconBg="bg-cyan-50" label={t('wizard.summary.distance')} value={state.viewingDistance} />
                      <DetailItem icon={<Grid className="w-5 h-5 text-rose-500" />} iconBg="bg-rose-50" label={t('wizard.summary.pitch')} value={state.pixelPitch} />

                      {state.projectType === 'location' && state.rentalStartDate && state.rentalEndDate && (
                        <>
                          <DetailItem icon={<CalendarIcon className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label={t('wizard.summary.rentalPeriod')} value={`${format(new Date(state.rentalStartDate), 'dd/MM/yyyy', { locale: dateLocale })} - ${format(new Date(state.rentalEndDate), 'dd/MM/yyyy', { locale: dateLocale })}`} />
                          <DetailItem icon={<Clock className="w-5 h-5 text-indigo-500" />} iconBg="bg-indigo-50" label={t('wizard.summary.hours')} value={`${state.rentalStartTime || '08:00'} ${t('wizard.rental.to')} ${state.rentalEndTime || '18:00'}`} />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
    if (p.isHidden) return false;
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

  const [showComparator, setShowComparator] = useState(false);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [videoProduct, setVideoProduct] = useState<Product | null>(null);

  const isMulti = state.selectionMode === 'multi';
  const selectedProducts = state.selectedProducts || [];

  return (
    <div className="bg-transparent font-sans flex flex-col">
      <div className="w-full p-6 text-center">
        <h2 className="text-[24px] md:text-[28px] font-black text-[#0f172a] uppercase tracking-[0.2em]">{t('wizard.products.title')}</h2>
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-2">
          {t('wizard.products.config')} {state.pixelPitch} &bull; {area.toFixed(2)}m&sup2;
        </p>

        {/* Selection mode toggle */}
        {state.projectType !== 'location' && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => updateState({ selectionMode: 'single', selectedProducts: state.selectedProduct ? [state.selectedProduct] : [] })}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                !isMulti
                  ? "bg-black text-[#c6ff00] border-black"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
              )}
            >
              <Check size={12} strokeWidth={3} />
              {locale === 'fr' ? 'S\u00e9lection' : 'Single'}
            </button>
            <button
              onClick={() => updateState({ selectionMode: 'multi', selectedProducts: state.selectedProduct ? [state.selectedProduct] : [] })}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                isMulti
                  ? "bg-black text-[#c6ff00] border-black"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
              )}
            >
              <Layers size={12} />
              {locale === 'fr' ? 'Multi-s\u00e9lection' : 'Multi-select'}
            </button>
          </div>
        )}
        {state.projectType !== 'location' && isMulti && (
          <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-2">
            {locale === 'fr'
              ? `${selectedProducts.length} / 3 produits s\u00e9lectionn\u00e9s`
              : `${selectedProducts.length} / 3 products selected`
            }
          </p>
        )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-2">
          {sortedProducts.map((product) => {
            const isSelected = isMulti
              ? selectedProducts.includes(product.id)
              : state.selectedProduct === product.id;
            const atMaxMulti = isMulti && selectedProducts.length >= 3 && !isSelected;
            const quantity = isMulti
              ? (state.quantities?.[product.id] || 1)
              : (state.quantity || 1);

            const handleSelect = () => {
              if (isMulti) {
                if (isSelected) {
                  updateState({ selectedProducts: selectedProducts.filter(id => id !== product.id) });
                } else if (!atMaxMulti) {
                  updateState({ selectedProducts: [...selectedProducts, product.id] });
                }
              } else {
                updateState({ selectedProduct: product.id });
              }
            };

            const typeLabel = product.type.map((tType: string) => {
              const tl = tType.toLowerCase();
              if (locale === 'fr') {
                if (tl.includes('indoor') || tl.includes('interieur') || tl.includes('int\u00e9rieur')) return 'Int\u00e9rieur';
                if (tl.includes('outdoor') || tl.includes('exterieur') || tl.includes('ext\u00e9rieur')) return 'Ext\u00e9rieur';
                if (tl.includes('semi')) return 'Semi-ext\u00e9rieur';
              } else {
                if (tl.includes('indoor') || tl.includes('interieur') || tl.includes('int\u00e9rieur')) return 'Indoor';
                if (tl.includes('outdoor') || tl.includes('exterieur') || tl.includes('ext\u00e9rieur')) return 'Outdoor';
                if (tl.includes('semi')) return 'Semi-outdoor';
              }
              return tType;
            }).join(' \u2022 ');

            let unitPrice = 0;
            const isRentalMode = state.projectType === 'location';
            if (product.hasDimensions && product.tileWidth && product.tileHeight && product.pricePerTile && product.pricePerTile > 0) {
              const tilesPerWidth = Math.ceil((state.width * 100) / product.tileWidth);
              const tilesPerHeight = Math.ceil((state.height * 100) / product.tileHeight);
              const totalTiles = tilesPerWidth * tilesPerHeight;
              unitPrice = totalTiles * product.pricePerTile;
              if (isRentalMode && product.rentalPricePerDay && product.rentalPricePerDay > 0) {
                unitPrice = product.rentalPricePerDay * area;
              }
            } else {
              if (state.projectType === 'vente') {
                unitPrice = (product.salePricePerSqM || 2000) * area;
              } else {
                const rentalRate = (typeof product.rentalPricePerDay === 'number' && product.rentalPricePerDay > 0)
                  ? product.rentalPricePerDay
                  : 12;
                unitPrice = rentalRate * area;
              }
            }

            const isRental = state.projectType === 'location';
            let duration = 1;
            if (isRental && state.rentalStartDate && state.rentalEndDate) {
              const startD = new Date(state.rentalStartDate);
              const endD = new Date(state.rentalEndDate);
              duration = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            }

            const totalPrice = unitPrice * quantity * duration;
            
            const hasNoPricingData = !product.pricePerTile && !product.salePricePerSqM && !product.rentalPricePerDay;
            const showOnEstimate = settings.isPriceHidden || hasNoPricingData;
            const displayedUnitPrice = isRental ? unitPrice * duration : unitPrice;

            const shortDesc = product.selectedChars && product.selectedChars.length > 0
              ? product.selectedChars.slice(0, 2).map(c => c.value).join(' \u2022 ')
              : product.pitch && product.distance
                ? `${product.pitch} \u2022 ${product.distance}`
                : product.pitch || product.distance || '';

            return (
              <div
                key={product.id}
                className={cn(
                  "group transition-all duration-500",
                  atMaxMulti ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                  isSelected ? "opacity-100" : atMaxMulti ? "" : "opacity-90 hover:opacity-100"
                )}
                onClick={atMaxMulti ? undefined : handleSelect}
              >
                {/* Image container with hover actions */}
                <div className={cn(
                  "relative aspect-square bg-gray-50 rounded-2xl border transition-all duration-500 overflow-hidden mb-4",
                  isSelected ? "border-[#c6ff00] border-4 shadow-2xl shadow-black/10 scale-[1.02]" : "border-gray-100 group-hover:border-gray-300"
                )}>
                  {/* Selected check overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#c6ff00] flex items-center justify-center shadow-2xl shadow-black/30">
                        <Check size={32} className="text-black" strokeWidth={3} />
                      </div>
                    </div>
                  )}

                  {/* Promotion badge */}
                  {product.oldPrice && product.salePricePerSqM && product.oldPrice > product.salePricePerSqM && (
                    <div className="absolute top-3 left-3 z-30">
                      <span className="px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white rounded-full">
                        -{Math.round(((product.oldPrice - product.salePricePerSqM) / product.oldPrice) * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareProductIds(prev =>
                        prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                      );
                    }}
                    className={cn(
                      "absolute top-3 right-3 z-30 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center",
                      compareProductIds.includes(product.id)
                        ? "bg-[#c6ff00] border-[#c6ff00]"
                        : "border-gray-300 bg-white/50 hover:border-gray-400"
                    )}
                    aria-label="S\u00e9lectionner pour comparer"
                  >
                    {compareProductIds.includes(product.id) && (
                      <Check size={14} className="text-black" strokeWidth={3} />
                    )}
                  </button>

                  <img
                    src={product.imageUrl || product.image || '/no-product.png'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 z-10 flex items-end justify-center pb-4 gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none group-hover:pointer-events-auto">
                    {product.videoUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setVideoProduct(product); }}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title={locale === 'fr' ? 'Voir la vid\u00e9o' : 'Watch video'}
                      >
                        <Play size={16} className="text-black fill-black ml-0.5" />
                      </button>
                    )}
                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title={locale === 'fr' ? "Plus d'informations" : 'More information'}
                      >
                        <Info size={16} className="text-black" />
                      </a>
                    )}

                  </div>
                </div>

                {/* Product info */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black uppercase tracking-[0.1em] text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                    {product.pitch && <span className="font-black text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ml-2">{product.pitch}</span>}
                  </div>

                  <p className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">{typeLabel}</p>

                  {shortDesc && (
                    <p className="text-[10px] text-gray-500 font-medium leading-snug line-clamp-1">{shortDesc}</p>
                  )}

                  <div className="pt-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('wizard.products.priceLabel')}</p>
                    {showOnEstimate ? (
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-black/30 animate-pulse blur-[2px] select-none">{t('configurator.estimating')}</span>
                      </div>
                    ) : (
                      <>
                        {product.oldPrice && state.projectType === 'vente' && (
                          <p className="text-sm font-semibold text-orange-500 line-through">
                            {(product.oldPrice * area * quantity).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} &#8364;
                          </p>
                        )}
                        <p className="text-lg font-black text-slate-900">
                          {totalPrice > 0 ? `${totalPrice.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} \u20ac` : t('wizard.products.onEstimate') || 'Sur estimation'}
                        </p>
                        {quantity > 1 && (
                          <p className="text-[10px] font-bold text-slate-400 italic">
                            {t('wizard.products.perUnit', { price: displayedUnitPrice.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US') })}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-4 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100 font-sans">
                      <span className="font-black uppercase tracking-[0.1em] text-[9px] ml-2 text-gray-400">{t('wizard.products.quantity')}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMulti) {
                              const currentQty = state.quantities?.[product.id] || 1;
                              const newQty = Math.max(1, currentQty - 1);
                              updateState({
                                quantities: {
                                  ...(state.quantities || {}),
                                  [product.id]: newQty
                                }
                              });
                            } else {
                              updateState({ quantity: Math.max(1, (state.quantity || 1) - 1) });
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-[#c6ff00] text-black flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronLeft size={14} strokeWidth={3} />
                        </button>
                        <span className="font-black text-xs w-4 text-center">{quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMulti) {
                              const currentQty = state.quantities?.[product.id] || 1;
                              const newQty = currentQty + 1;
                              updateState({
                                quantities: {
                                  ...(state.quantities || {}),
                                  [product.id]: newQty
                                }
                              });
                            } else {
                              updateState({ quantity: (state.quantity || 1) + 1 });
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-[#c6ff00] text-black flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronRight size={14} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelect(); }}
                    disabled={atMaxMulti}
                    className={cn(
                      "w-full mt-6 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm",
                      atMaxMulti
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : isSelected
                          ? "bg-black text-[#c6ff00] shadow-2xl shadow-black/20"
                          : "bg-white/40 backdrop-blur-md text-black border border-gray-100 hover:bg-black hover:text-[#c6ff00] hover:shadow-2xl hover:shadow-black/10"
                    )}
                  >
                    {atMaxMulti
                      ? (locale === 'fr' ? 'Maximum atteint' : 'Max reached')
                      : isSelected && isMulti
                        ? (locale === 'fr' ? 'S\u00e9lectionn\u00e9 \u2022 Retirer' : 'Selected \u2022 Remove')
                        : isSelected
                          ? t('common.selected') || 'S\u00e9lectionn\u00e9'
                          : t('common.select') || 'S\u00e9lectionner'
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compare button */}
      {sortedProducts.length > 1 && (
        <div className="p-6 pt-0">
          <div className="relative group/tooltip">
            <button
              disabled={compareProductIds.length < 2}
              onClick={() => setShowComparator(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 mx-auto border",
                compareProductIds.length < 2
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-black text-white hover:bg-[#c6ff00] hover:text-black border-black hover:border-[#c6ff00] active:scale-95 cursor-pointer"
              )}
            >
              <Layers className="w-4 h-4" />
              <span>{locale === 'fr' ? 'Comparer les produits' : 'Compare products'} ({compareProductIds.length})</span>
            </button>
            {compareProductIds.length < 2 && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-3 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 text-center z-50">
                {locale === 'fr' ? 'Veuillez s\u00e9lectionner au moins 2 produits pour pouvoir les comparer' : 'Please select at least 2 products to compare them'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video modal */}
      <AnimatePresence>
        {videoProduct && videoProduct.videoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setVideoProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setVideoProduct(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black transition-all"
              >
                <X size={18} />
              </button>
              <div className="aspect-video w-full">
                <iframe
                  src={videoProduct.videoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              <div className="p-4 bg-black text-white">
                <h3 className="font-black uppercase tracking-widest text-sm">{videoProduct.name}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparator modal */}
      <AnimatePresence>
        {showComparator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-white flex flex-col"
          >
            <ProductComparator
              products={sortedProducts.filter(p => compareProductIds.includes(p.id))}
              configState={state}
              selectedProductId={state.selectedProduct || undefined}
              onSelect={(id) => {
                updateState({ selectedProduct: id });
                setShowComparator(false);
              }}
              onClose={() => setShowComparator(false)}
              locale={locale}
            />
          </motion.div>
        )}
      </AnimatePresence>
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
