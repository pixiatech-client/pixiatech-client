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
  Info,
  Layers,
  Phone,
  Mail,
  FileText,
  Lock,
  Shield,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  KeyRound,
  ShieldAlert,
  ArrowRightLeft,
  Copy,
  ChevronDown,
  Search,
  LayoutGrid,
  Truck,
  Wrench,
  Calculator,
  MailOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pack, RenterDetails, Step, StepId } from '@/lib/signature-types';
import SignaturePad from './SignaturePad';
import ContractDocument from './ContractDocument';
import { ConfiguredProduct, Product, Settings } from '@/lib/types';
import { createQuoteWithContract, verifyQuoteOtp, resendQuoteOtp } from '@/app/actions/quote-actions';
import { firestore as db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';


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

interface SignatureFlowProps {
  configuredProduct: ConfiguredProduct;
  allProducts: Product[];
  settings: Settings;
  userId: string;
  onNewQuote: () => void;
  onBackToConfigurator: () => void;
}

export default function SignatureFlow({
  configuredProduct,
  allProducts,
  settings,
  userId,
  onNewQuote,
  onBackToConfigurator
}: SignatureFlowProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('informations');
  const [quoteId, setQuoteId] = useState<string | null>(null);

  // Initial config details from Step 1
  const [width, setWidth] = useState<number>(configuredProduct.width);
  const [height, setHeight] = useState<number>(configuredProduct.height);
  const [quantity, setQuantity] = useState<number>(configuredProduct.quantity || 1);
  const [projectMode, setProjectMode] = useState<'vente' | 'location'>(
    configuredProduct.transactionType === 'sale' ? 'vente' : 'location'
  );

  // Client Details form
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

  // Signature
  const [acceptedCgl, setAcceptedCgl] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureValidated, setIsSignatureValidated] = useState<boolean>(false);
  const [tempSignatureUrl, setTempSignatureUrl] = useState<string | null>(null);

  // OTP Verification
  const [sentOtpCode, setSentOtpCode] = useState<string>('');
  const [inputOtpCode, setInputOtpCode] = useState<string>('');
  const [isOtpCompleted, setIsOtpCompleted] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState<number>(600); // 10 minutes session
  const [showErrorTips, setShowErrorTips] = useState<boolean>(false);
  const [otpResent, setOtpResent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Accordion state for multi-product display
  const [openProductAccordion, setOpenProductAccordion] = useState<string | null>(null);

  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Resolve current product
  const product = allProducts.find(p => p.id === configuredProduct.productId);

  // Live calculations
  const surface = width * height;
  const dalles = product && product.tileWidth && product.tileHeight
    ? Math.ceil((width * 100) / product.tileWidth) * Math.ceil((height * 100) / product.tileHeight)
    : Math.round(surface * 4);

  // Replicate main price calculator dynamically
  const calculatePrice = () => {
    if (!product) return 0;
    let unitPrice = 0;
    if (product.hasDimensions && product.tileWidth && product.tileHeight && product.pricePerTile) {
      unitPrice = dalles * product.pricePerTile;
    } else {
      if (projectMode === 'vente') {
        unitPrice = (product.salePricePerSqM || 2000) * surface;
      } else {
        unitPrice = (product.rentalPricePerDay || 12) * surface;
      }
    }

    let duration = 1;
    if (projectMode === 'location' && configuredProduct.rentalDuration) {
      duration = configuredProduct.rentalDuration || 1;
    }

    return unitPrice * duration;
  };

  const subtotalProducts = calculatePrice();
  
  // Dynamic installation calculations
  const techniciansCount = Math.max(1, Math.ceil(surface / 40));
  const installationFee = isInstallationIncluded ? (techniciansCount * 50) : 0;
  
  // Total quote
  const totalAmount = (subtotalProducts * quantity) + (250 * quantity) + (installationFee * quantity);

  // Active pack object
  const activePack: Pack = {
    id: product?.id || 'custom-led-78',
    name: projectMode === 'vente' 
      ? (product?.name || 'Caissons LED Série Extra Plat')
      : (product?.name || 'Location Écran LED Sur-Mesure'),
    surface: `${(surface * quantity).toFixed(2)} m²`,
    price: Math.round(subtotalProducts * quantity),
    deposit: Math.round(subtotalProducts * quantity * 0.5),
    description: `Configuration de ${quantity} écran(s) LED de ${width}m x ${height}m (Total ${dalles * quantity} dalles)`,
    specs: [
      `Dimensions unitaire : ${width}m x ${height}m`,
      `Surface unitaire : ${surface.toFixed(2)} m²`,
      `Quantité d'écrans : ${quantity}`,
      `Surface totale d'affichage : ${(surface * quantity).toFixed(2)} m²`,
      `Quantité de matériel : ${dalles * quantity} dalles`
    ]
  };

  // OTP Countdown timer
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

  // Handle auto code completion on typing/paste
  useEffect(() => {
    if (inputOtpCode.length === 6 && !isOtpCompleted) {
      handleManualCodeVerify(inputOtpCode);
    }
  }, [inputOtpCode]);

  // Real-time listener for email link click validation
  useEffect(() => {
    if (!quoteId || currentStep !== 'securite') return;
    
    const unsubscribe = onSnapshot(doc(db, 'quotes', quoteId), (docSnap) => {
      if (docSnap.exists()) {
        const quoteData = docSnap.data();
        if (quoteData?.emailVerified) {
          setIsOtpCompleted(true);
          setOtpError(null);
          setTimeout(() => {
            setCurrentStep('confirmation');
          }, 800);
        }
      }
    });

    return () => unsubscribe();
  }, [quoteId, currentStep]);

  // Cohesive stages in the upper header
  const steps: Step[] = [
    { id: 'informations', label: 'Résumé de l’estimation', isCompleted: currentStep !== 'informations', isActive: currentStep === 'informations' },
    { id: 'contrat', label: 'Contrat & Signature', isCompleted: currentStep === 'securite' || currentStep === 'confirmation', isActive: currentStep === 'contrat' },
    { id: 'securite', label: 'Vérification de sécurité', isCompleted: currentStep === 'confirmation', isActive: currentStep === 'securite' },
    { id: 'confirmation', label: 'Félicitations', isCompleted: false, isActive: currentStep === 'confirmation' }
  ];

  // Time format (MM:SS)
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePrevStep = () => {
    if (currentStep === 'contrat') {
      setCurrentStep('informations');
    } else if (currentStep === 'securite') {
      setCurrentStep('contrat');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 'informations') {
      const errors: Record<string, string> = {};
      if (!renterDetails.company.trim()) errors.company = 'Ce champ est obligatoire';
      if (!renterDetails.representative.trim()) errors.representative = 'Ce champ est obligatoire';
      if (!renterDetails.email.trim()) errors.email = 'Ce champ est obligatoire';
      if (!renterDetails.phone.trim()) errors.phone = 'Ce champ est obligatoire';
      if (!renterDetails.address.trim()) errors.address = 'Ce champ est obligatoire';
      if (!renterDetails.city.trim()) errors.city = 'Ce champ est obligatoire';
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});
      setCurrentStep('contrat');
    }
  };

  const handleSignatureSave = async (dataUrl: string) => {
    if (!acceptedCgl) {
      alert("Veuillez d'abord déclarer accepter les conditions générales.");
      setShowErrorTips(true);
      return;
    }
    
    setIsSubmitting(true);
    setSignatureDataUrl(dataUrl);

    // Prepare full quote details payload
    const finalQuoteDetails = {
      products: [
        {
          productId: configuredProduct.productId,
          productName: product?.name || 'Unknown LED',
          productType: configuredProduct.productType,
          width,
          height,
          quantity,
          transactionType: projectMode === 'vente' ? 'sale' : 'rental',
          rentalDuration: projectMode === 'location' ? (configuredProduct.rentalDuration || 1) : 0,
          rentalUnit: configuredProduct.rentalUnit || 'day',
          lineTotal: subtotalProducts * quantity,
          tileWidth: product?.tileWidth,
          tileHeight: product?.tileHeight,
          pricePerTile: product?.pricePerTile,
          nombreEcrans: quantity
        }
      ],
      screenType: configuredProduct.productType,
      transactionType: projectMode === 'vente' ? 'sale' : 'rental',
      includeInstallation: isInstallationIncluded,
      installationCost: installationFee * quantity,
      techniciansRequired: techniciansCount * quantity,
      includeDelivery: true,
      deliveryCost: 250 * quantity,
      selectedCityId: selectedCityId || 'unconfigured',
      unconfiguredCityQuery: citySearchQuery,
      totalQuote: totalAmount,
      width,
      height,
      productName: product?.name || '',
      rentalUnit: projectMode === 'location' ? configuredProduct.rentalUnit : null,
      rentalDuration: projectMode === 'location' ? configuredProduct.rentalDuration : null,
      rentalPeriod: projectMode === 'location' ? configuredProduct.rentalPeriod : undefined,
      lang: (settings as any).lang || 'fr'
    };

    // Save quote with contract and send OTP
    try {
      const res = await createQuoteWithContract(
        userId,
        {
          company: renterDetails.company,
          representative: renterDetails.representative,
          address: renterDetails.address,
          postcode: renterDetails.postcode,
          city: renterDetails.city,
          email: renterDetails.email,
          phone: renterDetails.phone,
          notes: additionalNotes
        },
        finalQuoteDetails as any,
        dataUrl
      );

      if (res.success && res.id && res.otpCode) {
        setQuoteId(res.id);
        setSentOtpCode(res.otpCode);
        setOtpTimeLeft(600);
        setOtpError(null);
        setInputOtpCode('');
        setIsSignatureValidated(true);
        setCurrentStep('securite');
      } else {
        alert("Erreur lors de la création du contrat : " + (res.error || "Inconnu"));
      }
    } catch (e: any) {
      console.error(e);
      alert("Erreur technique de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCodeVerify = async (codeToVerify: string) => {
    if (!quoteId) return;
    
    try {
      const res = await verifyQuoteOtp(quoteId, codeToVerify);
      if (res.success) {
        setIsOtpCompleted(true);
        setOtpError(null);
        setTimeout(() => {
          setCurrentStep('confirmation');
        }, 800);
      } else {
        setOtpError(res.error || "Validation automatique impossible. Entrez le code reçu par e-mail.");
      }
    } catch (e) {
      setOtpError("Erreur lors de la vérification du code.");
    }
  };

  const handleResendCode = async () => {
    if (!quoteId) return;

    try {
      setIsSubmitting(true);
      const res = await resendQuoteOtp(quoteId);
      if (res.success) {
        setOtpTimeLeft(600);
        setOtpError(null);
        setInputOtpCode('');
        setOtpResent(true);
        setTimeout(() => setOtpResent(false), 4000);
      } else {
        setOtpError(res.error || "Erreur lors du renvoi du code.");
      }
    } catch (e) {
      console.error(e);
      setOtpError("Erreur technique lors du renvoi du code.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleContractDownload = () => {
    const lines = [
      '=======================================================================',
      'ESTIMATION TECHNIQUE & CONTRAT NUMERIQUE VALIDE - PIXIATECH PRO',
      '=======================================================================',
      'Reference Dossier     : PIXIA-EST-' + Math.round(surface) + '-2026',
      "Date d'Homologation   : 29 mai 2026",
      'Statut de Signature   : CERTIFIE ET SIGNE ELECTRONIQUEMENT',
      '-----------------------------------------------------------------------',
      '',
      'SOCIETE CONTRACTANTE (PRENEUR) :',
      '- Raison Sociale : ' + renterDetails.company,
      '- Representant : ' + renterDetails.representative,
      '- Adresse de livraison : ' + renterDetails.address + ', ' + renterDetails.postcode + ' ' + renterDetails.city,
      '- Coordonnees : ' + renterDetails.email + ' | ' + renterDetails.phone,
      '',
      'SPECIFICATIONS TECHNIQUES DU BIEN :',
      '- Modele d\'Affichage : ' + activePack.name,
      '- Dimensions d\'ecran : ' + width + 'm x ' + height + 'm',
      '- Surface totale d\'affichage : ' + surface.toFixed(2) + ' m2',
      '- Nombre de modules LED : ' + dalles + ' dalles de dimensions 50cm x 50cm',
      '- Type de commande : ' + projectMode.toUpperCase(),
      '',
      'DECOMPTE FINANCIER :',
      '- Sous-total materiel : ' + subtotalProducts.toLocaleString('fr-FR') + ' EUR TTC',
      '- Frais logistique de livraison : ' + (250 * quantity).toLocaleString('fr-FR') + ' EUR TTC',
      '- Prestation d\'Installation : ' + (isInstallationIncluded ? 'Incluse par nos techniciens (' + (installationFee * quantity).toLocaleString('fr-FR') + ' EUR TTC)' : 'Non incluse - par vos soins (Pixiatech decline toute responsabilite)'),
      '- MONTANT TOTAL ESTIME (TTC) : ' + totalAmount.toLocaleString('fr-FR') + ' EUR TTC',
      '',
      '-----------------------------------------------------------------------',
      'Certifie par PandaDoc e-Sign. Authentifie par OTP Mail Code #' + sentOtpCode,
      'PIXIATECH - Saint-Ouen-sur-Seine et France Entiere.',
      '=======================================================================',
    ];
    const textData = lines.join('\n');
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Pixiatech_Contrat_Est_' + renterDetails.company.replace(/\s+/g, '_') + '.txt';
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-zinc-800 font-sans antialiased">
      
      {/* Header progress bar */}
      {currentStep !== 'confirmation' && (
        <div className="w-full bg-[#FAF8F5] border-b border-zinc-200/80 py-5 px-4 overflow-x-auto select-none">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-w-[700px] px-2">
            
            {/* Row 1: Circles (Icons) */}
            <div className="flex items-center justify-between w-full">
              {steps.map((st) => {
                const active = st.isActive;
                const completed = st.isCompleted;
                return (
                  <div key={`circle-${st.id}`} className="w-[140px] flex justify-center">
                    <button
                      id={`stepper-btn-${st.id}`}
                      disabled={!completed && st.id !== currentStep}
                      onClick={() => {
                        if (st.id === 'informations' || st.id === 'contrat' || st.id === 'securite') {
                          setCurrentStep(st.id);
                        }
                      }}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                        active 
                          ? 'bg-zinc-950 text-white shadow-md ring-[5px] ring-blue-100 border border-zinc-950 scale-105' 
                          : completed
                          ? 'bg-zinc-900 border border-zinc-900 text-white shadow-sm cursor-pointer hover:bg-zinc-800'
                          : 'bg-[#EAEFF4] text-[#8A99A8] border border-transparent'
                      }`}
                    >
                      {st.id === 'informations' && <LayoutGrid size={18} className="stroke-[2.5]" />}
                      {st.id === 'contrat' && <Truck size={18} className="stroke-[2.5]" />}
                      {st.id === 'securite' && <Wrench size={18} className="stroke-[2.5]" />}
                      {st.id === 'confirmation' && <Calculator size={18} className="stroke-[2.5]" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Row 2: Labels and horizontal lines between them */}
            <div className="flex items-center justify-between w-full mt-2.5">
              {steps.map((st, index) => {
                const active = st.isActive;
                const completed = st.isCompleted;
                const isLineCompleted = completed || active;
                return (
                  <React.Fragment key={`label-${st.id}`}>
                    {index > 0 && (
                      <div className="flex-1 flex items-center px-1">
                        <div 
                          className={`h-[1px] w-full transition-all duration-300 ${
                            isLineCompleted ? 'bg-zinc-350' : 'bg-zinc-200'
                          }`}
                        />
                      </div>
                    )}
                    <div className="w-[140px] text-center flex justify-center shrink-0">
                      <span className={`text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-300 ${active ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8 flex flex-col gap-6">

        {/* STEP 1: RÉSUMÉ DE L'ESTIMATION */}
        {currentStep === 'informations' && (
          <div className="space-y-8 animate-fade-in" id="estimation-recap-main-card">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form client details */}
              <div className="lg:col-span-7 bg-white border border-[#e2e8f0] rounded-[24px] p-6 sm:p-10 shadow-sm space-y-6">

                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h2 className="text-sm font-black font-heading text-zinc-900 uppercase tracking-wide">Informations client</h2>
                    <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Tous les champs sont obligatoires sauf la note pour le vendeur</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Nom entreprise */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-name" className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.company ? 'text-red-600' : 'text-zinc-650'}`}>
                      Nom de l'entreprise <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="comp-name"
                      type="text"
                      placeholder="Veuillez saisir le nom de l'entreprise"
                      value={renterDetails.company}
                      onChange={(e) => { setRenterDetails({ ...renterDetails, company: e.target.value }); if (formErrors.company) setFormErrors(p => ({...p, company: ''})); }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm ${
                        formErrors.company
                          ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                          : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {formErrors.company && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.company}</p>}
                  </div>

                  {/* Nom du contact */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="rep-name" className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.representative ? 'text-red-600' : 'text-zinc-650'}`}>
                      Nom du contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="rep-name"
                      type="text"
                      placeholder="Nom de la personne à contacter"
                      value={renterDetails.representative}
                      onChange={(e) => { setRenterDetails({ ...renterDetails, representative: e.target.value }); if (formErrors.representative) setFormErrors(p => ({...p, representative: ''})); }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm ${
                        formErrors.representative
                          ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                          : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {formErrors.representative && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.representative}</p>}
                  </div>

                  {/* Email professionnel */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-email" className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.email ? 'text-red-600' : 'text-zinc-650'}`}>
                      Email professionnel <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="comp-email"
                      type="email"
                      placeholder="adresse@email.com"
                      value={renterDetails.email}
                      onChange={(e) => { setRenterDetails({ ...renterDetails, email: e.target.value }); if (formErrors.email) setFormErrors(p => ({...p, email: ''})); }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm ${
                        formErrors.email
                          ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                          : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {formErrors.email && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.email}</p>}
                  </div>

                  {/* Téléphone */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-phone" className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.phone ? 'text-red-600' : 'text-zinc-650'}`}>
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="comp-phone"
                      type="text"
                      placeholder="Numéro de téléphone"
                      value={renterDetails.phone}
                      onChange={(e) => { setRenterDetails({ ...renterDetails, phone: e.target.value }); if (formErrors.phone) setFormErrors(p => ({...p, phone: ''})); }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm ${
                        formErrors.phone
                          ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                          : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {formErrors.phone && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.phone}</p>}
                  </div>

                  {/* Ville de livraison — icône Truck + badge orange */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shrink-0">
                        <Truck size={13} />
                      </div>
                      <label className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.city ? 'text-red-600' : 'text-zinc-800'}`}>
                        Ville de livraison <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-orange-200">Important</span>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                        <Search size={14} />
                      </div>
                      <input
                        type="text"
                        placeholder="Ville de livraison"
                        value={citySearchQuery}
                        onChange={(e) => {
                          setCitySearchQuery(e.target.value);
                          setIsCityDropdownOpen(true);
                          if (formErrors.city) setFormErrors(p => ({...p, city: ''}));
                        }}
                        onFocus={() => setIsCityDropdownOpen(true)}
                        className={`w-full rounded-xl pl-9 pr-10 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm text-xs ${
                          formErrors.city
                            ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                            : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                      >
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {formErrors.city && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.city}</p>}

                    {isCityDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-zinc-50 text-xs font-semibold">
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
                                setIsInstallationAccordionOpen(true);
                                if (formErrors.city) setFormErrors(p => ({...p, city: ''}));
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50/50 flex items-center justify-between text-zinc-800 transition-colors"
                            >
                              <span>{c.name} ({c.postalCode})</span>
                              {selectedCityId === c.id && <Check size={14} className="text-orange-600 font-bold" />}
                            </button>
                          ))
                        ) : (
                          <div className="text-center p-4 text-zinc-500">
                            <p className="font-bold text-zinc-700">Zone non configurée</p>
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
                              className="mt-3 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-bold transition-all"
                            >
                              Réinitialiser à Paris
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Adresse */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="comp-address" className={`font-extrabold uppercase tracking-wide text-[10px] ${formErrors.address ? 'text-red-600' : 'text-zinc-650'}`}>
                      Adresse de l'événement <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="comp-address"
                      type="text"
                      placeholder="Palais des Congrès, Paris"
                      value={renterDetails.address}
                      onChange={(e) => { setRenterDetails({ ...renterDetails, address: e.target.value }); if (formErrors.address) setFormErrors(p => ({...p, address: ''})); }}
                      className={`w-full rounded-xl px-4 py-3 font-semibold focus:outline-none transition-all text-zinc-900 shadow-sm ${
                        formErrors.address
                          ? 'bg-red-50 border-2 border-red-400 focus:border-red-500'
                          : 'bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                    {formErrors.address && <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> {formErrors.address}</p>}
                  </div>

                  {/* Note pour le vendeur — OPTIONNEL */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="comp-notes" className="font-extrabold text-zinc-650 uppercase tracking-wide text-[10px]">Note pour le vendeur</label>
                      <span className="text-[9px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-zinc-200">Facultatif</span>
                    </div>
                    <textarea
                      id="comp-notes"
                      rows={3}
                      placeholder="Ajoutez toute information utile pour le vendeur (contraintes, disponibilités, accès au site, remarques particulières, etc.)"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-zinc-200 hover:border-zinc-300 rounded-xl px-4 py-3 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-zinc-900 shadow-sm resize-none text-xs placeholder:text-zinc-400 placeholder:font-normal"
                      style={{ height: '7.5rem' }}
                    />
                    <p className="text-[10px] text-zinc-400 italic">Ex : "Disponible après 16h30" — "Accès uniquement le matin" — "Je serai absent le vendredi"</p>
                  </div>

                </div>

                <div className="border-t border-zinc-100 pt-5 flex flex-col sm:flex-row gap-3 justify-start">
                  <button
                    onClick={handleNextStep}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0f1115] hover:bg-zinc-800 text-white rounded-xl font-bold font-heading text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span>Continuer vers le contrat</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={onBackToConfigurator}
                    className="w-full sm:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-transparent transition-all cursor-pointer active:scale-98"
                  >
                    <ArrowLeft size={13} />
                    Retour aux produits recommandés
                  </button>
                </div>

              </div>

              {/* Right Hand panel */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">

                {/* Details list — single or multi-product accordion */}
                <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <h3 className="text-sm font-heading font-bold text-zinc-900 uppercase tracking-wide">
                      Détails Techniques
                    </h3>
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                      {projectMode === 'vente' ? 'Vente' : 'Leasing'}
                    </span>
                  </div>

                  {(() => {
                    const multiProducts = Array.isArray((configuredProduct as any))
                      ? (configuredProduct as any as ConfiguredProduct[])
                      : null;

                    if (multiProducts && multiProducts.length > 1) {
                      // MULTI-PRODUCT ACCORDION
                      return (
                        <div className="space-y-2">
                          {multiProducts.map((cp, idx) => {
                            const cpProduct = allProducts.find(p => p.id === cp.productId);
                            const cpSurface = cp.width * cp.height;
                            const cpDalles = cpProduct?.tileWidth && cpProduct?.tileHeight
                              ? Math.ceil((cp.width * 100) / cpProduct.tileWidth) * Math.ceil((cp.height * 100) / cpProduct.tileHeight)
                              : Math.round(cpSurface * 4);
                            const accordionKey = `product-${idx}`;
                            const isOpen = openProductAccordion === accordionKey;
                            return (
                              <div key={idx} className="border border-zinc-100 rounded-2xl overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setOpenProductAccordion(isOpen ? null : accordionKey)}
                                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer text-left"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-[10px] shrink-0">{idx + 1}</div>
                                    <span className="text-xs font-bold text-zinc-900 line-clamp-1">{cpProduct?.name || `Produit ${idx + 1}`}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">x{cp.quantity || 1}</span>
                                    <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                  </div>
                                </button>
                                {isOpen && (
                                  <div className="px-4 py-3 space-y-2 text-xs border-t border-zinc-100">
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Quantité</span>
                                      <span className="text-zinc-900 font-bold font-mono">x{cp.quantity || 1}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Dimensions</span>
                                      <span className="text-zinc-900 font-bold font-mono">{cp.width}m x {cp.height}m</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Surface unitaire</span>
                                      <span className="text-zinc-900 font-bold font-mono">{cpSurface.toFixed(2)} m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Surface totale</span>
                                      <span className="text-zinc-900 font-bold font-mono">{(cpSurface * (cp.quantity || 1)).toFixed(2)} m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Dalles unitaire</span>
                                      <span className="text-zinc-900 font-bold font-mono">{cpDalles}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-500 font-semibold">Dalles totales</span>
                                      <span className="text-zinc-900 font-bold font-mono">{cpDalles * (cp.quantity || 1)}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="pt-1 text-[10px] text-zinc-400 font-medium text-center">{multiProducts.length} produits sélectionnés</div>
                        </div>
                      );
                    }

                    // SINGLE PRODUCT
                    return (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-semibold">Produit</span>
                          <span className="text-zinc-900 font-bold text-right max-w-[60%]">{product?.name || activePack.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-semibold">Quantité</span>
                          <span className="text-zinc-900 font-bold font-mono">x{quantity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-semibold">Dimensions</span>
                          <span className="text-zinc-900 font-bold font-mono">{width}m x {height}m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-semibold">Surface Totale</span>
                          <span className="text-zinc-900 font-bold font-mono">{surface.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-500 font-semibold">Détails dalles</span>
                          <span className="text-zinc-900 font-bold font-mono text-right">{dalles} Dalles <span className="text-zinc-400 font-normal text-[10px]">({product?.tileWidth || 50}cm x {product?.tileHeight || 50}cm)</span></span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Ligne</span>
                      <span className="text-zinc-800 font-mono">{(subtotalProducts).toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Sous-total produits</span>
                      <span className="text-zinc-800 font-mono">{(subtotalProducts * quantity).toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Livraison</span>
                      <span className="text-zinc-800 font-mono">{(250 * quantity).toLocaleString('fr-FR')} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Installation</span>
                      <span className="text-zinc-800 font-mono">{(installationFee * quantity).toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-900 font-heading uppercase tracking-wide">Total estimé (TTC)</span>
                    </div>
                    <div className="text-right text-2xl font-mono font-black text-blue-600">
                      {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                  </div>

                </div>

                {/* Installation - SECOND */}
                <div className="border border-zinc-200 rounded-[24px] bg-white overflow-hidden shadow-sm">
                  <div className="px-5 sm:px-6 py-4 flex items-center gap-3 border-b border-zinc-100">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
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

                  <div className="px-5 sm:px-6 pb-5 pt-4 space-y-3 text-xs font-semibold bg-white">

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
                        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1 text-zinc-800 font-semibold text-xs">
                          <p>Pour une surface totale de <strong className="text-zinc-900 font-black">{surface.toFixed(2)} m²</strong>, votre projet nécessite <strong className="text-zinc-900 font-black">{techniciansCount} technicien(s)</strong>.</p>
                          <p className="text-sm font-extrabold text-zinc-900 mt-2">Coût : {(installationFee * quantity).toLocaleString('fr-FR')} €</p>
                        </div>
                      )}
                    </button>

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

                    {!isInstallationIncluded && (
                      <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl flex items-start gap-3 shadow-sm select-none">
                        <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-red-700 font-extrabold text-xs uppercase tracking-wider block">Attention</span>
                          <p className="text-red-600 font-semibold leading-relaxed text-[11px]">
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
        {/* STEP 2: CONTRAT ET SIGNATURE */}
        {currentStep === 'contrat' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
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

              <div 
                className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm flex flex-col gap-6"
                id="digital-contract-frame"
              >
                
                <ContractDocument
                  pack={activePack}
                  renter={renterDetails}
                  signatureDataUrl={signatureDataUrl || tempSignatureUrl}
                  isValidated={isSignatureValidated}
                />

                <div 
                  id="sig-checkbox-box" 
                  onClick={() => {
                    if (!isSignatureValidated) {
                      setAcceptedCgl(prev => {
                        const newVal = !prev;
                        if (newVal) setShowErrorTips(false);
                        return newVal;
                      });
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                    showErrorTips && !acceptedCgl
                      ? 'border-red-200 bg-red-50/40 text-red-950 hover:bg-red-50/65'
                      : acceptedCgl
                      ? 'border-blue-200 bg-blue-50/20 text-zinc-800'
                      : 'border-zinc-200 bg-zinc-50/40 text-zinc-600 hover:bg-zinc-55/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        id="cgl-chk"
                        type="checkbox"
                        checked={acceptedCgl}
                        readOnly
                        className={`w-5 h-5 rounded-lg border appearance-none checked:bg-blue-650 checked:border-blue-600 hover:border-blue-500 transition-all flex items-center justify-center cursor-pointer ${
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
                  </div>
                </div>

                <div 
                  id="signature-pad-block"
                  className="pt-4 border-t border-zinc-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    <h4 className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-widest text-zinc-900">
                      Signature du contrat numérique
                    </h4>
                  </div>

                  {isSubmitting ? (
                    <div className="h-44 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-blue-600" />
                      <span className="text-xs text-zinc-500 font-semibold">Génération sécurisée du contrat et envoi de l'OTP...</span>
                    </div>
                  ) : (
                    <SignaturePad
                      isValidated={isSignatureValidated}
                      onSave={handleSignatureSave}
                      onStrokeComplete={(url) => setTempSignatureUrl(url || null)}
                      onClear={() => {
                        setSignatureDataUrl(null);
                        setTempSignatureUrl(null);
                        setIsSignatureValidated(false);
                      }}
                    />
                  )}

                  <div className="text-center mt-3 text-[10px] text-zinc-400 font-mono">
                    Votre signature sera certifiée numériquement par PandaDoc — valeur juridique contractuelle
                  </div>

                </div>

              </div>

            </div>

            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-heading">
                    Pack Sélectionné
                  </span>
                  <span className="bg-blue-50 text-blue-650 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
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

                <button
                  onClick={() => setCurrentStep('informations')}
                  className="w-full text-center py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-200 tracking-wide cursor-pointer transition-all"
                >
                  Changer de taille / de pack LED
                </button>
              </div>

              {/* Dark visual summary card */}
              <div className="bg-[#0e1115] border border-zinc-800 rounded-[24px] p-6 shadow-xl space-y-5 text-white">
                <div className="border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                    Récapitulatif financier
                  </h3>
                </div>

                <div className="flex gap-3 pb-3 border-b border-zinc-850">
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
                    <span className="text-zinc-400">{projectMode === 'vente' ? 'Règlement total :' : 'Premier règlement (Loyer + Caution) :'}</span>
                    <strong className="text-blue-400 font-mono text-[13px] sm:text-sm font-extrabold whitespace-nowrap">
                      {(projectMode === 'vente' ? totalAmount : activePack.price + activePack.deposit).toLocaleString('fr-FR')}€ TTC
                    </strong>
                  </div>

                  <div className="flex justify-between items-center leading-normal">
                    <span className="text-zinc-400">Puis prélèvements mensuels :</span>
                    <strong className="text-white font-mono text-[13px] sm:text-sm font-bold whitespace-nowrap">
                      {(projectMode === 'vente' ? 0 : activePack.price).toLocaleString('fr-FR')}€ TTC
                    </strong>
                  </div>
                </div>

                <div className="text-[9px] text-zinc-500 font-sans tracking-wide leading-normal text-center pt-2 border-t border-zinc-850">
                  Taxe sur la valeur ajoutée (TVA) 20% légale incluse dans les tarifs TTC affichés.
                </div>
              </div>

            </div>

          </div>
        )}
        {/* STEP 3: VÉRIFICATION DE SÉCURITÉ */}
        {currentStep === 'securite' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest block flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-550" />
                  Espace hautement sécurisé • Étape 3 sur 4
                </span>
                
                <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-zinc-900 leading-[1.15]">
                  Vérification de <br />
                  <span className="text-blue-650">sécurité PixiaTech</span>
                </h1>
                
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans mt-1">
                  Nous avons envoyé un code de sécurité à votre adresse e-mail. Consultez votre boîte de réception puis cliquez sur le lien reçu. Pensez également à vérifier vos courriers indésirables.
                </p>
              </div>

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
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 text-zinc-700 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start"
                >
                  <ArrowLeft size={13} />
                  <span>Retour au contrat</span>
                </button>
              </div>

            </div>

            <div className="lg:col-span-5 space-y-6">
              
              {/* Authenticator Box */}
              <div className="bg-blue-50/30 border-2 border-blue-600 rounded-[24px] p-6 sm:p-8 shadow-lg text-center space-y-6 relative overflow-hidden" id="blue-contour-securite-card">
                
                <div className="w-12 h-12 bg-zinc-950 text-white rounded-[16px] flex items-center justify-center mx-auto shadow-md">
                  <Lock size={20} className="stroke-[2.5]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-zinc-900 font-heading">Authentification par code</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    Entrez le code à 6 chiffres envoyé sur votre boîte e-mail.
                  </p>
                </div>

                {/* 6 digits PIN inputs */}
                <div className="relative py-2 max-w-xs mx-auto">
                  <input
                    ref={hiddenInputRef}
                    id="otp-code-hidden-ctrl"
                    type="text"
                    maxLength={6}
                    disabled={isOtpCompleted}
                    value={inputOtpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputOtpCode(val);
                      setOtpError(null);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-default border-none focus:outline-none"
                    autoFocus
                  />
                  
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
                              ? 'bg-white border-blue-500 ring-4 ring-blue-500/10 text-zinc-900 font-extrabold'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        >
                          {character}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Session countdown */}
                <div className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 font-medium">
                  <Clock size={12} />
                  <span>Le code de validation expirera dans </span>
                  <span className="font-mono font-bold text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded leading-none">
                    {formatTime(otpTimeLeft)}
                  </span>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left text-[11px] text-red-900">
                    <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <span>{otpError}</span>
                  </div>
                )}

                {isOtpCompleted && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center justify-center gap-1.5 animate-bounce">
                    <CheckCircle size={15} className="text-emerald-600" />
                    <span>L'identité a été validée avec succès !</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={inputOtpCode.length < 6 || isOtpCompleted}
                    onClick={() => handleManualCodeVerify(inputOtpCode)}
                    className={`w-full py-3 rounded-xl font-heading font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      inputOtpCode.length === 6 && !isOtpCompleted
                        ? 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-md'
                        : 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
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
                      <span>Nouveau code expédié sur votre email !</span>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-4 text-[10px]">
                    <button 
                      onClick={handleResendCode}
                      disabled={isOtpCompleted || isSubmitting}
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

        {/* STEP 4: CONFIRMATION & FÉLICITATIONS */}
        {currentStep === 'confirmation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fade-in py-2">
            
            <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-6">
              
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-mono text-[10px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  <Shield size={12} />
                  <span>Espace Administrateur</span>
                </div>

                <div className="w-14 h-14 bg-zinc-950 text-white rounded-[18px] flex items-center justify-center shadow-md">
                  <Check size={26} className="stroke-[3]" />
                </div>

                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-zinc-900 leading-[1.08] uppercase">
                    Félicitations <br />
                    <span className="text-blue-600 block lowercase normal-case">votre projet est prêt.</span>
                  </h1>
                  
                  <div className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans max-w-lg mt-3 space-y-3">
                    <p>Votre estimation a été générée avec succès.</p>
                    <p>Vous pouvez dès maintenant consulter ou télécharger votre estimation au format PDF.</p>
                    <p>Merci de votre confiance et d’avoir choisi Pixiatech. Nous sommes ravis de vous accompagner dans la réalisation de votre projet.</p>
                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onNewQuote}
                  className="w-full sm:w-auto px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} />
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

            <div className="lg:col-span-5 flex flex-col">
              
              <div className="bg-white border border-[#e2e8f0] rounded-[24px] p-6 shadow-sm flex-1 flex flex-col justify-between space-y-5">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-heading">
                      Détails Techniques
                    </span>
                    <span className="bg-blue-50 text-blue-650 border border-blue-200 text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                      Série Extra Plat
                    </span>
                  </div>

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

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center shadow-inner">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase font-sans">Total Estimé :</span>
                    <span className="text-lg font-mono font-black text-blue-600">
                      {totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>

                {/* 3D abstract wallpaper */}
                <div className="relative w-full h-36 bg-gradient-to-br from-indigo-800 via-purple-900 to-[#3b0764] rounded-2xl border border-purple-500/20 shadow-inner overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                  
                  <div className="relative z-10 flex gap-4 select-none pointer-events-none items-center">
                    
                    {/* Screen panel left */}
                    <div className="w-24 h-24 bg-zinc-950 rounded-lg border border-purple-400/30 shadow-lg flex flex-col justify-between overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 opacity-80 blur-0"></div>
                      <div className="relative z-10 p-1.5 flex flex-col justify-between h-full">
                        <span className="text-[6px] font-bold text-white font-mono leading-none tracking-widest uppercase">PIXIA SCREEN</span>
                        <div className="w-full flex justify-between text-[5px] text-white/50">
                          <span>{surface.toFixed(1)}m²</span>
                          <span>ACTIVE</span>
                        </div>
                      </div>
                    </div>

                    {/* Rear Chassis right */}
                    <div className="w-24 h-24 bg-[#0a0614] rounded-lg border border-purple-500/40 shadow-lg p-2 flex flex-col justify-between relative overflow-hidden">
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

    </div>
  );
}
