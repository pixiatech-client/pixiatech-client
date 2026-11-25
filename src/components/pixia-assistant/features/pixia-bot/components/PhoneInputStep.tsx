'use client';

import { ArrowRight, Check, ChevronDown, Phone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { t } from '../../../core/i18n/translations';
import type { Language } from '../../../core/types';

interface PhoneInputStepProps {
  lang: Language;
  onError: (hasError: boolean) => void;
  onInvalidSubmit?: () => void;
  onSubmit: (formattedE164: string) => void;
}

interface CountryRegion {
  code: string;
  flag: string;
  nameFr: string;
  nameEn: string;
  dial: string;
  nationalLength: number; // digits excluding dial code (after stripping leading trunk 0 if any)
  allowLeadingZero: boolean;
  placeholder: string;
  groups: number[];
}

const REGIONS: CountryRegion[] = [
  {
    code: 'FR',
    flag: '🇫🇷',
    nameFr: 'France',
    nameEn: 'France',
    dial: '+33',
    nationalLength: 9,
    allowLeadingZero: true,
    placeholder: '6 12 34 56 78',
    groups: [1, 2, 2, 2, 2],
  },
  {
    code: 'BE',
    flag: '🇧🇪',
    nameFr: 'Belgique',
    nameEn: 'Belgium',
    dial: '+32',
    nationalLength: 9,
    allowLeadingZero: true,
    placeholder: '470 12 34 56',
    groups: [3, 2, 2, 2],
  },
  {
    code: 'CH',
    flag: '🇨🇭',
    nameFr: 'Suisse',
    nameEn: 'Switzerland',
    dial: '+41',
    nationalLength: 9,
    allowLeadingZero: true,
    placeholder: '79 123 45 67',
    groups: [2, 3, 2, 2],
  },
  {
    code: 'LU',
    flag: '🇱🇺',
    nameFr: 'Luxembourg',
    nameEn: 'Luxembourg',
    dial: '+352',
    nationalLength: 9,
    allowLeadingZero: false,
    placeholder: '621 123 456',
    groups: [3, 3, 3],
  },
  {
    code: 'MA',
    flag: '🇲🇦',
    nameFr: 'Maroc',
    nameEn: 'Morocco',
    dial: '+212',
    nationalLength: 9,
    allowLeadingZero: true,
    placeholder: '6 12 34 56 78',
    groups: [1, 2, 2, 2, 2],
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    nameFr: 'Royaume-Uni',
    nameEn: 'United Kingdom',
    dial: '+44',
    nationalLength: 10,
    allowLeadingZero: true,
    placeholder: '7700 900123',
    groups: [4, 6],
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    nameFr: 'Allemagne',
    nameEn: 'Germany',
    dial: '+49',
    nationalLength: 10,
    allowLeadingZero: true,
    placeholder: '151 23456789',
    groups: [3, 4, 4],
  },
  {
    code: 'ES',
    flag: '🇪🇸',
    nameFr: 'Espagne',
    nameEn: 'Spain',
    dial: '+34',
    nationalLength: 9,
    allowLeadingZero: false,
    placeholder: '612 34 56 78',
    groups: [3, 2, 2, 2],
  },
  {
    code: 'IT',
    flag: '🇮🇹',
    nameFr: 'Italie',
    nameEn: 'Italy',
    dial: '+39',
    nationalLength: 10,
    allowLeadingZero: false,
    placeholder: '312 345 6789',
    groups: [3, 3, 4],
  },
  {
    code: 'CA',
    flag: '🇨🇦',
    nameFr: 'Canada / US',
    nameEn: 'Canada / US',
    dial: '+1',
    nationalLength: 10,
    allowLeadingZero: false,
    placeholder: '514 555 0192',
    groups: [3, 3, 4],
  },
];

function formatByGroups(digits: string, groups: number[]): string {
  const parts: string[] = [];
  let idx = 0;
  for (const size of groups) {
    if (idx >= digits.length) break;
    parts.push(digits.slice(idx, idx + size));
    idx += size;
  }
  if (idx < digits.length) {
    parts.push(digits.slice(idx));
  }
  return parts.join(' ');
}

export function PhoneInputStep({ lang, onError, onInvalidSubmit, onSubmit }: PhoneInputStepProps) {
  const [regionCode, setRegionCode] = useState<string>('FR');
  const [rawDigits, setRawDigits] = useState<string>('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const region = useMemo(
    () => REGIONS.find((r) => r.code === regionCode) ?? REGIONS[0],
    [regionCode]
  );

  const normalizedNational = useMemo(() => {
    let d = rawDigits;
    if (region.allowLeadingZero && d.startsWith('0')) {
      d = d.slice(1);
    }
    return d.slice(0, region.nationalLength);
  }, [rawDigits, region]);

  const formattedDisplay = useMemo(() => {
    if (!rawDigits) return '';
    if (region.allowLeadingZero && rawDigits.startsWith('0')) {
      const trunked = rawDigits.slice(0, region.nationalLength + 1);
      return `0${formatByGroups(trunked.slice(1), region.groups)}`.trim();
    }
    return formatByGroups(rawDigits.slice(0, region.nationalLength), region.groups);
  }, [rawDigits, region]);

  const e164Value = `${region.dial}${normalizedNational}`;
  const e164DigitsCount = e164Value.replace(/\D/g, '').length;
  const isComplete =
    normalizedNational.length === region.nationalLength &&
    e164DigitsCount >= 10 &&
    e164DigitsCount <= 14;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let onlyDigits = e.target.value.replace(/\D/g, '');
    const dialDigits = region.dial.replace(/\D/g, '');
    if (onlyDigits.startsWith(dialDigits) && onlyDigits.length > region.nationalLength) {
      onlyDigits = onlyDigits.slice(dialDigits.length);
    }
    const maxLen = region.allowLeadingZero && onlyDigits.startsWith('0')
      ? region.nationalLength + 1
      : region.nationalLength;
    setRawDigits(onlyDigits.slice(0, maxLen));
    if (errorMsg) {
      setErrorMsg(null);
      onError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setErrorMsg(t(lang, 'bot.errorPhoneInvalid'));
      onError(true);
      onInvalidSubmit?.();
      return;
    }
    setErrorMsg(null);
    onError(false);
    onSubmit(e164Value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-[#202025] p-3.5 space-y-3"
    >
      <div className="flex items-center justify-between text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase text-[#94A3B8]">
          <Phone className="h-3.5 w-3.5 text-[#38BDF8]" />
          {lang === 'fr' ? 'Téléphone vérifié' : 'Formatted phone'}
        </span>
        <span
          className={`font-mono tabular-nums transition-colors ${
            isComplete ? 'text-[#34D399] font-semibold' : 'text-[#71717A]'
          }`}
        >
          {normalizedNational.length}/{region.nationalLength}
        </span>
      </div>

      {/* Animorio 04 Self-Formatting Country + Live Phone Field */}
      <div className="relative">
        <div
          className={`flex items-center rounded-xl border bg-[#141417] transition-colors ${
            errorMsg
              ? 'border-[#EF4444]/75'
              : isComplete
                ? 'border-[#3f9b78]/80 shadow-[0_0_16px_rgba(63,155,120,0.2)]'
                : 'border-white/12 focus-within:border-[#38BDF8]/70'
          }`}
        >
          {/* Country / Region Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setRegionOpen((o) => !o)}
            className="flex items-center gap-1.5 pl-3 pr-2.5 py-2.5 border-r border-white/10 text-xs font-medium text-white hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0 rounded-l-xl"
          >
            <span className="text-base leading-none">{region.flag}</span>
            <span className="font-mono tabular-nums text-[#93C5FD]">{region.dial}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#71717A] transition-transform ${
                regionOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Auto-Formatted Phone Input */}
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={formattedDisplay}
            onChange={handleInputChange}
            placeholder={region.placeholder}
            autoFocus
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-mono tabular-nums tracking-wide text-white placeholder:text-[#52525B] focus:outline-none"
          />

          {/* Live Green Valid Check */}
          <div className="pr-3 flex items-center shrink-0">
            <AnimatePresence>
              {isComplete && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3f9b78] text-white"
                >
                  <Check strokeWidth={3} className="h-3 w-3" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Region Selector Menu */}
        <AnimatePresence>
          {regionOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-white/15 bg-[#17171B] p-1 shadow-[0_14px_34px_rgba(0,0,0,0.75)]"
            >
              {REGIONS.map((item) => {
                const active = item.code === region.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setRegionCode(item.code);
                      setRawDigits('');
                      setRegionOpen(false);
                      setErrorMsg(null);
                      onError(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-white/12 text-white font-semibold'
                        : 'text-[#D4D4D8] hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm leading-none">{item.flag}</span>
                      <span>{lang === 'fr' ? item.nameFr : item.nameEn}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[#93C5FD]">{item.dial}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {errorMsg && <p className="text-xs font-medium text-[#FB7185]">{errorMsg}</p>}

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
