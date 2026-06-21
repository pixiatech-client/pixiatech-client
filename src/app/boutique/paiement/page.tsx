'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PayPalScriptProvider, usePayPalScriptReducer, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { ArrowLeft, Store, ShoppingBag, Lock, Shield, Check, Home, CreditCard, Wallet } from 'lucide-react';
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

function PayPalButtonGroup({ fundingSource, total, handlePay, items }: { fundingSource: typeof FUNDING.PAYPAL | typeof FUNDING.CARD; total: number; handlePay: () => void; items: CartItem[] }) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();

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
        fundingSource={fundingSource}
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
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, rentalItems }),
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
          console.error('PayPal error:', err);
        }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<'payment' | 'confirmation'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

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
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR', components: 'buttons' }}>
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="flex items-center justify-between px-6 md:px-10 lg:px-14 h-16 border-b border-gray-200/60">
        <nav className="flex items-center gap-2">
          <button onClick={() => router.back()} className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#111827] text-white hover:bg-gray-800 transition-all duration-200">
            <ArrowLeft size={14} />
          </button>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 shadow-sm hover:shadow transition-all duration-200">
            <Home size={14} />
            Accueil
          </button>
          <button onClick={() => router.push('/boutique')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200/70 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 shadow-sm hover:shadow transition-all duration-200">
            <Store size={14} />
            Boutique
          </button>
        </nav>
        <div className="w-[104px] hidden sm:block" />
      </header>

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

                {paymentMethod === 'card' ? (
                  <PayPalButtonGroup fundingSource={FUNDING.CARD} total={total} handlePay={handlePay} items={items} />
                ) : (
                  <PayPalButtonGroup fundingSource={FUNDING.PAYPAL} total={total} handlePay={handlePay} items={items} />
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
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Qté: {item.quantity}</p>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200/40 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
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
                    Cliquez sur le bouton Carte bancaire ci-contre pour payer
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
