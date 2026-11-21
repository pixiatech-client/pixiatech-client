'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_COUNTRY_OPTIONS } from '@/lib/customer-form-utils';
import { BottomSheetSelect, type BottomSheetOption } from '@/components/ui/bottom-sheet';

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

const FALLBACK: CountryOption[] = DEFAULT_COUNTRY_OPTIONS.map((o) => ({
  code: o.value,
  label: o.label,
  is_available: true,
}));

export default function CountrySelect({
  value,
  onChange,
  onBlur,
  hasError,
  isValid,
}: CountrySelectProps) {
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
    return () => {
      cancelled = true;
    };
  }, []);

  // Pré-sélection : France si disponible, sinon premier pays disponible.
  // Ne s'exécute qu'une fois après chargement pour ne pas écraser le choix de l'utilisateur.
  useEffect(() => {
    if (!loaded || initialized) return;
    setInitialized(true);
    const available = options.filter((o) => o.is_available);
    const currentAvailable = options.find((o) => o.code === value)?.is_available;
    if (available.length === 0) {
      if (!value) onChange(options[0]?.code || 'FR');
      return;
    }
    if (!value || currentAvailable === false) {
      onChange(available.find((o) => o.code === 'FR')?.code || available[0].code);
    }
  }, [loaded, initialized, options, value, onChange]);

  const selectedCode = options.some((o) => o.code === value) ? value : '';
  const mapped: BottomSheetOption[] = options.map((o) => ({
    value: o.code,
    label: o.is_available ? o.label : `${o.label} — indisponible`,
    searchText: o.label,
    disabled: !o.is_available,
  }));

  return (
    <BottomSheetSelect
      options={mapped}
      value={selectedCode}
      onChange={(next) => onChange(String(next))}
      onBlur={onBlur}
      title="Pays de livraison"
      label="Pays de livraison"
      leadingIcon={<Globe size={15} />}
      placeholder="Sélectionner un pays"
      searchable={options.length > 8}
      searchPlaceholder="Rechercher un pays"
      triggerClassName={cn(
        'text-xs',
        hasError
          ? 'border-red-300 ring-2 ring-red-100'
          : isValid
            ? 'border-emerald-300 ring-2 ring-emerald-100'
            : 'border-gray-200',
      )}
    />
  );
}
