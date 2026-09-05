'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PayPalScriptProvider, usePayPalScriptReducer, PayPalButtons, FUNDING, PayPalCardFieldsProvider, PayPalNameField, PayPalNumberField, PayPalExpiryField, PayPalCVVField, usePayPalCardFields } from '@paypal/react-paypal-js';
import { ShoppingBag, Lock, Shield, Check, CreditCard, Wallet, MapPin, User, ChevronDown, Tag, X, Info, Building2, ArrowLeft, ArrowRight } from 'lucide-react';
import CustomerInfoForm from '@/components/customer-info-form';
import CustomerLoginPrompt from '@/components/customer-login-prompt';
import {
  defaultCustomerValues,
  isCustomerInfoComplete,
  validateCustomerField,
  profileToCustomerValues,
} from '@/lib/customer-form-utils';
import type { CustomerInfoValues } from '@/lib/customer-form-utils';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/boutique-data';
import { calculateCheckout } from '@/lib/checkout-calculations';
import type { BoutiqueAmountInput } from '@/lib/paypal-amount';
import { useProfile } from '@/contexts/ProfileContext';
import type { PdfSettings } from '@/lib/types';
import { InvoiceButton } from '@/components/invoice-button';
import { getPdfSettings } from '@/app/actions/quote-actions';
import { getDoc, doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import LiquidLoader from '@/components/LiquidLoader';

function ConfettiEffect() {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return null;
}

function PayPalButtonGroup({ total, handlePay, items, delivery, deliveryCost, paymentContext, fundingSource }: { total: number; handlePay: (isNew?: boolean) => void; items: CartItem[]; delivery: CustomerInfoValues; deliveryCost: number; paymentContext: BoutiqueAmountInput; fundingSource?: (typeof FUNDING)[keyof typeof FUNDING] }) {
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
    <div className="w-full">
      <PayPalButtons
        fundingSource={fundingSource ?? FUNDING.PAYPAL}
        style={{
          layout: 'vertical',
          shape: 'rect',
          color: fundingSource === FUNDING.CARD ? 'black' : 'gold',
          height: 48,
          label: fundingSource === FUNDING.CARD ? 'pay' : 'paypal',
        }}
        createOrder={async () => {
          // Le montant est résolu côté serveur depuis le panier reconstruit.
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: paymentContext }),
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
              variantName: i.variantName,
              variantReference: i.variantReference,
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
              variantName: i.variantName,
              variantReference: i.variantReference,
            }));
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: data.orderID, cart: paymentContext, rentalItems, purchaseItems, delivery: { ...delivery } }),
            });
            const capture = await res.json();
            if (!res.ok) throw new Error(capture.error);
            console.log('PayPal capture result:', capture);
            if (capture.status === 'COMPLETED') {
              handlePay(capture.isNewCustomer !== false);
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

function CardSection({ total, handlePay, items, delivery, isDeliveryComplete, deliveryCost }: { total: number; handlePay: (isNew?: boolean) => void; items: CartItem[]; delivery: CustomerInfoValues; isDeliveryComplete: boolean; deliveryCost: number }) {
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
          <LiquidLoader size={16} />
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

function checkoutModeBadge(type: string): { label: string; colors: string } | null {
  if (type === 'rental') return { label: 'Location', colors: 'bg-blue-500 text-white' };
  if (type === 'purchase') return { label: 'Vente', colors: 'bg-emerald-500 text-white' };
  return null;
}

const VAT_MESSAGE_STYLES: Record<string, { container: string; text: string }> = {
  green:  { container: 'bg-emerald-50 border border-emerald-200/70', text: 'text-emerald-800' },
  orange: { container: 'bg-amber-50 border border-amber-200/70', text: 'text-amber-800' },
  yellow: { container: 'bg-yellow-50 border border-yellow-200/70', text: 'text-yellow-800' },
  blue:   { container: 'bg-indigo-50 border border-indigo-200/70', text: 'text-indigo-800' },
  gray:   { container: 'bg-slate-50 border border-slate-200/70', text: 'text-slate-700' },
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const { items, subtotal, clearCart, promo, promoError, applyPromo, removePromo, totalAfterDiscount } = useCart();
  const { t } = useI18n();
  const [step, setStep] = useState<'payment' | 'confirmation'>(isDemo ? 'confirmation' : 'payment');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>(isDemo ? 'paypal' : 'card');
  const [delivery, setDelivery] = useState<CustomerInfoValues>(defaultCustomerValues());
  const [deliveryErrors, setDeliveryErrors] = useState<Record<string, string>>({});
  const [deliveryTouched, setDeliveryTouched] = useState<Record<string, boolean>>({});
  const [deliveryOpen, setDeliveryOpen] = useState(true);
  const [promoInput, setPromoInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [pdfSettings, setPdfSettings] = useState<PdfSettings | null>(null);
  const [txId, setTxId] = useState('');
  const [ordNo, setOrdNo] = useState('');
  const [dateFmt, setDateFmt] = useState('');
  const [magicSending, setMagicSending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [productsOpen, setProductsOpen] = useState(items.length < 2);
  const [showInfo, setShowInfo] = useState(false);
  const { profileType, setProfileType, isB2B, forceB2B } = useProfile();
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [vatMessage, setVatMessage] = useState('Les prix affichés sont hors taxes. La TVA sera ajoutée au montant total lors du paiement.');
  const [vatMessageEnabled, setVatMessageEnabled] = useState(true);
  const [vatMessageColor, setVatMessageColor] = useState('orange');
  const [isPreFilledFromRental, setIsPreFilledFromRental] = useState(false);

  // Reflet de l'état courant pour les effets asynchrones (fetch réseau) :
  // évite d'écraser une valeur déjà saisie par l'utilisateur si le fetch
  // aboutit après son interaction avec le formulaire.
  const deliveryTouchedRef = useRef(deliveryTouched);
  deliveryTouchedRef.current = deliveryTouched;

  // Indique si une session client est active (détectée via session-status).
  // Si vrai, on n'affiche pas la proposition de connexion sous l'email.

  // Le premier pré-remplissage s'applique à tous les champs encore vides ;
  // un changement de session (customerId différent) autorise une re-application
  // complète, sinon on ne remplit que les champs non touchés et vides.
  const lastPrefillCustomerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const ef = data?.estimationFlow;
        if (typeof ef?.taxRate === 'number' && ef.taxRate > 0) setVatRate(ef.taxRate);
        if (typeof ef?.vatMessage === 'string' && ef.vatMessage.trim()) setVatMessage(ef.vatMessage);
        if (typeof ef?.vatMessageEnabled === 'boolean') setVatMessageEnabled(ef.vatMessageEnabled);
        if (typeof ef?.vatMessageColor === 'string' && ef.vatMessageColor.trim()) setVatMessageColor(ef.vatMessageColor);
      }
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    setTxId("TXN" + Math.random().toString(36).slice(2, 10).toUpperCase());
    setOrdNo("ORD" + Date.now().toString(36).toUpperCase());
    setDateFmt(new Date().toLocaleString('fr-FR'));
    setMounted(true);
    if (isDemo) setDelivery(d => ({ ...d, email: 'demo@example.com', firstName: 'Demo', lastName: 'User' }));
    getPdfSettings().then(setPdfSettings).catch(() => {});
  }, [isDemo]);

  // Pré-remplissage du formulaire :
  // Priorité 1 : profil client connecté (session active)
  // Priorité 2 : renterDetails d'un article de location dans le panier
  useEffect(() => {
    if (isDemo) return; // Ne pas interférer avec le mode démo

    async function prefillDelivery() {
      try {
        // Priorité 1 : client connecté via client_session
        const sessionRes = await fetch('/api/boutique/session-status');
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData?.loggedIn && sessionData.email) {
            // Le mapping session -> formulaire ne touche pas aux champs déjà saisis.
            // Un changement de session (customerId différent) autorise une re-application
            // complète sur les champs non touchés.
            const customerId = typeof sessionData.customerId === 'string' ? sessionData.customerId : null;
            const force = lastPrefillCustomerIdRef.current !== null
              && lastPrefillCustomerIdRef.current !== customerId;
            lastPrefillCustomerIdRef.current = customerId;
            applyProfilePrefill(profileToCustomerValues(sessionData), force);

            return; // Priorité 1 appliquée, on s'arrête ici.
          }
        }
      } catch { /* Ignorer les erreurs réseau et laisser le formulaire vide */ }

      // Priorité 2 : renterDetails présents dans un article de location du panier
      const rentalItem = items.find(i => i.type === 'rental' && i.renterDetails);
      if (!rentalItem?.renterDetails) return;

      const rd = rentalItem.renterDetails;

      // Mapping robuste de representative -> firstName / lastName
      // On sépare uniquement sur le premier espace ; tout le reste va dans lastName.
      // Cela évite de fragmenter des noms composés (Jean-Pierre Dupont, etc.).
      let firstName = '';
      let lastName = '';
      if (rd.representative) {
        const spaceIdx = rd.representative.indexOf(' ');
        if (spaceIdx !== -1) {
          firstName = rd.representative.slice(0, spaceIdx).trim();
          lastName = rd.representative.slice(spaceIdx + 1).trim();
        } else {
          // Un seul mot : on le met en lastName pour que NAME_RE passe
          lastName = rd.representative.trim();
        }
      }

      setDelivery(d => ({
        ...d,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(rd.email ? { email: rd.email } : {}),
        ...(rd.phone ? { phone: rd.phone } : {}),
        ...(rd.address ? { addressLine1: rd.address } : {}),
        ...(rd.city ? { city: rd.city } : {}),
        ...(rd.postcode ? { postcode: rd.postcode } : {}),
      }));
      setIsPreFilledFromRental(true);
    }

    prefillDelivery();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécuté une seule fois au montage ; items est lu via closure

  useEffect(() => {
    if (!delivery.postcode && !delivery.city) {
      setDeliveryCost(0);
      return;
    }
    const timer = setTimeout(async () => {
      setDeliveryLoading(true);
      try {
        const params = new URLSearchParams();
        if (delivery.postcode) params.set('postcode', delivery.postcode);
        if (delivery.city) params.set('city', delivery.city);
        params.set('subtotal', String(subtotal));
        const res = await fetch(`/api/boutique/delivery-cost?${params}`);
        const data = await res.json();
        if (data.deliveryCost !== undefined) setDeliveryCost(data.deliveryCost);
      } catch (e) {
        console.error('Failed to fetch delivery cost:', e);
      } finally {
        setDeliveryLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [delivery.postcode, delivery.city, subtotal]);

  const isDeliveryComplete = isCustomerInfoComplete(delivery);

  function handleDeliveryChange(field: keyof CustomerInfoValues, value: string) {
    setDelivery(d => ({ ...d, [field]: value }));
    if (deliveryTouched[field]) {
      const err = validateCustomerField(field, value);
      setDeliveryErrors(prev => err ? { ...prev, [field]: err } : { ...prev, [field]: '' });
    }
  }

  function handleDeliveryBlur(field: keyof CustomerInfoValues, value: string) {
    setDeliveryTouched(prev => ({ ...prev, [field]: true }));
    const err = validateCustomerField(field, value);
    setDeliveryErrors(prev => err ? { ...prev, [field]: err } : { ...prev, [field]: '' });
  }

  // Applique les valeurs du profil/session vers le formulaire en protégeant
  // la saisie manuelle : on ne remplit que les champs non touchés, et on
  // n'écrase jamais une valeur déjà présente (sauf le pays resté sur le
  // défaut 'FR', qui n'est pas une saisie utilisateur).
  function applyProfilePrefill(values: Partial<CustomerInfoValues>, force = false) {
    setDelivery(d => {
      const patch: Partial<CustomerInfoValues> = {};
      for (const [field, value] of Object.entries(values)) {
        if (value === undefined || value === '') continue;
        const key = field as keyof CustomerInfoValues;
        // Champ déjà modifié par l'utilisateur : on ne touche jamais.
        if (deliveryTouchedRef.current[key]) continue;
        if (force) {
          patch[key] = value as string;
          continue;
        }
        const current = d[key];
        if (current) {
          // Le pays par défaut 'FR' n'est pas une saisie : un profil valide
          // (ISO reconnu) peut le remplacer.
          if (key === 'country' && current === 'FR') patch[key] = value as string;
          continue;
        }
        patch[key] = value as string;
      }
      if (Object.keys(patch).length === 0) return d;
      return { ...d, ...patch };
    });
  }

  if (items.length === 0 && step === 'payment' && !isDemo) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F5F5F5]" style={{ backgroundColor: '#F5F5F5' }}>
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

  const discount = promo ? subtotal - totalAfterDiscount : 0;

  // Livraison : le panier somme le coût figé de CHAQUE ligne de location. Pour
  // garantir la parité panier ↔ checkout, on affiche ici la même somme par ligne.
  // Les paniers de vente (pas d'adresse par ligne) conservent le recalcul via
  // l'adresse de checkout (modèle existant, `deliveryCost`).
  const rentalDeliverySum = items
    .filter(i => i.type === 'rental')
    .reduce((s, i) => s + (typeof i.deliveryCost === 'number' && Number.isFinite(i.deliveryCost) ? i.deliveryCost : 0), 0);
  const hasRentalDelivery = items.some(i => i.type === 'rental' && typeof i.deliveryCost === 'number');
  const effectiveDeliveryCost = hasRentalDelivery ? rentalDeliverySum : deliveryCost;

  const calc = calculateCheckout({
    subtotal,
    totalAfterDiscount,
    deliveryCost: effectiveDeliveryCost,
    profileType,
    country: delivery.country || 'FR',
    vatValidated: false,
    vatRate,
  });
  const tva = calc.vat;
  const total = calc.total;
  const totalLabel = calc.totalLabel;
  const vatLabel = calc.vatLabel;

  // Contexte envoyé au serveur pour la résolution du montant (jamais d'`amount` client).
  const paymentContext: BoutiqueAmountInput = {
    items: items.map(i => ({
      productId: i.productId,
      productPrice: i.price,
      quantity: i.quantity,
      type: i.type,
      variantName: i.variantName,
      variantReference: i.variantReference,
      rentalStartDate: i.rentalStartDate,
      rentalEndDate: i.rentalEndDate,
      rentalStartTime: i.rentalStartTime,
      rentalEndTime: i.rentalEndTime,
      renterCity: i.type === 'rental' ? i.renterDetails?.city : undefined,
      renterPostcode: i.type === 'rental' ? i.renterDetails?.postcode : undefined,
    })),
    delivery: {
      postcode: delivery.postcode,
      city: delivery.city,
      country: delivery.country || 'FR',
    },
    clientType: profileType,
    promoCode: promo?.code || null,
    promoDocId: promo?.promoDocId || null,
  };

  const handlePay = (isNew?: boolean) => {
    if (isNew !== undefined) setIsNewCustomer(isNew);
    clearCart();
    setStep('confirmation');
  };

  if (step === 'confirmation') {
    const paymentLabel = paymentMethod === 'card' ? t('checkout.cardPayment') : t('checkout.paypal');
    const invoiceData = mounted ? {
      orderRef: ordNo.replace('ORD', ''),
      customerName: `${delivery.firstName} ${delivery.lastName}`.trim() || 'Client',
      customerEmail: delivery.email || 'email@exemple.com',
      customerCountry: delivery.country,
      customerAddress: delivery.addressLine1 + (delivery.addressLine2 ? ', ' + delivery.addressLine2 : ''),
      customerPostcode: delivery.postcode,
      customerCity: delivery.city,
      isB2B: isB2B,
      productName: items[0]?.name || 'Produit',
      quantity: items.reduce((s, i) => s + i.quantity, 0),
      unitPrice: items.reduce((s, i) => s + i.price * i.quantity, 0) / items.reduce((s, i) => s + i.quantity, 0) || 0,
      subtotal,
      vat: tva,
      amountPaid: total,
      createdAt: new Date().toISOString(),
      type: items.some(i => i.type === 'rental') ? 'rental' as const : 'sale' as const,
      products: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
        lineTotal: i.price * i.quantity,
      })),
    } : undefined;

    return (
      <div className="h-screen overflow-hidden flex flex-col items-center py-6 px-4 relative">
        <ConfettiEffect />

        {/* Success Header */}
        <header className="text-center mb-6 max-w-2xl">
          <div className="flex justify-center mb-3">
            <div className="bg-emerald-500/10 p-1 rounded-full" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
              <div className="bg-emerald-500 p-2.5 rounded-full shadow-lg shadow-emerald-500/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">{t('checkout.confirmed.paymentSuccess')}</h1>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">
            {t('checkout.confirmed.memberCreated')}
          </p>
        </header>

        {/* Main Grid */}
        <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <section className="lg:col-span-7 space-y-4">
            {/* Receipt Card */}
            <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden relative" style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)' }}>
              <button
                onClick={() => router.push('/boutique/paiement')}
                className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white border border-white/20 text-xs font-semibold hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                Retour
              </button>
              {/* Receipt Header */}
              <div className="p-5 flex justify-between items-center border-b border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{t('checkout.confirmed.transactionId')}</p>
                  <p className="text-lg font-extrabold text-slate-900">{txId || '...'}</p>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 mb-1 ${paymentMethod === 'card' ? 'bg-amber-50 border border-amber-100' : 'bg-[#E8F0FE] border border-[#0470DE]/20'}`}>
                    {paymentMethod === 'card' ? (
                      <span className="text-base">💳</span>
                    ) : (
                      <Image src="/bot-avatars/PayPal.png" alt="PayPal" width={20} height={20} className="object-contain" />
                    )}
                    <span className={`text-[11px] font-bold ${paymentMethod === 'card' ? 'text-amber-700' : 'text-[#013187]'}`}>{t('checkout.confirmed.paidVia', { method: paymentLabel })}</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400">{dateFmt || '...'}</p>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-5 grid grid-cols-2 gap-8">
                {/* Billing Info */}
                <div>
                  <h3 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">{isB2B ? 'Client (Entreprise)' : 'Client (Particulier)'}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('checkout.confirmed.client')}</p>
                      <p className="text-[12px] font-semibold text-slate-700">{delivery.firstName || '—'} {delivery.lastName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('checkout.confirmed.email')}</p>
                      <p className="text-[12px] font-semibold text-slate-700">{(delivery.email || '—').toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('checkout.confirmed.address')}</p>
                      <p className="text-[12px] font-semibold text-slate-700 leading-relaxed">
                        {delivery.addressLine1 || '—'}{delivery.addressLine2 ? ', ' + delivery.addressLine2 : ''}<br />
                        {delivery.postcode || ''} {delivery.city || ''}{delivery.country ? ` (${delivery.country})` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Payment Details */}
                <div>
                  <h3 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mb-4 border-l-4 border-indigo-500 pl-3">{t('checkout.confirmed.payment')}</h3>
                  <div className="space-y-2.5">
                    {[
                      [t('checkout.confirmed.orderNo'), ordNo || '...'],
                      [t('checkout.confirmed.method'), `${paymentLabel} Express`],
                      [t('checkout.confirmed.currency'), 'EUR (€)'],
                      [t('checkout.confirmed.items'), String(items.length).padStart(2, '0')],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <p className="text-[11px] font-medium text-slate-400">{label}</p>
                        <p className="text-[11px] font-bold text-slate-700">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Table */}
              <div className="px-5 pb-5">
                <div className="bg-slate-50 rounded-[16px] p-5 border border-slate-100">
                  <button
                    onClick={() => setProductsOpen(!productsOpen)}
                    className="flex items-center justify-between w-full mb-3 px-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">{t('checkout.confirmed.product')}</span>
                      {items.length >= 2 && (
                        <span className="text-[10px] font-bold text-slate-400">({items.length})</span>
                      )}
                    </div>
                    {items.length >= 2 && (
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  {productsOpen && (
                  <>
                    <div className="grid grid-cols-12 text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3 px-2">
                      <div className="col-span-6">{t('checkout.confirmed.product')}</div>
                      <div className="col-span-2 text-center">{t('checkout.confirmed.qty')}</div>
                      <div className="col-span-2 text-right">{t('checkout.confirmed.unit')}</div>
                      <div className="col-span-2 text-right">{t('checkout.confirmed.total')}</div>
                    </div>
                    {items.map((item) => (
                      <div key={item.productId + '-' + item.type + '-' + (item.variantName || '')} className="bg-white rounded-xl p-3.5 flex items-center shadow-sm border border-slate-100 mb-2 last:mb-0 hover:scale-[1.01] transition-transform duration-300">
                        <div className="grid grid-cols-12 w-full items-center">
                          <div className="col-span-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 relative">
                              <div className="w-full h-full bg-slate-900 rounded-xl ring-4 ring-slate-50">
                                {(item.variantImage || item.image) ? (
                                  <img src={item.variantImage || item.image!} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                  <img src="/no-product.webp" alt={item.name} className="w-full h-full object-cover rounded-xl" />
                                )}
                              </div>
                              {(() => {
                                const b = checkoutModeBadge(item.type);
                                return b ? (
                                  <div className="absolute -top-1 -right-1 z-10">
                                    <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shadow-sm ${b.colors}`}>{b.label}</span>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-extrabold text-slate-900 truncate">{item.name}</p>
                              {item.variantName && !item.name.includes(item.variantName) && (
                                <p className="text-[9px] text-slate-500 font-semibold">{item.variantName}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                                <p className="text-[9px] text-indigo-600 font-bold uppercase tracking-wide">{item.type === 'rental' ? t('checkout.confirmed.rentalInProgress') : t('checkout.confirmed.purchaseInProgress')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-[12px] font-bold text-slate-700">{item.quantity}</div>
                          <div className="col-span-2 text-right text-[11px] font-semibold text-slate-400">{formatPrice(item.price)}</div>
                          <div className="col-span-2 text-right text-[13px] font-extrabold text-slate-900">{formatPrice(item.price * item.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </>
                  )}
                </div>
              </div>
            </div>

            {/* Magic Link */}
            <div className="bg-white rounded-[24px] p-6 flex items-start gap-6 border border-slate-100 group" style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04), 0 8px 10px -6px rgba(0,0,0,0.04)' }}>
              <div className="bg-indigo-500 p-3 rounded-xl text-white shadow-lg shadow-indigo-200 transition-transform group-hover:rotate-6 duration-300 shrink-0">
                <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="22">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" /><path d="M19 17v4" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-extrabold text-slate-900 mb-1.5">
                  {isNewCustomer ? t('checkout.confirmed.magicLink') : 'Merci de votre confiance'}
                </h4>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                  {isNewCustomer
                    ? "Un espace réservé aux membres a été créé pour vous. Consultez votre email et n'oubliez pas de vérifier les spams pour activer votre accès exclusif."
                    : 'Retrouvez vos commandes et suivez leur suivi dans votre espace membre.'}
                </p>
                <button
                  onClick={async () => {
                    const email = delivery.email;
                    if (!email) { setMagicError('Aucune adresse email associée à cette commande.'); return; }
                    setMagicSending(true);
                    setMagicError('');
                    try {
                      const res = await fetch('/api/boutique/send-magic-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body?.error || 'Échec de l\'envoi');
                      }
                      setMagicSent(true);
                    } catch (e: any) {
                      setMagicError(e?.message || 'Erreur lors de l\'envoi');
                    } finally {
                      setMagicSending(false);
                    }
                  }}
                  disabled={magicSending || magicSent}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {magicSending ? (
                    <LiquidLoader size={16} />
                  ) : magicSent ? (
                    <Check size={14} />
                  ) : (
                    <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
                      <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-.239-.756Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z" />
                    </svg>
                  )}
                  {magicSending ? 'Envoi en cours…' : magicSent ? 'Email envoyé' : t('checkout.confirmed.checkEmail')}
                </button>
                {magicError && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 flex gap-2.5 items-start">
                    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">{magicError}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <aside className="lg:col-span-5 space-y-4">
            {/* Summary Card */}
            <div className="rounded-[24px] p-6 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl ring-1 ring-white/30">
                  <svg fill="currentColor" height="20" viewBox="0 0 16 16" width="20">
                    <path d="M1.92.506a.5.5 0 0 1 .434.14L3 1.293l.646-.647a.5.5 0 0 1 .708 0L5 1.293l.646-.647a.5.5 0 0 1 .708 0L7 1.293l.646-.647a.5.5 0 0 1 .708 0L9 1.293l.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .801.13l.5 1A.5.5 0 0 1 15 2v12a.5.5 0 0 1-.053.224l-.5 1a.5.5 0 0 1-.8.13L13 14.707l-.646.647a.5.5 0 0 1-.708 0L11 14.707l-.646.647a.5.5 0 0 1-.708 0L9 14.707l-.646.647a.5.5 0 0 1-.708 0L7 14.707l-.646.647a.5.5 0 0 1-.708 0L5 14.707l-.646.647a.5.5 0 0 1-.708 0L3 14.707l-.646.647a.5.5 0 0 1-.801-.13l-.5-1A.5.5 0 0 1 1 14V2a.5.5 0 0 1 .053-.224l.5-1a.5.5 0 0 1 .367-.27ZM14 14V2H2v12h12Z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em] mb-0.5">{t('checkout.confirmed.summaryId')}</p>
                  <p className="text-[11px] font-extrabold tracking-tight">#{txId ? txId.slice(-8) : '...'}</p>
                </div>
              </div>
              <div className="mb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-white/80 mb-1">{totalLabel}</p>
                  {!forceB2B && (
                  <div className="relative">
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className="relative flex items-center justify-center w-6 h-6 group mb-1"
                    >
                      <Info size={15} className="relative z-10 text-white/80" />
                      <span className="absolute inset-0 z-0 animate-ping rounded-full bg-white/20 group-hover:bg-white/30" style={{ animationDuration: '2.5s' }} />
                    </button>
                    {showInfo && (
                      <div className="absolute z-20 right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                        <p className="text-xs text-gray-500 leading-relaxed">Nos produits sont principalement destinés aux professionnels, entreprises, collectivités et revendeurs. Les particuliers peuvent également commander directement depuis notre boutique.</p>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'particulier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              <User size={16} />
                              Je suis un particulier
                            </button>
                            <button
                              onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'entreprise' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              <Building2 size={16} />
                              Je suis une entreprise
                            </button>
                          </div>
                        </div>
                        <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <h2 className="text-4xl font-[900] tracking-tighter">{formatPrice(total)}</h2>
                <p className="text-[9px] font-bold text-white/50 mt-2 uppercase tracking-widest">{vatMessageEnabled ? vatMessage : 'Prix toutes taxes comprises (TTC)'}</p>
              </div>
              <div className="space-y-3 mb-6 border-t border-white/20 pt-5 relative z-10">
                {[
                  ['Sous-total HT', formatPrice(subtotal)],
                  ...(discount > 0 ? [[`Promo (${promo?.code})`, `-${formatPrice(discount)}`]] : []),
                  [vatLabel, formatPrice(Math.round(tva))],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between items-center text-[13px]">
                    <span className="text-white/70 font-medium">{label}</span>
                    <span className="font-extrabold">{val}</span>
                  </div>
                ))}
              </div>
              {/* Security Banner */}
              <div className="bg-black/20 backdrop-blur-xl rounded-xl p-3.5 flex gap-3 ring-1 ring-white/10 relative z-10">
                <div className="pt-0.5">
                  <svg className="text-indigo-300" fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
                    <path d="M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.775 11.775 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.158 7.158 0 0 0 1.048-.625 11.777 11.777 0 0 0 2.517-2.453c1.678-2.195 2.961-5.513 2.365-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">{t('checkout.confirmed.security')}</p>
                  <p className="text-[10px] text-white/60 leading-relaxed font-medium">{t('checkout.confirmed.securityDesc')}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {mounted && pdfSettings && invoiceData ? (
                <InvoiceButton data={invoiceData} pdfSettings={pdfSettings} className="w-full bg-slate-900 text-white py-4 rounded-[20px] text-[13px] font-bold flex items-center justify-center gap-3 hover:bg-black hover:shadow-2xl hover:shadow-slate-300 transition-all active:scale-[0.98]" />
              ) : (
                <button disabled className="w-full bg-slate-300 text-white py-4 rounded-[20px] text-[13px] font-bold flex items-center justify-center gap-3 cursor-not-allowed">
                  <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                  </svg>
                  {t('checkout.confirmed.downloadInvoice')}
                </button>
              )}
              <button onClick={() => router.push('/boutique')} className="w-full bg-white text-slate-700 py-4 rounded-[20px] text-[13px] font-bold border border-slate-200 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]">
                <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
                  <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zm3 4V3a3 3 0 1 0-6 0v2H2a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3zM2 6h12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
                </svg>
                {t('checkout.confirmed.backToShop')}
              </button>
            </div>
          </aside>
        </main>


      </div>
    );
  }

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'EUR', components: 'buttons' }}>
    <div className="w-full min-h-screen bg-[#F5F5F5]" style={{ backgroundColor: '#F5F5F5' }}>


      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 pb-16">
        {!paypalClientId || paypalClientId === 'votre_client_id_ici' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8">
                <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">{t('checkout.paypalNotConfigured')}</p>
                  <p className="text-xs text-amber-600">Ajoutez votre <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans le fichier <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code></p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8">
                <button
                  onClick={() => router.push('/boutique/panier')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white border border-white/20 text-xs font-semibold hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer mb-4"
                >
                  <ArrowLeft size={14} />
                  Retour
                </button>
                {/* Payment method toggle — always visible */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card');
                      if (!isDeliveryComplete) setDeliveryOpen(true);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard size={16} />
                    {t('checkout.cardPayment')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('paypal');
                      if (!isDeliveryComplete) setDeliveryOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                      paymentMethod === 'paypal'
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Wallet size={16} />
                    {t('checkout.paypal')}
                  </button>
                </div>

                {/* Connexion facultative — entre les boutons de paiement et le formulaire.
                    Non bloquante : le client peut toujours continuer en invité.
                    Le composant réutilisable masque automatiquement le bloc si le
                    client est déjà connecté (session-status). */}
                <CustomerLoginPrompt email={delivery.email} />

                {/* PayPal direct payment block — displayed immediately when PayPal tab is active */}
                {paymentMethod === 'paypal' && (
                  <div className="bg-[#F9FAFB] border border-gray-200/80 rounded-2xl p-5 md:p-6 mb-6">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Image src="/bot-avatars/PayPal.png" alt="PayPal" width={22} height={22} className="object-contain" />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Paiement direct avec PayPal</h4>
                        <p className="text-[11px] text-gray-500">Rapide, sécurisé et sans saisie d'adresse obligatoire</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      Cliquez ci-dessous pour régler votre commande avec votre compte PayPal ou par carte sans créer de compte. Vos informations et votre adresse de livraison seront transmises automatiquement par PayPal.
                    </p>
                    <PayPalButtonGroup
                      total={total}
                      handlePay={handlePay}
                      items={items}
                      delivery={delivery}
                      deliveryCost={deliveryCost}
                      paymentContext={paymentContext}
                      fundingSource={FUNDING.PAYPAL}
                    />
                  </div>
                )}

                {/* Delivery Address - shared for both payment methods */}
                <div className="bg-gray-50/50 rounded-xl border border-gray-100 mb-6">
                  <button
                    type="button"
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
                        <p className="text-sm font-semibold text-gray-900">
                          {t('checkout.deliveryAddress')}
                          {paymentMethod === 'paypal' && (
                            <span className="ml-2 text-[10px] font-normal text-gray-400 uppercase tracking-wider">(Optionnel)</span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {isDeliveryComplete
                            ? `${delivery.firstName} ${delivery.lastName}, ${delivery.addressLine1}, ${delivery.postcode} ${delivery.city}`
                            : paymentMethod === 'paypal'
                              ? 'Optionnel — transmis directement via votre compte PayPal'
                              : 'Requis pour commander par carte bancaire'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${deliveryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {deliveryOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      <CustomerInfoForm
                        values={delivery}
                        errors={deliveryErrors}
                        touched={deliveryTouched}
                        onFieldChange={handleDeliveryChange}
                        onFieldBlur={handleDeliveryBlur}
                        onCitySelect={(cityName, postcode) => {
                          setDelivery(d => ({ ...d, city: cityName, postcode }));
                          setDeliveryErrors(prev => ({ ...prev, city: '', postcode: '' }));
                          if (!deliveryTouched.city) setDeliveryTouched(prev => ({ ...prev, city: true }));
                          if (!deliveryTouched.postcode) setDeliveryTouched(prev => ({ ...prev, postcode: true }));
                        }}
                        banner={isPreFilledFromRental ? 'Vos informations ont été récupérées depuis votre location. Vous pouvez les modifier si nécessaire.' : null}
                      />
                    </div>
                  )}
                </div>


                {paymentMethod === 'card' && (
                  isDeliveryComplete ? (
                    <div className="bg-[#F9FAFB] border border-gray-200/80 rounded-2xl p-5 md:p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard size={18} className="text-gray-700" />
                        <h4 className="text-sm font-bold text-gray-900">Payer par carte bancaire</h4>
                      </div>
                      <PayPalButtonGroup
                        total={total}
                        handlePay={handlePay}
                        items={items}
                        delivery={delivery}
                        deliveryCost={deliveryCost}
                        paymentContext={paymentContext}
                        fundingSource={FUNDING.CARD}
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                      <MapPin size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-gray-500 mb-1">{t('checkout.completeDeliveryAddress')}</p>
                      <p className="text-xs text-gray-400">Renseignez vos coordonnées de livraison ci-dessus pour activer le paiement par carte bancaire.</p>
                    </div>
                  )
                )}

              </div>

              <div className="flex items-center justify-between px-4 mt-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Lock size={14} />
                  <span className="text-[11px] font-medium">{t('checkout.securePayment')}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Shield size={20} />
                </div>
              </div>
            </section>

            <aside className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-gray-200/70 p-6 md:p-8 sticky top-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">{t('cart.summary')}</h3>

                <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId + '-' + item.type + '-' + (item.variantName || '')} className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                        {(item.variantImage || item.image) ? (
                          <img src={item.variantImage || item.image!} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src="/no-product.webp" alt={item.name} className="w-full h-full object-cover" />
                        )}
                        {(() => {
                          const b = checkoutModeBadge(item.type);
                          return b ? (
                            <div className="absolute top-0.5 right-0.5 z-10">
                              <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shadow-sm ${b.colors}`}>{b.label}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        {item.variantName && !item.name.includes(item.variantName) && (
                          <p className="text-[10px] text-gray-500 font-medium">{item.variantName}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{t('checkout.qty', { quantity: String(item.quantity) })}</p>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {isDeliveryComplete && (
                  <div className="border-t border-gray-200/40 pt-4 pb-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={13} className="text-emerald-500" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{t('checkout.deliveryAddress')}</span>
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed">
                      <p className="font-medium">{delivery.firstName} {delivery.lastName}</p>
                      <p>{delivery.addressLine1}{delivery.addressLine2 ? ', ' + delivery.addressLine2 : ''}</p>
                      <p>{delivery.postcode} {delivery.city} {delivery.country}</p>
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
                          placeholder={t('checkout.promoCode')}
                          value={promoInput}
                          onChange={e => setPromoInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') applyPromo(promoInput); }}
                          className="min-w-0 flex-1 bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-400 transition-colors"
                        />
                        <button
                          onClick={() => applyPromo(promoInput)}
                          className="shrink-0 bg-gray-900 text-white px-3 py-2 rounded-xl text-[11px] font-semibold hover:bg-gray-800 transition-colors"
                        >
                          {t('cart.apply')}
                        </button>
                      </div>
                      {promoError && <p className="text-[11px] text-red-500 mt-1.5">{promoError}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200/40 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('cart.subtotalHT')}</span>
                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">{t('cart.discount')} ({promo?.code})</span>
                      <span className="font-semibold text-emerald-600">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('cart.expressDelivery')}</span>
                    {hasRentalDelivery ? (
                      effectiveDeliveryCost === 0 ? (
                        <span className="font-semibold text-emerald-600">{t('cart.free')}</span>
                      ) : (
                        <span className="font-semibold text-gray-900">{formatPrice(effectiveDeliveryCost)}</span>
                      )
                    ) : !delivery.postcode && !delivery.city ? (
                      <span className="text-xs text-emerald-600 font-semibold">Saisissez votre adresse</span>
                    ) : deliveryLoading ? (
                      <span className="text-xs text-gray-400 animate-pulse">Calcul...</span>
                    ) : deliveryCost === 0 ? (
                      <span className="font-semibold text-emerald-600">{t('cart.free')}</span>
                    ) : (
                      <span className="font-semibold text-gray-900">{formatPrice(deliveryCost)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{vatLabel}</span>
                    <span className="font-semibold text-gray-900">{formatPrice(Math.round(tva))}</span>
                  </div>
                </div>

                <div className="border-t border-gray-900 mt-4 pt-4 flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase">{t('cart.totalToPay')}</p>
                    <p className="text-xl font-bold text-gray-900">{formatPrice(total)}</p>
                  </div>
                  {!forceB2B && (
                  <div className="relative">
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className="relative flex items-center justify-center w-6 h-6 group"
                    >
                      <Info size={15} className="relative z-10 text-blue-600" />
                      <span className="absolute inset-0 z-0 animate-ping rounded-full bg-blue-400/40 group-hover:bg-blue-400/60" style={{ animationDuration: '2.5s' }} />
                    </button>
                    {showInfo && (
                      <div className="absolute z-20 right-0 bottom-full mb-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                        <p className="text-xs text-gray-500 leading-relaxed">Nos produits sont principalement destinés aux professionnels, entreprises, collectivités et revendeurs. Les particuliers peuvent également commander directement depuis notre boutique.</p>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'particulier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              <User size={16} />
                              Je suis un particulier
                            </button>
                            <button
                              onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'entreprise' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                              <Building2 size={16} />
                              Je suis une entreprise
                            </button>
                          </div>
                        </div>
                        <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>

                {vatMessageEnabled && (() => {
                  const s = VAT_MESSAGE_STYLES[vatMessageColor] ?? VAT_MESSAGE_STYLES.orange;
                  return (
                    <div className={`mb-4 px-3 py-2.5 ${s.container} rounded-xl`}>
                      <p className={`text-[11px] ${s.text} leading-relaxed text-center`}>{vatMessage}</p>
                    </div>
                  );
                })()}

                {paymentMethod === 'card' && (
                  <p className="text-center text-[11px] text-gray-400 mt-2 mb-4">
                    {t('checkout.fillBankDetails')}
                  </p>
                )}

                <p className="text-center text-[11px] text-gray-400 mt-4 px-4">
                  {t('checkout.acceptTerms')}
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
