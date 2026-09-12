'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import CustomerInfoForm from '@/components/customer-info-form';
import DeliveryPaymentStep from '@/components/checkout/DeliveryPaymentStep';
import CheckoutConfirmation from '@/components/checkout/CheckoutConfirmation';
import { useCart, type CartItem } from '@/contexts/CartContext';
import {
  type ClientSessionProfile,
  type CustomerInfoField,
  type CustomerInfoValues,
  DEFAULT_COUNTRY_OPTIONS,
  defaultCustomerValues,
  profileToCustomerValues,
  validateCustomerField,
} from '@/lib/customer-form-utils';

type Step = 'auth' | 'register' | 'address' | 'delivery' | 'confirmed';
type Direction = 1 | -1;
type LoginMode = 'login' | 'forgot';

const FLOW_STEPS = [
  { id: 'identification', labelKey: 'checkout.stepIdentification' },
  { id: 'livraison', labelKey: 'checkout.stepDelivery' },
  { id: 'paiement', labelKey: 'checkout.stepPayment' },
] as const;

const CIVILITY_OPTIONS = [
  { value: 'Monsieur', labelKey: 'checkout.mr' },
  { value: 'Madame', labelKey: 'checkout.mrs' },
  { value: 'Mademoiselle', labelKey: 'checkout.ms' },
] as const;

const stepVariants = {
  enter: (dir: Direction) => ({ x: dir === 1 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: Direction) => ({ x: dir === 1 ? -60 : 60, opacity: 0 }),
};

function currentStepIndex(step: Step): number {
  if (step === 'address') return 1;
  if (step === 'delivery' || step === 'confirmed') return 2;
  return 0;
}

function RecapRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function CheckoutFlow() {
  const [step, setStep] = useState<Step>('auth');
  const [direction, setDirection] = useState<Direction>(1);
  const [sessionReady, setSessionReady] = useState(false);

  const { items, clearCart } = useCart();
  const [paidSnapshot, setPaidSnapshot] = useState<null | { items: CartItem[]; total: number; email: string; isNewCustomer: boolean }>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [civility, setCivility] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formValues, setFormValues] = useState<CustomerInfoValues>(defaultCustomerValues());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [addressEditing, setAddressEditing] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);

  const router = useRouter();
  const { t } = useI18n();
  const emailRef = useRef<HTMLInputElement>(null);

  const go = useCallback((next: Step, dir: Direction = 1) => {
    setDirection(dir);
    setStep(next);
    setError('');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/boutique/session-status')
      .then(res => res.json())
      .then((data: { loggedIn?: boolean }) => {
        if (!cancelled && data?.loggedIn) go('address', 1);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => { cancelled = true; };
  }, [go]);

  useEffect(() => {
    if (step !== 'auth' || loginMode !== 'login') return;
    const t = window.setTimeout(() => emailRef.current?.focus(), 400);
    return () => window.clearTimeout(t);
  }, [step, loginMode]);

  useEffect(() => {
    if (step !== 'address' || addressLoaded) return;
    let cancelled = false;
    fetch('/api/boutique/session-status')
      .then(res => res.json())
      .then((profile: ClientSessionProfile & { loggedIn?: boolean; civility?: string }) => {
        if (cancelled || !profile?.loggedIn) return;
        setFormValues(prev => ({ ...prev, ...profileToCustomerValues(profile) }));
        if (profile.civility) setCivility(profile.civility);
        if (profile.companyName) setCompanyName(profile.companyName);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAddressLoaded(true);
      });
    return () => { cancelled = true; };
  }, [step, addressLoaded]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !password || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || t('checkout.loginError'));
      }
      go('address', 1);
    } catch (err: any) {
      setError(err?.message || t('checkout.genericError'));
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(field: CustomerInfoField, value: string) {
    setFormValues(prev => ({ ...prev, [field]: value }));
    const err = validateCustomerField(field, value, t);
    setFormErrors(prev => (err ? { ...prev, [field]: err } : { ...prev, [field]: '' }));
  }

  function handleFormBlur(field: CustomerInfoField, value: string) {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setFormTouched(prev => ({ ...prev, [field]: true }));
    const err = validateCustomerField(field, value, t);
    setFormErrors(prev => (err ? { ...prev, [field]: err } : { ...prev, [field]: '' }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    (['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'postcode', 'country'] as CustomerInfoField[]).forEach(f => {
      const err = validateCustomerField(f, formValues[f], t);
      newTouched[f] = true;
      if (err) newErrors[f] = err;
    });

    if (!formValues.firstName.trim()) newErrors.firstName = t('checkout.errFirstName');
    if (!formValues.lastName.trim()) newErrors.lastName = t('checkout.errLastName');
    if (!formValues.email.trim()) newErrors.email = t('checkout.errEmail');
    if (!formValues.phone.trim()) newErrors.phone = t('checkout.errPhone');
    if (!formValues.addressLine1.trim()) newErrors.addressLine1 = t('checkout.errAddress');
    if (!civility) newErrors.civility = t('checkout.errCivility');

    if (!registerPassword) {
      newErrors.registerPassword = t('checkout.errPassword');
    } else if (registerPassword.length < 8) {
      newErrors.registerPassword = t('checkout.errPasswordShort');
    }
    if (!acceptTerms) newErrors.terms = t('checkout.errTerms');

    setFormErrors(newErrors);
    setFormTouched(newTouched);
    setError('');
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/boutique/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formValues.email,
          displayName: `${formValues.firstName} ${formValues.lastName}`.trim(),
          phone: formValues.phone,
          addressLine1: formValues.addressLine1,
          addressLine2: formValues.addressLine2,
          postcode: formValues.postcode,
          city: formValues.city,
          country: formValues.country || 'FR',
          companyName: companyName.trim(),
          civility,
          password: registerPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || t('checkout.createAccountError'));
      }
      setEmail(formValues.email);
      go('address', 1);
    } catch (err: any) {
      setError(err?.message || t('checkout.genericError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t('checkout.sendLinkError'));
      }
      setForgotSent(true);
    } catch (err: any) {
      setError(err?.message || t('checkout.genericError'));
    } finally {
      setLoading(false);
    }
  }

  const handleStepBack = useCallback(() => {
    if (step === 'address') go('auth', -1);
    else if (step === 'delivery') go('address', -1);
    else router.push('/boutique/panier');
  }, [step, go, router]);

  const handlePaid = (payload: { isNewCustomer?: boolean; total: number }) => {
    // Snapshot AVANT vidage du panier : la confirmation affiche la commande payée.
    setPaidSnapshot({
      items,
      total: payload.total,
      email: formValues.email,
      isNewCustomer: payload.isNewCustomer !== false,
    });
    clearCart();
    go('confirmed', 1);
  };

  function buildAddressErrors() {
    const newErrors: Record<string, string> = {};
    (['firstName', 'lastName', 'email', 'phone', 'addressLine1', 'city', 'postcode', 'country'] as CustomerInfoField[]).forEach(f => {
      const err = validateCustomerField(f, formValues[f], t);
      if (err) newErrors[f] = err;
    });
    if (!formValues.firstName.trim()) newErrors.firstName = t('checkout.errFirstName');
    if (!formValues.lastName.trim()) newErrors.lastName = t('checkout.errLastName');
    if (!formValues.email.trim()) newErrors.email = t('checkout.errEmail');
    if (!formValues.phone.trim()) newErrors.phone = t('checkout.errPhone');
    if (!formValues.addressLine1.trim()) newErrors.addressLine1 = t('checkout.errAddress');
    if (!civility) newErrors.civility = t('checkout.errCivility');
    return newErrors;
  }

  async function persistAddress(): Promise<boolean> {
    const newErrors = buildAddressErrors();
    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setFormTouched({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        addressLine1: true,
        postcode: true,
        city: true,
        country: true,
      });
      return false;
    }
    setAddressSaving(true);
    setError('');
    try {
      const res = await fetch('/api/boutique/customer/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          phone: formValues.phone,
          addressLine1: formValues.addressLine1,
          addressLine2: formValues.addressLine2,
          postcode: formValues.postcode,
          city: formValues.city,
          country: formValues.country || 'FR',
          civility,
          companyName: companyName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || t('checkout.saveAddressError'));
      }
      setAddressEditing(false);
      return true;
    } catch (err: any) {
      setError(err?.message || t('checkout.genericError'));
      return false;
    } finally {
      setAddressSaving(false);
    }
  }

  async function handleAddressConfirm() {
    if (addressSaving) return;
    const ok = await persistAddress();
    if (ok) go('delivery', 1);
  }

  const countryLabel =
    DEFAULT_COUNTRY_OPTIONS.find(o => o.value === (formValues.country || 'FR'))?.label ||
    DEFAULT_COUNTRY_OPTIONS.find(o => o.value === formValues.country?.toUpperCase())?.label ||
    formValues.country ||
    'France';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      className="min-h-screen w-full bg-[#F5F5F5]"
    >
      <div className={cn('mx-auto flex min-h-screen w-full flex-col px-5 py-8 sm:px-8 sm:py-10', step === 'delivery' ? 'max-w-6xl' : 'max-w-5xl')}>
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="self-start sm:w-28">
            <button
              onClick={handleStepBack}
              aria-label={t('checkout.retour')}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <ArrowLeft size={15} />
              {t('checkout.retour')}
            </button>
          </div>
          <nav className="flex w-full items-center justify-center gap-1 overflow-x-auto sm:w-auto sm:gap-2" aria-label={t('checkout.stepsAria')}>
            {FLOW_STEPS.map((s, i) => {
              const active = currentStepIndex(step) === i;
              const done = currentStepIndex(step) > i;
              const stateClass = active
                ? 'bg-gray-900 text-white'
                : done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-300 text-gray-500';
              return (
                <div key={s.id} className="flex items-center gap-1 sm:gap-2">
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors', stateClass)}>
                    {done ? <CheckCircle2 size={15} /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-semibold sm:text-sm', active ? 'text-gray-900' : 'text-gray-400')}>
                    {t(s.labelKey)}
                  </span>
                  {i < FLOW_STEPS.length - 1 && <span className="mx-1 h-px w-8 shrink-0 bg-gray-300 sm:w-12" />}
                </div>
              );
            })}
          </nav>
          <div className="hidden w-28 sm:block" />
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {step === 'auth' && !sessionReady && (
              <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                <Loader2 size={30} className="animate-spin text-gray-300" />
                <p className="mt-4 text-sm text-gray-400">{t('checkout.loadingSession')}</p>
              </div>
            )}

            {step === 'auth' && sessionReady && (
              <div className="flex flex-1 flex-col">
                <div className="text-center">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    {t('checkout.finalizeTitle')}
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                    {t('checkout.finalizeSub')}
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <section className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                    {loginMode === 'login' ? (
                      <>
                        <h2 className="text-center text-xl font-bold text-gray-900">{t('checkout.signInTitle')}</h2>
                        <p className="mt-1.5 text-center text-sm leading-6 text-gray-500">
                          {t('checkout.signInDesc')}
                        </p>
                        <form onSubmit={handleLogin} className="mt-6 flex flex-1 flex-col gap-4">
                          <div>
                            <label htmlFor="co-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              {t('checkout.emailRecap')}
                            </label>
                            <div className="relative">
                              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                id="co-email"
                                ref={emailRef}
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="vous@entreprise.fr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="co-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              {t('checkout.password')}
                            </label>
                            <div className="relative">
                              <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                id="co-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder={t('checkout.passwordPlaceholder')}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? t('checkout.hidePassword') : t('checkout.showPassword')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                          {error && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700 whitespace-pre-line">
                              {error}
                            </div>
                          )}
                          <div className="mt-auto flex flex-col gap-3 pt-2">
                            <button
                              type="submit"
                              disabled={loading || !email.trim() || !password}
                              className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                                loading || !email.trim() || !password
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              )}
                            >
                              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                              {t('checkout.signInTitle')}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setLoginMode('forgot'); setError(''); setForgotSent(false); }}
                              className="text-center text-xs font-semibold text-blue-600 transition-colors hover:underline"
                            >
                              {t('checkout.forgotPassword')}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <>
                        <h2 className="text-center text-xl font-bold text-gray-900">{t('checkout.signInTitle')}</h2>
                        <p className="mt-1.5 text-center text-sm leading-6 text-gray-500">
                          {t('checkout.signInDesc')}
                        </p>
                        <form onSubmit={handleForgotPassword} className="mt-6 flex flex-1 flex-col gap-4">
                          <p className="text-xs leading-5 text-gray-500">
                            {t('checkout.forgotDesc')}
                          </p>
                          <div>
                            <label htmlFor="co-forgot-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              {t('checkout.emailRecap')}
                            </label>
                            <div className="relative">
                              <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                id="co-forgot-email"
                                ref={emailRef}
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="vous@entreprise.fr"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                              />
                            </div>
                          </div>
                          {forgotSent ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                              {t('checkout.forgotSent')}
                            </div>
                          ) : (
                            <button
                              type="submit"
                              disabled={loading || !email.trim()}
                              className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                                loading || !email.trim()
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                                  : 'bg-gray-900 text-white hover:bg-gray-800'
                              )}
                            >
                              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                              {t('checkout.sendLink')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setLoginMode('login'); setError(''); setForgotSent(false); }}
                            className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-blue-600 transition-colors hover:underline"
                          >
                            <ArrowLeft size={13} />
                            {t('checkout.backToSignIn')}
                          </button>
                        </form>
                      </>
                    )}
                  </section>

                  <section className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-center text-xl font-bold text-gray-900">{t('checkout.createAccountTitle')}</h2>
                    <p className="mt-1.5 text-center text-sm leading-6 text-gray-500">
                      {t('checkout.createAccountDesc')}
                    </p>
                    <div className="mt-6 flex flex-1 flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-900 bg-white text-gray-900">
                        <UserPlus size={22} />
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-gray-900">{t('checkout.newCustomer')}</h3>
                      <p className="mt-1.5 max-w-[16rem] text-center text-xs leading-5 text-gray-500">
                        {t('checkout.newCustomerDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => go('register', 1)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-900 bg-white py-3 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-900 hover:text-white active:scale-[0.98]"
                    >
                      <UserPlus size={16} />
                      {t('checkout.createAccount')}
                    </button>
                  </section>
                </div>

                <p className="mt-8 flex items-center justify-center gap-1.5 text-xs leading-4 text-gray-400">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  {t('checkout.privacyNotice')}
                </p>
              </div>
            )}

            {step === 'register' && (
              <div className="flex flex-1 flex-col items-center pb-16">
                <div className="text-center">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    {t('checkout.createAccountTitle')}
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                    {t('checkout.createAccountDescRegister')}
                  </p>
                </div>

                <div className="mt-10 w-full max-w-2xl">
                  <form
                    onSubmit={handleRegister}
                    noValidate
                    className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t('checkout.civility')}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {CIVILITY_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setCivility(option.value); setError(''); }}
                            className={cn(
                              'rounded-xl border py-2.5 text-sm font-semibold transition-all',
                              civility === option.value
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            )}
                          >
                            {t(option.labelKey)}
                          </button>
                        ))}
                      </div>
                      {formErrors.civility && (
                        <p className="mt-1.5 text-[10px] text-red-500">{formErrors.civility}</p>
                      )}
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="co-reg-company"
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {t('checkout.companyName')}
                      </label>
                      <div className="relative">
                        <Building2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="co-reg-company"
                          type="text"
                          value={companyName}
                          onChange={(e) => { setCompanyName(e.target.value); setError(''); }}
                          placeholder={t('checkout.companyNameOptionalPlaceholder')}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <CustomerInfoForm
                        values={formValues}
                        errors={formErrors}
                        touched={formTouched}
                        onFieldChange={handleFormChange}
                        onFieldBlur={handleFormBlur}
                        onCitySelect={(cityName, postcode) => {
                          setFormValues(prev => ({ ...prev, city: cityName, postcode }));
                          setFormErrors(prev => ({ ...prev, city: '', postcode: '' }));
                          setFormTouched(prev => ({ ...prev, city: true, postcode: true }));
                        }}
                      />
                    </div>

                    <div className="mt-5">
                      <label
                        htmlFor="co-reg-password"
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                      >
                        {t('checkout.password')}
                      </label>
                      <div className="relative">
                        <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="co-reg-password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={registerPassword}
                          onChange={(e) => { setRegisterPassword(e.target.value); setError(''); }}
                          placeholder={t('checkout.createPasswordPlaceholder')}
                          className={cn(
                            'w-full rounded-xl border bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:bg-white',
                            formErrors.registerPassword
                              ? 'border-red-300 focus:border-red-400'
                              : 'border-gray-200 focus:border-gray-900'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(v => !v)}
                          aria-label={showRegisterPassword ? t('checkout.hidePassword') : t('checkout.showPassword')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                        >
                          {showRegisterPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {formErrors.registerPassword && (
                        <p className="mt-1.5 text-[10px] text-red-500">{formErrors.registerPassword}</p>
                      )}
                    </div>

                    {error && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700 whitespace-pre-line">
                        {error}
                      </div>
                    )}

                    <label htmlFor="co-terms" className="mt-5 flex cursor-pointer items-start gap-2.5">
                      <input
                        id="co-terms"
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => { setAcceptTerms(e.target.checked); setError(''); }}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-gray-900"
                      />
                      <span className="text-xs leading-5 text-gray-600">
                        {t('checkout.acceptTermsLabel')}{' '}
                        <a
                          href="https://pixiatech.com/politique-confidentialite/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-blue-600 transition-colors hover:underline"
                        >
                          {t('checkout.privacyPolicyLink')}
                        </a>
                        .
                      </span>
                    </label>
                    {formErrors.terms && (
                      <p className="mt-1.5 text-[10px] text-red-500">{formErrors.terms}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={cn(
                        'mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98]',
                        loading
                          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      )}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      {t('checkout.createAccountAndContinue')}
                    </button>

                    <button
                      type="button"
                      onClick={() => go('auth', -1)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700"
                    >
                      <ArrowLeft size={13} />
                      {t('checkout.backToOptions')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {step === 'address' && (
              <div className="flex flex-1 flex-col items-center pb-16">
                <div className="w-full max-w-2xl text-center">
                  <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    {t('checkout.addrTitle')}
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                    {t('checkout.addrDesc')}
                  </p>
                </div>

                <div className="relative mt-8 w-full max-w-2xl rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                  {!addressEditing && (
                    <button
                      type="button"
                      onClick={() => { setAddressEditing(true); setError(''); }}
                      className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                    >
                      <Pencil size={13} />
                      {t('checkout.edit')}
                    </button>
                  )}

                  {addressEditing ? (
                    <form onSubmit={(e) => { e.preventDefault(); persistAddress(); }} noValidate>
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">{t('checkout.editAddressTitle')}</h2>
                        <button
                          type="button"
                          onClick={() => { setAddressEditing(false); setError(''); }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-700"
                        >
                          <X size={13} />
                          {t('checkout.cancel')}
                        </button>
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          {t('checkout.civility')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {CIVILITY_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setCivility(option.value); setError(''); }}
                              className={cn(
                                'rounded-xl border py-2.5 text-sm font-semibold transition-all',
civility === option.value
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            )}
                          >
                            {t(option.labelKey)}
                          </button>
                        ))}
                      </div>
                        {formErrors.civility && (
                          <p className="mt-1.5 text-[10px] text-red-500">{formErrors.civility}</p>
                        )}
                      </div>

                      <div className="mt-5">
                        <label
                          htmlFor="co-edit-company"
                          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                        >
                          {t('checkout.companyName')}
                        </label>
                        <div className="relative">
                          <Building2 size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            id="co-edit-company"
                            type="text"
                            value={companyName}
                            onChange={(e) => { setCompanyName(e.target.value); setError(''); }}
                            placeholder={t('checkout.companyNameOptionalPlaceholder')}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <CustomerInfoForm
                          values={formValues}
                          errors={formErrors}
                          touched={formTouched}
                          onFieldChange={handleFormChange}
                          onFieldBlur={handleFormBlur}
                          onCitySelect={(cityName, postcode) => {
                            setFormValues(prev => ({ ...prev, city: cityName, postcode }));
                            setFormErrors(prev => ({ ...prev, city: '', postcode: '' }));
                            setFormTouched(prev => ({ ...prev, city: true, postcode: true }));
                          }}
                        />
                      </div>

                      {error && (
                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700 whitespace-pre-line">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={addressSaving}
                        className={cn(
                          'mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98]',
                          addressSaving
                            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        )}
                      >
                        {addressSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {t('checkout.saveChanges')}
                      </button>
                    </form>
                  ) : (
                    <div>
                      <div className="border-b border-gray-100">
                        <RecapRow
                          icon={<User size={16} />}
                          label={t('checkout.contact')}
                          value={[civility, formValues.firstName, formValues.lastName].filter(Boolean).join(' ') || '—'}
                        />
                      </div>
                      {companyName.trim() && (
                        <div className="border-b border-gray-100">
                          <RecapRow icon={<Building2 size={16} />} label={t('checkout.company')} value={companyName.trim()} />
                        </div>
                      )}
                      <div className="border-b border-gray-100">
                        <RecapRow icon={<MapPin size={16} />} label={t('checkout.address')} value={formValues.addressLine1 || '—'} />
                      </div>
                      {formValues.addressLine2.trim() && (
                        <div className="border-b border-gray-100">
                          <RecapRow icon={<MapPin size={16} />} label={t('checkout.address2')} value={formValues.addressLine2.trim()} />
                        </div>
                      )}
                      <div className="border-b border-gray-100">
                        <RecapRow
                          icon={<MapPin size={16} />}
                          label={t('checkout.postcodeCity')}
                          value={[formValues.postcode, formValues.city].filter(Boolean).join(' ') || '—'}
                        />
                      </div>
                      <div className="border-b border-gray-100">
                        <RecapRow icon={<Globe size={16} />} label={t('checkout.countryLabel')} value={countryLabel} />
                      </div>
                      <div className="border-b border-gray-100">
                        <RecapRow icon={<Phone size={16} />} label={t('checkout.phone')} value={formValues.phone || '—'} />
                      </div>
                      <div className="border-b border-gray-100">
                        <RecapRow icon={<Mail size={16} />} label={t('checkout.emailRecap')} value={formValues.email || '—'} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex w-full max-w-2xl flex-col items-center gap-4">
                  <button
                    onClick={handleAddressConfirm}
                    disabled={addressSaving}
                    className={cn(
                      'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98]',
                      addressSaving
                        ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    )}
                  >
                    {addressSaving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {t('checkout.confirmAndContinue')}
                  </button>
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={t('checkout.comingSoon')}
                    className="cursor-not-allowed select-none text-xs font-semibold text-gray-300"
                  >
                    {t('checkout.useAnotherAddress')}
                  </button>
                </div>

                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs leading-4 text-gray-400">
                  <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                  {t('checkout.privacyNotice')}
                </p>
              </div>
            )}

            {step === 'delivery' && (
              <DeliveryPaymentStep
                delivery={formValues}
                civility={civility}
                companyName={companyName}
                onEditAddress={() => go('address', -1)}
                onPaid={handlePaid}
              />
            )}

            {step === 'confirmed' && paidSnapshot && (
              <CheckoutConfirmation
                items={paidSnapshot.items}
                total={paidSnapshot.total}
                email={paidSnapshot.email}
                isNewCustomer={paidSnapshot.isNewCustomer}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}