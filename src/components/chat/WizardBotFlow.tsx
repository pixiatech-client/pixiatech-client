'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ArrowRight, ArrowLeft, Loader2, Calendar as CalendarIcon, Clock, Video, Download, Info, Layers, RotateCcw, CheckCircle2, Shield, PenTool, FileText, MailCheck, KeyRound, Check } from 'lucide-react';
import { format, parse } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { motion, AnimatePresence } from 'framer-motion';
import { Message, MessageOption, WizardSettings, Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import { uploadBytes } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import { ConfigState, INITIAL_STATE } from '@/lib/configurator-wizard-types';
import { StepDimensions, StepSummary } from '@/components/configurator-wizard';
import { ProductNotFound } from '@/components/ProductNotFound';
import { ProductComparator } from '@/components/product-comparator';
import { BlurredPrice } from '@/components/ui/blurred-price';
import { SuccessView } from '@/components/success-view';
import SignaturePad from '@/components/SignaturePad';
import ContractDocument from '@/components/ContractDocument';
import type { Pack } from '@/lib/signature-types';
import { getContractTemplate } from '@/lib/contract-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuoteWithContract, verifyQuoteOtp, resendQuoteOtp, getBlockedPeriods } from '@/app/actions/quote-actions';
import { updateQuotePdfUrl } from '@/app/admin/actions';
import { useUser } from '@/firebase';
import { useI18n } from '@/lib/i18n';
import confetti from 'canvas-confetti';

import type { QuoteDetails } from '@/lib/types';

interface WizardBotFlowProps {
  onClose: () => void;
  onHome?: () => void;
  allProducts: Product[];
  settings: Settings;
  laborSettings: LaborSettings;
  deliverySettings: DeliverySettings;
  locations: Locations | null;
}

const STEP = {
  PROJECT_TYPE: 1,
  ENVIRONMENT: 2,
  DIMENSIONS: 3,
  DISTANCE: 4,
  PITCH: 5,
  SUMMARY: 6,
  PRODUCTS: 7,
  QUANTITY: 8,
  RENTAL_PERIOD: 18,
  SITE_PHOTO: 19,
  FORM_COMPANY: 25,
  FORM_REPRESENTATIVE: 26,
  FORM_EMAIL: 12,
  FORM_PHONE: 27,
  FORM_ADDRESS: 28,
  CONTRAT: 20,
  SECURITE: 21,
  FELICITATIONS: 22,
  GENERATING: 16,
  SUCCESS: 17,
  INSTALLATION: 29,
} as const;

export function WizardBotFlow({ onClose, onHome, allProducts, settings, laborSettings, deliverySettings, locations }: WizardBotFlowProps) {
  const { t, locale, setLocale } = useI18n();
  const dateLocale = locale === 'en' ? enUS : fr;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState({ hour: '08', minute: '00' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [botStatus, setBotStatus] = useState<'thinking' | 'smiling' | 'solution' | 'angry' | 'default'>('default');
  const [wizardSettings, setWizardSettings] = useState<WizardSettings | null>(null);

  const initialized = useRef(false);
  const [step, setStep] = useState<number>(STEP.PROJECT_TYPE);
  const stepRef = useRef<number>(STEP.PROJECT_TYPE);
  const [stepHistory, setStepHistory] = useState<any[]>([]);

  const updateStep = useCallback((newStep: number) => {
    stepRef.current = newStep;
    setStep(newStep);
  }, []);
  const [configState, setConfigState] = useState<ConfigState>(INITIAL_STATE);
  const { user, userProfile } = useUser();

  const [quoteId, setQuoteId] = useState<string>('');

  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showComparator, setShowComparator] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<{ msgId: string; options: MessageOption[] } | null>(null);

  const [formCompany, setFormCompany] = useState('');
  const [formRepresentative, setFormRepresentative] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureValidated, setSignatureValidated] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractReadApproved, setContractReadApproved] = useState(false);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [resendAttemptsLeft, setResendAttemptsLeft] = useState(3);
  const [otpResent, setOtpResent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<any>(null);

  const takeSnapshot = useCallback(() => {
    setStepHistory(prev => [
      ...prev,
      {
        step: stepRef.current,
        messages: [...messages],
        configState: { ...configState },
        formCompany,
        formRepresentative,
        formPhone,
        formAddress,
        formEmail,
      }
    ]);
  }, [messages, configState, formCompany, formRepresentative, formPhone, formAddress, formEmail]);

  const handleBack = useCallback(() => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(prevHistory => prevHistory.slice(0, -1));

    stepRef.current = prev.step;
    setStep(prev.step);
    setMessages(prev.messages);
    setConfigState(prev.configState);
    setFormCompany(prev.formCompany || '');
    setFormRepresentative(prev.formRepresentative || '');
    setFormPhone(prev.formPhone || '');
    setFormAddress(prev.formAddress || '');
    setFormEmail(prev.formEmail || '');
  }, [stepHistory]);

  // Cost calculation
  const selectedProduct = allProducts.find(p => String(p.id) === String(configState.selectedProduct));
  const area = configState.width * configState.height;

  const lineTotal = React.useMemo(() => {
    if (!selectedProduct) return 0;
    let total = 0;
    if (selectedProduct.hasDimensions && selectedProduct.tileWidth && selectedProduct.tileHeight && selectedProduct.pricePerTile && selectedProduct.pricePerTile > 0) {
      const tilesPerWidth = Math.ceil((configState.width * 100) / selectedProduct.tileWidth);
      const tilesPerHeight = Math.ceil((configState.height * 100) / selectedProduct.tileHeight);
      total = (tilesPerWidth * tilesPerHeight) * selectedProduct.pricePerTile;
    } else {
      if (configState.projectType === 'vente' && selectedProduct.salePricePerSqM) {
        total = area * selectedProduct.salePricePerSqM;
      } else if (configState.projectType === 'location' && selectedProduct.rentalPricePerDay) {
        total = area * selectedProduct.rentalPricePerDay;
      }
    }
    return total * (configState.quantity || 1);
  }, [selectedProduct, configState.width, configState.height, configState.projectType, area, configState.quantity]);

  const totalQuote = lineTotal;

  const totalQuantity = configState.quantity || 1;
  const activePack: Pack = React.useMemo(() => ({
    id: selectedProduct?.id || 'custom-led-78',
    name: selectedProduct?.name || (configState.projectType === 'vente' ? 'Caissons LED Série Extra Plat' : 'Location Écran LED Sur-Mesure'),
    surface: `${area.toFixed(2)} m²`,
    price: Math.round(totalQuote),
    deposit: Math.round(totalQuote * 0.5),
    description: `Configuration de 1 produit(s) LED (${totalQuantity} écran(s) au total)`,
    specs: [
      `Quantité totale d'écrans : ${totalQuantity}`,
      `Surface totale d'affichage : ${area.toFixed(2)} m²`,
    ]
  }), [selectedProduct, configState.projectType, area, totalQuote, totalQuantity]);

  const renterDetails = React.useMemo(() => ({
    company: formCompany || userProfile?.displayName || 'bilama',
    representative: formRepresentative || userProfile?.displayName || t('signature.representativeDefault'),
    address: formAddress || t('signature.addressNotProvided'),
    postcode: '75000',
    city: 'Paris',
    email: formEmail || userProfile?.email || 'contact@client.com',
    phone: formPhone || t('signature.notSpecified')
  }), [userProfile, formCompany, formRepresentative, formAddress, formEmail, formPhone]);

  const [blockedPeriods, setBlockedPeriods] = useState<{ from: string; to: string }[]>([]);

  useEffect(() => {
    const loadBlockedPeriods = async () => {
      try {
        const periods = await getBlockedPeriods();
        setBlockedPeriods(periods);
      } catch (error) {
        console.error('Failed to load blocked periods:', error);
      }
    };
    loadBlockedPeriods();
  }, []);

  const isDateBlocked = useCallback((date: Date) => {
    // Zero out hours to compare strictly YYYY-MM-DD
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // avoid timezone shifts
    const dateStr = d.toISOString().split('T')[0];
    return blockedPeriods.some(period => {
      return dateStr >= period.from && dateStr <= period.to;
    });
  }, [blockedPeriods]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'wizard'));
        if (snap.exists()) setWizardSettings(snap.data() as WizardSettings);
      } catch (error) {
        console.error('Failed to load wizard settings', error);
      }
    };
    fetchSettings();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, step, scrollToBottom]);

  // OTP countdown timer
  useEffect(() => {
    if (step !== STEP.SECURITE || otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpCooldown]);

  // Confetti on FELICITATIONS - contained within chat
  useEffect(() => {
    if (step === STEP.FELICITATIONS && confettiCanvasRef.current) {
      if (!confettiInstanceRef.current) {
        confettiInstanceRef.current = confetti.create(confettiCanvasRef.current, { resize: true });
      }
      confettiInstanceRef.current({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [step]);

  // Fetch PDF URL in background during OTP so it's ready for FELICITATIONS
  useEffect(() => {
    if ((step !== STEP.SECURITE && step !== STEP.FELICITATIONS) || !quoteId || pdfUrl) return;
    const fetchPdf = async () => {
      setIsPdfLoading(true);
      try {
        const snap = await getDoc(doc(db, 'quotes', quoteId));
        const data = snap.data();
        if (data?.pdfUrl) {
          setPdfUrl(data.pdfUrl);
        }
      } catch (e) {
        console.error('Failed to fetch PDF URL:', e);
      } finally {
        setIsPdfLoading(false);
      }
    };
    const timer = setTimeout(fetchPdf, 2000);
    return () => clearTimeout(timer);
  }, [step, quoteId, pdfUrl]);

  const getBotImageForStep = (s: number) => {
    switch (s) {
      case STEP.PROJECT_TYPE: return '/bot-avatars/010.webp';
      case STEP.ENVIRONMENT: return '/bot-avatars/003.webp';
      case STEP.DIMENSIONS: return '/bot-avatars/28.webp';
      case STEP.DISTANCE: return '/bot-avatars/28.webp';
      case STEP.PITCH: return '/bot-avatars/005.webp';
      case STEP.SUMMARY: return '/bot-avatars/006.webp';
      case STEP.PRODUCTS: return '/bot-avatars/30.webp';
      case STEP.QUANTITY: return '/bot-avatars/28.webp';
      case STEP.SITE_PHOTO: return '/bot-avatars/012.webp';
      case STEP.FORM_REPRESENTATIVE: return '/bot-avatars/26.webp';
      case STEP.FORM_EMAIL: return '/bot-avatars/011.webp';
      case STEP.FORM_COMPANY: return '/bot-avatars/22.webp';
      case STEP.FORM_PHONE: return '/bot-avatars/009.webp';
      case STEP.FORM_ADDRESS: return '/bot-avatars/013.webp';
      case STEP.INSTALLATION: return '/bot-avatars/29.webp';
      case STEP.CONTRAT: return '/bot-avatars/24.webp';
      case STEP.SECURITE: return '/bot-avatars/14.webp';
      case STEP.FELICITATIONS: return '/bot-avatars/14.webp';
      case STEP.GENERATING: return '/bot-avatars/003.webp';
      case STEP.SUCCESS: return '/bot-avatars/002.webp';
      case STEP.RENTAL_PERIOD: return '/bot-avatars/34.webp';
      default: return '/bot-avatars/001.webp';
    }
  };

  const getAngryImage = () => '/bot-avatars/005.webp';

  const pushBotMessage = useCallback((content: string, options?: MessageOption[], delay = 600, customImage?: string, onComplete?: () => void, translationKey?: string, translationParams?: Record<string, string | number>) => {
    setIsTyping(true);
    setBotStatus('thinking');
    setTimeout(() => {
      setIsTyping(false);
      setBotStatus(options ? 'thinking' : 'smiling');
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}-${Math.random()}`,
        chatId: 'wizard-bot',
        senderId: 'bot',
        senderName: 'Lumi',
        senderRole: 'bot',
        content,
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        options,
        botImage: customImage || getBotImageForStep(stepRef.current),
        translationKey,
        translationParams,
      }]);
      if (onComplete) onComplete();
    }, delay);
  }, []);

  const pushUserMessage = (content: string, imageUrl?: string, translationKey?: string, translationParams?: Record<string, string | number>) => {
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].senderId === 'bot' && updated[i].options) {
          updated[i] = { ...updated[i], options: undefined };
          break;
        }
      }
      return [...updated, {
        id: `user-${Date.now()}`,
        chatId: 'wizard-bot',
        senderId: 'user',
        content,
        type: imageUrl ? 'image' : 'text',
        fileUrl: imageUrl,
        status: 'seen',
        createdAt: new Date(),
        translationKey,
        translationParams,
      }];
    });
  };

  const startConversation = useCallback((settingsObj: WizardSettings | null = wizardSettings) => {
    if (!settingsObj) return;
    setMessages([]);
    setStepHistory([]);
    updateStep(STEP.PROJECT_TYPE);
    setConfigState(INITIAL_STATE);
    setContractReadApproved(false);
    setSignatureDataUrl(null);
    setSignatureValidated(false);
    setContractAccepted(false);
    setIsSubmittingContract(false);
    setOtpCode('');
    setOtpError('');
    setOtpVerified(false);
    setOtpAttempts(0);
    setOtpCooldown(0);
    setPdfUrl(null);
    setFormCompany('');
    setFormRepresentative('');
    setFormPhone('');
    setFormAddress('');

    setBotStatus('smiling');
    pushBotMessage(t('bot.welcome'), undefined, 400, undefined, undefined, 'bot.welcome');

    setTimeout(() => {
      const types: MessageOption[] = [];
      if (settingsObj.projectTypes?.location?.enabled !== false)
        types.push({ label: t('bot.rental'), value: 'location', imageUrl: settingsObj.projectTypes?.location?.imageUrl, translationKey: 'bot.rental' });
      if (settingsObj.projectTypes?.vente?.enabled !== false)
        types.push({ label: t('bot.sale'), value: 'vente', imageUrl: settingsObj.projectTypes?.vente?.imageUrl, translationKey: 'bot.sale' });
      pushBotMessage(t('bot.questionType'), types, 600, undefined, undefined, 'bot.questionType');
    }, 800);
  }, [wizardSettings, pushBotMessage]);

  useEffect(() => {
    if (!wizardSettings || initialized.current) return;
    initialized.current = true;
    startConversation(wizardSettings);
  }, [wizardSettings, startConversation]);

  const handleOptionSelect = (value: string, label: string, imageUrl?: string, translationKey?: string, translationParams?: Record<string, string | number>) => {
    takeSnapshot();
    pushUserMessage(label, imageUrl, translationKey, translationParams);

    if (step === STEP.PROJECT_TYPE) {
      setConfigState(prev => ({ ...prev, projectType: value as any }));
      if (value === 'location') {
        setBotStatus('smiling');
        pushBotMessage(t('bot.perfectRental'), undefined, 800, '/bot-avatars/005.webp', undefined, 'bot.perfectRental');
        setTimeout(() => pushBotMessage(t('bot.promptRentalPeriod'), undefined, 1200, '/bot-avatars/34.webp', () => {
          updateStep(STEP.RENTAL_PERIOD);
        }, 'bot.promptRentalPeriod'), 1000);
      } else {
        setBotStatus('smiling');
        pushBotMessage(t('bot.perfectSale', { type: value.toLowerCase() }), undefined, 800, '/bot-avatars/003.webp', () => {
          updateStep(STEP.ENVIRONMENT);
          promptEnvironment();
        }, 'bot.perfectSale', { type: value.toLowerCase() });
      }
    }
    else if (step === STEP.ENVIRONMENT) {
      setConfigState(prev => ({ ...prev, environment: value as any }));
      setBotStatus('smiling');
      pushBotMessage(t('bot.perfectSale', { type: configState.projectType === 'location' ? 'location' : 'vente' }), undefined, 800, undefined, () => {
        pushBotMessage(t('bot.dimensions'), undefined, 1200, '/bot-avatars/28.webp', () => {
          updateStep(STEP.DIMENSIONS);
        }, 'bot.dimensions');
      }, 'bot.perfectSale', { type: configState.projectType === 'location' ? 'location' : 'vente' });
    }
    else if (step === STEP.DISTANCE) {
      handleDistanceSelect(value, label);
    }
    else if (step === STEP.PITCH) {
      setConfigState(prev => ({ ...prev, pixelPitch: value }));
      updateStep(STEP.SUMMARY);
      setBotStatus('solution');
      pushBotMessage(t('bot.excellentChoice'), undefined, 0, undefined, undefined, 'bot.excellentChoice');
    }

  };

  const promptEnvironment = () => {
    const envs: MessageOption[] = [];
    if (wizardSettings?.environments?.interieur) envs.push({ label: t('bot.indoor'), value: 'interieur', imageUrl: wizardSettings.environments.interieur.imageUrl, translationKey: 'bot.indoor' });
    if (wizardSettings?.environments?.['semi-exterieur']) envs.push({ label: t('bot.semiOutdoor'), value: 'semi-exterieur', imageUrl: wizardSettings.environments['semi-exterieur'].imageUrl, translationKey: 'bot.semiOutdoor' });
    if (wizardSettings?.environments?.exterieur) envs.push({ label: t('bot.outdoor'), value: 'exterieur', imageUrl: wizardSettings.environments.exterieur.imageUrl, translationKey: 'bot.outdoor' });
    pushBotMessage(t('bot.promptEnvironment'), envs.length ? envs : [
      { label: t('bot.indoor'), value: 'interieur', translationKey: 'bot.indoor' },
      { label: t('bot.semiOutdoor'), value: 'semi-exterieur', translationKey: 'bot.semiOutdoor' },
      { label: t('bot.outdoor'), value: 'exterieur', translationKey: 'bot.outdoor' },
    ], 1500, '/bot-avatars/003.webp', undefined, 'bot.promptEnvironment');
  };

  const handleRentalPeriodSubmit = () => {
    takeSnapshot();
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formattedStart = formatDate(configState.rentalStartDate || '');
    const formattedEnd = formatDate(configState.rentalEndDate || '');

    const rentalPeriodContent = t('bot.userRentalPeriod', { start: formattedStart, end: formattedEnd, startTime: configState.rentalStartTime || '08:00', endTime: configState.rentalEndTime || '18:00' });
    pushUserMessage(rentalPeriodContent);
    setBotStatus('smiling');
    pushBotMessage(t('bot.periodNoted'), undefined, 800, '/bot-avatars/34.webp', () => {
      updateStep(STEP.ENVIRONMENT);
      promptEnvironment();
    }, 'bot.periodNoted');
  };

  const handleDimensionsSubmit = () => {
    if (!configState.width || !configState.height) return;
    takeSnapshot();
    pushUserMessage(`${configState.width}m&nbsp;×&nbsp;${configState.height}m`);
    updateStep(STEP.DISTANCE);
    pushBotMessage(t('bot.dimensionsNoted'), undefined, 0, '/bot-avatars/27.webp', undefined, 'bot.dimensionsNoted');
    setTimeout(() => {
      const pType = configState.projectType === 'location' ? 'rental' : 'sale';
      const availableDistances = Array.from(new Set(
        allProducts
          .filter(p => p.availableFor.includes(pType) && p.distance)
          .map(p => p.distance)
      )).sort();

      let dists: MessageOption[] = [];
      if (availableDistances.length > 0) {
        dists = availableDistances.map(d => {
          const setting = wizardSettings?.viewingDistances.find(s => s.value === d);
          return { label: d!, value: d!, imageUrl: setting?.imageUrl };
        });
      } else {
        dists = (wizardSettings?.viewingDistances ?? []).map(d => ({ label: d.value, value: d.value, imageUrl: d.imageUrl }));
        if (!dists.length) {
          dists.push(
            { label: '0.5–2m', value: '0.5-2m' },
            { label: '2–5m', value: '2-5m' },
            { label: '5–10m', value: '5-10m' },
            { label: '10–20m', value: '10-20m' },
            { label: '+20m', value: '+20m' }
          );
        }
      }
      pushBotMessage(t('bot.distance'), dists, 0, '/bot-avatars/28.webp', undefined, 'bot.distance');
    }, 1500);
  };

  const handleDistanceSelect = (value: string, label: string) => {
    setConfigState(prev => ({ ...prev, distance: value as any }));

    // Filter pitches based on distance
    // Rule: Distance (m) is roughly Pitch (mm)
    let minPitch = 0, maxPitch = 99;
    if (value === '0.5-2m') { minPitch = 0; maxPitch = 2.9; }
    else if (value === '2-5m') { minPitch = 2.5; maxPitch = 4.8; }
    else if (value === '5-10m') { minPitch = 3.9; maxPitch = 8; }
    else if (value === '10-20m') { minPitch = 8; maxPitch = 16; }
    else if (value === '+20m') { minPitch = 16; maxPitch = 99; }

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

    const formatPitchLabel = (pitch: string) => {
      return marketingEquivalents[pitch] ? `${pitch} • ${marketingEquivalents[pitch]}` : pitch;
    };

    const pitches: MessageOption[] = (wizardSettings?.pixelPitches ?? [])
      .filter(p => {
        const val = parseFloat(p.value.replace('P', ''));
        return val >= minPitch && val <= maxPitch;
      })
      .map(p => ({ label: formatPitchLabel(p.value), value: p.value, imageUrl: p.imageUrl }));

    if (pitches.length === 0) {
      // Fallback to all if none match
      pitches.push(...(wizardSettings?.pixelPitches ?? []).map(p => ({ label: formatPitchLabel(p.value), value: p.value, imageUrl: p.imageUrl })));
    }

    if (!pitches.find(p => p.value === 'Je ne sais pas')) pitches.push({ label: t('bot.dontKnow'), value: 'Je ne sais pas', translationKey: 'bot.dontKnow' });

    updateStep(STEP.PITCH);
    pushBotMessage(t('bot.pitches'), pitches, 0, undefined, undefined, 'bot.pitches');
  };

  const handleProceedToProducts = async () => {
    takeSnapshot();
    const area = configState.width * configState.height;
    const pitchValue = parseFloat(configState.pixelPitch.replace('P', '')) || 2.5;

    const filteredProducts = (allProducts || []).filter(p => {
      if (p.isHidden) return false;
      if (!p.pitch && !p.distance) return true;
      const productPitch = p.pitch ? parseFloat(String(p.pitch).replace('P', '')) : null;
      if (productPitch !== null) {
        const diff = Math.abs(productPitch - pitchValue);
        if (diff > 1.5) return false;
      }
      return true;
    });

    let sortedProducts = [...filteredProducts].sort((a, b) => {
      const aPitch = a.pitch ? parseFloat(String(a.pitch).replace('P', '')) || 999 : 999;
      const bPitch = b.pitch ? parseFloat(String(b.pitch).replace('P', '')) || 999 : 999;
      return Math.abs(aPitch - pitchValue) - Math.abs(bPitch - pitchValue);
    });

    // Clear summary immediately and start bot search animation
    updateStep(STEP.GENERATING);
    setBotStatus('thinking');

    // Availability search and sorting removed to speed up the app

    setMatchingProducts(sortedProducts);
    setCurrentProductIndex(0);

    pushBotMessage(t('bot.searching'), undefined, 800, '/bot-avatars/21.webp', () => {
      updateStep(STEP.PRODUCTS);
      setBotStatus('solution');
      pushBotMessage(sortedProducts.length > 0 ? t('bot.recommendation') : t('bot.noMatch'), undefined, 1000, '/bot-avatars/30.webp', undefined, sortedProducts.length > 0 ? 'bot.recommendation' : 'bot.noMatch');
    }, 'bot.searching');
  };

  const handleProductSelected = (productId: string) => {
    takeSnapshot();
    setConfigState(prev => ({ ...prev, selectedProduct: productId }));
    updateStep(STEP.QUANTITY);
    setBotStatus('smiling');
    pushBotMessage(t('bot.quantity', { width: configState.width, height: configState.height }), undefined, 0, '/bot-avatars/20.webp', undefined, 'bot.quantity', { width: configState.width, height: configState.height });
  };

  const handleQuantitySubmit = async () => {
    const qty = configState.quantity === undefined ? 1 : configState.quantity;
    if (qty <= 0) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage(t('bot.errorValidation'), undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        }, 'bot.errorValidation');
      } else if (newCount >= 3) {
        pushBotMessage(t('bot.errorHelp'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorHelp');
      } else {
        pushBotMessage(t('bot.errorQuantityZero'), undefined, 800, '/bot-avatars/19.webp', undefined, 'bot.errorQuantityZero');
      }
      return;
    }

    setErrorCount(0);
    takeSnapshot();
    const finalQty = qty || 1;
    pushUserMessage(t('bot.userQuantity', { count: finalQty }), undefined, 'bot.userQuantity', { count: finalQty });
    pushBotMessage(t('bot.photo'), undefined, 800, '/bot-avatars/012.webp', () => {
      updateStep(STEP.SITE_PHOTO);
    }, 'bot.photo');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      takeSnapshot();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setConfigState(prev => ({ ...prev, installationPhoto: dataUrl }));
        pushUserMessage(t('bot.photoPreview'), dataUrl);
        pushBotMessage(t('bot.photoSuccess'), undefined, 0, '/bot-avatars/26.webp', undefined, 'bot.photoSuccess');
        setTimeout(() => pushBotMessage(t('bot.company'), undefined, 1500, '/bot-avatars/22.webp', () => {
          updateStep(STEP.FORM_COMPANY);
        }, 'bot.company'), 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSkip = () => {
    takeSnapshot();
    pushUserMessage(t('bot.skip'));
    pushBotMessage(t('bot.company'), undefined, 800, '/bot-avatars/22.webp', () => {
      updateStep(STEP.FORM_COMPANY);
    }, 'bot.company');
  };

  const submitFinalQuoteWithContract = async () => {
    try {
      const uid = user?.uid || 'anonymous';
      setBotStatus('smiling');

      const envMap: Record<string, 'indoor' | 'outdoor' | 'showcase'> = { interieur: 'indoor', exterieur: 'outdoor', 'semi-exterieur': 'showcase' };
      const rentalPeriod = configState.rentalStartDate && configState.rentalEndDate
        ? { from: configState.rentalStartDate, to: configState.rentalEndDate }
        : undefined;

      const res = await createQuoteWithContract(
        uid,
        {
          company: renterDetails.company,
          representative: renterDetails.representative,
          address: renterDetails.address,
          postcode: renterDetails.postcode,
          city: renterDetails.city,
          email: formEmail,
          phone: renterDetails.phone,
          notes: '',
          sitePhoto: configState.installationPhoto || undefined,
        },
        {
          products: selectedProduct ? [{
            id: `config_${Date.now()}`,
            productId: String(configState.selectedProduct),
            productType: envMap[configState.environment] || 'indoor',
            width: configState.width,
            height: configState.height,
            quantity: configState.quantity || 1,
            transactionType: configState.projectType === 'vente' ? 'sale' : 'rental',
            rentalDuration: 1,
            rentalUnit: 'day',
            productName: selectedProduct.name,
            lineTotal,
          }] : [],
          transactionType: configState.projectType === 'vente' ? 'sale' : 'rental',
          includeInstallation,
          installationCost: includeInstallation ? 0 : 0,
          techniciansRequired: includeInstallation ? 1 : 0,
          includeDelivery: false,
          deliveryCost: 0,
          totalQuote,
          width: configState.width,
          height: configState.height,
          productName: selectedProduct?.name ?? '',
          lang: locale,
          rentalPeriod,
          rentalStartTime: configState.rentalStartTime,
          rentalEndTime: configState.rentalEndTime,
        },
        signatureDataUrl || ''
      );

      if (res.success && res.id) {
        setQuoteId(res.id);
        setIsSendingCode(false);
        const isEvEnabled = settings.isEmailVerificationEnabled ?? true;
        if (isEvEnabled) {
          // Auto-copy OTP to clipboard (same as guided config)
          if (res.otpCode) {
            navigator.clipboard.writeText(res.otpCode).catch(() => {});
          }
          setOtpCooldown(300);
          setOtpAttempts(0);
          setResendAttemptsLeft(3);
          setOtpResent(false);
          updateStep(STEP.SECURITE);
          setBotStatus('default');
          pushBotMessage(t('bot.otpSent'), undefined, 800, '/bot-avatars/35.webp', undefined, 'bot.otpSent');
        } else {
          updateStep(STEP.FELICITATIONS);
        }
      } else {
        setIsSendingCode(false);
        pushBotMessage(res.error || t('bot.errorQuote'), undefined, 800, '/bot-avatars/19.webp', undefined, 'bot.errorQuote');
      }
    } catch (e) {
      console.error('submitFinalQuoteWithContract error:', e);
      setIsSendingCode(false);
      pushBotMessage(t('bot.errorQuote'), undefined, 800, '/bot-avatars/19.webp', undefined, 'bot.errorQuote');
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const ensurePdfReady = useCallback(async () => {
    if (pdfUrl || !quoteId || isGeneratingPdf) return pdfUrl;
    setIsGeneratingPdf(true);
    try {
      const snap = await getDoc(doc(db, 'quotes', quoteId));
      const data = snap.data();
      if (data?.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        return data.pdfUrl;
      }
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      let y = 20;
      const write = (text: string, size = 12, bold = false) => {
        if (bold) pdf.setFont('Helvetica', 'bold');
        else pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(text, pageW - 40);
        if (y + lines.length * (size * 0.3528) > 287) {
          pdf.addPage();
          y = 20;
        }
        lines.forEach((l: string) => { pdf.text(l, 20, y); y += size * 0.3528 + 2; });
      };
      write('Estimation PIXIA TECH', 22, true);
      y += 8;
      write(`Client: ${data.client?.companyName || formCompany}`, 12, true);
      write(`Email: ${data.client?.email || formEmail}`, 10);
      write(`Tel: ${data.client?.phone || ''}`, 10);
      write(`Adresse: ${data.client?.address || ''}`, 10);
      y += 6;
      write(`Produit: ${data.productName || selectedProduct?.name || ''}`, 12, true);
      write(`Dimensions: ${data.width || configState.width}m x ${data.height || configState.height}m`, 10);
      write(`Quantité: ${data.quantity || configState.quantity || 1}`, 10);
      write(`Type: ${data.transactionType === 'sale' ? 'Vente' : 'Location'}`, 10);
      y += 6;
      const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';
      write(`Total: ${fmt(data.totalQuote || totalQuote)}`, 14, true);
      const blob = pdf.output('blob');
      const storageRef = ref(storage, `quotes/pdfs/${quoteId}.pdf`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await updateQuotePdfUrl(quoteId, url);
      setPdfUrl(url);
      return url;
    } catch (e) {
      console.error('PDF generation error:', e);
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [quoteId, pdfUrl, isGeneratingPdf, formCompany, formEmail, selectedProduct, configState, totalQuote]);

  const handleFormCompany = () => {
    if (!formCompany.trim()) return;
    takeSnapshot();
    pushUserMessage(formCompany);
    const repPrompt = locale === 'fr'
      ? "Quel est le nom et le prénom du signataire (représentant légal) ?"
      : "What is the full name of the signer (legal representative)?";
    pushBotMessage(repPrompt, undefined, 800, '/bot-avatars/22.webp', () => {
      updateStep(STEP.FORM_REPRESENTATIVE);
    });
  };

  const handleFormRepresentative = () => {
    if (!formRepresentative.trim()) return;
    takeSnapshot();
    pushUserMessage(formRepresentative);
    pushBotMessage(t('bot.email'), undefined, 800, '/bot-avatars/22.webp', () => {
      updateStep(STEP.FORM_EMAIL);
    }, 'bot.email');
  };

  const handleFormEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage(t('bot.errorValidation'), undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        }, 'bot.errorValidation');
      } else if (newCount >= 3) {
        pushBotMessage(t('bot.errorHelp'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorHelp');
      } else {
        pushBotMessage(t('bot.errorEmailInvalid'), undefined, 800, '/bot-avatars/36.webp', undefined, 'bot.errorEmailInvalid');
      }
      return;
    }
    setErrorCount(0);
    takeSnapshot();
    pushUserMessage(formEmail);
    pushBotMessage(t('bot.phone'), undefined, 800, '/bot-avatars/25.webp', () => {
      updateStep(STEP.FORM_PHONE);
    }, 'bot.phone');
  };

  const handleFormPhone = () => {
    if (!formPhone.trim()) return;
    const cleanPhone = formPhone.replace(/\s+/g, '');
    const phoneRegex = /^\+?[0-9]{10,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage(t('bot.errorValidation'), undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        }, 'bot.errorValidation');
      } else if (newCount >= 3) {
        pushBotMessage(t('bot.errorHelp'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorHelp');
      } else {
        pushBotMessage(t('bot.errorPhoneInvalid'), undefined, 800, '/bot-avatars/008.webp', undefined, 'bot.errorPhoneInvalid');
      }
      return;
    }
    setErrorCount(0);
    takeSnapshot();
    pushUserMessage(formPhone);
    pushBotMessage(t('bot.address'), undefined, 800, '/bot-avatars/013.webp', () => {
      updateStep(STEP.FORM_ADDRESS);
    }, 'bot.address');
  };

  const handleFormAddress = () => {
    if (!formAddress.trim() || formAddress.trim().length < 8) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage(t('bot.errorValidation'), undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        }, 'bot.errorValidation');
      } else if (newCount >= 3) {
        pushBotMessage(t('bot.errorHelp'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorHelp');
      } else {
        pushBotMessage(t('bot.errorAddressShort'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorAddressShort');
      }
      return;
    }
    setErrorCount(0);
    setContractReadApproved(false);
    setSignatureDataUrl(null);
    setSignatureValidated(false);
    setContractAccepted(false);
    setIsSubmittingContract(false);
    takeSnapshot();
    pushUserMessage(formAddress);
    pushBotMessage(t('bot.promptInstallation'), undefined, 800, '/bot-avatars/29.webp', () => {
      updateStep(STEP.INSTALLATION);
    }, 'bot.promptInstallation');
  };

  const handleInstallation = (include: boolean) => {
    setIncludeInstallation(include);
    takeSnapshot();
    if (include) {
      pushUserMessage(locale === 'fr' ? '✅ Oui, inclure l\'installation' : '✅ Yes, include installation');
      pushBotMessage(t('bot.installationIncluded'), undefined, 600, '/bot-avatars/29.webp', () => {
        pushBotMessage(t('bot.terms'), undefined, 800, '/bot-avatars/24.webp', () => {
          updateStep(STEP.CONTRAT);
        }, 'bot.terms');
      }, 'bot.installationIncluded');
    } else {
      pushUserMessage(locale === 'fr' ? '❌ Non, je m\'en occupe' : '❌ No, I\'ll handle it');
      pushBotMessage(t('bot.noProblem'), undefined, 600, '/bot-avatars/29.webp', () => {
        pushBotMessage(t('bot.terms'), undefined, 800, '/bot-avatars/24.webp', () => {
          updateStep(STEP.CONTRAT);
        }, 'bot.terms');
      }, 'bot.noProblem');
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setSignatureValidated(true);
  };

  const handleSignatureClear = () => {
    setSignatureDataUrl(null);
    setSignatureValidated(false);
    setContractAccepted(false);
  };

  const handleContractAccept = () => {
    if (!signatureValidated) return;
    setContractAccepted(true);
    setIsSendingCode(true);
    updateStep(STEP.SECURITE);
    pushBotMessage(t('bot.contractSigned'), undefined, 400, '/bot-avatars/24.webp', () => {
      submitFinalQuoteWithContract();
    }, 'bot.contractSigned');
  };


  const handleOtpSubmit = async () => {
    if (!quoteId || otpCode.length < 6) return;
    if (otpAttempts >= 3) {
      setOtpError(locale === 'fr' ? 'Trop de tentatives. Veuillez recommencer.' : 'Too many attempts. Please restart.');
      return;
    }
    setOtpError('');
    try {
      const res = await verifyQuoteOtp(quoteId, otpCode);
      if (res.success) {
        setOtpVerified(true);
        updateStep(STEP.FELICITATIONS);
      } else {
        setOtpAttempts(prev => prev + 1);
        const err = res.error || '';
        if (err.includes('expired')) {
          setOtpError(locale === 'fr' ? 'Le code de vérification a expiré.' : err);
        } else {
          setOtpError(err || t('bot.otpError'));
        }
      }
    } catch (e) {
      setOtpError(t('bot.otpError'));
    }
  };

  const handleResendOtp = async () => {
    if (!quoteId || isResending) return;
    if (resendAttemptsLeft <= 1) {
      setTimeout(() => onClose(), 2000);
      return;
    }
    setResendAttemptsLeft(prev => prev - 1);
    setIsResending(true);
    try {
      await resendQuoteOtp(quoteId);
      setOtpCooldown(300);
      setOtpAttempts(0);
      setOtpCode('');
      setOtpError('');
      setOtpResent(true);
      setTimeout(() => setOtpResent(false), 4000);
    } catch (e) {
      setOtpError(t('bot.otpError'));
    } finally {
      setIsResending(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 6);
      if (digits.length === 6) {
        setOtpCode(digits);
        setTimeout(() => handleOtpSubmit(), 100);
      }
    } catch { /* clipboard access denied */ }
  };

  const getBotImage = () => {
    return '/bot-avatars/011.webp';
  };

  const renderBotStep = (stepNum: number, children: React.ReactNode) => (
    <div className="md:flex md:items-start md:gap-2 max-w-full md:max-w-[92%]">
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="hidden md:block w-16 h-16 flex-shrink-0 drop-shadow-md z-10"
      >
        <img src={getBotImageForStep(stepNum)} alt="Bot" className="w-full h-full object-contain scale-[1.3] origin-bottom" />
      </motion.div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-900">Lumi</span>
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex flex-col pointer-events-none">
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[250]"
      />
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
      />

      {step === STEP.SUCCESS ? (
        <div className="absolute inset-4 md:inset-10 z-[210] pointer-events-auto bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 z-[220] p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
          <div className="flex-1 overflow-y-auto">
            <SuccessView
              quoteId={quoteId}
              onNewQuote={() => {
                onClose();
                window.location.reload();
              }}
              initialEmail={formEmail}
            />
          </div>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ x: '100%', y: '-50%', opacity: 0 }}
            animate={{ x: 0, y: '-50%', opacity: 1 }}
            exit={{ x: '100%', y: '-50%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed right-0 md:right-4 top-1/2 md:top-[calc(50%-4vh)] w-full md:w-[600px] h-[100dvh] md:h-[90vh] bg-[#f8f9fb] shadow-2xl z-[210] border border-slate-200 md:rounded-[24px] overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="h-20 bg-[#0f766e] flex items-center justify-between px-4 md:px-6 z-10 shrink-0 shadow-md">
              <div className="flex items-center gap-4">
                <div className="shrink-0 drop-shadow-md">
                  <img src={getBotImage()} alt="Bot" className="w-[72px] h-[72px] object-contain origin-bottom" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="font-bold text-white text-lg leading-tight">{t('bot.title')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleBack}
                        className={`w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 border border-white/10 ${
                          stepHistory.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <ArrowLeft size={18} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] font-bold uppercase tracking-wider">
                      {locale === 'en' ? 'Back' : 'Retour'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => startConversation()}
                        className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 border border-white/10"
                      >
                        <RotateCcw size={18} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] font-bold uppercase tracking-wider">
                      {t('bot.restart')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 border border-white/10"
                >
                  {locale === 'fr' ? 'FR' : 'EN'}
                </button>
                <button
                  onClick={onClose}
                  className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-all active:scale-95 border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sub-header with Progress */}
            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className={cn("flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar relative min-h-0 bg-[#efeae2]", (isCalendarOpen || activeTimePicker) && "overflow-hidden")}
            >
              {step === STEP.SUCCESS ? (
                <SuccessView quoteId={quoteId} onNewQuote={() => window.location.reload()} initialEmail={formEmail} />
              ) : (
                <>
                  {/* Chat messages */}
                  {messages.map((msg, idx) => (
                    <div key={msg.id}>
                      <MessageItem
                        msg={msg}
                        isMine={msg.senderId === 'user'}
                        isMiniChat={false}
                        onMediaClick={(url) => setLightboxUrl(url)}
                        currentUserPhotoURL="/user-avatar.png"
                        otherUserPhotoURL={getBotImage()}
                        isBotAvatar={true}
                      />

                      {/* Options under last bot message */}
                      {idx === messages.length - 1 && msg.options && !isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-wrap gap-2 justify-end pt-2 pr-2"
                        >
                          {(expandedOptions?.msgId === msg.id ? msg.options : msg.options.length > 5 ? msg.options.slice(0, 3) : msg.options).map((option, i) => {
                            const label = typeof option === 'string' ? option : (option.translationKey ? t(option.translationKey, option.translationParams) : option.label);
                            const value = typeof option === 'string' ? option : option.value;
                            const imageUrl = typeof option === 'string' ? undefined : option.imageUrl;
                            return (
                              <button
                                key={value || i}
                                onClick={() => handleOptionSelect(value, label, imageUrl, typeof option !== 'string' ? option.translationKey : undefined, typeof option !== 'string' ? option.translationParams : undefined)}
                                className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-black text-white border border-black shadow-lg hover:bg-[#B3E140] hover:text-black hover:border-[#B3E140] active:scale-95 transition-all uppercase tracking-wider"
                              >
                                {label}
                              </button>
                            );
                          })}
                          {msg.options.length > 5 && expandedOptions?.msgId !== msg.id && (
                            <button
                              onClick={() => setExpandedOptions({ msgId: msg.id, options: msg.options })}
                              className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                            >
                              {t('bot.moreChoices')}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}

                  {/* ── Steps ── */}
                  {step === STEP.DIMENSIONS && !isTyping && renderBotStep(STEP.DIMENSIONS,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                      <StepDimensions state={configState} updateState={(u) => setConfigState(prev => ({ ...prev, ...u }))} settings={settings} t={t} isInChat={true} />
                      <div className="px-6 pb-6">
                        <Button onClick={handleDimensionsSubmit} disabled={!configState.width || !configState.height} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          {t('bot.confirmDimensions')} <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.SUMMARY && !isTyping && renderBotStep(STEP.SUMMARY,
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                      <StepSummary state={configState} t={t} locale={locale} />
                      <div className="p-4 bg-slate-50 border-t">
                        <Button onClick={handleProceedToProducts} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          {t('bot.searchProducts')} 🔍
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.PRODUCTS && renderBotStep(STEP.PRODUCTS,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {matchingProducts.length === 0 || currentProductIndex >= matchingProducts.length ? (
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                          <ProductNotFound
                            onReset={() => startConversation()}
                            onBack={() => { updateStep(STEP.SUMMARY); pushBotMessage('Revenons au résumé pour modifier vos choix.', undefined, 600, '/bot-avatars/17.webp'); }}
                            pitch={configState.pixelPitch}
                            environment={configState.environment === 'exterieur' ? 'Extérieur' : configState.environment === 'semi-exterieur' ? 'Semi-extérieur' : 'Intérieur'}
                            hideBackButton={true}
                          />
                        </div>
                      ) : (
                        <AnimatePresence mode="wait">
                          {(() => {
                            const currentProduct = matchingProducts[currentProductIndex];
                            const area = configState.width * configState.height; // Ensure area is accessible
                            let quantityExplanation = "";
                            let unitPrice = 0;
                            if (currentProduct.hasDimensions && currentProduct.tileWidth && currentProduct.tileHeight) {
                              const tilesPerWidth = Math.ceil((configState.width * 100) / currentProduct.tileWidth);
                              const tilesPerHeight = Math.ceil((configState.height * 100) / currentProduct.tileHeight);
                              const totalTiles = tilesPerWidth * tilesPerHeight;
                              quantityExplanation = `Pour constituer votre écran de ${configState.width}m × ${configState.height}m, il sera nécessaire d'assembler <strong>${totalTiles} dalles</strong> (cabinets) de ${currentProduct.tileWidth}cm × ${currentProduct.tileHeight}cm.`;
                              unitPrice = totalTiles * (currentProduct.pricePerTile || 0);
                            } else {
                              quantityExplanation = `Votre configuration requiert un écran complet de ${configState.width}m × ${configState.height}m.`;
                              if (configState.projectType === 'vente') {
                                unitPrice = (currentProduct.salePricePerSqM || 0) * area;
                              } else {
                                unitPrice = (currentProduct.rentalPricePerDay || 0) * area;
                              }
                            }

                            const isRental = configState.projectType === 'location';

                            // Best choice badge check
                            const isBestChoice = currentProductIndex === 0 && matchingProducts.length > 1;

                            // Promotion check
                            const activePrice = isRental ? currentProduct.rentalPricePerDay : currentProduct.salePricePerSqM;
                            const oldPrice = currentProduct.oldPrice;
                            let promoPercent = null;
                            if (oldPrice && activePrice && oldPrice > activePrice) {
                              promoPercent = Math.round((1 - activePrice / oldPrice) * 100);
                            }

                            // Environment i18n label
                            const envLabel = (() => {
                              const env = (currentProduct.environment || '').toLowerCase();
                              if (locale === 'fr') {
                                if (env.includes('indoor') || env.includes('interieur') || env.includes('intérieur')) return 'Intérieur';
                                if (env.includes('outdoor') || env.includes('exterieur') || env.includes('extérieur')) return 'Extérieur';
                                if (env.includes('semi')) return 'Semi-extérieur';
                              } else {
                                if (env.includes('indoor') || env.includes('interieur') || env.includes('intérieur')) return 'Indoor';
                                if (env.includes('outdoor') || env.includes('exterieur') || env.includes('extérieur')) return 'Outdoor';
                                if (env.includes('semi')) return 'Semi-outdoor';
                              }
                              return currentProduct.environment || '';
                            })();

                            return (
                              <>
                                <motion.div
                                key={currentProduct.id}
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -40, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className="rounded-[40px] shadow-2xl border overflow-hidden flex flex-col relative transition-all duration-500 bg-white border-slate-100"
                              >
                                {/* New Premium Header Style */}
                                <div className="p-6 text-center border-b border-slate-50">
                                  <h2 className="font-black text-[#0f172a] tracking-tight text-[13px] leading-relaxed uppercase mb-2 px-4">
                                    {locale === 'fr'
                                      ? "Au vu de la configuration que vous avez choisie, ce produit représente la solution la plus adaptée à vos besoins."
                                      : "Based on your configuration, this product is the most suitable solution for your needs."
                                    }
                                  </h2>
                                  <div className="flex items-center justify-center gap-3">
                                    <div className="h-[2px] bg-slate-100 w-8" />
                                    <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase whitespace-nowrap">
                                      {configState.pixelPitch} • {area.toFixed(2)}M²
                                    </p>
                                    <div className="h-[2px] bg-slate-100 w-8" />
                                  </div>
                                </div>

                                <div className="relative aspect-square md:aspect-video bg-[#f8fafc] overflow-hidden flex items-center justify-center group">
                                  {/* Badge on image - center top */}
                                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 items-center">
                                    {isBestChoice && (
                                      <div className="bg-[#B3E140] text-black font-black uppercase text-[10px] tracking-widest py-1.5 px-3 rounded-full shadow-md flex items-center gap-1.5">
                                        ⭐ {locale === 'fr' ? 'Meilleur choix' : 'Best choice'}
                                      </div>
                                    )}
                                    {promoPercent && (
                                      <div className="bg-red-500 text-white font-black uppercase text-[10px] tracking-widest py-1.5 px-3 rounded-full shadow-md flex items-center gap-1">
                                        Promotion -{promoPercent}%
                                      </div>
                                    )}
                                  </div>

                                  {/* Media Actions Overlay */}
                                  <div className="absolute top-8 right-8 flex flex-col gap-3 z-30">
                                    {currentProduct.videoUrl && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(currentProduct.videoUrl!); }}
                                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-slate-900 transition-all hover:bg-white active:scale-90 border border-slate-100"
                                        title={locale === 'fr' ? 'Voir la vidéo' : 'Watch video'}
                                      >
                                        <Video size={18} />
                                      </button>
                                    )}

                                    {currentProduct.specSheetUrl && (
                                      <a
                                        href={currentProduct.specSheetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-[#2563eb] transition-all hover:bg-white active:scale-90 border border-slate-100"
                                        title={locale === 'fr' ? 'Consulter la Fiche Technique' : 'View Spec Sheet'}
                                      >
                                        <Info size={18} />
                                      </a>
                                    )}
                                  </div>

                                  {/* Product Media */}
                                  <div className="w-full h-full p-4">
                                    <div
                                      className="w-full h-full cursor-pointer overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center"
                                      onClick={() => setLightboxUrl(currentProduct.imageUrl || currentProduct.image || null)}
                                    >
                                      {currentProduct.imageUrl || currentProduct.image ? (
                                        <img
                                          src={currentProduct.imageUrl || currentProduct.image}
                                          alt={currentProduct.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">{locale === 'fr' ? 'Média non disponible' : 'No media available'}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-8 space-y-5">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex flex-col gap-1 flex-1">
                                      <h3 className="font-black text-2xl text-[#0f172a] leading-tight uppercase tracking-tight">{currentProduct.name}</h3>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{envLabel}</p>
                                    </div>
                                    <div className="bg-[#f1f5f9] px-5 py-3 rounded-2xl">
                                      <span className="font-black text-slate-800 text-base tracking-tighter">{currentProduct.pitch || configState.pixelPitch}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      {settings.isPriceHidden ? (locale === 'fr' ? 'Estimation en cours' : 'Estimating') : (locale === 'fr' ? 'Prix sur estimation' : 'Price on quote')}
                                    </span>
                                    <BlurredPrice
                                      price={locale === 'fr' ? 'Sur estimation' : 'On quote'}
                                      isPriceHidden={settings.isPriceHidden ?? false}
                                      priceClassName="font-black text-2xl text-slate-800"
                                    />
                                  </div>

                                  <div className="p-4 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-xl">
                                    <h3 className="font-bold text-[#0f766e] text-[13px] flex items-center gap-2 mb-1">
                                      💡 {locale === 'fr' ? "L'astuce de l'assistant" : "Assistant tip"}
                                    </h3>
                                    <p className="text-[12px] text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: quantityExplanation }} />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="flex">
                                      {currentProductIndex > 0 && (
                                        <button
                                          onClick={() => setCurrentProductIndex(0)}
                                          className="h-14 w-12 rounded-l-xl border border-r-0 border-slate-200 bg-white text-slate-400 hover:text-black hover:bg-slate-100 flex items-center justify-center transition-all shrink-0"
                                          title={locale === 'fr' ? 'Retour au premier produit' : 'Back to first product'}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                        </button>
                                      )}
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setCurrentProductIndex(prev => prev + 1);
                                        }}
                                        className={`h-14 font-bold border-slate-200 text-slate-600 bg-white hover:bg-slate-100 hover:text-black uppercase tracking-wider text-[11px] transition-all ${currentProductIndex > 0 ? 'rounded-r-xl flex-1' : 'rounded-xl flex-1'}`}
                                      >
                                        {t('bot.nextProduct')}
                                      </Button>
                                    </div>
                                    <Button
                                      onClick={() => {
                                        pushUserMessage(t('bot.productFits'), undefined, 'bot.productFits');
                                        handleProductSelected(currentProduct.id);
                                      }}
                                      className="h-14 rounded-xl font-black uppercase tracking-wider text-[11px] shadow-xl active:scale-95 transition-all bg-black hover:bg-[#B3E140] text-white hover:text-black"
                                    >
                                      {t('bot.confirm')}<ArrowRight size={16} className="ml-2" />
                                    </Button>
                                  </div>
                                </div>
                                </motion.div>
                                {matchingProducts.length > 1 && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-3 flex justify-center"
                                  >
                                    <button
                                      onClick={() => setShowComparator(true)}
                                      title="Comparer tous les produits correspondants côte à côte"
                                      className="px-5 py-2 bg-white/90 backdrop-blur text-slate-700 border border-slate-200 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all shadow-sm flex items-center gap-2"
                                    >
                                      <Layers className="w-3.5 h-3.5" /> Comparer ces {matchingProducts.length} produits
                                    </button>
                                  </motion.div>
                                )}
                              </>
                            );
                          })()}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {step === STEP.RENTAL_PERIOD && !isTyping && renderBotStep(STEP.RENTAL_PERIOD,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 w-full max-w-md mx-auto", isCalendarOpen || activeTimePicker ? "invisible pointer-events-none" : "")}>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{locale === 'en' ? "Event Dates" : "Dates de l'événement"}</label>
                          <button
                            onClick={() => setIsCalendarOpen(true)}
                            className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#B3E140] transition-all flex items-center px-5 gap-4 group"
                          >
                            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-[#0f766e] transition-colors">
                              <CalendarIcon size={20} />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-black text-slate-800">
                                {configState.rentalStartDate && configState.rentalEndDate
                                  ? `${format(new Date(configState.rentalStartDate), 'dd MMM yyyy', { locale: dateLocale })} - ${format(new Date(configState.rentalEndDate), 'dd MMM yyyy', { locale: dateLocale })}`
                                  : (locale === 'en' ? "Choose dates" : "Choisir les dates")}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{locale === 'en' ? "Click to open calendar" : "Cliquer pour ouvrir le calendrier"}</span>
                            </div>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('bot.startTime')}</label>
                            <button
                              onClick={() => {
                                setTempTime({
                                  hour: configState.rentalStartTime?.split(':')[0] || '08',
                                  minute: configState.rentalStartTime?.split(':')[1] || '00'
                                });
                                setActiveTimePicker('start');
                              }}
                              className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#B3E140] transition-all flex items-center justify-center gap-3 px-4"
                            >
                              <span className="text-lg font-black text-slate-800">{configState.rentalStartTime || '08:00'}</span>
                              <Clock size={16} className="text-slate-300" />
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t('bot.endTime')}</label>
                            <button
                              onClick={() => {
                                setTempTime({
                                  hour: configState.rentalEndTime?.split(':')[0] || '18',
                                  minute: configState.rentalEndTime?.split(':')[1] || '00'
                                });
                                setActiveTimePicker('end');
                              }}
                              className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#B3E140] transition-all flex items-center justify-center gap-3 px-4"
                            >
                              <span className="text-lg font-black text-slate-800">{configState.rentalEndTime || '18:00'}</span>
                              <Clock size={16} className="text-slate-300" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleRentalPeriodSubmit}
                        disabled={!configState.rentalStartDate || !configState.rentalEndDate}
                        className="w-full h-16 font-black rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-[0.1em] text-xs shadow-xl active:scale-95 transition-all mt-2"
                      >
                        {locale === 'en' ? "Confirm period" : "Confirmer la période"} <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.QUANTITY && !isTyping && renderBotStep(STEP.QUANTITY,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder={locale === 'en' ? "Quantity..." : "Quantité..."}
                        value={configState.quantity === undefined ? "" : configState.quantity}
                        onFocus={() => {
                          if (configState.quantity === 1) {
                            setConfigState(prev => ({ ...prev, quantity: undefined }));
                          }
                        }}
                        onChange={e => {
                          const val = e.target.value;
                          setConfigState(prev => ({ ...prev, quantity: val === "" ? undefined : parseInt(val) }));
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleQuantitySubmit()}
                        className="h-12 rounded-2xl font-bold"
                      />
                      <Button onClick={handleQuantitySubmit} disabled={!configState.quantity || configState.quantity < 1} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black shadow-md active:scale-95 transition-all">
                        <ArrowRight size={20} />
                      </Button>
                    </motion.div>
                  )}


                  {step === STEP.SITE_PHOTO && !isTyping && renderBotStep(STEP.SITE_PHOTO,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="site-photo-upload"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="site-photo-gallery"
                      />
                      {/* Desktop: single upload button */}
                      <Button
                        onClick={() => document.getElementById('site-photo-upload')?.click()}
                        className="h-12 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all hidden md:inline-flex"
                      >
                        {locale === 'fr' ? '📁 Téléverser une photo' : '📁 Upload a photo'}
                      </Button>
                      {/* Mobile: gallery + camera side by side */}
                      <div className="flex gap-2 md:hidden">
                        <Button
                          onClick={() => document.getElementById('site-photo-gallery')?.click()}
                          className="flex-1 h-12 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                        >
                          {locale === 'fr' ? '📁 Téléverser de la galerie' : '📁 Upload from gallery'}
                        </Button>
                        <Button
                          onClick={() => document.getElementById('site-photo-upload')?.click()}
                          className="flex-1 h-12 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all"
                        >
                          {locale === 'fr' ? '📷 Prendre une photo' : '📷 Take a photo'}
                        </Button>
                      </div>
                      {/* Passer full width below */}
                      <Button
                        onClick={handlePhotoSkip}
                        variant="outline"
                        className="w-full h-12 rounded-2xl border-slate-200 text-slate-500 hover:text-[#B3E140] hover:border-[#B3E140] font-bold text-xs transition-all"
                      >
                        {locale === 'fr' ? 'Passer' : 'Skip'}
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_COMPANY && !isTyping && renderBotStep(STEP.FORM_COMPANY,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="text" placeholder={locale === 'fr' ? "Nom de l'entreprise..." : "Company name..."} value={formCompany} onChange={e => setFormCompany(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormCompany()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormCompany} disabled={!formCompany.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_REPRESENTATIVE && !isTyping && renderBotStep(STEP.FORM_REPRESENTATIVE,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="text" placeholder={t('signature.contactPlaceholder')} value={formRepresentative} onChange={e => setFormRepresentative(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormRepresentative()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormRepresentative} disabled={!formRepresentative.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_EMAIL && !isTyping && renderBotStep(STEP.FORM_EMAIL,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="email" placeholder={t('quoteForm.emailPlaceholder')} value={formEmail} onChange={e => setFormEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormEmail()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormEmail} disabled={!formEmail.includes('@')} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_PHONE && !isTyping && renderBotStep(STEP.FORM_PHONE,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="tel" placeholder={t('quoteForm.phonePlaceholder')} value={formPhone} onChange={e => setFormPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormPhone()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormPhone} disabled={!formPhone.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_ADDRESS && !isTyping && renderBotStep(STEP.FORM_ADDRESS,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="text" placeholder={t('quoteForm.addressPlaceholder')} value={formAddress} onChange={e => setFormAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormAddress()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormAddress} disabled={!formAddress.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}

                  {step === STEP.INSTALLATION && !isTyping && renderBotStep(STEP.INSTALLATION,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 bg-white rounded-3xl shadow-lg border border-slate-100 p-4">
                      <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">{locale === 'fr' ? 'Installation' : 'Installation'}</h3>
                      <p className="text-sm text-slate-600">{locale === 'fr' ? 'Souhaitez-vous inclure l\'installation par nos techniciens ?' : 'Would you like to include installation by our technicians?'}</p>
                      <Button
                        onClick={() => handleInstallation(true)}
                        className="w-full h-14 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-md active:scale-95 transition-all text-sm"
                      >
                        ✅ {locale === 'fr' ? 'Oui, inclure l\'installation' : 'Yes, include installation'}
                      </Button>
                      <p className="text-xs text-slate-500 -mt-2">{locale === 'fr' ? 'Nos experts s\'occupent de tout.' : 'Our experts handle everything.'}</p>
                      <Button
                        onClick={() => handleInstallation(false)}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 hover:text-orange-500 hover:border-orange-300 font-bold text-sm"
                      >
                        ❌ {locale === 'fr' ? 'Non, je m\'en occupe' : 'No, I\'ll handle it'}
                      </Button>
                      <p className="text-xs text-slate-500 -mt-2">{locale === 'fr' ? 'Vous gérez l\'installation vous-même.' : 'You manage installation yourself.'}</p>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="font-black text-xs uppercase tracking-widest text-amber-800">⚠️ {locale === 'fr' ? 'Attention' : 'Warning'}</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">{locale === 'fr' ? 'L\'entreprise PIXIATECH décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.' : 'PIXIATECH declines all responsibility for any problem related to an installation not carried out by its technicians.'}</p>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.CONTRAT && !isTyping && (
                    <div className="space-y-4">
                      {/* Contract card - always visible, compact when approved */}
                      {renderBotStep(STEP.CONTRAT,
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                          <div className={cn("bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden", contractReadApproved && "max-h-[45vh]")}>
                            <div className="p-4 border-b border-slate-100 bg-zinc-950 text-white">
                              <h3 className="font-black text-sm uppercase tracking-widest">{locale === 'fr' ? 'Contrat de location' : 'Rental contract'}</h3>
                            </div>
                            <div className={cn("px-2 overflow-y-auto w-full", contractReadApproved ? "max-h-[28vh]" : "max-h-[350px]")}>
                              <ContractDocument
                                pack={activePack}
                                renter={renterDetails}
                                signatureDataUrl={signatureDataUrl}
                                isValidated={signatureValidated}
                                projectMode={configState.projectType as 'vente' | 'location'}
                                rentalPeriod={configState.rentalStartDate && configState.rentalEndDate ? { from: configState.rentalStartDate, to: configState.rentalEndDate } : undefined}
                                rentalStartTime={configState.rentalStartTime}
                                rentalEndTime={configState.rentalEndTime}
                                productImage={selectedProduct?.imageUrl || selectedProduct?.image}
                                saleContractTemplate={settings.estimationFlow?.saleContractTemplate}
                                rentalContractTemplate={settings.estimationFlow?.rentalContractTemplate}
                                isPdfMode={true}
                              />
                            </div>
                            {!contractReadApproved && (
                              <div className="px-4 pb-4">
                                <Button
                                  onClick={() => {
                                    setContractReadApproved(true);
                                    setTimeout(() => scrollToBottom(), 100);
                                  }}
                                  className="w-full h-14 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-md active:scale-95 transition-all"
                                >
                                  {locale === 'fr' ? 'J\'ai lu et j\'approuve' : 'I have read and approve'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Signature card - slides up when approved, replaced by loader when submitting */}
                      {contractReadApproved && !isSubmittingContract && (
                        <motion.div
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                        >
                          {renderBotStep(STEP.CONTRAT,
                            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                              <div className="p-4 border-b border-slate-100">
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">{locale === 'fr' ? 'Signez votre estimation' : 'Sign your quote'}</h3>
                              </div>
                              <div className="px-4">
                                <SignaturePad
                                  onSave={handleSignatureSave}
                                  onClear={handleSignatureClear}
                                  isValidated={signatureValidated}
                                />
                              </div>
                              <div className="px-4 pb-4">
                                <Button
                                  onClick={handleContractAccept}
                                  disabled={!signatureValidated}
                                  className="w-full h-14 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-30"
                                >
                                  {locale === 'fr' ? 'Accepter & continuer' : 'Accept & continue'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}


                    </div>
                  )}

                  {step === STEP.SECURITE && !isTyping && renderBotStep(STEP.SECURITE,
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 bg-white rounded-3xl shadow-lg border border-slate-100 p-4">
                      <div className="flex items-center gap-3 mb-1">
                        <Shield size={20} className="text-[#0f766e]" />
                        <p className="font-bold text-slate-800 text-sm">{locale === 'fr' ? 'Code de vérification' : 'Verification code'}</p>
                      </div>
                      <p className="text-xs text-slate-500">{locale === 'fr' ? 'Entrez le code reçu par email' : 'Enter the code sent by email'}</p>
                      <div className="flex gap-2">
                        {isSendingCode ? (
                          <div className="flex items-center gap-2 h-12 w-full justify-center">
                            <Loader2 size={18} className="animate-spin text-[#0f766e]" />
                            <span className="text-sm font-bold text-slate-500">{locale === 'fr' ? 'Envoi du code de vérification...' : 'Sending verification code...'}</span>
                          </div>
                        ) : (
                          <>
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="000000"
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              onKeyDown={e => e.key === 'Enter' && handleOtpSubmit()}
                              className="h-12 rounded-2xl font-bold text-center text-lg tracking-[0.3em]"
                            />
                            <Button
                              onClick={handleOtpSubmit}
                              disabled={otpCode.length < 6 || otpAttempts >= 3 || resendAttemptsLeft <= 1}
                              className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"
                            >
                              <Check size={20} />
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Paste button */}
                      {otpCode.length < 6 && (
                        <button
                          type="button"
                          onClick={handlePasteCode}
                          className="text-xs font-black text-white bg-zinc-950 hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 cursor-pointer shadow-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy stroke-[2.5]">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                          </svg>
                          <span>{locale === 'fr' ? 'Coller le code' : 'Paste code'}</span>
                        </button>
                      )}

                      {/* Countdown */}
                      {otpCooldown > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock size={12} />
                          <span>{locale === 'fr' ? 'Expire dans' : 'Expires in'}</span>
                          <span className={`font-mono font-bold px-1.5 py-0.5 rounded leading-none ${otpCooldown <= 60 ? 'text-red-600 bg-red-100 animate-pulse' : 'text-slate-800 bg-slate-100'}`}>
                            {`${Math.floor(otpCooldown / 60).toString().padStart(2, '0')}:${(otpCooldown % 60).toString().padStart(2, '0')}`}
                          </span>
                        </div>
                      )}

                      {/* Attempts remaining */}
                      {otpAttempts > 0 && (
                        <p className="text-xs text-amber-600 font-bold">
                          {locale === 'fr'
                            ? `Tentative ${otpAttempts}/3`
                            : `Attempt ${otpAttempts}/3`}
                        </p>
                      )}

                      {otpResent && (
                        <div className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-bounce flex items-center gap-1 self-start">
                          <span>{locale === 'fr' ? 'Code renvoyé !' : 'Code resent!'}</span>
                        </div>
                      )}

                      {otpError && (
                        <p className="text-red-500 text-xs font-bold">{otpError}</p>
                      )}

                      {otpAttempts < 3 && (
                        <div className="flex items-center gap-4 text-xs">
                          <button
                            onClick={handleResendOtp}
                            disabled={isResending || resendAttemptsLeft <= 1}
                            className="text-[#0f766e] font-bold underline underline-offset-2 hover:text-[#0f766e]/80 disabled:opacity-40"
                          >
                            {isResending
                              ? (locale === 'fr' ? 'Renvol en cours...' : 'Resending...')
                              : (locale === 'fr' ? 'Renvoyer le code' : 'Resend code')}
                          </button>
                          {resendAttemptsLeft < 3 && (
                            <span className={`font-bold ${resendAttemptsLeft === 1 ? 'text-red-600' : 'text-amber-600'}`}>
                              {resendAttemptsLeft === 1
                                ? (locale === 'fr' ? 'Dernière tentative' : 'Last attempt')
                                : (locale === 'fr' ? `Il vous reste ${resendAttemptsLeft} tentatives` : `${resendAttemptsLeft} attempts left`)}
                            </span>
                          )}
                        </div>
                      )}

                      {(otpAttempts >= 3 || resendAttemptsLeft <= 1) && (
                        <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">
                          <p className="text-xs text-red-600 font-bold text-center">
                            {locale === 'fr'
                              ? 'Tentatives épuisées. Veuillez recommencer le parcours.'
                              : 'No attempts left. Please restart the process.'}
                          </p>
                          <Button
                            onClick={() => startConversation()}
                            className="w-full h-12 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider text-xs shadow-md"
                          >
                            <RotateCcw size={14} className="mr-2" />
                            {locale === 'fr' ? 'Recommencer' : 'Restart'}
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {step === STEP.FELICITATIONS && !isTyping && renderBotStep(STEP.FELICITATIONS,
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 flex flex-col gap-5">
                      <div className="w-14 h-14 bg-zinc-950 text-white rounded-[18px] flex items-center justify-center shadow-md">
                        <Check size={26} strokeWidth={3} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight">{t('signature.confirmationStep')}</h2>
                        <span className="text-blue-600 text-2xl font-black block">{t('signature.confirmationDesc')}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-5 space-y-2">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-blue-600 stroke-[2.5] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-blue-900">{t('signature.estimationConfirmed')}</p>
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">{t('signature.estimationConfirmedDesc')}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{t('signature.thankYouMessage')}</p>
                      <div className="flex flex-col gap-3">
                        <Button onClick={onClose} className="w-full h-14 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest">
                          {t('signature.newQuote')}
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const url = await ensurePdfReady();
                              if (url) window.open(url, '_blank');
                            }}
                            disabled={isGeneratingPdf}
                            className="h-12 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : t('signature.consulterPdf')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={async () => {
                              const url = await ensurePdfReady();
                              if (url) {
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `estimation-${quoteId}.pdf`;
                                a.click();
                              }
                            }}
                            disabled={isGeneratingPdf}
                            className="h-12 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 font-bold text-xs uppercase tracking-wider transition-all"
                          >
                            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : t('signature.downloadPdf')}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.GENERATING && renderBotStep(STEP.GENERATING,
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4">
                      <Loader2 size={32} className="animate-spin text-[#0f766e]" />
                      <p className="font-bold text-slate-800 animate-pulse">{locale === 'en' ? "Generating your PDF estimate..." : "Génération de votre estimation PDF en cours..."}</p>
                    </motion.div>
                  )}


                  <div ref={messagesEndRef} className="h-4" />
                </>
              )}

              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToBottom}
                    className="fixed bottom-6 right-6 md:right-12 h-10 w-10 rounded-full bg-white text-[#0f766e] shadow-lg flex items-center justify-center active:scale-90 transition-all z-40 border border-slate-100"
                  >
                    <ChevronDown size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Root Overlays for PC/Tablet - Fixed position at bottom of chat window */}
            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[400] flex items-end bg-black/40 pointer-events-auto"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                    className="bg-white w-full rounded-t-[32px] p-6 pb-10 shadow-2xl flex flex-col gap-6"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2" />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
                        {locale === 'en' ? "Calendar" : "Calendrier"}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{locale === 'en' ? "Select event dates" : "Sélectionner les dates de l'événement"}</p>
                    </div>

                    <div className="flex justify-center bg-slate-50/50 rounded-3xl p-2">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={configState.rentalStartDate ? new Date(configState.rentalStartDate) : new Date()}
                        selected={{
                          from: configState.rentalStartDate ? new Date(configState.rentalStartDate) : undefined,
                          to: configState.rentalEndDate ? new Date(configState.rentalEndDate) : undefined,
                        }}
                         disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                        onSelect={(range) => {
                          if (range?.from) setConfigState(prev => ({ ...prev, rentalStartDate: range.from!.toISOString() }));
                          if (range?.to) {
                            setConfigState(prev => ({ ...prev, rentalEndDate: range.to!.toISOString() }));
                            setTimeout(() => setIsCalendarOpen(false), 300);
                          }
                        }}
                        numberOfMonths={1}
                        locale={dateLocale}
                        className="bg-transparent"
                      />
                    </div>

                    <Button
                      onClick={() => setIsCalendarOpen(false)}
                      className="w-full h-14 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-xl active:scale-95 transition-all"
                    >
                      {locale === 'en' ? "Close calendar" : "Fermer le calendrier"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeTimePicker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[400] flex items-end bg-black/40 pointer-events-auto"
                  onClick={() => setActiveTimePicker(null)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                    className="bg-white w-full rounded-t-[32px] p-8 pb-10 shadow-2xl flex flex-col gap-8"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2" />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
                        {activeTimePicker === 'start' ? t('bot.startTime') : t('bot.endTime')}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('bot.selectHours')}</p>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('bot.hours')}</span>
                        <div className="flex flex-col gap-2 h-[200px] overflow-y-auto scrollbar-hide px-4 snap-y">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const h = i.toString().padStart(2, '0');
                            return (
                              <button
                                key={h}
                                onClick={() => setTempTime(prev => ({ ...prev, hour: h }))}
                                className={cn(
                                  "h-12 w-12 rounded-xl flex items-center justify-center font-black transition-all snap-center",
                                  tempTime.hour === h ? "bg-[#B3E140] text-black scale-110 shadow-lg" : "text-slate-300 hover:text-slate-600"
                                )}
                              >
                                {h}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-4xl font-black text-slate-200">:</div>

                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('bot.minutes')}</span>
                        <div className="flex flex-col gap-2 h-[200px] overflow-y-auto scrollbar-hide px-4 snap-y">
                          {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                            <button
                              key={m}
                              onClick={() => setTempTime(prev => ({ ...prev, minute: m }))}
                              className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center font-black transition-all snap-center",
                                tempTime.minute === m ? "bg-[#B3E140] text-black scale-110 shadow-lg" : "text-slate-300 hover:text-slate-600"
                              )}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        const newTime = `${tempTime.hour}:${tempTime.minute}`;
                        if (activeTimePicker === 'start') setConfigState(prev => ({ ...prev, rentalStartTime: newTime }));
                        else setConfigState(prev => ({ ...prev, rentalEndTime: newTime }));
                        setActiveTimePicker(null);
                      }}
                      className="w-full h-16 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-xl active:scale-95 transition-all"
                    >
                      {t('bot.validateTime')}
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {expandedOptions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[400] flex items-end bg-black/40 pointer-events-auto"
                  onClick={() => setExpandedOptions(null)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
                    className="bg-white w-full rounded-t-[32px] p-6 pb-10 shadow-2xl flex flex-col gap-3 max-h-[70%] pointer-events-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2 mx-auto" />
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
                      {locale === 'en' ? 'Select an option' : 'Sélectionnez une option'}
                    </h3>
                    <div className="flex flex-col gap-2 overflow-y-auto pt-2">
                      {expandedOptions.options.map((option, i) => {
                        const label = typeof option === 'string' ? option : (option.translationKey ? t(option.translationKey, option.translationParams) : option.label);
                        const value = typeof option === 'string' ? option : option.value;
                        const imageUrl = typeof option === 'string' ? undefined : option.imageUrl;
                        return (
                          <button
                            key={value || i}
                            onClick={() => {
                              handleOptionSelect(value, label, imageUrl, typeof option !== 'string' ? option.translationKey : undefined, typeof option !== 'string' ? option.translationParams : undefined);
                              setExpandedOptions(null);
                            }}
                            className="w-full py-4 px-5 rounded-2xl font-bold text-sm bg-slate-50 hover:bg-[#B3E140] hover:text-black active:scale-[0.98] transition-all text-left border border-slate-100"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>


          <AnimatePresence>
            {lightboxUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10 pointer-events-auto"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
                  className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:rotate-90 z-[1000] pointer-events-auto"
                >
                  <X size={28} />
                </button>
                <div className="w-full h-full flex items-center justify-center max-w-5xl pointer-events-none" onClick={(e) => e.stopPropagation()}>
                  {lightboxUrl.includes('.mp4') || lightboxUrl.includes('.mov') ? (
                    <video src={lightboxUrl} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl pointer-events-auto" />
                  ) : (
                    <img src={lightboxUrl} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl pointer-events-auto" alt="Preview" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      <AnimatePresence>
        {showComparator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-white flex flex-col pointer-events-auto"
          >
            <ProductComparator
              products={matchingProducts}
              configState={configState}
              selectedProductId={configState.selectedProduct || undefined}
              onSelect={(id) => {
                setConfigState(prev => ({ ...prev, selectedProduct: id }));
                setShowComparator(false);
                pushUserMessage(t('bot.productFits'), undefined, 'bot.productFits');
                handleProductSelected(id);
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
