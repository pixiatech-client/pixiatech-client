'use client';

import { useEffect, useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_COUNTRY_OPTIONS } from '@/lib/customer-form-utils';

export interface CountryOption {
  code: string;
  label: string;
  is_available: boolean;
}

interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  isValid?: boolean;
}

const FALLBACK: CountryOption[] = DEFAULT_COUNTRY_OPTIONS.map(o => ({ code: o.value, label: o.label, is_available: true }));

export default function CountrySelect({ value, onChange, onBlur, hasError, isValid }: CountrySelectProps) {
  const [options, setOptions] = useState<CountryOption[]>(FALLBACK);
  const [loaded, setLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/shipping-zones/countries');
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (!cancelled && Array.isArray(data?.countries) && data.countries.length > 0) {
            setOptions(data.countries as CountryOption[]);
          }
        }
      } catch (e) {
        console.error('Failed to load countries:', e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Pré-sélection : France si disponible, sinon premier pays disponible.
  // Ne s'exécute qu'une fois après chargement pour ne pas écraser le choix de l'utilisateur.
  useEffect(() => {
    if (!loaded || initialized) return;
    setInitialized(true);
    const available = options.filter(o => o.is_available);
    const currentAvailable = options.find(o => o.code === value)?.is_available;
    if (available.length === 0) {
      if (!value) onChange(options[0]?.code || 'FR');
      return;
    }
    if (!value || currentAvailable === false) {
      onChange(available.find(o => o.code === 'FR')?.code || available[0].code);
    }
  }, [loaded, initialized, options, value, onChange]);

  const selectedCode = options.some(o => o.code === value) ? value : '';

  return (
    <div className="relative">
      <Globe size={14} className="pointer-events-none absolute left-3 top-3 text-gray-400" />
      <select
        value={selectedCode}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-xl border bg-white py-2.5 pl-9 pr-8 text-xs transition-all focus:outline-none focus:ring-2',
          hasError
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : isValid
              ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
              : 'border-gray-200 focus:border-gray-400 focus:ring-gray-900/20'
        )}
      >
        {options.map(o => (
          <option key={o.code} value={o.code} disabled={!o.is_available}>
            {o.label}
            {o.is_available ? '' : ' — indisponible'}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  );
}