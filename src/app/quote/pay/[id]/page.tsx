'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PayPalScriptProvider, usePayPalScriptReducer, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { ShoppingBag, Lock, Shield, Check, Loader2, Package, User, MapPin, Mail, Phone, ArrowLeft, Tag, Percent, X, FileText, Sparkles } from 'lucide-react';
import type { QuoteRequest } from '@/lib/quote-requests';
import { InvoiceButton } from '@/components/invoice-button';
import { getPdfSettings } from '@/app/actions/quote-actions';
import type { PdfSettings } from '@/lib/types';
import confetti from 'canvas-confetti';

function ConfettiEffect() {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);
  return null;
}

function PayPalButtonGroup({ total, onSuccess }: { total: number; onSuccess: () => void }) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();
  const [error, setError] = useState<string | null>(null);

  if (isRejected) {
    return (
      <div className="w-full bg-gray-50 rounded-xl p-5">
        <div className="text-center py-8 px-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-1">Erreur de chargement PayPal</p>
          <p className="text-xs text-red-600">Le SDK PayPal n'a pas pu être chargé. Veuillez rafraîchir la page.</p>
        </div>
      </div>
    );
  }

  if (!isResolved) {
    return (
      <div className="w-full bg-gray-50 rounded-xl p-5 animate-pulse">
        <div className="h-14 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 rounded-xl p-5">
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
            setError(null);
            const quoteId = window.location.pathname.split('/').pop();
              const body: Record<string, any> = { orderId: data.orderID, quoteId };
              if ((window as any).__promoDocId) body.promoDocId = (window as any).__promoDocId;
              const res = await fetch('/api/quote-requests/capture-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const capture = await res.json();
            if (!res.ok) throw new Error(capture.error);
            if (capture.status === 'COMPLETED') {
              onSuccess();
            } else {
              setError('Statut inattendu: ' + capture.status);
            }
          } catch (err: any) {
            setError('Erreur PayPal: ' + err.message);
          }
        }}
        onError={() => setError('Erreur de paiement PayPal. Veuillez réessayer.')}
      />
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}
    </div>
  );
}

export default function QuotePayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'payment' | 'confirmation'>('payment');

  // Promo state
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState<{ discount: number; promoDocId: string; code: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Confirmation state
  const [orderRef, setOrderRef] = useState('');
  const [pdfSettings, setPdfSettings] = useState<PdfSettings | null>(null);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  useEffect(() => {
    if (!id) { setError('ID de devis manquant'); setLoading(false); return; }
    fetch(`/api/quote-requests/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        if (data.status !== 'accepted') { setError('Ce devis n\'est pas en attente de paiement.'); setLoading(false); return; }
        setQuote(data as QuoteRequest);
        setLoading(false);
      })
      .catch(() => { setError('Erreur lors du chargement du devis'); setLoading(false); });
    getPdfSettings().then(setPdfSettings).catch(() => {});
  }, [id]);

  const baseTotal = quote?.finalPrice || 0;
  const discount = promoData?.discount || 0;
  const total = Math.max(0, baseTotal - discount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), cartTotal: baseTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoData({ discount: data.discount, promoDocId: data.promoDocId, code: promoCode.trim().toUpperCase() });
        (window as any).__promoDocId = data.promoDocId;
        setPromoCode('');
      } else {
        setPromoError(data.error || 'Code invalide');
      }
    } catch {
      setPromoError('Erreur de validation');
    }
    setPromoLoading(false);
  };

  const handleRemovePromo = () => {
    setPromoData(null);
    setPromoError('');
    delete (window as any).__promoDocId;
  };

  const handleSuccess = () => {
    setOrderRef('ORD' + Date.now().toString(36).toUpperCase());
    setStep('confirmation');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          <p className="text-sm font-medium text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Paiement impossible</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={() => router.push('/boutique')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirmation') {
    const invoiceData = {
      orderRef: orderRef.replace('ORD', ''),
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerCompany: quote.customerCompany || undefined,
      customerAddress: quote.customerAddress,
      customerCity: quote.customerCity || '',
      customerPostcode: quote.customerPostcode || '',
      customerCountry: quote.customerCountry || 'FR',
      productName: quote.productName,
      quantity: quote.quantity,
      unitPrice: baseTotal / quote.quantity,
      subtotal: baseTotal,
      vat: 0,
      amountPaid: total,
      createdAt: new Date().toISOString(),
      type: 'sale' as const,
      products: [{ name: quote.productName, quantity: quote.quantity, unitPrice: baseTotal / quote.quantity, lineTotal: baseTotal }],
    };

    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-50 relative">
        <ConfettiEffect />
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
          {/* Success header */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center mb-4">
            <div className="bg-emerald-500/10 p-1 rounded-full mx-auto mb-4 w-fit">
              <div className="bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/20">
                <Check className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Paiement confirmé !</h1>
            <p className="text-sm text-gray-500">
              Merci <strong>{quote.customerName}</strong>, votre commande a bien été prise en compte.
            </p>
          </div>

          {/* Order details */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Détails de la commande</h2>
                <span className="text-xs font-mono font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{orderRef}</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {quote.productImage ? (
                  <img src={quote.productImage} alt={quote.productName} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{quote.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Quantité: {quote.quantity}</p>
                </div>
                <p className="text-lg font-extrabold text-gray-900">{total.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</p>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm bg-green-50 rounded-xl px-4 py-2.5">
                  <span className="text-green-700 font-medium flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Code promo appliqué</span>
                  <span className="text-green-700 font-bold">-{discount.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" /><span>{quote.customerName}{quote.customerCompany ? ` — ${quote.customerCompany}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /><span>{quote.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" /><span>{quote.customerAddress}{quote.customerCity ? `, ${quote.customerCity}` : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice & member space */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Télécharger la facture</p>
                <p className="text-xs text-gray-500 mt-0.5">Reçu officiel de votre transaction</p>
              </div>
              <InvoiceButton data={invoiceData} pdfSettings={pdfSettings || undefined}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all flex-shrink-0" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Espace membre créé</p>
                <p className="text-xs text-gray-500 mt-0.5">Un email vous a été envoyé pour accéder à votre espace et suivre votre commande.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => router.push('/boutique')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: quote.currency || 'EUR', intent: 'capture' }}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push('/boutique')}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 font-medium">Paiement sécurisé</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left - Payment form */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" /> Récapitulatif
                </h2>
                <div className="flex items-center gap-4">
                  {quote.productImage ? (
                    <img src={quote.productImage} alt={quote.productName} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-gray-400" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{quote.productName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Quantité: {quote.quantity}</p>
                  </div>
                  <p className="text-lg font-extrabold text-gray-900">{baseTotal.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> Informations client
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{quote.customerName}{quote.customerCompany ? ` — ${quote.customerCompany}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{quote.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{quote.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{quote.customerAddress}{quote.customerCity ? `, ${quote.customerCity}` : ''}{quote.customerPostcode ? ` ${quote.customerPostcode}` : ''}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" /> Paiement
                </h2>
                <PayPalButtonGroup total={total} onSuccess={handleSuccess} />
              </div>
            </div>

            {/* Right - Order total */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm sticky top-6 space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 mb-4">Total de la commande</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Sous-total</span>
                      <span className="font-semibold text-gray-900">{baseTotal.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1"><Percent className="w-3 h-3" /> Code promo</span>
                        <span className="font-semibold text-green-600">-{discount.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Livraison</span>
                      <span className="font-semibold text-gray-900">Offerte</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-extrabold text-gray-900">{total.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</span>
                    </div>
                  </div>
                </div>

                {/* Promo code */}
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Code promo
                  </h3>
                  {promoData ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-bold text-green-700">{promoData.code}</span>
                        <span className="text-xs text-green-600">-{promoData.discount.toLocaleString('fr-FR')} {quote.currency || 'EUR'}</span>
                      </div>
                      <button onClick={handleRemovePromo} className="p-1 hover:bg-green-100 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5 text-green-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text" value={promoCode} onChange={e => setPromoCode(e.target.value)}
                        placeholder="Entrez votre code"
                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                        className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                      />
                      <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                        className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Appliquer'}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-xs text-red-600 mt-2">{promoError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}