'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Search, ChevronDown, Clock, Copy, Lock, AlertTriangle, CheckCircle, ShoppingBag, Store, FileText } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { RenterDetails, Pack } from '@/lib/signature-types';
import ContractDocument from './ContractDocument';
import SignaturePad from './SignaturePad';
import { CITIES } from '@/lib/cities';
import { validatePhone } from '@/lib/phone-validation';
import { sendBoutiqueOtp, sendBoutiqueOtpWithResend, verifyBoutiqueOtp } from '@/app/actions/boutique-actions';

interface BoutiqueRentalFlowProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    availableFor?: string[];
  };
  onComplete: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function BoutiqueRentalFlow({ product, onComplete }: BoutiqueRentalFlowProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [step, setStep] = useState(1);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [company, setCompany] = useState('');
  const [representative, setRepresentative] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [rentalStartTime, setRentalStartTime] = useState('08:00');
  const [rentalEndTime, setRentalEndTime] = useState('18:00');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const [acceptedCgl, setAcceptedCgl] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSignatureValidated, setIsSignatureValidated] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [inputOtpCode, setInputOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpCompleted, setIsOtpCompleted] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState(600);
  const [resendAttemptsLeft, setResendAttemptsLeft] = useState(3);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpResent, setOtpResent] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  useEffect(() => {
    if (step !== 3 || otpSent) return;
    setOtpSent(true);
    setIsSendingOtp(true);
    sendBoutiqueOtp(email).then((res) => {
      setIsSendingOtp(false);
      if (res.success && res.pendingId) {
        setPendingId(res.pendingId);
      } else {
        setOtpError(res.error || 'Erreur lors de l\'envoi du code');
      }
    });
  }, [step, email, otpSent]);

  useEffect(() => {
    if (step !== 3 || isOtpCompleted) return;
    const timer = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, isOtpCompleted]);

  const handleResendCode = async () => {
    if (resendAttemptsLeft <= 0) return;
    setIsSendingOtp(true);
    const res = await sendBoutiqueOtpWithResend(email, pendingId || undefined);
    setIsSendingOtp(false);
    if (res.success && res.pendingId) {
      setPendingId(res.pendingId);
      setOtpTimeLeft(600);
      setResendAttemptsLeft((prev) => prev - 1);
      setOtpResent(true);
      setOtpError(null);
      setTimeout(() => setOtpResent(false), 3000);
    } else {
      setOtpError(res.error || 'Erreur lors du renvoi du code');
    }
  };

  const handleManualCodeVerify = async (code: string) => {
    if (!pendingId || code.length !== 6) return;
    setIsSubmitting(true);
    try {
      const result = await verifyBoutiqueOtp(pendingId, code);
      if (result.success) {
        setIsOtpCompleted(true);
        setOtpError(null);
        setTimeout(() => {
          handleAddToCart();
          setStep(4);
        }, 500);
      } else {
        setOtpError(result.error || 'Code incorrect');
        setInputOtpCode('');
      }
    } catch {
      setOtpError('Erreur lors de la vérification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      type: 'rental',
      rentalStartDate,
      rentalEndDate,
      rentalStartTime,
      rentalEndTime,
      renterDetails: { company, representative, email, phone, address, city, postcode },
      additionalNotes: additionalNotes || undefined,
      contractSignedAt: isSignatureValidated ? new Date().toISOString() : undefined,
      rentalFlowCompleted: true,
    }, quantity);
  };

  const isStep1Valid = () => {
    return (
      company.trim() &&
      representative.trim() &&
      email.trim() && validateEmail(email) &&
      phone.trim() &&
      address.trim() &&
      city.trim() &&
      postcode.trim() &&
      rentalStartDate &&
      rentalEndDate &&
      rentalStartTime &&
      rentalEndTime &&
      quantity >= 1
    );
  };

  const handleStep1Continue = () => {
    setAttemptedSubmit(true);
    let hasError = false;

    const emailErr = !email.trim() ? 'Requis' : !validateEmail(email) ? 'Email invalide' : null;
    setEmailError(emailErr);
    if (emailErr) hasError = true;

    const phoneErr = !phone.trim() ? 'Requis' : !validatePhone(phone).isValid ? 'Numéro invalide' : null;
    setPhoneError(phoneErr);
    if (phoneErr) hasError = true;

    if (hasError || !isStep1Valid()) return;
    setAttemptedSubmit(false);
    setStep(2);
  };

  const handleSignatureSave = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setIsSignatureValidated(true);
  };

  const handleSignatureClear = () => {
    setSignatureDataUrl(null);
    setIsSignatureValidated(false);
  };

  const mappedPack: Pack = {
    id: product.id,
    name: product.name,
    surface: '',
    price: product.price,
    deposit: 0,
    description: '',
    specs: [],
  };

  const renterDetails: RenterDetails = { company, representative, address, postcode, city, email, phone };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
      {step < 4 && (
        <div className="flex items-center gap-2 px-6 pt-6 pb-4 border-b border-gray-100">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                s === step ? 'bg-gray-900 text-white' :
                s < step ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {s < step ? <Check size={14} /> : s}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:inline ${
                s === step ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {s === 1 ? 'Informations' : s === 2 ? 'Contrat' : 'Vérification'}
              </span>
              {s < 3 && <ChevronDown size={12} className="text-gray-300 -rotate-90 mx-0.5" />}
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Société *</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !company.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} placeholder="Nom de votre société" />
              {attemptedSubmit && !company.trim() && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Contact *</label>
              <input type="text" value={representative} onChange={(e) => setRepresentative(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !representative.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} placeholder="Nom du contact" />
              {attemptedSubmit && !representative.trim() && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Email *</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  emailError ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} placeholder="email@societe.com" />
              {(attemptedSubmit && !email.trim()) || emailError
                ? <p className="text-red-500 text-[10px] font-bold">▲ {emailError || 'Requis'}</p>
                : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Téléphone *</label>
              <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  phoneError ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} placeholder="+33 6 12 34 56 78" />
              {(attemptedSubmit && !phone.trim()) || phoneError
                ? <p className="text-red-500 text-[10px] font-bold">▲ {phoneError || 'Requis'}</p>
                : null}
            </div>

            <div className="space-y-1.5 relative md:col-span-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Ville *</label>
                <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200/60 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider">Important</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={14} />
                </div>
                <input type="text" placeholder="Rechercher une ville"
                  value={citySearchQuery}
                  onChange={(e) => { setCitySearchQuery(e.target.value); setIsCityDropdownOpen(true); }}
                  onFocus={() => setIsCityDropdownOpen(true)}
                  className={`w-full rounded-xl pl-10 pr-10 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                    attemptedSubmit && !citySearchQuery.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                  }`} />
                <button type="button" onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                  <ChevronDown size={16} className={`transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {attemptedSubmit && !citySearchQuery.trim() && (
                <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>
              )}
              {isCityDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {CITIES.filter(c => c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) || c.postalCode.includes(citySearchQuery)).length > 0
                    ? CITIES.filter(c => c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) || c.postalCode.includes(citySearchQuery)).map(c => (
                        <button key={c.id} type="button"
                          onClick={() => {
                            setSelectedCityId(c.id);
                            setCitySearchQuery(`${c.name} (${c.postalCode})`);
                            setCity(c.name);
                            setPostcode(c.postalCode);
                            setIsCityDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors">
                          <span>{c.name} ({c.postalCode})</span>
                          {selectedCityId === c.id && <Check size={14} className="text-gray-900" />}
                        </button>
                      ))
                    : <div className="text-center p-4 text-sm text-gray-400">Aucune ville trouvée</div>
                  }
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Adresse *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !address.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} placeholder="Adresse de livraison" />
              {attemptedSubmit && !address.trim() && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Code postal</label>
              <input type="text" value={postcode} readOnly
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-gray-200/70 bg-gray-100/50 text-gray-500 cursor-not-allowed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Date début *</label>
              <input type="date" value={rentalStartDate} onChange={(e) => setRentalStartDate(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !rentalStartDate ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} />
              {attemptedSubmit && !rentalStartDate && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Date fin *</label>
              <input type="date" value={rentalEndDate} onChange={(e) => setRentalEndDate(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !rentalEndDate ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} />
              {attemptedSubmit && !rentalEndDate && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Heure début *</label>
              <input type="time" value={rentalStartTime} onChange={(e) => setRentalStartTime(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !rentalStartTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} />
              {attemptedSubmit && !rentalStartTime && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Heure fin *</label>
              <input type="time" value={rentalEndTime} onChange={(e) => setRentalEndTime(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
                  attemptedSubmit && !rentalEndTime ? 'border-red-300 bg-red-50/30' : 'border-gray-200/70 bg-gray-50/30'
                }`} />
              {attemptedSubmit && !rentalEndTime && <p className="text-red-500 text-[10px] font-bold">▲ Requis</p>}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Remarques</label>
              <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={2}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium border border-gray-200/70 bg-gray-50/30 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all resize-none" placeholder="Informations complémentaires..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Quantité *</label>
              <div className="flex items-center border border-gray-200/70 rounded-xl w-fit bg-gray-50/30">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors rounded-xl text-gray-500">-</button>
                <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors rounded-xl text-gray-500">+</button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
            <button onClick={handleStep1Continue}
              disabled={!isStep1Valid() && attemptedSubmit}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6">
          <ContractDocument
            pack={mappedPack}
            renter={renterDetails}
            signatureDataUrl={signatureDataUrl}
            isValidated={isSignatureValidated}
            projectMode="location"
            rentalPeriod={{ from: rentalStartDate, to: rentalEndDate }}
            rentalStartTime={rentalStartTime}
            rentalEndTime={rentalEndTime}
          />

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={acceptedCgl}
                onChange={(e) => setAcceptedCgl(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                J&apos;accepte les <span className="font-semibold text-gray-900 underline underline-offset-2">Conditions Générales de Location</span> et la <span className="font-semibold text-gray-900 underline underline-offset-2">Politique de Confidentialité</span>
              </span>
            </label>

            <div>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2">Signature *</p>
              <SignaturePad
                onSave={handleSignatureSave}
                onClear={handleSignatureClear}
                isValidated={isSignatureValidated}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={16} /> Précédent
            </button>
            <button onClick={() => setStep(3)}
              disabled={!acceptedCgl || !isSignatureValidated}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-6 flex flex-col items-center text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
            <FileText size={24} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Vérification email</h3>
          <p className="text-sm text-gray-500 mb-6">
            Un code à 6 chiffres vous a été envoyé à <strong className="text-gray-700">{email}</strong>
          </p>

          {isSendingOtp ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
              Envoi du code...
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-xs py-2">
                <input
                  ref={hiddenInputRef}
                  type="text"
                  maxLength={100}
                  disabled={isOtpCompleted}
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
                  className="absolute inset-0 opacity-0 w-full h-full cursor-default"
                  autoFocus
                />
                <div onClick={() => hiddenInputRef.current?.focus()}
                  className="flex justify-between gap-2">
                  {Array.from({ length: 6 }).map((_, idx) => {
                    const char = inputOtpCode[idx] || '';
                    const isFocused = idx === inputOtpCode.length && !isOtpCompleted;
                    return (
                      <div key={idx}
                        className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold font-mono transition-all cursor-pointer ${
                          isOtpCompleted
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                            : isFocused
                            ? 'bg-white border-gray-900 text-gray-900'
                            : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}>
                        {char}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="button"
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
                    setOtpError('Impossible de lire le presse-papiers');
                  }
                }}
                disabled={isOtpCompleted}
                className="text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all flex items-center gap-1.5 rounded-xl px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed mb-4">
                <Copy size={12} /> Coller le code
              </button>

              <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mb-4">
                <Clock size={12} />
                <span>Code valable </span>
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${otpTimeLeft <= 60 ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-800 bg-gray-100'}`}>
                  {formatTime(otpTimeLeft)}
                </span>
              </div>

              {otpError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-left text-xs text-red-800 mb-4">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}

              {isOtpCompleted && (
                <div className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5 mb-4">
                  <CheckCircle size={15} className="text-emerald-600" />
                  Identité validée
                </div>
              )}

              <button disabled={inputOtpCode.length < 6 || isSubmitting || isOtpCompleted}
                onClick={() => handleManualCodeVerify(inputOtpCode)}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  inputOtpCode.length === 6 && !isSubmitting && !isOtpCompleted
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}>
                <Lock size={12} />
                {isSubmitting ? 'Vérification...' : 'Valider'}
                <ArrowRight size={12} />
              </button>

              <div className="flex flex-col items-center gap-2 mt-4">
                {resendAttemptsLeft <= 0 ? (
                  <div className="text-[10px] text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                    Trop de tentatives.
                  </div>
                ) : (
                  <>
                    {otpResent && (
                      <div className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <CheckCircle size={10} /> Code renvoyé
                      </div>
                    )}
                    <button onClick={handleResendCode}
                      disabled={isSendingOtp || isOtpCompleted}
                      className="text-xs text-blue-600 font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                      Renvoyer le code
                    </button>
                    {resendAttemptsLeft < 3 && (
                      <span className={`text-[10px] font-bold ${resendAttemptsLeft === 1 ? 'text-red-600' : 'text-amber-600'}`}>
                        {resendAttemptsLeft === 1 ? 'Dernière tentative' : `Il vous reste ${resendAttemptsLeft} tentatives`}
                      </span>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          <button onClick={() => setStep(2)}
            className="flex items-center gap-2 mt-6 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> Précédent
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Prêt pour la location</h3>
          <p className="text-sm text-gray-500 mb-8 max-w-sm">
            Votre demande de location pour <strong className="text-gray-700">{product.name}</strong> a été ajoutée au panier.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button onClick={() => router.push('/boutique/panier')}
              className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
              <ShoppingBag size={16} /> Voir le panier
            </button>
            <button onClick={onComplete}
              className="flex-1 border-2 border-gray-900 text-gray-900 py-3 px-6 rounded-xl font-semibold text-sm hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center gap-2">
              <Store size={16} /> Continuer mes achats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
