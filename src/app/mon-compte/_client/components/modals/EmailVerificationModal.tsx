'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail, X } from 'lucide-react';
import { clientApi } from '../../lib/api';

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  email?: string;
}

const RESEND_DELAY = 60;

export function EmailVerificationModal({ open, onClose, onVerified, showToast, email }: EmailVerificationModalProps) {
  const [pinCode, setPinCode] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPinCode('');
    setErrorMsg('');
    setSuccessMsg('');
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  async function requestCode() {
    setRequesting(true);
    try {
      await clientApi.requestEmailCode();
      setCountdown(RESEND_DELAY);
      showToast('success', 'Un code de vérification vous a été envoyé par e-mail.');
    } catch (err: any) {
      showToast('error', err.message || "Impossible d'envoyer le code.");
    } finally {
      setRequesting(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (pinCode.length !== 4) {
      setErrorMsg('Veuillez saisir le code de sécurité à 4 chiffres.');
      return;
    }
    setVerifying(true);
    try {
      const res = await clientApi.verifyEmailCode(pinCode);
      if (res.verified) {
        setSuccessMsg('Votre adresse e-mail a été vérifiée avec succès !');
        onVerified();
        setTimeout(onClose, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Code incorrect. Veuillez réessayer.');
      setPinCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-neutral-200 bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0A0D0E] text-white">
                  <Mail className="size-5 text-[#38E044]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Vérification de votre E-mail</h2>
                  <p className="text-xs text-neutral-500">Validation requise avant émission de facture</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-black" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs text-neutral-600">
                Nous avons envoyé un code de sécurité à 4 chiffres à l'adresse :{' '}
                <strong className="text-neutral-900">{email || 'votre adresse e-mail'}</strong>.
              </p>

              <form onSubmit={verify} className="mt-5 space-y-4 pb-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700">Code de vérification (4 chiffres)</label>
                  <div className="p-3 rounded-2xl border border-neutral-300 bg-neutral-100 text-center">
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="7394"
                      disabled={verifying}
                      autoFocus
                      className="w-full bg-transparent text-center text-2xl font-mono font-extrabold tracking-[0.5em] text-neutral-900 outline-none placeholder:text-neutral-300 disabled:opacity-50"
                    />
                  </div>
                  <span className="block text-center text-[10px] text-neutral-400">
                    Exemple de test : <strong>7394</strong>
                  </span>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="text-center text-[11px] text-neutral-500">
                  {requesting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Envoi du code…
                    </span>
                  ) : countdown > 0 ? (
                    <span>Renvoyer le code dans {countdown}s</span>
                  ) : (
                    <button type="button" onClick={requestCode} className="font-semibold text-neutral-900 underline underline-offset-2 hover:opacity-80">
                      Renvoyer le code
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={verifying}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || requesting}
                    className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 disabled:opacity-50"
                  >
                    {verifying && <Loader2 className="size-3.5 animate-spin text-[#38E044]" />}
                    <span>{verifying ? 'Validation...' : "Valider l'adresse"}</span>
                    <ArrowRight className="size-3.5 text-[#38E044]" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}