'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mail, X } from 'lucide-react';
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
      showToast('success', 'Un code de vÃ©rification vous a Ã©tÃ© envoyÃ© par e-mail.');
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
      showToast('error', 'Saisissez le code reÃ§u (4 chiffres).');
      return;
    }
    setVerifying(true);
    try {
      const res = await clientApi.verifyEmailCode(code);
      if (res.verified) {
        showToast('success', 'Adresse e-mail vÃ©rifiÃ©e. Merci !');
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
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Mail size={22} />
              </span>
              <button type="button" onClick={onClose} className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>

            <h2 className="mt-4 text-lg font-extrabold text-neutral-900">VÃ©rifiez votre e-mail</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">
              Saisissez le code Ã  4 chiffres envoyÃ© Ã {' '}
              <b className="text-neutral-800">{email || 'votre adresse'}</b>.
            </p>

            <div className="mx-auto mt-6 flex max-w-[240px] justify-center gap-2.5">
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
                  className="aspect-square w-full rounded-2xl border border-neutral-200 bg-neutral-50 text-center text-2xl font-extrabold outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-200"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={verify}
              disabled={verifying || requesting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A0D0E] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {verifying && <Loader2 size={16} className="animate-spin" />}
              VÃ©rifier
            </button>

            <div className="mt-4 text-xs text-neutral-500">
              {requesting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> Envoi du codeâ€¦
                </span>
              ) : countdown > 0 ? (
                <span>Renvoyer le code dans {countdown}s</span>
              ) : (
                <button type="button" onClick={requestCode} className="font-semibold text-neutral-900 underline underline-offset-2 hover:opacity-80">
                  Renvoyer le code
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}