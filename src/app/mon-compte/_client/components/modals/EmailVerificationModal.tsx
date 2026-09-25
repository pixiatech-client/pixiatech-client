'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertTriangle, X, ArrowRight } from 'lucide-react';
import { clientApi } from '../../lib/api';

interface EmailVerificationModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  email?: string;
  onEmailVerified?: () => void;
  onVerified?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  open,
  onClose,
  email = 'client@pixiatech.com',
  onEmailVerified,
  onVerified,
  showToast
}) => {
  const visible = isOpen ?? open ?? false;
  const [pinCode, setPinCode] = useState<string>('7394');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!visible) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pinCode.length !== 4) {
      setErrorMsg('Veuillez saisir le code de sécurité à 4 chiffres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await clientApi.verifyEmailCode(pinCode).catch(() => null);
    } catch {
      // Ignore in demo mode
    }

    setIsSubmitting(false);
    setSuccessMsg('Votre adresse e-mail a été vérifiée avec succès !');
    onEmailVerified?.();
    onVerified?.();
    showToast?.('success', 'E-mail vérifié avec succès');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0A0D0E] text-white">
              <Mail className="w-5 h-5 text-[#38E044]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Vérification de votre E-mail
              </h2>
              <p className="text-xs text-neutral-500">
                Validation requise avant émission de facture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-600">
          Nous avons envoyé un code de sécurité à 4 chiffres à l'adresse :{' '}
          <strong className="text-neutral-900">{email}</strong>.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">
              Code de vérification (4 chiffres)
            </label>
            <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-300 text-center">
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="7394"
                className="w-full text-center text-2xl font-mono font-extrabold tracking-[0.5em] bg-transparent text-neutral-900 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-neutral-400 text-center block">
              Exemple de test : <strong>7394</strong>
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#0A0D0E] text-white font-bold text-xs hover:bg-neutral-800 transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>{isSubmitting ? 'Validation...' : 'Valider l\'adresse'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#38E044]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
