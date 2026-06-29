'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PayPalScriptProvider, usePayPalScriptReducer, PayPalButtons, FUNDING, PayPalCardFieldsProvider, PayPalNameField, PayPalNumberField, PayPalExpiryField, PayPalCVVField, usePayPalCardFields } from '@paypal/react-paypal-js';
import { ShoppingBag, Lock, Shield, Check, CreditCard, Wallet, MapPin, Mail, Phone, User, ChevronDown, Tag, X } from 'lucide-react';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/boutique-data';

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

function PayPalButtonGroup({ total, handlePay, items, delivery }: { total: number; handlePay: () => void; items: CartItem[]; delivery: Record<string, string> }) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);

  if (isRejected) {
    return (
      <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6">
        <div className="text-center py-8 px-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-1">Erreur de chargement PayPal</p>
          <p className="text-xs text-red-600">Le SDK PayPal n'a pas pu être chargé. Veuillez rafraîchir la page.</p>
        </div>
      </div>
    );
  }

  if (!isResolved) {
    return (
      <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6 animate-pulse">
        <div className="h-14 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6">
      <PayPalButtons
        fundingSource={FUNDING.PAYPAL}
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
            const rentalItems = items.filter(i => i.type === 'rental').map(i => ({
              productId: i.productId,
              productName: i.name,
              productImage: i.image,
              productPrice: i.price,
              quantity: i.quantity,
              renterDetails: i.renterDetails,
              rentalStartDate: i.rentalStartDate,
              rentalEndDate: i.rentalEndDate,
              rentalStartTime: i.rentalStartTime,
              rentalEndTime: i.rentalEndTime,
              additionalNotes: i.additionalNotes || '',
              contractSignedAt: i.contractSignedAt || null,
            }));
            const purchaseItems = items.filter(i => i.type === 'purchase').map(i => ({
              productId: i.productId,
              productName: i.name,
              productImage: i.image,
              productPrice: i.price,
              quantity: i.quantity,
            }));
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, rentalItems, purchaseItems, delivery }),
            });
            const capture = await res.json();
            if (!res.ok) throw new Error(capture.error);
            console.log('PayPal capture result:', capture);
            if (capture.status === 'COMPLETED') {
              handlePay();
            } else {
              setError('Statut inattendu: ' + capture.status);
            }
          } catch (err: any) {
            console.error('PayPal error:', err);
            setError('Erreur PayPal: ' + err.message);
          }
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          setError('Erreur de paiement PayPal. Veuillez réessayer.');
        }}
      />
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

const cardFieldStyle = {
  "input": {
    "border": "1px solid #e5e7eb",
    "borderRadius": "0.75rem",
    "padding": "9px 12px",
    "fontSize": "0.75rem",
    "lineHeight": "1.25rem",
    "color": "#111827",
    "backgroundColor": "#ffffff",
  },
  "input.focus": {
    "border": "1px solid #9ca3af",
    "boxShadow": "0 0 0 2px rgba(17, 24, 39, 0.1)",
    "outline": "none",
  },
  "input.invalid": {
    "border": "1px solid #ef4444",
  },
  "label": {
    "fontSize": "0",
    "color": "transparent",
    "padding": "0",
    "margin": "0",
    "lineHeight": "0",
    "height": "0",
    "overflow": "hidden",
  },
} satisfies Record<string, Record<string, string>>;

function CardSection({ total, handlePay, items, delivery, isDeliveryComplete }: { total: number; handlePay: () => void; items: CartItem[]; delivery: Record<string, string>; isDeliveryComplete: boolean }) {
  const { cardFieldsForm } = usePayPalCardFields();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardFieldsForm) { setReady(false); return; }
    const timer = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(timer);
  }, [cardFieldsForm]);

  const handleCardSubmit = async () => {
    if (!cardFieldsForm) return;
    setSubmitting(true);
    setCardError(null);
    try {
      await cardFieldsForm.submit();
    } catch (err: any) {
      console.error('CardFields submit error:', err);
      setCardError(err.message || 'Vérifiez vos informations bancaires');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isDeliveryComplete) {
    return (
      <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6">
        <div className="bg-amber-50 border border-dashed border-amber-200 rounded-xl p-6 text-center">
          <MapPin size={24} className="mx-auto text-amber-300 mb-2" />
          <p className="text-sm font-semibold text-amber-700 mb-1">Complétez l'adresse de livraison</p>
          <p className="text-xs text-amber-500">Remplissez les champs ci-dessus pour payer par carte bancaire.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6 space-y-4">
      <div className="space-y-4">
        {[
          { label: 'Nom du titulaire (optionnel)', Field: PayPalNameField, placeholder: 'Jean Dupont' },
          { label: 'Numéro de carte', Field: PayPalNumberField, placeholder: '1234 5678 9012 3456' },
        ].map(({ label, Field, placeholder }, i) => (
          <motion.div
            key={label}
            initial={false}
            animate={ready ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: i * 0.05 }}
          >
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="min-h-[38px]">
              {cardFieldsForm ? <Field placeholder={placeholder} style={cardFieldStyle} /> : null}
            </div>
          </motion.div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Date d'expiration", Field: PayPalExpiryField, placeholder: 'MM / AA' },
            { label: 'Cryptogramme', Field: PayPalCVVField, placeholder: '123' },
          ].map(({ label, Field, placeholder }, i) => (
            <motion.div
              key={label}
              initial={false}
              animate={ready ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: (i + 2) * 0.05 }}
            >
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
              <div className="min-h-[38px]">
                {cardFieldsForm ? <Field placeholder={placeholder} style={cardFieldStyle} /> : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <button
        onClick={handleCardSubmit}
        disabled={submitting || !ready}
        className="w-full py-3.5 px-5 rounded-xl text-sm font-bold text-white transition-all bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Lock size={14} />
        )}
        {submitting ? 'Paiement en cours…' : `Payer ${formatPrice(total)}`}
      </button>
      {cardError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {cardError}
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, promo, promoError, applyPromo, removePromo, totalAfterDiscount } = useCart();
  const [step, setStep] = useState<'payment' | 'confirmation'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [delivery, setDelivery] = useState({ firstName: '', lastName: '', email: '', phone: '', addressLine1: '', addressLine2: '', postcode: '', city: '' });
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [promoInput, setPromoInput] = useState('');

  const isDeliveryComplete = !!(delivery.firstName && delivery.lastName && delivery.email && delivery.phone && delivery.addressLine1 && delivery.postcode && delivery.city);

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

  const total = totalAfterDiscount;
  const tva = subtotal * 0.2;
  const discount = promo ? subtotal - totalAfterDiscount : 0;

  const handlePay = () => {
    if (promo?.promoDocId) {
      fetch('/api/promo/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoDocId: promo.promoDocId }),
      }).catch(() => {});
    }
    clearCart();
    setStep('confirmation');
  };

  const transactionDetails = {
    transactionId: "TXN" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    amount: formatPrice(total),
    paymentMethod: paymentMethod === 'card' ? 'Carte bancaire' : 'PayPal',
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
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Tag size={12} className="text-emerald-500" />
                      Code promo
                    </span>
                  </dt>
                  <dd className="text-sm font-semibold text-emerald-600">{promo?.code} (-{formatPrice(discount)})</dd>
                </div>
              )}
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
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR', components: 'buttons,card-fields' }}>
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>


      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 pb-16">
        {!paypalClientId || paypalClientId === 'votre_client_id_ici' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8">
                <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">PayPal non configuré</p>
                  <p className="text-xs text-amber-600">Ajoutez votre <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans le fichier <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code></p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8">
                {/* Payment method toggle — always visible */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard size={16} />
                    Carte bancaire
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      paymentMethod === 'paypal'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wallet size={16} />
                    PayPal
                  </button>
                </div>

                {/* Delivery Address - shared for both payment methods */}
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 mb-6">
                  <button
                    onClick={() => setDeliveryOpen(!deliveryOpen)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeliveryComplete ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                        {isDeliveryComplete ? (
                          <Check size={15} className="text-emerald-500" />
                        ) : (
                          <MapPin size={15} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Adresse de livraison</p>
                        <p className="text-[11px] text-gray-400">{isDeliveryComplete ? `${delivery.firstName} ${delivery.lastName}, ${delivery.addressLine1}, ${delivery.postcode} ${delivery.city}` : 'Requis pour la commande'}</p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${deliveryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {deliveryOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Prénom *</label>
                          <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Jean"
                              value={delivery.firstName}
                              onChange={e => setDelivery(d => ({ ...d, firstName: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nom *</label>
                          <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Dupont"
                              value={delivery.lastName}
                              onChange={e => setDelivery(d => ({ ...d, lastName: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="email"
                              placeholder="jean@exemple.fr"
                              value={delivery.email}
                              onChange={e => setDelivery(d => ({ ...d, email: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Téléphone mobile *</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="tel"
                              placeholder="06 12 34 56 78"
                              value={delivery.phone}
                              onChange={e => setDelivery(d => ({ ...d, phone: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ligne d'adresse 1 *</label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="123 Rue de l'Exemple"
                              value={delivery.addressLine1}
                              onChange={e => setDelivery(d => ({ ...d, addressLine1: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ligne d'adresse 2</label>
                          <div className="relative">
                            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Appartement, Bâtiment, etc."
                              value={delivery.addressLine2}
                              onChange={e => setDelivery(d => ({ ...d, addressLine2: e.target.value }))}
                              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Code postal *</label>
                          <input
                            type="text"
                            placeholder="75001"
                            value={delivery.postcode}
                            onChange={e => setDelivery(d => ({ ...d, postcode: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ville *</label>
                          <input
                            type="text"
                            placeholder="Paris"
                            value={delivery.city}
                            onChange={e => setDelivery(d => ({ ...d, city: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 transition-all bg-white placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {paymentMethod === 'card' ? (
                  <PayPalCardFieldsProvider
                    style={cardFieldStyle}
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
                        console.log('CardFields onApprove:', data);
                        const rentalItems = items.filter(i => i.type === 'rental').map(i => ({
                          productId: i.productId, productName: i.name, productImage: i.image,
                          productPrice: i.price, quantity: i.quantity, renterDetails: i.renterDetails,
                          rentalStartDate: i.rentalStartDate, rentalEndDate: i.rentalEndDate,
                          rentalStartTime: i.rentalStartTime, rentalEndTime: i.rentalEndTime,
                          additionalNotes: i.additionalNotes || '', contractSignedAt: i.contractSignedAt || null,
                        }));
                        const purchaseItems = items.filter(i => i.type === 'purchase').map(i => ({
                          productId: i.productId, productName: i.name, productImage: i.image,
                          productPrice: i.price, quantity: i.quantity,
                        }));
                        const res = await fetch('/api/paypal/capture-order', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: data.orderID, rentalItems, purchaseItems, delivery }),
                        });
                        const capture = await res.json();
                        if (!res.ok) throw new Error(capture.error);
                        if (capture.status === 'COMPLETED') handlePay();
                        else alert('Statut inattendu: ' + capture.status);
                      } catch (err: any) {
                        console.error('CardFields error:', err);
                        alert('Erreur PayPal: ' + err.message);
                      }
                    }}
                    onError={(err) => console.error('CardFields error:', err)}
                  >
                    <CardSection total={total} handlePay={handlePay} items={items} delivery={delivery} isDeliveryComplete={isDeliveryComplete} />
                  </PayPalCardFieldsProvider>
                ) : (
                  isDeliveryComplete ? (
                    <PayPalButtonGroup total={total} handlePay={handlePay} items={items} delivery={delivery} />
                  ) : (
                    <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <MapPin size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-gray-500 mb-1">Complétez l'adresse de livraison</p>
                      <p className="text-xs text-gray-400">Remplissez les champs ci-dessus pour payer avec PayPal.</p>
                    </div>
                  )
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
                <h3 className="text-lg font-bold text-gray-900 mb-6">Récapitulatif</h3>

                <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId + '-' + item.type} className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Qté: {item.quantity}</p>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {isDeliveryComplete && (
                  <div className="border-t border-gray-200/40 pt-4 pb-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={13} className="text-emerald-500" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Adresse de livraison</span>
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      <p className="font-medium">{delivery.firstName} {delivery.lastName}</p>
                      <p>{delivery.addressLine1}{delivery.addressLine2 ? ', ' + delivery.addressLine2 : ''}</p>
                      <p>{delivery.postcode} {delivery.city}</p>
                      <p className="text-gray-400 mt-1">{delivery.email} · {delivery.phone}</p>
                    </div>
                  </div>
                )}

                {/* Promo Code */}
                <div className="border-t border-gray-200/40 pt-4 pb-2">
                  {promo ? (
                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{promo.code}</span>
                        <span className="text-[11px] text-emerald-500">(-{formatPrice(discount)})</span>
                      </div>
                      <button onClick={removePromo} className="text-red-400 hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Code promo"
                          value={promoInput}
                          onChange={e => setPromoInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') applyPromo(promoInput); }}
                          className="flex-1 bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => applyPromo(promoInput)}
                          className="shrink-0 bg-gray-900 text-white px-3 py-2 rounded-xl text-[11px] font-semibold hover:bg-gray-800 transition-colors"
                        >
                          Appliquer
                        </button>
                      </div>
                      {promoError && <p className="text-[11px] text-red-500 mt-1.5">{promoError}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200/40 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Remise ({promo?.code})</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Livraison Express</span>
                    <span className="font-semibold text-emerald-600">Gratuite</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">TVA (20%)</span>
                    <span className="font-semibold text-gray-900">{formatPrice(Math.round(tva))}</span>
                  </div>
                </div>

                <div className="border-t border-gray-900 mt-4 pt-4 flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase">Total à payer</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(total)}</p>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <p className="text-center text-[11px] text-gray-400 mt-2 mb-4">
                    Remplissez vos coordonnées bancaires ci-dessus pour payer
                  </p>
                )}

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
        )}
      </main>
    </div>
    </PayPalScriptProvider>
  );
}
