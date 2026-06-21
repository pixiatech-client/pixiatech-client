'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { ArrowLeft, Store, ShoppingBag, CreditCard, Wallet, Lock, Shield, Check, Home, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/boutique-data';

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unionpay' | 'unknown';

type CardTheme = { from: string; via: string; to: string; logoUrl?: string; bgImage?: string };
const cardThemes: Record<CardNetwork, CardTheme> = {
  visa:       { from: '#016FB4', via: '#016FB4', to: '#011135', logoUrl: '/brand-logos/visa.svg' },
  mastercard: { from: '#ff5f00', via: '#f79e1b', to: '#eb001b' },
  amex:       { from: '#2e77bc', via: '#1e4d8c', to: '#16437e', logoUrl: '/brand-logos/amex.svg' },
  discover:   { from: '#e97333', via: '#f69220', to: '#4d4d4d' },
  unionpay:   { from: '#d40029', via: '#b30022', to: '#8c001a', logoUrl: '/brand-logos/unionpay.svg' },
  unknown:    { from: '#1d4ed8', via: '#2563eb', to: '#172554' },
};

function detectCardNetwork(digits: string): CardNetwork {
  if (digits.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2(?:2[2-9][1-9]|[3-6]\d{2}|7[0-1]\d|720)/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|4[4-9]|5)/.test(digits) || /^622(?:1[2-9]|[2-8]\d|9[0-5])/.test(digits)) return 'discover';
  if (/^62/.test(digits)) return 'unionpay';
  return 'unknown';
}

function CardForm() {
  const [cardNumber, setCardNumber] = useState('4256 4256 4256 4256');
  const [expDate, setExpDate] = useState('12/24');
  const [ccv, setCcv] = useState('342');
  const [cardName, setCardName] = useState('John Doe');
  const [flipped, setFlipped] = useState(false);

  const digits = cardNumber.replace(/\D/g, '');
  const network = detectCardNetwork(digits);
  const theme = cardThemes[network];
  const gradientStyle = { backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.via}, ${theme.to})` };
  const isAmex = network === 'amex';
  const cvvLength = isAmex ? 4 : 3;

  const formatCardNumber = (value: string) => {
    const d = value.replace(/\D/g, '');
    let formatted = '';
    if (isAmex) {
      for (let i = 0; i < d.length; i++) {
        if (i === 4 || i === 10) formatted += ' ';
        formatted += d[i];
      }
    } else {
      for (let i = 0; i < d.length; i++) {
        if (i % 4 === 0 && i > 0) formatted += ' ';
        formatted += d[i];
      }
    }
    return formatted;
  };

  const formatExpDate = (value: string) => {
    const d = value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < d.length; i++) {
      if (i % 2 === 0 && i > 0) formatted += '/';
      formatted += d[i];
    }
    return formatted;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-[260px] md:max-w-[280px]" style={{ perspective: '1000px' }}>
          <div
            className="relative w-full aspect-[1.586] rounded-2xl transition-transform duration-700 cursor-pointer"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            onClick={() => setFlipped(!flipped)}
          >
            {network === 'mastercard' ? (
              <>
                {/* Front - Mastercard dark design */}
                <div className="absolute inset-0 rounded-2xl bg-neutral-900 shadow-xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="relative z-10 p-5 md:p-6 flex flex-col justify-between h-full text-white">
                    <div className="flex justify-between items-start">
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-80">Mastercard</p>
                      <svg className="w-9 h-9" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"/>
                        <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"/>
                        <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"/>
                      </svg>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <svg className="w-[30px] h-[30px]" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
                        <rect x="5" y="5" width="40" height="40" rx="8" fill="#e8b84b" stroke="#c99a2e" strokeWidth="1.5"/>
                        <rect x="12" y="12" width="26" height="26" rx="4" fill="none" stroke="#c99a2e" strokeWidth="1"/>
                        <line x1="25" y1="5" x2="25" y2="45" stroke="#c99a2e" strokeWidth="0.8"/>
                        <line x1="5" y1="25" x2="45" y2="25" stroke="#c99a2e" strokeWidth="0.8"/>
                        <rect x="20" y="20" width="10" height="10" rx="2" fill="#d4a830" opacity="0.5"/>
                      </svg>
                      <p className="font-mono text-sm md:text-base font-bold tracking-wider h-5">{cardNumber || 'XXXX XXXX XXXX XXXX'}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] font-semibold tracking-wider">{cardName || 'John Doe'}</p>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <p className="text-[6px] font-light opacity-60 uppercase tracking-wider">VALIDITÉ</p>
                          <p className="text-[10px] md:text-xs font-semibold tracking-wider">{expDate || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Back - Mastercard dark design */}
                <div className="absolute inset-0 rounded-2xl bg-neutral-900 shadow-xl overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="w-full h-10 md:h-11 mt-5" style={{ background: 'repeating-linear-gradient(45deg,#303030,#303030 10px,#202020 10px,#202020 20px)' }} />
                    <div className="flex items-center mx-5 md:mx-6 mt-4 md:mt-5">
                      <div className="flex-1 h-8 md:h-9 bg-white rounded-md mr-2" />
                      <div className="bg-white rounded-md h-8 md:h-9 w-12 md:w-14 flex items-center justify-center">
                        <p className="font-bold text-sm text-gray-900">{ccv || '***'}</p>
                      </div>
                    </div>
                    <div className="mt-auto mb-4 md:mb-5 px-5 md:px-6 flex items-center justify-between">
                      <span className="text-[10px] font-black tracking-widest text-white/40">MASTERCARD</span>
                      <p className="text-[7px] text-white/30 ml-auto">code de sécurité</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Front - gradient card */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                   {theme.bgImage ? (
                     <img src={theme.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                   ) : (
                     <div className="absolute inset-0 rounded-2xl" style={gradientStyle} />
                   )}
                   <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                   <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
                   {network !== 'unknown' && (
                     theme.logoUrl ? <img src={theme.logoUrl} alt={network} className={`absolute top-3 right-3 md:top-4 md:right-4 w-auto ${network === 'amex' ? 'h-16 md:h-20' : network === 'unionpay' ? 'h-14 md:h-18' : 'h-5 md:h-6'}`} /> : <span className="absolute top-3 right-3 md:top-4 md:right-4 text-[10px] font-black tracking-widest text-white/90 drop-shadow">{network.toUpperCase()}</span>
                   )}
                    <div className="relative z-10 p-5 md:p-6 flex flex-col justify-between h-full text-white">
                     <div className="space-y-0.5">
                       <p className="text-[8px] font-light opacity-70">CARTE BANCAIRE</p>
                       <p className="text-[10px] font-light opacity-60">PixiaTech</p>
                     </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] font-light opacity-70 mb-1">Numéro de carte</p>
                        <p className="font-medium text-sm md:text-base tracking-wider h-5">{cardNumber || 'XXXX XXXX XXXX XXXX'}</p>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <p className="text-[8px] font-light opacity-70 mb-0.5">Titulaire</p>
                          <p className="text-xs md:text-sm font-medium tracking-wider h-4 truncate max-w-[140px]">{cardName || 'John Doe'}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-light opacity-70 mb-0.5">Expiration</p>
                          <p className="text-xs md:text-sm font-medium tracking-wider h-4">{expDate || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Back - gradient card */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  {theme.bgImage ? (
                    <img src={theme.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 rounded-2xl" style={gradientStyle} />
                  )}
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="bg-black/40 h-10 md:h-12 mt-5" />
                    <div className="flex items-center justify-end gap-1 px-5 md:px-6 mt-4">
                      <div className="flex-1 h-8 bg-white/90 rounded" />
                      <p className="bg-white text-gray-900 font-bold text-sm flex items-center justify-center h-8 w-14 rounded text-center">{ccv || '123'}</p>
                    </div>
                    <div className="mt-auto mb-4 md:mb-5 px-5 md:px-6 flex justify-between items-center">
                      {network !== 'unknown' && (
                        theme.logoUrl ? <img src={theme.logoUrl} alt={network} className={`w-auto opacity-60 ${network === 'amex' ? 'h-14 md:h-16' : network === 'unionpay' ? 'h-12 md:h-14' : 'h-4 md:h-5'}`} /> : <span className="text-[10px] font-black tracking-widest text-white/60 drop-shadow">{network.toUpperCase()}</span>
                      )}
                      <p className="text-[8px] font-light text-white/40 ml-auto">code de sécurité</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 bg-[#F9FAFB] rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Numéro de carte</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            onFocus={() => setFlipped(false)}
            className="w-full bg-white border border-gray-200/70 rounded-xl p-3 text-sm font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            placeholder="XXXX XXXX XXXX XXXX"
            maxLength={19}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Expiration</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5">
                <svg className="h-4 w-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M5 5a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1h1a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1h1a1 1 0 0 0 1-1 1 1 0 1 1 2 0 1 1 0 0 0 1 1 2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2ZM3 19v-7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Zm6.01-6a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm6 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-10 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm6 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                value={expDate}
                onChange={(e) => setExpDate(formatExpDate(e.target.value))}
                onFocus={() => setFlipped(false)}
                className="w-full bg-white border border-gray-200/70 rounded-xl p-3 ps-9 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              CVC
              <span className="relative group">
                <Info size={13} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] leading-tight rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 text-center pointer-events-none">
                  {isAmex ? "4 chiffres au recto" : "3 derniers chiffres au dos"} de la carte
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
              </span>
            </label>
            <input
              value={ccv}
              onChange={(e) => setCcv(e.target.value.replace(/\D/g, ''))}
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              className="w-full bg-white border border-gray-200/70 rounded-xl p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all text-center tracking-widest"
              placeholder={isAmex ? '1234' : '123'}
              maxLength={cvvLength}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Titulaire de la carte</label>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            onFocus={() => setFlipped(false)}
            className="w-full bg-white border border-gray-200/70 rounded-xl p-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            placeholder="John Doe"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          <span className="text-xs text-gray-500">Sauvegarder cette carte pour mes prochains achats</span>
        </label>
      </div>
    </div>
  );
}

function ConfettiEffect() {
  useEffect(() => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'];
    const interval = setInterval(() => {
      const el = document.createElement('div');
      el.className = 'absolute w-2 h-2 rounded-full';
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.top = '-10px';
      el.style.animation = `fall ${0.8 + Math.random() * 0.6}s ease-in-out forwards`;
      el.style.opacity = String(0.7 + Math.random() * 0.3);
      container.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }, 80);

    setTimeout(() => clearInterval(interval), 3000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [step, setStep] = useState<'payment' | 'confirmation'>('payment');

  if (items.length === 0 && step === 'payment') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-primary-900 mb-2">Votre panier est vide</h2>
          <button onClick={() => router.push('/boutique')} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all">
            Découvrir la boutique
          </button>
        </div>
      </div>
    );
  }

  const total = subtotal;
  const tva = total * 0.2;

  const handlePay = () => {
    clearCart();
    setStep('confirmation');
  };

  const transactionDetails = {
    transactionId: "TXN" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    amount: formatPrice(total),
    paymentMethod: "Carte Bancaire (****" + Math.floor(1000 + Math.random() * 9000) + ")",
    date: new Date().toLocaleString('fr-FR'),
    orderNumber: "ORD" + Date.now().toString(36).toUpperCase()
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center overflow-hidden relative">
        <div id="confetti-container" className="absolute inset-0 pointer-events-none overflow-hidden" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg relative z-10"
        >
          <ConfettiEffect />

          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100"
            >
              <Check className="h-10 w-10 text-primary-600" aria-hidden="true" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-3xl font-extrabold text-primary-900"
            >
              Commande confirmée !
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-2 text-sm text-gray-500"
            >
              Merci pour votre commande. Vous recevrez un email de confirmation sous peu.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gray-50 px-4 py-5 sm:p-6 rounded-xl"
          >
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">ID Transaction</dt>
                <dd className="text-sm font-semibold text-primary-900">{transactionDetails.transactionId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Montant payé</dt>
                <dd className="text-sm font-semibold text-primary-600">{transactionDetails.amount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Méthode de paiement</dt>
                <dd className="text-sm font-semibold text-primary-900">{transactionDetails.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Date & Heure</dt>
                <dd className="text-sm font-semibold text-primary-900">{transactionDetails.date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Numéro de commande</dt>
                <dd className="text-sm font-semibold text-primary-900">{transactionDetails.orderNumber}</dd>
              </div>
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col space-y-3"
          >
            <button
              onClick={() => router.push('/boutique')}
              className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all"
            >
              Retour à la boutique
            </button>
            <button
              onClick={() => window.print()}
              className="w-full border border-gray-300 py-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Télécharger le reçu
            </button>
          </motion.div>
        </motion.div>
        <style jsx>{`
          @keyframes fall {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR' }}>
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="flex items-center justify-between px-4 md:px-8 lg:px-12 h-16 border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/boutique/panier')}
            className="flex items-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200/70 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200 active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            aria-label="Retour au panier"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span className="hidden sm:inline">Panier</span>
          </button>
          <button
            onClick={() => router.push('/boutique')}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-gray-400 bg-white border border-gray-200/70 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 active:scale-[0.97] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
            aria-label="Retour à l'accueil"
          >
            <Home size={18} className="shrink-0" />
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <Store size={16} className="text-primary-600" />
          </div>
          <span className="font-bold text-base text-primary-900">Paiement</span>
        </div>
        <div className="w-[104px] hidden sm:block" />
      </header>

      <nav className="max-w-2xl mx-auto mt-12 mb-12 px-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -translate-y-1/2 z-0" />

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
              <Check size={14} />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Livraison</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#F5F5F5]">
              2
            </div>
            <span className="text-[11px] font-bold text-primary-900 uppercase tracking-wider">Paiement</span>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Confirmation</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8">
              <h2 className="text-lg font-bold text-primary-900 mb-6">Méthode de Paiement</h2>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-3 w-full border-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${paymentMethod === 'card' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <CreditCard size={20} />
                  Carte Bancaire
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`flex items-center justify-center gap-3 w-full border-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${paymentMethod === 'paypal' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  <img className="h-5 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/paypal-symbol.svg" alt="" />
                  PayPal
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="border-t border-gray-100 pt-6">
                  <CardForm />
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="py-4 border-t border-gray-100">
                  {!paypalClientId || paypalClientId === 'votre_client_id_ici' ? (
                    <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm font-semibold text-amber-800 mb-1">PayPal non configuré</p>
                      <p className="text-xs text-amber-600">Ajoutez votre <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans le fichier <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code></p>
                    </div>
                  ) : (
                    <PayPalButtons
                      style={{ layout: 'vertical', shape: 'rect', color: 'blue', label: 'pay' }}
                      createOrder={async () => {
                        const res = await fetch('/api/paypal/create-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: total }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        return data.id;
                      }}
                      onApprove={async (data) => {
                        try {
                          console.log('PayPal onApprove data:', data);
                          const res = await fetch('/api/paypal/capture-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: data.orderID }),
                          });
                          const capture = await res.json();
                          if (!res.ok) throw new Error(capture.error);
                          console.log('PayPal capture result:', capture);
                          if (capture.status === 'COMPLETED') {
                            handlePay();
                          } else {
                            alert('Statut inattendu: ' + capture.status);
                          }
                        } catch (err: any) {
                          console.error('PayPal error:', err);
                          alert('Erreur PayPal: ' + err.message);
                        }
                      }}
                      onError={(err) => {
                        console.error('PayPal button error:', err);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 mt-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Lock size={14} />
                <span className="text-[11px] font-medium">Paiement 256-bit SSL sécurisé</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Shield size={20} />
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8 sticky top-8">
              <h3 className="text-lg font-bold text-primary-900 mb-6">Récapitulatif</h3>

              <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-primary-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Qté: {item.quantity}</p>
                      <span className="text-sm font-bold text-primary-900">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200/40 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-semibold text-primary-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Livraison Express</span>
                  <span className="font-semibold text-emerald-600">Gratuite</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">TVA (20%)</span>
                  <span className="font-semibold text-primary-900">{formatPrice(Math.round(tva))}</span>
                </div>
              </div>

              <div className="border-t border-primary-600 mt-4 pt-4 flex justify-between items-end mb-6">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase">Total à payer</p>
                  <p className="text-xl font-bold text-primary-900">{formatPrice(total)}</p>
                </div>
              </div>

              <button
                onClick={handlePay}
                className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Payer {formatPrice(total)}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-4 px-4">
                En cliquant sur payer, vous acceptez nos conditions générales de vente et notre politique de confidentialité.
              </p>

              <div className="mt-5 flex items-center justify-center gap-5 border-t border-gray-100 pt-5">
                <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/paypal.svg" alt="PayPal" />
                <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/visa.svg" alt="Visa" />
                <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/mastercard.svg" alt="Mastercard" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
    </PayPalScriptProvider>
  );
}
