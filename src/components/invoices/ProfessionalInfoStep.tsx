'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Hash,
  Globe,
  MapPin,
  MapPinned,
  Phone,
  Mail,
  Briefcase,
  Info,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  User,
  ArrowLeft,
  ArrowRight,
  Save,
  Lock,
  Tag,
  CalendarDays,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  fetchProfessionalInfo,
  saveProfessionalInfo,
  verifyCompanySiret,
  type ProfessionalInfo,
  type VerifiedCompanySiret,
} from '@/services/professionalInfoService';

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
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#004ac6] focus:ring-4 focus:ring-[#004ac6]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

const selectClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-all focus:border-[#004ac6] focus:ring-4 focus:ring-[#004ac6]/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

const cardClass = 'bg-white border border-gray-200 rounded-xl p-6 sm:p-8';
const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#003ea8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
const outlineBtnClass =
  'inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

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
  nafCode: '',
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const REQUIRED_PART2_FIELDS: (keyof FormValues)[] = ['companyName', 'siret', 'address', 'city', 'postcode', 'companyEmail'];

function validatePart2(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of REQUIRED_PART2_FIELDS) {
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

function formatSiret(siret: string): string {
  const digits = siret.replace(/\s+/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return siret;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ProfessionalInfoStepProps {
  onComplete: (info: ProfessionalInfo) => void;
}

const stepVariants = {
  initial: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? -28 : 28,
    opacity: 0,
  }),
  enter: { x: 0, opacity: 1 },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? 28 : -28,
    opacity: 0,
  }),
};

const stepTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export function ProfessionalInfoStep({ onComplete }: ProfessionalInfoStepProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [clientType, setClientType] = useState<'particulier' | 'professionnel'>('professionnel');
  const [showHelp, setShowHelp] = useState(false);
  const [verifiedCompany, setVerifiedCompany] = useState<VerifiedCompanySiret | null>(null);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const existingRef = useRef<ProfessionalInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const info = await fetchProfessionalInfo();
        if (cancelled) return;
        if (info) {
          setExisting(true);
          existingRef.current = info;
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
            nafCode: info.nafCode || '',
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

  const set = useCallback((key: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setApiError(null);
  }, []);

  const goToVerify = useCallback(() => {
    setEditing(false);
    setVerifiedCompany(null);
    setFormErrors({});
    setApiError(null);
    setSuccessMessage(null);
    setDirection('right');
  }, []);

  const view = useMemo<'verify' | 'card' | 'form'>(() => {
    if (!existing && !verifiedCompany) return 'verify';
    if (editing) return 'form';
    return 'card';
  }, [existing, verifiedCompany, editing]);

  const handleVerify = useCallback(async () => {
    const errors: FieldErrors = {};

    const siret = values.siret.replace(/\s+/g, '');
    if (!siret) {
      errors.siret = 'Ce champ est obligatoire.';
    } else if (!/^\d{9}(\d{5})?$/.test(siret)) {
      errors.siret = 'Le SIREN / SIRET doit contenir 9 ou 14 chiffres.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setApiError(null);
    setVerifying(true);
    try {
      const company = await verifyCompanySiret(values.siret.replace(/\s+/g, ''));
      setVerifiedCompany(company);
      setValues((prev) => ({
        ...prev,
        companyName: company.companyName || company.legalName,
        siret: company.siret,
        vatNumber: company.vatNumber,
        address: company.address,
        city: company.city,
        state: company.state,
        postcode: company.postcode,
        country: company.country,
        nafCode: company.nafCode,
      }));
      setDirection('left');
    } catch (err: any) {
      setFormErrors((prev) => ({
        ...prev,
        siret: err?.status === 404 ? 'Aucune entreprise trouvée avec ce numéro SIRET. Veuillez vérifier.' : (err?.message || 'Une erreur est survenue pendant la vérification.'),
      }));
      setApiError(err?.status === 404 ? null : (err?.message || 'Une erreur est survenue pendant la vérification.'));
    } finally {
      setVerifying(false);
    }
  }, [values.siret]);

  const submit = useCallback(async () => {
    const errors = validatePart2(values);
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

      const saved = await saveProfessionalInfo(cleaned);
      existingRef.current = saved;
      setSuccessMessage('Vos informations ont été mises à jour.');
      if (editing) {
        // Retour en mode lecture sans avancer dans le wizard.
        setEditing(false);
      } else {
        onComplete(saved);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Une erreur est survenue pendant l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }, [values, editing, onComplete]);

  const continueReadonly = useCallback(() => {
    if (existingRef.current) {
      onComplete(existingRef.current);
      return;
    }
    onComplete({ ...values, vatValidated: false, vatRate: 0.2 });
  }, [values, onComplete]);

  const continueNew = useCallback(() => {
    const errors = validatePart2(values);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setEditing(true);
      return;
    }
    submit();
  }, [values, submit]);

  const cancelEdit = useCallback(() => {
    if (existingRef.current) {
      const info = existingRef.current;
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
        nafCode: info.nafCode || '',
      });
    }
    setFormErrors({});
    setApiError(null);
    setSuccessMessage(null);
    setEditing(false);
  }, []);

  const isSubmitDisabled = useMemo(() => saving, [saving]);
  const isVerifyDisabled = useMemo(() => verifying, [verifying]);
  // Champs d'identité définitivement verrouillés après la 1re validation.
  const identityLocked = useMemo(() => existing, [existing]);

  if (loading) {
    return (
      <div className={cn(cardClass, 'p-14 text-center')}>
        <div className="mx-auto w-8 h-8 border-2 border-gray-200 border-t-[#004ac6] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-gray-500">Chargement de vos informations professionnelles…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn(cardClass, 'p-10 text-center')}>
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

  const siren = verifiedCompany?.siren || values.siret.replace(/\s+/g, '').slice(0, 9) || '';
  const companyLabel = verifiedCompany ? (verifiedCompany.legalName || verifiedCompany.companyName) : (values.companyName || 'Votre entreprise');

  return (
    <div className={cn(cardClass, 'relative overflow-hidden')}>
      <AnimatePresence custom={direction} mode="wait" initial={false}>
        {view === 'verify' ? (
          <motion.div
            key="view-verify"
            custom={direction}
            variants={stepVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={stepTransition}
          >
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-sm text-blue-900 mb-6">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="leading-relaxed">
                Avant de générer votre première facture, vérifiez votre entreprise en quelques secondes grâce à son numéro SIRET.
              </p>
            </div>

            <div className="mb-6">
              <span className="block text-[11px] font-semibold text-gray-500 mb-2">Vous êtes</span>
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setClientType('particulier')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    clientType === 'particulier' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <User className="h-4 w-4" />
                  Particulier
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('professionnel')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    clientType === 'professionnel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  Professionnel
                </button>
              </div>
            </div>

            {clientType === 'particulier' ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed">
                  La génération de vos factures nécessite les informations de votre entreprise.
                  Sélectionnez <span className="font-semibold">« Professionnel »</span> pour continuer.
                </p>
              </div>
            ) : (
              <div>
                {lineLabel('Numéro SIRET', true)}
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={values.siret}
                    onChange={(e) => set('siret', e.target.value)}
                    placeholder="14 chiffres (ex : 552 049 447 00017)"
                    inputMode="numeric"
                    className={cn(inputClass, 'pl-10', formErrors.siret && 'border-red-300 focus:border-red-400 focus:ring-red-400/10')}
                    aria-invalid={!!formErrors.siret}
                  />
                </div>
                <FieldError message={formErrors.siret} />

                <p className="mt-3 text-[13px] leading-5 text-gray-500">
                  Votre SIRET permet de retrouver automatiquement les informations publiques de votre entreprise.
                </p>

                <button
                  type="button"
                  onClick={() => setShowHelp((s) => !s)}
                  className="mt-2 inline-block text-[13px] font-semibold text-[#004ac6] hover:text-[#003ea8] transition-colors"
                >
                  {showHelp ? 'Masquer les détails' : 'En savoir plus'}
                </button>

                {showHelp && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
                    <p className="text-[13px] leading-5 text-gray-600">
                      Nous récupérons automatiquement la raison sociale, le SIREN/SIRET, le numéro de TVA
                      intracommunautaire, l'activité et l'adresse du siège. Aucune donnée sensible n'est
                      affichée.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifyDisabled || clientType !== 'professionnel'}
                className={primaryBtnClass}
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Vérification…
                  </>
                ) : (
                  'Vérifier mon entreprise'
                )}
              </button>
            </div>
          </motion.div>
        ) : view === 'card' ? (
          <motion.div
            key="view-card"
            custom={direction}
            variants={stepVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={stepTransition}
          >
            <div
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm mb-6',
                existing
                  ? 'border-blue-200 bg-blue-50 text-blue-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              )}
            >
              {existing ? (
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="leading-relaxed">
                {existing ? (
                  <p>Vos informations professionnelles sont enregistrées. Vous pouvez les modifier à tout moment.</p>
                ) : (
                  <>
                    <p className="font-semibold">✓ Entreprise vérifiée</p>
                    <p className="mt-0.5">
                      Les informations publiques de <span className="font-medium">{companyLabel}</span> ont été retrouvées automatiquement.
                    </p>
                  </>
                )}
              </div>
            </div>

            {successMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 mb-6">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed font-medium">{successMessage}</p>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <span className="w-8 h-8 rounded-lg bg-[#004ac6] text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">{companyLabel}</h3>
                  <p className="text-[12.5px] text-gray-500">
                    {siren ? `SIREN ${formatSiret(siren)}` : 'Entreprise non vérifiée'}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">SIRET</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-1">{values.siret ? formatSiret(values.siret) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">TVA Intracommunautaire</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    {values.vatNumber || 'Non communiquée'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Adresse du siège</dt>
                  <dd className="text-sm font-semibold text-gray-900 mt-1 flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {[values.address, values.postcode, values.city].map((p) => p.trim()).filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
                {!existing && verifiedCompany && (
                  <>
                    <div>
                      <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Statut</dt>
                      <dd className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', verifiedCompany.active ? 'bg-emerald-500' : 'bg-red-500')} />
                        {verifiedCompany.active ? 'Active' : 'Radiée'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Activité (NAF)</dt>
                      <dd className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                        {verifiedCompany.nafCode || '—'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Créée le</dt>
                      <dd className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(verifiedCompany.createdAt) || '—'}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            <div
              className={cn(
                'mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center',
                existing ? 'sm:justify-end' : 'sm:justify-between'
              )}
            >
              {!existing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  disabled={isSubmitDisabled}
                  className={outlineBtnClass}
                >
                  Modifier les informations
                </button>
              )}

              {existing && (
                <button
                  type="button"
                  onClick={() => {
                    setSuccessMessage(null);
                    setEditing(true);
                  }}
                  disabled={isSubmitDisabled}
                  className={outlineBtnClass}
                >
                  Modifier les informations
                </button>
              )}

              {existing ? (
                <button
                  type="button"
                  onClick={continueReadonly}
                  className={primaryBtnClass}
                >
                  Continuer vers le choix de la commande
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={continueNew}
                  disabled={isSubmitDisabled}
                  className={primaryBtnClass}
                >
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view-form"
            custom={direction}
            variants={stepVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={stepTransition}
          >
            <div className="mb-6">
              <h3 className="text-[17px] font-semibold text-gray-900">Confirmez vos informations</h3>
              <p className="mt-1 text-[13px] text-gray-500">
                Les données de l'entreprise sont déjà pré-remplies. Complétez simplement le contact et l'adresse.
              </p>
            </div>

            {apiError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 mb-6">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed font-medium">{apiError}</p>
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <h3 className="text-[15px] font-semibold text-gray-900">Entreprise</h3>
                {!existing && (
                  <button
                    type="button"
                    onClick={goToVerify}
                    className="text-[13px] font-semibold text-[#004ac6] hover:text-[#003ea8] transition-colors"
                  >
                    Modifier le SIRET
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-5">
                <div className="md:col-span-2">
                  {lineLabel('Société', true)}
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={values.companyName}
                      onChange={(e) => set('companyName', e.target.value)}
                      placeholder="Nom de votre entreprise"
                      disabled={identityLocked}
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
                      disabled={identityLocked}
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
                      disabled={identityLocked}
                      className={cn(inputClass, 'pl-10')}
                    />
                  </div>
                </div>

                {existing && (
                  <div className="md:col-span-2">
                    <div className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <p className="text-[12.5px] leading-5 text-gray-500">
                        Ces informations sont définitives après vérification de l'entreprise.
                        Pour toute modification, contactez le support.
                      </p>
                    </div>
                  </div>
                )}

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
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <h3 className="text-[15px] font-semibold text-gray-900">Votre interlocuteur</h3>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-5">
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
                  {lineLabel('Poste')}
                  <div className="relative">
                    <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={values.position}
                      onChange={(e) => set('position', e.target.value)}
                      placeholder="Gérant, Directeur…"
                      className={cn(inputClass, 'pl-10')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:items-center',
                existing ? 'sm:justify-end' : 'sm:justify-between'
              )}
            >
              {!existing && (
                <button
                  type="button"
                  onClick={goToVerify}
                  disabled={isSubmitDisabled}
                  className={outlineBtnClass}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Modifier l'entreprise
                </button>
              )}

              {existing && editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitDisabled}
                  className={outlineBtnClass}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Annuler
                </button>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={isSubmitDisabled}
                className={primaryBtnClass}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Enregistrement…
                  </>
                ) : existing ? (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer mes modifications
                  </>
                ) : (
                  <>
                    Confirmer et continuer
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}