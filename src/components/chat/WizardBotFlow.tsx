'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, ArrowRight, ArrowLeft, MapPin, Loader2, Grid, Calendar as CalendarIcon, Clock, Bot, Video, Download, Info } from 'lucide-react';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createQuoteRequest } from '@/app/actions/quote-actions';
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
  const { t, locale } = useI18n();
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
  const updateStep = (newStep: number) => {
    stepRef.current = newStep;
    setStep(newStep);
  };
  const [configState, setConfigState] = useState<ConfigState>(INITIAL_STATE);
  const { user } = useUser();

  const [quoteId, setQuoteId] = useState<string>('');

  const [matchingProducts, setMatchingProducts] = useState<Product[]>([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [deliveryCityId, setDeliveryCityId] = useState('');
  const [includeInstallation, setIncludeInstallation] = useState<boolean | null>(null);

  // Form Fields
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

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

  const pushBotMessage = useCallback((content: string, options?: MessageOption[], delay = 600, customImage?: string, onComplete?: () => void) => {
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
      }]);
      if (onComplete) onComplete();
    }, delay);
  }, []);

  const pushUserMessage = (content: string, imageUrl?: string) => {
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
      }];
    });
  };

  const startConversation = useCallback((settingsObj: WizardSettings | null = wizardSettings) => {
    if (!settingsObj) return;
    setMessages([]);
    updateStep(STEP.PROJECT_TYPE);
    setConfigState(INITIAL_STATE);

    setBotStatus('smiling');
    pushBotMessage('Bonjour ! 👋 Je suis votre assistant pour votre projet d\'écran LED.', undefined, 400);

    setTimeout(() => {
      const types: MessageOption[] = [];
      if (settingsObj.projectTypes?.location?.enabled !== false)
        types.push({ label: 'Location', value: 'location', imageUrl: settingsObj.projectTypes?.location?.imageUrl });
      if (settingsObj.projectTypes?.vente?.enabled !== false)
        types.push({ label: 'Achat définitif', value: 'vente', imageUrl: settingsObj.projectTypes?.vente?.imageUrl });
      pushBotMessage('Pour bien vous orienter, souhaitez-vous partir sur une solution en location ou sur un achat définitif ?', types, 600);
    }, 800);
  }, [wizardSettings, pushBotMessage]);

  useEffect(() => {
    if (!wizardSettings || initialized.current) return;
    initialized.current = true;
    startConversation(wizardSettings);
  }, [wizardSettings, startConversation]);

  const handleOptionSelect = (value: string, label: string, imageUrl?: string) => {
    pushUserMessage(label, imageUrl);

    if (step === STEP.PROJECT_TYPE) {
      setConfigState(prev => ({ ...prev, projectType: value as any }));
      if (value === 'location') {
        setBotStatus('smiling');
        pushBotMessage(`Parfait, un projet de location !`, undefined, 800, '/bot-avatars/005.webp');
        setTimeout(() => pushBotMessage('Pour vous fournir une estimation précise, merci d’indiquer les dates de début et de fin de votre événement, ainsi que les horaires d’utilisation prévus. 🗓️', undefined, 1200, '/bot-avatars/005.webp', () => {
          updateStep(STEP.RENTAL_PERIOD);
        }), 1000);
      } else {
        setBotStatus('smiling');
        pushBotMessage(`Parfait, un projet de ${label.toLowerCase()} !`, undefined, 800, undefined, () => {
          updateStep(STEP.ENVIRONMENT);
          promptEnvironment();
        });
      }
    }
    else if (step === STEP.ENVIRONMENT) {
      setConfigState(prev => ({ ...prev, environment: value as any }));
      setBotStatus('smiling');
      pushBotMessage(`Bien noté — écran ${label.toLowerCase()}.`, undefined, 800, undefined, () => {
        pushBotMessage('Quelles dimensions souhaitez-vous pour votre écran ? Utilisez le formulaire ci-dessous.', undefined, 1200, undefined, () => {
          updateStep(STEP.DIMENSIONS);
        });
      });
    }
    else if (step === STEP.DISTANCE) {
      handleDistanceSelect(value, label);
    }
    else if (step === STEP.PITCH) {
      setConfigState(prev => ({ ...prev, pixelPitch: value }));
      updateStep(STEP.SUMMARY);
      setBotStatus('solution');
      pushBotMessage('Excellent choix ! Voici le résumé de votre configuration :');
    }
    else if (step === STEP.FORM_EMAIL && value === 'back_phone') {
      updateStep(STEP.FORM_PHONE);
      pushBotMessage('Pas de souci, quel est votre numéro de téléphone ?');
    }
    else if (step === STEP.FORM_PHONE && value === 'back_email') {
      updateStep(STEP.FORM_EMAIL);
      pushBotMessage('Pas de souci, quelle est votre adresse email ?');
    }
    else if (step === STEP.SITE_PHOTO) {
      if (value === 'skip_photo') {
        pushBotMessage('Pas de problème. Dernière ligne droite pour votre devis !', undefined, 800, '/bot-avatars/009.webp', () => {
          pushBotMessage('Quel est le nom de votre entreprise ?', undefined, 1200, '/bot-avatars/009.webp', () => {
            updateStep(STEP.FORM_COMPANY);
          });
        });
      } else if (value === 'add_photo_camera') {
        document.getElementById('site-photo-upload-camera')?.click();
      } else if (value === 'add_photo_gallery') {
        document.getElementById('site-photo-upload-gallery')?.click();
      }
    }
    else if (step === STEP.FORM_TERMS) {
      if (value === 'read_terms') {
        window.open('https://pixiatech.com/conditions-generales', '_blank');
        setTimeout(() => pushBotMessage('Avez-vous pris connaissance de nos conditions ?', [
          { label: "J'accepte les conditions", value: 'accept_terms' }
        ], 800, '/bot-avatars/009.webp'), 800);
      } else if (value === 'accept_terms') {
        submitFinalQuote();
      }
    }
  };

  const promptEnvironment = () => {
    const envs: MessageOption[] = [];
    if (wizardSettings?.environments?.interieur) envs.push({ label: 'Intérieur', value: 'interieur', imageUrl: wizardSettings.environments.interieur.imageUrl });
    if (wizardSettings?.environments?.['semi-exterieur']) envs.push({ label: 'Semi-extérieur', value: 'semi-exterieur', imageUrl: wizardSettings.environments['semi-exterieur'].imageUrl });
    if (wizardSettings?.environments?.exterieur) envs.push({ label: 'Extérieur', value: 'exterieur', imageUrl: wizardSettings.environments.exterieur.imageUrl });
    pushBotMessage('Quel sera l\'environnement d\'installation de l\'écran ?', envs.length ? envs : [
      { label: 'Intérieur', value: 'interieur' },
      { label: 'Semi-extérieur', value: 'semi-exterieur' },
      { label: 'Extérieur', value: 'exterieur' },
    ], 1500, '/bot-avatars/003.webp');
  };

  const handleRentalPeriodSubmit = () => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formattedStart = formatDate(configState.rentalStartDate || '');
    const formattedEnd = formatDate(configState.rentalEndDate || '');

    const message = `
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="opacity-70">Période de location:</span>
          <span class="font-bold">Du ${formattedStart} au ${formattedEnd}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="opacity-70">Horaires:</span>
          <span class="font-bold">${configState.rentalStartTime || '08:00'} à ${configState.rentalEndTime || '18:00'}</span>
        </div>
      </div>
    `;

    pushUserMessage(message);
    setBotStatus('smiling');
    pushBotMessage('C\'est noté pour cette période !', undefined, 800, undefined, () => {
      updateStep(STEP.ENVIRONMENT);
      promptEnvironment();
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setConfigState(prev => ({ ...prev, installationPhoto: dataUrl }));
        pushUserMessage('Voici la photo', dataUrl);
        updateStep(STEP.FORM_COMPANY);
        pushBotMessage('Super photo, merci ! Dernière ligne droite pour votre devis !');
        setTimeout(() => pushBotMessage('Quel est le nom de votre entreprise ?', undefined, 1500, '/bot-avatars/009.webp'), 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDimensionsSubmit = () => {
    if (!configState.width || !configState.height) return;
    pushUserMessage(`${configState.width}m&nbsp;×&nbsp;${configState.height}m`);
    updateStep(STEP.DISTANCE);
    pushBotMessage('Super dimensions&nbsp;!');
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
      pushBotMessage('À quelle distance votre audience regardera-t-elle principalement l\'écran ?', dists);
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

    const pitches: MessageOption[] = (wizardSettings?.pixelPitches ?? [])
      .filter(p => {
        const val = parseFloat(p.value.replace('P', ''));
        return val >= minPitch && val <= maxPitch;
      })
      .map(p => ({ label: p.value, value: p.value, imageUrl: p.imageUrl }));

    if (pitches.length === 0) {
      // Fallback to all if none match
      pitches.push(...(wizardSettings?.pixelPitches ?? []).map(p => ({ label: p.value, value: p.value, imageUrl: p.imageUrl })));
    }

    if (!pitches.find(p => p.value === 'Je ne sais pas')) pitches.push({ label: 'Je ne sais pas', value: 'Je ne sais pas' });

    updateStep(STEP.PITCH);
    pushBotMessage('Noté ! Au vu de cette distance, voici les résolutions adaptées :', pitches);
  };

  const handleProceedToProducts = () => {
    const area = configState.width * configState.height;
    const pitchValue = parseFloat(configState.pixelPitch.replace('P', '')) || 2.5;

    const filteredProducts = (allProducts || []).filter(p => {
      if (!p.pitch && !p.distance) return true;
      const productPitch = p.pitch ? parseFloat(String(p.pitch).replace('P', '')) : null;
      if (productPitch !== null) {
        const diff = Math.abs(productPitch - pitchValue);
        if (diff > 1.5) return false;
      }
      return true;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
      const aPitch = a.pitch ? parseFloat(String(a.pitch).replace('P', '')) || 999 : 999;
      const bPitch = b.pitch ? parseFloat(String(b.pitch).replace('P', '')) || 999 : 999;
      return Math.abs(aPitch - pitchValue) - Math.abs(bPitch - pitchValue);
    });

    setMatchingProducts(sortedProducts);
    setCurrentProductIndex(0);

    // Clear summary immediately and start bot search animation
    updateStep(STEP.GENERATING);
    setBotStatus('thinking');

    pushBotMessage('Je recherche les meilleurs produits pour vous... 🔍', undefined, 800, '/bot-avatars/006.webp', () => {
      // Show product card once initial search message is done
      updateStep(STEP.PRODUCTS);
      setBotStatus('solution');
      pushBotMessage(sortedProducts.length > 0 ? 'Voici le produit que je vous recommande pour ce projet !' : 'Oups, aucun produit ne correspond exactement.', undefined, 1000, '/bot-avatars/006.webp');
    });
  };

  const handleProductSelected = (productId: string) => {
    setConfigState(prev => ({ ...prev, selectedProduct: productId }));
    updateStep(STEP.QUANTITY);
    setBotStatus('smiling');
    pushBotMessage(`Excellent choix ! Pour votre écran de ${configState.width}m × ${configState.height}m, combien d'écrans de ce type souhaitez-vous ?`);
  };

  const handleQuantitySubmit = () => {
    const qty = configState.quantity;
    if (qty === 0) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage("Nous n'arrivons pas à valider vos informations. La session va se fermer.", undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        });
      } else if (newCount >= 3) {
        pushBotMessage("Il semble que vous rencontriez des difficultés. Souhaitez-vous contacter directement un conseiller ?<br/><br/>📧 <strong>contact@pixiatech.com</strong><br/>📞 <strong>+33 7 71 59 31 66</strong>", undefined, 800, '/bot-avatars/007.webp');
      } else {
        pushBotMessage("Tu ne peux pas choisir une quantité de 0. Merci d'indiquer au moins 1 écran.", undefined, 800, '/bot-avatars/007.webp');
      }
      return;
    }
    setErrorCount(0);
    const finalQty = qty || 1;
    pushUserMessage(`${finalQty} écran(s)`);
    pushBotMessage('C\'est noté ! Pour la livraison, dans quelle ville souhaitez-vous être livré ?', undefined, 800, '/bot-avatars/013.webp', () => {
      updateStep(STEP.DELIVERY);
    });
  };

  const handleDeliverySubmit = () => {
    if (!deliveryCityId) return;
    const city = locations?.villes?.find(c => c.id === deliveryCityId);
    pushUserMessage(`Livraison à : ${city?.name || 'Ville'}`);
    updateStep(STEP.INSTALLATION);
    pushBotMessage(`Livraison notée à ${city?.name || 'Ville'}.`, undefined, 600, '/bot-avatars/013.webp');
    setTimeout(() => pushBotMessage('Souhaitez-vous inclure l\'installation professionnelle ?', [
      { label: '✅ Oui, inclure l\'installation', value: 'yes' },
      { label: '❌ Non merci', value: 'no' },
    ], 1500, '/bot-avatars/005.webp'), 1500);
  };

  const handleInstallationChoice = (value: string, label: string) => {
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
    pushBotMessage(include ? 'Installation incluse 👷.' : 'Pas de souci.');
    setTimeout(() => pushBotMessage('Avez-vous une photo de l\'endroit où l\'écran sera installé ? Cela nous aiderait beaucoup pour préparer le projet.', [
      { label: '📸 Prendre une photo', value: 'add_photo_camera' },
      { label: '🖼️ Choisir dans la galerie', value: 'add_photo_gallery' },
      { label: 'Passer cette étape', value: 'skip_photo' }
    ], 1500, '/bot-avatars/012.webp'), 1500);
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
      lang: 'fr',
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
        pushBotMessage("Une erreur est survenue lors de la création de votre devis. Veuillez réessayer.", undefined, 800, '/bot-avatars/007.webp');
        updateStep(STEP.FORM_TERMS); // Go back to let them try again
      }
    } catch (e) {
      console.error("Background quote creation failed:", e);
      pushBotMessage("Une erreur inattendue est survenue.", undefined, 800, '/bot-avatars/007.webp');
    }
  };

  const handleFormCompany = () => {
    if (!formCompany.trim()) return;
    pushUserMessage(formCompany);
    pushBotMessage('Merci. Quelle est votre adresse email ?', undefined, 800, undefined, () => {
      updateStep(STEP.FORM_EMAIL);
    });
  };
  const handleFormEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage("Nous n'arrivons pas à valider vos informations. La session va se fermer. N'hésitez pas à nous contacter directement.", undefined, 800, '/bot-avatars/007.webp', () => {
          setTimeout(() => onClose(), 2000);
        });
      } else if (newCount >= 3) {
        pushBotMessage("Il semble que vous rencontriez des difficultés. Souhaitez-vous contacter directement un conseiller pour finaliser votre demande ?<br/><br/>📧 <strong>contact@pixiatech.com</strong><br/>📞 <strong>+33 7 71 59 31 66</strong>", undefined, 800, '/bot-avatars/007.webp');
      } else {
        pushBotMessage("Oups ! L'adresse email saisie ne semble pas valide. Pourriez-vous la vérifier pour que je puisse vous envoyer votre devis ?", undefined, 800, '/bot-avatars/007.webp');
      }
      return;
    }
    setErrorCount(0);
    pushUserMessage(formEmail);
    pushBotMessage('C\'est noté. Quel est votre numéro de téléphone ?', undefined, 800, undefined, () => {
      updateStep(STEP.FORM_PHONE);
    });
  };
  const handleFormPhone = () => {
    const digitsOnly = formPhone.replace(/\D/g, '');
    const hasPlus = formPhone.startsWith('+');

    if (digitsOnly.length < 10 || digitsOnly.length > 14) {
      const newCount = errorCount + 1;
      setErrorCount(newCount);

      if (newCount >= 6) {
        pushBotMessage("Nous n'arrivons pas à valider votre numéro. La session va se fermer.", undefined, 800, '/bot-avatars/008.webp', () => {
          setTimeout(() => onClose(), 2000);
        });
      } else if (newCount >= 3) {
        pushBotMessage("Il semble que vous rencontriez des difficultés. Souhaitez-vous nous appeler ?<br/>📞 <strong>+33 7 71 59 31 66</strong>", undefined, 800, '/bot-avatars/008.webp');
      } else {
        pushBotMessage("Ce numéro de téléphone n'est pas au bon format. Merci d'indiquer un numéro valide (entre 10 et 14 chiffres, avec ou sans +).", undefined, 800, '/bot-avatars/008.webp');
      }
      return;
    }
    setErrorCount(0);
    pushUserMessage(formPhone);
    pushBotMessage('Parfait. Quelle est l\'adresse complète de l\'événement/installation ?', undefined, 800, '/bot-avatars/013.webp', () => {
      updateStep(STEP.FORM_ADDRESS);
    });
  };
  const handleFormAddress = () => {
    if (formAddress.trim().length < 6) {
      pushBotMessage("L'adresse saisie semble trop courte. Pourriez-vous indiquer une adresse complète (rue, ville, code postal) ?", undefined, 800, getAngryImage());
      return;
    }
    pushUserMessage(formAddress);
    updateStep(STEP.FORM_TERMS);
    const isEmailVerificationEnabled = settings.isEmailVerificationEnabled ?? false;

    if (isEmailVerificationEnabled) {
      pushBotMessage('Dernière étape avant la génération de votre devis PDF. Vous devez accepter nos <a href="/contact" class="text-black font-black hover:opacity-70 transition-all">Conditions Générales de Vente</a>.', [
        { label: "J'accepte les conditions", value: 'accept_terms' }
      ], 800, '/bot-avatars/009.webp');
    } else {
      // Skip verification logic
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
            className="fixed right-0 md:right-4 top-1/2 md:top-[calc(50%-4vh)] w-full md:w-[600px] h-[100dvh] md:h-[90vh] bg-[#f8f9fb] shadow-2xl z-[210] border border-slate-200 md:rounded-[48px] overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="h-20 bg-[#0f766e] flex items-center justify-between px-4 md:px-6 z-10 shrink-0 shadow-md">
              <div className="flex items-center gap-4">
                <div className="shrink-0 drop-shadow-md">
                  <img src={getBotImage()} alt="Bot" className="w-[72px] h-[72px] object-contain origin-bottom" />
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="font-bold text-white text-lg leading-tight">Assistant Bot Lumi</span>
                  <span className="text-[12px] text-[#86efac] font-medium flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#86efac] animate-pulse" />
                    En ligne
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (step === STEP.PROJECT_TYPE) return;

                    // Determine previous step
                    let prevStep: number = STEP.PROJECT_TYPE;
                    if (step === STEP.RENTAL_PERIOD) prevStep = STEP.PROJECT_TYPE;
                    else if (step === STEP.ENVIRONMENT) prevStep = configState.projectType === 'location' ? STEP.RENTAL_PERIOD : STEP.PROJECT_TYPE;
                    else if (step === STEP.DIMENSIONS) prevStep = STEP.ENVIRONMENT;
                    else if (step === STEP.DISTANCE) prevStep = STEP.DIMENSIONS;
                    else if (step === STEP.PITCH) prevStep = STEP.DISTANCE;
                    else if (step === STEP.SUMMARY) prevStep = STEP.PITCH;
                    else if (step === STEP.PRODUCTS) prevStep = STEP.SUMMARY;
                    else if (step === STEP.QUANTITY) prevStep = STEP.PRODUCTS;
                    else if (step === STEP.DELIVERY) prevStep = STEP.QUANTITY;
                    else if (step === STEP.INSTALLATION) prevStep = STEP.DELIVERY;
                    else if (step === STEP.SITE_PHOTO) prevStep = STEP.INSTALLATION;
                    else if (step === STEP.FORM_COMPANY) prevStep = STEP.SITE_PHOTO;
                    else if (step === STEP.FORM_EMAIL) prevStep = STEP.FORM_COMPANY;
                    else if (step === STEP.FORM_PHONE) prevStep = STEP.FORM_EMAIL;
                    else if (step === STEP.FORM_ADDRESS) prevStep = STEP.FORM_PHONE;
                    else if (step === STEP.FORM_TERMS) prevStep = STEP.FORM_ADDRESS;

                    // Revert messages: remove user's last answer and bot's last prompt
                    setMessages(prev => {
                      const lastUserIdx = [...prev].reverse().findIndex(m => m.senderId === 'user');
                      if (lastUserIdx !== -1) {
                        return prev.slice(0, prev.length - lastUserIdx - 1);
                      }
                      return prev;
                    });

                    updateStep(prevStep);

                    // Re-trigger prompt for the previous step
                    setTimeout(() => {
                      if (prevStep === STEP.PROJECT_TYPE) startConversation();
                      else if (prevStep === STEP.ENVIRONMENT) promptEnvironment();
                      else if (prevStep === STEP.DIMENSIONS) pushBotMessage('Quelles dimensions souhaitez-vous pour votre écran ? Utilisez le formulaire ci-dessous.');
                      else if (prevStep === STEP.DISTANCE) {
                        const dists: MessageOption[] = (wizardSettings?.viewingDistances ?? []).map(d => ({ label: d.value, value: d.value, imageUrl: d.imageUrl }));
                        pushBotMessage('À quelle distance votre audience regardera-t-elle principalement l\'écran ?', dists.length ? dists : undefined);
                      }
                      else if (prevStep === STEP.PITCH) handleDistanceSelect(configState.viewingDistance, configState.viewingDistance);
                      else if (prevStep === STEP.SUMMARY) pushBotMessage('Excellent choix ! Voici le résumé de votre configuration :');
                      else if (prevStep === STEP.PRODUCTS) handleProceedToProducts();
                      else if (prevStep === STEP.QUANTITY) pushBotMessage(`Combien d'écrans de ce type souhaitez-vous ?`);
                      else if (prevStep === STEP.DELIVERY) pushBotMessage('Pour la livraison, dans quelle ville souhaitez-vous être livré ?');
                      else if (prevStep === STEP.INSTALLATION) pushBotMessage('Souhaitez-vous inclure l\'installation professionnelle ?', [
                        { label: '✅ Oui, inclure l\'installation', value: 'yes' },
                        { label: '❌ Non merci', value: 'no' },
                      ]);
                      else if (prevStep === STEP.SITE_PHOTO) pushBotMessage('Avez-vous une photo de l\'endroit où l\'écran sera installé ?', [
                        { label: '📸 Prendre une photo', value: 'add_photo_camera' },
                        { label: '🖼️ Choisir dans la galerie', value: 'add_photo_gallery' },
                        { label: 'Passer cette étape', value: 'skip_photo' }
                      ], 1500, '/bot-avatars/reference-site.webp');
                    }, 100);
                  }}
                  className={cn(
                    "h-11 px-5 rounded-2xl text-[11px] font-black transition-all active:scale-95 uppercase tracking-[0.1em] flex items-center gap-2",
                    step > 1 ? "bg-white/10 text-white hover:bg-white/20 border border-white/10" : "opacity-0 pointer-events-none"
                  )}
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  onClick={() => startConversation()}
                  className="h-11 px-5 rounded-2xl bg-black text-white hover:bg-[#B3E140] hover:text-black text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-xl border border-black/10"
                >
                  RECOMMENCER
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
              className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar relative min-h-0 bg-[#efeae2]"
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
                          {msg.options.map((option, i) => {
                            const label = typeof option === 'string' ? option : option.label;
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
                                  else handleOptionSelect(value, label, imageUrl);
                                }}
                                className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-black text-white border border-black shadow-lg hover:bg-[#B3E140] hover:text-black hover:border-[#B3E140] active:scale-95 transition-all uppercase tracking-wider"
                              >
                                {label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </div>
                  ))}

                  {/* ── Steps ── */}
                  {step === STEP.DIMENSIONS && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                      <StepDimensions state={configState} updateState={(u) => setConfigState(prev => ({ ...prev, ...u }))} settings={settings} t={t} />
                      <div className="px-6 pb-6">
                        <Button onClick={handleDimensionsSubmit} disabled={!configState.width || !configState.height} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          Confirmer les dimensions <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === STEP.SUMMARY && !isTyping && (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                      <StepSummary state={configState} t={t} locale={locale} />
                      <div className="p-4 bg-slate-50 border-t">
                        <Button onClick={handleProceedToProducts} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                          Rechercher les produits recommandés 🔍
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

                            return (
                              <motion.div
                                key={currentProduct.id}
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -40, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
                              >
                                {/* New Premium Header Style */}
                                <div className="p-6 text-center border-b border-slate-50">
                                  <h2 className="font-black text-[#0f172a] tracking-tight text-[13px] leading-relaxed uppercase mb-2 px-4">
                                    Au vu de la configuration que vous avez choisie, ce produit représente la solution la plus adaptée à vos besoins.
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
                                  {/* Media Actions Overlay */}
                                  <div className="absolute top-8 right-8 flex flex-col gap-3 z-30">
                                    {currentProduct.videoUrl && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setLightboxUrl(currentProduct.videoUrl!); }}
                                        className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center text-slate-900 transition-all hover:bg-white active:scale-90 border border-slate-100"
                                        title="Voir la vidéo"
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
                                        title="Consulter la Fiche Technique"
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
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Média non disponible</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-8 space-y-8">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex flex-col gap-1 flex-1">
                                      <h3 className="font-black text-2xl text-[#0f172a] leading-tight uppercase tracking-tight">{currentProduct.name}</h3>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentProduct.environment}</p>
                                    </div>
                                    <div className="bg-[#f1f5f9] px-5 py-3 rounded-2xl">
                                      <span className="font-black text-slate-800 text-base tracking-tighter">{currentProduct.pitch || configState.pixelPitch}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prix Estimation</span>
                                    <span className="font-black text-2xl text-slate-300 filter blur-[3px] select-none pointer-events-none transition-all duration-700 hover:blur-none hover:text-[#0f766e]">Estimation en cours...</span>
                                  </div>

                                  <div className="p-4 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-xl">
                                    <h3 className="font-bold text-[#0f766e] text-[13px] flex items-center gap-2 mb-1">
                                      💡 L'astuce de l'assistant
                                    </h3>
                                    <p className="text-[12px] text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: quantityExplanation }} />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        // Direct switch to next product or "not found" if exhausted
                                        setCurrentProductIndex(prev => prev + 1);
                                      }}
                                      className="h-14 rounded-xl font-bold border-slate-200 text-slate-600 bg-white hover:bg-slate-100 hover:text-black uppercase tracking-wider text-[11px] transition-all"
                                    >
                                      Produit suivant
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        pushUserMessage("Ce produit me convient");
                                        handleProductSelected(currentProduct.id);
                                      }}
                                      className="h-14 rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider text-[11px] shadow-xl active:scale-95 transition-all"
                                    >
                                      Confirmer <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })()}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  )}

                  {step === STEP.RENTAL_PERIOD && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 w-full max-w-md mx-auto">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dates de l'événement</label>
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
                                  ? `${format(new Date(configState.rentalStartDate), 'dd MMM yyyy', { locale: fr })} - ${format(new Date(configState.rentalEndDate), 'dd MMM yyyy', { locale: fr })}`
                                  : "Choisir les dates"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliquer pour ouvrir le calendrier</span>
                            </div>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Heure Début</label>
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
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Heure Fin</label>
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
                        Confirmer la période <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.QUANTITY && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Quantité..."
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
                        <MapPin size={18} className="text-[#0f766e]" /> Ville de livraison
                      </div>
                      <select
                        className="w-full h-12 rounded-xl border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-[#0f766e] bg-white text-slate-800"
                        value={deliveryCityId}
                        onChange={(e) => setDeliveryCityId(e.target.value)}
                      >
                        <option value="" disabled>Sélectionnez une ville...</option>
                        {locations?.villes?.map(city => (
                          <option key={city.id} value={city.id}>{city.name} ({city.postalCode})</option>
                        ))}
                      </select>
                      <Button onClick={handleDeliverySubmit} disabled={!deliveryCityId} className="w-full h-14 font-black rounded-xl bg-black hover:bg-[#B3E140] text-white hover:text-black uppercase tracking-wider text-xs shadow-xl active:scale-95 transition-all">
                        Confirmer la ville <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </motion.div>
                  )}

                  {step === STEP.FORM_COMPANY && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input placeholder="Nom de votre entreprise..." value={formCompany} onChange={e => setFormCompany(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormCompany()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormCompany} disabled={!formCompany.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_EMAIL && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="email" placeholder="votre@email.com..." value={formEmail} onChange={e => setFormEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormEmail()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormEmail} disabled={!formEmail.includes('@')} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_PHONE && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input type="tel" placeholder="06 12 34 56 78..." value={formPhone} onChange={e => setFormPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormPhone()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormPhone} disabled={!formPhone.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.FORM_ADDRESS && !isTyping && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <Input placeholder="Adresse complète..." value={formAddress} onChange={e => setFormAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFormAddress()} className="h-12 rounded-2xl font-bold" />
                      <Button onClick={handleFormAddress} disabled={!formAddress.trim()} className="h-12 w-12 rounded-2xl bg-black hover:bg-[#B3E140] p-0 flex items-center justify-center shrink-0 text-white hover:text-black active:scale-95 transition-all"><ArrowRight size={20} /></Button>
                    </motion.div>
                  )}
                  {step === STEP.GENERATING && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-lg border border-slate-100 gap-4">
                      <Loader2 size={32} className="animate-spin text-[#0f766e]" />
                      <p className="font-bold text-slate-800 animate-pulse">Génération de votre devis PDF en cours...</p>
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
                  className="absolute inset-0 z-[400] flex items-end bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                  onClick={() => setIsCalendarOpen(false)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full rounded-t-[32px] p-6 pb-10 shadow-2xl flex flex-col gap-6"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2" />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
                        Calendrier
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sélectionner les dates de l'événement</p>
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
                        onSelect={(range) => {
                          if (range?.from) setConfigState(prev => ({ ...prev, rentalStartDate: range.from!.toISOString() }));
                          if (range?.to) {
                            setConfigState(prev => ({ ...prev, rentalEndDate: range.to!.toISOString() }));
                            setTimeout(() => setIsCalendarOpen(false), 300);
                          }
                        }}
                        numberOfMonths={1}
                        locale={fr}
                        className="bg-transparent"
                      />
                    </div>

                    <Button
                      onClick={() => setIsCalendarOpen(false)}
                      className="w-full h-14 rounded-2xl bg-black hover:bg-[#B3E140] text-white hover:text-black font-black uppercase tracking-wider shadow-xl active:scale-95 transition-all"
                    >
                      Fermer le calendrier
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
                  className="absolute inset-0 z-[400] flex items-end bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                  onClick={() => setActiveTimePicker(null)}
                >
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white w-full rounded-t-[32px] p-8 pb-10 shadow-2xl flex flex-col gap-8"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-2" />
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest text-center">
                        Heure de {activeTimePicker === 'start' ? 'Début' : 'Fin'}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sélectionner les horaires de l'événement</p>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Heures</span>
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
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Minutes</span>
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
                      Valider l'horaire
                    </Button>
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
    </div>
  );
}
