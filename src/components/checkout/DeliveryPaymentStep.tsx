'use client';

/**
 * Étape fusionnée « Livraison + Paiement » (TÂCHE 4+5).
 *
 * Layout desktop 2 colonnes : gauche (sections A/B/C), droite sticky (récap).
 *  - Section A — Mode de livraison (dérivé de `/api/shipping-methods`)
 *  - Section B — Moyen de paiement (Carte bancaire / PayPal), composants
 *    PayPal existants réutilisés verbatim (`paypal-checkout.tsx`)
 *  - Section C — Validation (CGV obligatoire) + CTA de paiement
 */

import { useEffect, useMemo, useState } from 'react';
import { FUNDING } from '@paypal/react-paypal-js';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Info,
  Loader2,
  Lock,
  MapPin,
  Pencil,
  ShieldCheck,
  Tag,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { cn } from '@/lib/utils';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/ProfileContext';
import { calculateCheckout } from '@/lib/checkout-calculations';
import { formatPrice } from '@/lib/boutique-data';
import { fetchProfessionalInfo } from '@/services/professionalInfoService';
import { DEFAULT_COUNTRY_OPTIONS } from '@/lib/customer-form-utils';
import type { CustomerInfoValues } from '@/lib/customer-form-utils';
import type { BoutiqueAmountInput } from '@/lib/paypal-amount';
import { PayPalButtonGroup, PayPalCheckoutProvider, checkoutModeBadge } from '@/components/checkout/paypal-checkout';

interface ShippingMethod {
  id: string;
  name: string;
  delay: string;
  price: number;
  isFree?: boolean;
}

export interface PaidPayload {
  isNewCustomer?: boolean;
  total: number;
}

export default function DeliveryPaymentStep({
  delivery,
  civility,
  companyName,
  onEditAddress,
  onPaid,
}: {
  delivery: CustomerInfoValues;
  civility: string;
  companyName: string;
  onEditAddress: () => void;
  onPaid: (payload: PaidPayload) => void;
}) {
  const { items, subtotal, totalAfterDiscount, promo, promoError, applyPromo, removePromo, clearCart } = useCart();
  const { profileType, setProfileType, isB2B, forceB2B } = useProfile();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const [vatRate, setVatRate] = useState(19);
  const [vatValidated, setVatValidated] = useState(false);
  const [vatNumber, setVatNumber] = useState('');

  const [outOfStockProductIds, setOutOfStockProductIds] = useState<string[]>([]);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

  // Modes de livraison pour l'adresse confirmée (config réelle, aucun tarif inventé).
  useEffect(() => {
    let cancelled = false;
    setShippingLoading(true);
    const params = new URLSearchParams();
    params.set('country', delivery.country || 'FR');
    if (delivery.postcode) params.set('postal_code', delivery.postcode);
    if (delivery.city) params.set('city', delivery.city);
    params.set('subtotal', String(totalAfterDiscount));
    fetch(`/api/shipping-methods?${params}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const list = Array.isArray(data?.methods) ? data.methods as ShippingMethod[] : [];
        setMethods(list);
        // Une option pré-sélectionnée (première méthode renvoyée).
        if (list.length) setSelectedMethodId(prev => prev ?? list[0].id);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });
    return () => { cancelled = true; };
  }, [delivery.country, delivery.postcode, delivery.city, totalAfterDiscount]);

  // TVA : taux affiché depuis la config, statut TVA du profil connecté.
  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, 'settings', 'main'), snap => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const ef = data?.estimationFlow;
        if (typeof ef?.taxRate === 'number' && ef.taxRate >= 0) setVatRate(ef.taxRate);
      }
    }, () => {});
    fetchProfessionalInfo().then(info => {
      if (info) {
        setVatValidated(info.vatValidated === true);
        setVatNumber(info.vatNumber || '');
      }
    }).catch(() => {});
    return () => unsub();
  }, []);

  // Vérification de stock proactive (parité avec l'ancienne page de paiement).
  useEffect(() => {
    if (items.length === 0) {
      setOutOfStockProductIds([]);
      return;
    }
    let active = true;
    fetch('/api/boutique/verify-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({
          productId: i.productId,
          type: i.type,
          quantity: i.quantity,
          variantReference: i.variantReference,
          variantName: i.variantName,
        })),
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (!active) return;
        if (Array.isArray(data?.outOfStockProductIds)) {
          setOutOfStockProductIds(data.outOfStockProductIds);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [items]);

  const selectedMethod = methods.find(m => m.id === selectedMethodId) ?? null;
  const deliveryCost = selectedMethod?.price ?? 0;

  // Parité panier ↔ checkout : la somme des livraisons figées des lignes de
  // location prime, sinon le coût recalculé depuis l'adresse de checkout.
  const rentalDeliverySum = items
    .filter(i => i.type === 'rental')
    .reduce((s, i) => s + (typeof i.deliveryCost === 'number' && Number.isFinite(i.deliveryCost) ? i.deliveryCost : 0), 0);
  const hasRentalDelivery = items.some(i => i.type === 'rental' && typeof i.deliveryCost === 'number');
  const effectiveDeliveryCost = hasRentalDelivery ? rentalDeliverySum : deliveryCost;

  const calc = useMemo(
    () => calculateCheckout({
      subtotal,
      totalAfterDiscount,
      deliveryCost: effectiveDeliveryCost,
      profileType,
      country: delivery.country || 'FR',
      vatValidated,
      vatNumber,
      vatRate,
    }),
    [subtotal, totalAfterDiscount, effectiveDeliveryCost, profileType, delivery.country, vatValidated, vatNumber, vatRate]
  );
  const tva = calc.vat;
  const total = calc.total;

  const discount = promo ? subtotal - totalAfterDiscount : 0;

  const paymentContext: BoutiqueAmountInput = useMemo(
    () => ({
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
      vatValidated,
      vatNumber: vatNumber || null,
      vatRate,
      promoCode: promo?.code || null,
      promoDocId: promo?.promoDocId || null,
    }),
    [items, delivery.postcode, delivery.city, delivery.country, profileType, vatValidated, vatNumber, vatRate, promo]
  );

  const hasCartOutOfStock = outOfStockProductIds.length > 0;
  const paypalBlockedByStock = hasCartOutOfStock;
  const cardBlockedByStock = hasCartOutOfStock;
  const termsBlocked = !acceptTerms;

  // Contexte serveur : montant jamais accepté du navigateur.
  const handlePay = (isNew?: boolean) => {
    onPaid({ isNewCustomer: isNew, total });
  };

  const cardDisabled = cardBlockedByStock || termsBlocked;
  const paypalDisabled = paypalBlockedByStock || termsBlocked;

  const blockerMessage = hasCartOutOfStock
    ? 'Paiement bloqué : article(s) en rupture de stock dans le panier'
    : 'Veuillez accepter les conditions générales de vente pour finaliser votre commande.';

  const countryLabel =
    DEFAULT_COUNTRY_OPTIONS.find(o => o.value === delivery.country)?.label ||
    DEFAULT_COUNTRY_OPTIONS.find(o => o.value === delivery.country?.toUpperCase())?.label ||
    delivery.country ||
    'France';

  const handleBlackCta = () => {
    if (!acceptTerms) {
      setTermsError('Veuillez accepter les conditions générales de vente.');
      return;
    }
    setTermsError('');
    document.getElementById('card-pay-cta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const shippingCards = shippingLoading
    ? null
    : methods.length > 0
      ? methods
      : [{ id: 'standard', name: 'Livraison standard', delay: '2-3 jours ouvrés', price: 0, isFree: true }];

  return (
    <PayPalCheckoutProvider clientId={paypalClientId}>
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        {/* ======= COLONNE GAUCHE (60 %) ======= */}
        <div className="space-y-6 lg:col-span-3">
          {hasCartOutOfStock && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5 text-red-600">
                  <AlertTriangle size={18} className="stroke-[2.5]" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-red-950">Commande bloquée : article(s) en rupture de stock</h4>
                  <p className="text-xs text-red-800">
                    Veuillez supprimer ou modifier ces articles depuis votre panier pour pouvoir finaliser votre commande.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== SECTION A — MODE DE LIVRAISON ===== */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                  <Truck size={17} />
                </span>
                <h2 className="text-lg font-bold text-gray-900">Mode de livraison</h2>
              </div>
              <button
                type="button"
                onClick={onEditAddress}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                <Pencil size={13} />
                Modifier l&apos;adresse
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {shippingLoading ? (
                <div className="space-y-3">
                  <div className="h-[72px] animate-pulse rounded-2xl bg-gray-100" />
                  <div className="h-[72px] animate-pulse rounded-2xl bg-gray-100" />
                </div>
              ) : (
                shippingCards!.map(m => {
                  const selected = selectedMethodId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethodId(m.id)}
                      aria-pressed={selected}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                        selected ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600')}>
                        <Truck size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900">{m.name}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{m.delay}</span>
                      </span>
                      <span className={cn('text-sm font-bold', m.isFree || m.price === 0 ? 'text-emerald-600' : 'text-gray-900')}>
                        {m.isFree || m.price === 0 ? 'Gratuit' : formatPrice(m.price)}
                      </span>
                      <span
                        className={cn(
                          'ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          selected ? 'border-gray-900' : 'border-gray-300'
                        )}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-gray-900" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* ===== SECTION B — MOYEN DE PAIEMENT ===== */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <CreditCard size={17} />
              </span>
              <h2 className="text-lg font-bold text-gray-900">Moyen de paiement</h2>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                aria-pressed={paymentMethod === 'card'}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                  paymentMethod === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-white ring-1 ring-gray-200">
                  <img className="h-4 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/visa.svg" alt="Visa" />
                  <img className="h-4 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/mastercard.svg" alt="Mastercard" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-900">Carte bancaire</span>
                  <span className="mt-0.5 block text-xs text-gray-500">Visa, Mastercard, CB</span>
                </span>
                <span
                  className={cn(
                    'ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    paymentMethod === 'card' ? 'border-gray-900' : 'border-gray-300'
                  )}
                >
                  {paymentMethod === 'card' && <span className="h-2 w-2 rounded-full bg-gray-900" />}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                aria-pressed={paymentMethod === 'paypal'}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                  paymentMethod === 'paypal' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-gray-200">
                  <img className="h-5 w-auto object-contain" src="/bot-avatars/PayPal.png" alt="PayPal" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-900">PayPal</span>
                  <span className="mt-0.5 block text-xs text-gray-500">Rapide et sécurisé</span>
                </span>
                <span
                  className={cn(
                    'ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    paymentMethod === 'paypal' ? 'border-gray-900' : 'border-gray-300'
                  )}
                >
                  {paymentMethod === 'paypal' && <span className="h-2 w-2 rounded-full bg-gray-900" />}
                </span>
              </button>
            </div>

            <div id="card-pay-cta" className="mt-5">
              {paymentMethod === 'card' ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={18} className="text-gray-700" />
                    <h4 className="text-sm font-bold text-gray-900">Payer par carte bancaire</h4>
                  </div>
                  {!paypalClientId || paypalClientId === 'votre_client_id_ici' ? (
                    <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm font-semibold text-amber-800 mb-1">Paiement PayPal non configuré</p>
                      <p className="text-xs text-amber-600">Ajoutez votre <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans le fichier <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code></p>
                    </div>
                  ) : (
                    <PayPalButtonGroup
                      total={total}
                      handlePay={handlePay}
                      items={items}
                      delivery={delivery}
                      deliveryCost={effectiveDeliveryCost}
                      paymentContext={paymentContext}
                      fundingSource={FUNDING.CARD}
                      disabled={cardDisabled}
                      disabledMessage={blockerMessage}
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet size={18} className="text-gray-700" />
                    <h4 className="text-sm font-bold text-gray-900">Paiement direct avec PayPal</h4>
                    <span className="text-base">
                      <img className="h-5 w-auto object-contain" src="/bot-avatars/PayPal.png" alt="PayPal" />
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Cliquez ci-dessous pour régler votre commande avec votre compte PayPal sans créer de compte.
                    Vos informations et votre adresse de livraison seront transmises automatiquement par PayPal.
                  </p>
                  {!paypalClientId || paypalClientId === 'votre_client_id_ici' ? (
                    <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-sm font-semibold text-amber-800 mb-1">Paiement PayPal non configuré</p>
                      <p className="text-xs text-amber-600">Ajoutez votre <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> dans le fichier <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">.env</code></p>
                    </div>
                  ) : (
                    <PayPalButtonGroup
                      total={total}
                      handlePay={handlePay}
                      items={items}
                      delivery={delivery}
                      deliveryCost={effectiveDeliveryCost}
                      paymentContext={paymentContext}
                      fundingSource={undefined}
                      disabled={paypalDisabled}
                      disabledMessage={blockerMessage}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ===== SECTION C — VALIDATION ===== */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <ShieldCheck size={17} />
              </span>
              <h2 className="text-lg font-bold text-gray-900">Validation</h2>
            </div>

            <label htmlFor="co-terms-payment" className="mt-5 flex cursor-pointer items-start gap-2.5">
              <input
                id="co-terms-payment"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => { setAcceptTerms(e.target.checked); setTermsError(''); }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-xs leading-5 text-gray-600">
                J&apos;accepte les conditions générales de vente et la{' '}
                <a
                  href="https://pixiatech.com/politique-confidentialite/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-blue-600 transition-colors hover:underline"
                >
                  politique de confidentialité
                </a>
                <span className="text-red-500"> *</span>.
              </span>
            </label>
            {termsError && (
              <p className="mt-1.5 text-[10px] text-red-500">{termsError}</p>
            )}

            <div className="mt-5">
              {paymentMethod === 'card' ? (
                <button
                  type="button"
                  onClick={handleBlackCta}
                  disabled={hasCartOutOfStock}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Lock size={15} />
                  Payer et commander — {formatPrice(total)}
                </button>
              ) : (
                <PayPalButtonGroup
                  total={total}
                  handlePay={handlePay}
                  items={items}
                  delivery={delivery}
                  deliveryCost={effectiveDeliveryCost}
                  paymentContext={paymentContext}
                  fundingSource={undefined}
                  disabled={paypalDisabled}
                  disabledMessage={blockerMessage}
                />
              )}
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-gray-400">
              <Lock size={13} className="shrink-0 text-gray-400" />
              Paiement 100% sécurisé — Vos données bancaires ne sont jamais stockées.
            </p>
          </section>
        </div>

        {/* ======= COLONNE DROITE — RÉCAP (40 %) ======= */}
        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm lg:sticky lg:top-8">
            <h3 className="text-lg font-bold text-gray-900">Récapitulatif de votre commande</h3>

            {/* Adresse condensée */}
            <div className="mt-4 flex items-start gap-3 border-b border-gray-100 pb-4">
              <span className="mt-0.5 shrink-0 text-gray-400"><MapPin size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {[civility, delivery.firstName, delivery.lastName].filter(Boolean).join(' ') || '—'}
                </p>
                {companyName.trim() && <p className="mt-0.5 text-[11px] font-medium text-gray-500">{companyName.trim()}</p>}
                <p className="mt-0.5 text-xs leading-5 text-gray-600">
                  {delivery.addressLine1}{delivery.addressLine2 ? ', ' + delivery.addressLine2 : ''}
                  <br />
                  {[delivery.postcode, delivery.city].filter(Boolean).join(' ')}
                  <br />
                  {countryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onEditAddress}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                <Pencil size={11} />
                Modifier
              </button>
            </div>

            {/* Articles */}
            <div className="mt-4 max-h-[280px] space-y-4 overflow-y-auto pb-2">
              {items.map((item, idx) => (
                <div key={item.productId + '-' + item.type + '-' + (item.variantName || '') + '-' + idx} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {(item.variantImage || item.image) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.variantImage || item.image!} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/no-product.webp" alt={item.name} className="h-full w-full object-cover" />
                    )}
                    {(() => {
                      const b = checkoutModeBadge(item.type);
                      return b ? (
                        <span className={`absolute right-0.5 top-0.5 rounded px-1 py-0.5 text-[7px] font-black uppercase tracking-wider shadow-sm ${b.colors}`}>{b.label}</span>
                      ) : null;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-900">{item.name}</h4>
                    {item.variantName && !item.name.includes(item.variantName) && (
                      <p className="text-[10px] text-gray-500 font-medium">{item.variantName}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">{item.quantity} × {formatPrice(item.price)}</p>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Code promo (réutilisé de l'ancienne page paiement) */}
            <div className="mt-2 border-t border-gray-200/40 pt-3">
              {promo ? (
                <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2.5">
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Code promo"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') applyPromo(promoInput); }}
                    className="min-w-0 flex-1 bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-400 transition-colors"
                  />
                  <button
                    onClick={() => applyPromo(promoInput)}
                    className="shrink-0 bg-gray-900 text-white px-3 py-2 rounded-xl text-[11px] font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              )}
              {promoError && <p className="text-[11px] text-red-500 mt-1.5">{promoError}</p>}
            </div>

            {/* Totaux */}
            <div className="mt-3 space-y-2 border-t border-gray-200/40 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total HT</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              {promo?.code && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Promo ({promo.code})</span>
                  <span className="font-semibold text-emerald-600">{discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Livraison</span>
                {shippingLoading ? (
                  <span className="text-xs text-gray-400 animate-pulse">Calcul...</span>
                ) : effectiveDeliveryCost === 0 ? (
                  <span className="font-semibold text-emerald-600">Gratuit</span>
                ) : (
                  <span className="font-semibold text-gray-900">{formatPrice(effectiveDeliveryCost)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{calc.vatLabel}</span>
                <span className="font-semibold text-gray-900">{formatPrice(Math.round(tva))}</span>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-gray-900 pt-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase">{calc.totalLabel}</p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(total)}</p>
              </div>
              {!forceB2B && (
                <div className="relative">
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="relative flex h-6 w-6 items-center justify-center"
                    aria-label="Quel type de client êtes-vous ?"
                  >
                    <Info size={15} className="relative z-10 text-blue-600" />
                  </button>
                  {showInfo && (
                    <div className="absolute right-0 bottom-full mb-2 z-20 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                      <p className="text-xs text-gray-500 leading-relaxed">Nos produits sont principalement destinés aux professionnels, entreprises, collectivités et revendeurs. Les particuliers peuvent également commander directement depuis notre boutique.</p>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Je suis un particulier
                          </button>
                          <button
                            onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Je suis une entreprise
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-5 border-t border-gray-100 pt-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/paypal.svg" alt="PayPal" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/visa.svg" alt="Visa" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-6 w-auto" src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/mastercard.svg" alt="Mastercard" />
            </div>
          </div>
        </aside>
      </div>
    </PayPalCheckoutProvider>
  );
}