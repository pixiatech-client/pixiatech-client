

'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, useRef } from 'react';
import type { Product, Settings, DeliverySettings, LaborSettings, ConfiguredProduct, QuoteDetails, Locations, WizardSettings } from '@/lib/types';
import { Configurator } from './configurator';
import Preview from './preview';
import { QuoteForm, type QuoteFormHandle } from '@/components/quote-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Stepper } from './stepper';
import { InstallationForm } from './installation-form';
import { DeliveryForm } from './delivery-form';
import { StepImagePreview } from './step-image-preview';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { differenceInDays } from 'date-fns';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2, ArrowLeft, Grid, Truck, Wrench, Calculator } from 'lucide-react';
import { FloatingFooterNav } from './ui/floating-footer-nav';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SuccessView } from './success-view';
import HintBubble from './ui/hint-bubble';
import { ConfiguratorWizard } from './configurator-wizard';
import { ConfiguratorModeSelection } from './configurator-mode-selection';
import { preloadImages } from '@/lib/image-preload';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';


type PreviewMode = 'dimension' | 'video' | 'image';

const MediaPreview = ({ url, type }: { url: string, type: 'video' | 'image' }) => {
    const { t } = useI18n();
    const getEmbedUrl = (originalUrl: string) => {
        try {
            const urlObj = new URL(originalUrl);
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                const videoId = urlObj.hostname.includes('youtu.be')
                    ? urlObj.pathname.slice(1)
                    : urlObj.searchParams.get('v');
                return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
            }
            if (urlObj.hostname.includes('vimeo.com')) {
                const videoId = urlObj.pathname.slice(1);
                return `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&autopause=0&muted=1&controls=0`;
            }
        } catch (e) {
            console.error("Invalid video URL", e);
        }
        return null;
    };

    const cleanUrl = url.split('?')[0];
    const isDirectVideo = /\.(mp4|webm|mov)$/i.test(cleanUrl);
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanUrl);
    const embedUrl = getEmbedUrl(url);

    if (isDirectVideo) {
        return (
             <div className="w-full h-full bg-black flex items-center justify-center">
                <video
                    src={url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    {t('common.videoNotSupported')}
                </video>
            </div>
        );
    }
    
    if (embedUrl) {
         return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe
                    src={embedUrl}
                    title="Product Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>
        );
    }

    if (isImage) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <Image
                    src={url}
                    alt={t('common.productPreview')}
                    fill
                    sizes="50vw"
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black flex items-center justify-center">
            <p className="text-white">{t('common.mediaPreviewNotAvailable')}</p>
        </div>
    );
};

interface QuoteBuilderProps {
  initialSettings: Settings;
  deliverySettings: DeliverySettings;
  laborSettings: LaborSettings;
  allProducts: Product[];
  locations: Locations | null;
  wizardSettings: WizardSettings;
}

export function QuoteBuilder({
  initialSettings,
  deliverySettings,
  laborSettings,
  allProducts,
  locations,
  wizardSettings: initialWizardSettings,
}: QuoteBuilderProps) {
  const { t, locale, setLocale } = useI18n();
  const [wizardSettings, setWizardSettings] = useState<WizardSettings>(initialWizardSettings);
  const [configuredProducts, setConfiguredProducts] = useState<ConfiguredProduct[]>([]);
  const [activeConfigProductId, setActiveConfigProductId] = useState<string | null>(null);
  const quoteFormRef = useRef<QuoteFormHandle>(null);

  const [baseQuote, setBaseQuote] = useState(0);
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [unconfiguredCityQuery, setUnconfiguredCityQuery] = useState<string | undefined>(undefined);
  const [isDeliveryCostFinal, setIsDeliveryCostFinal] = useState(false);
  const [installationCost, setInstallationCost] = useState(0);
  const [techniciansRequired, setTechniciansRequired] = useState(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [includeDelivery, setIncludeDelivery] = useState(true);
  
  const [previewMode, setPreviewMode] = useState<PreviewMode>('dimension');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  console.log("DEBUG: QuoteBuilder Rendered", { isSuccess, currentStep });
  const [successQuoteId, setSuccessQuoteId] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined);
  const [isHintBubbleVisible, setIsHintBubbleVisible] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isQuoteFormValid, setIsQuoteFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = useIsMobile();
  const [activeMode, setActiveMode] = useState<'selection' | 'wizard' | 'manual'>('selection');
  const [initialWizardStep, setInitialWizardStep] = useState(1);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();


  // Automatically switch to wizard mode on mobile if in selection mode
  // REMOVED: forcing selection mode everywhere as requested by user

  // Preload step images for faster loading
  useEffect(() => {
    if (initialSettings) {
      const imagesToPreload = [
        initialSettings.previewScreenImageUrl,
        initialSettings.previewHumanScaleImageUrl,
        initialSettings.deliveryImageUrl,
        initialSettings.technicianImageUrl,
        initialSettings.congratulationsImageUrl,
      ].filter(Boolean) as string[];

      if (imagesToPreload.length > 0) {
        preloadImages(imagesToPreload);
      }
    }
  }, [initialSettings]);

  const isDeliveryStepEnabled = initialSettings.isDeliveryStepEnabled ?? true;
  const isInstallationStepEnabled = initialSettings.isInstallationStepEnabled ?? true;

  const visibleSteps = useMemo(() => {
    const steps = [{ id: 1, label: 'stepper.step1', icon: Grid }];
    if (isDeliveryStepEnabled) steps.push({ id: 2, label: 'stepper.step2', icon: Truck });
    if (isInstallationStepEnabled) steps.push({ id: 3, label: 'stepper.step3', icon: Wrench });
    steps.push({ id: 4, label: 'stepper.step4', icon: Calculator });
    
    return steps.map((step, index) => ({ ...step, id: index + 1 }));
  }, [isDeliveryStepEnabled, isInstallationStepEnabled]);

  const getOriginalStep = useCallback((visibleStep: number): number => {
    const stepConfig = visibleSteps[visibleStep - 1];
    if (!stepConfig) return 1;
    if (stepConfig.label === 'stepper.step1') return 1;
    if (stepConfig.label === 'stepper.step2') return 2;
    if (stepConfig.label === 'stepper.step3') return 3;
    if (stepConfig.label === 'stepper.step4') return 4;
    return 1;
  }, [visibleSteps]);

  useEffect(() => {
    setIsHintBubbleVisible(configuredProducts.length === 0 && activeMode === 'manual');
    if (configuredProducts.length === 0) {
        setDeliveryCost(0);
        setIsDeliveryCostFinal(false);
        setSelectedCityId(null);
        setUnconfiguredCityQuery(undefined);
    }
  }, [configuredProducts.length, activeMode]);


  useEffect(() => {
      if (!isUserLoading && !user) {
          signInAnonymously(auth);
      }
  }, [isUserLoading, user, auth]);

  const refreshWizardSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/wizard-settings', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setWizardSettings(data);
      }
    } catch (error) {
      console.error('Failed to refresh wizard settings:', error);
    }
  }, []);

  useEffect(() => {
    refreshWizardSettings();
  }, []);
  
  const activeConfiguredProduct = useMemo(() => {
    return configuredProducts.find(p => p.id === activeConfigProductId);
  }, [configuredProducts, activeConfigProductId]);
  
  useEffect(() => {
    const activeProductDetails = allProducts.find(p => p.id === activeConfiguredProduct?.productId);
    const newMediaUrl = activeProductDetails?.videoUrl;

    if (previewMode !== 'dimension' && newMediaUrl) {
        const cleanUrl = newMediaUrl.split('?')[0];
        const newMediaType = /\.(mp4|webm|mov|svg)$/i.test(cleanUrl) || newMediaUrl.includes('youtube') || newMediaUrl.includes('vimeo') ? 'video' : 'image';
        setMediaUrl(newMediaUrl);
        setMediaType(newMediaType);
    } else if (previewMode !== 'dimension' && !newMediaUrl) {
        setPreviewMode('dimension');
        setMediaUrl(null);
        setMediaType(null);
    }
  }, [activeConfiguredProduct?.productId, allProducts, previewMode]);

  const calculateLineTotal = useCallback((config: ConfiguredProduct) => {
    const product = allProducts.find(p => p.id === config.productId);
    if (!product) return 0;

    const area = config.width * config.height;
    let lineTotal = 0;

    if (product.hasDimensions && product.tileWidth && product.tileHeight && product.pricePerTile && product.pricePerTile > 0) {
        const tilesPerWidth = Math.ceil((config.width * 100) / product.tileWidth);
        const tilesPerHeight = Math.ceil((config.height * 100) / product.tileHeight);
        const totalTiles = tilesPerWidth * tilesPerHeight;
        lineTotal = totalTiles * product.pricePerTile;
    } 
    else {
        if (config.transactionType === 'sale' && product.salePricePerSqM && product.salePricePerSqM > 0) {
            lineTotal = area * product.salePricePerSqM;
        } else if (config.transactionType === 'rental') {
            if (config.rentalUnit === 'day' && product.rentalPricePerDay && product.rentalPricePerDay > 0) {
                lineTotal = area * product.rentalPricePerDay;
            } else if (config.rentalUnit === 'hour' && product.rentalPricePerHour && product.rentalPricePerHour > 0) {
                lineTotal = area * product.rentalPricePerHour;
            }
        }
    }

    if (config.transactionType === 'rental') {
        const duration = config.rentalDuration > 0 ? config.rentalDuration : 1;
        lineTotal *= duration;
    }

    return lineTotal * config.quantity;
  }, [allProducts]);

  useEffect(() => {
    const newBaseQuote = configuredProducts.reduce((total, config) => {
      return total + calculateLineTotal(config);
    }, 0);
    setBaseQuote(newBaseQuote);
  }, [configuredProducts, calculateLineTotal]);

  const totalArea = useMemo(() => {
    return configuredProducts.reduce((sum, p) => {
        const product = allProducts.find(prod => prod.id === p.productId);
        if (product && product.hasDimensions !== false) {
            return sum + (p.width * p.height * p.quantity);
        }
        return sum;
    }, 0);
  }, [configuredProducts, allProducts]);

   useEffect(() => {
    if (totalArea > 0 && isInstallationStepEnabled) {
        const applicableRule = laborSettings.rules
            .slice()
            .sort((a, b) => b.minSqM - a.minSqM)
            .find(rule => totalArea >= rule.minSqM);

        if (applicableRule) {
            setInstallationCost(applicableRule.price);
            setTechniciansRequired(applicableRule.technicians);
        } else {
            setInstallationCost(0);
            setTechniciansRequired(0);
        }
    } else {
        setInstallationCost(0);
        setTechniciansRequired(0);
    }
  }, [totalArea, laborSettings.rules, isInstallationStepEnabled]);

  const totalQuoteForStep = useMemo(() => {
    let total = baseQuote;
    const finalDeliveryCost = (isDeliveryStepEnabled && includeDelivery) 
          ? deliveryCost 
          : 0;

      const finalInstallationCost = (isInstallationStepEnabled && includeInstallation)
          ? installationCost
          : 0;

      if (isDeliveryStepEnabled && includeDelivery && getOriginalStep(currentStep) >= 2) {
          total += finalDeliveryCost;
      }
      if (isInstallationStepEnabled && includeInstallation && getOriginalStep(currentStep) >= 3) {
          total += finalInstallationCost;
      }

      return total;
  }, [baseQuote, deliveryCost, includeDelivery, isDeliveryStepEnabled, installationCost, includeInstallation, isInstallationStepEnabled, currentStep, getOriginalStep]);

  const finalQuoteDetails: QuoteDetails = useMemo(() => {
      let total = baseQuote;
      const finalDeliveryCost = (isDeliveryStepEnabled && includeDelivery) 
          ? deliveryCost 
          : 0;

      const finalInstallationCost = (isInstallationStepEnabled && includeInstallation)
          ? installationCost
          : 0;

      if (isDeliveryStepEnabled && includeDelivery) {
          total += finalDeliveryCost;
      }
      if (isInstallationStepEnabled && includeInstallation) {
          total += finalInstallationCost;
      }
      
      const activeProduct = allProducts.find(p => p.id === activeConfiguredProduct?.productId);
      const activeProductType = activeProduct?.type[0] ?? 'indoor';

      return {
          products: configuredProducts.map(cp => {
              const product = allProducts.find(p => p.id === cp.productId);
              const area = cp.width * cp.height;
              let finalQuantity = cp.quantity || 1;
              let finalUnitPrice = 0;

              if (product?.hasDimensions !== false && product?.tileWidth && product?.tileHeight && product?.pricePerTile && product.pricePerTile > 0) {
                  finalQuantity = cp.quantity || 1;
                  finalUnitPrice = product.pricePerTile;
              } else if (product) {
                  if (cp.transactionType === 'sale' && product.salePricePerSqM && product.salePricePerSqM > 0) {
                      finalQuantity = area * (cp.quantity || 1);
                      finalUnitPrice = product.salePricePerSqM;
                  } else if (cp.transactionType === 'rental') {
                      if (cp.rentalUnit === 'day' && product.rentalPricePerDay && product.rentalPricePerDay > 0) {
                          finalQuantity = area * (cp.quantity || 1);
                          finalUnitPrice = product.rentalPricePerDay;
                      } else if (cp.rentalUnit === 'hour' && product.rentalPricePerHour && product.rentalPricePerHour > 0) {
                          finalQuantity = area * (cp.quantity || 1);
                          finalUnitPrice = product.rentalPricePerHour;
                      }
                  } else if ((product as any).price && (product as any).price > 0) {
                      finalUnitPrice = (product as any).price;
                  }
              }

              if (cp.transactionType === 'rental' && cp.rentalDuration > 1) {
                  finalUnitPrice *= cp.rentalDuration;
              }

              return {
                  ...cp,
                  quantity: finalQuantity,
                  unitPrice: finalUnitPrice,
                  productName: product?.name || 'Unknown',
                  lineTotal: calculateLineTotal(cp),
                  tileWidth: product?.tileWidth,
                  tileHeight: product?.tileHeight,
                  pricePerTile: product?.pricePerTile,
                  nombreEcrans: cp.quantity || 1,
                  dimensionsEnabled: !!(product?.hasDimensions || (product as any)?.dimensionsEnabled)
              };
          }),
          screenType: activeProductType,
          transactionType: activeConfiguredProduct?.transactionType ?? 'sale',
          includeInstallation,
          installationCost: finalInstallationCost,
          techniciansRequired,
          includeDelivery,
          isDeliveryCostFinal: isDeliveryCostFinal && isDeliveryStepEnabled,
          deliveryCost: finalDeliveryCost,
          unconfiguredCityQuery,
          selectedCityId,
          totalQuote: total,
          width: activeConfiguredProduct?.width ?? 0,
          height: activeConfiguredProduct?.height ?? 0,
          productName: activeConfiguredProduct?.productId ? allProducts.find(p => p.id === activeConfiguredProduct.productId)?.name || '' : '',
          rentalUnit: activeConfiguredProduct?.transactionType === 'rental' ? activeConfiguredProduct?.rentalUnit : null,
          rentalDuration: activeConfiguredProduct?.transactionType === 'rental' ? activeConfiguredProduct?.rentalDuration : null,
          rentalPeriod: activeConfiguredProduct?.transactionType === 'rental' ? activeConfiguredProduct?.rentalPeriod : undefined,
          lang: locale,
          sitePhoto: activeConfiguredProduct?.installationPhoto,
          taxRate: 0,
      };
  }, [
      baseQuote,
      configuredProducts,
      allProducts,
      activeConfiguredProduct,
      includeInstallation,
      installationCost,
      techniciansRequired,
      isInstallationStepEnabled,
      deliveryCost,
      includeDelivery,
      isDeliveryCostFinal,
      isDeliveryStepEnabled,
      selectedCityId,
      unconfiguredCityQuery,
      locale,
      calculateLineTotal,
  ]);
  
  const handleGoToModeSelection = useCallback(() => {
    setConfiguredProducts([]);
    setActiveConfigProductId(null);
    setBaseQuote(0);
    setActiveMode('selection');
    setCurrentStep(1); // Crucial: Reset to step 1
    setIsSubmitting(false);
  }, []);


  const handleBack = () => {
    setDirection(-1);
    const fromStep = getOriginalStep(currentStep);
    if (fromStep === 4) {
        setIsSubmitting(false);
    }
    if (fromStep === 2) { // Coming from Delivery to Step 1
        if (activeMode === 'wizard') {
            setInitialWizardStep(8); // Resume at the end of wizard
            setCurrentStep(1);
        } else {
            handleGoToModeSelection();
        }
    } else {
        setCurrentStep(prev => Math.max(1, prev - 1));
    }
  };
  const handleNext = () => {
    if (getOriginalStep(currentStep) === 4) {
        setIsSubmitting(true);
        try {
            quoteFormRef.current?.submit();
        } catch (error) {
            console.error("Submission failed:", error);
            setIsSubmitting(false);
        }
        return;
    }
    setDirection(1);
    setCurrentStep(prev => {
        let nextVisibleStep = prev + 1;
        if (nextVisibleStep > visibleSteps.length) return visibleSteps.length;
        
        const originalNextStep = getOriginalStep(nextVisibleStep);
        if (originalNextStep === 2 && !isDeliveryStepEnabled) nextVisibleStep++;
        if (originalNextStep === 3 && !isInstallationStepEnabled) nextVisibleStep++;
        
        return Math.min(nextVisibleStep, visibleSteps.length);
    });
  };

  const handleStepClick = (step: number) => {
    const originalStep = getOriginalStep(step);
    
    // If clicking "Configuration" (original step 1) from ANY current step, always return to mode selection
    if (originalStep === 1) {
        handleGoToModeSelection();
        return;
    }

    if (step < currentStep) {
        if (getOriginalStep(currentStep) >= 2 && originalStep < 2) {
            setDeliveryCost(0);
            setIsDeliveryCostFinal(false);
            setSelectedCityId(null);
            setUnconfiguredCityQuery(undefined);
        }
        setCurrentStep(step);
    }
  };

  const handleLocationChange = (cost: number, cityId: string | null, isFinal: boolean, unconfiguredQuery?: string) => {
    setDeliveryCost(cost);
    setSelectedCityId(cityId);
    setIsDeliveryCostFinal(isFinal);
    setUnconfiguredCityQuery(unconfiguredQuery);
  };
  
  const handleMediaToggle = (url: string, type: 'video' | 'image') => {
    if (previewMode === type && mediaUrl === url) {
        setPreviewMode('dimension');
        setMediaUrl(null);
        setMediaType(null);
    } else {
        setPreviewMode(type);
        setMediaUrl(url);
        setMediaType(type);
    }
  }

  const handleCloseMediaPreview = () => {
    setPreviewMode('dimension');
    setMediaUrl(null);
    setMediaType(null);
  }

  const handleSubmitted = (quoteId: string, email?: string) => {
    setSubmittedEmail(email);
    setIsSuccess(true);
    setSuccessQuoteId(quoteId);
  };
  
  const handleNewQuote = () => {
    setConfiguredProducts([]);
    setActiveConfigProductId(null);
    setBaseQuote(0);
    setIncludeInstallation(true);
    setDeliveryCost(0);
    setSelectedCityId(null);
    setUnconfiguredCityQuery(undefined);
    setIsDeliveryCostFinal(false);
    setInstallationCost(0);
    setTechniciansRequired(0);
    setCurrentStep(1);
    setIncludeDelivery(true);
    setPreviewMode('dimension');
    setMediaUrl(null);
    setMediaType(null);
    setIsSuccess(false);
    setSuccessQuoteId(null);
    setActiveMode('selection');
    setIsSubmitting(false);
  };

  const handleModeSelect = (mode: 'wizard' | 'manual') => {
      handleGoToModeSelection(); // Reset state
      setActiveMode(mode);
  };

  const handleWizardComplete = (product: ConfiguredProduct) => {
      setConfiguredProducts([product]);
      setActiveConfigProductId(product.id);
      // After guided wizard completion, navigate to the Delivery visible step if present
      const deliveryIndex = visibleSteps.findIndex(s => s.label === 'stepper.step2');
      if (deliveryIndex !== -1) {
          setCurrentStep(deliveryIndex + 1);
      } else {
          handleNext();
      }
  };

  const renderStepContent = () => {
      const originalStep = getOriginalStep(currentStep);

      if (originalStep === 1) {
          if (activeMode === 'selection') {
              return <ConfiguratorModeSelection onSelectMode={handleModeSelect} />;
          }
          if (activeMode === 'wizard') {
              return <ConfiguratorWizard onComplete={handleWizardComplete} onBack={handleGoToModeSelection} allProducts={allProducts} settings={initialSettings} wizardSettings={wizardSettings} initialStep={initialWizardStep} />;
          }
          if (activeMode === 'manual') {
              return <Configurator
                        allProducts={allProducts}
                        configuredProducts={configuredProducts}
                        setConfiguredProducts={setConfiguredProducts}
                        activeConfigProductId={activeConfigProductId}
                        setActiveConfigProductId={setActiveConfigProductId}
                        quote={totalQuoteForStep}
                        onNext={handleNext}
                        settings={initialSettings}
                        onMediaToggle={handleMediaToggle}
                        onInteraction={() => setIsHintBubbleVisible(false)}
                    />;
          }
      }

      switch (originalStep) {
        case 2:
            if (!locations) {
                 return (
                    <div className="w-full h-full flex items-center justify-center p-8">
                        <Loader2 className="animate-spin mr-2"/> {t('common.loading')}
                    </div>
                )
            }
            return (
                <DeliveryForm
                    onBack={handleBack}
                    onNext={handleNext}
                    deliverySettings={deliverySettings}
                    onLocationChange={handleLocationChange}
                    totalQuote={totalQuoteForStep}
                    settings={initialSettings}
                    locations={locations}
                    hideFooter={true}
                />
            );
        case 3:
            return (
                <InstallationForm 
                    onBack={handleBack}
                    onNext={handleNext}
                    setIncludeInstallation={setIncludeInstallation}
                    includeInstallation={includeInstallation}
                    installationCost={installationCost}
                    totalQuote={totalQuoteForStep}
                    techniciansRequired={techniciansRequired}
                    totalArea={totalArea}
                    settings={initialSettings}
                    hideFooter={true}
                />
            );
        case 4:
          return <QuoteForm 
            ref={quoteFormRef}
            quoteDetails={finalQuoteDetails} 
            onBack={handleBack} 
            onSubmitted={handleSubmitted} 
            onError={() => setIsSubmitting(false)}
            settings={initialSettings} 
            allProducts={allProducts} 
            hideFooter={true} 
            onValidationChange={setIsQuoteFormValid}
          />;
        default:
          return (
              <div className="w-full h-full flex items-center justify-center">
                   <p>{t('common.invalidStep')}</p>
              </div>
          );
      }
  }
  
  const renderPreviewContent = () => {
    const originalStep = getOriginalStep(currentStep);
    
    // In selection mode, don't show a specific preview
    if (originalStep === 1 && activeMode === 'selection') {
        return <StepImagePreview imageUrl={initialSettings.previewScreenImageUrl} title={t("wizard.steps.config")} />;
    }

    const previewComponent = (
        <Preview 
            width={activeConfiguredProduct?.width ?? initialSettings.defaultWidth}
            height={activeConfiguredProduct?.height ?? initialSettings.defaultHeight}
            screenImageUrl={initialSettings.previewScreenImageUrl}
            humanScaleImageUrl={initialSettings.previewHumanScaleImageUrl}
        />
    );

    if (previewMode !== 'dimension' && mediaUrl && mediaType) {
      return (
        <div className="w-full h-full relative">
          {previewComponent}
          <div className="absolute inset-0 z-10">
            <MediaPreview url={mediaUrl} type={mediaType} />
          </div>
        </div>
      );
    }

    switch (originalStep) {
        case 1:
            return previewComponent;
        case 2:
            return <StepImagePreview imageUrl={initialSettings.deliveryImageUrl} title={initialSettings.deliveryTitle ?? "delivery.title"} />;
        case 3:
            return <StepImagePreview imageUrl={initialSettings.technicianImageUrl} title={initialSettings.installationTitle ?? "installation.title"} />;
        case 4:
            return <StepImagePreview imageUrl={initialSettings.congratulationsImageUrl} title={initialSettings.congratulationsTitle ?? "successPage.title"} />;
        default:
            return null;
    }
  };
  
    const showMediaPreviewMobile = isMobile && previewMode !== 'dimension' && mediaUrl && mediaType;

  const MobileImageModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full h-full max-w-full max-h-full"
      >
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full h-full">
            {mediaUrl && mediaType && (
              <MediaPreview url={mediaUrl} type={mediaType} />
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCloseMediaPreview}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full z-10"
        >
          <X className="h-6 w-6" />
        </Button>
      </motion.div>
    </motion.div>
  );

  if (isSuccess) {
    return <SuccessView quoteId={successQuoteId} onNewQuote={handleNewQuote} initialEmail={submittedEmail} />;
  }

    if (isMobile === undefined) {
        return null;
    }

    // Only show the global left preview when NOT inside the guided wizard flow.
    const showPreview = !(getOriginalStep(currentStep) === 1 && activeMode === 'wizard');

    return (
    <>
            <div className={cn(
                "grid items-stretch w-full mx-auto max-w-[1200px] transition-filter duration-300 gap-5",
                isSuccess ? "grid-cols-1" : (showPreview ? "lg:grid-cols-2" : "lg:grid-cols-1"),
                showMediaPreviewMobile && "lg:blur-none blur-md pointer-events-none"
            )}>
        <div className={cn("flex flex-col gap-8 w-full lg:hidden relative", isMobile && "w-full max-w-lg mx-auto")}>
            <HintBubble 
                visible={isHintBubbleVisible} 
                onHide={() => setIsHintBubbleVisible(false)}
            />
            {!(getOriginalStep(currentStep) === 1 && activeMode === 'wizard') && (
              <div className="flex justify-center w-full">
                <Stepper currentStep={currentStep} onStepClick={handleStepClick} steps={visibleSteps} />
              </div>
            )}
             <div className="w-full">
                {renderStepContent()}
             </div>
        </div>

        {showPreview && (
        <div className="hidden lg:flex lg:flex-col lg:items-stretch lg:gap-8 w-full max-w-xl mx-auto">
            <div className="lg:sticky lg:top-28 flex flex-col gap-8 h-full">
                {!(getOriginalStep(currentStep) === 1 && activeMode === 'wizard') && (
                    <div className="flex justify-center w-full">
                        <Stepper currentStep={currentStep} onStepClick={handleStepClick} steps={visibleSteps} />
                    </div>
                )}
                <Card className="w-full h-[480px] flex flex-col rounded-xl overflow-hidden shadow-lg">
                    <CardContent className="p-0 relative h-full flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden">
                        <AnimatePresence mode="wait">
                        <motion.div
                                key={getOriginalStep(currentStep) === 1 ? `${activeConfiguredProduct?.id}-${mediaUrl}-${activeMode}` : getOriginalStep(currentStep)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full object-cover"
                        >
                                {renderPreviewContent()}
                        </motion.div>
                        </AnimatePresence>
                        {previewMode !== 'dimension' && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleCloseMediaPreview}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-20"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        )}
      
        <div className={cn("relative w-full h-full lg:flex items-stretch justify-center", isMobile ? "hidden" : "flex")}>
            <HintBubble 
                visible={isHintBubbleVisible} 
                onHide={() => setIsHintBubbleVisible(false)}
            />
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${currentStep}-${activeMode}`}
                    initial={{ opacity: 0, x: direction >= 0 ? 80 : -80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction >= 0 ? -80 : 80 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full flex h-full justify-center"
                >
                    {/* Contrainte de largeur pour garder la même largeur de contenu sur toutes les étapes */}
                    <div className="w-full max-w-[900px]">
                        {renderStepContent()}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showMediaPreviewMobile && <MobileImageModal />}
      </AnimatePresence>
      {getOriginalStep(currentStep) > 1 && !isSuccess && (
          <FloatingFooterNav 
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={getOriginalStep(currentStep) === 4 ? t('quoteForm.submit') : t('common.next')}
            nextDisabled={
                (getOriginalStep(currentStep) === 2 && !selectedCityId) || 
                (getOriginalStep(currentStep) === 4 && (!isQuoteFormValid || isSubmitting))
            }
            isLoading={isSubmitting}
          />
      )}
      {initialSettings.isWizardBotEnabled !== false && activeMode === 'selection' && (
        <FloatingChatButton 
          allProducts={allProducts} 
          settings={initialSettings} 
          laborSettings={laborSettings} 
          deliverySettings={deliverySettings} 
          locations={locations} 
          onHome={handleGoToModeSelection}
        />
      )}
    </>
  );
}
