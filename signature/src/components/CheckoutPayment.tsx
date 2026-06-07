/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Pack } from '../types';

interface CheckoutPaymentProps {
  pack: Pack;
  onSubmitPayment: () => void;
  onGoBack: () => void;
}

export default function CheckoutPayment({ pack, onSubmitPayment, onGoBack }: CheckoutPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Simple auto formats
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const handlePayment = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !expiry || cvv.length < 3) return;

    setIsPaying(true);
    // Simulate payment clearing
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onSubmitPayment();
      }, 1500);
    }, 2200);
  };

  const totalInitial = pack.price + pack.deposit;

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-150">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 font-heading">
            Paiement sécurisé du premier loyer
          </h2>
          <p className="text-xs text-zinc-500">
            Frais initiaux comprenant le premier mois et le dépôt de garantie
          </p>
        </div>
      </div>

      {paymentSuccess ? (
        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mb-4 text-center">
            <CheckCircle size={36} className="animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 font-heading">
            Paiement autorisé !
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            Génération de votre dossier de confirmation en cours...
          </p>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="space-y-5">
          {/* Virtual Credit Card View - Styled in elegant royal brand blue */}
          <div className="relative w-full h-44 bg-gradient-to-br from-blue-700 via-blue-800 to-[#1e3a8a] text-white rounded-2xl p-5 shadow-inner border border-blue-500/20 overflow-hidden flex flex-col justify-between font-mono tracking-wider select-none">
            {/* Glossy background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[9px] text-blue-200 font-sans tracking-normal">PIXIATECH LED</span>
                <span className="text-[10px] font-bold font-heading text-white">PARTENAIRE DE CONFIANCE</span>
              </div>
              <div className="w-10 h-8 bg-white/10 border border-white/20 rounded-md backdrop-blur-md flex items-center justify-center text-[10px] font-sans text-white">
                VISA
              </div>
            </div>

            {/* Chip */}
            <div className="w-8 h-6 bg-amber-400 rounded-sm"></div>

            {/* Card number */}
            <div className="text-sm sm:text-base font-semibold tracking-widest text-white">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div className="flex justify-between items-end">
              <div>
                <span className="text-[7px] text-blue-200 block uppercase font-sans tracking-normal">Titulaire</span>
                <span className="text-xs text-white line-clamp-1 truncate font-sans tracking-wide">
                  {cardName.toUpperCase() || 'VOTRE NOM'}
                </span>
              </div>
              <div>
                <span className="text-[7px] text-blue-200 block uppercase font-sans tracking-normal">Valide Fin</span>
                <span className="text-xs text-white">
                  {expiry || 'MM/AA'}
                </span>
              </div>
              <div>
                <span className="text-[7px] text-blue-200 block uppercase font-sans tracking-normal">CVV</span>
                <span className="text-xs text-white">
                  {cvv || '•••'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="bg-zinc-100 rounded-xl p-4 flex justify-between items-center text-sm border border-zinc-200/60">
            <span className="text-zinc-650 font-medium font-sans">Total à régler aujourd'hui :</span>
            <span className="text-lg font-bold text-zinc-900 font-mono">
              {totalInitial.toLocaleString('fr-FR')}€ TTC
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="card-name-input" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Nom du titulaire de la carte
              </label>
              <input
                id="card-name-input"
                type="text"
                required
                placeholder="M. Marc DUPONT"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                disabled={isPaying}
                className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-white rounded-xl text-zinc-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans placeholder-zinc-350"
              />
            </div>

            <div>
              <label htmlFor="card-num-input" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Numéro de carte bancaire
              </label>
              <input
                id="card-num-input"
                type="text"
                required
                placeholder="4970 •••• •••• 1234"
                value={cardNumber}
                onChange={handleCardNumberChange}
                disabled={isPaying}
                className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-white rounded-xl text-zinc-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono placeholder-zinc-350"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="card-expiry-input" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Date d'expiration
                </label>
                <input
                  id="card-expiry-input"
                  type="text"
                  required
                  placeholder="MM/AA"
                  maxLength={5}
                  value={expiry}
                  onChange={handleExpiryChange}
                  disabled={isPaying}
                  className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-white rounded-xl text-zinc-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center font-mono placeholder-zinc-350"
                />
              </div>

              <div>
                <label htmlFor="card-cvv-input" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Cryptogramme (CVV)
                </label>
                <input
                  id="card-cvv-input"
                  type="password"
                  required
                  maxLength={3}
                  placeholder="•••"
                  value={cvv}
                  onChange={handleCvvChange}
                  disabled={isPaying}
                  className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-white rounded-xl text-zinc-850 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-center font-mono placeholder-zinc-350"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-550 bg-zinc-50 p-3 rounded-lg border border-zinc-200/50">
            <ShieldCheck className="text-blue-600 shrink-0" size={16} />
            <span>
              Vos transactions sont entièrement cryptées via SSL 256 bits conforme au standard PCI-DSS.
            </span>
          </div>

          <div className="flex gap-3 pt-3">
            <button
               id="btn-back-checkout"
               type="button"
               onClick={onGoBack}
               disabled={isPaying}
               className="px-4 py-2.5 text-sm font-semibold border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all text-zinc-650 flex items-center gap-1 cursor-pointer"
            >
              Retour
            </button>
            <button
              id="btn-confirm-payment"
              type="submit"
              disabled={isPaying || !cardNumber || !cardName || !expiry || cvv.length < 3}
              className={`flex-1 py-3 text-sm font-bold text-white uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPaying
                  ? 'bg-zinc-100 border border-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 active:translate-y-0.5'
              }`}
            >
              {isPaying ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Vérification de la provision...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Régler {totalInitial} € TTC</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
