'use client';

/**
 * Intégration PayPal réutilisée, extraite verbatim de l'ancienne page de
 * paiement (`src/app/boutique/paiement/page.tsx`). Source de vérité unique :
 * toute évolution doit être répercutée dans ce module, jamais recodée.
 *
 * Le montant est TOUJOURS résolu côté serveur (`/api/paypal/create-order`) à
 * partir du panier reconstruit — jamais accepté du navigateur.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PayPalButtons, usePayPalScriptReducer, PayPalScriptProvider, FUNDING } from '@paypal/react-paypal-js';
import { AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { CartItem } from '@/contexts/CartContext';
import type { CustomerInfoValues } from '@/lib/customer-form-utils';
import type { BoutiqueAmountInput } from '@/lib/paypal-amount';

export class OutOfStockCheckoutError extends Error {
  isOutOfStock = true;
  productName?: string;
  constructor(message: string, productName?: string) {
    super(message);
    this.name = 'OutOfStockCheckoutError';
    this.productName = productName;
  }
}

export function parseOutOfStockDetails(
  errorMsg: unknown,
  items: CartItem[]
): { isOutOfStock: boolean; productName?: string } {
  if (typeof errorMsg !== 'string' || !errorMsg.trim()) {
    return { isOutOfStock: false };
  }

  const normalized = errorMsg.toLowerCase();
  const isOutOfStock =
    normalized.includes('rupture de stock') ||
    normalized.includes('out of stock') ||
    normalized.includes('indisponible à la location') ||
    normalized.includes('aucun stock disponible') ||
    normalized.includes('stock disponible') ||
    normalized.includes('quantité maximale disponible atteinte');

  if (!isOutOfStock) {
    return { isOutOfStock: false };
  }

  const matchedItem = items.find((item) => item.productId && errorMsg.includes(item.productId));
  const productName = matchedItem?.name
    ? matchedItem.variantName
      ? `${matchedItem.name} (${matchedItem.variantName})`
      : matchedItem.name
    : items.length === 1
      ? items[0]?.name
      : undefined;

  return {
    isOutOfStock: true,
    productName,
  };
}

export function checkoutModeBadge(type: string, t?: (key: string) => string): { label: string; colors: string } | null {
  if (type === 'rental') return { label: t ? (t('checkout.modeRental') || 'Location') : 'Location', colors: 'bg-blue-500 text-white' };
  if (type === 'purchase') return { label: t ? (t('checkout.modeSale') || 'Vente') : 'Vente', colors: 'bg-emerald-500 text-white' };
  return null;
}

export function PayPalCheckoutProvider({ clientId, children }: { clientId: string; children: React.ReactNode }) {
  return (
    <PayPalScriptProvider options={{ clientId, currency: 'EUR', components: 'buttons' }}>
      {children}
    </PayPalScriptProvider>
  );
}

export type PayPalClientConfig = {
  clientId: string;
  environment: 'sandbox' | 'live';
  enableCardPayments: boolean;
  loading: boolean;
};

/**
 * Récupère la configuration PayPal depuis le backend (settings/paypal) : le
 * clientId, l'environnement et l'activation du paiement par carte. Permet de
 * passer de sandbox → live sans recompiler. Retombe sur l'env var si l'API
 * échoue ou si rien n'est configuré.
 */
export function usePayPalConfig(): PayPalClientConfig {
  const [config, setConfig] = useState<PayPalClientConfig>({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    environment: 'sandbox',
    enableCardPayments: true,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    fetch('/api/paypal/client-id')
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setConfig({
          clientId: data?.clientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
          environment: data?.environment === 'live' ? 'live' : 'sandbox',
          enableCardPayments: data?.enableCardPayments !== false,
          loading: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setConfig((c) => ({ ...c, loading: false }));
      });
    return () => {
      active = false;
    };
  }, []);

  return config;
}

export function PayPalConfigBanner({ configured }: { configured: boolean }) {
  const { t } = useI18n();
  if (configured) return null;
  return (
    <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
      <p className="text-sm font-semibold text-amber-800 mb-1">{t('checkout.paypalNotConfigured') || 'PayPal n\'est pas encore configuré'}</p>
      <p className="text-xs text-amber-600">
        {t('checkout.paypalNotConfiguredDesc') ||
          'Configurez vos identifiants PayPal (clientId / secret) depuis le back-office, rubrique Paramètres > PayPal.'}
      </p>
    </div>
  );
}

export function PayPalButtonGroup({
  total,
  handlePay,
  items,
  delivery,
  deliveryCost,
  paymentContext,
  fundingSource,
  disabled,
  disabledMessage,
}: {
  total: number;
  handlePay: (isNew?: boolean) => void;
  items: CartItem[];
  delivery: CustomerInfoValues;
  deliveryCost: number;
  paymentContext: BoutiqueAmountInput;
  fundingSource?: (typeof FUNDING)[keyof typeof FUNDING];
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<{ productName?: string } | null>(null);
  const lastErrorWasStockRef = useRef(false);

  if (isRejected) {
    return (
      <div className="w-full bg-[#F9FAFB] rounded-xl p-5 md:p-6">
        <div className="text-center py-8 px-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-1">{t('checkout.paypalLoadError') || 'Erreur de chargement PayPal'}</p>
          <p className="text-xs text-red-600">{t('checkout.paypalLoadErrorDesc') || 'Le SDK PayPal n\'a pas pu être chargé. Veuillez rafraîchir la page.'}</p>
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
    <div className="w-full space-y-3">
      {stockError && (
        <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl shadow-sm text-amber-950 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-600">
              <AlertTriangle size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-amber-950">
                {t('checkout.outOfStockTitle') || 'Produit en rupture de stock'}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {stockError.productName
                  ? (t('checkout.outOfStockItemDesc', { productName: stockError.productName }) ||
                    `Le produit « ${stockError.productName} » vient malheureusement d'être acheté par un autre client et n'est plus disponible. Veuillez mettre à jour votre panier avant de continuer.`)
                  : (t('checkout.outOfStockDesc') ||
                    "Ce produit vient malheureusement d'être acheté par un autre client et n'est plus disponible. Veuillez mettre à jour votre panier avant de continuer.")}
              </p>
              <div className="pt-2">
                <Link
                  href="/boutique/panier"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <ArrowLeft size={14} />
                  <span>{t('checkout.backToCart') || 'Retourner au panier'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {disabled ? (
        <div className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 cursor-not-allowed text-center">
          <Lock size={15} className="text-gray-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-gray-500">
            {disabledMessage || (fundingSource === FUNDING.CARD ? (t('checkout.completeInfoToPay') || 'Complétez vos informations pour activer le paiement') : (t('checkout.fillEmailForPaypal') || 'Renseignez votre email ci-dessus pour activer PayPal'))}
          </span>
        </div>
      ) : (
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
            setStockError(null);
            setError(null);
            lastErrorWasStockRef.current = false;

            // Le montant est résolu côté serveur depuis le panier reconstruit.
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cart: paymentContext }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              const errorMsg = typeof data?.error === 'string' ? data.error : '';
              const outOfStock = parseOutOfStockDetails(errorMsg, items);
              const isStockIssue = res.status === 409 || outOfStock.isOutOfStock;

              if (isStockIssue) {
                lastErrorWasStockRef.current = true;
                setStockError({
                  productName: outOfStock.productName,
                });
                setError(null);
                // Interrompt proprement le flux sans trace technique
                throw new OutOfStockCheckoutError(errorMsg || 'Produit en rupture de stock', outOfStock.productName);
              }

              lastErrorWasStockRef.current = false;
              throw new Error(errorMsg || 'Erreur lors de la création de la commande');
            }

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
              const capture = await res.json().catch(() => ({}));
              if (!res.ok) {
                const errorMsg = typeof capture?.error === 'string' ? capture.error : '';
                const outOfStock = parseOutOfStockDetails(errorMsg, items);
                const isStockIssue = res.status === 409 || outOfStock.isOutOfStock;

                if (isStockIssue) {
                  lastErrorWasStockRef.current = true;
                  setStockError({
                    productName: outOfStock.productName,
                  });
                  setError(null);
                  return;
                }

                throw new Error(errorMsg || 'Erreur lors de la capture');
              }

              console.log('PayPal capture result:', capture);
              if (capture.status === 'COMPLETED') {
                handlePay(capture.isNewCustomer !== false);
              } else {
                setError((t('checkout.unexpectedStatus') || 'Statut inattendu: ') + capture.status);
              }
            } catch (err: any) {
              if (
                lastErrorWasStockRef.current ||
                err?.isOutOfStock ||
                err?.name === 'OutOfStockCheckoutError' ||
                (typeof err?.message === 'string' && parseOutOfStockDetails(err.message, items).isOutOfStock)
              ) {
                return;
              }
              console.error('PayPal error:', err);
              setError((t('checkout.paypalErrorPrefix') || 'Erreur PayPal: ') + (err?.message || (t('checkout.unknownError') || 'Erreur inconnue')));
            }
          }}
          onError={(err: any) => {
            if (
              lastErrorWasStockRef.current ||
              err?.isOutOfStock ||
              err?.name === 'OutOfStockCheckoutError' ||
              (typeof err?.message === 'string' && parseOutOfStockDetails(err.message, items).isOutOfStock)
            ) {
              // Cas métier attendu : rupture de stock concurrente.
              // On n'affiche pas de console.error rouge inutile.
              return;
            }
            console.error('PayPal error:', err);
            setError(t('checkout.paypalLoadErrorDesc') || 'Erreur de paiement PayPal. Veuillez réessayer.');
          }}
        />
      )}
      {error && !stockError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}