'use client';

import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { Language } from '../../../core/types';

interface OtpSecurityStepProps {
  lang: Language;
  email: string;
  attemptsLeft: number;
  resendAttemptsLeft: number;
  cooldownSeconds: number;
  isVerifying: boolean;
  error: string | null;
  emailMode: 'dev-simulated' | 'smtp';
  devSimulatedOtp: string | null;
  onVerify: (code: string) => Promise<boolean> | void;
  onResend: () => void;
}

type OtpPhase = 'idle' | 'checking' | 'approved' | 'error';

export function OtpSecurityStep({
  lang,
  email,
  attemptsLeft,
  resendAttemptsLeft,
  cooldownSeconds,
  isVerifying,
  error,
  emailMode,
  devSimulatedOtp,
  onVerify,
  onResend,
}: OtpSecurityStepProps) {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<OtpPhase>('idle');
  const [focused, setFocused] = useState(false);
  const [isCascadePaste, setIsCascadePaste] = useState(false);
  const [pastedUsed, setPastedUsed] = useState(false);
  const [clearingRight, setClearingRight] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(299);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setExpirySeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(id);
      for (const tid of timersRef.current) window.clearTimeout(tid);
    };
  }, []);

  // Reset used state when a new simulated code arrives (e.g. resend)
  useEffect(() => {
    setPastedUsed(false);
  }, [devSimulatedOtp]);

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const triggerVerification = async (nextCode: string) => {
    if (attemptsLeft <= 0 || phase === 'checking' || phase === 'approved') return;
    setPhase('checking');

    const ok = await onVerify(nextCode);
    if (ok) {
      setPhase('approved');
      return;
    }

    // Wrong code: spring shake + clear digits sequentially from right to left
    setPhase('error');
    setClearingRight(true);
    const tClear = window.setTimeout(() => {
      setCode('');
      setClearingRight(false);
      setIsCascadePaste(false);
      setPhase('idle');
      inputRef.current?.focus();
    }, 950);
    timersRef.current.push(tClear);
  };

  const handleInputChange = (raw: string, fromPaste = false) => {
    if (phase === 'checking' || phase === 'approved' || attemptsLeft <= 0) return;
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setIsCascadePaste(fromPaste || digits.length - code.length > 1);
    setCode(digits);

    if (digits.length === 6) {
      void triggerVerification(digits);
    }
  };

  const handlePasteFromSuggestion = () => {
    if (!devSimulatedOtp || phase === 'checking' || phase === 'approved' || attemptsLeft <= 0) {
      return;
    }
    setPastedUsed(true);
    setIsCascadePaste(true);
    setCode(devSimulatedOtp);
    const tRun = window.setTimeout(() => {
      void triggerVerification(devSimulatedOtp);
    }, 340);
    timersRef.current.push(tRun);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(code)) {
      void triggerVerification(code);
    }
  };

  const isChecking = phase === 'checking' || isVerifying;
  const isApproved = phase === 'approved';
  const isError = phase === 'error';

  const spacedDemoCode = devSimulatedOtp
    ? `${devSimulatedOtp.slice(0, 3)} ${devSimulatedOtp.slice(3, 6)}`
    : '';

  return (
    <section
      aria-labelledby="pixia-otp-title"
      className="relative isolate overflow-hidden rounded-[24px] p-5 text-[#f1f2f4]"
      style={{
        background: 'linear-gradient(180deg, #0f1013, #0a0b0d)',
        boxShadow:
          'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px -24px rgba(0, 0, 0, 0.9)',
      }}
    >
      {/* Hairline top light */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[18%] top-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.24), transparent)',
        }}
      />

      {/* Ambient green glow on verification approval */}
      <motion.span
        aria-hidden="true"
        animate={{ opacity: isApproved ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute left-[12%] right-[12%] -bottom-[10%] h-[60%] rounded-full blur-xl -z-10"
        style={{
          background: 'radial-gradient(closest-side, rgba(43, 214, 131, 0.30), transparent)',
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
            style={{
              background: 'linear-gradient(180deg, #1b1d22, #121317)',
              boxShadow:
                'inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.07)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] fill-none stroke-[#f1f2f4] stroke-[1.6]"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3.2l7 2.7v5.4c0 4.3-2.9 7.9-7 9.5-4.1-1.6-7-5.2-7-9.5V5.9z" />
              <path d="M9.2 11.6V10a2.8 2.8 0 015.6 0v1.6" />
              <rect x="8.2" y="11.6" width="7.6" height="5" rx="1.4" />
            </svg>
          </span>

          <div className="min-w-0">
            <h4 id="pixia-otp-title" className="text-[14.5px] font-semibold tracking-tight text-white truncate">
              {isApproved
                ? lang === 'fr'
                  ? 'Estimation vérifiée'
                  : 'Estimate verified'
                : lang === 'fr'
                  ? 'Confirmez votre estimation'
                  : 'Confirm your estimate'}
            </h4>
            <p className="mt-0.5 text-[12px] text-[#80838c] truncate font-mono tabular-nums">
              {isApproved
                ? lang === 'fr'
                  ? 'Génération du PDF…'
                  : 'Generating PDF…'
                : email}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono tabular-nums text-[#80838c] shrink-0">
          {t(lang, 'quoteForm.otpAttempts', { count: attemptsLeft })}
        </span>
      </header>

      {/* 6 Falling-Digit Cells + Green Zip-Shut Approval Pill */}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="relative h-[52px]">
          <label className="sr-only" htmlFor="pixia-otp-input">
            {t(lang, 'quoteForm.otpLabel')}
          </label>

          <input
            ref={inputRef}
            id="pixia-otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            disabled={isChecking || isApproved || attemptsLeft === 0}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPaste={(e) => {
              const pasted = e.clipboardData.getData('text');
              if (pasted) {
                e.preventDefault();
                handleInputChange(pasted, true);
              }
            }}
            onChange={(e) => handleInputChange(e.target.value, false)}
            className="absolute inset-0 z-20 h-full w-full cursor-text opacity-0 text-[16px]"
          />

          {/* 6 Cells */}
          <motion.div
            animate={
              isError
                ? { x: [0, -11, 10, -7, 6, -3, 0] }
                : { x: 0 }
            }
            transition={
              isError
                ? { duration: 0.55, ease: 'easeOut' }
                : { duration: 0.2 }
            }
            aria-hidden="true"
            className="absolute inset-0 flex items-center gap-[6px]"
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const char = code[idx] ?? '';
              const isActive = focused && !isChecking && !isApproved && idx === Math.min(code.length, 5);
              const centerOffset = (2.5 - idx) * 28;
              const reverseDelay = clearingRight ? (5 - idx) * 0.065 : 0;

              return (
                <div key={idx} className={`flex flex-1 min-w-0 h-full ${idx === 3 ? 'ml-1.5' : ''}`}>
                  <motion.span
                    animate={
                      isApproved
                        ? { x: centerOffset, scaleX: 0.35, opacity: 0 }
                        : { x: 0, scaleX: 1, opacity: 1 }
                    }
                    transition={
                      isApproved
                        ? {
                            duration: 0.42,
                            ease: 'easeIn',
                            delay: Math.abs(idx - 2.5) * 0.04,
                          }
                        : { duration: 0.25 }
                    }
                    className="relative flex h-full w-full items-center justify-center rounded-[13px] transition-shadow duration-200"
                    style={{
                      background: 'linear-gradient(180deg, #15161a, #101114)',
                      boxShadow: isError
                        ? 'inset 0 0 0 1px rgba(255, 93, 93, 0.78), 0 0 0 4px rgba(255, 93, 93, 0.10)'
                        : isApproved
                          ? 'inset 0 0 0 1px rgba(43, 214, 131, 0.75)'
                          : isActive
                            ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 4px rgba(255, 255, 255, 0.045)'
                            : 'inset 0 0 0 1px rgba(255, 255, 255, 0.075), inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 0 rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    {/* Running perimeter edge light while checking */}
                    {isChecking && (
                      <svg
                        viewBox="0 0 44 52"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                      >
                        <rect
                          x="0.8"
                          y="0.8"
                          width="42.4"
                          height="50.4"
                          rx="12.2"
                          fill="none"
                          pathLength={100}
                          stroke="#9ff5cf"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeDasharray="30 70"
                          style={{
                            animation: `otpEdgeSweep 1.15s linear infinite`,
                            animationDelay: `${idx * 0.1}s`,
                          }}
                        />
                      </svg>
                    )}

                    {/* Falling digit */}
                    <AnimatePresence mode="popLayout">
                      {char && (
                        <motion.span
                          key={`${idx}-${char}`}
                          initial={{ opacity: 0, y: -22 }}
                          animate={
                            clearingRight
                              ? { opacity: 0, y: 12, transition: { duration: 0.18, delay: reverseDelay } }
                              : {
                                  opacity: 1,
                                  y: [-22, 2, 0],
                                  transition: {
                                    duration: 0.34,
                                    ease: [0.22, 1, 0.36, 1],
                                    delay: isCascadePaste ? idx * 0.065 : 0,
                                  },
                                }
                          }
                          exit={{ opacity: 0, y: 10, transition: { duration: 0.14 } }}
                          className="font-mono text-[19px] font-semibold tabular-nums text-[#f1f2f4]"
                        >
                          {char}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active cell caret */}
                    {!char && isActive && (
                      <span
                        className="h-5 w-[1.5px] rounded-full bg-white/80"
                        style={{ animation: 'otpCaretBlink 1s steps(1) infinite' }}
                      />
                    )}
                  </motion.span>
                </div>
              );
            })}
          </motion.div>

          {/* Green Approved Pill with Animated Tick */}
          <AnimatePresence>
            {isApproved && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.3, scaleY: 0.86 }}
                animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
                transition={{ duration: 0.45, delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-full px-4 text-[#042313]"
                style={{
                  background: 'linear-gradient(180deg, #2bd683, #13a865)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 10px 28px -6px rgba(43, 214, 131, 0.48)',
                }}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-white stroke-[2.4]"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M6 12.6l4 4L18.2 8"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.38, delay: 0.42, ease: 'easeOut' }}
                    />
                  </svg>
                </span>
                <span className="text-[13.5px] font-semibold text-white tracking-tight">
                  {lang === 'fr' ? 'Code validé' : 'Code approved'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status / Expiration / Error line */}
        <div className="mt-3 flex items-center justify-between gap-2 text-[11.5px]" role="status" aria-live="polite">
          {error || isError ? (
            <span className="font-medium text-[#ff5d5d]">
              {error === 'LOCKED'
                ? lang === 'fr'
                  ? 'Verrouillé après 3 erreurs. Demandez un renvoi.'
                  : 'Locked after 3 errors. Request a resend.'
                : error === 'EXPIRED'
                  ? lang === 'fr'
                    ? 'Code expiré. Veuillez renvoyer un code.'
                    : 'Code expired. Please resend.'
                  : lang === 'fr'
                    ? 'Code incorrect. Réessayez.'
                    : 'That code didn’t match. Try again.'}
            </span>
          ) : isChecking ? (
            <span className="text-[#9ff5cf] font-medium">
              {lang === 'fr' ? 'Vérification en cours…' : 'Checking code…'}
            </span>
          ) : (
            <span className="text-[#80838c]">
              {lang === 'fr' ? 'Expire dans ' : 'Code expires in '}
              <b className="font-mono tabular-nums text-[#f1f2f4] font-medium">
                {formatClock(expirySeconds)}
              </b>
            </span>
          )}

          <button
            type="button"
            onClick={onResend}
            disabled={cooldownSeconds > 0 || resendAttemptsLeft <= 0 || isApproved}
            className="inline-flex items-center gap-1 font-medium text-[#93C5FD] hover:underline disabled:text-[#575962] disabled:no-underline cursor-pointer shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            {cooldownSeconds > 0
              ? `${t(lang, 'quoteForm.otpResend')} (${formatClock(cooldownSeconds)})`
              : t(lang, 'quoteForm.otpResend')}
          </button>
        </div>
      </form>

      {/* Suggestion Pill from Simulated Messages (Dev Demo Mode) */}
      {emailMode === 'dev-simulated' && devSimulatedOtp && !isApproved && (
        <button
          type="button"
          onClick={handlePasteFromSuggestion}
          disabled={pastedUsed || isChecking || attemptsLeft === 0}
          className="mt-3.5 flex w-full items-center gap-2.5 rounded-[14px] p-[9px_12px_9px_9px] text-left transition-shadow cursor-pointer disabled:cursor-default"
          style={{
            background: 'linear-gradient(180deg, #17181c, #121316)',
            boxShadow:
              'inset 0 0 0 1px rgba(255, 255, 255, 0.085), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
            style={{
              background: 'linear-gradient(180deg, #2fd47f, #17a862)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.3)',
            }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M12 4.5c4.7 0 8.2 3 8.2 6.7s-3.5 6.7-8.2 6.7c-.9 0-1.8-.1-2.6-.3L5.6 19.4l.9-3.3C4.7 14.9 3.8 13.1 3.8 11.2c0-3.7 3.5-6.7 8.2-6.7z" />
            </svg>
          </span>

          <span className="min-w-0 flex-1 truncate text-[12px] text-[#80838c]">
            {pastedUsed
              ? lang === 'fr'
                ? 'Collé depuis Messages'
                : 'Pasted from Messages'
              : lang === 'fr'
                ? 'Depuis Messages (Démo)'
                : 'From Messages (Demo)'}
          </span>

          <motion.span
            animate={pastedUsed ? { opacity: 0.25, y: -6 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[14px] font-semibold tracking-[0.06em] tabular-nums text-[#f1f2f4]"
          >
            {spacedDemoCode}
          </motion.span>
        </button>
      )}
    </section>
  );
}
