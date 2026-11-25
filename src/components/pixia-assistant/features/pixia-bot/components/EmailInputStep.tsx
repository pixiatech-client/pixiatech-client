'use client';

import { AlertCircle, ArrowRight, Check, Loader2, Mail, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { Language } from '../../../core/types';
import { inspectEmail } from '../../../core/validation/validators';

interface EmailInputStepProps {
  lang: Language;
  initialValue?: string;
  onError: (hasError: boolean) => void;
  onInvalidSubmit?: () => void;
  onSubmit: (email: string) => void;
}

export function EmailInputStep({
  lang,
  initialValue = '',
  onError,
  onInvalidSubmit,
  onSubmit,
}: EmailInputStepProps) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [hasInteracted, setHasInteracted] = useState(false);

  const inspection = inspectEmail(value);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus('idle');
      if (!hasInteracted) onError(false);
      return;
    }

    setStatus('checking');
    const timer = window.setTimeout(() => {
      const check = inspectEmail(trimmed);
      if (check.valid) {
        setStatus('valid');
        onError(false);
      } else {
        setStatus('invalid');
        onError(true);
      }
    }, 240);

    return () => window.clearTimeout(timer);
  }, [value, hasInteracted, onError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    const check = inspectEmail(value);
    if (!check.valid) {
      setStatus('invalid');
      onError(true);
      onInvalidSubmit?.();
      return;
    }
    onError(false);
    onSubmit(value.trim());
  };

  const applySuggestedFix = () => {
    if (!inspection.suggestedEmail) return;
    setValue(inspection.suggestedEmail);
    setHasInteracted(true);
    onError(false);
  };

  const isErrorVisible = (status === 'invalid' && value.trim().length > 0) || (hasInteracted && !inspection.valid);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3"
    >
      {/* Header + Animorio-style live status pill */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase text-[#94A3B8]">
          <Mail className="h-3.5 w-3.5 text-[#38BDF8]" />
          {lang === 'fr' ? 'Vérification e-mail' : 'Live email check'}
        </span>

        <AnimatePresence mode="wait">
          {status === 'checking' && (
            <motion.span
              key="checking"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-[#D4D4D8]"
            >
              <Loader2 className="h-3 w-3 animate-spin text-[#C084FC]" />
              {lang === 'fr' ? 'Analyse…' : 'Checking…'}
            </motion.span>
          )}
          {status === 'valid' && (
            <motion.span
              key="valid"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="inline-flex items-center gap-1 rounded-full border border-[#34D399]/40 bg-[#0F2A1F] px-2 py-0.5 text-[10px] font-semibold text-[#34D399]"
            >
              <Check strokeWidth={3} className="h-2.5 w-2.5" />
              {lang === 'fr' ? 'Valide' : 'Valid'}
            </motion.span>
          )}
          {isErrorVisible && (
            <motion.span
              key="invalid"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="inline-flex items-center gap-1 rounded-full border border-[#EF4444]/45 bg-[#2A1215] px-2 py-0.5 text-[10px] font-semibold text-[#FB7185]"
            >
              <AlertCircle className="h-2.5 w-2.5" />
              {lang === 'fr' ? 'Erreur détectée' : 'Invalid'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Email Field with Live Animated Border & Status */}
      <motion.div
        animate={
          isErrorVisible
            ? { x: [0, -4, 4, -2, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.28 }}
        className={`flex items-center gap-2 rounded-xl border bg-[#141417] px-3 py-2.5 transition-colors duration-200 ${
          isErrorVisible
            ? 'border-[#EF4444]/80 shadow-[0_0_16px_rgba(239,68,68,0.22)]'
            : status === 'valid'
              ? 'border-[#3f9b78]/80 shadow-[0_0_16px_rgba(63,155,120,0.2)]'
              : 'border-white/12 focus-within:border-[#38BDF8]/70'
        }`}
      >
        <input
          type="email"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!hasInteracted && e.target.value.trim()) setHasInteracted(true);
          }}
          placeholder={lang === 'fr' ? 'prenom.nom@entreprise.fr' : 'name@company.com'}
          autoComplete="email"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#52525B] focus:outline-none"
        />

        <AnimatePresence>
          {status === 'valid' && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3f9b78] text-white"
            >
              <Check strokeWidth={3} className="h-3 w-3" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Specific Mistake Diagnosis + 1-Click Typo Fix (e.g. .co -> .com, .coms -> .com) */}
      <AnimatePresence>
        {isErrorVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#EF4444]/35 bg-[#2A1215]/75 px-3 py-2 text-xs space-y-2">
              <p className="text-[#FDA4AF] leading-snug">
                {lang === 'fr' ? inspection.reasonFr : inspection.reasonEn}
              </p>
              {inspection.suggestedEmail && (
                <button
                  type="button"
                  onClick={applySuggestedFix}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#38BDF8]/45 bg-[#38BDF8]/15 px-2.5 py-1 text-[11px] font-semibold text-[#BAE6FD] hover:bg-[#38BDF8]/25 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-[#38BDF8]" />
                  <span>
                    {lang === 'fr' ? 'Corriger :' : 'Fix:'} {inspection.suggestedEmail}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] transition-colors cursor-pointer min-h-[42px]"
      >
        <span>{t(lang, 'ui.continue')}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
