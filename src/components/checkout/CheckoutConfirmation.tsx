'use client';

/**
 * Confirmation de commande après paiement. Snapshot des articles + total pris
 * AVANT le vidage du panier — le panier est déjà vidé à ce stade.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { ArrowRight, Check, Lock, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/boutique-data';
import type { CartItem } from '@/contexts/CartContext';
import { checkoutModeBadge } from '@/components/checkout/paypal-checkout';

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

export default function CheckoutConfirmation({
  items,
  total,
  email,
  isNewCustomer,
}: {
  items: CartItem[];
  total: number;
  email: string;
  isNewCustomer: boolean;
}) {
  const [magicSending, setMagicSending] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState('');

  const orderRef = `ORD${Date.now().toString(36).toUpperCase()}`;

  const sendMagicLink = async () => {
    if (!email) {
      setMagicError('Aucune adresse email associée à cette commande.');
      return;
    }
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
        throw new Error(body?.error || "Échec de l'envoi");
      }
      setMagicSent(true);
    } catch (e: any) {
      setMagicError(e?.message || "Erreur lors de l'envoi du lien");
    } finally {
      setMagicSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5]">
      <ConfettiEffect />
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-5 py-12 sm:px-8">
        <div className="flex justify-center mb-5">
          <div className="rounded-full bg-emerald-500/10 p-1" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.2)' }}>
            <div className="rounded-full bg-emerald-500 p-3 shadow-lg shadow-emerald-500/20">
              <Check size={28} className="text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Paiement réussi, merci !
        </h1>
        <p className="mt-2 max-w-xl text-center text-sm leading-6 text-gray-500">
          Votre commande <span className="font-bold text-gray-900">#{orderRef}</span> a bien été enregistrée
          {isNewCustomer ? ' et un espace membre a été créé pour vous.' : '.'}
          {email ? ` Un email de confirmation a été envoyé à ${email}.` : ''}
        </p>

        <div className="mt-8 w-full rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-base font-bold text-gray-900">Récapitulatif de votre commande</h2>

          <div className="mt-4 space-y-4">
            {items.map((item, idx) => (
              <div key={item.productId + '-' + item.type + '-' + (item.variantName || '') + '-' + idx} className="flex items-center gap-4">
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
                  <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.variantName && !item.name.includes(item.variantName) && (
                    <p className="text-[10px] text-gray-500 font-medium">{item.variantName}</p>
                  )}
                  <p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200/70 pt-5">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Total payé</p>
              <p className="text-2xl font-black tracking-tight text-gray-900">{formatPrice(total)}</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <Lock size={13} />
              Paiement sécurisé
            </span>
          </div>

          {isNewCustomer && (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  <Mail size={17} className="text-indigo-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-indigo-900">Activez votre espace membre</h4>
                  <p className="mt-1 text-xs leading-5 text-indigo-800/80">
                    Un lien d&apos;accès sécurisé vous a été (ou sera) envoyé sur votre boîte mail. Consultez vos spams
                    si besoin. Retrouvez-y vos commandes passées et leurs suivis.
                  </p>
                  <button
                    onClick={sendMagicLink}
                    disabled={magicSending || magicSent}
                    className={cn(
                      'mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all',
                      magicSending || magicSent ? 'cursor-not-allowed bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                    )}
                  >
                    {magicSending ? <Loader2 size={13} className="animate-spin" /> : magicSent ? <Check size={13} /> : <Mail size={13} />}
                    {magicSending ? 'Envoi en cours…' : magicSent ? 'Email envoyé' : 'Renvoyer le lien par email'}
                  </button>
                  {magicError && <p className="mt-2 text-xs text-amber-700">{magicError}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/boutique"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Retour à la boutique
              <ArrowRight size={15} />
            </Link>
            <a
              href="/espace"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Accéder à mon espace membre
            </a>
          </div>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-gray-400">
          <Lock size={13} className="shrink-0" />
          Vos informations bancaires ne sont jamais stockées par PIXIATECH.
        </p>
      </div>
    </div>
  );
}