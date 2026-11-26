'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  completeContractCreation,
  completeOtpVerification,
  completePdfAndFinish,
  completeProductSearch,
  confirmClientAccountProfile,
  createInitialEngineState,
  proceedToManualForm,
  rewindToStep,
  selectDeliveryChoice,
  selectDistance,
  selectEnvironment,
  selectInstallationChoice,
  selectPitch,
  selectProduct,
  selectProjectType,
  startProductSearch,
  stepBack,
  submitDeliveryCity,
  submitDimensions,
  submitFormAddress,
  submitFormCompany,
  submitFormEmail,
  submitFormPhone,
  submitFormRepresentative,
  submitQuantity,
  submitRentalComment,
  submitRentalPeriod,
  submitSitePhoto,
  switchEngineLanguage,
  type PixiaEngineState,
} from '../../core/fsm/pixia-fsm';
import type { PriceSnapshot } from '@/lib/types';
import {
  STEP,
  type BootstrapPayload,
  type ClientProfile,
  type EnvironmentType,
  type Language,
  type Product,
  type ProjectType,
  type ScreenShape,
} from '../../core/types';
import {
  buildQuotePdfFilename,
  renderQuotePdfFromTemplate,
  type GeneratedQuotePdf,
} from '../pdf/pdf-generator';
import {
  createQuoteWithContract,
  loginClientAccount,
  logoutClientAccount,
  resendQuoteOtp,
  uploadQuotePdf,
  verifyQuoteOtp,
} from '../../services/pixia-api';

export function usePixiaEngine(params: {
  bootstrap: BootstrapPayload | null;
  initialLang: Language;
  onAutoClose?: () => void;
  /** Conteneur hors écran du modèle de devis officiel (QuotePDF). */
  pdfContainerRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const { bootstrap, initialLang, onAutoClose, pdfContainerRef } = params;
  const [engine, setEngine] = useState<PixiaEngineState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailMode, setEmailMode] = useState<'dev-simulated' | 'smtp'>('dev-simulated');
  const [devSimulatedOtp, setDevSimulatedOtp] = useState<string | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<GeneratedQuotePdf | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(
    () => bootstrap?.clientProfile ?? null
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const timersRef = useRef<number[]>([]);
  const priceSnapshotRef = useRef<PriceSnapshot | null>(null);
  const [priceSnapshot, setPriceSnapshot] = useState<PriceSnapshot | null>(null);

  const clearPendingTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    setIsTyping(false);
  }, []);

  const scheduleTransition = useCallback(
    (delayMs: number, fn: () => void) => {
      clearPendingTimers();
      setIsTyping(true);
      const id = window.setTimeout(() => {
        setIsTyping(false);
        fn();
      }, delayMs);
      timersRef.current.push(id);
    },
    [clearPendingTimers]
  );

  useEffect(() => {
    if (bootstrap && !engine) {
      setEngine(createInitialEngineState(initialLang, bootstrap));
      setEmailMode(bootstrap.emailMode);
      setClientProfile(bootstrap.clientProfile ?? null);
    }
  }, [bootstrap, engine, initialLang]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
    };
  }, [clearPendingTimers]);

  // Auto-close after 6 consecutive validation errors (2s delay per audit §6.3)
  useEffect(() => {
    if (!engine?.shouldAutoClose) return;
    const id = window.setTimeout(() => {
      onAutoClose?.();
    }, 2000);
    return () => window.clearTimeout(id);
  }, [engine?.shouldAutoClose, onAutoClose]);

  // OTP resend cooldown ticker
  useEffect(() => {
    if (!engine || engine.step !== STEP.SECURITE || engine.security.otpCooldownSeconds <= 0) {
      return;
    }
    const id = window.setInterval(() => {
      setEngine((prev) => {
        if (!prev || prev.security.otpCooldownSeconds <= 0) return prev;
        return {
          ...prev,
          security: {
            ...prev.security,
            otpCooldownSeconds: Math.max(0, prev.security.otpCooldownSeconds - 1),
          },
        };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [engine?.step, engine?.security.otpCooldownSeconds]);

  // Generate & upload PDF automatically when reaching FELICITATIONS
  const generateAndPersistPdf = useCallback(
    async (current: PixiaEngineState) => {
      if (!bootstrap || !current.quoteId || !current.quoteReference) return;
      setIsGeneratingPdf(true);
      setPdfError(null);
      try {
        const snapshot = priceSnapshotRef.current;
        if (!snapshot) {
          throw new Error('Snapshot de prix officiel indisponible.');
        }

        const container = pdfContainerRef.current;
        if (!container) {
          throw new Error('Modèle de devis officiel non monté.');
        }
        const filename = buildQuotePdfFilename(
          current.form.company,
          current.quoteReference
        );
        const pdfDoc = await renderQuotePdfFromTemplate(container, filename);

        setGeneratedPdf(pdfDoc);
        const uploaded = await uploadQuotePdf(
          current.quoteId,
          pdfDoc.base64,
          current.capabilityToken
        );
        setEngine((prev) => (prev ? completePdfAndFinish(prev, uploaded.pdfUrl) : prev));
      } catch (err) {
        setPdfError(err instanceof Error ? err.message : 'PDF generation failed');
      } finally {
        setIsGeneratingPdf(false);
      }
    },
    [bootstrap, pdfContainerRef]
  );

  useEffect(() => {
    if (engine?.step === STEP.FELICITATIONS && !engine.security.pdfUrl && !isGeneratingPdf && !pdfError) {
      void generateAndPersistPdf(engine);
    }
  }, [engine, isGeneratingPdf, pdfError, generateAndPersistPdf]);

  const reset = useCallback(() => {
    if (!bootstrap) return;
    clearPendingTimers();
    setQuoteError(null);
    setOtpError(null);
    setDevSimulatedOtp(null);
    priceSnapshotRef.current = null;
    setPriceSnapshot(null);
    setGeneratedPdf(null);
    setPdfError(null);
    setEngine((prev) => createInitialEngineState(prev?.lang ?? initialLang, bootstrap));
  }, [bootstrap, clearPendingTimers, initialLang]);

  const back = useCallback(() => {
    clearPendingTimers();
    setQuoteError(null);
    setOtpError(null);
    setEngine((prev) => (prev ? stepBack(prev) : prev));
  }, [clearPendingTimers]);

  const goToStep = useCallback(
    (targetStep: STEP) => {
      clearPendingTimers();
      setQuoteError(null);
      setOtpError(null);
      setEngine((prev) => (prev ? rewindToStep(prev, targetStep) : prev));
    },
    [clearPendingTimers]
  );

  const setLanguage = useCallback(
    (nextLang: Language) => {
      if (!bootstrap) return;
      setEngine((prev) => {
        if (!prev) return prev;
        const updated = switchEngineLanguage(prev, nextLang, bootstrap);
        if (updated.step === STEP.SUCCESS || updated.step === STEP.FELICITATIONS) {
          setGeneratedPdf(null);
          setPdfError(null);
          return { ...updated, step: STEP.FELICITATIONS };
        }
        return updated;
      });
    },
    [bootstrap]
  );

  const chooseProjectType = useCallback(
    (type: ProjectType) => {
      if (!bootstrap) return;
      scheduleTransition(350, () => {
        setEngine((prev) => (prev ? selectProjectType(prev, type, bootstrap) : prev));
      });
    },
    [bootstrap, scheduleTransition]
  );

  const confirmRentalPeriod = useCallback(
    (payload: { startDate: string; endDate: string; startTime: string; endTime: string }) => {
      if (!bootstrap) return;
      scheduleTransition(350, () => {
        setEngine((prev) => (prev ? submitRentalPeriod(prev, payload, bootstrap) : prev));
      });
    },
    [bootstrap, scheduleTransition]
  );

  const confirmRentalComment = useCallback(
    (comment: string | null) => {
      if (!bootstrap) return;
      scheduleTransition(300, () => {
        setEngine((prev) => (prev ? submitRentalComment(prev, comment, bootstrap) : prev));
      });
    },
    [bootstrap, scheduleTransition]
  );

  const chooseEnvironment = useCallback(
    (env: EnvironmentType) => {
      scheduleTransition(350, () => {
        setEngine((prev) => (prev ? selectEnvironment(prev, env) : prev));
      });
    },
    [scheduleTransition]
  );

  const confirmDimensions = useCallback(
    (
      widthRaw: string,
      heightRaw: string,
      screenShape: ScreenShape = 'flat',
      curveLeft?: number,
      curveRight?: number
    ) => {
      if (!bootstrap) return;
      setEngine((prev) =>
        prev
          ? submitDimensions(prev, widthRaw, heightRaw, bootstrap, screenShape, curveLeft, curveRight)
          : prev
      );
    },
    [bootstrap]
  );

  const chooseDistance = useCallback(
    (distance: string) => {
      if (!bootstrap) return;
      scheduleTransition(350, () => {
        setEngine((prev) => (prev ? selectDistance(prev, distance, bootstrap) : prev));
      });
    },
    [bootstrap, scheduleTransition]
  );

  const choosePitch = useCallback(
    (pitchValue: number, pitchLabel: string) => {
      if (!bootstrap) return;
      clearPendingTimers();
      setIsTyping(true);
      const t1 = window.setTimeout(() => {
        setEngine((prev) => {
          if (!prev) return prev;
          const afterPitch = selectPitch(prev, pitchValue, pitchLabel);
          return startProductSearch(afterPitch);
        });
        const t2 = window.setTimeout(() => {
          setIsTyping(false);
          setEngine((prev) => (prev ? completeProductSearch(prev, bootstrap) : prev));
        }, 2000);
        timersRef.current.push(t2);
      }, 320);
      timersRef.current.push(t1);
    },
    [bootstrap, clearPendingTimers]
  );

  const runProductSearch = useCallback(() => {
    if (!bootstrap) return;
    setEngine((prev) => (prev ? startProductSearch(prev) : prev));
    scheduleTransition(2000, () => {
      setEngine((prev) => (prev ? completeProductSearch(prev, bootstrap) : prev));
    });
  }, [bootstrap, scheduleTransition]);

  const chooseProduct = useCallback(
    (product: Product) => {
      scheduleTransition(300, () => {
        setEngine((prev) => (prev ? selectProduct(prev, product) : prev));
      });
    },
    [scheduleTransition]
  );

  const confirmQuantity = useCallback((qty: string | number) => {
    setEngine((prev) => (prev ? submitQuantity(prev, qty) : prev));
  }, []);

  const confirmSitePhoto = useCallback(
    (dataUrl: string | null) => {
      setEngine((prev) =>
        prev
          ? submitSitePhoto(prev, dataUrl, {
              enableAccountStep: true,
              isLoggedIn: Boolean(clientProfile),
            })
          : prev
      );
    },
    [clientProfile]
  );

  const confirmClientProfile = useCallback((profile: ClientProfile) => {
    setAuthError(null);
    scheduleTransition(250, () => {
      setEngine((prev) => (prev ? confirmClientAccountProfile(prev, profile) : prev));
    });
  }, [scheduleTransition]);

  const chooseManualForm = useCallback(() => {
    setAuthError(null);
    scheduleTransition(220, () => {
      setEngine((prev) => (prev ? proceedToManualForm(prev) : prev));
    });
  }, [scheduleTransition]);

  const loginClient = useCallback(
    async (email: string, password: string): Promise<ClientProfile | null> => {
      setIsLoggingIn(true);
      setAuthError(null);
      try {
        const res = await loginClientAccount(email, password);
        if (!res.success || !res.profile) {
          setAuthError(res.error ?? 'Authentication failed');
          return null;
        }
        setClientProfile(res.profile);
        return res.profile;
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Authentication failed');
        return null;
      } finally {
        setIsLoggingIn(false);
      }
    },
    []
  );

  const logoutClient = useCallback(async () => {
    await logoutClientAccount();
    setClientProfile(null);
    setAuthError(null);
  }, []);

  const confirmCompany = useCallback((company: string) => {
    setEngine((prev) => (prev ? submitFormCompany(prev, company) : prev));
  }, []);

  const confirmRepresentative = useCallback((rep: string) => {
    setEngine((prev) => (prev ? submitFormRepresentative(prev, rep) : prev));
  }, []);

  const confirmEmail = useCallback((email: string) => {
    setEngine((prev) => (prev ? submitFormEmail(prev, email) : prev));
  }, []);

  const confirmPhone = useCallback((phone: string) => {
    setEngine((prev) => (prev ? submitFormPhone(prev, phone) : prev));
  }, []);

  const confirmAddress = useCallback((address: string) => {
    setEngine((prev) => (prev ? submitFormAddress(prev, address) : prev));
  }, []);

  const confirmDeliveryCity = useCallback(
    (city: string) => {
      const matched = bootstrap?.locations.villes.find(
        (v) => v.name.toLowerCase() === city.trim().toLowerCase()
      );
      setEngine((prev) => (prev ? submitDeliveryCity(prev, city, matched?.postcode ?? '') : prev));
    },
    [bootstrap]
  );

  const chooseDeliveryOption = useCallback((include: boolean) => {
    setEngine((prev) => (prev ? selectDeliveryChoice(prev, include) : prev));
  }, []);

  const chooseInstallationOption = useCallback((include: boolean) => {
    setEngine((prev) => (prev ? selectInstallationChoice(prev, include) : prev));
  }, []);

  const submitContract = useCallback(
    async (signatureDataUrl: string) => {
      if (!engine || !bootstrap) return;
      setIsSubmittingQuote(true);
      setQuoteError(null);
      try {
        const result = await createQuoteWithContract({
          language: engine.lang,
          clientDetails: engine.form,
          configState: engine.configState,
          includeDelivery: Boolean(engine.includeDelivery),
          includeInstallation: Boolean(engine.includeInstallation),
          signatureDataUrl,
          otpEnabledOverride: bootstrap.settings.isEmailVerificationEnabled,
          selectedCityId: bootstrap.locations.villes.find(
            (v) =>
              v.name.toLowerCase() === engine.form.deliveryCity.trim().toLowerCase() &&
              v.postcode === engine.form.deliveryPostcode.trim()
          )?.id ?? null,
        });

        priceSnapshotRef.current = result.priceSnapshot;
        setPriceSnapshot(result.priceSnapshot);
        setEmailMode(result.emailMode);
        setDevSimulatedOtp(null);

        setEngine((prev) =>
          prev
            ? completeContractCreation(prev, {
                quoteId: result.quoteId,
                quoteReference: result.reference,
                signatureDataUrl,
                otpRequired: result.otpRequired,
                capabilityToken: result.capabilityToken,
              })
            : prev
        );
      } catch (err) {
        setQuoteError(err instanceof Error ? err.message : 'Unable to submit quote');
      } finally {
        setIsSubmittingQuote(false);
      }
    },
    [engine, bootstrap]
  );

  const submitOtp = useCallback(
    async (code: string): Promise<boolean> => {
      if (!engine?.quoteId) return false;
      setIsVerifyingOtp(true);
      setOtpError(null);
      try {
        const [res] = await Promise.all([
          verifyQuoteOtp(engine.quoteId, code),
          new Promise<void>((resolve) => window.setTimeout(resolve, 700)),
        ]);
        if (!res.success) {
          setOtpError(res.error ?? 'INVALID_CODE');
          setEngine((prev) =>
            prev
              ? {
                  ...prev,
                  security: {
                    ...prev.security,
                    otpAttemptsLeft: Math.max(0, prev.security.otpAttemptsLeft - 1),
                  },
                }
              : prev
          );
          return false;
        }
        setDevSimulatedOtp(null);
        const id = window.setTimeout(() => {
          setEngine((prev) => (prev ? completeOtpVerification(prev, null) : prev));
        }, 1150);
        timersRef.current.push(id);
        return true;
      } catch (err) {
        setOtpError(err instanceof Error ? err.message : 'Verification failed');
        return false;
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [engine?.quoteId]
  );

  const resendOtp = useCallback(async () => {
    if (!engine?.quoteId) return;
    setOtpError(null);
    try {
      const res = await resendQuoteOtp(engine.quoteId);
      if (!res.success) {
        setOtpError(res.error ?? 'RESEND_FAILED');
        return;
      }
      setDevSimulatedOtp(null);
      setEngine((prev) =>
        prev
          ? {
              ...prev,
              security: {
                ...prev.security,
                otpAttemptsLeft: 3,
                otpCooldownSeconds: res.cooldownSeconds ?? 300,
                resendAttemptsLeft:
                  typeof res.resendAttemptsLeft === 'number'
                    ? res.resendAttemptsLeft
                    : Math.max(0, prev.security.resendAttemptsLeft - 1),
              },
            }
          : prev
      );
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'RESEND_FAILED');
    }
  }, [engine?.quoteId]);

  const retryPdfGeneration = useCallback(() => {
    if (!engine) return;
    void generateAndPersistPdf(engine);
  }, [engine, generateAndPersistPdf]);

  return {
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
    priceSnapshot,
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
  };
}
