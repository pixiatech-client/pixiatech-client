'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Loader2, Mail, X } from 'lucide-react';
import { clientApi } from '../../lib/api';

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
  email?: string;
}

const CODE_LENGTH = 4;
const RESEND_DELAY = 60;

export function EmailVerificationModal({ open, onClose, onVerified, showToast, email }: EmailVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(CODE_LENGTH).fill(''));
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

  function handleChange(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function verify() {
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      showToast('error', 'Saisissez le code reçu (4 chiffres).');
      return;
    }
    setVerifying(true);
    try {
      const res = await clientApi.verifyEmailCode(code);
      if (res.verified) {
        showToast('success', 'Adresse e-mail vérifiée. Merci !');
        onVerified();
        onClose();
        setDigits(Array(CODE_LENGTH).fill(''));
      }
    } catch (err: any) {
      showToast('error', err.message || 'Code incorrect.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
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

            <div className="flex-1 space-y-5 p-5">
              <p className="text-xs text-neutral-600">
                Nous avons envoyé un code de sécurité à 4 chiffres à l'adresse :{' '}
                <strong className="text-neutral-900">{email || 'votre adresse e-mail'}</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">Code de vérification (4 chiffres)</label>
                <div className="flex justify-center gap-2.5 rounded-2xl border border-neutral-300 bg-neutral-100 p-3.5">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={verifying}
                      inputMode="numeric"
                      autoFocus={i === 0}
                      className="aspect-square w-full max-w-[52px] rounded-xl border border-neutral-300 bg-white text-center text-2xl font-extrabold tracking-[0.2em] text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-black/10"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-xs text-neutral-500">
                {requesting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin" /> Envoi du code…
                  </span>
                ) : countdown > 0 ? (
                  <span>Renvoyer le code dans {countdown}s</span>
                ) : (
                  <button type="button" onClick={requestCode} className="text-xs font-semibold text-neutral-900 underline underline-offset-2 hover:opacity-80">
                    Renvoyer le code
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-neutral-100 p-4">
              <button
                type="button"
                onClick={onClose}
                disabled={verifying}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={verify}
                disabled={verifying || requesting}
                className="flex items-center gap-2 rounded-xl bg-[#0A0D0E] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {verifying && <Loader2 className="size-3.5 animate-spin text-[#38E044]" />}
                <span>{verifying ? 'Validation…' : "Valider l'adresse"}</span>
                <ArrowRight className="size-3.5 text-[#38E044]" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}