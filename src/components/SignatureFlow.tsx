/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Check, 
  ArrowRight, 
  Download,
  PartyPopper,
  Info,
  Layers,
  Phone,
  Mail,
  FileText,
  Lock,
  MailOpen,
  Clock,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  CheckCircle,
  KeyRound,
  ShieldAlert,
  ArrowRightLeft,
  Copy,
  PlusCircle,
  ChevronDown,
  Search,
  LayoutGrid,
  Truck,
  Wrench,
  Calculator,
  MapPin,
  RotateCcw,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Sun,
  FileCheck2,
  Plus
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { validatePhone } from '@/lib/phone-validation';
import { Pack, RenterDetails, Step, StepId } from '@/lib/signature-types';
import SignaturePad from './SignaturePad';
import ContractDocument from './ContractDocument';
import { ConfiguredProduct, Product, Settings, PdfSettings, City, ProductSpec, QuoteRequest } from '@/lib/types';
import { getPdfSettings, createQuoteWithContract, verifyQuoteOtp, resendQuoteOtp } from '@/app/actions/quote-actions';
import { getSettings, updateQuotePdfUrl, updateQuoteContractUrl } from '@/app/admin/actions';
import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useI18n } from '@/lib/i18n';
import { jsPDF } from 'jspdf';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { FloatingFooterNav } from '@/components/ui/floating-footer-nav';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { QuotePDF } from '@/app/admin/quote-pdf';
import { BlurredPrice } from '@/components/ui/blurred-price';

// Available professional LED packs for template selection
const SEED_PACKS: Pack[] = [
  {
    id: 'pack-s',
    name: 'Pack S - DJ Booth 2m²',
    surface: '2m²',
    price: 749,
    deposit: 749,
    description: 'Pack DJ Booth ultra-léger et modulaire',
    specs: [
      'Écrans LED Pitch 2.6mm haute fréquence',
      'Boîtier processeur vidéo NovaStar inclus',
      'Structure métallique autoportante pour cabine DJ',
      'Câblage premium et dalles de secours incluses'
    ]
  },
  {
    id: 'pack-compact',
    name: 'Pack Compact - Écran LED 4m²',
    surface: '4m²',
    price: 1199,
    deposit: 1200,
    description: 'Solution élégante pour salons et conférences',
    specs: [
      'Dimensions : 2.5m x 1.5m',
      'Pitch 2.9mm pour vision de près (3m+)',
      'Installation rapide sur pieds de structure autoportants',
      'Parfait pour les présentations d\'entreprise'
    ]
  },
  {
    id: 'pack-standard',
    name: 'Pack Standard - Écran LED 8m²',
    surface: '8m²',
    price: 1999,
    deposit: 2000,
    description: 'Format idéal pour concerts et retransmissions sportives',
    specs: [
      'Dimensions : 4m x 2m',
      'Pitch 3.9mm haute luminosité extérieur/intérieur',
      'Système d\'accroche par structures de levage (Truss)',
      'Certifié résistant à la pluie'
    ]
  },
  {
    id: 'pack-xl',
    name: 'Pack XL - Écran Géant 15m²',
    surface: '15m²',
    price: 3499,
    deposit: 4000,
    description: 'Écran de scène géant pour festivals et stades',
    specs: [
      'Dimensions : 5m x 3m',
      'Pitch 4.8mm Outdoor ultra-lumineux (5500 nits)',
      'Alimentation triphasée requise',
      'Kit d\'intégration scénique complet'
    ]
  }
];

const CITIES = [
  { id: '1', name: 'Paris', postalCode: '75000' },
  { id: '2', name: 'Marseille', postalCode: '13000' },
  { id: '3', name: 'Lyon', postalCode: '69000' },
  { id: '4', name: 'Toulouse', postalCode: '31000' },
  { id: '5', name: 'Nice', postalCode: '06000' },
  { id: '6', name: 'Nantes', postalCode: '44000' },
  { id: '7', name: 'Montpellier', postalCode: '34000' },
  { id: '8', name: 'Strasbourg', postalCode: '67000' },
  { id: '9', name: 'Bordeaux', postalCode: '33000' },
  { id: '10', name: 'Lille', postalCode: '59000' },
  { id: '11', name: 'Rennes', postalCode: '35000' },
  { id: '12', name: 'Reims', postalCode: '51100' },
  { id: '13', name: 'Toulon', postalCode: '83000' },
  { id: '14', name: 'Saint-Étienne', postalCode: '42000' },
  { id: '15', name: 'Le Havre', postalCode: '76600' },
  { id: '16', name: 'Grenoble', postalCode: '38000' },
  { id: '17', name: 'Dijon', postalCode: '21000' },
  { id: '18', name: 'Angers', postalCode: '49000' },
  { id: '19', name: 'Nîmes', postalCode: '30000' },
  { id: '20', name: 'Aix-en-Provence', postalCode: '13100' }
];

const DEFAULT_PDF_SETTINGS: PdfSettings = {
  companyName: 'PIXIATECH',
  email: '',
  phone: '',
  address: '',
  logoUrl: '',
  backgroundUrl: '',
  bgColor: '#ffffff',
  quoteTitle: 'ESTIMATION',
  quoteNumberPrefix: 'EST-',
  themeId: 'indigo',
  termsAndConditions: '',
};

interface SignatureFlowProps {
  configuredProducts: ConfiguredProduct[];
  allProducts: Product[];
  settings?: Settings;
  userId: string;
  onNewQuote: () => void;
  onBackToConfigurator: () => void;
  onStepChange?: (step: StepId) => void;
}

export default function SignatureFlow({
  configuredProducts,
  allProducts,
  settings,
  userId,
  onNewQuote,
  onBackToConfigurator,
  onStepChange
}: SignatureFlowProps) {
  const { t, locale, setLocale } = useI18n();
  const [currentStep, setCurrentStep] = useState<StepId>('informations');
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const mainConfig = configuredProducts[0] || {} as ConfiguredProduct;
  const [width, setWidth] = useState<number>(mainConfig.width || 0);
  const [height, setHeight] = useState<number>(mainConfig.height || 0);
  const [quantity, setQuantity] = useState<number>(mainConfig.quantity || 1);
  const projectMode: 'vente' | 'location' = 
    mainConfig.transactionType === 'sale' ? 'vente' : 'location';

  const [renterDetails, setRenterDetails] = useState<RenterDetails>({
    company: '',
    representative: '',
    address: '',
    postcode: '',
    city: '',
    email: '',
    phone: ''
  });

  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState<boolean>(true);
  const [isInstallationAccordionOpen, setIsInstallationAccordionOpen] = useState<boolean>(true);
  const showRentalPeriodSection = projectMode === 'location';
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const [acceptedCgl, setAcceptedCgl] = useState<boolean>(false);
  const [showConsentAlert, setShowConsentAlert] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const contractContainerRef = useRef<HTMLDivElement>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureValidated, setIsSignatureValidated] = useState<boolean>(false);

  const [sentOtpCode, setSentOtpCode] = useState<string>('');
  const [inputOtpCode, setInputOtpCode] = useState<string>('');
  const [isOtpCompleted, setIsOtpCompleted] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(600);
  const [isSimulatingLinkClick, setIsSimulatingLinkClick] = useState<boolean>(false);
  const [showEmailPulse, setShowEmailPulse] = useState<boolean>(false);
  const [showErrorTips, setShowErrorTips] = useState<boolean>(false);
  const [otpResent, setOtpResent] = useState<boolean>(false);
  const MAX_RESEND_ATTEMPTS = 3;
  const [resendAttemptsLeft, setResendAttemptsLeft] = useState<number>(MAX_RESEND_ATTEMPTS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [rentalStartDate, setRentalStartDate] = useState<string>(() => {
    const rp = (mainConfig as any).rentalPeriod as any;
    return rp?.from ? new Date(rp.from).toISOString().split('T')[0] : '';
  });
  const [rentalEndDate, setRentalEndDate] = useState<string>(() => {
    const rp = (mainConfig as any).rentalPeriod as any;
    return rp?.to ? new Date(rp.to).toISOString().split('T')[0] : '';
  });
  const [rentalStartTime, setRentalStartTime] = useState<string>(() => (mainConfig as any).rentalStartTime || '08:00');
  const [rentalEndTime, setRentalEndTime] = useState<string>(() => (mainConfig as any).rentalEndTime || '18:00');

  const [smtpConfig, setSmtpConfig] = useState<{
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('pixia_smtp_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      host: '',
      port: '587',
      user: '',
      pass: '',
      from: 'PixiaTech Pro <noreply@pixiatech.com>'
    };
  });

  const [isBackendSmtpConfigured, setIsBackendSmtpConfigured] = useState<boolean>(false);
  const [backendSmtpHost, setBackendSmtpHost] = useState<string | null>(null);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'idle' | 'sending' | 'sent' | 'simulated' | 'failed'>('idle');
  const [isSmtpConfigOpen, setIsSmtpConfigOpen] = useState<boolean>(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState<boolean>(false);
  const [openAccordionIdx, setOpenAccordionIdx] = useState<number | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pixia_smtp_config', JSON.stringify(smtpConfig));
    } catch (error) {
      console.error("Failed to save SMTP settings:", error);
    }
  }, [smtpConfig]);

  const prevStepRef = useRef<StepId>(currentStep);
  useEffect(() => {
    if (prevStepRef.current !== currentStep && onStepChange) {
      onStepChange(currentStep);
    }
    prevStepRef.current = currentStep;
  }, [currentStep, onStepChange]);

  // Sync draft state to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        currentStep,
        width,
        height,
        projectMode,
        quantity,
        renterDetails,
        additionalNotes,
        selectedCityId,
        citySearchQuery,
        isInstallationIncluded,
        isInstallationAccordionOpen,
        acceptedCgl,
        signatureDataUrl,
        isSignatureValidated,
        isOtpCompleted
      };
      localStorage.setItem('pixia_estimator_state', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save estimator state:", error);
    }
  }, [
    currentStep,
    width,
    height,
    projectMode,
    quantity,
    renterDetails,
    additionalNotes,
    selectedCityId,
    citySearchQuery,
    isInstallationIncluded,
    isInstallationAccordionOpen,
    acceptedCgl,
    signatureDataUrl,
    isSignatureValidated,
    isOtpCompleted
  ]);

  // Fetch backend SMTP status on mount
  useEffect(() => {
    const checkSmtpStatus = async () => {
      try {
        const res = await fetch('/api/smtp-status');
        const data = await res.json();
        setIsBackendSmtpConfigured(data.configured);
        setBackendSmtpHost(data.host || null);
      } catch (e) {
        console.error("Failed to fetch SMTP status:", e);
      }
    };
    checkSmtpStatus();
  }, []);

  // Support direct validation links clicked from the email inbox
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code') || params.get('otp');
      const idParam = params.get('id');
      
      if (idParam) {
        setPendingId(idParam);
      }
      
      if (codeParam && codeParam.length === 6) {
        setCurrentStep('securite');
        setSentOtpCode(codeParam);
        setInputOtpCode(codeParam);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error("Url params parsing error:", e);
    }
  }, []);

  // Listen for OTP_VERIFIED messages from the email link verification tab
  useEffect(() => {
    try {
      const bc = new BroadcastChannel('otp_verification');
      bc.onmessage = (event) => {
        if (event.data?.type === 'OTP_VERIFIED') {
          setIsOtpCompleted(true);
          setOtpError(null);
          generateAndSaveContractPdf();
          setCurrentStep('confirmation');
        }
      };
      return () => bc.close();
    } catch (e) {
      // BroadcastChannel not supported — fallback to localStorage polling
      console.warn("BroadcastChannel not supported, skipping:", e);
    }
  }, []);

  // Hidden Input ref for smooth 6-box input focus/click handling
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Confetti animation on confirmation step
  useEffect(() => {
    if (currentStep === 'confirmation') {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [currentStep]);

  // Real email sender leveraging express backend
  const sendRealEmail = async (code: string) => {
    setEmailDeliveryStatus('sending');
    try {
      const bodyPayload: any = {
        to: renterDetails.email,
        subject: "Votre code de vérification PixiaTech Pro",
        code,
        companyName: renterDetails.company,
        clientName: renterDetails.representative,
        totalAmount: (projectMode === 'vente' ? totalAmount : activePack.price + activePack.deposit).toLocaleString('fr-FR'),
        details: productCalculations.length > 0 
          ? `${productCalculations[0].width}m x ${productCalculations[0].height}m (${(productCalculations[0].surface * productCalculations[0].quantity).toFixed(2)}m²) - ${activePack.name}`
          : `${activePack.name}`,
        appUrl: `${window.location.origin}/verification-securite`
      };

      // If user provided a client-side config, we pass it along
      if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
        bodyPayload.smtpConfig = smtpConfig;
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });
      const data = await response.json();
      console.log("Real SMTP send email response:", data);

      if (data.success) {
        if (data.simulated) {
          setEmailDeliveryStatus('simulated');
        } else {
          setEmailDeliveryStatus('sent');
        }
      } else {
        setEmailDeliveryStatus('failed');
      }
    } catch (e) {
      console.error("Failed to call SMTP send-email API:", e);
      setEmailDeliveryStatus('failed');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(sentOtpCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = sentOtpCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
        console.error("Fallback copy failed:", e);
      }
      document.body.removeChild(textArea);
    }
  };

  // ============================================
  // CALCULS CONTRACTUELS - COMMENTAIRES DÉVELOPPEUR
  // ============================================
  // Variables principales :
  // - surface = width * height (m²)
  // - dalles = surface * 4 (nombre de dalles LED 50x50cm par m²)
  // - quantity = nombre d'écrans identiques
  // - projectMode = 'vente' ou 'location'
  //
  // Formules :
  // - Prix unitaire vente : 2000€ TTC / m²
  // - Prix unitaire location : 12€ TTC / m² / mois
  // - subtotalProducts = surface * pricePerSqm
  // - deliveryFee = 250€ par écran
  // - techniciansCount = max(1, ceil(surface / 40)) = 1 technicien par 40m²
  // - installationFee = techniciansCount * 50€ (seulement si isInstallationIncluded = true)
  // - totalAmount = (subtotalProducts * quantity) + (deliveryFee * quantity) + (installationFee * quantity)
  //
  // Caution/Dépôt location = 50% du sous-total matériel
  // ============================================

  // Live Calculations based on all configured products
  const productCalculations = configuredProducts.map(p => {
    const w = p.width || 0;
    const h = p.height || 0;
    const q = p.quantity || 1;
    const s = w * h;
    const d = Math.round(s * 4);
    const prod = allProducts.find(ap => ap.id === p.productId);
    let unitPrice = 0;
    if (prod?.hasDimensions && prod?.tileWidth && prod?.tileHeight && prod?.pricePerTile && prod.pricePerTile > 0) {
      const tilesPerWidth = Math.ceil((w * 100) / prod.tileWidth);
      const tilesPerHeight = Math.ceil((h * 100) / prod.tileHeight);
      const totalTiles = tilesPerWidth * tilesPerHeight;
      unitPrice = totalTiles * prod.pricePerTile;
    } else {
      if (p.transactionType === 'sale') {
        unitPrice = s * (prod?.salePricePerSqM && prod.salePricePerSqM > 0 ? prod.salePricePerSqM : 2000);
      } else if (p.transactionType === 'rental') {
        const ratePerUnit = p.rentalUnit === 'hour'
          ? (prod?.rentalPricePerHour && prod.rentalPricePerHour > 0 ? prod.rentalPricePerHour : 1.5)
          : (prod?.rentalPricePerDay && prod.rentalPricePerDay > 0 ? prod.rentalPricePerDay : 12);
        unitPrice = s * ratePerUnit;
      }
    }
    if (p.transactionType === 'rental') {
      const duration = p.rentalDuration > 0 ? p.rentalDuration : 1;
      unitPrice *= duration;
    }
    const sp = unitPrice;
    return {
      width: w,
      height: h,
      quantity: q,
      surface: s,
      dalles: d,
      subtotal: sp,
      productId: p.productId,
      product: prod,
      photo: prod?.imageUrl || prod?.image || null,
      screenLayout: p.screenLayout,
      isCurved: p.isCurved,
      is360: p.is360,
      diameter: p.diameter,
      cabinetAngle: p.cabinetAngle,
      curveLeft: p.curveLeft,
      curveRight: p.curveRight,
    };
  });

  const totalSurface = productCalculations.reduce((sum, pc) => sum + pc.surface * pc.quantity, 0);
  const totalDalles = productCalculations.reduce((sum, pc) => sum + pc.dalles * pc.quantity, 0);
  const totalSubtotalProducts = productCalculations.reduce((sum, pc) => sum + pc.subtotal * pc.quantity, 0);
  const totalDeliveryFee = configuredProducts.reduce((sum, p) => sum + 250 * (p.quantity || 1), 0);
  
  const techniciansCount = Math.max(1, Math.ceil(totalSurface / 40));
  const installationFee = isInstallationIncluded ? (techniciansCount * 50) : 0;
  const totalAmount = totalSubtotalProducts + totalDeliveryFee + installationFee;

  const mainProduct = allProducts.find(p => p.id === productCalculations[0]?.productId);
  const productPhoto = mainProduct?.imageUrl || mainProduct?.image || null;

  const productCount = configuredProducts.length;
  const mainPitch = mainProduct?.pitch || 'P2.5';
  const mainPitchValue = parseFloat(mainPitch.replace('P', '')) || 2.5;
  const mainWidth = productCalculations[0]?.width || 0;
  const mainHeight = productCalculations[0]?.height || 0;
  const mainResX = Math.round((mainWidth * 1000) / mainPitchValue);
  const mainResY = Math.round((mainHeight * 1000) / mainPitchValue);
  const mainDistance = mainProduct?.distance || '—';
  const mainEnvironment = mainProduct?.environment || 'interieur';
  const powerMax = totalSurface * (mainEnvironment === 'exterieur' ? 0.8 : 0.6);
  const powerAvg = powerMax * 0.35;
  const amps = Math.ceil((powerMax * 1000) / 230 / 3);

  // Flow settings & tax configuration — refresh on mount to bypass router cache
  const [serverFlowSettings, setServerFlowSettings] = useState<NonNullable<Settings['estimationFlow']> | null>(null);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings | null>(null);
  const [globalSettings, setGlobalSettings] = useState<Settings | null>(null);
  const isEmailVerificationEnabled = settings?.isEmailVerificationEnabled ?? true;
  const validityMinutes = globalSettings?.emailVerification?.validityMinutes ?? settings?.emailVerification?.validityMinutes ?? 10;
  const isPriceHidden = !!(globalSettings?.isPriceHidden ?? settings?.isPriceHidden) && !isOtpCompleted && isEmailVerificationEnabled;
  useEffect(() => {
    getSettings().then(s => {
      if (s?.estimationFlow) setServerFlowSettings(s.estimationFlow);
      if (s) setGlobalSettings(s);
    }).catch(() => {});
    getPdfSettings().then(setPdfSettings).catch(() => {});
  }, []);
  const flowSettings: NonNullable<Settings['estimationFlow']> = serverFlowSettings || settings?.estimationFlow || {
    enableRentalPeriod: true,
    enableDigitalSignature: true,
    enableContractEditing: false,
    saleContractTemplate: undefined,
    rentalContractTemplate: undefined,
    taxEnabled: false,
    taxRate: 19,
    taxMode: 'ht' as const,
    sale: {
      maxProductsPerQuote: 3,
      flatScreen: { maxWidth: 20, maxHeight: 10 },
      curvedScreen: { maxWidth: 20, maxHeight: 10, curveMin: -30, curveMax: 30 },
      screen360: { maxDiameter: 10, maxHeight: 8 },
    },
    rental: {
      flatScreen: { maxWidth: 6, maxHeight: 5 },
      curvedScreen: { maxWidth: 6, maxHeight: 5, curveMin: -30, curveMax: 30 },
      screen360: { maxDiameter: 6, maxHeight: 5 },
    },
  };
  const isRentalPeriodEnabled = flowSettings.enableRentalPeriod;
  const isDigitalSignatureEnabled = flowSettings.enableDigitalSignature;
  const taxRate = flowSettings.taxEnabled ? flowSettings.taxRate : 0;
  const displayMode = flowSettings.taxMode;
  const ttcMultiplier = taxRate > 0 ? (1 + taxRate / 100) : 1;
  const taxLabel = displayMode === 'ttc' ? 'TTC' : 'HT';
  const fmtPrice = (amount: number) => {
    const v = displayMode === 'ttc' ? amount * ttcMultiplier : amount;
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const totalQuantity = configuredProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);

  const activePack: Pack = {
    id: 'custom-led-78',
    name: projectMode === 'vente' ? 'Caissons LED Série Extra Plat' : 'Location Écran LED Sur-Mesure',
    surface: `${totalSurface.toFixed(2)} m²`,
    price: Math.round(totalSubtotalProducts),
    deposit: Math.round(totalSubtotalProducts * 0.5),
    description: `Configuration de ${productCount} produit(s) LED (${totalQuantity} écran(s) au total)`,
    specs: [
      `Nombre de produits configurés : ${productCount}`,
      `Quantité totale d'écrans : ${totalQuantity}`,
      `Surface totale d'affichage : ${totalSurface.toFixed(2)} m²`,
      `Quantité de matériel : ${totalDalles} dalles de 50x50cm`
    ]
  };

  // OTP Countdown timer effect
  useEffect(() => {
    let timer: any;
    if (currentStep === 'securite' && !isOtpCompleted) {
      timer = setInterval(() => {
        setOtpTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, isOtpCompleted]);

  // Flash email panel pulse notification when security validation page mounts
  useEffect(() => {
    if (currentStep === 'securite') {
      setShowEmailPulse(true);
      const timer = setTimeout(() => {
        setShowEmailPulse(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);



  // Cohesive stages in the upper header representation
  const steps: Step[] = [
    { id: 'informations', label: t('signature.step1'), isCompleted: currentStep !== 'informations', isActive: currentStep === 'informations' },
    { id: 'contrat', label: t('signature.step2'), isCompleted: isEmailVerificationEnabled ? (currentStep === 'securite' || currentStep === 'confirmation') : currentStep === 'confirmation', isActive: currentStep === 'contrat' },
    ...(isEmailVerificationEnabled ? [{ id: 'securite' as const, label: t('signature.step3'), isCompleted: currentStep === 'confirmation', isActive: currentStep === 'securite' }] : []),
    { id: 'confirmation', label: t('signature.step4'), isCompleted: false, isActive: currentStep === 'confirmation' }
  ];

  // Time format helper (MM:SS)
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Main navigational buttons handlers
  const handlePrevStep = () => {
    if (currentStep === 'contrat') {
      setCurrentStep('informations');
    } else if (currentStep === 'securite') {
      setCurrentStep('contrat');
    }
  };

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    setEmailError(null);
    setPhoneError(null);
    
    let hasError = false;

    if (!renterDetails.company.trim()) hasError = true;
    if (!renterDetails.representative.trim()) hasError = true;
    
    if (!validateEmail(renterDetails.email)) {
      setEmailError(t('signature.emailRequired'));
      hasError = true;
    }
    
    const phoneResult = validatePhone(renterDetails.phone);
    if (!phoneResult.isValid) {
      setPhoneError(phoneResult.error || t('signature.phoneRequired'));
      hasError = true;
    }
    
    if (!renterDetails.address.trim()) hasError = true;
    if (!citySearchQuery.trim()) hasError = true;

    if (hasError) return;
    setCurrentStep('contrat');
  };

  // Verify code typed manually
  const handleManualCodeVerify = async (codeToVerify: string) => {
    if (!quoteId) {
      setOtpError('Aucune estimation en cours de validation');
      return;
    }
    try {
      const result = await verifyQuoteOtp(quoteId, codeToVerify);
      if (result.success) {
        setIsOtpCompleted(true);
        setOtpError(null);
        generateAndSaveContractPdf();
        setTimeout(() => {
          setCurrentStep('confirmation');
        }, 800);
      } else {
        setOtpError(result.error || t('signature.otpManualEntry'));
        setInputOtpCode('');
      }
    } catch (e: any) {
      console.error("verifyQuoteOtp error:", e);
      setOtpError(`Erreur de vérification: ${e?.message || 'erreur inconnue'}`);
    }
  };

  // Simulate premium validation link click (Injects character-by-character animation)
  const handleSimulateEmailConnect = () => {
    if (isSimulatingLinkClick || isOtpCompleted) return;
    setIsSimulatingLinkClick(true);
    setOtpError(null);
    setInputOtpCode('');

    let currentInput = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < sentOtpCode.length) {
        currentInput += sentOtpCode[index];
        setInputOtpCode(currentInput);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsOtpCompleted(true);
          setIsSimulatingLinkClick(false);
          setCurrentStep('confirmation');
        }, 800);
      }
    }, 150);
  };

  const handleResendCode = async () => {
    if (!quoteId) return;
    if (resendAttemptsLeft <= 1) {
      setTimeout(() => location.reload(), 2000);
      return;
    }
    setResendAttemptsLeft(prev => prev - 1);
    try {
      await resendQuoteOtp(quoteId);
      setOtpTimeLeft(600);
      setOtpError(null);
      setInputOtpCode('');
      setOtpResent(true);
      setTimeout(() => {
        setOtpResent(false);
      }, 4000);
    } catch (e) {
      console.error("resendQuoteOtp error:", e);
      setOtpError('Erreur lors du renvoi du code');
    }
  };

  // PDF download using admin PDF template
  const renderPagesToPdf = async (container: HTMLElement, pdf: jsPDF) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pages = container.querySelectorAll('.page-break-after');
    if (pages.length === 0) {
      console.error("📄 No .page-break-after elements found, container HTML:", container.innerHTML.substring(0, 500));
    }
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
    return pages.length;
  };

  const uploadPdfToStorage = async (pdf: jsPDF, id: string) => {
    try {
      const blob = pdf.output('blob');
      const storageRef = ref(storage, `quotes/pdfs/${id}.pdf`);
      await uploadBytes(storageRef, blob);
      const pdfUrl = await getDownloadURL(storageRef);
      await updateQuotePdfUrl(id, pdfUrl);
      return pdfUrl;
    } catch (e) {
      console.error("Failed to upload PDF to storage:", e);
      return null;
    }
  };

  const uploadContractPdfToStorage = async (pdf: jsPDF, id: string) => {
    try {
      const blob = pdf.output('blob');
      const storageRef = ref(storage, `quotes/contracts/${id}.pdf`);
      await uploadBytes(storageRef, blob);
      const contractUrl = await getDownloadURL(storageRef);
      await updateQuoteContractUrl(id, contractUrl);
      return contractUrl;
    } catch (e) {
      console.error("Failed to upload contract PDF to storage:", e);
      return null;
    }
  };

  const generateAndSaveContractPdf = async (customId?: string) => {
    const targetId = customId || quoteId;
    if (!targetId) return;
    const contractContainer = contractContainerRef.current;
    if (!contractContainer) return;
    try {
      // Give extra time for full rendering of off-screen element
      await new Promise(resolve => setTimeout(resolve, 1500));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Capture the FULL container — scrollWidth/scrollHeight ensures off-screen content isn't clipped
      const canvas = await html2canvas(contractContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: contractContainer.scrollWidth,
        height: contractContainer.scrollHeight,
        windowWidth: contractContainer.scrollWidth,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      // Total image height in PDF mm units
      const totalImgHeightMm = (canvas.height * pdfWidth) / canvas.width;

      let heightRendered = 0; // how many mm we've already placed on pages
      let isFirstPage = true;

      while (heightRendered < totalImgHeightMm) {
        if (!isFirstPage) pdf.addPage();
        // Shift image up by how many mm we've already rendered
        pdf.addImage(imgData, 'JPEG', 0, -heightRendered, pdfWidth, totalImgHeightMm, undefined, 'FAST');
        heightRendered += pageHeight;
        isFirstPage = false;
      }

      await uploadContractPdfToStorage(pdf, targetId);
    } catch (e) {
      console.error("Failed to generate contract PDF:", e);
    }
  };

  const handleContractDownload = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfContainer = pdfContainerRef.current;
      if (!pdfContainer) {
        const fallback = document.getElementById('signature-pdf-container');
        if (!fallback) {
          console.error("📄 pdfContainer not found in DOM");
          return;
        }
        const pageCount = await renderPagesToPdf(fallback, pdf);
        if (pageCount === 0) return;
        pdf.save(`Pixiatech_Devis_${renterDetails.company.replace(/\s+/g, '_')}.pdf`);
        if (quoteId) uploadPdfToStorage(pdf, quoteId);
        return;
      }
      const pageCount = await renderPagesToPdf(pdfContainer, pdf);
      if (pageCount === 0) return;
      pdf.save(`Pixiatech_Devis_${renterDetails.company.replace(/\s+/g, '_')}.pdf`);
      if (quoteId) {
        uploadPdfToStorage(pdf, quoteId).then(url => {
          if (url) setPdfUrl(url);
        });
      }
    } catch (error) {
      console.error("📄 PDF generation error:", error);
    }
  };

  const handleViewPdf = async () => {
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) return;
    pdfWindow.document.write('<div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#666;">Génération du PDF...</div>');
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfContainer = pdfContainerRef.current;
      if (!pdfContainer) { pdfWindow.close(); return; }
      const pageCount = await renderPagesToPdf(pdfContainer, pdf);
      if (pageCount === 0) { pdfWindow.close(); return; }
      const url = await uploadPdfToStorage(pdf, quoteId || 'temp');
      if (url) {
        setPdfUrl(url);
        pdfWindow.location.href = url;
      } else {
        pdfWindow.close();
      }
    } catch (error) {
      console.error("PDF view error:", error);
      pdfWindow.close();
    }
  };

  // Mapped data for the admin PDF template
  const productItems = configuredProducts.map((p, idx) => {
    const calc = productCalculations[idx];
    const prod = allProducts.find(ap => ap.id === p.productId);
    return {
      ...p,
      productName: prod?.name || `Product ${idx + 1}`,
      lineTotal: (calc?.subtotal || 0) * (calc?.quantity || 1),
      unitPrice: calc?.subtotal || 0,
      tileWidth: p.tileWidth || prod?.tileWidth || 0,
      tileHeight: p.tileHeight || prod?.tileHeight || 0,
      pricePerTile: p.pricePerTile || prod?.pricePerTile || 0,
      nombreEcrans: calc?.dalles || p.quantity || 1,
      dimensionsEnabled: !!(p.width && p.height),
    };
  });
  const foundCity = CITIES.find(c => c.id === selectedCityId);
  const selectedCityForPdf: City | null = foundCity
    ? { id: foundCity.id, name: foundCity.name, postalCode: foundCity.postalCode }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-zinc-800 font-sans antialiased">
      
      {/* Header removed - workflow has its own step system */}

      {/* Stepper Progress Indicator */}
      {currentStep !== 'confirmation' && (
        <div className="w-full bg-white border-b border-[#e2e8f0] py-3.5 px-4 overflow-x-auto select-none scrollbar-none relative">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3 sm:gap-6 px-2 min-w-max">
            {steps.map((st, index) => {
              const active = st.isActive;
              const completed = st.isCompleted;
              return (
                <React.Fragment key={st.id}>
                  {index > 0 && (
                    <div 
                      className={`h-[2px] w-6 sm:w-12 transition-all duration-300 self-center ${
                        completed || active ? 'bg-blue-600' : 'bg-zinc-200'
                      }`}
                    />
                  )}
                  <button
                    id={`stepper-btn-${st.id}`}
                    disabled={!completed && st.id !== currentStep}
                    onClick={() => {
                      if (st.id === 'informations' || st.id === 'contrat' || st.id === 'securite') {
                        setCurrentStep(st.id);
                      }
                    }}
                    className={`flex items-center gap-2 group text-left border border-transparent rounded-full px-2.5 py-1.5 transition-all ${
                      active 
                        ? 'bg-zinc-950 text-white shadow-sm font-bold' 
                        : completed
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-850 cursor-pointer hover:bg-zinc-100'
                        : 'bg-transparent text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    <div 
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        active 
                          ? 'bg-blue-600 text-white' 
                          : completed
                          ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-400 border border-zinc-200/80'
                      }`}
                    >
                      {st.id === 'informations' && <LayoutGrid size={13} className="stroke-[2.5]" />}
                      {st.id === 'contrat' && <Truck size={13} className="stroke-[2.5]" />}
                      {st.id === 'securite' && <Wrench size={13} className="stroke-[2.5]" />}
                      {st.id === 'confirmation' && <Calculator size={13} className="stroke-[2.5]" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${active ? 'text-white' : 'text-zinc-650'}`}>
                      {st.label}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

        </div>
      )}

      {/* Main app viewport wrapping specific steps */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">

        {/* STEP 1: RÉSUMÉ DE L'ESTIMATION (Forms and customizable details card) */}
        {currentStep === 'informations' && (
          <div className="space-y-8 animate-fade-in" id="estimation-recap-main-card">
            
            {/* Centered header removed as requested */}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Hand: contact form parameters */}
              <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-[24px] p-6 sm:p-10 shadow-sm space-y-8">
                
                {/* Espace hautement sécurisé badge */}
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-600" />
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">
                    {t('signature.secureBadge')}
                  </span>
                </div>

                {/* Left Pane Header */}
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight text-zinc-905 uppercase">
                    {t('signature.clientInfo')}
                  </h2>
                  <p className="text-xs text-zinc-500 font-semibold">
                    {t('signature.allFieldsRequired')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  
                  {/* Entity Company name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-name" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${attemptedSubmit && !renterDetails.company ? 'text-red-500' : 'text-zinc-700'}`}>
                      {t('signature.companyName')} *
                    </label>
                    <input
                      id="comp-name"
                      type="text"
                      placeholder={t('signature.companyPlaceholder')}
                      value={renterDetails.company}
                      onChange={(e) => setRenterDetails({ ...renterDetails, company: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        attemptedSubmit && !renterDetails.company 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {attemptedSubmit && !renterDetails.company && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {t('signature.fieldRequired')}</span>
                      </p>
                    )}
                  </div>

                  {/* Nom du contact */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-representative" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${attemptedSubmit && !renterDetails.representative ? 'text-red-500' : 'text-zinc-700'}`}>
                      {t('signature.contactName')} *
                    </label>
                    <input
                      id="comp-representative"
                      type="text"
                      placeholder={t('signature.contactPlaceholder')}
                      value={renterDetails.representative}
                      onChange={(e) => setRenterDetails({ ...renterDetails, representative: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        attemptedSubmit && !renterDetails.representative 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {attemptedSubmit && !renterDetails.representative && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {t('signature.fieldRequired')}</span>
                      </p>
                    )}
                  </div>

                  {/* Corporate professional email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-email" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${emailError || (attemptedSubmit && !renterDetails.email) ? 'text-red-500' : 'text-zinc-700'}`}>
                      {t('signature.professionalEmail')} *
                    </label>
                    <input
                      id="comp-email"
                      type="email"
                      placeholder={t('signature.emailPlaceholder')}
                      value={renterDetails.email}
                      onChange={(e) => setRenterDetails({ ...renterDetails, email: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        emailError || (attemptedSubmit && !renterDetails.email)
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {(emailError || (attemptedSubmit && !renterDetails.email)) && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {emailError || t('signature.fieldRequired')}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-phone" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${phoneError || (attemptedSubmit && !renterDetails.phone) ? 'text-red-500' : 'text-zinc-700'}`}>
                      {t('signature.phone')} *
                    </label>
                    <input
                      id="comp-phone"
                      type="tel"
                      placeholder={t('signature.phonePlaceholder')}
                      value={renterDetails.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '').slice(0, 14);
                        setRenterDetails({ ...renterDetails, phone: val });
                      }}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        phoneError || (attemptedSubmit && !renterDetails.phone)
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {(phoneError || (attemptedSubmit && !renterDetails.phone)) && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {phoneError || t('signature.fieldRequired')}</span>
                      </p>
                    )}
                  </div>

                  {/* Ville de livraison (Combobox custom premium with Orange IMPORTANT tag) */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <div className="flex items-center gap-2">
                      <label className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${attemptedSubmit && !citySearchQuery ? 'text-red-500' : 'text-zinc-700'}`}>
                        {t('signature.deliveryCity')} *
                      </label>
                      <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                        {t('signature.important')}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Search size={14} className="stroke-[2.5]" />
                      </div>
                      <input
                        type="text"
                        placeholder={t('signature.cityPlaceholder')}
                        value={citySearchQuery}
                        onChange={(e) => {
                          setCitySearchQuery(e.target.value);
                          setIsCityDropdownOpen(true);
                        }}
                        onFocus={() => setIsCityDropdownOpen(true)}
                        className={`w-full rounded-[14px] pl-10 pr-10 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                          attemptedSubmit && !citySearchQuery 
                            ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                            : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="absolute inset-y-0 right-0 pr-35 flex items-center text-zinc-400 hover:text-zinc-600"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {attemptedSubmit && !citySearchQuery && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {t('signature.fieldRequired')}</span>
                      </p>
                    )}

                    {/* Dropdown Options */}
                    {isCityDropdownOpen && (
                      <div className="absolute z-55 left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-50 text-xs font-semibold">
                        {CITIES.filter(c =>
                          c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                          c.postalCode.includes(citySearchQuery)
                        ).length > 0 ? (
                          CITIES.filter(c =>
                            c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
                            c.postalCode.includes(citySearchQuery)
                          ).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCityId(c.id);
                                setCitySearchQuery(`${c.name} (${c.postalCode})`);
                                setRenterDetails(prev => ({
                                  ...prev,
                                  city: c.name,
                                  postcode: c.postalCode
                                }));
                                setIsCityDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50/50 flex items-center justify-between text-zinc-805 transition-colors"
                            >
                              <span>{c.name} ({c.postalCode})</span>
                              {selectedCityId === c.id && <Check size={14} className="text-blue-600 font-bold" />}
                            </button>
                          ))
                        ) : (
                          <div className="text-center p-4 text-zinc-500">
                            <p className="font-bold text-zinc-700">{t('signature.zoneNotConfigured')}</p>
                            <p className="text-[10px] text-zinc-400 mt-1">{t('signature.zoneNotConfiguredDesc')}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCitySearchQuery('Paris (75000)');
                                setSelectedCityId('1');
                                setRenterDetails(prev => ({
                                  ...prev,
                                  city: 'Paris',
                                  postcode: '75000'
                                }));
                                setIsCityDropdownOpen(false);
                              }}
                              className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold transition-all"
                            >
                              {t('signature.resetToParis')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-address" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${attemptedSubmit && !renterDetails.address ? 'text-red-500' : 'text-zinc-700'}`}>
                      {t('signature.eventAddress')} *
                    </label>
                    <input
                      id="comp-address"
                      type="text"
                      placeholder={t('signature.addressPlaceholder')}
                      value={renterDetails.address}
                      onChange={(e) => setRenterDetails({ ...renterDetails, address: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        attemptedSubmit && !renterDetails.address 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {attemptedSubmit && !renterDetails.address && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ {t('signature.fieldRequired')}</span>
                      </p>
                    )}
                  </div>

                  {/* Période & Horaires de location (DYNAMICALLY SHOWN ONLY IN LOCATION MODE) */}
                  {showRentalPeriodSection && isRentalPeriodEnabled && (
                    <div className="md:col-span-2 bg-[#f0f9ff]/70 border border-blue-150/40 rounded-2xl p-5 space-y-4 pt-4 mt-2">
                      <div className="flex items-center gap-2 border-b border-blue-100/50 pb-2 select-none">
                        <span className="w-1.5 h-3.5 bg-blue-600 rounded-full block"></span>
                        <h4 className="font-bold text-[10px] sm:text-xs text-blue-900 uppercase tracking-wider">
                          {t('signature.rentalPeriod')}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dates */}
                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            {t('signature.rentalStartDate')} *
                          </label>
                          <input
                            type="date"
                            value={rentalStartDate}
                            onChange={(e) => setRentalStartDate(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            {t('signature.rentalEndDate')} *
                          </label>
                          <input
                            type="date"
                            value={rentalEndDate}
                            onChange={(e) => setRentalEndDate(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm"
                          />
                        </div>

                        {/* Times */}
                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            {t('signature.startTime')} *
                          </label>
                          <input
                            type="text"
                            placeholder={t('signature.timeExample')}
                            value={rentalStartTime}
                            onChange={(e) => setRentalStartTime(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            {t('signature.endTime')} *
                          </label>
                          <input
                            type="text"
                            placeholder={t('signature.timeExample')}
                            value={rentalEndTime}
                            onChange={(e) => setRentalEndTime(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Large textbox notes */}
                  <div className="space-y-1.5 md:col-span-2 pt-1">
                    <div className="flex items-center gap-2">
                      <label htmlFor="comp-notes" className="font-black uppercase tracking-wide text-[10px] sm:text-[11.5px] text-zinc-550">
                        {t('signature.noteForSeller')}
                      </label>
                      <span className="text-[9px] bg-zinc-100 text-zinc-500 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {t('signature.optional')}
                      </span>
                    </div>
                    <textarea
                      id="comp-notes"
                      rows={3}
                      placeholder={t('signature.notesPlaceholder')}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-[#edf2f7]/40 border-2 border-transparent hover:border-zinc-200 rounded-[14px] px-4 py-3.5 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-xs shadow-sm resize-none h-24"
                    />
                    <p className="text-zinc-400 font-semibold text-[10px] sm:text-[11px] mt-1 leading-normal select-none">
                      {t('signature.notesExample')}
                    </p>
                  </div>

                </div>

                {/* Left pane navigation buttons */}
                <div className="border-t border-zinc-150/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 w-full select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setWidth(12);
                      setHeight(6.5);
                      setQuantity(1);
                      setRenterDetails({
                        company: 'Pixia Tech Europe',
                        representative: 'Moulebhar',
                        address: '46 cite 68 logts ENRIO',
                        postcode: '75000',
                        city: 'Paris',
                        email: 'ayanhil@gmail.com',
                        phone: '0777657080'
                      });
                      setCitySearchQuery('Paris (75000)');
                      setSelectedCityId('1');
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-950 underline underline-offset-4 decoration-zinc-250 hover:decoration-zinc-950 transition-all cursor-pointer flex items-center gap-1.5 self-start py-2"
                  >
                    <Sparkles size={13} className="text-blue-650" />
                    <span>{t('signature.demoData')}</span>
                  </button>

                </div>

              </div>

              {/* Right Col: contains Details Techniques and dynamic Installation panels */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
                
                {/* Details Techniques panel */}
                <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-5">
                  
                  {/* Visual header with VENTE state tag */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4 select-none">
                    <h3 className="text-[12px] sm:text-xs font-black font-heading text-zinc-950 uppercase tracking-wider">
                      {t('signature.techDetails')}
                    </h3>
                    <span className="bg-blue-50/60 text-blue-600 border border-blue-250/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest font-mono">
                      {projectMode === 'vente' ? t('signature.sale') : t('signature.rental')}
                    </span>
                  </div>

                  {/* Product list as accordion */}
                  <Accordion type="multiple" className="space-y-2">
                    {productCalculations.map((pc, idx) => {
                      const prod = pc.product;
                      const totalProductPrice = pc.subtotal * pc.quantity;
                      return (
                        <AccordionItem
                          key={idx}
                          value={`product-${idx}`}
                          className="border border-zinc-100 rounded-xl overflow-hidden data-[state=open]:border-zinc-200"
                        >
                          <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-zinc-50/50 data-[state=open]:bg-zinc-50/50">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {pc.photo && (
                                <img src={pc.photo} alt="" className="w-8 h-8 rounded-lg object-cover border border-zinc-200 shrink-0" />
                              )}
                              <span className="text-[11px] font-black text-zinc-800 uppercase truncate">{prod?.name || `Produit ${idx + 1}`}</span>
                              <span className="ml-auto text-[11px] font-black font-mono text-zinc-600 shrink-0">
                                <BlurredPrice price={`${fmtPrice(totalProductPrice)} €`} isPriceHidden={isPriceHidden} />
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold text-zinc-500 pt-1 border-t border-zinc-100">
                              {pc.is360 ? (
                                <>
                                  <span>Diamètre</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.diameter}m</span>
                                  <span>Hauteur</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.height}m</span>
                                  <span>Vue circulaire 360</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.cabinetAngle && pc.cabinetAngle > 0 ? 'Intérieur' : 'Extérieur'}</span>
                                </>
                              ) : pc.isCurved ? (
                                <>
                                  <span>{t('signature.dimensions')}</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.width}m x {pc.height}m</span>
                                  <span>Inclinaison G/D</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.curveLeft || 0}° / {pc.curveRight || 0}°</span>
                                </>
                              ) : (
                                <>
                                  <span>{t('signature.dimensions')}</span>
                                  <span className="text-zinc-800 font-black font-mono text-right">{pc.width}m x {pc.height}m</span>
                                </>
                              )}
                              <span>{t('signature.surface')}</span>
                              <span className="text-zinc-800 font-black font-mono text-right">{(pc.surface * pc.quantity).toFixed(2)} m²</span>
                              <span>{t('signature.quantity')}</span>
                              <span className="text-zinc-800 font-black font-mono text-right">x{pc.quantity}</span>
                              <span>{t('signature.subtotal')}</span>
                              <span className="text-zinc-800 font-black font-mono text-right">
                                <BlurredPrice price={`${fmtPrice(totalProductPrice)} €`} isPriceHidden={isPriceHidden} />
                              </span>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                    </Accordion>

                  {/* Période de location (Location only) */}
                  {projectMode === 'location' && rentalStartDate && rentalEndDate && (
                    <div className="bg-amber-50/40 border border-amber-200/50 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700">
                        <Clock size={14} className="stroke-[2.5]" />
                        <span className="text-[11px] font-black uppercase tracking-wider">{t('signature.rentalPeriodLabel')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-amber-900">
                        <span className="bg-white/70 px-3 py-1.5 rounded-lg border border-amber-200/50">
                          {t('signature.from')} {formatFrenchDate(rentalStartDate)} {rentalStartTime}
                        </span>
                        <span className="bg-white/70 px-3 py-1.5 rounded-lg border border-amber-200/50">
                          {t('signature.to')} {formatFrenchDate(rentalEndDate)} {rentalEndTime}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* separator divider */}
                  <div className="border-t border-zinc-100 my-4" />

                  {/* Subtotals breakdowns */}
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>{t('signature.productsSubtotal')}</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        <BlurredPrice price={`${fmtPrice(totalSubtotalProducts)} €`} isPriceHidden={isPriceHidden} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>{t('signature.delivery')}</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        <BlurredPrice price={`${fmtPrice(totalDeliveryFee)} €`} isPriceHidden={isPriceHidden} />
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>{t('signature.installation')}</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        <BlurredPrice price={isInstallationIncluded ? `${fmtPrice(installationFee)} €` : '0 €'} isPriceHidden={isPriceHidden} />
                      </span>
                    </div>
                  </div>

                  {/* Total estimé box with animated gradient background */}
                  <div className="relative mt-4 gradient-bg rounded-2xl overflow-hidden shadow-md">
                    <svg className="absolute w-0 h-0" aria-hidden="true">
                      <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10" result="goo" />
                        <feBlend in="SourceGraphic" in2="goo" />
                      </filter>
                    </svg>
                    <div className="gradients-container">
                      <div className="g1" />
                      <div className="g2" />
                      <div className="g3" />
                      <div className="g4" />
                      <div className="g5" />
                    </div>
                    <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between select-none">
                      <span className="text-xs font-black text-white/80 tracking-wider font-heading uppercase drop-shadow-sm">
                        {t('signature.totalEstimate')} ({taxLabel})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-mono font-black text-white drop-shadow-sm">
                          <BlurredPrice 
                            price={`${fmtPrice(totalAmount)} €`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-white text-sm"
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Installation Preference Card (Image 1 and 2 centerpiece) */}
                <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-105 flex items-center justify-center text-blue-600 shrink-0">
                      <Layers size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wide">{t('signature.installationTitle')}</h3>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">{t('signature.recommended')}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">{t('signature.installationQuestion')}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-semibold">
                    {/* Option 1: Yes, include installation */}
                    <button
                      type="button"
                      onClick={() => setIsInstallationIncluded(true)}
                      className={`w-full text-left block border rounded-2xl p-4 cursor-pointer transition-all ${
                        isInstallationIncluded 
                          ? 'border-blue-600 bg-blue-50/10 shadow-xs' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-950 text-sm block">{t('signature.includeInstallation')}</span>
                          <span className="text-zinc-500 font-medium text-xs block">{t('signature.includeInstallationDesc')}</span>
                        </div>
                        
                        <div className="pt-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isInstallationIncluded ? 'border-blue-600' : 'border-zinc-300'
                          }`}>
                            {isInstallationIncluded && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                          </div>
                        </div>
                      </div>

                      {isInstallationIncluded && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1 text-zinc-800 font-medium animate-fade-in text-xs leading-relaxed">
                          <p>{t('signature.surfaceTech', { area: totalSurface.toFixed(2), count: techniciansCount })}</p>
                          {isPriceHidden ? (
                            <p className="text-sm font-black text-zinc-955 mt-2 flex items-center gap-1">
                              <span>{t('signature.costTech', { cost: '' }).replace(': ', '').replace(':', '')}: </span>
                              <BlurredPrice price={`${fmtPrice(installationFee)} €`} isPriceHidden={true} />
                            </p>
                          ) : (
                            <p className="text-sm font-black text-zinc-955 mt-2">{t('signature.costTech', { cost: `${fmtPrice(installationFee)} €` })}</p>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Option 2: No, I do it myself */}
                    <button 
                      type="button"
                      onClick={() => setIsInstallationIncluded(false)}
                      className={`w-full text-left block border rounded-2xl p-4 cursor-pointer transition-all ${
                        !isInstallationIncluded 
                          ? 'border-blue-600 bg-blue-50/10 shadow-xs' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-955 text-sm block">{t('signature.excludeInstallation')}</span>
                          <span className="text-zinc-500 font-medium text-xs block">{t('signature.excludeInstallationDesc')}</span>
                        </div>
                        
                        <div className="pt-1">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            !isInstallationIncluded ? 'border-blue-600' : 'border-zinc-300'
                          }`}>
                            {!isInstallationIncluded && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Warning in Red if Option 2 is active */}
                    {!isInstallationIncluded && (
                      <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-in shadow-xs select-none">
                        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-red-700 font-black text-xs uppercase tracking-wider block">{t('signature.installationWarning')}</span>
                          <p className="text-red-650 font-semibold leading-relaxed text-[11px]">
                            {t('signature.installationWarningText')}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>

            {/* DEV: bouton temporaire pour zapper contrat + signature et aller direct en confirmation */}
            <button
              type="button"
              onClick={() => setCurrentStep('confirmation')}
              className="w-full mb-3 py-2.5 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-yellow-400 cursor-pointer transition-all"
            >
              ⚡ SKIP → Félicitations (DEV)
            </button>
            <FloatingFooterNav
              onBack={onBackToConfigurator}
              onNext={() => {
                if (!renterDetails.company.trim()) {
                  document.getElementById('comp-name')?.focus();
                  return;
                }
                if (!renterDetails.representative.trim()) {
                  document.getElementById('comp-representative')?.focus();
                  return;
                }
                if (!renterDetails.email.trim()) {
                  document.getElementById('comp-email')?.focus();
                  return;
                }
                if (!renterDetails.phone.trim()) {
                  document.getElementById('comp-phone')?.focus();
                  return;
                }
                if (!citySearchQuery.trim()) {
                  return;
                }
                if (!renterDetails.address.trim()) {
                  document.getElementById('comp-address')?.focus();
                  return;
                }
                handleNextStep();
              }}
              nextLabel={t('signature.nextStep')}
            />
          </div>
        )}

        {/* STEP 2: CONTRAT D'AFFICHAGE (Sleek document viewing, high contrast right sidebar summary) */}
        {currentStep === 'contrat' && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Scrollable contract window & tactical card signature */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert size={13} className="text-amber-600" />
                    {t('signature.secureBadge2')}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-zinc-900">
                    {projectMode === 'vente' ? t('signature.contractTitleSale') : t('signature.contractTitleRental')}
                  </h2>
                </div>
              </div>

              {/* White frame wrapper */}
              <div 
                className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6"
                id="digital-contract-frame"
              >
                
                {/* Scrollable contract contents */}
                <ContractDocument
                  pack={activePack}
                  renter={renterDetails}
                  signatureDataUrl={signatureDataUrl}
                  isValidated={isSignatureValidated}
                  projectMode={projectMode}
                  rentalPeriod={{ from: rentalStartDate, to: rentalEndDate }}
                  rentalStartTime={rentalStartTime}
                  rentalEndTime={rentalEndTime}
                  productImage={productPhoto}
                  saleContractTemplate={flowSettings.saleContractTemplate}
                  rentalContractTemplate={flowSettings.rentalContractTemplate}
                />

                {/* Scroll checkbox verification with custom error styling */}
                <div 
                  id="sig-checkbox-box" 
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    showErrorTips && !acceptedCgl
                      ? 'border-red-200 bg-red-50/40 text-red-950 animate-shake'
                      : acceptedCgl
                      ? 'border-blue-200 bg-blue-50/20 text-zinc-800'
                      : 'border-zinc-200 bg-zinc-50/40 text-zinc-600'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <div className="relative mt-0.5">
                      <input
                        id="cgl-chk"
                        type="checkbox"
                        checked={acceptedCgl}
                        onChange={(e) => {
                          setAcceptedCgl(e.target.checked);
                          if (e.target.checked) setShowErrorTips(false);
                        }}
                        disabled={isSignatureValidated}
                        className={`w-5 h-5 rounded-lg border appearance-none checked:bg-blue-600 checked:border-blue-600 hover:border-blue-500 transition-all flex items-center justify-center cursor-pointer ${
                          showErrorTips && !acceptedCgl ? 'border-red-500 bg-white ring-2 ring-red-500/15' : 'border-zinc-300 bg-white'
                        }`}
                      />
                      {acceptedCgl && (
                        <Check size={12} className="absolute inset-0 m-auto text-white stroke-[3.5] pointer-events-none" />
                      )}
                    </div>
                    <span className="text-xs leading-relaxed">
                      {projectMode === 'vente' ? (
                        <span dangerouslySetInnerHTML={{ __html: t('signature.gdprSale') }} />
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: t('signature.cgvRental') }} />
                      )}
                    </span>
                  </label>
                </div>

                {/* Tactile digital signature pad */}
                {projectMode === 'location' && isDigitalSignatureEnabled && (
                  <div 
                    id="signature-pad-block"
                    className={`pt-4 border-t border-zinc-100 transition-all ${
                      showErrorTips && !isSignatureValidated ? 'animate-shake' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                      <h4 className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-widest text-zinc-900">
                        {t('signature.signatureTitle')}
                      </h4>
                    </div>

                    <SignaturePad
                      isValidated={isSignatureValidated}
                      onSave={(dataUrl) => {
                          if (!acceptedCgl) {
                          setShowConsentAlert(true);
                          setShowErrorTips(true);
                          return;
                        }
                        setSignatureDataUrl(dataUrl);
                        setIsSignatureValidated(true);
                        setShowErrorTips(false);
                      }}
                      onClear={() => {
                        setSignatureDataUrl(null);
                        setIsSignatureValidated(false);
                      }}
                    />

                    <div className="text-center mt-3 text-[10px] text-zinc-400 font-mono">
                      {t('signature.signatureCert')}
                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Right Hand: items selected review, dark summary financial layout */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Premium Merged Card */}
              <div className="bg-[#0e1115] border border-zinc-850 rounded-[24px] p-6 shadow-xl space-y-5 text-white">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3 select-none">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-mono">
                      {t('signature.packSummary')}
                    </span>
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider mt-0.5">
                      {t('signature.selectionPricing')}
                    </h3>
                  </div>
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-600/30 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                    {projectMode === 'vente' ? t('signature.sale') : t('signature.rental')}
                  </span>
                </div>

                {/* Product Photos Strip — aligné à gauche, séparateurs entre chaque produit */}
                <div className="flex flex-col bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 select-none">
                  {productCalculations.map((pc, idx) => (
                    <div key={idx} className="flex flex-col">
                      {idx > 0 && <div className="w-full h-px bg-zinc-800/60 my-2" />}
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/60 shrink-0 flex items-center justify-center">
                          {pc.photo ? (
                            <img src={pc.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">LED</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-white truncate block leading-tight">
                            {pc.product?.name || activePack.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono leading-tight block mt-0.5">
                            {pc.width}m×{pc.height}m ×{pc.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical checkmarks included */}
                  <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 p-3 rounded-xl text-[10px] text-zinc-400 leading-normal border border-zinc-800/30 select-none">
                    <div className="flex items-start gap-1.5">
                      <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{t('signature.logisticsPixiatech')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{t('signature.approvedFile')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{t('signature.proWarranty')}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span>{t('signature.techSupport')}</span>
                    </div>
                  </div>

                {/* Cohesive Financial Recap */}
                <div className="space-y-3.5 text-xs font-sans pt-1">
                  
                  {projectMode === 'vente' ? (
                    <>
                      <div className="flex justify-between items-center bg-zinc-900/30 px-3 py-2 rounded-lg leading-normal">
                        <span className="text-zinc-400">{t('signature.saleTotal')}</span>
                        <strong className="text-blue-400 font-mono text-[14px] sm:text-base font-black whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(totalAmount)}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-blue-400 text-xs"
                          />
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">{t('signature.deposit60')}</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(Math.round(totalAmount * 0.6))}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-white text-xs"
                          />
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">{t('signature.balance40')}</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(Math.round(totalAmount * 0.4))}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-white text-xs"
                          />
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center bg-zinc-900/30 px-3 py-2 rounded-lg leading-normal">
                        <span className="text-zinc-400">{t('signature.rentalFirstPayment')}</span>
                        <strong className="text-blue-400 font-mono text-[14px] sm:text-base font-black whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(activePack.price + activePack.deposit)}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-blue-400 text-xs"
                          />
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">{t('signature.rentalCost')}</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(activePack.price)}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-white text-xs"
                          />
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">{t('signature.rentalDeposit')}</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          <BlurredPrice 
                            price={`${fmtPrice(activePack.deposit)}€ ${taxLabel}`} 
                            isPriceHidden={isPriceHidden} 
                            overlayClassName="text-white text-xs"
                          />
                        </strong>
                      </div>
                    </>
                  )}

                </div>

                {/* Subtitle notes */}
                <div className="text-[9px] text-zinc-500 font-sans tracking-wide leading-normal text-center pt-2 border-t border-zinc-900 select-none">
                  {flowSettings.taxEnabled ? t('signature.taxNotice', { rate: taxRate }) : t('signature.taxNoticeExempt')} {t('signature.contractLegal')}
                </div>

                {/* Dynamic Configuration button inside the merged card */}
                <button
                  onClick={() => setCurrentStep('informations')}
                  className="w-full text-center py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl tracking-wide cursor-pointer transition-all active:scale-98"
                >
                  {t('signature.changePack')}
                </button>
              </div>



              {/* Navigation button banner hint */}
              {isDigitalSignatureEnabled && !isSignatureValidated && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 border-dashed text-amber-900 rounded-xl text-center text-xs font-semibold leading-normal">
                  {t('signature.acceptTermsHint')}
                </div>
              )}

            </div>

          </div>

            {/* Navigation between the two cards */}
            <div className="flex justify-center w-full">
              <FloatingFooterNav
                onBack={() => setCurrentStep('informations')}
                onNext={() => {
                  const skipOtp = !isEmailVerificationEnabled;

                  setCurrentStep(skipOtp ? 'confirmation' : 'securite');
                  if (!skipOtp) {
                    setEmailDeliveryStatus('sending');
                    setOtpError(null);
                    setInputOtpCode('');
                  }

                  // Asynchronous background flow
                  const runBackgroundFlow = async () => {
                    try {
                      // Upload site photo to Firebase Storage if present
                      let sitePhotoUrl = '';
                      const existingPhoto = configuredProducts[0]?.installationPhoto;
                      if (existingPhoto && (existingPhoto.startsWith('blob:') || existingPhoto.startsWith('data:'))) {
                        try {
                          const response = await fetch(existingPhoto);
                          const blob = await response.blob();
                          const photoRef = ref(storage, `quotes/site-photos/${Date.now()}.jpg`);
                          await uploadBytes(photoRef, blob);
                          sitePhotoUrl = await getDownloadURL(photoRef);
                        } catch (e) {
                          console.error('Failed to upload site photo:', e);
                        }
                      }
                      const result = await createQuoteWithContract(
                        userId,
                        {
                          company: renterDetails.company,
                          representative: renterDetails.representative,
                          address: renterDetails.address,
                          postcode: renterDetails.postcode,
                          city: renterDetails.city,
                          email: renterDetails.email,
                          phone: renterDetails.phone,
                          notes: additionalNotes,
                          sitePhoto: sitePhotoUrl,
                        },
                        {
                          products: productItems as any[],
                          transactionType: projectMode === 'vente' ? 'sale' : 'rental',
                          includeInstallation: isInstallationIncluded,
                          installationCost: installationFee,
                          techniciansRequired: techniciansCount,
                          includeDelivery: true,
                          deliveryCost: totalDeliveryFee,
                          totalQuote: totalSubtotalProducts,
                          width: productCalculations[0]?.width || 0,
                          height: productCalculations[0]?.height || 0,
                          productName: productItems[0]?.productName || '',
                          lang: locale as 'fr' | 'en',
                          rentalPeriod: projectMode === 'location' && rentalStartDate && rentalEndDate
                            ? { from: rentalStartDate, to: rentalEndDate }
                            : undefined,
                          rentalStartTime: projectMode === 'location' ? rentalStartTime : undefined,
                          rentalEndTime: projectMode === 'location' ? rentalEndTime : undefined,
                          configuratorType: 'guided',
                        },
                        signatureDataUrl || ''
                      );
                      if (result.success && result.id) {
                        setQuoteId(result.id);
                        setSentOtpCode(result.otpCode || '');
                        setOtpTimeLeft(validityMinutes * 60 - 3);
                        setEmailDeliveryStatus(isBackendSmtpConfigured ? 'sent' : 'simulated');

                        // Background PDF generation
                        try {
                          const pdf = new jsPDF('p', 'mm', 'a4');
                          const fallback = document.getElementById('signature-pdf-container');
                          if (fallback) {
                            const pageCount = await renderPagesToPdf(fallback, pdf);
                            if (pageCount > 0) {
                              uploadPdfToStorage(pdf, result.id).then(url => {
                                if (url) setPdfUrl(url);
                              });
                            }
                          }
                        } catch (pdfErr) {
                          console.error("📄 Background PDF generation error:", pdfErr);
                        }

                        // Generate and save signed contract PDF immediately if rental mode
                        if (projectMode === 'location') {
                          generateAndSaveContractPdf(result.id);
                        }
                      } else {
                        setEmailDeliveryStatus('failed');
                        setOtpError(result.error || 'Erreur lors de la création de l\'estimation');
                      }
                    } catch (e) {
                      console.error("createQuoteWithContract exception:", e);
                      setEmailDeliveryStatus('failed');
                      setOtpError('Erreur lors de la création de l\'estimation');
                    }
                  };

                  runBackgroundFlow();
                }}
                nextDisabled={!acceptedCgl || (projectMode === 'location' && isDigitalSignatureEnabled && !isSignatureValidated)}
                nextLabel={isEmailVerificationEnabled ? t('signature.continueToVerification') : t('signature.confirmAndFinish')}
              />
            </div>

        </>
        )}

        {/* STEP 3: VÉRIFICATION DE SÉCURITÉ & SIMULATED EMAIL INBOX (A dual layout masterpiece) */}
        {currentStep === 'securite' && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Hand: High security validation page (Écran 4) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest block flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-550" />
                  {t('signature.secureBadge3')}
                </span>
                
                {/* Visual Title matched in font hierarchy, weight, and size to confirmation screen */}
                <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-zinc-900 leading-[1.15]">
                  {t('signature.securityTitle')}
                </h1>
                
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans mt-1">
                  {t('signature.securityDesc')}
                </p>
              </div>

              {/* Delivery Status Banner */}
              <div className="space-y-3">
                {emailDeliveryStatus === 'sending' && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 shadow-sm animate-pulse">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="text-xs font-semibold leading-normal">
                      <span className="font-extrabold block text-blue-850">{t('signature.emailSending')}</span>
                      {t('signature.emailSendingDesc', { email: renterDetails.email })}
                    </div>
                  </div>
                )}
                
                {(emailDeliveryStatus === 'sent' || emailDeliveryStatus === 'simulated') && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-250/60 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-sm animate-fade-in">
                    <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-normal font-sans">
                      <span className="font-black uppercase tracking-wide text-emerald-800 text-[10px] block mb-0.5">{t('signature.emailSentTitle')}</span>
                      {t('signature.emailSentDesc', { email: renterDetails.email })}
                    </div>
                  </div>
                )}



                
                {emailDeliveryStatus === 'failed' && (
                  <div className="p-4 bg-red-450/10 border border-red-200 rounded-2xl flex items-start gap-3 text-red-950 shadow-sm animate-fade-in">
                    <AlertTriangle size={18} className="text-red-650 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-normal font-sans">
                      <span className="font-black uppercase tracking-wide text-red-800 text-[10px] block mb-0.5">{t('signature.emailFailedTitle')}</span>
                      {t('signature.emailFailedDesc')}
                    </div>
                  </div>
                )}
              </div>

              {/* Discreet notice info cards on the left of image 4 */}
              <div className="space-y-3.5 pt-1">
                <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-105 flex items-center justify-center text-blue-600 shrink-0">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 font-heading">{t('signature.autoValidationTitle')}</h4>
                    <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">{t('signature.autoValidationDesc')}</span>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-105 flex items-center justify-center text-blue-600 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 font-heading">{t('signature.sessionTitle')}</h4>
                    <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">{t('signature.sessionDesc', { minutes: validityMinutes })}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Hand: Interactive PIN input card & Simulated Inbox side-by-side! */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Authenticator Box (Image 4 right layout card) with prominent blue contour and shadows */}
              <div className="bg-blue-50/30 border-2 border-blue-600 rounded-[24px] p-6 sm:p-8 shadow-lg text-center space-y-6 relative overflow-hidden" id="blue-contour-securite-card">
                
                {/* Black lock logo visual */}
                <div className="w-12 h-12 bg-zinc-950 text-white rounded-[16px] flex items-center justify-center mx-auto shadow-md">
                  <Lock size={20} className="stroke-[2.5]" />
                </div>

                {isCopied && (
                  <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs animate-bounce leading-snug">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <span>{t('signature.codeCopied')}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    {isSimulatingLinkClick ? t('signature.validationInProgress') : t('signature.verificationTitle')}
                  </h3>
                  {isSimulatingLinkClick ? (
                    <div className="text-xs text-blue-600 font-black flex items-center justify-center gap-2 animate-pulse py-1">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      <span>{t('signature.verificationProgress')}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      {t('signature.enterCode')}
                    </p>
                  )}
                </div>

                {/* Simulated 6 digits code inputs using our single-hidden input trick! */}
                <div className="relative py-2 max-w-xs mx-auto">
                  
                  {/* Hidden underlying element */}
                  <input
                    ref={hiddenInputRef}
                    id="otp-code-hidden-ctrl"
                    type="text"
                    maxLength={100}
                    disabled={isSimulatingLinkClick || isOtpCompleted}
                    value={inputOtpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputOtpCode(val);
                      setOtpError(null);
                      if (val.length === 6) {
                        setTimeout(() => handleManualCodeVerify(val), 100);
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text');
                      const digits = pasted.replace(/\D/g, '').slice(0, 6);
                      if (digits.length > 0) {
                        setInputOtpCode(digits);
                        setOtpError(null);
                        if (digits.length === 6) {
                          setTimeout(() => handleManualCodeVerify(digits), 100);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-default border-none focus:outline-none"
                    autoFocus
                  />
                  
                  {/* Styled visual panels for grid alignment */}
                  <div 
                    onClick={() => hiddenInputRef.current?.focus()}
                    className="flex justify-between gap-1.5 sm:gap-2.5"
                  >
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const character = inputOtpCode[idx] || '';
                      const isFocused = idx === inputOtpCode.length && !isOtpCompleted;
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold font-mono transition-all duration-150 cursor-pointer ${
                            isOtpCompleted
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-95 shadow-inner'
                              : isFocused
                              ? 'bg-white border-blue-500 text-zinc-900 scale-102 font-extrabold'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {character}
                        </div>
                      );
                    })}
                  </div>

                </div>

                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        const digits = text.replace(/\D/g, '').slice(0, 6);
                        if (digits.length === 6) {
                          setInputOtpCode(digits);
                          setOtpError(null);
                          setTimeout(() => handleManualCodeVerify(digits), 100);
                        }
                      } catch {
                        setOtpError(t('signature.clipboardError'));
                      }
                    }}
                    disabled={isSimulatingLinkClick || isOtpCompleted}
                    className="text-xs font-black text-white bg-zinc-950 hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 cursor-pointer shadow-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy size={12} className="stroke-[2.5]" />
                    <span>{t('signature.pasteCode')}</span>
                  </button>
                </div>

                {/* Countdown display */}
                <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-medium">
                  <Clock size={12} />
                  <span>{t('signature.codeExpiresIn')} </span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded leading-none ${otpTimeLeft <= 59 ? 'text-red-600 bg-red-100 animate-pulse' : 'text-zinc-800 bg-zinc-100'}`}>
                    {formatTime(otpTimeLeft)}
                  </span>
                </div>

                {/* Error messages reporting fail states */}
                {otpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left text-[11px] text-red-900 animate-shake">
                    <AlertTriangle size={14} className="text-red-650 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Checked completed notice */}
                {isOtpCompleted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1.5 animate-bounce">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>{t('signature.identityValidated')}</span>
                  </div>
                )}

                {/* Confirm big black validation button modeled exactly */}
                <div className="pt-2">
                  <button
                    disabled={inputOtpCode.length < 6 || isSimulatingLinkClick || isOtpCompleted}
                    onClick={() => handleManualCodeVerify(inputOtpCode)}
                    className={`w-full py-3 rounded-xl font-heading font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      inputOtpCode.length === 6 && !isSimulatingLinkClick && !isOtpCompleted
                        ? 'bg-zinc-950 hover:bg-zinc-850 text-white shadow-md shadow-zinc-955/20'
                        : 'bg-zinc-100 border border-zinc-150 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    <Lock size={12} />
                    <span>{t('signature.validate')}</span>
                    <ArrowRight size={12} className="stroke-[2.5]" />
                  </button>
                </div>

                  <div className="flex flex-col gap-2 items-center justify-center pt-1">
                  {resendAttemptsLeft <= 0 ? (
                    <div className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl animate-pulse">
                      Trop de tentatives. Actualisation...
                    </div>
                  ) : (
                    <>
                  {otpResent && (
                    <div className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-xl animate-bounce flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-600" />
                      <span>{t('signature.codeResent')}</span>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-4 text-[10px]">
                    <button 
                      onClick={handleResendCode}
                      disabled={isSimulatingLinkClick || isOtpCompleted}
                      className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-40"
                    >
                      {t('signature.resendCode')}
                    </button>
                    {resendAttemptsLeft < MAX_RESEND_ATTEMPTS && (
                      <span className={`font-bold ${resendAttemptsLeft === 1 ? 'text-red-600' : 'text-amber-600'}`}>
                        {resendAttemptsLeft === 1 ? 'Dernière tentative' : `Il vous reste ${resendAttemptsLeft} tentatives`}
                      </span>
                    )}
                  </div>
                  </>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 text-[8px] tracking-widest text-zinc-400 font-mono">
                  {t('signature.accessRestricted')}
                </div>

              </div>

            </div>

          </div>

            {/* Navigation flottante — retour en large, suivant petit désactivé */}
            <FloatingFooterNav
              onBack={handlePrevStep}
              onNext={() => {}}
              nextDisabled
              backIsPrimary
            />

          </>
        )}

        {/* STEP 4: CONFIRMATION & FÉLICITATIONS (Beautiful final dashboard validation) */}
        {currentStep === 'confirmation' && (
          <div id="estimation-recap-main-card" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Column: Success titles and descriptions (Écran 5 left) */}
            <div className="lg:col-span-7 flex flex-col justify-start space-y-6 pr-0 lg:pr-6">
              
              <div className="space-y-4">
                
                {/* Badge layout */}
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-600" />
                  <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">
                    {t('signature.secureBadge4')}
                  </span>
                </div>

                {/* Dark circular checkmark badge */}
                <div className="w-14 h-14 bg-zinc-950 text-white rounded-[18px] flex items-center justify-center shadow-md">
                  <Check size={26} className="stroke-[3]" />
                </div>

                <div>
                  <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-zinc-900 leading-[1.08] uppercase">
                    {t('signature.confirmationStep')}
                  </h1>
                  <span className="text-blue-600 lowercase normal-case text-3xl sm:text-4xl font-black font-heading tracking-tight block">
                    {t('signature.confirmationDesc')}
                  </span>
                  
                  <div className="max-w-lg mt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-[20px] p-5 shadow-sm space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle size={18} className="text-blue-600 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-900">{t('signature.estimationConfirmed')}</p>
                          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            {t('signature.estimationConfirmedDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-3">
                      {t('signature.thankYouMessage')}
                    </p>
                  </div>
                </div>

              </div>

               {/* Confirm actions buttons layout */}
               <div className="flex flex-col gap-3 pt-2 max-w-lg">

                  <button
                    type="button"
                    onClick={onNewQuote}
                    className="w-full px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/15"
                  >
                     <Plus size={14} />
                     <span>{t('signature.newQuote')}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleViewPdf}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                       <FileCheck2 size={15} />
                       <span>{t('signature.consulterPdf')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleContractDownload(); }}
                      className="px-5 py-3 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                       <Download size={14} />
                       <span>{t('signature.downloadPdf')}</span>
                    </button>
                  </div>

               </div>

            </div>

            {/* Right Column: per-product accordion details + photos */}
            <div className="lg:col-span-5 flex flex-col gap-5">

              {/* Pricing summary card */}
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-5">

                {/* Subtotals breakdowns */}
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>{t('signature.productsSubtotal')}</span>
                    <span className="text-zinc-800 font-bold font-mono">
                      <BlurredPrice price={`${fmtPrice(totalSubtotalProducts)} €`} isPriceHidden={isPriceHidden} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>{t('signature.delivery')}</span>
                    <span className="text-zinc-800 font-bold font-mono">
                      <BlurredPrice price={`${fmtPrice(totalDeliveryFee)} €`} isPriceHidden={isPriceHidden} />
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>{t('signature.installation')}</span>
                    <span className="text-zinc-800 font-bold font-mono">
                      <BlurredPrice price={isInstallationIncluded ? `${fmtPrice(installationFee)} €` : '0 €'} isPriceHidden={isPriceHidden} />
                    </span>
                  </div>
                </div>

                {/* Total estimé box with animated gradient background */}
                <div className="relative mt-4 gradient-bg rounded-2xl overflow-hidden shadow-md">
                  <svg className="absolute w-0 h-0" aria-hidden="true">
                    <filter id="goo">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur" />
                      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10" result="goo" />
                      <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                  </svg>
                  <div className="gradients-container">
                    <div className="g1" />
                    <div className="g2" />
                    <div className="g3" />
                    <div className="g4" />
                    <div className="g5" />
                  </div>
                  <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between select-none">
                    <span className="text-xs font-black text-white/80 tracking-wider font-heading uppercase drop-shadow-sm">
                      {t('signature.totalEstimate')} ({taxLabel})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-black text-white drop-shadow-sm">
                        <BlurredPrice 
                          price={`${fmtPrice(totalAmount)} €`} 
                          isPriceHidden={isPriceHidden} 
                          overlayClassName="text-white text-sm"
                        />
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Per-product accordion cards */}
              <div className="space-y-3">
                {productCalculations.map((pc, idx) => {
                  const prod = pc.product;
                  const isOpen = openAccordionIdx === idx;
                  return (
                    <div key={idx} className="bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setOpenAccordionIdx(isOpen ? null : idx)}
                        className="w-full flex items-center gap-3 p-3.5 text-left cursor-pointer hover:bg-zinc-50/50 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 shrink-0 flex items-center justify-center">
                          {pc.photo ? (
                            <img src={pc.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-wider">LED</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-zinc-900 block leading-tight truncate">
                            {prod?.name || activePack.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                            {pc.width}m × {pc.height}m ×{pc.quantity}
                          </span>
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Collapsible content */}
                      {isOpen && (
                        <div className="px-3.5 pb-4 space-y-3 animate-fade-in">
                          {/* Full product photo */}
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200/80">
                            {pc.photo ? (
                              <img src={pc.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">LED Screen</span>
                              </div>
                            )}
                          </div>

                          {/* Specs */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-sans">
                            {pc.is360 ? (
                              <>
                                <span className="text-zinc-500">Diamètre :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.diameter}m</span>
                                <span className="text-zinc-500">Hauteur :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.height}m</span>
                                <span className="text-zinc-500">Vue circulaire 360 :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.cabinetAngle && pc.cabinetAngle > 0 ? 'Intérieur' : 'Extérieur'}</span>
                              </>
                            ) : pc.isCurved ? (
                              <>
                                <span className="text-zinc-500">{t('signature.dimensions')} :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.width}m × {pc.height}m</span>
                                <span className="text-zinc-500">Inclinaison G/D :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.curveLeft || 0}° / {pc.curveRight || 0}°</span>
                              </>
                            ) : (
                              <>
                                <span className="text-zinc-500">{t('signature.dimensions')} :</span>
                                <span className="text-zinc-900 font-medium text-right">{pc.width}m × {pc.height}m</span>
                              </>
                            )}
                            <span className="text-zinc-500">{t('signature.surface')} :</span>
                            <span className="text-zinc-900 font-medium text-right">{(pc.surface * pc.quantity).toFixed(2)} m²</span>
                            <span className="text-zinc-500">{t('signature.quantity')} :</span>
                            <span className="text-zinc-900 font-medium text-right">×{pc.quantity}</span>
                            <span className="text-zinc-500 border-t border-zinc-100 pt-1 font-semibold">{t('signature.priceLabel')} {projectMode === 'vente' ? t('signature.sale').toLowerCase() : t('signature.rental').toLowerCase()} {taxLabel} :</span>
                            <span className="text-zinc-955 border-t border-zinc-100 pt-1 font-bold font-mono text-right">
                              <BlurredPrice price={`${fmtPrice(pc.subtotal)} € ${taxLabel}`} isPriceHidden={isPriceHidden} />
                            </span>
                          </div>

                          {projectMode === 'location' && (
                            <div className="flex flex-wrap gap-1.5 text-[9px] font-mono text-zinc-500 pt-1 border-t border-zinc-100">
                              <span className="bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">
                                {t('signature.from')} {formatFrenchDate(rentalStartDate)} {rentalStartTime}
                              </span>
                              <span className="bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">
                                {t('signature.to')} {formatFrenchDate(rentalEndDate)} {rentalEndTime}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

        {/* Hidden PDF template rendered from admin settings — always in DOM, off-screen for html2canvas */}
        <div
          ref={pdfContainerRef}
          id="signature-pdf-container"
          style={{
            position: "absolute",
            left: "-99999px",
            top: 0,
            width: "820px",
          }}
        >
          <QuotePDF
            key={`pdf-${locale}`}
            id="signature-pdf-view"
            request={{
              id: quoteId || 'signature-flow',
              createdAt: new Date(),
              status: 'pending',
              isRead: false,
              emailVerified: true,
              client: {
                companyName: renterDetails.company,
                email: renterDetails.email,
                phone: renterDetails.phone,
                address: renterDetails.address,
                notes: additionalNotes,
              },
              products: productItems as any,
              installationCost: installationFee,
              deliveryCost: totalDeliveryFee,
              totalQuote: totalSubtotalProducts,
              transactionType: projectMode === 'vente' ? 'sale' : 'rental',
              lang: locale as 'fr' | 'en',
              width: productCalculations[0]?.width || 0,
              height: productCalculations[0]?.height || 0,
              productName: productItems[0]?.productName || '',
              screenType: (productCalculations[0]?.product?.type?.[0] || 'indoor') as 'indoor' | 'outdoor' | 'showcase',
              includeInstallation: isInstallationIncluded,
              techniciansRequired: techniciansCount,
              includeDelivery: true,
              rentalPeriod: projectMode === 'location' && rentalStartDate && rentalEndDate ? { from: new Date(rentalStartDate), to: new Date(rentalEndDate) } : undefined,
              rentalStartTime: projectMode === 'location' ? rentalStartTime : undefined,
              rentalEndTime: projectMode === 'location' ? rentalEndTime : undefined,
            } as QuoteRequest}
            settings={pdfSettings || DEFAULT_PDF_SETTINGS}
            selectedCity={selectedCityForPdf}
            globalSettings={globalSettings || settings || ({} as any)}
            allProducts={allProducts}
          />
        </div>

        {/* Hidden signed contract render — always in DOM, off-screen for html2canvas */}
        <div
          ref={contractContainerRef}
          id="signature-contract-container"
          style={{
            position: "absolute",
            left: "-99999px",
            top: 0,
            width: "820px",
          }}
        >
          <ContractDocument
            pack={activePack}
            renter={renterDetails}
            signatureDataUrl={signatureDataUrl}
            isValidated={true}
            projectMode={projectMode}
            rentalPeriod={rentalStartDate && rentalEndDate ? { from: rentalStartDate, to: rentalEndDate } : undefined}
            rentalStartTime={rentalStartTime}
            rentalEndTime={rentalEndTime}
            productImage={productPhoto}
            saleContractTemplate={flowSettings.saleContractTemplate}
            rentalContractTemplate={flowSettings.rentalContractTemplate}
            isPdfMode={true}
          />
        </div>

      </main>

      {/* Primary footer bottom credits & links */}
      <footer className="w-full bg-white border-t border-[#e2e8f0] py-6 px-4 text-center mt-auto space-y-3 shadow-inner">
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
          <a href="https://pixiatech.com/gestion-cookies/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{t('signature.footerSecurity')}</a>
          <span>•</span>
          <a href="https://pixiatech.com/politique-confidentialite/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{t('signature.footerTerms')}</a>
          <span>•</span>
          <a href="https://pixiatech.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{t('signature.footerPolicy')}</a>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono tracking-widest">
          {t('signature.accessRestricted')} | @ 2026 PIXIA TECH. {t('signature.allRightsReserved')}
        </div>
      </footer>

      {/* Consent required alert dialog */}
      <AlertDialog open={showConsentAlert} onOpenChange={setShowConsentAlert}>
        <AlertDialogContent className="border-amber-200 dark:border-amber-900/60 shadow-2xl shadow-amber-900/10">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <AlertDialogHeader className="mt-4">
             <AlertDialogTitle className="text-center text-lg text-slate-800 dark:text-slate-100">
              {t('signature.consentRequired')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('signature.consentRequiredDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-center mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {t('signature.importantInfo')}
            </span>
          </div>
          <AlertDialogFooter className="sm:justify-center mt-2">
            <AlertDialogAction
              onClick={() => setShowConsentAlert(false)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 cursor-pointer"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
