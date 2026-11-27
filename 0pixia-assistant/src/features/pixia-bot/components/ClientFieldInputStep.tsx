import { AlertCircle, ArrowRight, Building2, Check, MapPin, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { t } from '../../../core/i18n/translations.ts';
import type { Language } from '../../../core/types.ts';

export type ClientTextFieldKind = 'company' | 'representative' | 'address' | 'deliveryCity';

interface ClientFieldInputStepProps {
  kind: ClientTextFieldKind;
  lang: Language;
  initialValue?: string;
  citySuggestions?: string[];
  onError: (hasError: boolean) => void;
  onInvalidSubmit?: () => void;
  onSubmit: (value: string) => void;
}

export function ClientFieldInputStep({
  kind,
  lang,
  initialValue = '',
  citySuggestions = [],
  onError,
  onInvalidSubmit,
  onSubmit,
}: ClientFieldInputStepProps) {
  const [value, setValue] = useState(initialValue);
  const [hasInteracted, setHasInteracted] = useState(false);

  const minLen = kind === 'address' ? 8 : 2;
  const trimmed = value.trim();
  const isValid = trimmed.length >= minLen;
  const isErrorVisible = hasInteracted && !isValid;

  useEffect(() => {
    setValue(initialValue);
    setHasInteracted(false);
    onError(false);
  }, [kind, initialValue, onError]);

  useEffect(() => {
    if (!hasInteracted) return;
    onError(!isValid);
  }, [hasInteracted, isValid, onError]);

  const meta = (() => {
    switch (kind) {
      case 'company':
        return {
          icon: Building2,
          title: lang === 'fr' ? 'Société / Organisation' : 'Company / Organization',
          placeholder:
            lang === 'fr' ? 'Nom de votre société…' : 'Your company or organization…',
          autoComplete: 'organization',
          errorMsg:
            lang === 'fr'
              ? 'Veuillez saisir le nom de votre société (min. 2 caractères).'
              : 'Please enter your company name (min. 2 characters).',
        };
      case 'representative':
        return {
          icon: User,
          title: lang === 'fr' ? 'Nom du représentant' : 'Representative name',
          placeholder:
            lang === 'fr' ? 'Prénom et nom complet…' : 'Representative full name…',
          autoComplete: 'name',
          errorMsg:
            lang === 'fr'
              ? 'Veuillez saisir le nom complet du représentant (min. 2 caractères).'
              : 'Please enter the representative’s full name (min. 2 characters).',
        };
      case 'address':
        return {
          icon: MapPin,
          title: lang === 'fr' ? 'Adresse complète' : 'Full street address',
          placeholder:
            lang === 'fr'
              ? 'N°, rue, code postal et ville…'
              : 'Street number, street, postcode & city…',
          autoComplete: 'street-address',
          errorMsg:
            lang === 'fr'
              ? 'Veuillez saisir une adresse postale complète (min. 8 caractères).'
              : 'Please enter a complete street address (min. 8 characters).',
        };
      case 'deliveryCity':
        return {
          icon: MapPin,
          title: lang === 'fr' ? 'Ville de livraison' : 'Delivery city',
          placeholder:
            lang === 'fr' ? 'Ex : Paris, Lyon, Bordeaux…' : 'E.g. Paris, Lyon, Bordeaux…',
          autoComplete: 'address-level2',
          errorMsg:
            lang === 'fr'
              ? 'Veuillez indiquer une ville de livraison valide (min. 2 caractères).'
              : 'Please enter a valid delivery city (min. 2 characters).',
        };
    }
  })();

  const Icon = meta.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);
    if (!isValid) {
      onError(true);
      onInvalidSubmit?.();
      return;
    }
    onError(false);
    onSubmit(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3"
    >
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase text-[#94A3B8]">
          <Icon className="h-3.5 w-3.5 text-[#38BDF8]" />
          {meta.title}
        </span>

        <AnimatePresence mode="wait">
          {isValid && (
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
              {lang === 'fr' ? 'Incomplet' : 'Incomplete'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={isErrorVisible ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.28 }}
        className={`flex items-center gap-2 rounded-xl border bg-[#141417] px-3 py-2.5 transition-colors duration-200 ${
          isErrorVisible
            ? 'border-[#EF4444]/80 shadow-[0_0_16px_rgba(239,68,68,0.22)]'
            : isValid
              ? 'border-[#3f9b78]/80 shadow-[0_0_16px_rgba(63,155,120,0.2)]'
              : 'border-white/12 focus-within:border-[#38BDF8]/70'
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (!hasInteracted && e.target.value.trim()) setHasInteracted(true);
          }}
          placeholder={meta.placeholder}
          autoComplete={meta.autoComplete}
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#52525B] focus:outline-none"
        />

        <AnimatePresence>
          {isValid && (
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

      {kind === 'deliveryCity' && citySuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {citySuggestions.map((city) => {
            const active = trimmed.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setValue(city);
                  setHasInteracted(true);
                  onError(false);
                }}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'border-[#38BDF8]/70 bg-[#38BDF8]/18 text-white'
                    : 'border-white/10 bg-[#141417] text-[#A1A1AA] hover:border-white/25 hover:text-white'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isErrorVisible && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs font-medium text-[#FB7185] overflow-hidden"
          >
            {meta.errorMsg}
          </motion.p>
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
