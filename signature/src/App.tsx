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
  RotateCcw
} from 'lucide-react';
import { Pack, RenterDetails, Step, StepId } from './types';
import SignaturePad from './components/SignaturePad';
import ContractDocument from './components/ContractDocument';

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
  // Stepper representation showing cohesive steps
  const [currentStep, setCurrentStep] = useState<StepId>('informations');
  
  // Custom screen dimensions (Image 1 prefilled layout: 12m x 6.5m = 78m² / 312 dalles)
  const [width, setWidth] = useState<number>(12);
  const [height, setHeight] = useState<number>(6.5);
  
  // Project Mode: Vente (Purchase) vs Location (Lease)
  const [projectMode, setProjectMode] = useState<'vente' | 'location'>('vente');

  // Quantity of screens ordered
  const [quantity, setQuantity] = useState<number>(1);

  // Contact details pre-filled to match Image 1
  const [renterDetails, setRenterDetails] = useState<RenterDetails>({
    company: 'Pixia Tech Europe',
    representative: 'Ayanhil 103',
    address: 'Palais des Congrès, Paris',
    postcode: '75017',
    city: 'Paris',
    email: 'contact@pixiatech.com',
    phone: '+33 1 23 45 67 89'
  });

  const [eventDate, setEventDate] = useState<string>('2026-06-15');
  const [additionalNotes, setAdditionalNotes] = useState<string>(
    "Merci de préciser l'environnement d'installation, afin que nous vous proposions la solution la plus adaptée."
  );

  // Selected city and installation states
  const [selectedCityId, setSelectedCityId] = useState<string>('1'); // Default to Paris (id: '1')
  const [citySearchQuery, setCitySearchQuery] = useState<string>('Paris');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [isInstallationIncluded, setIsInstallationIncluded] = useState<boolean>(true);
  const [isInstallationAccordionOpen, setIsInstallationAccordionOpen] = useState<boolean>(true);

  // Selected pack ID for template reference
  const [selectedPackId, setSelectedPackId] = useState<string>('pack-s');
  
  // Signature management
  const [acceptedCgl, setAcceptedCgl] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureValidated, setIsSignatureValidated] = useState<boolean>(false);
  
  // Security OTP Code management (Image 3 utilizes 842903)
  const [sentOtpCode, setSentOtpCode] = useState<string>('842903');
  const [inputOtpCode, setInputOtpCode] = useState<string>('');
  const [isOtpCompleted, setIsOtpCompleted] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(597); // 9 minutes 57s (matching 09:57 in screenshot)
  const [isSimulatingLinkClick, setIsSimulatingLinkClick] = useState<boolean>(false);
  const [showEmailPulse, setShowEmailPulse] = useState<boolean>(false);
  const [showErrorTips, setShowErrorTips] = useState<boolean>(false);
  const [otpResent, setOtpResent] = useState<boolean>(false);

  // Hidden Input ref for smooth 6-box input focus/click handling
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Real email sender using our local Express API
  const sendRealEmail = async (code: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: renterDetails.email,
          subject: "🔑 Votre code de vérification PixiaTech Pro",
          code,
          companyName: renterDetails.company,
          clientName: renterDetails.representative,
          totalAmount: (projectMode === 'vente' ? totalAmount : activePack.price + activePack.deposit).toLocaleString('fr-FR'),
          details: `${width}m x ${height}m (${surface.toFixed(2)}m²) - ${activePack.name}`
        }),
      });
      const data = await response.json();
      console.log("Real SMTP send email response:", data);
    } catch (e) {
      console.error("Failed to call SMTP send-email API:", e);
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
  const deliveryFee = 100;
  
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
    if (currentStep === 'securite' && otpTimeLeft > 0 && !isOtpCompleted) {
      timer = setInterval(() => {
        setOtpTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, otpTimeLeft, isOtpCompleted]);

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
      // Re-initialize security validation code
      setSentOtpCode('842903');
      setOtpTimeLeft(597);
      setOtpError(null);
      setInputOtpCode('');
      setCurrentStep('securite');
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
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Shield size={18} className="stroke-[2.5]" />
            </div>
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
        <div className="w-full bg-white border-b border-[#e2e8f0] py-4.5 px-4 overflow-x-auto select-none">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-1.5 sm:gap-4 md:gap-6 min-w-[620px] px-2">
            {steps.map((st, index) => {
              const active = st.isActive;
              const completed = st.isCompleted;
              return (
                <React.Fragment key={st.id}>
                  {index > 0 && (
                    <div 
                      className={`h-[2px] w-8 sm:w-16 md:w-24 transition-all duration-300 ${
                        completed || active ? 'bg-blue-650' : 'bg-zinc-200'
                      }`}
                    />
                  )}
                  <div className="flex flex-col items-center">
                    <button
                      id={`stepper-btn-${st.id}`}
                      disabled={!completed && st.id !== currentStep}
                      onClick={() => {
                        if (st.id === 'informations' || st.id === 'contrat' || st.id === 'securite') {
                          setCurrentStep(st.id);
                        }
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        active 
                          ? 'bg-zinc-950 text-white shadow-lg ring-4 ring-blue-100 scale-105' 
                          : completed
                          ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm cursor-pointer hover:bg-zinc-800'
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      {st.id === 'informations' && <LayoutGrid size={18} className="stroke-[2.5]" />}
                      {st.id === 'contrat' && <Truck size={18} className="stroke-[2.5]" />}
                      {st.id === 'securite' && <Wrench size={18} className="stroke-[2.5]" />}
                      {st.id === 'confirmation' && <Calculator size={18} className="stroke-[2.5]" />}
                    </button>
                    <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 transition-all text-center max-w-[125px] ${active ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                      {st.label}
                    </span>
                    {/* Blue horizontal indicator line */}
                    <div className="h-1 w-8 rounded-full mt-2 transition-all duration-300">
                      {active && <div className="h-full w-full bg-blue-600 rounded-full"></div>}
                    </div>
                  </div>
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
            
            {/* Centered header icon, title, and subtitle matching Image 1 */}
            <div className="flex flex-col items-center text-center pb-4 select-none">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center text-blue-600 mb-2.5 shadow-sm">
                <Shield size={28} className="stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-zinc-900">
                Récapitulatif d'Estimation
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
                Vérifiez les détails avant l'envoi
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Hand: contact form parameters */}
              <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-[24px] p-6 sm:p-10 shadow-sm space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Entity Company name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-name" className="font-extrabold text-zinc-650 uppercase tracking-wide text-[10px]">Nom de l'entreprise</label>
                    <input
                      id="comp-name"
                      type="text"
                      value={renterDetails.company}
                      onChange={(e) => setRenterDetails({ ...renterDetails, company: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm"
                    />
                  </div>

                  {/* Corporate professional email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-email" className="font-extrabold text-zinc-655 uppercase tracking-wide text-[10px]">Email professionnel</label>
                    <input
                      id="comp-email"
                      type="email"
                      value={renterDetails.email}
                      onChange={(e) => setRenterDetails({ ...renterDetails, email: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm"
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-phone" className="font-extrabold text-zinc-650 uppercase tracking-wide text-[10px]">Téléphone</label>
                    <input
                      id="comp-phone"
                      type="text"
                      value={renterDetails.phone}
                      onChange={(e) => setRenterDetails({ ...renterDetails, phone: e.target.value })}
                      className="w-full bg-[#f8fafc] border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm"
                    />
                  </div>

                  {/* Ville de livraison (Combobox custom premium) */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="font-extrabold text-[#2563eb] uppercase tracking-wide text-[10px] flex items-center gap-1">
                      <span>Ville de livraison</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-mono font-bold uppercase">combobox</span>
                    </label>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <Search size={14} />
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
                        className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl pl-9 pr-10 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

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
                                // Expand installation accordion automatically on city selection!
                                setIsInstallationAccordionOpen(true);
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
                    <label htmlFor="comp-address" className="font-extrabold text-zinc-650 uppercase tracking-wide text-[10px]">Adresse de l'événement</label>
                    <input
                      id="comp-address"
                      type="text"
                      value={renterDetails.address}
                      onChange={(e) => setRenterDetails({ ...renterDetails, address: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm"
                    />
                  </div>

                  {/* Large textbox notes */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-notes" className="font-extrabold text-zinc-650 uppercase tracking-wide text-[10px]">Notes additionnelles</label>
                    <textarea
                      id="comp-notes"
                      rows={3}
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm resize-none h-24"
                    />
                  </div>

                </div>

                {/* Installation Preference Accordion (Image 1 and 2 centerpiece) */}
                <div className="border border-zinc-200 rounded-[24px] bg-zinc-50/20 overflow-hidden shadow-sm transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setIsInstallationAccordionOpen(!isInstallationAccordionOpen)}
                    className="w-full text-left px-5 sm:px-6 py-4.5 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Layers size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-zinc-900 text-sm">Installation</h3>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Recommandé</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium">Souhaitez-vous inclure l'installation par nos techniciens ?</p>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${isInstallationAccordionOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {isInstallationAccordionOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 bg-white space-y-4 animate-fade-in text-xs font-semibold">
                      
                      {/* Option 1: Yes, include installation */}
                      <button 
                        type="button"
                        onClick={() => setIsInstallationIncluded(true)}
                        className={`w-full text-left block border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          isInstallationIncluded 
                            ? 'border-blue-600 bg-blue-50/15 shadow-sm' 
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-zinc-900 text-sm block">Oui, inclure l'installation</span>
                            <span className="text-zinc-500 font-medium text-xs block">Nos experts s'occupent de tout.</span>
                          </div>
                          
                          <div className="pt-1.5">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isInstallationIncluded ? 'border-blue-600' : 'border-zinc-300'
                            }`}>
                              {isInstallationIncluded && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                            </div>
                          </div>
                        </div>

                        {isInstallationIncluded && (
                          <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1 text-zinc-800 font-semibold animate-fade-in text-xs">
                            <p>Pour une surface totale de <strong className="text-zinc-900 font-black">{surface.toFixed(2)} m²</strong>, votre projet nécessite <strong className="text-zinc-900 font-black">{techniciansCount} technicien(s)</strong>.</p>
                            <p className="text-sm font-extrabold text-zinc-900 mt-2">Coût : {installationFee.toLocaleString('fr-FR')} €</p>
                          </div>
                        )}
                      </button>

                      {/* Option 2: No, I do it myself */}
                      <button 
                        type="button"
                        onClick={() => setIsInstallationIncluded(false)}
                        className={`w-full text-left block border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          !isInstallationIncluded 
                            ? 'border-blue-600 bg-blue-50/15 shadow-sm' 
                            : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-zinc-900 text-sm block">Non, je m'en occupe</span>
                            <span className="text-zinc-500 font-medium text-xs block">Vous gérez l'installation vous-même.</span>
                          </div>
                          
                          <div className="pt-1.5">
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
                        <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-in shadow-sm select-none">
                          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-red-700 font-extrabold text-xs uppercase tracking-wider block">Attention</span>
                            <p className="text-red-650 font-semibold leading-relaxed text-[11px]">
                              L'entreprise <strong className="font-extrabold">PIXIATECH</strong> décline toute responsabilité en cas de problème lié à une installation non effectuée par ses techniciens.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

                {/* Highly interactive controls to size and test dimensions! */}
                <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100 flex flex-col gap-4 shadow-xs select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 tracking-wide block uppercase font-heading flex items-center gap-1.5">
                      <Layers size={14} className="text-blue-500 stroke-[2.5]" />
                      Ajustement de l'Estimatif (Simulateur 2D)
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 font-bold">
                      {quantity} écran(s) de {width}x{height}m
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Largeur */}
                    <div className="space-y-1.5 bg-white border border-zinc-150 rounded-xl p-2.5">
                      <span className="text-[9px] text-zinc-450 font-extrabold uppercase tracking-wider block">Largeur</span>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setWidth(prev => Math.max(2, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold hover:bg-zinc-100 text-zinc-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >-</button>
                        <span className="text-xs font-extrabold text-zinc-950 font-mono text-center flex-1">{width}m</span>
                        <button 
                          onClick={() => setWidth(prev => Math.min(25, prev + 1))}
                          className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold hover:bg-zinc-100 text-zinc-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >+</button>
                      </div>
                    </div>

                    {/* Hauteur */}
                    <div className="space-y-1.5 bg-white border border-zinc-150 rounded-xl p-2.5">
                      <span className="text-[9px] text-zinc-450 font-extrabold uppercase tracking-wider block">Hauteur</span>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setHeight(prev => Math.max(1.5, prev - 0.5))}
                          className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold hover:bg-zinc-100 text-zinc-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >-</button>
                        <span className="text-xs font-extrabold text-zinc-950 font-mono text-center flex-1">{height.toFixed(1)}m</span>
                        <button 
                          onClick={() => setHeight(prev => Math.min(15, prev + 0.5))}
                          className="w-7 h-7 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center font-bold hover:bg-zinc-100 text-zinc-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >+</button>
                      </div>
                    </div>

                    {/* Quantité */}
                    <div className="space-y-1.5 bg-blue-50/40 border border-blue-150 rounded-xl p-2.5">
                      <span className="text-[9px] text-blue-700 font-extrabold uppercase tracking-wider block">Quantité</span>
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center font-bold hover:bg-blue-105 text-blue-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >-</button>
                        <span className="text-xs font-extrabold text-blue-900 font-mono text-center flex-1">x{quantity}</span>
                        <button 
                          onClick={() => setQuantity(prev => Math.min(100, prev + 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-blue-200 flex items-center justify-center font-bold hover:bg-blue-105 text-blue-700 cursor-pointer active:scale-95 transition-all text-xs"
                        >+</button>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-5 flex flex-col sm:flex-row gap-3 justify-start">
                  <button
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0f1115] hover:bg-zinc-800 text-white rounded-xl font-bold font-heading text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>Envoyer ma demande</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setWidth(12);
                      setHeight(6.5);
                      setProjectMode('vente');
                      setRenterDetails({
                        company: 'Pixia Tech Europe',
                        representative: 'Ayanhil 103',
                        address: 'Palais des Congrès, Paris',
                        postcode: '75017',
                        city: 'Paris',
                        email: 'contact@pixiatech.com',
                        phone: '+33 1 23 45 67 89'
                      });
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-zinc-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-transparent transition-all cursor-pointer active:scale-98"
                  >
                    Modifier l'estimation
                  </button>
                </div>

              </div>

            {/* Right Hand: details and financial board layout (Image 1 right-side) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">

              {/* AJUSTEMENT DE L'ESTIMATIF (SIMULATEUR 2D) (Image 1 top right card) */}
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-5">
                <span className="text-xs font-bold text-blue-600 tracking-wide block uppercase font-heading flex items-center gap-2 select-none">
                  <Layers size={14} className="stroke-[2.5]" />
                  Ajustement de l'Estimatif (Simulateur 2D)
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Largeur de l'écran</span>
                    <div className="flex items-center -space-x-px">
                      <button 
                        onClick={() => setWidth(prev => Math.max(2, prev - 1))}
                        className="w-10 h-10 rounded-l-xl bg-white border border-zinc-200 flex items-center justify-center font-black text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                      >
                        -
                      </button>
                      <div className="flex-1 h-10 border border-zinc-200 flex items-center justify-center font-extrabold text-zinc-900 bg-zinc-50/30 font-mono text-xs select-none">
                        {width}m
                      </div>
                      <button 
                        onClick={() => setWidth(prev => Math.min(25, prev + 1))}
                        className="w-10 h-10 rounded-r-xl bg-white border border-zinc-200 flex items-center justify-center font-black text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">Hauteur de l'écran</span>
                    <div className="flex items-center -space-x-px">
                      <button 
                        onClick={() => setHeight(prev => Math.max(1.5, prev - 0.5))}
                        className="w-10 h-10 rounded-l-xl bg-white border border-zinc-200 flex items-center justify-center font-black text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                      >
                        -
                      </button>
                      <div className="flex-1 h-10 border border-zinc-200 flex items-center justify-center font-extrabold text-zinc-900 bg-zinc-50/30 font-mono text-xs select-none">
                        {height}m
                      </div>
                      <button 
                        onClick={() => setHeight(prev => Math.min(15, prev + 0.5))}
                        className="w-10 h-10 rounded-r-xl bg-white border border-zinc-200 flex items-center justify-center font-black text-zinc-700 hover:bg-zinc-50 hover:text-blue-600 cursor-pointer transition-all active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 border-t border-zinc-100 text-[10px] text-zinc-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={12} className="text-blue-600 shrink-0" />
                    <span>Projet :</span>
                    <div className="flex bg-zinc-100 p-0.5 border border-zinc-200 rounded-lg">
                      <button 
                        onClick={() => setProjectMode('vente')}
                        className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          projectMode === 'vente' 
                            ? 'bg-[#0f1115] text-white shadow-xs' 
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >Achat (Vente)</button>
                      <button 
                        onClick={() => setProjectMode('location')}
                        className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          projectMode === 'location' 
                            ? 'bg-[#0f1115] text-white shadow-xs' 
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >Leasing</button>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono text-right">Cliquer sur les boutons pour modifier le calcul.</span>
                </div>
              </div>
              
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-5">
                
                {/* Visual header */}
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-heading font-bold text-zinc-900 uppercase tracking-wide">
                    Détails Techniques
                  </h3>
                  <span className="bg-blue-50 text-blue-600 border border-blue-105 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                    CAISSONS LED SÉRIE EXTRA PLAT
                  </span>
                </div>

                {/* Table specs description */}
                <div className="grid grid-cols-2 gap-y-2.5 text-xs text-zinc-650 leading-normal font-medium py-1">
                  
                  <div className="text-zinc-400">Dimensions</div>
                  <div className="text-right text-zinc-900 font-bold font-mono">{width}m x {height}m</div>

                  <div className="text-zinc-400">Surface Totale</div>
                  <div className="text-right text-zinc-900 font-bold font-mono">{surface.toFixed(2)} m²</div>

                  <div className="text-zinc-400">Matériel</div>
                  <div className="text-right text-zinc-900 font-bold font-mono">{dalles} Dalles <span className="text-zinc-400 font-normal">(50cm x 50cm)</span></div>

                  <div className="text-[#8e95a5] text-amber-600">État</div>
                  <div className="text-right font-mono font-black text-blue-600 uppercase tracking-wider">{projectMode === 'vente' ? 'Vente' : 'Leasing'}</div>

                </div>

                {/* Subtotals breakdowns */}
                <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Sous-total produits</span>
                    <span className="text-zinc-800 font-mono">{subtotalProducts.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Livraison</span>
                    <span className="text-zinc-800 font-mono">{deliveryFee.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Installation technique</span>
                    <span className="text-zinc-800 font-mono">{installationFee.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>

                {/* Light Blue columns block */}
                <div className="grid grid-cols-2 gap-px bg-blue-100/50 rounded-xl overflow-hidden text-center text-[10px] leading-relaxed border border-blue-100 border-dashed">
                  <div className="bg-blue-50/70 p-3 space-y-0.5 border-r border-blue-100/70">
                    <span className="text-blue-500 uppercase font-bold text-[8px] tracking-wide block font-sans">Dimensions</span>
                    <span className="font-extrabold text-zinc-905 block font-mono">{width}m x {height}m ({surface.toFixed(2)} m²)</span>
                  </div>
                  <div className="bg-blue-50/70 p-3 space-y-0.5">
                    <span className="text-blue-500 uppercase font-bold text-[8px] tracking-wide block font-sans">Composants</span>
                    <span className="font-extrabold text-zinc-905 block font-mono">{dalles} Dalles (50x50cm)</span>
                  </div>
                </div>

                {/* Secondary financial review fields */}
                <div className="border-t border-zinc-100 pt-3.5 space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Prix unitaire matériel</span>
                    <span className="text-zinc-800 font-mono">{subtotalProducts.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Sous-total produits</span>
                    <span className="text-zinc-800 font-mono">{subtotalProducts.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Livraison (standard)</span>
                    <span className="text-zinc-800 font-mono">250,00 €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Installation technique</span>
                    <span className="text-zinc-800 font-mono">100,00 €</span>
                  </div>
                </div>

                {/* Blue warning notice box */}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-normal flex items-start gap-2">
                  <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Pour une surface totale de <strong className="text-blue-950 font-extrabold">{surface.toFixed(2)} m²</strong>, votre projet nécessite <strong>2 technicien(s)</strong>.
                  </p>
                </div>

                {/* Large high contrast Total box */}
                <div className="p-4 bg-blue-550 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-900 font-heading uppercase tracking-wide">Total estimé (TTC)</span>
                  <span className="text-2xl font-mono font-black text-blue-600">
                    {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>

              </div>

            </div>

          </div>
          </div>
        )}

        {/* STEP 2: CONTRAT DE LOCATION D'AFFICHAGE (Sleek document viewing, high contrast right sidebar summary) */}
        {currentStep === 'contrat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            {/* Scrollable contract window & tactical card signature */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-mono">
                    Étape 2 sur 4 • Validation
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-zinc-900">
                    Contrat de location d'affichage
                  </h2>
                </div>
                
                <button
                  onClick={() => setCurrentStep('informations')}
                  className="px-4 py-2 text-xs font-semibold bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-full flex items-center gap-1.5 transition-all self-start cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Corriger les données d'estimation</span>
                </button>
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
                      Je reconnais avoir lu et accepté les <strong className="text-zinc-900 font-semibold">Conditions Générales de Location</strong>. Je certifie que les informations fournies sont exactes et je m'engage à respecter les termes du contrat.
                    </span>
                  </label>
                </div>

                {/* Tactile digital signature pad */}
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
                        alert("Veuillez d'abord déclarer accepter les conditions générales.");
                        setShowErrorTips(true);
                        return;
                      }
                      setSignatureDataUrl(dataUrl);
                      setIsSignatureValidated(true);
                      setShowErrorTips(false);
                      
                      // Auto redirect to security stage immediately
                      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setSentOtpCode(randomCode);
                      setOtpTimeLeft(597);
                      setOtpError(null);
                      setInputOtpCode('');
                      setCurrentStep('securite');
                      sendRealEmail(randomCode);
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

              </div>

            </div>

            {/* Right Hand: items selected review, dark summary financial layout */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                    Pack Sélectionné
                  </span>
                  <span className="bg-blue-50 text-blue-600 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                    Sans Engagement
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center font-heading font-black text-xs text-blue-650 shrink-0">
                    {surface < 10 ? `${Math.round(surface)}m²` : 'LED'}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900">{activePack.name}</h4>
                    <p className="text-[11px] text-zinc-500 italic mt-0.5">{activePack.description}</p>
                  </div>
                </div>

                <div className="space-y-1 bg-zinc-50 p-3 rounded-xl text-[10px] text-zinc-500 font-medium leading-relaxed">
                  <div className="flex items-start gap-1">
                    <Check size={12} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Intégration logistique Pixiatech</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <Check size={12} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Dossier sécurisé et homologué</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep('informations')}
                  className="w-full text-center py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 font-bold text-xs rounded-xl border border-zinc-200 tracking-wide cursor-pointer transition-all"
                >
                  Changer de taille / de pack LED
                </button>
              </div>

              {/* High contrast dark visual summary card */}
              <div className="bg-[#0e1115] border border-zinc-850 rounded-[24px] p-6 shadow-xl space-y-5 text-white">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                    Récapitulatif financier
                  </h3>
                </div>

                <div className="flex gap-3 pb-3 border-b border-zinc-800">
                  <div className="w-12 h-10 bg-[#07080a] border border-zinc-800 rounded flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase">{projectMode === 'vente' ? 'Vente' : 'Lease'}</span>
                  </div>
                  <div className="text-xs font-sans">
                    <strong className="text-white block">{activePack.name}</strong>
                    <span className="text-blue-400 font-semibold">{width}m x {height}m ({surface.toFixed(2)}m²)</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs font-sans pt-1">
                  
                  <div className="flex justify-between items-center leading-normal">
                    <span className="text-zinc-400">Premier règlement (Loyer + Caution) :</span>
                    <strong className="text-blue-400 font-mono text-[13px] sm:text-sm font-extrabold whitespace-nowrap">
                      {(projectMode === 'vente' ? totalAmount : activePack.price + activePack.deposit).toLocaleString('fr-FR')}€ TTC
                    </strong>
                  </div>

                  <div className="flex justify-between items-center leading-normal">
                    <span className="text-zinc-400 text-zinc-400">Puis prélèvements mensuels :</span>
                    <strong className="text-white font-mono text-[13px] sm:text-sm font-bold whitespace-nowrap">
                      {(projectMode === 'vente' ? 0 : activePack.price).toLocaleString('fr-FR')}€ TTC
                    </strong>
                  </div>

                </div>

                <div className="text-[9px] text-zinc-500 font-sans tracking-wide leading-normal text-center pt-2 border-t border-zinc-850">
                  Taxe sur la valeur ajoutée (TVA) 20% légale incluse dans les tarifs TTC affichés.
                </div>
              </div>

              {/* Navigation button banner hint */}
              {!isSignatureValidated && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 border-dashed text-amber-900 rounded-xl text-center text-xs font-semibold leading-normal">
                  Veuillez accepter les CGV puis dessiner votre signature ci-dessus pour être automatiquement redirigé.
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

              {/* Discreet notice info cards on the left of image 4 */}
              <div className="space-y-3.5 pt-1">
                <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 font-heading">La validation automatique n'a pas fonctionné ?</h4>
                    <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">Saisissez le code reçu par e-mail dans les slots de vérification.</span>
                  </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
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

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 font-heading">Verification</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Entrez le code à 6 chiffres envoyé sur votre appareil de confiance.
                  </p>
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

              {/* SIMULATED EMAIL INBOX COMPONENT (Image 3 - Outstanding simulator) */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-zinc-650 tracking-wider block uppercase font-heading flex items-center gap-1">
                    <MailOpen size={12} />
                    Simulateur de Messagerie
                  </span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-full uppercase self-end animate-pulse">
                    Reçu à l'instant
                  </span>
                </div>

                {/* Apple styled beautiful sandbox box */}
                <div 
                  className={`border rounded-[24px] bg-white overflow-hidden shadow-lg transition-all duration-300 ${
                    showEmailPulse ? 'ring-4 ring-blue-500/25 border-blue-400 scale-[1.01]' : 'border-zinc-200'
                  }`}
                  id="sandbox-email-panel"
                >
                  {/* Title mock bar */}
                  <div className="bg-zinc-50 border-b border-zinc-150 px-4 py-2.5 flex justify-between items-center text-zinc-400 text-xs">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
                    </div>
                    <span className="text-[9px] font-mono select-none">Client Webmail Sécurisé</span>
                  </div>

                  {/* Envelope and warning title */}
                  <div className="p-5 border-b border-zinc-100 text-center space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-105 flex items-center justify-center mx-auto">
                      <MailOpen size={18} />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-black font-heading tracking-wide text-zinc-900 uppercase">
                        Authentification
                      </h4>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                        Un code de sécurité est requis pour accéder à votre estimation Pixatech.
                      </p>
                    </div>

                    {/* Clock countdown badge in Email */}
                    <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-105 rounded-full px-3 py-1 text-[10px] text-blue-600 font-bold">
                      <Clock size={11} className="animate-spin-slow" />
                      <span>{formatTime(otpTimeLeft)}</span>
                    </div>
                  </div>

                  {/* Mail Body */}
                  <div className="p-5 space-y-5 text-xs text-zinc-600">
                    
                    {/* Separate Premium Characters digits display (Image 3 centerpiece) */}
                    <div className="space-y-3">
                      <span className="text-[9px] text-zinc-400 uppercase tracking-widest text-center block font-medium">Votre code temporaire d'authentification</span>
                      
                      <div className="flex justify-center gap-2">
                        {sentOtpCode.split('').map((char, index) => (
                          <div 
                            key={index}
                            className="w-10 h-12 bg-blue-50/40 border-2 border-blue-100 text-blue-600 font-extrabold font-mono text-xl rounded-xl flex items-center justify-center shadow-sm"
                          >
                            {char}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center pt-0.5">
                        <button
                          onClick={handleCopyCode}
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-blue-200 shadow-sm"
                        >
                          <Copy size={11} />
                          <span>{isCopied ? "Code copié !" : "Copier le code dans le presse-papier"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Discreet blue warning/info box (Image 3 security update) */}
                    <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-[10px] text-blue-900 leading-relaxed font-sans">
                      <strong>🚨 Information de sécurité :</strong> <br />
                      "Ce code est strictement personnel. Ne le partagez jamais avec un tiers, y compris un collaborateur Pixatec."
                    </div>

                    {/* Auto Connection Action CTA button inside the simulated email body */}
                    <div className="pt-1 text-center space-y-3">
                      
                      <button
                        onClick={handleSimulateEmailConnect}
                        disabled={isOtpCompleted || isSimulatingLinkClick}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer ${
                          isOtpCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-250 cursor-not-allowed'
                            : isSimulatingLinkClick
                            ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01]'
                        }`}
                      >
                        {isOtpCompleted ? (
                          <>
                            <Check size={14} className="stroke-[3]" />
                            <span>Contrat activé automatiquement !</span>
                          </>
                        ) : isSimulatingLinkClick ? (
                          <>
                            <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Récupération automatique...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            <span>Valider et continuer (Lien direct)</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm("Réinitialiser l'estimatif ? Les étapes actuelles seront effacées.")) {
                            setCurrentStep('informations');
                            setIsSignatureValidated(false);
                            setSignatureDataUrl(null);
                            setAcceptedCgl(false);
                            setInputOtpCode('');
                            setIsOtpCompleted(false);
                          }
                        }}
                        className="block text-[10px] text-zinc-450 hover:underline hover:text-zinc-600 font-medium mx-auto bg-transparent border-0 cursor-pointer"
                      >
                        Créer un nouveau devis
                      </button>

                    </div>

                    <div className="border-t border-zinc-100 pt-3 flex flex-col gap-1 items-center justify-center text-[9px] text-zinc-400 text-center font-sans uppercase">
                      <span>Ce message automatique est crypté. PandaDoc Secure Shield.</span>
                      <a href="mailto:contact@pixiatech.com" className="text-blue-500 font-bold hover:underline">Contacter le support</a>
                    </div>

                  </div>
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
