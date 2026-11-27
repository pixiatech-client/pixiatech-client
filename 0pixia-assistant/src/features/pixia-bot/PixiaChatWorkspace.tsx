import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeEuro,
  Check,
  FileText,
  Globe,
  LogOut,
  Monitor,
  MoreHorizontal,
  RotateCcw,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { t } from '../../core/i18n/translations.ts';
import { computeDemoTestEstimate, formatDemoEuro } from '../../core/pricing/demo-test-pricing.ts';
import {
  STEP,
  type BootstrapPayload,
  type EnvironmentType,
  type Language,
  type ProjectType,
} from '../../core/types.ts';
import { AiCatalogCommandPalette } from './components/AiCatalogCommandPalette.tsx';
import { ClientAccountStep } from './components/ClientAccountStep.tsx';
import { ClientFieldInputStep } from './components/ClientFieldInputStep.tsx';
import { ContractSignatureStep } from './components/ContractSignatureStep.tsx';
import { DimensionsConfiguratorStep } from './components/DimensionsConfiguratorStep.tsx';
import { EmailInputStep } from './components/EmailInputStep.tsx';
import {
  DeliveryChoiceStep,
  InstallationChoiceStep,
} from './components/LogisticsChoiceStep.tsx';
import { OtpSecurityStep } from './components/OtpSecurityStep.tsx';
import { PhoneInputStep } from './components/PhoneInputStep.tsx';
import {
  PixiaDynamicIslandExpanded,
  PixiaDynamicIslandPill,
} from './components/PixiaDynamicIsland.tsx';
import { PixiaOrb, type OrbTone } from './components/PixiaOrb.tsx';
import { ProductCatalogStep } from './components/ProductCatalogStep.tsx';
import { RentalCalendarStep } from './components/RentalCalendarStep.tsx';
import { RollingNumberStepper } from './components/RollingNumberStepper.tsx';
import { SitePhotoUploadStep } from './components/SitePhotoUploadStep.tsx';
import { SpecificationSummary } from './components/SpecificationSummary.tsx';
import { SuccessPdfStep } from './components/SuccessPdfStep.tsx';
import { TechnicalSupportContactCard } from './components/TechnicalSupportContactCard.tsx';
import { usePixiaEngine } from './usePixiaEngine.ts';

interface PixiaChatWorkspaceProps {
  bootstrap: BootstrapPayload;
  initialLang?: Language;
  compact?: boolean;
  hideInnerOrb?: boolean;
  onClose?: () => void;
}

export function PixiaChatWorkspace({
  bootstrap,
  initialLang = 'fr',
  compact = false,
  hideInnerOrb = false,
  onClose,
}: PixiaChatWorkspaceProps) {
  const {
    engine,
    isTyping,
    isSubmittingQuote,
    quoteError,
    otpError,
    isVerifyingOtp,
    emailMode,
    devSimulatedOtp,
    generatedPdf,
    isGeneratingPdf,
    pdfError,
    clientProfile,
    authError,
    isLoggingIn,
    reset,
    back,
    goToStep,
    setLanguage,
    chooseProjectType,
    confirmRentalPeriod,
    confirmRentalComment,
    chooseEnvironment,
    confirmDimensions,
    chooseDistance,
    choosePitch,
    runProductSearch,
    chooseProduct,
    confirmQuantity,
    confirmSitePhoto,
    confirmClientProfile,
    chooseManualForm,
    loginClient,
    logoutClient,
    confirmCompany,
    confirmRepresentative,
    confirmEmail,
    confirmPhone,
    confirmAddress,
    confirmDeliveryCity,
    chooseDeliveryOption,
    chooseInstallationOption,
    submitContract,
    submitOtp,
    resendOtp,
    retryPdfGeneration,
  } = usePixiaEngine({
    bootstrap,
    initialLang,
    onAutoClose: onClose,
  });

  const scrollStreamRef = useRef<HTMLDivElement | null>(null);
  const activeStepRef = useRef<HTMLDivElement | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [textInput, setTextInput] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [phoneFieldError, setPhoneFieldError] = useState(false);
  const [emailFieldError, setEmailFieldError] = useState(false);
  const [textFieldError, setTextFieldError] = useState(false);
  const [contractFieldError, setContractFieldError] = useState(false);
  const [localFormAttempts, setLocalFormAttempts] = useState(0);
  const [rentalCommentInput, setRentalCommentInput] = useState('');
  const [showReport, setShowReport] = useState(true);
  const [demoShowPrices, setDemoShowPrices] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [isWindowLg, setIsWindowLg] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const [clientAccountLayout, setClientAccountLayout] = useState<{
    view: 'ask' | 'login' | 'confirm';
    unfolded: boolean;
  }>({ view: clientProfile ? 'confirm' : 'ask', unfolded: false });
  const [layoutTick, setLayoutTick] = useState(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [justSucceeded, setJustSucceeded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [clickedOptionId, setClickedOptionId] = useState<string | null>(null);
  const [sheetHost, setSheetHost] = useState<HTMLDivElement | null>(null);
  const prevHistoryLenRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const clickFlashTimerRef = useRef<number | null>(null);

  const isDesktop = !compact && isWindowLg;

  const handleClientAccountLayoutChange = useCallback(
    (info: { view: 'ask' | 'login' | 'confirm'; unfolded: boolean }) => {
      setClientAccountLayout(info);
      setLayoutTick((n) => n + 1);
    },
    []
  );

  const triggerLayoutScrollSync = useCallback(() => {
    setLayoutTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsWindowLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isDesktop && showReport) {
      setIslandExpanded(false);
    }
  }, [isDesktop, showReport]);

  useEffect(() => {
    if (engine?.step === STEP.SUMMARY && !isTyping) {
      runProductSearch();
    }
  }, [engine?.step, isTyping, runProductSearch]);

  const triggerRetryFlash = () => {
    setIsRetrying(true);
    if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
    retryTimerRef.current = window.setTimeout(() => setIsRetrying(false), 1800);
  };

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      if (clickFlashTimerRef.current) window.clearTimeout(clickFlashTimerRef.current);
    };
  }, []);

  const streamAnimRef = useRef<{
    rafId: number;
    startTop: number;
    targetTop: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const initialMountRef = useRef(true);

  useEffect(() => {
    initialMountRef.current = false;
  }, []);

  const cancelSmoothScroll = useCallback(() => {
    if (streamAnimRef.current) {
      window.cancelAnimationFrame(streamAnimRef.current.rafId);
      streamAnimRef.current = null;
    }
  }, []);

  const computeScrollTarget = useCallback((): number => {
    const container = scrollStreamRef.current;
    if (!container) return 0;

    const isClientUnfolded =
      engine?.step === STEP.CLIENT_ACCOUNT &&
      clientAccountLayout.view === 'confirm' &&
      clientAccountLayout.unfolded;

    if (
      !isTyping &&
      (engine?.step === STEP.PRODUCTS ||
        engine?.step === STEP.RENTAL_PERIOD ||
        engine?.step === STEP.DIMENSIONS ||
        isClientUnfolded) &&
      activeStepRef.current
    ) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = activeStepRef.current.getBoundingClientRect();
      const nextTop = container.scrollTop + (targetRect.top - containerRect.top) - 72;
      return Math.max(0, Math.min(nextTop, container.scrollHeight - container.clientHeight));
    }

    return Math.max(0, container.scrollHeight - container.clientHeight);
  }, [engine?.step, isTyping, clientAccountLayout.view, clientAccountLayout.unfolded]);

  const glideStreamToTarget = useCallback(() => {
    const container = scrollStreamRef.current;
    if (!container) return;

    const nextTarget = computeScrollTarget();
    const now = performance.now();

    if (streamAnimRef.current) {
      // Seamlessly update target mid-glide without resetting or snapping backward
      streamAnimRef.current.startTop = container.scrollTop;
      streamAnimRef.current.targetTop = nextTarget;
      streamAnimRef.current.startTime = now;
      return;
    }

    const animState = {
      rafId: 0,
      startTop: container.scrollTop,
      targetTop: nextTarget,
      startTime: now,
      duration: 380,
    };
    streamAnimRef.current = animState;

    const stepFrame = (frameTime: number) => {
      const c = scrollStreamRef.current;
      const active = streamAnimRef.current;
      if (!c || !active) return;

      // Keep tracking dynamic target (e.g. expanding card / padding transition) cleanly
      active.targetTop = computeScrollTarget();
      const elapsed = frameTime - active.startTime;
      const progress = Math.min(1, elapsed / active.duration);
      // Smooth cubic ease-out: glides gracefully upward and settles softly
      const eased = 1 - Math.pow(1 - progress, 3);
      c.scrollTop = active.startTop + (active.targetTop - active.startTop) * eased;

      if (progress < 1) {
        active.rafId = window.requestAnimationFrame(stepFrame);
      } else {
        c.scrollTop = active.targetTop;
        streamAnimRef.current = null;
      }
    };

    animState.rafId = window.requestAnimationFrame(stepFrame);
  }, [computeScrollTarget]);

  useEffect(() => {
    const container = scrollStreamRef.current;
    if (!container) return;
    const stopOnUserInput = () => cancelSmoothScroll();
    container.addEventListener('wheel', stopOnUserInput, { passive: true });
    container.addEventListener('touchstart', stopOnUserInput, { passive: true });
    return () => {
      container.removeEventListener('wheel', stopOnUserInput);
      container.removeEventListener('touchstart', stopOnUserInput);
      cancelSmoothScroll();
    };
  }, [cancelSmoothScroll]);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => glideStreamToTarget());
    return () => window.cancelAnimationFrame(rafId);
  }, [
    engine?.messages.length,
    engine?.step,
    engine?.errorCount,
    localFormAttempts,
    isTyping,
    clientAccountLayout.view,
    clientAccountLayout.unfolded,
    layoutTick,
    glideStreamToTarget,
  ]);

  useEffect(() => {
    setTextInput('');
    setPhotoError(null);
    setPhoneFieldError(false);
    setEmailFieldError(false);
    setTextFieldError(false);
    setContractFieldError(false);
    setLocalFormAttempts(0);
    setShowActionsMenu(false);
    if (engine?.step !== STEP.CLIENT_ACCOUNT) {
      setClientAccountLayout({ view: clientProfile ? 'confirm' : 'ask', unfolded: false });
    }
  }, [engine?.step, clientProfile]);

  useEffect(() => {
    if (!islandExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIslandExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [islandExpanded]);

  useEffect(() => {
    if (!showActionsMenu) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowActionsMenu(false);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showActionsMenu]);

  useEffect(() => {
    if (!engine) return;
    if (engine.history.length > prevHistoryLenRef.current && engine.errorCount === 0) {
      setJustSucceeded(true);
      const id = window.setTimeout(() => setJustSucceeded(false), 1400);
      prevHistoryLenRef.current = engine.history.length;
      return () => window.clearTimeout(id);
    }
    prevHistoryLenRef.current = engine.history.length;
  }, [engine?.history.length, engine?.errorCount]);

  if (!engine) return null;

  const { lang, step } = engine;

  const isClientAccountUnfolded =
    step === STEP.CLIENT_ACCOUNT &&
    clientAccountLayout.view === 'confirm' &&
    clientAccountLayout.unfolded;

  const showInnerOrb =
    !hideInnerOrb &&
    !isClientAccountUnfolded &&
    !((step === STEP.RENTAL_PERIOD || step === STEP.PRODUCTS || step === STEP.DIMENSIONS) &&
      !isTyping);

  const totalErrorCount = engine.errorCount + localFormAttempts;

  const hasValidationOrApiError =
    engine.errorCount >= 1 ||
    totalErrorCount >= 3 ||
    Boolean(
      otpError ||
        quoteError ||
        pdfError ||
        photoError ||
        authError ||
        phoneFieldError ||
        emailFieldError ||
        textFieldError ||
        contractFieldError
    );

  // Règle couleurs inversée :
  // - Attente / question -> Mauve ('question')
  // - Erreur -> Rouge ('error')
  // - Réponse validée / étape suivante / nouvelle tentative -> Bleu ('blue' / 'retry')
  // - Étape finale Félicitations / Succès -> Vert ('success')
  const orbTone: OrbTone = hasValidationOrApiError
    ? 'error'
    : step === STEP.SUCCESS || step === STEP.FELICITATIONS
      ? 'success'
      : justSucceeded
        ? 'blue'
        : isRetrying
          ? 'retry'
          : 'question';

  const shellToneClass =
    orbTone === 'error'
      ? 'border-[#EF4444]/85 shadow-[0_22px_60px_rgba(0,0,0,0.74),0_0_38px_rgba(239,68,68,0.42)]'
      : orbTone === 'blue' || orbTone === 'retry'
        ? 'border-[#3B82F6]/55 shadow-[0_22px_60px_rgba(0,0,0,0.72),0_0_24px_rgba(59,130,246,0.26)]'
        : orbTone === 'success'
          ? 'border-[#10B981]/55 shadow-[0_22px_60px_rgba(0,0,0,0.72),0_0_24px_rgba(16,185,129,0.26)]'
          : 'border-[#A855F7]/22 shadow-[0_22px_60px_rgba(0,0,0,0.72),0_0_16px_rgba(168,85,247,0.1)]';

  const topHighlightClass =
    orbTone === 'error'
      ? 'via-[#EF4444]/90'
      : orbTone === 'blue' || orbTone === 'retry'
        ? 'via-[#3B82F6]/70'
        : orbTone === 'success'
          ? 'via-[#10B981]/70'
          : 'via-[#C084FC]/50';

  const handleBackClick = () => {
    setPhotoError(null);
    setPhoneFieldError(false);
    setEmailFieldError(false);
    setTextFieldError(false);
    setContractFieldError(false);
    setLocalFormAttempts(0);
    triggerRetryFlash();
    back();
  };

  const handleEditStep = (targetStep: STEP) => {
    setPhotoError(null);
    setPhoneFieldError(false);
    setEmailFieldError(false);
    setTextFieldError(false);
    setContractFieldError(false);
    setLocalFormAttempts(0);
    triggerRetryFlash();
    goToStep(targetStep);
  };

  const handleResendOtp = async () => {
    triggerRetryFlash();
    await resendOtp();
  };

  const isThinkingGlow =
    isTyping || step === STEP.GENERATING || isSubmittingQuote || isGeneratingPdf;

  const handleOptionClick = (optId: string, optValue: string, optLabel: string) => {
    if (isTyping) return;
    setClickedOptionId(optId);
    if (clickFlashTimerRef.current) window.clearTimeout(clickFlashTimerRef.current);
    clickFlashTimerRef.current = window.setTimeout(() => setClickedOptionId(null), 420);

    if (step === STEP.PROJECT_TYPE) {
      chooseProjectType(optValue as ProjectType);
    } else if (step === STEP.ENVIRONMENT) {
      chooseEnvironment(optValue as EnvironmentType);
    } else if (step === STEP.DISTANCE) {
      chooseDistance(optValue);
    } else if (step === STEP.PITCH) {
      choosePitch(parseFloat(optValue), optLabel);
    } else if (step === STEP.DELIVERY_CHOICE) {
      chooseDeliveryOption(optValue === 'yes');
    } else if (step === STEP.INSTALLATION) {
      chooseInstallationOption(optValue === 'yes');
    }
  };

  const handleTextFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    if (step === STEP.RENTAL_COMMENT) {
      confirmRentalComment(textInput);
      setRentalCommentInput('');
    }
  };

  const isTextStep = step === STEP.RENTAL_COMMENT;

  const textPlaceholder = t(lang, 'bot.rentalCommentPlaceholder');

  const closeHandler = onClose;

  const cardShell = (
    <section
      aria-label="PIXIA 9:16 Assistant"
      onScroll={(e) => {
        if (e.currentTarget.scrollTop !== 0) e.currentTarget.scrollTop = 0;
      }}
      className={`relative flex flex-col overflow-hidden bg-[#17171A] text-[#F4F4F5] transition-all duration-300 ${
        compact
          ? `w-full h-full ${
              orbTone === 'error'
                ? 'ring-2 ring-[#EF4444]/80'
                : orbTone === 'blue' || orbTone === 'retry'
                  ? 'ring-1 ring-[#3B82F6]/55'
                  : orbTone === 'success'
                    ? 'ring-1 ring-[#10B981]/55'
                    : ''
            }`
          : `w-full max-w-[400px] aspect-[9/16] max-h-[85vh] rounded-[28px] border ${shellToneClass}`
      }`}
    >
      {/* Full-app red alert tint & inset border when validation warning/error is active */}
      {orbTone === 'error' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] ring-1 ring-inset ring-[#EF4444]/65 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.20)_0%,rgba(239,68,68,0.06)_48%,transparent_78%)]"
        />
      )}

      {/* Rotating luminous violet/cyan halo around card when PIXIA is thinking */}
      {isThinkingGlow && <div aria-hidden="true" className="pixia-thinking-ring z-30" />}

      {/* Dynamic top ambient edge highlight synced with robot state */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-10 top-0 z-30 h-[1px] bg-gradient-to-r from-transparent ${topHighlightClass} to-transparent transition-colors duration-300`}
      />

      {/* Frosted Glass Top Overlay (header + floating robot head) with feathered fade so scrolled cards pass visibly underneath */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-0 transition-all duration-300 ${
            showInnerOrb ? (compact ? 'h-[148px]' : 'h-[176px]') : 'h-[86px]'
          }`}
          style={{
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            background:
              'linear-gradient(180deg, rgba(23,23,26,0.94) 0%, rgba(23,23,26,0.74) 48%, rgba(23,23,26,0.28) 78%, rgba(23,23,26,0) 100%)',
            maskImage:
              'linear-gradient(to bottom, black 54%, rgba(0,0,0,0.65) 76%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 54%, rgba(0,0,0,0.65) 76%, transparent 100%)',
          }}
        />

        <header className="relative px-3.5 pt-3.5 pb-1.5 flex items-center justify-between gap-2 pointer-events-none">
          <div className="relative z-30 flex items-center gap-2 min-w-0 pointer-events-auto">
            {engine.history.length > 0 && (
              <button
                type="button"
                onClick={handleBackClick}
                aria-label={t(lang, 'ui.back')}
                title={t(lang, 'ui.back')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/8 text-[#E4E4E7] hover:bg-white/15 backdrop-blur-md transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold tracking-tight text-white leading-tight truncate">
                Assistant Bot Pixia
              </h2>
            </div>
          </div>

          {/* Dynamic Island pill: visible on Mobile/Compact OR on Desktop when left panel is OFF */}
          {!isDesktop || !showReport ? (
            <div className="relative z-10 flex-1 min-w-0 flex justify-center pointer-events-auto">
              <PixiaDynamicIslandPill
                engine={engine}
                bootstrap={bootstrap}
                expanded={!isDesktop && islandExpanded}
                onToggle={() => {
                  setShowActionsMenu(false);
                  if (isDesktop) {
                    setIslandExpanded(false);
                    setShowReport(true);
                  } else {
                    setIslandExpanded((open) => !open);
                  }
                }}
              />
            </div>
          ) : (
            <div aria-hidden="true" className="flex-1" />
          )}

          {/* Single Compact Action Palette Menu Button */}
          <div ref={actionsMenuRef} className="relative z-30 shrink-0 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowActionsMenu((open) => !open)}
              aria-expanded={showActionsMenu}
              aria-label={lang === 'fr' ? 'Menu actions' : 'Actions menu'}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors cursor-pointer backdrop-blur-md ${
                showActionsMenu
                  ? 'border-[#38BDF8]/60 bg-[#38BDF8]/15 text-[#93C5FD]'
                  : 'border-white/12 bg-white/8 text-[#E4E4E7] hover:bg-white/15 hover:text-white'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {showActionsMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-11 z-40 w-56 rounded-2xl border border-white/15 bg-[#1B1B20]/95 backdrop-blur-xl p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.75)] space-y-1"
                >
                  {/* Langue FR / EN */}
                  <div className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-[#D4D4D8]">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Globe className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span>{lang === 'fr' ? 'Langue' : 'Language'}</span>
                    </span>
                    <div className="flex items-center rounded-full border border-white/12 bg-white/5 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLanguage('fr');
                          setShowActionsMenu(false);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
                          lang === 'fr' ? 'bg-white text-[#141416]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        FR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLanguage('en');
                          setShowActionsMenu(false);
                        }}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
                          lang === 'en' ? 'bg-white text-[#141416]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* Fiche technique */}
                  {(() => {
                    const specsMenuActive = isDesktop ? showReport : islandExpanded;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionsMenu(false);
                          if (isDesktop) {
                            setIslandExpanded(false);
                            setShowReport((s) => !s);
                          } else {
                            setIslandExpanded((v) => !v);
                          }
                        }}
                        className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[#E4E4E7] hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-[#38BDF8]" />
                          <span>{lang === 'fr' ? 'Fiche technique' : 'Specs sheet'}</span>
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            specsMenuActive
                              ? 'bg-[#3f9b78]/25 text-[#34D399]'
                              : 'bg-white/8 text-[#71717A]'
                          }`}
                        >
                          {specsMenuActive ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })()}

                  {/* TEMPORARY TEST TOGGLE — Basculer Sur estimation <-> Prix démo chiffrés */}
                  <button
                    type="button"
                    onClick={() => {
                      setDemoShowPrices((v) => !v);
                      setShowActionsMenu(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[#E4E4E7] hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <BadgeEuro className="h-3.5 w-3.5 text-[#34D399]" />
                      <span>{lang === 'fr' ? 'Prix démo (Test)' : 'Demo prices (Test)'}</span>
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        demoShowPrices
                          ? 'bg-[#3f9b78]/25 text-[#34D399]'
                          : 'bg-white/8 text-[#71717A]'
                      }`}
                    >
                      {demoShowPrices ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Recommencer */}
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoError(null);
                      setPhoneFieldError(false);
                      setEmailFieldError(false);
                      setTextFieldError(false);
                      setContractFieldError(false);
                      setLocalFormAttempts(0);
                      setShowActionsMenu(false);
                      setIslandExpanded(false);
                      reset();
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-[#E4E4E7] hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#C084FC]" />
                    <span>{t(lang, 'ui.reset')}</span>
                  </button>

                  {/* Déconnexion client si connecté */}
                  {clientProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsMenu(false);
                        void logoutClient();
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-[#E4E4E7] hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-[#A1A1AA]" />
                      <span className="truncate">
                        {lang === 'fr'
                          ? `Déconnecter (${clientProfile.representative.split(' ')[0]})`
                          : `Sign out (${clientProfile.representative.split(' ')[0]})`}
                      </span>
                    </button>
                  )}

                  {/* Fermer */}
                  {closeHandler && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowCloseConfirm(true);
                      }}
                      className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-[#FB7185] hover:bg-[#EF4444]/12 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>{lang === 'fr' ? 'Fermer' : 'Close'}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <AnimatePresence initial={false}>
          {showInnerOrb && (
            <motion.div
              key="pixia-orb-header"
              initial={{ opacity: 0, scale: 0.45, y: -18, x: 0, height: 0 }}
              animate={{
                opacity: 1,
                scale: showActionsMenu ? 0.86 : 1,
                x: showActionsMenu ? (compact ? -108 : -128) : 0,
                y: 0,
                height: 'auto',
              }}
              exit={{ opacity: 0, scale: 0.65, y: -14, x: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="relative z-20 pointer-events-none px-5 pt-0.5 pb-2 flex justify-center overflow-visible"
            >
              <PixiaOrb
                tone={orbTone}
                isTyping={isTyping}
                sizePx={compact ? 56 : 74}
                floating
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conversational Stream */}
      <div
        ref={scrollStreamRef}
        className={`flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-3.5 transition-[padding] duration-300 ${
          showInnerOrb ? (compact ? 'pt-[136px]' : 'pt-[164px]') : 'pt-[74px]'
        }`}
      >
        {engine.messages.map((msg, idx) => {
          const isBot = msg.senderId === 'bot';
          const hasImages = Boolean(msg.options?.some((o) => o.imageUrl));
          const isLatestBot = isBot && idx === engine.messages.length - 1;
          return (
            <motion.div
              key={msg.id}
              initial={initialMountRef.current ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              {isBot ? (
                <div className="max-w-[92%] text-[14px] leading-relaxed text-[#F4F4F5]">
                  <p className="inline">
                    {msg.content}
                    {isLatestBot && isTyping && (
                      <span className="ml-1 inline-block h-4 w-[2px] align-middle bg-[#38BDF8] animate-pulse" />
                    )}
                  </p>
                </div>
              ) : msg.selectedProduct ? (
                <div className="w-[88%] max-w-[310px] rounded-[22px] border border-[#3f9b78]/80 ring-1 ring-[#3f9b78]/35 bg-[#1B1B20] p-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.48),0_0_24px_rgba(63,155,120,0.2)]">
                  <div className="relative aspect-[16/10] w-full rounded-[14px] bg-[#101014] overflow-hidden">
                    {msg.selectedProduct.images[0] ? (
                      <img
                        src={msg.selectedProduct.images[0]}
                        alt={msg.selectedProduct.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#71717A]">
                        <Monitor className="h-7 w-7" />
                      </div>
                    )}
                    <span className="pointer-events-none absolute left-2 top-2 rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur-xs">
                      {msg.selectedProduct.pitch !== null
                        ? `P${msg.selectedProduct.pitch}`
                        : msg.selectedProduct.ipRating}
                    </span>
                  </div>

                  <div className="px-1 pt-2.5 pb-2.5 flex items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#8E8E98] font-mono tabular-nums">
                        {msg.selectedProduct.sku} · {msg.selectedProduct.ipRating}
                      </p>
                      <h4 className="mt-0.5 text-[13.5px] font-bold text-white leading-snug truncate">
                        {msg.selectedProduct.name}{' '}
                        <span className="font-normal text-[#A1A1AA] text-[11px]">
                          · {msg.selectedProduct.brightnessNits} nits
                        </span>
                      </h4>
                      <p className="mt-0.5 text-[11px] text-[#9E9EA8] line-clamp-1">
                        {lang === 'fr'
                          ? msg.selectedProduct.descriptionFr
                          : msg.selectedProduct.descriptionEn}
                      </p>
                    </div>
                    <div className="text-right shrink-0 pt-0.5">
                      <span
                        className={`text-[11px] font-bold tabular-nums whitespace-nowrap ${
                          demoShowPrices ? 'text-[#34D399] font-mono' : 'text-[#93C5FD]'
                        }`}
                      >
                        {demoShowPrices
                          ? formatDemoEuro(
                              computeDemoTestEstimate({
                                configState: engine.configState,
                                includeDelivery: null,
                                includeInstallation: null,
                                productOverride: msg.selectedProduct,
                              }).productGlobalPrice,
                              lang
                            )
                          : bootstrap.settings.isPriceHidden
                            ? t(lang, 'ui.priceHidden')
                            : t(lang, 'ui.onQuote')}
                      </span>
                      <span className="block text-[9.5px] font-mono text-[#71717A] tabular-nums mt-0.5">
                        {msg.selectedProduct.tileWidthMm}×{msg.selectedProduct.tileHeightMm} mm
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full h-[46px] rounded-full px-4 flex items-center justify-center overflow-visible border border-[#3f9b78]/80 bg-gradient-to-b from-[#17352A] via-[#0F241D] to-[#0A1813] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_22px_rgba(63,155,120,0.28)]">
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#A7F3D0] pr-7">
                      <Check strokeWidth={2.5} className="h-3.5 w-3.5 text-[#3f9b78]" />
                      {lang === 'fr' ? 'Produit sélectionné' : 'Added to bag'}
                    </span>
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-[#3f9b78]/80 bg-[#3f9b78]/25 text-[#A7F3D0]">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M8.6 9.2V7.4a3.4 3.4 0 0 1 6.8 0v1.8" />
                        <path d="M5.4 8.6h13.2l-0.9 10.6a1.6 1.6 0 0 1-1.6 1.5H7.9a1.6 1.6 0 0 1-1.6-1.5z" />
                        <path d="M5.6 8.6h12.8" />
                      </svg>
                      <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3f9b78] ring-2 ring-[#0A1813] px-1 text-[9.5px] font-bold text-white shadow-[0_2px_6px_rgba(63,155,120,0.65)] tabular-nums">
                        1
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] rounded-2xl rounded-br-xs border border-white/10 bg-[#26262B] px-4 py-2.5 text-[13.5px] leading-snug text-[#F4F4F5]">
                  <p>{msg.content}</p>
                  {msg.fileUrl && (
                    <img
                      src={msg.fileUrl}
                      alt="Site"
                      referrerPolicy="no-referrer"
                      className="mt-2 max-h-36 w-full rounded-lg object-cover border border-white/10"
                    />
                  )}
                </div>
              )}

              {isBot && msg.options && msg.options.length > 0 && (
                <div
                  className={`mt-2.5 w-full ${
                    hasImages ? 'grid grid-cols-1 gap-2' : 'flex flex-col gap-1.5'
                  }`}
                >
                  {msg.options.map((opt) =>
                    opt.imageUrl ? (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={msg.optionsDisabled || isTyping}
                        onClick={() => handleOptionClick(opt.id, opt.value, opt.label)}
                        className={`pixia-glass-btn flex items-center gap-3 text-left rounded-2xl p-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer min-h-[58px] ${
                          clickedOptionId === opt.id ? 'is-clicked' : ''
                        }`}
                      >
                        <img
                          src={opt.imageUrl}
                          alt={opt.label}
                          referrerPolicy="no-referrer"
                          className="h-14 w-16 rounded-xl object-cover bg-[#121215] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-semibold text-white truncate">
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="block text-[11.5px] text-[#A1A1AA] line-clamp-2">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ) : (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={msg.optionsDisabled || isTyping}
                        onClick={() => handleOptionClick(opt.id, opt.value, opt.label)}
                        className={`pixia-glass-btn w-full text-left rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#F4F4F5] disabled:opacity-40 disabled:pointer-events-none cursor-pointer min-h-[44px] flex items-center justify-between group ${
                          clickedOptionId === opt.id ? 'is-clicked' : ''
                        }`}
                      >
                        <span>{opt.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#93C5FD]/75 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Active Interactive Step Cards */}
        {!isTyping && step === STEP.RENTAL_PERIOD && (
          <motion.div
            key="step-rental-period"
            ref={activeStepRef}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <RentalCalendarStep
              lang={lang}
              blockedPeriods={bootstrap.blockedPeriods}
              isPriceHidden={bootstrap.settings.isPriceHidden}
              demoShowPrices={demoShowPrices}
              sheetContainer={sheetHost}
              initialStart={engine.configState.rentalStartDate}
              initialEnd={engine.configState.rentalEndDate}
              initialStartTime={engine.configState.rentalStartTime}
              initialEndTime={engine.configState.rentalEndTime}
              onConfirm={confirmRentalPeriod}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.RENTAL_COMMENT && (
          <motion.form
            key="step-rental-comment"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={(e) => {
              e.preventDefault();
              confirmRentalComment(rentalCommentInput);
              setRentalCommentInput('');
            }}
            className="rounded-2xl border border-white/10 bg-[#202025] p-4 space-y-3"
          >
            <label className="block space-y-1.5">
              <span className="text-[10.5px] font-semibold tracking-wider uppercase text-[#94A3B8]">
                {lang === 'fr' ? 'Remarques' : 'Comments'}
              </span>
              <textarea
                rows={3}
                value={rentalCommentInput}
                onChange={(e) => setRentalCommentInput(e.target.value)}
                placeholder={t(lang, 'bot.rentalCommentPlaceholder')}
                className="w-full rounded-xl border border-white/12 bg-[#141417] px-3 py-2 text-xs text-white placeholder:text-[#71717A] focus:border-[#A855F7] focus:outline-none resize-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  confirmRentalComment(null);
                  setRentalCommentInput('');
                }}
                className="rounded-xl border border-white/12 bg-white/5 px-3.5 py-2 text-xs font-medium text-[#D4D4D8] hover:text-white cursor-pointer min-h-[40px]"
              >
                {t(lang, 'bot.skip')}
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] cursor-pointer min-h-[40px]"
              >
                {t(lang, 'ui.continue')}
              </button>
            </div>
          </motion.form>
        )}

        {!isTyping && step === STEP.DIMENSIONS && (
          <motion.div
            key="step-dimensions"
            ref={activeStepRef}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <DimensionsConfiguratorStep
              lang={lang}
              initialWidth={engine.configState.width}
              initialHeight={engine.configState.height}
              initialShape={engine.configState.screenShape ?? 'flat'}
              initialCurveLeft={engine.configState.curveLeft}
              initialCurveRight={engine.configState.curveRight}
              onConfirm={confirmDimensions}
            />
          </motion.div>
        )}

        {((!isTyping && step === STEP.SUMMARY) || step === STEP.GENERATING) && (
          <AiCatalogCommandPalette lang={lang} configState={engine.configState} />
        )}

        {!isTyping && step === STEP.PRODUCTS && (
          <motion.div
            key="step-products"
            ref={activeStepRef}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCatalogStep
              lang={lang}
              products={engine.recommendedProducts}
              isPriceHidden={bootstrap.settings.isPriceHidden}
              demoShowPrices={demoShowPrices}
              configState={engine.configState}
              initialSelectedId={engine.configState.selectedProduct?.id ?? null}
              onSelect={chooseProduct}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.QUANTITY && (
          <motion.form
            key="step-quantity"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={(e) => {
              e.preventDefault();
              confirmQuantity(qtyInput);
            }}
            className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 flex items-center justify-between gap-2.5"
          >
            <RollingNumberStepper
              value={Math.max(1, parseInt(qtyInput, 10) || 1)}
              min={1}
              max={99}
              step={1}
              ariaLabel={lang === 'fr' ? 'Quantité' : 'Quantity'}
              onChange={(next) => setQtyInput(String(next))}
            />
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors cursor-pointer min-h-[44px]"
            >
              <span>{t(lang, 'ui.continue')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        )}

        {!isTyping && step === STEP.SITE_PHOTO && (
          <motion.div
            key="step-site-photo"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-2"
          >
            <SitePhotoUploadStep
              lang={lang}
              onError={setPhotoError}
              onComplete={confirmSitePhoto}
            />
            {photoError && <p className="text-xs font-medium text-[#FB7185] px-1">{photoError}</p>}
          </motion.div>
        )}

        {!isTyping && step === STEP.CLIENT_ACCOUNT && (
          <motion.div
            key="step-client-account"
            ref={activeStepRef}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientAccountStep
              lang={lang}
              clientProfile={clientProfile}
              authError={authError}
              isLoggingIn={isLoggingIn}
              onLogin={loginClient}
              onLogout={logoutClient}
              onConfirmProfile={confirmClientProfile}
              onChooseManual={chooseManualForm}
              onLayoutChange={handleClientAccountLayoutChange}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.FORM_COMPANY && (
          <motion.div
            key="step-form-company"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientFieldInputStep
              kind="company"
              lang={lang}
              initialValue={engine.form.company}
              onError={setTextFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmCompany}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.FORM_REPRESENTATIVE && (
          <motion.div
            key="step-form-representative"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientFieldInputStep
              kind="representative"
              lang={lang}
              initialValue={engine.form.representative}
              onError={setTextFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmRepresentative}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.FORM_EMAIL && (
          <motion.div
            key="step-form-email"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <EmailInputStep
              lang={lang}
              initialValue={engine.form.email}
              onError={setEmailFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmEmail}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.FORM_PHONE && (
          <motion.div
            key="step-form-phone"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhoneInputStep
              lang={lang}
              onError={setPhoneFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmPhone}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.FORM_ADDRESS && (
          <motion.div
            key="step-form-address"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientFieldInputStep
              kind="address"
              lang={lang}
              initialValue={engine.form.address}
              onError={setTextFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmAddress}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.DELIVERY && (
          <motion.div
            key="step-delivery"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientFieldInputStep
              kind="deliveryCity"
              lang={lang}
              initialValue={engine.form.deliveryCity}
              citySuggestions={bootstrap.locations.villes.map((v) => v.name)}
              onError={setTextFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={confirmDeliveryCity}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.DELIVERY_CHOICE && (
          <motion.div
            key="step-delivery-choice"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <DeliveryChoiceStep
              lang={lang}
              deliveryCity={engine.form.deliveryCity}
              bootstrap={bootstrap}
              initialValue={engine.includeDelivery}
              onExpandChange={triggerLayoutScrollSync}
              onConfirm={chooseDeliveryOption}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.INSTALLATION && (
          <motion.div
            key="step-installation"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <InstallationChoiceStep
              lang={lang}
              initialValue={engine.includeInstallation}
              onExpandChange={triggerLayoutScrollSync}
              onConfirm={chooseInstallationOption}
            />
          </motion.div>
        )}

        {/* Escalation to Direct Technical Support after 3 errors */}
        {!isTyping && totalErrorCount >= 3 && (
          <TechnicalSupportContactCard
            lang={lang}
            phone={bootstrap.pdfSettings.companyPhone}
            email={bootstrap.pdfSettings.companyEmail}
          />
        )}

        {!isTyping && step === STEP.CONTRAT && (
          <motion.div
            key="step-contrat"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContractSignatureStep
              lang={lang}
              contractText={
                lang === 'fr'
                  ? bootstrap.settings.estimationFlow.contractTemplateFr
                  : bootstrap.settings.estimationFlow.contractTemplateEn
              }
              isSubmitting={isSubmittingQuote}
              error={quoteError}
              onError={setContractFieldError}
              onInvalidSubmit={() => setLocalFormAttempts((n) => n + 1)}
              onSubmit={submitContract}
            />
          </motion.div>
        )}

        {!isTyping && step === STEP.SECURITE && (
          <motion.div
            key="step-securite"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <OtpSecurityStep
              lang={lang}
              email={engine.form.email}
              attemptsLeft={engine.security.otpAttemptsLeft}
              resendAttemptsLeft={engine.security.resendAttemptsLeft}
              cooldownSeconds={engine.security.otpCooldownSeconds}
              isVerifying={isVerifyingOtp}
              error={otpError}
              emailMode={emailMode}
              devSimulatedOtp={devSimulatedOtp}
              onVerify={submitOtp}
              onResend={handleResendOtp}
            />
          </motion.div>
        )}

        {!isTyping && (step === STEP.FELICITATIONS || step === STEP.SUCCESS) && (
          <motion.div
            key="step-success"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            <SuccessPdfStep
              lang={lang}
              quoteReference={engine.quoteReference}
              pdf={generatedPdf}
              pdfUrl={engine.security.pdfUrl}
              isGenerating={isGeneratingPdf}
              error={pdfError}
              onRetry={retryPdfGeneration}
              onReset={reset}
            />
          </motion.div>
        )}

        <div className="h-px" />
      </div>

      {/* Animorio-inspired Glass Prompt Field with Thinking Luminous Ring */}
      <form
        onSubmit={handleTextFormSubmit}
        className="px-4 pb-4 pt-2 shrink-0"
      >
        <div
          className={`relative flex items-center gap-2 rounded-full border bg-[#1F1F26]/85 backdrop-blur-md p-1.5 pl-4 transition-all duration-300 ${
            orbTone === 'error'
              ? 'border-[#EF4444]/55'
              : orbTone === 'blue' || orbTone === 'retry'
                ? 'border-[#3B82F6]/55'
                : orbTone === 'success'
                  ? 'border-[#10B981]/50'
                  : isThinkingGlow
                    ? 'border-transparent shadow-[0_0_24px_rgba(56,189,248,0.16)]'
                    : 'border-white/12'
          }`}
        >
          {isThinkingGlow && <span aria-hidden="true" className="pixia-thinking-ring" />}
          <input
            type={step === STEP.FORM_EMAIL ? 'email' : 'text'}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={!isTextStep}
            placeholder={
              isTextStep
                ? textPlaceholder
                : lang === 'fr'
                  ? 'Demandez ou choisissez ci-dessus…'
                  : 'Select an option above…'
            }
            autoFocus={isTextStep}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#71717A] focus:outline-none disabled:text-[#71717A]"
          />
          <button
            type="submit"
            disabled={!isTextStep || !textInput.trim()}
            aria-label={t(lang, 'ui.continue')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#141416] hover:bg-[#E4E4E7] disabled:bg-white/25 disabled:text-[#141416]/50 transition-colors cursor-pointer shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Confirmation avant fermeture avec avertissement de perte de progression */}
      <AnimatePresence>
        {showCloseConfirm && closeHandler && (
          <motion.div
            key="pixia-close-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pixia-close-confirm-title"
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-5"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-[310px] rounded-2xl border border-[#EF4444]/35 bg-[#1B1B20] p-5 text-center shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_24px_rgba(239,68,68,0.18)] space-y-4"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#EF4444]/35 bg-[#EF4444]/15 text-[#FB7185]">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="space-y-1.5">
                <h3
                  id="pixia-close-confirm-title"
                  className="text-sm font-semibold text-white leading-snug"
                >
                  {lang === 'fr'
                    ? 'Attention, vous allez perdre toute votre progression.'
                    : 'Warning, you will lose all your progress.'}
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {lang === 'fr'
                    ? 'Si vous fermez maintenant, la discussion sera réinitialisée à la prochaine ouverture.'
                    : 'If you close now, the conversation will restart from the beginning next time.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseConfirm(false);
                    reset();
                    closeHandler();
                  }}
                  className="w-full rounded-xl bg-[#EF4444] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#DC2626] transition-colors cursor-pointer min-h-[40px]"
                >
                  {lang === 'fr' ? 'Fermer et réinitialiser' : 'Close & reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-xs font-medium text-[#E4E4E7] hover:bg-white/10 transition-colors cursor-pointer min-h-[40px]"
                >
                  {lang === 'fr' ? 'Annuler et continuer' : 'Cancel & keep going'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Dynamic Island full-window specs sheet (Mobile / Compact ONLY) */}
      <AnimatePresence>
        {!isDesktop && islandExpanded && (
          <PixiaDynamicIslandExpanded
            engine={engine}
            bootstrap={bootstrap}
            demoShowPrices={demoShowPrices}
            onToggleDemoPrices={() => setDemoShowPrices((v) => !v)}
            onClose={() => setIslandExpanded(false)}
            onEditStep={handleEditStep}
          />
        )}
      </AnimatePresence>

      {/* Portal mount for bottom-up drawers inside the 9:16 card */}
      <div ref={setSheetHost} />
    </section>
  );

  if (compact) {
    return cardShell;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-[920px] mx-auto">
      <AnimatePresence initial={false}>
        {showReport && (
          <motion.div
            key="pixia-spec-report"
            initial={{ opacity: 0, x: -18, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block w-full max-w-[420px] shrink-0"
          >
            <SpecificationSummary
              engine={engine}
              bootstrap={bootstrap}
              demoShowPrices={demoShowPrices}
              onToggleDemoPrices={() => setDemoShowPrices((v) => !v)}
              onEditStep={handleEditStep}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] flex justify-center shrink-0"
      >
        {cardShell}
      </motion.div>
    </div>
  );
}
