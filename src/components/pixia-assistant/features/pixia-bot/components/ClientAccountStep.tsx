'use client';

import gsap from 'gsap';
import {
  ArrowRight,
  Building2,
  Check,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ClientProfile, Language } from '../../../core/types';

interface ClientAccountStepProps {
  lang: Language;
  clientProfile: ClientProfile | null;
  authError: string | null;
  isLoggingIn: boolean;
  onLogin: (email: string, password: string) => Promise<ClientProfile | null>;
  onLogout: () => Promise<void>;
  onConfirmProfile: (profile: ClientProfile) => void;
  onChooseManual: () => void;
  onLayoutChange?: (info: { view: 'confirm' | 'ask' | 'login'; unfolded: boolean }) => void;
}

type FieldId = 'rep' | 'company' | 'email' | 'phone' | 'city' | 'address';

export function ClientAccountStep({
  lang,
  clientProfile,
  authError,
  isLoggingIn,
  onLogin,
  onLogout,
  onConfirmProfile,
  onChooseManual,
  onLayoutChange,
}: ClientAccountStepProps) {
  const [view, setView] = useState<'confirm' | 'ask' | 'login'>(() =>
    clientProfile ? 'confirm' : 'ask'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unfolded, setUnfolded] = useState(false);
  const [landedIds, setLandedIds] = useState<Partial<Record<FieldId, boolean>>>({});
  const [launchingId, setLaunchingId] = useState<FieldId | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const sourceRefs = useRef<Partial<Record<FieldId, HTMLElement | null>>>({});
  const targetRefs = useRef<Partial<Record<FieldId, HTMLElement | null>>>({});

  useEffect(() => {
    onLayoutChange?.({ view, unfolded });
  }, [view, unfolded, onLayoutChange]);

  useEffect(() => {
    if (clientProfile && view === 'ask') {
      setView('confirm');
    } else if (!clientProfile && view === 'confirm') {
      setView('ask');
      setUnfolded(false);
      setLandedIds({});
      setLaunchingId(null);
    }
  }, [clientProfile, view]);

  const fieldCards = useMemo(() => {
    if (!clientProfile) return [];
    return [
      {
        id: 'rep' as const,
        label: lang === 'fr' ? 'Nom complet' : 'Full name',
        value: clientProfile.representative,
        chipText: clientProfile.representative,
        icon: User,
        span2: false,
      },
      {
        id: 'company' as const,
        label: lang === 'fr' ? 'Société' : 'Company',
        value: clientProfile.company,
        chipText: clientProfile.company,
        icon: Building2,
        span2: false,
      },
      {
        id: 'email' as const,
        label: lang === 'fr' ? 'E-mail' : 'Email',
        value: clientProfile.email,
        chipText: clientProfile.email,
        icon: Mail,
        span2: true,
      },
      {
        id: 'phone' as const,
        label: lang === 'fr' ? 'Téléphone' : 'Phone',
        value: clientProfile.phone,
        chipText: clientProfile.phone,
        icon: Phone,
        mono: true,
        span2: false,
      },
      {
        id: 'city' as const,
        label: lang === 'fr' ? 'Ville' : 'City',
        value: `${clientProfile.deliveryCity} (${clientProfile.deliveryPostcode})`,
        chipText: `${clientProfile.deliveryCity} (${clientProfile.deliveryPostcode})`,
        icon: MapPin,
        span2: false,
      },
      {
        id: 'address' as const,
        label: lang === 'fr' ? 'Adresse complète' : 'Full address',
        value: clientProfile.address,
        chipText: clientProfile.address,
        icon: MapPin,
        span2: true,
      },
    ];
  }, [clientProfile, lang]);

  // GSAP flight animation: profile data pills physically detach from the top card and drop into empty slots below
  useEffect(() => {
    if (view !== 'confirm' || !clientProfile || !unfolded) {
      setLandedIds({});
      setLaunchingId(null);
      if (overlayRef.current) overlayRef.current.innerHTML = '';
      return;
    }

    setLandedIds({});
    setLaunchingId(null);

    let cancelled = false;
    let ctx: gsap.Context | null = null;

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      const cardEl = cardRef.current;
      const overlayEl = overlayRef.current;
      if (!cardEl || !overlayEl) return;

      overlayEl.innerHTML = '';
      const cardRect = cardEl.getBoundingClientRect();

      ctx = gsap.context(() => {
        const tl = gsap.timeline();

        fieldCards.forEach((item, index) => {
          const srcEl = sourceRefs.current[item.id];
          const dstEl = targetRefs.current[item.id];
          if (!srcEl || !dstEl) return;

          const srcRect = srcEl.getBoundingClientRect();
          const dstRect = dstEl.getBoundingClientRect();

          const startX = srcRect.left - cardRect.left;
          const startY = srcRect.top - cardRect.top;
          const endX = dstRect.left - cardRect.left + 10;
          const endY = dstRect.top - cardRect.top + Math.max(18, dstRect.height * 0.45);

          const chip = document.createElement('div');
          chip.textContent = item.chipText;
          chip.className =
            'absolute left-0 top-0 max-w-[230px] truncate rounded-full border border-[#38BDF8]/80 bg-[#1B2330]/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_10px_26px_rgba(56,189,248,0.34),0_0_12px_rgba(192,132,252,0.28)] backdrop-blur-md pointer-events-none select-none';
          overlayEl.appendChild(chip);

          gsap.set(chip, {
            x: startX,
            y: startY,
            scale: 0.9,
            opacity: 0,
            transformOrigin: 'left center',
          });

          const startOffset = index * 0.14;

          tl.call(
            () => {
              if (!cancelled) setLaunchingId(item.id);
            },
            undefined,
            startOffset
          )
            .to(
              chip,
              {
                opacity: 1,
                scale: 1.04,
                duration: 0.12,
                ease: 'power2.out',
              },
              startOffset
            )
            .to(
              chip,
              {
                x: endX,
                y: endY,
                scale: 0.98,
                duration: 0.48,
                ease: 'power3.inOut',
              },
              startOffset + 0.06
            )
            .call(
              () => {
                if (!cancelled) {
                  setLandedIds((prev) => ({ ...prev, [item.id]: true }));
                }
              },
              undefined,
              startOffset + 0.52
            )
            .to(
              chip,
              {
                opacity: 0,
                scale: 0.88,
                duration: 0.15,
                ease: 'power2.in',
                onComplete: () => {
                  chip.remove();
                },
              },
              startOffset + 0.52
            );
        });

        tl.call(() => {
          if (!cancelled) setLaunchingId(null);
        });
      }, overlayEl);
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (ctx) ctx.revert();
      if (overlayRef.current) overlayRef.current.innerHTML = '';
    };
  }, [view, clientProfile, unfolded, fieldCards]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const logged = await onLogin(email, password);
    if (logged) {
      setView('confirm');
      setUnfolded(false);
    }
  };

  if (view === 'confirm' && clientProfile) {
    const landedCount = Object.values(landedIds).filter(Boolean).length;
    const allLanded = landedCount >= fieldCards.length;

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/12 bg-[#202025] p-3 space-y-2.5 overflow-visible"
      >
        <p className="text-[11px] font-medium text-[#D4D4D8]">
          {lang === 'fr'
            ? 'Bonjour ! Nous avons retrouvé votre compte. Est-ce bien vous ?'
            : 'Hello! We found your account. Is this you?'}
        </p>

        {/* Overlay hosting flying GSAP token chips above unfolded cards */}
        <div
          ref={overlayRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 overflow-visible"
        />

        {/* Top Identity Header Card with Photo + Visible Source Token Pills */}
        <div className="rounded-xl border border-white/10 bg-[#151519] p-2.5 space-y-2">
          <div className="flex items-center gap-2.5">
            <img
              src={clientProfile.avatarUrl}
              alt={clientProfile.representative}
              className="h-11 w-11 rounded-full object-cover border border-[#38BDF8]/55 shadow-[0_0_16px_rgba(56,189,248,0.2)] shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  ref={(el) => {
                    sourceRefs.current.rep = el;
                  }}
                  className={`inline-block rounded-md px-1 -mx-1 text-sm font-bold text-white truncate transition-all duration-200 ${
                    launchingId === 'rep'
                      ? 'bg-[#38BDF8]/20 text-[#BAE6FD] scale-95'
                      : ''
                  }`}
                >
                  {clientProfile.representative}
                </span>
              </div>
              <div>
                <span
                  ref={(el) => {
                    sourceRefs.current.email = el;
                  }}
                  className={`inline-block rounded-md px-1 -mx-1 text-[11.5px] text-[#A1A1AA] truncate max-w-full transition-all duration-200 ${
                    launchingId === 'email'
                      ? 'bg-[#38BDF8]/20 text-[#BAE6FD] scale-95'
                      : ''
                  }`}
                >
                  {clientProfile.email}
                </span>
              </div>
              <div>
                <span
                  ref={(el) => {
                    sourceRefs.current.company = el;
                  }}
                  className={`inline-block rounded-md px-1 -mx-1 text-[10.5px] font-medium text-[#93C5FD] truncate max-w-full transition-all duration-200 ${
                    launchingId === 'company'
                      ? 'bg-[#38BDF8]/25 text-white scale-95'
                      : ''
                  }`}
                >
                  {clientProfile.company}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void onLogout()}
              title={lang === 'fr' ? 'Changer de compte' : 'Switch account'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#A1A1AA] hover:text-white cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Inline Saved Origin Chips (phone, city, address) inside top profile card */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.06]">
            <span
              ref={(el) => {
                sourceRefs.current.phone = el;
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono tabular-nums transition-all duration-200 ${
                launchingId === 'phone'
                  ? 'border-[#38BDF8]/70 bg-[#38BDF8]/20 text-white scale-95'
                  : 'border-white/10 bg-white/[0.04] text-[#D4D4D8]'
              }`}
            >
              <Phone className="h-2.5 w-2.5 text-[#38BDF8]" />
              {clientProfile.phone}
            </span>
            <span
              ref={(el) => {
                sourceRefs.current.city = el;
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all duration-200 ${
                launchingId === 'city'
                  ? 'border-[#38BDF8]/70 bg-[#38BDF8]/20 text-white scale-95'
                  : 'border-white/10 bg-white/[0.04] text-[#D4D4D8]'
              }`}
            >
              <MapPin className="h-2.5 w-2.5 text-[#C084FC]" />
              {clientProfile.deliveryCity} ({clientProfile.deliveryPostcode})
            </span>
            <span
              ref={(el) => {
                sourceRefs.current.address = el;
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] truncate max-w-full transition-all duration-200 ${
                launchingId === 'address'
                  ? 'border-[#38BDF8]/70 bg-[#38BDF8]/20 text-white scale-95'
                  : 'border-white/10 bg-white/[0.04] text-[#A1A1AA]'
              }`}
            >
              {clientProfile.address}
            </span>
          </div>
        </div>

        {/* Interactive Checkbox Toggle Row */}
        <button
          type="button"
          onClick={() => setUnfolded((u) => !u)}
          className="pixia-glass-btn w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left cursor-pointer"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
              unfolded
                ? 'border-[#34D399] bg-[#3f9b78] text-white'
                : 'border-white/25 bg-[#121216] text-transparent'
            }`}
          >
            <Check strokeWidth={3} className="h-3 w-3" />
          </span>
          <span className="text-xs font-medium text-[#F4F4F5]">
            {lang === 'fr'
              ? 'Oui, c’est moi — Utiliser mes coordonnées'
              : 'Yes, that’s me — Use my saved details'}
          </span>
        </button>

        {/* Animorio 05 Downward Unfolding Structured Slots (filled dynamically as flying pills drop in!) */}
        <AnimatePresence initial={false}>
          {unfolded ? (
            <motion.div
              key="unfolded-grid"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden space-y-2.5"
            >
              <div className="pt-1.5 border-t border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8E8E98]">
                    {lang === 'fr' ? 'Coordonnées pré-remplies' : 'Autofilled details'}
                  </p>
                  <span className="text-[10px] font-mono tabular-nums text-[#93C5FD]">
                    {landedCount}/{fieldCards.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {fieldCards.map((item) => {
                    const Icon = item.icon;
                    const isLanded = Boolean(landedIds[item.id]);
                    const isIncoming = launchingId === item.id && !isLanded;

                    return (
                      <div
                        key={item.id}
                        ref={(el) => {
                          targetRefs.current[item.id] = el;
                        }}
                        className={`${
                          item.span2 ? 'col-span-2' : 'col-span-1'
                        } rounded-xl border px-2.5 py-1.5 space-y-0.5 transition-all duration-300 ${
                          isLanded
                            ? 'border-[#34D399]/45 bg-[#0D1E17] shadow-[0_0_16px_rgba(52,211,153,0.12)]'
                            : isIncoming
                              ? 'border-[#38BDF8]/65 bg-[#152030]'
                              : 'border-dashed border-white/12 bg-[#141418]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#94A3B8]">
                            <Icon
                              className={`h-2.5 w-2.5 transition-colors ${
                                isLanded
                                  ? 'text-[#34D399]'
                                  : isIncoming
                                    ? 'text-[#38BDF8]'
                                    : 'text-[#64748B]'
                              }`}
                            />
                            {item.label}
                          </span>
                          {isLanded ? (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.75 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                              className="text-[9.5px] font-semibold text-[#34D399]"
                            >
                              {lang === 'fr' ? 'Copié' : 'Copied'}
                            </motion.span>
                          ) : (
                            <span className="text-[9.5px] text-[#52525B]">…</span>
                          )}
                        </div>
                        <p
                          className={`text-[11.5px] font-medium truncate transition-opacity duration-200 ${
                            isLanded ? 'text-white opacity-100' : 'text-[#52525B] opacity-60'
                          } ${item.mono ? 'font-mono tabular-nums' : ''}`}
                        >
                          {isLanded ? item.value : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onConfirmProfile(clientProfile)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                  allLanded
                    ? 'bg-white text-[#141416] hover:bg-[#E4E4E7] shadow-[0_8px_22px_rgba(255,255,255,0.12)]'
                    : 'bg-white/85 text-[#141416] hover:bg-white'
                }`}
              >
                <span>
                  {lang === 'fr'
                    ? 'Continuer avec ces coordonnées'
                    : 'Continue with these details'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="manual-fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                onClick={onChooseManual}
                className="pixia-glass-btn w-full rounded-xl px-4 py-2 text-xs font-medium text-[#D4D4D8] hover:text-white cursor-pointer min-h-[40px]"
              >
                {lang === 'fr'
                  ? 'Non, saisir d’autres coordonnées'
                  : 'No, enter details manually'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleLoginSubmit}
        className="rounded-2xl border border-white/12 bg-[#202025] p-3.5 space-y-3"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
          <KeyRound className="h-3.5 w-3.5 text-[#38BDF8]" />
          {lang === 'fr' ? 'Connexion client' : 'Client sign in'}
        </div>

        <div className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === 'fr' ? 'Email du compte…' : 'Account email…'}
            className="w-full rounded-xl border border-white/12 bg-[#141417] px-3 py-2 text-xs text-white placeholder:text-[#71717A] focus:border-[#38BDF8] focus:outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'fr' ? 'Mot de passe…' : 'Password…'}
            className="w-full rounded-xl border border-white/12 bg-[#141417] px-3 py-2 text-xs text-white placeholder:text-[#71717A] focus:border-[#38BDF8] focus:outline-none"
          />
        </div>

        {authError && <p className="text-xs font-medium text-[#FB7185]">{authError}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('ask')}
            className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-medium text-[#D4D4D8] hover:text-white cursor-pointer min-h-[40px]"
          >
            {lang === 'fr' ? 'Retour' : 'Back'}
          </button>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#141416] hover:bg-[#E4E4E7] disabled:opacity-50 cursor-pointer min-h-[40px]"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>
              {isLoggingIn
                ? lang === 'fr'
                  ? 'Connexion…'
                  : 'Signing in…'
                : lang === 'fr'
                  ? 'Se connecter'
                  : 'Sign in'}
            </span>
          </button>
        </div>
      </motion.form>
    );
  }

  return (
    <div className="rounded-2xl border border-white/12 bg-[#202025] p-3.5 space-y-2">
      <button
        type="button"
        onClick={() => setView('login')}
        className="pixia-glass-btn w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-white cursor-pointer min-h-[44px]"
      >
        <span className="inline-flex items-center gap-2">
          <LogIn className="h-4 w-4 text-[#38BDF8]" />
          <span>{lang === 'fr' ? 'Oui, j’ai un compte — Me connecter' : 'Yes, I have an account'}</span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-[#A1A1AA]" />
      </button>

      <button
        type="button"
        onClick={onChooseManual}
        className="pixia-glass-btn w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-[#E4E4E7] cursor-pointer min-h-[44px]"
      >
        <span className="inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#C084FC]" />
          <span>
            {lang === 'fr'
              ? 'Non, saisir mes coordonnées directement'
              : 'No, enter my details directly'}
          </span>
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-[#A1A1AA]" />
      </button>
    </div>
  );
}
