

'use client';

import { useState, useMemo, useEffect, useCallback, useTransition, useRef } from 'react';
import type { Product, Settings, DeliverySettings, LaborSettings, ConfiguredProduct, QuoteDetails, Locations, WizardSettings } from '@/lib/types';
import { saveQuoteState, loadQuoteState, clearQuoteState } from '@/lib/quote-persistence';
import { ROUTE_STEP_MAP } from '@/lib/quote-routes';
import { Configurator } from './configurator';
import Preview from './preview';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Stepper } from './stepper';
import { StepImagePreview } from './step-image-preview';
import { useAuth, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { differenceInDays } from 'date-fns';
import Image from 'next/image';
import { Button } from './ui/button';
import { X, Loader2, ArrowLeft, Grid, Truck, Wrench, Calculator } from 'lucide-react';
import { FloatingFooterNav } from './ui/floating-footer-nav';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import HintBubble from './ui/hint-bubble';

import { ConfiguratorWizard } from './configurator-wizard';
import { ConfiguratorModeSelection } from './configurator-mode-selection';
import { preloadImages } from '@/lib/image-preload';
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import SignatureFlow from './SignatureFlow';
import { DEFAULT_SALE_PRICE_PER_SQM, DEFAULT_RENTAL_PRICE_PER_DAY, DEFAULT_RENTAL_PRICE_PER_HOUR, computeProductLineTotal } from '@/lib/pricing-engine';



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
            <div className="w-full h-full bg-black flex items-center justify-center relative">
                <video
                    src={url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controlsList="nodownload"
                    className="w-full h-full object-cover pointer-events-none"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {t('common.videoNotSupported')}
                </video>
                <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
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
            <div className="w-full h-full bg-black flex items-center justify-center relative" onContextMenu={(e) => e.preventDefault()}>
                <Image
                    src={url}
                    alt={t('common.productPreview')}
                    fill
                    sizes="50vw"
                    className="object-cover pointer-events-none select-none"
                    draggable={false}
                />
                <div className="absolute inset-0 z-10" />
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
  locations: Locations;
  wizardSettings: WizardSettings;
  workflowStep?: string;
}

export function QuoteBuilder({
    initialSettings,
    deliverySettings,
    laborSettings,
    allProducts,
    locations,
    wizardSettings: initialWizardSettings,
    workflowStep: initialWorkflowStep,
}: QuoteBuilderProps) {
    const { t, locale, setLocale } = useI18n();
    
    const [wizardSettings, setWizardSettings] = useState<WizardSettings>(initialWizardSettings);
    const [configuredProducts, setConfiguredProducts] = useState<ConfiguredProduct[]>([]);
    const [activeConfigProductId, setActiveConfigProductId] = useState<string | null>(null);

    const [baseQuote, setBaseQuote] = useState(0);

    const [includeInstallation, setIncludeInstallation] = useState(true);
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
    const [unconfiguredCityQuery, setUnconfiguredCityQuery] = useState<string | undefined>(undefined);
    const [isDeliveryCostFinal, setIsDeliveryCostFinal] = useState(false);
    const [installationCost, setInstallationCost] = useState(0);
    const [techniciansRequired, setTechniciansRequired] = useState(0);
    const [currentStep, setCurrentStep] = useState<number>(() => {
      const saved = loadQuoteState();
      if (saved && saved.currentStep > 0) {
        return saved.currentStep;
      }
      if (initialWorkflowStep) {
        return ROUTE_STEP_MAP[initialWorkflowStep] || 1;
      }
      return 1;
    });
    const [includeDelivery, setIncludeDelivery] = useState(true);

    const [previewMode, setPreviewMode] = useState<PreviewMode>('dimension');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSignatureFlowActive, setIsSignatureFlowActive] = useState(false);
    console.log("DEBUG: QuoteBuilder Rendered", { isSuccess, currentStep });

    const [successQuoteId, setSuccessQuoteId] = useState<string | null>(null);
    const [submittedEmail, setSubmittedEmail] = useState<string | undefined>(undefined);
    const [isHintBubbleVisible, setIsHintBubbleVisible] = useState(false);
    const [direction, setDirection] = useState(0);
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

    useEffect(() => {
        const saved = loadQuoteState();
        const step = ROUTE_STEP_MAP[initialWorkflowStep ?? ''];

        if (saved) {
            setConfiguredProducts(saved.configuredProducts ?? []);
            setActiveConfigProductId(saved.activeConfigProductId);
            setBaseQuote(saved.baseQuote);
            setIncludeInstallation(saved.includeInstallation);
            setDeliveryCost(saved.deliveryCost);
            setSelectedCityId(saved.selectedCityId);
            setUnconfiguredCityQuery(saved.unconfiguredCityQuery);
            setIsDeliveryCostFinal(saved.isDeliveryCostFinal);
            setInstallationCost(saved.installationCost);
            setTechniciansRequired(saved.techniciansRequired);
            setIncludeDelivery(saved.includeDelivery);
            setActiveMode(saved.activeMode);
            setIsSubmitting(saved.isSubmitting);
            if (saved.isSignatureFlowActive && saved.configuredProducts?.length > 0) {
                setIsSignatureFlowActive(true);
            }
        }

        if (step && step >= 5) {
            const hasProducts = saved?.configuredProducts?.length > 0;
            if (hasProducts) {
                setIsSignatureFlowActive(true);
            } else {
                setCurrentStep(1);
            }
        }
    }, []);

    const handleSignatureStepChange = useCallback((_signatureStep: string) => {
        // SignatureFlow gère ses propres transitions internes
    }, []);

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
        return computeProductLineTotal(product, config);
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
                const lineTotal = calculateLineTotal(cp);

                return {
                    ...cp,
                    quantity: cp.quantity || 1,
                    unitPrice: lineTotal / (cp.quantity || 1),
                    productName: product?.name || 'Unknown',
                    lineTotal,
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
            configuratorType: activeMode === 'wizard' ? 'guided' : 'manual',
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
        activeMode,
        calculateLineTotal,
    ]);

    const handleGoToModeSelection = useCallback(() => {
        clearQuoteState();
        setConfiguredProducts([]);
        setActiveConfigProductId(null);
        setBaseQuote(0);
        setActiveMode('selection');
        setCurrentStep(1);
        setIsSubmitting(false);
        setIsSignatureFlowActive(false);
    }, []);



    const handleBack = () => {
        setDirection(-1);
        const fromStep = getOriginalStep(currentStep);
        if (fromStep === 4) {
            setIsSubmitting(false);
        }
        const prevStep = Math.max(1, currentStep - 1);
        saveQuoteState({
            configuredProducts,
            activeConfigProductId,
            baseQuote,
            includeInstallation,
            deliveryCost,
            selectedCityId,
            unconfiguredCityQuery,
            isDeliveryCostFinal,
            installationCost,
            techniciansRequired,
            includeDelivery,
            activeMode,
            initialWizardStep: activeMode === 'wizard' ? 8 : 1,
            isSubmitting,
            isSignatureFlowActive,
            currentStep: prevStep,
        });
        setCurrentStep(prevStep);
    };
    const handleNext = () => {
        const originalStep = getOriginalStep(currentStep);
        if (originalStep === 1) {
            if (configuredProducts.length === 0) {
                alert("Veuillez configurer au moins un produit.");
                return;
            }
            saveQuoteState({
                configuredProducts,
                activeConfigProductId,
                baseQuote,
                includeInstallation,
                deliveryCost,
                selectedCityId,
                unconfiguredCityQuery,
                isDeliveryCostFinal,
                installationCost,
                techniciansRequired,
                includeDelivery,
                activeMode,
                initialWizardStep: 1,
                isSubmitting,
                isSignatureFlowActive: true,
                currentStep: 5,
            });
            setIsSignatureFlowActive(true);
            setCurrentStep(5);
        } else if (currentStep < 4) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            saveQuoteState({
                configuredProducts,
                activeConfigProductId,
                baseQuote,
                includeInstallation,
                deliveryCost,
                selectedCityId,
                unconfiguredCityQuery,
                isDeliveryCostFinal,
                installationCost,
                techniciansRequired,
                includeDelivery,
                activeMode,
                initialWizardStep: 1,
                isSubmitting,
                isSignatureFlowActive,
                currentStep: nextStep,
            });
        }
    };


    const handleStepClick = (step: number) => {
        const originalStep = getOriginalStep(step);

        if (originalStep === 1) {
            clearQuoteState();
            setCurrentStep(1);
            setActiveMode('selection');
            setIsSignatureFlowActive(false);
            return;
        }

        if (step < currentStep) {
            if (getOriginalStep(currentStep) >= 2 && originalStep < 2) {
                setDeliveryCost(0);
                setIsDeliveryCostFinal(false);
                setSelectedCityId(null);
                setUnconfiguredCityQuery(undefined);
            }
            saveQuoteState({
                configuredProducts,
                activeConfigProductId,
                baseQuote,
                includeInstallation,
                deliveryCost,
                selectedCityId,
                unconfiguredCityQuery,
                isDeliveryCostFinal,
                installationCost,
                techniciansRequired,
                includeDelivery,
                activeMode,
                initialWizardStep: 1,
                isSubmitting,
                isSignatureFlowActive: false,
                currentStep: step,
            });
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
        clearQuoteState();
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
        setIsSignatureFlowActive(false);
    };


    const handleWizardComplete = (product: ConfiguredProduct | ConfiguredProduct[]) => {
        const products = Array.isArray(product) ? product : [product];
        setConfiguredProducts(products);
        setActiveConfigProductId(products[0]?.id);
        setIsSignatureFlowActive(true);
        setCurrentStep(5);
        saveQuoteState({
            configuredProducts: products,
            activeConfigProductId: products[0]?.id,
            baseQuote: 0,
            includeInstallation: true,
            deliveryCost: 0,
            selectedCityId: null,
            unconfiguredCityQuery: undefined,
            isDeliveryCostFinal: false,
            installationCost: 0,
            techniciansRequired: 0,
            includeDelivery: true,
            activeMode: 'wizard',
            initialWizardStep: 1,
            isSubmitting: false,
            isSignatureFlowActive: true,
            currentStep: 5,
        });
    };


    const renderStepContent = () => {
        const originalStep = getOriginalStep(currentStep);

        if (originalStep === 1) {
            if (activeMode === 'selection') {
                return <ConfiguratorModeSelection onSelectGuide={() => setActiveMode('wizard')} />;
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

        return (
            <div className="w-full h-full flex items-center justify-center">
                <p>{t('common.invalidStep')}</p>
            </div>
        );
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

        return previewComponent;
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



    if (isSignatureFlowActive && configuredProducts.length > 0) {
        return (
            <SignatureFlow
                configuredProducts={configuredProducts}
                allProducts={allProducts}
                settings={initialSettings}
                userId={user?.uid || 'anonymous'}
                onNewQuote={handleNewQuote}
                onBackToConfigurator={() => {
                    setIsSignatureFlowActive(false);
                    setActiveMode('selection');
                    setCurrentStep(1);
                }}
                onStepChange={handleSignatureStepChange}
            />
        );
    }

    if (isMobile === undefined) {

        return null;
    }

    // Only show the global left preview when NOT inside the guided wizard flow.
    const showPreview = !(getOriginalStep(currentStep) === 1 && activeMode === 'wizard');

    return (
        <>
            {activeMode === 'wizard' && getOriginalStep(currentStep) === 1 ? (
                <ConfiguratorWizard onComplete={handleWizardComplete} onBack={handleGoToModeSelection} allProducts={allProducts} settings={initialSettings} wizardSettings={wizardSettings} initialStep={initialWizardStep} />
            ) : (
                <div className={cn(
                    "grid items-stretch w-full mx-auto max-w-[1400px] lg:px-4 transition-filter duration-300 gap-12",
                    isSuccess || !showPreview
                        ? "grid-cols-1" 
                        : "lg:grid-cols-2",
                    showMediaPreviewMobile && "lg:blur-none blur-md pointer-events-none"
                )}>
                    <div className="flex flex-col gap-8 w-full lg:hidden relative">
                        <HintBubble
                            visible={isHintBubbleVisible}
                            onHide={() => setIsHintBubbleVisible(false)}
                        />
                        <div className="flex justify-center w-full">
                            <Stepper currentStep={currentStep} onStepClick={handleStepClick} steps={visibleSteps} />
                        </div>
                        <div className="w-full">
                            {renderStepContent()}
                        </div>
                    </div>

                    {showPreview && (
                        <div className="hidden lg:flex lg:flex-col lg:items-stretch lg:gap-8 w-full max-w-2xl ml-auto">
                            <div className="lg:sticky lg:top-28 flex flex-col gap-8 h-full">
                                <div className="flex justify-center w-full ml-[75px]">
                                    <Stepper currentStep={currentStep} onStepClick={handleStepClick} steps={visibleSteps} />
                                </div>
                                <Card className="w-full flex-1 flex flex-col rounded-xl overflow-hidden ml-10">
                                    <CardContent className="p-0 relative h-full flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={getOriginalStep(currentStep) === 1 ? `${activeConfiguredProduct?.id}-${mediaUrl}-${activeMode}` : getOriginalStep(currentStep)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5 }}
                                                className="w-full h-full"
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

                    <div className="relative w-full h-full lg:flex hidden items-stretch justify-center">
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
                                <div className="w-full max-w-[900px] h-full flex flex-col justify-end">
                                    {renderStepContent()}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showMediaPreviewMobile && <MobileImageModal />}
            </AnimatePresence>
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
