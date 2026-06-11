'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ArrowRight, ArrowLeft, MapPin, Loader2, Grid, Calendar as CalendarIcon, Clock, Bot, Video, Download, Info, Layers, RotateCcw, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DateRange } from "react-day-picker";
import { motion, AnimatePresence } from 'framer-motion';
import { Message, MessageOption, WizardSettings, Product, Settings, LaborSettings, DeliverySettings, Locations } from '@/lib/types';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { ConfigState, INITIAL_STATE } from '@/lib/configurator-wizard-types';
import { StepDimensions, StepSummary, StepFinal } from '@/components/configurator-wizard';
import { ProductNotFound } from '@/components/ProductNotFound';
import { SuccessView } from '@/components/success-view';
import { ProductComparator } from '@/components/product-comparator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuoteRequest, getBlockedPeriods, getProductRentalAvailabilityAction } from '@/app/actions/quote-actions';
import { useUser } from '@/firebase';
import { useI18n } from '@/lib/i18n';

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
  DELIVERY: 9,
  INSTALLATION: 10,
  FORM_COMPANY: 11,
  FORM_EMAIL: 12,
  FORM_PHONE: 13,
  FORM_ADDRESS: 14,
  FORM_TERMS: 15,
  GENERATING: 16,
  SUCCESS: 17,
  RENTAL_PERIOD: 18,
  SITE_PHOTO: 19,
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
  const { user } = useUser();

  const [quoteId, setQuoteId] = useState<string>('');

  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showComparator, setShowComparator] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<{ msgId: string; options: MessageOption[] } | null>(null);

  const [deliveryCityId, setDeliveryCityId] = useState('');
  const [includeInstallation, setIncludeInstallation] = useState<boolean | null>(null);

  // Form Fields
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const takeSnapshot = useCallback(() => {
    setStepHistory(prev => [
      ...prev,
      {
        step: stepRef.current,
        messages: [...messages],
        configState: { ...configState },
        deliveryCityId,
        includeInstallation,
        formCompany,
        formEmail,
        formPhone,
        formAddress
      }
    ]);
  }, [messages, configState, deliveryCityId, includeInstallation, formCompany, formEmail, formPhone, formAddress]);

  const handleBack = useCallback(() => {
    if (stepHistory.length === 0) return;
    const prev = stepHistory[stepHistory.length - 1];
    setStepHistory(prevHistory => prevHistory.slice(0, -1));

    stepRef.current = prev.step;
    setStep(prev.step);
    setMessages(prev.messages);
    setConfigState(prev.configState);
    setDeliveryCityId(prev.deliveryCityId);
    setIncludeInstallation(prev.includeInstallation);
    setFormCompany(prev.formCompany);
    setFormEmail(prev.formEmail);
    setFormPhone(prev.formPhone);
    setFormAddress(prev.formAddress);
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

  const totalArea = area * (configState.quantity || 1);
  const applicableRule = laborSettings?.rules?.slice().sort((a, b) => b.minSqM - a.minSqM).find(rule => totalArea >= rule.minSqM);
  const techniciansRequired = applicableRule?.technicians ?? 0;
  const installationCost = includeInstallation ? (applicableRule?.price ?? 0) : 0;

  const deliveryCost = React.useMemo(() => {
    if (!deliveryCityId) return 0;
    if (deliverySettings.isDefaultFeeEnabled) return deliverySettings.defaultFee;

    const city = locations?.villes?.find(c => c.id === deliveryCityId);
    if (city) {
      const rule = deliverySettings.deliveryFeeRules?.find(r => r.cityId === city.id);
      if (rule) return rule.fee;
      const zoneRule = deliverySettings.deliveryFeeRules?.find(r => r.zoneId === city.zoneId && !r.cityId);
      if (zoneRule) return zoneRule.fee;
    }
    return 0;
  }, [deliveryCityId, deliverySettings, locations]);

  const totalQuote = lineTotal + installationCost + deliveryCost;

  const [blockedPeriods, setBlockedPeriods] = useState<{ from: string; to: string }[]>([]);
  const [productAvailability, setProductAvailability] = useState<{ available: boolean; total: number; reserved: number; remaining: number; nextAvailableDate?: string | null } | null>(null);
  const [bulkAvailability, setBulkAvailability] = useState<Record<string, { available: boolean; total: number; reserved: number; remaining: number; nextAvailableDate?: string | null }> | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

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

  // Load availability check removed to speed up the application
  useEffect(() => {
    setProductAvailability({ available: true, total: 999, reserved: 0, remaining: 999 });
    setIsCheckingAvailability(false);
  }, [step, currentProductIndex, matchingProducts]);

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

  const getBotImageForStep = (s: number) => {
    switch (s) {
      case STEP.PROJECT_TYPE: return '/bot-avatars/010.webp';
      case STEP.ENVIRONMENT: return '/bot-avatars/003.webp';
      case STEP.DIMENSIONS: return '/bot-avatars/003.webp';
      case STEP.DISTANCE: return '/bot-avatars/004.webp';
      case STEP.PITCH: return '/bot-avatars/005.webp';
      case STEP.SUMMARY:
      case STEP.PRODUCTS: return '/bot-avatars/006.webp';
      case STEP.QUANTITY: return '/bot-avatars/006.webp';
      case STEP.DELIVERY: return '/bot-avatars/009.webp';
      case STEP.INSTALLATION: return '/bot-avatars/012.webp';
      case STEP.FORM_COMPANY:
      case STEP.FORM_EMAIL:
      case STEP.FORM_PHONE:
      case STEP.FORM_ADDRESS:
      case STEP.FORM_TERMS: return '/bot-avatars/009.webp';
      case STEP.GENERATING: return '/bot-avatars/003.webp';
      case STEP.SUCCESS: return '/bot-avatars/002.webp';
      case STEP.RENTAL_PERIOD: return '/bot-avatars/005.webp';
      case STEP.SITE_PHOTO: return '/bot-avatars/012.webp';
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
        setTimeout(() => pushBotMessage(t('bot.promptRentalPeriod'), undefined, 1200, '/bot-avatars/005.webp', () => {
          updateStep(STEP.RENTAL_PERIOD);
        }, 'bot.promptRentalPeriod'), 1000);
      } else {
        setBotStatus('smiling');
        pushBotMessage(t('bot.perfectSale', { type: value.toLowerCase() }), undefined, 800, undefined, () => {
          updateStep(STEP.ENVIRONMENT);
          promptEnvironment();
        }, 'bot.perfectSale', { type: value.toLowerCase() });
      }
    }
    else if (step === STEP.ENVIRONMENT) {
      setConfigState(prev => ({ ...prev, environment: value as any }));
      setBotStatus('smiling');
      pushBotMessage(t('bot.perfectSale', { type: configState.projectType === 'location' ? 'location' : 'vente' }), undefined, 800, undefined, () => {
        pushBotMessage(t('bot.dimensions'), undefined, 1200, undefined, () => {
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
    else if (step === STEP.FORM_EMAIL && value === 'back_phone') {
      updateStep(STEP.FORM_PHONE);
      pushBotMessage(t('bot.askPhone'), undefined, 0, undefined, undefined, 'bot.askPhone');
    }
    else if (step === STEP.FORM_PHONE && value === 'back_email') {
      updateStep(STEP.FORM_EMAIL);
      pushBotMessage(t('bot.askEmail'), undefined, 0, undefined, undefined, 'bot.askEmail');
    }
    else if (step === STEP.SITE_PHOTO) {
      if (value === 'skip_photo') {
        pushBotMessage(t('bot.lastStretch'), undefined, 800, '/bot-avatars/009.webp', () => {
          pushBotMessage(t('bot.company'), undefined, 1200, '/bot-avatars/009.webp', () => {
            updateStep(STEP.FORM_COMPANY);
          }, 'bot.company');
        }, 'bot.lastStretch');
      } else if (value === 'add_photo_camera') {
        document.getElementById('site-photo-upload-camera')?.click();
      } else if (value === 'add_photo_gallery') {
        document.getElementById('site-photo-upload-gallery')?.click();
      }
    }
    else if (step === STEP.FORM_TERMS) {
      if (value === 'read_terms') {
        window.open('https://pixiatech.com/conditions-generales', '_blank');
        setTimeout(() => pushBotMessage(t('bot.askTerms'), [
          { label: t('bot.acceptTerms'), value: 'accept_terms', translationKey: 'bot.acceptTerms' }
        ], 800, '/bot-avatars/009.webp', undefined, 'bot.askTerms'), 800);
      } else if (value === 'accept_terms') {
        submitFinalQuote();
      }
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
    pushBotMessage(t('bot.periodNoted'), undefined, 800, undefined, () => {
      updateStep(STEP.ENVIRONMENT);
      promptEnvironment();
    }, 'bot.periodNoted');
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
        updateStep(STEP.FORM_COMPANY);
        pushBotMessage(t('bot.photoSuccess'), undefined, 0, undefined, undefined, 'bot.photoSuccess');
        setTimeout(() => pushBotMessage(t('bot.company'), undefined, 1500, '/bot-avatars/009.webp', undefined, 'bot.company'), 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDimensionsSubmit = () => {
    if (!configState.width || !configState.height) return;
    takeSnapshot();
    pushUserMessage(`${configState.width}m&nbsp;×&nbsp;${configState.height}m`);
    updateStep(STEP.DISTANCE);
    pushBotMessage(t('bot.dimensionsNoted'), undefined, 0, undefined, undefined, 'bot.dimensionsNoted');
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
      pushBotMessage(t('bot.distance'), dists, 0, undefined, undefined, 'bot.distance');
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

    pushBotMessage(t('bot.searching'), undefined, 800, '/bot-avatars/006.webp', () => {
      updateStep(STEP.PRODUCTS);
      setBotStatus('solution');
      pushBotMessage(sortedProducts.length > 0 ? t('bot.recommendation') : t('bot.noMatch'), undefined, 1000, '/bot-avatars/006.webp', undefined, sortedProducts.length > 0 ? 'bot.recommendation' : 'bot.noMatch');
    }, 'bot.searching');
  };

  const handleProductSelected = (productId: string) => {
    takeSnapshot();
    setConfigState(prev => ({ ...prev, selectedProduct: productId }));
    updateStep(STEP.QUANTITY);
    setBotStatus('smiling');
    pushBotMessage(t('bot.quantity', { width: configState.width, height: configState.height }), undefined, 0, undefined, undefined, 'bot.quantity', { width: configState.width, height: configState.height });
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
        pushBotMessage(t('bot.errorQuantityZero'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorQuantityZero');
      }
      return;
    }

    if (configState.projectType === 'location' && selectedProduct) {
      const tileW = (selectedProduct.tileWidth || 50) / 100;
      const tileH = (selectedProduct.tileHeight || 50) / 100;
      const neededTiles = Math.ceil(configState.width / tileW) * Math.ceil(configState.height / tileH) * qty;

      setIsTyping(true);
      try {
        const avail = await getProductRentalAvailabilityAction(
          selectedProduct.id,
          configState.rentalStartDate!,
          configState.rentalEndDate!,
          neededTiles
        );

        if (!avail.available) {
          setIsTyping(false);
          setBotStatus('angry');
          pushBotMessage(
            locale === 'fr' 
              ? `Stock insuffisant pour ${qty} écran(s) (${neededTiles} dalles requises). Il ne reste que ${avail.remaining} dalles disponibles sur cette période. Veuillez réduire la quantité ou changer vos dates.`
              : `Insufficient stock for ${qty} screen(s) (${neededTiles} tiles required). Only ${avail.remaining} tiles are available during this period. Please reduce the quantity or change dates.`,
            undefined,
            400,
            '/bot-avatars/005.webp'
          );
          return;
        }
      } catch (error) {
        console.error('Failed to validate stock in handleQuantitySubmit:', error);
      } finally {
        setIsTyping(false);
      }
    }

    setErrorCount(0);
    takeSnapshot();
    const finalQty = qty || 1;
    pushUserMessage(t('bot.userQuantity', { count: finalQty }), undefined, 'bot.userQuantity', { count: finalQty });
    pushBotMessage(t('bot.delivery'), undefined, 800, '/bot-avatars/013.webp', () => {
      updateStep(STEP.DELIVERY);
    }, 'bot.delivery');
  };

  const handleDeliverySubmit = () => {
    if (!deliveryCityId) return;
    takeSnapshot();
    const city = locations?.villes?.find(c => c.id === deliveryCityId);
    pushUserMessage(t('bot.userDelivery', { city: city?.name || 'Ville' }));
    updateStep(STEP.INSTALLATION);
    pushBotMessage(t('bot.installation', { city: city?.name || 'Ville' }), undefined, 600, '/bot-avatars/013.webp', undefined, 'bot.installation', { city: city?.name || 'Ville' });
    setTimeout(() => pushBotMessage(t('bot.promptInstallation'), [
      { label: t('bot.yesInstallation'), value: 'yes', translationKey: 'bot.yesInstallation' },
      { label: t('bot.noInstallation'), value: 'no', translationKey: 'bot.noInstallation' },
    ], 1500, '/bot-avatars/005.webp', undefined, 'bot.promptInstallation'), 1500);
  };

  const handleInstallationChoice = (value: string, label: string) => {
    takeSnapshot();
    pushUserMessage(label);
    const include = value === 'yes';
    setIncludeInstallation(include);
    setConfigState(prev => ({ ...prev, includeInstallation: include }));

    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].senderId === 'bot' && updated[i].options) {
          updated[i] = { ...updated[i], options: undefined };
          break;
        }
      }
      return updated;
    });

    updateStep(STEP.SITE_PHOTO);
    setBotStatus('smiling');
    pushBotMessage(include ? t('bot.installationIncluded') : t('bot.noProblem'), undefined, 0, undefined, undefined, include ? 'bot.installationIncluded' : 'bot.noProblem');
    setTimeout(() => pushBotMessage(t('bot.photo'), [
      { label: t('bot.takePhoto'), value: 'add_photo_camera', translationKey: 'bot.takePhoto' },
      { label: t('bot.chooseGallery'), value: 'add_photo_gallery', translationKey: 'bot.chooseGallery' },
      { label: t('bot.skip'), value: 'skip_photo', translationKey: 'bot.skip' }
    ], 1500, '/bot-avatars/012.webp', undefined, 'bot.photo'), 1500);
  };

  const submitFinalQuote = async () => {
    const uid = user?.uid || 'anonymous';
    // Switch to SUCCESS immediately to avoid waiting screen
    updateStep(STEP.SUCCESS);
    setBotStatus('smiling');

    const envMap: Record<string, 'indoor' | 'outdoor' | 'showcase'> = { interieur: 'indoor', exterieur: 'outdoor', 'semi-exterieur': 'showcase' };
    const quoteDetails: QuoteDetails = {
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
      screenType: envMap[configState.environment] || 'indoor',
      transactionType: configState.projectType === 'vente' ? 'sale' : 'rental',
      includeInstallation: !!includeInstallation,
      installationCost,
      techniciansRequired,
      includeDelivery: !!deliveryCityId,
      deliveryCost,
      selectedCityId: deliveryCityId || null,
      totalQuote,
      width: configState.width,
      height: configState.height,
      productName: selectedProduct?.name ?? '',
      lang: locale,
      configuratorType: 'lumi',
    };

    const formData = {
      companyName: formCompany,
      email: formEmail,
      phone: formPhone,
      address: formAddress,
      notes: '',
      termsAccepted: true
    };

    try {
      const res = await createQuoteRequest(uid, formData, quoteDetails);
      if (res.success && res.id) {
        setQuoteId(res.id);
        // Wait briefly then show success view to let the last message render
        setTimeout(() => {
          updateStep(STEP.SUCCESS);
        }, 1500);
      } else {
        pushBotMessage(t('bot.errorQuote'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorQuote');
        updateStep(STEP.FORM_TERMS);
      }
    } catch (e) {
      console.error("Background quote creation failed:", e);
      pushBotMessage(t('bot.errorGeneric'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorGeneric');
    }
  };

  const handleFormCompany = () => {
    if (!formCompany.trim()) return;
    takeSnapshot();
    pushUserMessage(formCompany);
    pushBotMessage(t('bot.email'), undefined, 800, undefined, () => {
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
        pushBotMessage(t('bot.errorEmailInvalid'), undefined, 800, '/bot-avatars/007.webp', undefined, 'bot.errorEmailInvalid');
      }
      return;
    }
    setErrorCount(0);
    takeSnapshot();
    pushUserMessage(formEmail);
    pushBotMessage(t('bot.phone'), undefined, 800, undefined, () => {
      updateStep(STEP.FORM_PHONE);
    }, 'bot.phone');
  };
  const handleFormPhone = () => {
    const digitsOnly = formPhone.replace(/\D/g, '');
    const hasPlus = formPhone.startsWith('+');

    if (digitsOnly.length < 10 || digitsOnly.length > 14) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage(t('bot.errorPhoneValidation'), undefined, 800, '/bot-avatars/008.webp', () => {
          setTimeout(() => onClose(), 2000);
        }, 'bot.errorPhoneValidation');
      } else if (newCount >= 3) {
        pushBotMessage(t('bot.errorPhoneInvalid'), undefined, 800, '/bot-avatars/008.webp', undefined, 'bot.errorPhoneInvalid');
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
    if (formAddress.trim().length < 6) {
      pushBotMessage(t('bot.errorAddressShort'), undefined, 800, getAngryImage(), undefined, 'bot.errorAddressShort');
      return;
    }
    takeSnapshot();
    pushUserMessage(formAddress);
    updateStep(STEP.FORM_TERMS);
    const isEmailVerificationEnabled = settings.isEmailVerificationEnabled ?? false;

    if (isEmailVerificationEnabled) {
      pushBotMessage(t('bot.terms'), [
        { label: t('bot.acceptTerms'), value: 'accept_terms', translationKey: 'bot.acceptTerms' }
      ], 800, '/bot-avatars/009.webp', undefined, 'bot.terms');
    } else {
      submitFinalQuote();
    }
  };

  const getBotImage = () => {
    return '/bot-avatars/011.webp';
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col pointer-events-none">
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
                            const isInstallOpt = step === STEP.INSTALLATION;
                            return (
                              <button
                                key={value || i}
                                onClick={() => {
                                  if (isInstallOpt) handleInstallationChoice(value, label);
                                  else if (step === STEP.SITE_PHOTO && value.startsWith('add_photo_')) {
                                    if (value === 'add_photo_camera') {
                                      document.getElementById('site-photo-upload-camera')?.click();
                                    } else {
                                      document.getElementById('site-photo-upload-gallery')?.click();
                                    }
                                  }
                                  else handleOptionSelect(value, label, imageUrl, typeof option !== 'string' ? option.translationKey : undefined, typeof option !== 'string' ? option.translationParams : undefined);
                                }}
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
                  {step === STEP.DIMENSIONS && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                      <StepDimensions state={configState} updateState={(u) => setConfigState(prev => ({ ...prev, ...u }))} settings={settings} t={t} isInChat={true} />
                      <div className="px-6 pb-6">
                        <Button onClick={handleDimensionsSubmit} disabled={!configState.width || !configState.height} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          {t('bot.confirmDimensions')} <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.SUMMARY && !isTyping && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                      <StepSummary state={configState} t={t} locale={locale} />
                      <div className="p-4 bg-slate-50 border-t">
                        <Button onClick={handleProceedToProducts} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          {t('bot.searchProducts')} 🔍
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.PRODUCTS && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      {matchingProducts.length === 0 || currentProductIndex >= matchingProducts.length ? (
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                          <ProductNotFound
                            onReset={() => startConversation()}
                            onBack={() => { updateStep(STEP.SUMMARY); pushBotMessage('Revenons au résumé pour modifier vos choix.'); }}
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
                            const hasDates = !!(configState.rentalStartDate && configState.rentalEndDate);
                            // Merge bulk info to avoid flashes if productAvailability isn't loaded yet
                            const currentBulkAvail = bulkAvailability?.[currentProduct.id];
                            const effectiveAvail = productAvailability || currentBulkAvail;

                            const isUnavailable = isRental && hasDates && effectiveAvail !== null && !effectiveAvail?.available;
                            const isAvailable = isRental && hasDates && effectiveAvail !== null && !!effectiveAvail?.available;

                            // Alternative size calculation
                            let altWidth: number | null = null;
                            let altHeight: number | null = null;
                            if (isUnavailable && effectiveAvail?.remaining !== undefined && effectiveAvail.remaining > 0 && currentProduct.tileWidth && currentProduct.tileHeight) {
                              const tileW = currentProduct.tileWidth / 100;
                              const tileH = currentProduct.tileHeight / 100;
                              let w = configState.width;
                              let h = configState.height;
                              while (w >= 0.5 && h >= 0.5) {
                                if (w >= h) w -= 0.5;
                                else h -= 0.5;
                                if (w > 0 && h > 0 && Math.ceil(w / tileW) * Math.ceil(h / tileH) <= effectiveAvail.remaining) {
                                  altWidth = w;
                                  altHeight = h;
                                  break;
                                }
                              }
                            }

                            // Best choice badge check
                            const isBestChoice = currentProductIndex === 0 && matchingProducts.length > 1 && (!isRental || isAvailable);

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

                            // Price display
                            const priceLabel = locale === 'fr' ? 'Prix sur estimation' : 'Price on quote';
                            const priceBlurLabel = locale === 'fr' ? 'Sur estimation' : 'On quote';

                            return (
                              <>
                                <motion.div
                                key={currentProduct.id}
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -40, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className={cn(
                                  "rounded-[40px] shadow-2xl border overflow-hidden flex flex-col relative transition-all duration-500",
                                  isUnavailable
                                    ? "bg-slate-100 border-red-200 opacity-60 grayscale-[0.5]"
                                    : "bg-white border-slate-100"
                                )}
                              >
                                {/* Badges layer */}
                                <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
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

                                {/* Unavailable overlay banner */}
                                {isUnavailable && (
                                  <div className="absolute top-0 left-0 right-0 z-20 bg-red-600 text-white text-[12px] font-black uppercase tracking-widest text-center py-3 flex items-center justify-center gap-2 shadow-sm">
                                    <Ban size={14} />
                                    {locale === 'fr' ? 'Rupture de stock' : 'Out of stock'}
                                  </div>
                                )}

                                {/* New Premium Header Style */}
                                <div className={cn("p-6 text-center border-b border-slate-50", isUnavailable && "pt-12")}>
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

                                <div className={cn("relative aspect-square md:aspect-video bg-[#f8fafc] overflow-hidden flex items-center justify-center group", isUnavailable && "grayscale")}>
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
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{priceLabel}</span>
                                    <span className="font-black text-2xl text-slate-300 filter blur-[3px] select-none pointer-events-none transition-all duration-700 hover:blur-none hover:text-[#0f766e]">{priceBlurLabel}</span>
                                  </div>

                                  {/* Availability badge for rental */}
                                  {isRental && hasDates && (
                                    <div className={cn(
                                      "flex items-center gap-2 text-[11px] font-bold px-4 py-3 rounded-xl border transition-all duration-300",
                                      isCheckingAvailability
                                        ? "bg-slate-50 text-slate-400 border-slate-100"
                                        : isAvailable
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : isUnavailable
                                            ? "bg-red-50 text-red-700 border-red-200"
                                            : "bg-slate-50 text-slate-400 border-slate-100"
                                    )}>
                                      {isCheckingAvailability ? (
                                        <><Loader2 size={14} className="animate-spin shrink-0" />{locale === 'fr' ? 'Vérification du stock...' : 'Checking stock...'}</>
                                      ) : isAvailable ? (
                                        <><CheckCircle2 size={14} className="shrink-0" />{locale === 'fr' ? `${productAvailability!.remaining} / ${productAvailability!.total} dalles disponibles` : `${productAvailability!.remaining} / ${productAvailability!.total} tiles available`}</>
                                      ) : isUnavailable ? (
                                        <><Ban size={14} className="shrink-0" />{locale === 'fr' ? `Rupture de stock — ${productAvailability!.remaining} / ${productAvailability!.total} dalles restantes` : `Out of stock — ${productAvailability!.remaining} / ${productAvailability!.total} tiles remaining`}</>
                                      ) : (
                                        <><AlertTriangle size={14} className="shrink-0" />{locale === 'fr' ? 'Disponibilité inconnue' : 'Availability unknown'}</>
                                      )}
                                    </div>
                                  )}

                                  {/* Availability Date and Alternative */}
                                  {isUnavailable && (
                                    <div className="space-y-3">
                                      {effectiveAvail?.nextAvailableDate && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-[12px] font-bold flex items-center gap-2">
                                          <CalendarIcon size={14} />
                                          {locale === 'fr' ? `Disponible à partir du ${new Date(effectiveAvail.nextAvailableDate).toLocaleDateString('fr-FR')}` : `Available from ${new Date(effectiveAvail.nextAvailableDate).toLocaleDateString('en-US')}`}
                                        </div>
                                      )}
                                      
                                      {altWidth && altHeight && (
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                          <h4 className="text-orange-800 text-[12px] font-bold mb-2 flex items-center gap-1">
                                            ✨ {locale === 'fr' ? 'Alternative possible' : 'Possible alternative'}
                                          </h4>
                                          <p className="text-orange-700 text-[11px] mb-3 leading-relaxed">
                                            {locale === 'fr' 
                                              ? `Pour cette période, une configuration ${altWidth}m × ${altHeight}m est disponible.`
                                              : `For this period, a ${altWidth}m × ${altHeight}m configuration is available.`}
                                          </p>
                                          <Button
                                            onClick={() => {
                                              setConfigState(prev => ({ ...prev, width: altWidth!, height: altHeight! }));
                                              setProductAvailability(null);
                                              setIsCheckingAvailability(true);
                                              // Check availability for the new config
                                              setTimeout(() => {
                                                const tileW = (currentProduct.tileWidth || 50) / 100;
                                                const tileH = (currentProduct.tileHeight || 50) / 100;
                                                const newNeeded = Math.ceil(altWidth! / tileW) * Math.ceil(altHeight! / tileH);
                                                import('@/app/actions/quote-actions').then(m => {
                                                  m.getProductRentalAvailabilityAction(currentProduct.id, configState.rentalStartDate!, configState.rentalEndDate!, newNeeded)
                                                  .then(res => {
                                                    setProductAvailability(res as any);
                                                    setIsCheckingAvailability(false);
                                                  });
                                                });
                                              }, 100);
                                            }}
                                            className="w-full h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                                          >
                                            {locale === 'fr' ? 'Utiliser cette configuration' : 'Use this configuration'}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="p-4 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-xl">
                                    <h3 className="font-bold text-[#0f766e] text-[13px] flex items-center gap-2 mb-1">
                                      💡 {locale === 'fr' ? "L'astuce de l'assistant" : "Assistant tip"}
                                    </h3>
                                    <p className="text-[12px] text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: quantityExplanation }} />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setCurrentProductIndex(prev => prev + 1);
                                      }}
                                      className="h-14 rounded-xl font-bold border-slate-200 text-slate-600 bg-white hover:bg-slate-100 hover:text-black uppercase tracking-wider text-[11px] transition-all"
                                    >
                                      {t('bot.nextProduct')}
                                    </Button>
                                    <Button
                                      disabled={isCheckingAvailability || isUnavailable}
                                      onClick={() => {
                                        pushUserMessage(t('bot.productFits'), undefined, 'bot.productFits');
                                        handleProductSelected(currentProduct.id);
                                      }}
                                      className={cn(
                                        "h-14 rounded-xl font-black uppercase tracking-wider text-[11px] shadow-xl active:scale-95 transition-all",
                                        isUnavailable
                                          ? "bg-red-100 text-red-400 cursor-not-allowed border border-red-200"
                                          : "bg-black hover:bg-[#B3E140] text-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                                      )}
                                    >
                                      {isCheckingAvailability ? (
                                        <Loader2 size={16} className="animate-spin" />
                                      ) : isUnavailable ? (
                                        <><Ban size={14} className="mr-1.5" />{t('bot.unavailable')}</>
                                      ) : (
                                        <>{t('bot.confirm')}<ArrowRight size={16} className="ml-2" /></>
                                      )}
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

                  {step === STEP.RENTAL_PERIOD && !isTyping && (
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

                  {step === STEP.QUANTITY && !isTyping && (
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
                      <Button onClick={handleQuantitySubmit} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black shadow-md active:scale-95 transition-all">
                        <ArrowRight size={20} />
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.DELIVERY && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 space-y-4">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <MapPin size={18} className="text-[#0f766e]" /> {locale === 'en' ? "Delivery city" : "Ville de livraison"}
                      </div>
                      <select
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white text-slate-800"
                        value={deliveryCityId}
                        onChange={(e) => setDeliveryCityId(e.target.value)}
                      >
                        <option value="" disabled>{locale === 'en' ? "Select a city..." : "Sélectionnez une ville..."}</option>
                        {locations?.villes?.map(city => (
                          <option key={city.id} value={city.id}>{city.name} ({city.postalCode})</option>
                        ))}
                      </select>
                      <Button onClick={handleDeliverySubmit} disabled={!deliveryCityId} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                        {locale === 'en' ? "Confirm city" : "Confirmer la ville"} <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_COMPANY && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input placeholder={t('quoteForm.companyPlaceholder')} value={formCompany} onChange={e => setFormCompany(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormCompany()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormCompany} disabled={!formCompany.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_EMAIL && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="email" placeholder={t('quoteForm.emailPlaceholder')} value={formEmail} onChange={e => setFormEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormEmail()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormEmail} disabled={!formEmail.includes('@')} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_PHONE && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="tel" placeholder={t('quoteForm.phonePlaceholder')} value={formPhone} onChange={e => setFormPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormPhone()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormPhone} disabled={!formPhone.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_ADDRESS && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input placeholder={t('quoteForm.addressPlaceholder')} value={formAddress} onChange={e => setFormAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormAddress()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormAddress} disabled={!formAddress.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.GENERATING && (
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
          <input type="file" id="site-photo-upload-camera" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
          <input type="file" id="site-photo-upload-gallery" className="hidden" accept="image/*" onChange={handlePhotoUpload} />

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
            className="fixed inset-0 z-[300] bg-white flex flex-col"
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
