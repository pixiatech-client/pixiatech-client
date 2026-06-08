/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Download,
  PartyPopper,
  Info,
  Layers,
  Phone,
  Mail,
  FileText,
  Lock,
  Shield,
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
  Settings,
  Sliders,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { Pack, RenterDetails, Step, StepId } from './types';
import SignaturePad from './components/SignaturePad';
import ContractDocument from './components/ContractDocument';
import PixiatechLogo from './components/PixiatechLogo';
// @ts-ignore
import ledCabinetImg from './assets/images/led_cabinet_1780909535783.png';

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

export default function App() {
  // Helper to load state from localStorage safely
  const getStoredState = (key: string, defaultValue: any) => {
    try {
      const stored = localStorage.getItem('pixia_estimator_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[key] !== undefined) {
          return parsed[key];
        }
      }
    } catch (e) {
      console.error("Storage read error:", e);
    }
    return defaultValue;
  };

  // Stepper representation showing cohesive steps
  const [currentStep, setCurrentStep] = useState<StepId>(() => getStoredState('currentStep', 'informations'));
  
  // Custom screen dimensions (Image 1 prefilled layout: 12m x 6.5m = 78m² / 312 dalles)
  const [width, setWidth] = useState<number>(() => getStoredState('width', 12));
  const [height, setHeight] = useState<number>(() => getStoredState('height', 6.5));
  
  // Project Mode: Vente (Purchase) vs Location (Lease)
  const [projectMode, setProjectMode] = useState<'vente' | 'location'>(() => getStoredState('projectMode', 'vente'));

  // Quantity of screens ordered
  const [quantity, setQuantity] = useState<number>(() => getStoredState('quantity', 1));

  // Contact details pre-filled to match Image 1
  const [renterDetails, setRenterDetails] = useState<RenterDetails>(() => getStoredState('renterDetails', {
    company: '',
    representative: 'Moulebhar',
    address: '46 cite 68 logts ENRIO',
    postcode: '75000',
    city: 'Paris',
    email: 'ayanhil@gmail.com',
    phone: '0777657080'
  }));

  const [eventDate, setEventDate] = useState<string>(() => getStoredState('eventDate', '2026-06-15'));
  const [additionalNotes, setAdditionalNotes] = useState<string>(() => getStoredState('additionalNotes', ''));

  // Rental states
  const [rentalStartDate, setRentalStartDate] = useState<string>(() => getStoredState('rentalStartDate', '2026-06-10'));
  const [rentalEndDate, setRentalEndDate] = useState<string>(() => getStoredState('rentalEndDate', '2026-06-19'));
  const [rentalStartTime, setRentalStartTime] = useState<string>(() => getStoredState('rentalStartTime', '08:00'));
  const [rentalEndTime, setRentalEndTime] = useState<string>(() => getStoredState('rentalEndTime', '18:00'));

  // Selected city and installation states
  const [selectedCityId, setSelectedCityId] = useState<string>(() => getStoredState('selectedCityId', '1')); // Default to Paris (id: '1')
  const [citySearchQuery, setCitySearchQuery] = useState<string>(() => getStoredState('citySearchQuery', 'Paris (75000)'));
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState<boolean>(() => getStoredState('isInstallationIncluded', true));
  const [isInstallationAccordionOpen, setIsInstallationAccordionOpen] = useState<boolean>(() => getStoredState('isInstallationAccordionOpen', true));

  // Selected pack ID for template reference
  const [selectedPackId, setSelectedPackId] = useState<string>(() => getStoredState('selectedPackId', 'pack-s'));
  
  // Signature management
  const [acceptedCgl, setAcceptedCgl] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(() => getStoredState('signatureDataUrl', null));
  const [isSignatureValidated, setIsSignatureValidated] = useState<boolean>(() => getStoredState('isSignatureValidated', false));
  
  // Security OTP Code management (Image 3 utilizes 842903)
  const [sentOtpCode, setSentOtpCode] = useState<string>('842903');
  const [inputOtpCode, setInputOtpCode] = useState<string>('');
  const [isOtpCompleted, setIsOtpCompleted] = useState<boolean>(() => getStoredState('isOtpCompleted', false));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(597); // 9 minutes 57s (matching 09:57 in screenshot)
  const [isSimulatingLinkClick, setIsSimulatingLinkClick] = useState<boolean>(false);
  const [showEmailPulse, setShowEmailPulse] = useState<boolean>(false);
  const [showErrorTips, setShowErrorTips] = useState<boolean>(false);
  const [otpResent, setOtpResent] = useState<boolean>(false);

  // SMTP Settings client-side state
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
    } catch (e) {
      console.error(e);
    }
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

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pixia_smtp_config', JSON.stringify(smtpConfig));
    } catch (error) {
      console.error("Failed to save SMTP settings:", error);
    }
  }, [smtpConfig]);

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
        eventDate,
        additionalNotes,
        selectedCityId,
        citySearchQuery,
        isInstallationIncluded,
        isInstallationAccordionOpen,
        selectedPackId,
        acceptedCgl,
        signatureDataUrl,
        isSignatureValidated,
        isOtpCompleted,
        rentalStartDate,
        rentalEndDate,
        rentalStartTime,
        rentalEndTime
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
    eventDate,
    additionalNotes,
    selectedCityId,
    citySearchQuery,
    isInstallationIncluded,
    isInstallationAccordionOpen,
    selectedPackId,
    acceptedCgl,
    signatureDataUrl,
    isSignatureValidated,
    isOtpCompleted,
    rentalStartDate,
    rentalEndDate,
    rentalStartTime,
    rentalEndTime
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
      const copyParam = params.get('copy');
      
      if (codeParam && codeParam.length === 6) {
        // Switch to security step to show verification is happening
        setCurrentStep('securite');
        setSentOtpCode(codeParam);

        if (copyParam === 'true') {
          // Mode: Copy to clipboard and stay on security screen (does not auto-authenticate, lets user test manual validation!)
          setInputOtpCode(codeParam);
          setIsSimulatingLinkClick(false);
          setIsOtpCompleted(false);

          navigator.clipboard.writeText(codeParam)
            .then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 3500);
            })
            .catch(err => {
              console.warn("Fallback direct copy executing:", err);
              // Fallback text area write
              const ta = document.createElement("textarea");
              ta.value = codeParam;
              document.body.appendChild(ta);
              ta.select();
              try {
                document.execCommand('copy');
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3500);
              } catch (ex) {
                console.error("Direct fallback copy failed:", ex);
              }
              document.body.removeChild(ta);
            });

          // Simple URL cleanup so they don't refresh and re-trigger
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        // Direct validation link mode: auto-verify and redirect
        setInputOtpCode(codeParam);
        setIsSimulatingLinkClick(true);
        const verificationTimer = setTimeout(() => {
          setIsOtpCompleted(true);
          setIsSimulatingLinkClick(false);
          // Auto route to final step on direct link verification success
          setCurrentStep('confirmation');
          // Simple URL cleanup so they don't refresh and re-trigger
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 1800);

        return () => clearTimeout(verificationTimer);
      }
    } catch (e) {
      console.error("Url params parsing error:", e);
    }
  }, []);

  // Hidden Input ref for smooth 6-box input focus/click handling
  const hiddenInputRef = useRef<HTMLInputElement>(null);

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
        details: `${width}m x ${height}m (${surface.toFixed(2)}m²) - ${activePack.name}`,
        appUrl: `${window.location.origin}${window.location.pathname}`
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

  const [isCopied, setIsCopied] = useState<boolean>(false);
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

  // Live Calculations based on width & height
  const surface = width * height;
  const dalles = Math.round(surface * 4); // 4 dalles of 50x50cm per m²

  // Price calculation model (matches image values: surface 78m², purchase total 156 350,00€)
  const pricePerSqm = projectMode === 'vente' ? 2000 : 12; // 2000€ purchase or 12€ lease per sqm per month
  const subtotalProducts = surface * pricePerSqm;
  const deliveryFee = 250;
  
  // Dynamic installation fee calculation matching Image 1 & 2
  const techniciansCount = Math.max(1, Math.ceil(surface / 40));
  const installationFee = isInstallationIncluded ? (techniciansCount * 50) : 0;
  
  // Total price calculations including shipment and installation for N screens
  const totalAmount = (subtotalProducts * quantity) + (250 * quantity) + (installationFee * quantity);

  // Active Pack Helper matching current metrics or custom selection
  const activePack: Pack = {
    id: 'custom-led-78',
    name: projectMode === 'vente' ? 'Caissons LED Série Extra Plat' : 'Location Écran LED Sur-Mesure',
    surface: `${(surface * quantity).toFixed(2)} m²`,
    price: Math.round(subtotalProducts * quantity),
    deposit: Math.round(subtotalProducts * quantity * 0.5), // Caution
    description: `Configuration de ${quantity} écran(s) LED de ${width}m x ${height}m (Total ${dalles * quantity} dalles)`,
    specs: [
      `Dimensions unitaire : ${width}m x ${height}m`,
      `Surface unitaire : ${surface.toFixed(2)} m²`,
      `Quantité d'écrans : ${quantity}`,
      `Surface totale d'affichage : ${(surface * quantity).toFixed(2)} m²`,
      `Quantité de matériel : ${dalles * quantity} dalles de 50x50cm (dont dalles de réserve)`
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

  // Handle auto code completion on paste
  useEffect(() => {
    if (inputOtpCode.length === 6 && !isOtpCompleted && !isSimulatingLinkClick) {
      handleManualCodeVerify(inputOtpCode);
    }
  }, [inputOtpCode]);

  // Cohesive stages in the upper header representation
  const steps: Step[] = [
    { id: 'informations', label: 'Résumé de l’estimation', isCompleted: currentStep !== 'informations', isActive: currentStep === 'informations' },
    { id: 'contrat', label: 'Contrat & Signature', isCompleted: currentStep === 'securite' || currentStep === 'confirmation', isActive: currentStep === 'contrat' },
    { id: 'securite', label: 'Vérification de sécurité', isCompleted: currentStep === 'confirmation', isActive: currentStep === 'securite' },
    { id: 'confirmation', label: 'Félicitations', isCompleted: false, isActive: currentStep === 'confirmation' }
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
    if (currentStep === 'informations') {
      setCurrentStep('contrat');
    } else if (currentStep === 'contrat') {
      if (!acceptedCgl) {
        setShowErrorTips(true);
        document.getElementById('sig-checkbox-box')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (!isSignatureValidated) {
        setShowErrorTips(true);
        document.getElementById('signature-pad-block')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      // Re-initialize security validation code and send real email
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(randomCode);
      setOtpTimeLeft(597);
      setOtpError(null);
      setInputOtpCode('');
      setCurrentStep('securite');
      sendRealEmail(randomCode);
    }
  };

  // Verify code typed manually
  const handleManualCodeVerify = (codeToVerify: string) => {
    if (codeToVerify === sentOtpCode) {
      setIsOtpCompleted(true);
      setOtpError(null);
      setTimeout(() => {
        setCurrentStep('confirmation');
      }, 800);
    } else {
      setOtpError("Validation automatique impossible. Entrez le code reçu par e-mail.");
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

  const handleResendCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtpCode(randomCode);
    setOtpTimeLeft(600);
    setOtpError(null);
    setInputOtpCode('');
    setOtpResent(true);
    setTimeout(() => {
      setOtpResent(false);
    }, 4000);
    sendRealEmail(randomCode);
  };

  // Download contract text
  const handleContractDownload = () => {
    const textData = `
========================================================================
ESTIMATION TECHNIQUE & CONTRAT NUMÉRIQUE VALIDE - PIXIATECH PRO
========================================================================
Référence Dossier     : PIXIA-EST-${Math.round(surface)}-2026
Date d'Homologation   : 29 mai 2026
Statut de Signature   : CERTIFIÉ ET SIGNÉ ÉLECTRONIQUEMENT
------------------------------------------------------------------------

SOCIÉTÉ CONTRACTANTE (PRENEUR) :
- Raison Sociale : ${renterDetails.company}
- Représentant : ${renterDetails.representative}
- Adresse de livraison : ${renterDetails.address}, ${renterDetails.postcode} ${renterDetails.city}
- Coordonnées : ${renterDetails.email} | ${renterDetails.phone}

SPÉCIFICATIONS TECHNIQUES DU BIEN :
- Modèle d'Affichage : ${activePack.name}
- Dimensions d'écran : ${width}m x ${height}m
- Surface totale d'affichage : ${surface.toFixed(2)} m²
- Nombre de modules LED : ${dalles} dalles de dimensions 50cm x 50cm
- Type de commande : ${projectMode.toUpperCase()}

DÉCOMPTE FINANCIER :
- Sous-total matériel : ${subtotalProducts.toLocaleString('fr-FR')} € TTC
- Frais logistique de livraison : ${deliveryFee.toLocaleString('fr-FR')} € TTC
- Prestation d'Installation : ${isInstallationIncluded ? `Incluse par nos techniciens (${installationFee.toLocaleString('fr-FR')} € TTC)` : 'Non incluse - par vos soins (Pixiatech décline toute responsabilité)'}
- MONTANT TOTAL ESTIMÉ (TTC) : ${totalAmount.toLocaleString('fr-FR')} € TTC

------------------------------------------------------------------------
Certifié par PandaDoc e-Sign. Authentifié par OTP Mail Code #${sentOtpCode}
PIXIATECH - Saint-Ouen-sur-Seine et France Entière.
========================================================================
`;

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pixiatech_Contrat_Est_${renterDetails.company.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-zinc-800 font-sans antialiased">
      
      {/* Dynamic kinetic glass header bar */}
      <header className="bg-white border-b border-[#e2e8f0] py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <PixiatechLogo className="w-9 h-9" />
            <div>
              <span className="font-heading font-black tracking-tight text-zinc-900 text-sm sm:text-base">PIXIATECH PRO</span>
            </div>
          </div>
          
          <div>
            <a
              href="https://app.pixiatech.com/admin/login"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs font-mono font-bold text-zinc-450 hover:text-blue-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 hover:border-blue-300 px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer inline-block"
            >
              ESPACE ADMINISTRATEUR
            </a>
          </div>
        </div>
      </header>

      {/* Stepper Progress Indicator */}
      {currentStep !== 'confirmation' && (
        <div className="w-full bg-white border-b border-[#e2e8f0] py-3.5 px-4 overflow-x-auto select-none scrollbar-none">
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
                        ? 'bg-zinc-950 text-white shadow-sm ring-4 ring-blue-105/15 font-bold' 
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
                
                {/* Left Pane Header */}
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black font-heading tracking-tight text-zinc-905 uppercase">
                    Informations Client
                  </h2>
                  <p className="text-xs text-zinc-500 font-semibold">
                    Tous les champs sont obligatoires sauf la note pour le vendeur.
                  </p>
                </div>

                {/* Switcher pour basculer facilement entre Vente (Client) et Location (Tester l'allocation) */}
                <div className="space-y-2 pb-4 border-b border-zinc-100">
                  <label className="font-black uppercase tracking-wide text-[10px] sm:text-[11px] text-zinc-700">
                    Type de commande (Achat vs Location) *
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-zinc-50 border border-zinc-200/60 rounded-2xl">
                    <button
                      id="toggle-mode-vente"
                      type="button"
                      onClick={() => setProjectMode('vente')}
                      className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        projectMode === 'vente'
                          ? 'bg-zinc-950 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-900 bg-transparent'
                      }`}
                    >
                      💼 Vente Définitive
                    </button>
                    <button
                      id="toggle-mode-location"
                      type="button"
                      onClick={() => setProjectMode('location')}
                      className={`py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        projectMode === 'location'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                          : 'text-zinc-500 hover:text-blue-600 bg-transparent'
                      }`}
                    >
                      🕒 Location d'Affichage
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold select-none leading-normal">
                    {projectMode === 'vente' 
                      ? 'Mode Vente sélectionné : configurez vos caissons d’affichage LED pour l’acquisition.'
                      : 'Mode Location sélectionné : configurez l’allocation temporelle pour tester le contrat.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  
                  {/* Entity Company name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-name" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!renterDetails.company ? 'text-red-500' : 'text-zinc-700'}`}>
                      Nom de l'entreprise *
                    </label>
                    <input
                      id="comp-name"
                      type="text"
                      placeholder="Veuillez saisir le nom de l'entreprise"
                      value={renterDetails.company}
                      onChange={(e) => setRenterDetails({ ...renterDetails, company: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        !renterDetails.company 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {!renterDetails.company && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
                      </p>
                    )}
                  </div>

                  {/* Nom du contact */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-representative" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!renterDetails.representative ? 'text-red-500' : 'text-zinc-700'}`}>
                      Nom du contact *
                    </label>
                    <input
                      id="comp-representative"
                      type="text"
                      placeholder="Veuillez saisir le nom du contact"
                      value={renterDetails.representative}
                      onChange={(e) => setRenterDetails({ ...renterDetails, representative: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        !renterDetails.representative 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {!renterDetails.representative && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
                      </p>
                    )}
                  </div>

                  {/* Corporate professional email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-email" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!renterDetails.email ? 'text-red-500' : 'text-zinc-700'}`}>
                      Email professionnel *
                    </label>
                    <input
                      id="comp-email"
                      type="email"
                      placeholder="Veuillez saisir l'email professionnel"
                      value={renterDetails.email}
                      onChange={(e) => setRenterDetails({ ...renterDetails, email: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        !renterDetails.email 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {!renterDetails.email && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
                      </p>
                    )}
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-phone" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!renterDetails.phone ? 'text-red-500' : 'text-zinc-700'}`}>
                      Téléphone *
                    </label>
                    <input
                      id="comp-phone"
                      type="text"
                      placeholder="Veuillez saisir le numéro de téléphone"
                      value={renterDetails.phone}
                      onChange={(e) => setRenterDetails({ ...renterDetails, phone: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        !renterDetails.phone 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {!renterDetails.phone && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
                      </p>
                    )}
                  </div>

                  {/* Ville de livraison (Combobox custom premium with Orange IMPORTANT tag) */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <div className="flex items-center gap-2">
                      <label className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!citySearchQuery ? 'text-red-500' : 'text-zinc-700'}`}>
                        Ville de livraison *
                      </label>
                      <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">
                        IMPORTANT
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Search size={14} className="stroke-[2.5]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Rechercher une ville ou un code postal (ex: Lyon, 75000)..."
                        value={citySearchQuery}
                        onChange={(e) => {
                          setCitySearchQuery(e.target.value);
                          setIsCityDropdownOpen(true);
                        }}
                        onFocus={() => setIsCityDropdownOpen(true)}
                        className={`w-full rounded-[14px] pl-10 pr-10 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                          !citySearchQuery 
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

                    {!citySearchQuery && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
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
                            <p className="font-bold text-zinc-700">Zone non configurée</p>
                            <p className="text-[10px] text-zinc-400 mt-1">L'entreprise PixiaTech ne couvre pas encore cette zone pour les configurations automatisées.</p>
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
                              Réinitialiser à Paris
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-address" className={`font-black uppercase tracking-wide text-[10px] sm:text-[11px] ${!renterDetails.address ? 'text-red-500' : 'text-zinc-700'}`}>
                      Adresse de l'événement *
                    </label>
                    <input
                      id="comp-address"
                      type="text"
                      placeholder="Veuillez saisir l'adresse de l'événement"
                      value={renterDetails.address}
                      onChange={(e) => setRenterDetails({ ...renterDetails, address: e.target.value })}
                      className={`w-full rounded-[14px] px-4 py-3.5 font-semibold focus:outline-none transition-all text-xs shadow-sm ${
                        !renterDetails.address 
                          ? 'bg-red-50/30 border-2 border-red-300 focus:bg-white focus:border-red-500' 
                          : 'bg-[#edf2f7]/40 border-2 border-transparent focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {!renterDetails.address && (
                      <p className="text-red-550 font-bold text-[10px] mt-1 flex items-center gap-1">
                        <span>▲ Ce champ est obligatoire</span>
                      </p>
                    )}
                  </div>

                  {/* Période & Horaires de location (DYNAMICALLY SHOWN ONLY IN LOCATION MODE) */}
                  {projectMode === 'location' && (
                    <div className="md:col-span-2 bg-[#f0f9ff]/70 border border-blue-150/40 rounded-2xl p-5 space-y-4 pt-4 mt-2">
                      <div className="flex items-center gap-2 border-b border-blue-100/50 pb-2 select-none">
                        <span className="w-1.5 h-3.5 bg-blue-600 rounded-full block"></span>
                        <h4 className="font-bold text-[10px] sm:text-xs text-blue-900 uppercase tracking-wider">
                          Période et Horaires de la Location
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dates */}
                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            Date de début de location *
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
                            Date de fin de location *
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
                            Heure de début *
                          </label>
                          <input
                            type="text"
                            placeholder="ex: 08:00"
                            value={rentalStartTime}
                            onChange={(e) => setRentalStartTime(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 font-semibold focus:outline-none bg-white border border-zinc-200 focus:border-blue-500 text-xs shadow-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-extrabold uppercase tracking-wide text-[10px] text-zinc-650">
                            Heure de fin *
                          </label>
                          <input
                            type="text"
                            placeholder="ex: 18:00"
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
                        Note pour le vendeur
                      </label>
                      <span className="text-[9px] bg-zinc-100 text-zinc-500 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Facultatif
                      </span>
                    </div>
                    <textarea
                      id="comp-notes"
                      rows={3}
                      placeholder="Ajoutez toute information utile pour le vendeur (contraintes, disponibilités, accès au site, remarques particulières, etc.)"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-[#edf2f7]/40 border-2 border-transparent hover:border-zinc-200 rounded-[14px] px-4 py-3.5 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-xs shadow-sm resize-none h-24"
                    />
                    <p className="text-zinc-400 font-semibold text-[10px] sm:text-[11px] mt-1 leading-normal select-none">
                      Ex : "Disponible après 16h30" — "Accès uniquement le matin" — "Je serai absent le vendredi"
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
                      setProjectMode('vente');
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
                    <span>Remplir avec des données de démonstration</span>
                  </button>

                  <button
                    onClick={() => {
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
                    className="px-8 py-4 bg-[#0f1115] hover:bg-[#1a1e24] text-white rounded-xl font-bold font-heading text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-zinc-900/10 active:scale-98 w-full sm:w-auto text-center"
                  >
                    <span>Valider et continuer vers le contrat</span>
                    <ArrowRight size={14} />
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
                      Détails Techniques
                    </h3>
                    <span className="bg-blue-50/60 text-blue-600 border border-blue-250/30 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest font-mono">
                      {projectMode === 'vente' ? 'Vente' : 'Leasing'}
                    </span>
                  </div>

                  {/* Table specs description */}
                  <div className="space-y-3.5 text-xs font-semibold">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Produit</span>
                      <span className="text-zinc-905 font-black uppercase font-heading text-right">
                        CAISSONS LED EXTRA PLAT SÉRIE
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Quantité</span>
                      <span className="text-zinc-905 font-black font-mono text-right">
                        x{quantity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Dimensions</span>
                      <span className="text-zinc-905 font-black font-mono text-right">
                        {width}m x {height}m
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Surface Totale</span>
                      <span className="text-zinc-905 font-black font-mono text-right">
                        {surface.toFixed(2)} m²
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Détails dalles</span>
                      <span className="text-zinc-905 font-bold font-mono text-right flex items-center gap-1">
                        <span>{dalles} Dalles</span>
                        <span className="text-zinc-400 font-semibold normal-case">(50cm x 50cm)</span>
                      </span>
                    </div>
                    {projectMode === 'location' && (
                      <>
                        <div className="flex border-t border-zinc-100/80 pt-2.5 justify-between items-center text-zinc-400">
                          <span className="font-semibold text-zinc-400">Période de location :</span>
                          <span className="text-zinc-905 font-bold font-mono text-right">
                            {formatFrenchDate(rentalStartDate)} - {formatFrenchDate(rentalEndDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="font-semibold text-zinc-400">Horaires :</span>
                          <span className="text-zinc-905 font-bold font-mono text-right">
                            {rentalStartTime} à {rentalEndTime}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* separator divider */}
                  <div className="border-t border-zinc-100 my-4" />

                  {/* Subtotals breakdowns */}
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Total Ligne</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        {subtotalProducts.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Sous-total produits</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        {subtotalProducts.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Livraison</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        {deliveryFee.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Installation</span>
                      <span className="text-zinc-800 font-bold font-mono">
                        {isInstallationIncluded ? `${installationFee.toLocaleString('fr-FR')} €` : '0 €'}
                      </span>
                    </div>
                  </div>

                  {/* Total estimé box with soft blue tint */}
                  <div className="p-4 sm:p-5 bg-blue-50/50 border border-blue-100/80 rounded-2xl flex items-center justify-between shadow-xs mt-4 select-none">
                    <span className="text-xs font-black text-zinc-700 tracking-wider font-heading uppercase">
                      Total estimé (TTC)
                    </span>
                    <span className="text-2xl font-mono font-black text-blue-600">
                      {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
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
                        <h3 className="font-extrabold text-zinc-950 text-sm uppercase tracking-wide">Installation</h3>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Recommandé</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-medium">Souhaitez-vous inclure l'installation par nos techniciens ?</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs font-semibold">
                    {/* Option 1: Yes, include installation */}
                    <button 
                      type="button"
                      onClick={() => setIsInstallationIncluded(true)}
                      className={`w-full text-left block border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                        isInstallationIncluded 
                          ? 'border-blue-600 bg-blue-50/10 shadow-xs' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-950 text-sm block">Oui, inclure l'installation</span>
                          <span className="text-zinc-500 font-medium text-xs block">Nos experts s'occupent de tout.</span>
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
                          <p>Pour une surface totale de <strong className="text-zinc-955 font-black">{surface.toFixed(2)} m²</strong>, votre projet nécessite <strong className="text-zinc-955 font-black">{techniciansCount} technicien(s)</strong>.</p>
                          <p className="text-sm font-black text-zinc-955 mt-2">Coût : {installationFee.toLocaleString('fr-FR')} €</p>
                        </div>
                      )}
                    </button>

                    {/* Option 2: No, I do it myself */}
                    <button 
                      type="button"
                      onClick={() => setIsInstallationIncluded(false)}
                      className={`w-full text-left block border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                        !isInstallationIncluded 
                          ? 'border-blue-600 bg-blue-50/10 shadow-xs' 
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-zinc-955 text-sm block">Non, je m'en occupe</span>
                          <span className="text-zinc-500 font-medium text-xs block">Vous gérez l'installation vous-même.</span>
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
                          <span className="text-red-700 font-black text-xs uppercase tracking-wider block">Attention</span>
                          <p className="text-red-650 font-semibold leading-relaxed text-[11px]">
                            L'entreprise <strong className="font-extrabold">PIXIATECH</strong> décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* STEP 2: CONTRAT D'AFFICHAGE (Sleek document viewing, high contrast right sidebar summary) */}
        {currentStep === 'contrat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Scrollable contract window & tactical card signature */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
                    Étape 2 sur 4 • Validation
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-zinc-900">
                    {projectMode === 'vente' ? "Contrat de vente d'affichage" : "Contrat de location d'affichage"}
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
                        <span>
                          J'accepte que ces données soient conservées et traitées dans le cadre de ma demande, et de la démarche commerciale qui en découle, conformément aux mentions légales.
                        </span>
                      ) : (
                        <span>
                          Je reconnais avoir lu et accepté les <strong className="text-zinc-900 font-semibold">Conditions Générales de Location</strong>. Je certifie que les informations fournies sont exactes et je m'engage à respecter les termes du contrat.
                        </span>
                      )}
                    </span>
                  </label>
                </div>

                {/* Tactile digital signature pad */}
                {projectMode === 'location' && (
                  <div 
                    id="signature-pad-block"
                    className={`pt-4 border-t border-zinc-100 transition-all ${
                      showErrorTips && !isSignatureValidated ? 'animate-shake' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                      <h4 className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-widest text-zinc-900">
                        Signature du contrat numérique
                      </h4>
                    </div>

                    <SignaturePad
                      isValidated={isSignatureValidated}
                      onSave={(dataUrl) => {
                        if (!acceptedCgl) {
                          alert("Veuillez d'abord déclarer accepter les conditions de traitement.");
                          setShowErrorTips(true);
                          return;
                        }
                        setSignatureDataUrl(dataUrl);
                        setIsSignatureValidated(true);
                        setShowErrorTips(false);
                        // Signature successfully saved. User will now use the button below to manually proceed.
                      }}
                      onClear={() => {
                        setSignatureDataUrl(null);
                        setIsSignatureValidated(false);
                      }}
                    />

                    <div className="text-center mt-3 text-[10px] text-zinc-400 font-mono">
                      Votre signature sera certifiée numériquement par PandaDoc — valeur juridique contractuelle
                    </div>

                  </div>
                )}

                {/* Step 2 Bottom Navigation - Premium corporate spacing */}
                <div className="mt-8 pt-6 border-t border-zinc-150 flex flex-col sm:flex-row-reverse justify-between gap-4 select-none">
                  <button
                    id="btn-goto-security"
                    type="button"
                    onClick={() => {
                      if (!acceptedCgl) {
                        setShowErrorTips(true);
                        alert(projectMode === 'vente' ? "Veuillez d'abord déclarer accepter les conditions de traitement." : "Veuillez d'abord déclarer accepter les conditions générales.");
                        return;
                      }
                      if (projectMode === 'location' && !isSignatureValidated) {
                        setShowErrorTips(true);
                        alert("Veuillez d'abord signer et enregistrer votre signature numérique ci-dessus.");
                        return;
                      }
                      // Proceed to security code stage manually and elegantly
                      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setSentOtpCode(randomCode);
                      setOtpTimeLeft(597);
                      setOtpError(null);
                      setInputOtpCode('');
                      setCurrentStep('securite');
                      sendRealEmail(randomCode);
                    }}
                    className={`px-8 py-4 rounded-xl font-bold font-heading text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 text-center w-full sm:w-auto ${
                      acceptedCgl && (projectMode === 'vente' || isSignatureValidated)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                        : 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Continuer vers la vérification</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('informations')}
                    className="px-6 py-4 bg-white hover:bg-zinc-50 text-zinc-650 font-bold border border-zinc-205 hover:border-zinc-300 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-center w-full sm:w-auto shadow-sm"
                  >
                    <ArrowLeft size={14} />
                    <span>Corriger les données d'estimation</span>
                  </button>
                </div>

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
                      Pack & Récapitulatif
                    </span>
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider mt-0.5">
                      Sélection & Tarification
                    </h3>
                  </div>
                  <span className="bg-blue-600/10 text-blue-400 border border-blue-600/30 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                    {projectMode === 'vente' ? 'Vente Définitive' : 'Leasing Mensuel'}
                  </span>
                </div>

                {/* Pack Selection Detail Row */}
                <div className="flex gap-4.5 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 select-none">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center font-heading font-black text-xs text-blue-400 shrink-0">
                    <span className="text-[9px] leading-tight text-zinc-500 font-mono font-normal">Taille</span>
                    <span className="text-[11px] leading-tight mt-0.5">{surface.toFixed(1)}m²</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{activePack.name}</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 select-none leading-relaxed line-clamp-2">
                      {activePack.description}
                    </p>
                  </div>
                </div>

                {/* Technical checkmarks included */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-950/40 p-3 rounded-xl text-[10px] text-zinc-400 leading-normal border border-zinc-800/30 select-none">
                  <div className="flex items-start gap-1.5">
                    <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>Logistique Pixiatech</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>Dossier homologué</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>Garantie Pro</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check size={11} className="text-blue-400 shrink-0 mt-0.5 stroke-[2.5]" />
                    <span>Support Technique</span>
                  </div>
                </div>

                {/* Cohesive Financial Recap */}
                <div className="space-y-3.5 text-xs font-sans pt-1">
                  
                  {projectMode === 'vente' ? (
                    <>
                      <div className="flex justify-between items-center bg-zinc-900/30 px-3 py-2 rounded-lg leading-normal">
                        <span className="text-zinc-400">Montant d'achat global :</span>
                        <strong className="text-blue-400 font-mono text-[14px] sm:text-base font-black whitespace-nowrap">
                          {totalAmount.toLocaleString('fr-FR')}€ TTC
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">Acompte à la commande (60%) :</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          {Math.round(totalAmount * 0.6).toLocaleString('fr-FR')}€ TTC
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">Solde avant livraison (40%) :</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          {Math.round(totalAmount * 0.4).toLocaleString('fr-FR')}€ TTC
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center bg-zinc-900/30 px-3 py-2 rounded-lg leading-normal">
                        <span className="text-zinc-400">Premier règlement (Loyer + Caution) :</span>
                        <strong className="text-blue-400 font-mono text-[14px] sm:text-base font-black whitespace-nowrap">
                          {(activePack.price + activePack.deposit).toLocaleString('fr-FR')}€ TTC
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">Prélèvements mensuels réguliers :</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          {activePack.price.toLocaleString('fr-FR')}€ TTC/mois
                        </strong>
                      </div>
                      <div className="flex justify-between items-center leading-normal">
                        <span className="text-zinc-400">Caution de garantie (Restituée) :</span>
                        <strong className="text-white font-mono text-[13px] font-bold whitespace-nowrap">
                          {activePack.deposit.toLocaleString('fr-FR')}€ TTC
                        </strong>
                      </div>
                    </>
                  )}

                </div>

                {/* Subtitle notes */}
                <div className="text-[9px] text-zinc-500 font-sans tracking-wide leading-normal text-center pt-2 border-t border-zinc-900 select-none">
                  TVA légale de 20% entièrement incluse. Devis et contrat juridiques générés.
                </div>

                {/* Dynamic Configuration button inside the merged card */}
                <button
                  onClick={() => setCurrentStep('informations')}
                  className="w-full text-center py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl tracking-wide cursor-pointer transition-all active:scale-98"
                >
                  Changer de dimensions ou de pack LED
                </button>
              </div>

              {/* Dynamic Product Mockup Gallery ("Caissons LED Série Extra Plat") */}
              <div className="space-y-3 px-1">
                <div className="flex items-center gap-2 select-none">
                  <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
                  <h4 className="text-[10px] font-heading font-black tracking-wider uppercase text-zinc-500">
                    Série Extra Plat • Matériel ({quantity} produit{quantity > 1 ? 's' : ''})
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
                  {Array.from({ length: quantity }).map((_, index) => (
                    <div 
                      key={index}
                      className="bg-white border border-[#e2e8f0] hover:border-zinc-300 rounded-[20px] p-3 shadow-sm space-y-2.5 transition-all relative overflow-hidden group select-none"
                    >
                      {/* Badge with panel index */}
                      <span className="absolute top-2.5 left-2.5 bg-zinc-950/95 border border-zinc-800 text-[8px] font-mono font-bold text-white px-2 py-0.5 rounded-full z-10 shadow">
                        ÉCRAN {index + 1}
                      </span>
                      
                      {/* Visual screen rendering */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200/80 shadow-inner flex items-center justify-center">
                        <img 
                          src={ledCabinetImg} 
                          alt={`Matériel Caisson LED Série Extra Plat ${index + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500 opacity-95"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      {/* Description Metadata specs */}
                      <div className="flex justify-between items-center text-[11px] pt-0.5">
                        <div>
                          <strong className="text-zinc-900 block font-black text-[11px] uppercase leading-none">
                            Caisson LED Multi-Série
                          </strong>
                          <span className="text-zinc-500 font-bold font-mono text-[10px] block mt-1.5 leading-none">
                            {width}m x {height}m ({surface.toFixed(2)} m²)
                          </span>
                        </div>
                        <span className="text-[8px] bg-blue-50/80 text-blue-600 border border-blue-100 font-extrabold uppercase rounded-md px-2 py-0.5 tracking-wider font-mono">
                          {projectMode.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation button banner hint */}
              {!isSignatureValidated && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 border-dashed text-amber-900 rounded-xl text-center text-xs font-semibold leading-normal">
                  Veuillez accepter les conditions générales de location/vente puis dessiner votre signature numérique pour continuer le dossier.
                </div>
              )}

            </div>

          </div>
        )}

        {/* STEP 3: VÉRIFICATION DE SÉCURITÉ & SIMULATED EMAIL INBOX (A dual layout masterpiece) */}
        {currentStep === 'securite' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Left Hand: High security validation page (Écran 4) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest block flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-550" />
                  Espace hautement sécurisé • Étape 3 sur 4
                </span>
                
                {/* Visual Title matched in font hierarchy, weight, and size to confirmation screen */}
                <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-zinc-900 leading-[1.15]">
                  Vérification de <br />
                  <span className="text-blue-600">sécurité PixiaTech</span>
                </h1>
                
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans mt-1">
                  Nous avons envoyé un code de sécurité à votre adresse e-mail. Consultez votre boîte de réception puis cliquez sur le lien reçu. Pensez également à vérifier vos courriers indésirables.
                </p>
              </div>

              {/* Delivery Status Banner */}
              <div className="space-y-3">
                {emailDeliveryStatus === 'sending' && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-900 shadow-sm animate-pulse">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="text-xs font-semibold leading-normal">
                      <span className="font-extrabold block text-blue-850">✈️ Transmission sécurisée en cours...</span>
                      Envoi d'un e-mail de sécurité à l'adresse <strong className="font-black text-blue-950">{renterDetails.email}</strong>.
                    </div>
                  </div>
                )}
                
                {emailDeliveryStatus === 'sent' && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-250/60 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-sm animate-fade-in">
                    <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-normal font-sans">
                      <span className="font-black uppercase tracking-wide text-emerald-800 text-[10px] block mb-0.5">E-mail Réel Transmis !</span>
                      Un e-mail de sécurité contenant votre code d'accès unique a été envoyé à l'adresse <strong className="font-black text-emerald-950 font-mono">{renterDetails.email}</strong> via SMTP. Consultez votre messagerie pour récupérer le code et valider l'accès. (Pensez à regarder vos spams).
                    </div>
                  </div>
                )}

                {emailDeliveryStatus === 'simulated' && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 shadow-sm animate-fade-in animate-shake">
                    <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-normal font-sans">
                      <span className="font-black uppercase tracking-wide text-blue-800 text-[10px] block mb-0.5">Note de simulation</span>
                      Aucun serveur SMTP n'étant configuré en environnement local, la livraison a été simulée localement pour tester le flux de démonstration. Utilisez le code temporaire d'accès sécurisé suivant : <strong className="font-black text-blue-950 text-sm tracking-wider font-mono bg-blue-100/50 px-1.5 py-0.5 rounded">{sentOtpCode}</strong>.
                    </div>
                  </div>
                )}
                
                {emailDeliveryStatus === 'failed' && (
                  <div className="p-4 bg-red-450/10 border border-red-200 rounded-2xl flex items-start gap-3 text-red-950 shadow-sm animate-fade-in animate-shake">
                    <AlertTriangle size={18} className="text-red-650 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-normal font-sans">
                      <span className="font-black uppercase tracking-wide text-red-800 text-[10px] block mb-0.5">Échec de transmission SMTP</span>
                      Le serveur local n'a pas pu émettre le courrier via SMTP. Veuillez vérifier les variables de configuration SMTP enregistrées sur vos variables de secrets de projet puis relancer l'estimation. En attendant, vous pouvez valider le flux en renseignant le code de secours de simulation : <strong className="font-bold py-0.5 px-1.5 bg-red-50 text-red-900 font-mono rounded">{sentOtpCode}</strong>.
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
                    <h4 className="text-xs font-bold text-zinc-900 font-heading">La validation automatique n'a pas fonctionné ?</h4>
                    <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">Saisissez le code reçu par e-mail dans les slots de vérification.</span>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-105 flex items-center justify-center text-blue-600 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 font-heading">Délai de session</h4>
                    <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">Le code envoyé est valide pour les 10 prochaines minutes.</span>
                  </div>
                </div>

                <button
                  onClick={handlePrevStep}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-650 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start"
                >
                  <ArrowLeft size={13} />
                  <span>Retour au contrat</span>
                </button>
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
                    <span>Code d'accès copié automatiquement dans le presse-papier !</span>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    {isSimulatingLinkClick ? 'Validation du lien...' : 'Verification'}
                  </h3>
                  {isSimulatingLinkClick ? (
                    <div className="text-xs text-blue-600 font-black flex items-center justify-center gap-2 animate-pulse py-1">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                      <span>Vérification et connexion sécurisée de votre lien en cours...</span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Entrez le code à 6 chiffres envoyé sur votre appareil de confiance.
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
                    maxLength={6}
                    disabled={isSimulatingLinkClick || isOtpCompleted}
                    value={inputOtpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputOtpCode(val);
                      setOtpError(null);
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
                              ? 'bg-white border-blue-500 ring-4 ring-blue-500/10 text-zinc-900 scale-102 font-extrabold'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {character}
                        </div>
                      );
                    })}
                  </div>

                </div>

                {inputOtpCode.length > 0 && !isOtpCompleted && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputOtpCode('');
                      setOtpError(null);
                      hiddenInputRef.current?.focus();
                    }}
                    className="text-xs font-black text-zinc-650 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200 transition-all flex items-center justify-center gap-1.5 mx-auto bg-zinc-100/80 border border-zinc-200/80 rounded-xl px-4 py-2 cursor-pointer shadow-xs uppercase tracking-wider"
                  >
                    <RotateCcw size={12} className="stroke-[2.5]" />
                    <span>Réinitialiser / Clear</span>
                  </button>
                )}

                {/* Countdown display */}
                <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-medium">
                  <Clock size={12} />
                  <span>Le code de validation expirera dans </span>
                  <span className="font-mono font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded leading-none">
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
                    <span>L'identité a été validée avec succès !</span>
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
                    <span>Valider</span>
                    <ArrowRight size={12} className="stroke-[2.5]" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 items-center justify-center pt-1">
                  {otpResent && (
                    <div className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-xl animate-bounce flex items-center gap-1">
                      <CheckCircle size={10} className="text-emerald-600" />
                      <span>Simulé : Nouveau code expédié ({sentOtpCode}) !</span>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-4 text-[10px]">
                    <button 
                      onClick={handleResendCode}
                      disabled={isSimulatingLinkClick || isOtpCompleted}
                      className="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:opacity-40"
                    >
                      Code non reçu ? Renvoyer le code
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 text-[8px] tracking-widest text-zinc-400 font-mono">
                  ACCÈS RÉSERVÉ À L'ADMINISTRATION PIXIATECH
                </div>

              </div>

            </div>

          </div>
        )}

        {/* STEP 4: CONFIRMATION & FÉLICITATIONS (Beautiful final dashboard validation) */}
        {currentStep === 'confirmation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fade-in py-2">
            
            {/* Left Column: Success titles and descriptions (Écran 5 left) */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-6">
              
              <div className="space-y-6">
                
                {/* Badge layout */}
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-mono text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  <Shield size={12} />
                  <span>Espace Administrateur</span>
                </div>

                {/* Dark circular checkmark badge */}
                <div className="w-14 h-14 bg-zinc-950 text-white rounded-[18px] flex items-center justify-center shadow-md">
                  <Check size={26} className="stroke-[3]" />
                </div>

                {/* Huge typo layout as requested */}
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-zinc-900 leading-[1.08] uppercase">
                    Félicitations <br />
                    <span className="text-blue-600 block lowercase normal-case">votre projet est prêt.</span>
                  </h1>
                  
                  {/* Detailed message matching Image 5 */}
                  <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans max-w-lg mt-3 space-y-3">
                    <p>Votre estimation a été générée avec succès.</p>
                    <p>Vous pouvez dès maintenant consulter ou télécharger votre estimation au format PDF.</p>
                    <p>Merci de votre confiance et d’avoir choisi Pixiatech. Nous sommes ravis de vous accompagner dans la réalisation de votre projet.</p>
                  </div>
                </div>

              </div>

              {/* Confirm actions buttons layout */}
              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                
                <button
                  type="button"
                  onClick={() => {
                    setIsSignatureValidated(false);
                    setSignatureDataUrl(null);
                    setAcceptedCgl(false);
                    setInputOtpCode('');
                    setIsOtpCompleted(false);
                    setCurrentStep('informations');
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span>Créer un nouveau devis</span>
                </button>

                <button
                  type="button"
                  onClick={handleContractDownload}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-zinc-50 text-zinc-700 font-bold border border-zinc-200 text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} className="text-blue-600" />
                  <span>Télécharger PDF</span>
                </button>

              </div>

            </div>

            {/* Right Column: details and product graphics layout (Écran 5 right) */}
            <div className="lg:col-span-5 flex flex-col">
              
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm flex-1 flex flex-col justify-between space-y-5">
                
                <div className="space-y-4">
                  {/* Title of details */}
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-heading">
                      Détails Techniques
                    </span>
                    <span className="bg-blue-50 text-blue-650 border border-blue-200 text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                      Série Extra Plat
                    </span>
                  </div>

                  {/* Calculations card lists */}
                  <div className="space-y-2 text-xs font-bold font-mono">
                    
                    <div className="flex justify-between text-zinc-500 py-0.5 font-sans">
                      <span>Dimensions d'écran :</span>
                      <span className="text-zinc-900 font-mono">{width}m x {height}m</span>
                    </div>

                    <div className="flex justify-between text-zinc-500 py-0.5 font-sans">
                      <span>Surface totale d'affichage :</span>
                      <span className="text-zinc-900 font-mono">{surface.toFixed(2)} m²</span>
                    </div>

                    <div className="flex justify-between text-zinc-500 py-0.5 font-sans">
                      <span>Composants dalles LED :</span>
                      <span className="text-zinc-900 font-mono">{dalles} modules</span>
                    </div>

                    <div className="flex justify-between text-zinc-500 py-0.5 font-sans border-t border-zinc-100 pt-2 font-semibold">
                      <span>Loyer mensuel :</span>
                      <span className="text-zinc-950 font-mono">{(projectMode === 'vente' ? 0 : activePack.price).toLocaleString('fr-FR')} € TTC</span>
                    </div>

                    <div className="flex justify-between text-zinc-500 py-0.5 font-sans pb-1 font-semibold">
                      <span>Dépôt de garantie :</span>
                      <span className="text-zinc-950 font-mono">{(projectMode === 'vente' ? totalAmount : activePack.deposit).toLocaleString('fr-FR')} € TTC</span>
                    </div>

                    {projectMode === 'location' && (
                      <>
                        <div className="flex justify-between text-zinc-500 py-0.5 border-t border-zinc-100 pt-2 font-sans font-semibold">
                          <span>Période de location :</span>
                          <span className="text-zinc-950 font-mono">{formatFrenchDate(rentalStartDate)} - {formatFrenchDate(rentalEndDate)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500 py-0.5 font-sans font-semibold">
                          <span>Horaires :</span>
                          <span className="text-zinc-950 font-mono">{rentalStartTime} à {rentalEndTime}</span>
                        </div>
                      </>
                    )}

                  </div>

                  {/* High contrast calculated blue total capsule */}
                  <div className="bg-blue-50 border border-blue-105 rounded-xl p-4 flex justify-between items-center shadow-inner">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase font-sans">Total Estimé :</span>
                    <span className="text-lg font-mono font-black text-blue-600">
                      {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>

                {/* Vector graphics drawing representing high-poly LED screens in violet/indigo hue card (Perfect aesthetic matching) */}
                <div className="relative w-full h-36 bg-gradient-to-br from-indigo-800 via-purple-900 to-[#3b0764] rounded-2xl border border-purple-500/20 shadow-inner overflow-hidden flex items-center justify-center">
                  
                  {/* Technical circular nodes overlay grid */}
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                  
                  <div className="relative z-10 flex gap-4 select-none pointer-events-none items-center">
                    
                    {/* Screen panel left */}
                    <div className="w-24 h-24 bg-zinc-950 rounded-lg border border-purple-400/30 shadow-lg flex flex-col justify-between overflow-hidden relative">
                      {/* Interactive glowing abstract wallpaper */}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 opacity-80 blur-0"></div>
                      <div className="relative z-10 p-1.5 flex flex-col justify-between h-full">
                        <span className="text-[6px] font-bold text-white font-mono leading-none tracking-widest uppercase">PIXIA SCREEN</span>
                        <div className="w-full flex justify-between text-[5px] text-white/50">
                          <span>78.0m²</span>
                          <span>ACTIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Hardware panel back side right */}
                    <div className="w-24 h-24 bg-[#0a0614] rounded-lg border border-purple-500/40 shadow-lg p-2 flex flex-col justify-between relative overflow-hidden">
                      {/* Back chassis grids simulation */}
                      <div className="absolute inset-x-2 top-2 bottom-2 grid grid-cols-4 gap-1 opacity-20">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="bg-purple-500 rounded-sm"></div>
                        ))}
                      </div>
                      <span className="text-[5px] font-mono text-purple-400 font-bold z-10 uppercase tracking-widest">Rear Chassis</span>
                      
                      <div className="flex gap-1.5 items-center z-10">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[5px] font-mono text-zinc-400">Power OK</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Primary footer bottom credits & links */}
      <footer className="w-full bg-white border-t border-[#e2e8f0] py-6 px-4 text-center mt-auto space-y-3 shadow-inner">
        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400 font-semibold uppercase tracking-wider">
          <a href="https://pixiatech.com/gestion-cookies/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Sécurité</a>
          <span>•</span>
          <a href="https://pixiatech.com/politique-confidentialite/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Conditions</a>
          <span>•</span>
          <a href="https://pixiatech.com/mentions-legales/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Politique</a>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono tracking-widest">
          ACCÈS RÉSERVÉ À L'ADMINISTRATION PIXIATECH | @ 2026 PIXIA TECH. TOUS DROITS RÉSERVÉS.
        </div>
      </footer>

    </div>
  );
}
