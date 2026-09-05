'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Hash,
  Globe,
  MapPin,
  MapPinned,
  Phone,
  Mail,
  Briefcase,
  Users,
  Link2,
  Printer,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  fetchProfessionalInfo,
  saveProfessionalInfo,
  type ProfessionalInfo,
} from '@/services/professionalInfoService';

const EMPLOYEE_OPTIONS = ['1-10', '11-50', '51-200', '200+'];

const COUNTRIES = [
  'France',
  'Belgique',
  'Suisse',
  'Luxembourg',
  'Allemagne',
  'Espagne',
  'Italie',
  'Royaume-Uni',
  'Pays-Bas',
  'Portugal',
  'Maroc',
  'Tunisie',
  'Algérie',
  'Canada',
  'Sénégal',
  'Côte d\'Ivoire',
];

const inputClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#004ac6] focus:ring-4 focus:ring-[#004ac6]/10';

const selectClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#004ac6] focus:ring-4 focus:ring-[#004ac6]/10';

type FormValues = Omit<ProfessionalInfo, 'vatValidated' | 'vatRate'>;

const INITIAL_VALUES: FormValues = {
  companyName: '',
  siret: '',
  vatNumber: '',
  address: '',
  city: '',
  state: '',
  postcode: '',
  country: 'France',
  officePhone: '',
  companyEmail: '',
  position: '',
  employees: '',
  website: '',
  fax: '',
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const REQUIRED_FIELDS: (keyof FormValues)[] = ['companyName', 'siret', 'address', 'city', 'postcode', 'companyEmail'];

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (!values[field].trim()) {
      errors[field] = 'Ce champ est obligatoire.';
    }
  }

  const siret = values.siret.replace(/\s+/g, '');
  if (siret && !/^\d{9}(\d{5})?$/.test(siret)) {
    errors.siret = 'Le SIREN / SIRET doit contenir 9 ou 14 chiffres.';
  }

  if (values.companyEmail.trim() && !EMAIL_RE.test(values.companyEmail.trim())) {
    errors.companyEmail = 'Veuillez saisir un email professionnel valide.';
  }

  return errors;
}

function lineLabel(label: string, required?: boolean) {
  return (
    <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

interface ProfessionalInfoStepProps {
  onComplete: (info: ProfessionalInfo) => void;
}

export function ProfessionalInfoStep({ onComplete }: ProfessionalInfoStepProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const info = await fetchProfessionalInfo();
        if (cancelled) return;
        if (info) {
          setExisting(true);
          setValues({
            companyName: info.companyName,
            siret: info.siret,
            vatNumber: info.vatNumber,
            address: info.address,
            city: info.city,
            state: info.state,
            postcode: info.postcode,
            country: info.country || 'France',
            officePhone: info.officePhone,
            companyEmail: info.companyEmail,
            position: info.position,
            employees: info.employees,
            website: info.website,
            fax: info.fax,
          });
        }
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.message || 'Une erreur est survenue pendant le chargement.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setApiError(null);
  }, []);

  const submit = useCallback(
    async (shouldSave: boolean) => {
      const errors = validate(values);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      setSaving(true);
      setApiError(null);
      try {
        const cleaned = Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        ) as FormValues;

        if (shouldSave) {
          const saved = await saveProfessionalInfo(cleaned);
          onComplete(saved);
        } else {
          onComplete({
            ...cleaned,
            vatValidated: false,
            vatRate: 0.2,
          });
        }
      } catch (err: any) {
        setApiError(err?.message || 'Une erreur est survenue pendant l\'enregistrement.');
      } finally {
        setSaving(false);
      }
    },
    [values, onComplete]
  );

  const isSubmitDisabled = useMemo(() => saving, [saving]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
        <div className="mx-auto w-8 h-8 border-2 border-gray-200 border-t-[#004ac6] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Chargement de vos informations professionnelles…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="mt-3 text-sm font-semibold text-gray-900">Impossible de charger cette étape</p>
        <p className="mt-1 text-sm text-gray-500">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-block bg-[#004ac6] text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(existing);
      }}
      noValidate
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm mb-6',
            existing
              ? 'border-blue-200 bg-blue-50 text-blue-900'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          )}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-relaxed">
            {existing
              ? 'Vos informations professionnelles ont été récupérées depuis votre profil. Vérifiez qu\'elles sont toujours correctes avant de continuer.'
              : 'Avant de générer votre première facture, veuillez remplir vos informations professionnelles.'}
          </p>
        </div>

        {apiError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 mb-6">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="leading-relaxed font-medium">{apiError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            {lineLabel('Société', true)}
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder="Nom de votre entreprise"
                className={cn(inputClass, 'pl-10', formErrors.companyName && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.companyName}
              />
            </div>
            <FieldError message={formErrors.companyName} />
          </div>

          <div>
            {lineLabel('SIREN / SIRET', true)}
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.siret}
                onChange={(e) => set('siret', e.target.value)}
                placeholder="9 ou 14 chiffres"
                inputMode="numeric"
                className={cn(inputClass, 'pl-10', formErrors.siret && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.siret}
              />
            </div>
            <FieldError message={formErrors.siret} />
          </div>

          <div>
            {lineLabel('Numéro de TVA Intracommunautaire')}
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.vatNumber}
                onChange={(e) => set('vatNumber', e.target.value)}
                placeholder="FR12345678901"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            {lineLabel('Adresse complète', true)}
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Adresse complète"
                className={cn(inputClass, 'pl-10', formErrors.address && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.address}
              />
            </div>
            <FieldError message={formErrors.address} />
          </div>

          <div>
            {lineLabel('Pays', true)}
            <select
              value={values.country}
              onChange={(e) => set('country', e.target.value)}
              className={cn(selectClass, formErrors.country && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.country} />
          </div>

          <div>
            {lineLabel('Ville', true)}
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Paris"
                className={cn(inputClass, 'pl-10', formErrors.city && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.city}
              />
            </div>
            <FieldError message={formErrors.city} />
          </div>

          <div>
            {lineLabel('État / Région')}
            <div className="relative">
              <MapPinned className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.state}
                onChange={(e) => set('state', e.target.value)}
                placeholder="Île-de-France"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div>
            {lineLabel('Code postal', true)}
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.postcode}
                onChange={(e) => set('postcode', e.target.value)}
                placeholder="75001"
                inputMode="numeric"
                className={cn(inputClass, 'pl-10', formErrors.postcode && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.postcode}
              />
            </div>
            <FieldError message={formErrors.postcode} />
          </div>

          <div>
            {lineLabel('Téléphone professionnel')}
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="tel"
                value={values.officePhone}
                onChange={(e) => set('officePhone', e.target.value)}
                placeholder="+33 1 XX XX XX XX"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div>
            {lineLabel('Email professionnel', true)}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="email"
                value={values.companyEmail}
                onChange={(e) => set('companyEmail', e.target.value)}
                placeholder="contact@entreprise.com"
                className={cn(inputClass, 'pl-10', formErrors.companyEmail && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                aria-invalid={!!formErrors.companyEmail}
              />
            </div>
            <FieldError message={formErrors.companyEmail} />
          </div>

          <div>
            {lineLabel('Poste')}
            <div className="relative">
              <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={values.position}
                onChange={(e) => set('position', e.target.value)}
                placeholder="Gérant, Directeur..."
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div>
            {lineLabel('Nombre d\'employés')}
            <div className="relative">
              <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={values.employees}
                onChange={(e) => set('employees', e.target.value)}
                className={cn(selectClass, 'pl-10')}
              >
                <option value="">Sélectionnez</option>
                {EMPLOYEE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {lineLabel('Site web')}
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="url"
                value={values.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>

          <div>
            {lineLabel('Fax')}
            <div className="relative">
              <Printer className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="tel"
                value={values.fax}
                onChange={(e) => set('fax', e.target.value)}
                placeholder="+33 1 XX XX XX XX"
                className={cn(inputClass, 'pl-10')}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end">
          {existing && (
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={isSubmitDisabled}
              className="inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Confirmer et continuer
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={cn(
              'inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
              existing
                ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
            )}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </>
            ) : existing ? (
              'Modifier et continuer'
            ) : (
              'Valider mon entreprise et continuer'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}