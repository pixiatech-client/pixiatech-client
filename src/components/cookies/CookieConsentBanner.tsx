'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MobileBottomSheet, useIsMobile } from '@/components/ui/bottom-sheet';
import {
  Cookie,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Lock,
} from 'lucide-react';

/** Coquille du panneau de préférences : sheet sur mobile, modale sur desktop. */
function PreferencesShell({
  isMobile,
  onClose,
  children,
}: {
  isMobile: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (isMobile) {
    return (
      <MobileBottomSheet
        open
        onClose={onClose}
        title="Préférences cookies"
        tone="dark"
        contentClassName="px-0 pb-0"
      >
        {children}
      </MobileBottomSheet>
    );
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {children}
    </div>
  );
}

/** Toggle accordé avec var(--accent) */
function AccentToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 focus:outline-none"
      style={{
        backgroundColor: checked ? 'var(--accent)' : '#222220',
      }}
    >
      <span
        className="absolute top-[2px] left-[2px] w-5 h-5 rounded-full transition-transform"
        style={{
          backgroundColor: checked ? '#0a0a09' : '#ffffff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

export interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

const STORAGE_KEY = 'pixiatech_cookie_consent_v2';
const CONSENT_DURATION_DAYS = 180; // 6 months as recommended by CNIL

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobile();
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false,
    timestamp: 0,
    version: '2.0',
  });

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    try {
      const payload = {
        ...prefs,
        necessary: true,
        timestamp: Date.now(),
        version: '2.0',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      // Also set cookie for server-side awareness if needed
      document.cookie = `pixiatech_consent=accepted; path=/; max-age=${
        CONSENT_DURATION_DAYS * 24 * 60 * 60
      }; SameSite=Lax`;
      setPreferences(payload);
      setShowBanner(false);
      setShowModal(false);

      // Trigger custom event so any listeners (analytics scripts) can react
      window.dispatchEvent(
        new CustomEvent('pixiatech_consent_updated', { detail: payload })
      );
    } catch (e) {
      console.warn('[Cookies] Failed to save consent:', e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookiePreferences = JSON.parse(stored);
        const ageInDays = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60 * 24);
        if (ageInDays < CONSENT_DURATION_DAYS && parsed.version === '2.0') {
          setPreferences(parsed);
          setShowBanner(false);
          return;
        }
      }
      // If not stored or expired, show banner
      setShowBanner(true);
    } catch {
      setShowBanner(true);
    }
  }, []);

  // Global window listener so clicking "Gestion des cookies" in footer reopens the modal
  useEffect(() => {
    const handleOpen = () => {
      setShowModal(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpen);
    (window as any).openCookieConsent = handleOpen;

    return () => {
      window.removeEventListener('open-cookie-preferences', handleOpen);
      delete (window as any).openCookieConsent;
    };
  }, []);

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
      timestamp: Date.now(),
      version: '2.0',
    });
  };

  const handleRefuseAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      timestamp: Date.now(),
      version: '2.0',
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!mounted) return null;

  return (
    <>
      {/* 1. Main CNIL Banner (Bottom bar) */}
      {showBanner && !showModal && (
        <div
          role="region"
          aria-label="Consentement aux cookies"
          className="fixed bottom-0 left-0 right-0 z-[999] p-3 sm:p-5 animate-in fade-in slide-in-from-bottom duration-300 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#0c0c0be6] backdrop-blur-2xl border border-[#272725] p-5 sm:p-6 shadow-[0_12px_45px_rgba(0,0,0,0.85)] pointer-events-auto">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Text & Explanations */}
              <div className="flex items-start gap-3.5 max-w-3xl">
                <div className="w-10 h-10 rounded-xl bg-[#171714] border border-[#2d2d2a] flex items-center justify-center shrink-0 mt-0.5" style={{ color: 'var(--accent)' }}>
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Respect de votre vie privée & Cookies
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171714] border border-[#2b2b27]" style={{ color: 'var(--accent)' }}>
                      Conforme CNIL
                    </span>
                  </div>
                  <p className="text-xs text-[#a3a3a3] leading-relaxed">
                    PIXIATECH utilise des cookies nécessaires au fonctionnement du site (panier, sécurité). Avec votre accord, nous utilisons également des traceurs de mesure d'audience et de personnalisation pour améliorer nos services. Vous pouvez accepter, refuser ou personnaliser vos choix à tout moment.
                  </p>
                  <div className="text-[11px] pt-0.5">
                    <Link
                      href="/gestion-cookies"
                      className="hover:underline font-mono inline-flex items-center gap-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      <span>Consulter notre politique de gestion des cookies</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action Buttons with CNIL Equal Ease */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleRefuseAll}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#333330] hover:border-[#666] bg-[#141412] hover:bg-[#1c1c19] text-[#e0ded9] text-xs font-semibold tracking-wider transition-all cursor-pointer whitespace-nowrap"
                >
                  Continuer sans accepter
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#333330] hover:border-[#666] bg-[#141412] hover:bg-[#1c1c19] text-[#e0ded9] text-xs font-semibold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Personnaliser</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[#0a0a09] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal for Customization (Detailed categories) */}
      {showModal && (
        <PreferencesShell isMobile={isMobile} onClose={() => setShowModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0c0c0b] border border-[#272725] text-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#171714] border border-[#2b2b27] flex items-center justify-center" style={{ color: 'var(--accent)' }}>
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Gestion de vos préférences cookies</h3>
                  <p className="text-xs text-[#7a7a76]">Conformité CNIL & Règlement Général sur la Protection des Données (RGPD)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7a7a76] hover:text-white hover:bg-[#1a1a18] transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body / Categories */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <p className="text-[#a3a3a3] leading-relaxed">
                Vous avez le plein contrôle sur les traceurs déposés lors de votre navigation. Vous pouvez activer ou désactiver les finalités ci-dessous. Vos choix seront mémorisés pendant une durée de 6 mois.
              </p>

              {/* Category 1: Strictly Necessary */}
              <div className="p-4 rounded-xl bg-[#121210] border border-[#1f1f1f] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Cookies Strictement Nécessaires</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                      Toujours actif
                    </span>
                  </div>
                  <p className="text-[#8a8880] leading-relaxed">
                    Indispensables au bon fonctionnement du site : navigation sécurisée, persistance du panier d'achat, accès à votre compte client et équilibrage serveur. Ils ne peuvent être désactivés.
                  </p>
                </div>
                <div className="text-[#7a7a76] shrink-0 pt-1" title="Obligatoire" style={{ color: 'var(--accent)' }}>
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {/* Category 2: Audience Measurement / Analytics */}
              <div className="p-4 rounded-xl bg-[#121210] border border-[#1f1f1f] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white">Mesure d’Audience & Statistiques</span>
                  <p className="text-[#8a8880] leading-relaxed">
                    Nous permettent d'analyser anonymement les volumes de visites, les pages consultées et la performance d'affichage afin d'améliorer la rapidité et la pertinence de nos contenus.
                  </p>
                </div>
                <AccentToggle
                  checked={preferences.analytics}
                  onChange={(v) => setPreferences((prev) => ({ ...prev, analytics: v }))}
                />
              </div>

              {/* Category 3: Functionality & Preferences */}
              <div className="p-4 rounded-xl bg-[#121210] border border-[#1f1f1f] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white">Fonctionnalités & Préférences</span>
                  <p className="text-[#8a8880] leading-relaxed">
                    Conservent vos paramètres personnalisés tels que la sélection de langue (FR/EN), l'affichage des devises et vos préférences d'interface.
                  </p>
                </div>
                <AccentToggle
                  checked={preferences.functional}
                  onChange={(v) => setPreferences((prev) => ({ ...prev, functional: v }))}
                />
              </div>

              {/* Category 4: Marketing & Retargeting */}
              <div className="p-4 rounded-xl bg-[#121210] border border-[#1f1f1f] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white">Marketing & Réseaux Sociaux</span>
                  <p className="text-[#8a8880] leading-relaxed">
                    Permettent d'afficher des suggestions de matériel LED adaptées à vos projets professionnels sur d'autres plateformes et de faciliter le partage sur les réseaux.
                  </p>
                </div>
                <AccentToggle
                  checked={preferences.marketing}
                  onChange={(v) => setPreferences((prev) => ({ ...prev, marketing: v }))}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-[#1f1f1f] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-[#080808]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefuseAll}
                  className="px-3.5 py-2 rounded-lg border border-[#2b2b28] hover:border-[#555] text-[#a3a3a3] hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Tout refuser
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-3.5 py-2 rounded-lg border border-[#2b2b28] hover:border-[#555] text-[#a3a3a3] hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Tout accepter
                </button>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                className="w-full sm:w-auto px-5 py-2 rounded-xl text-[#0a0a09] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
              >
                Enregistrer mes préférences
              </button>
            </div>
          </div>
        </PreferencesShell>
      )}

      {/* 3. Small Floating Trigger in bottom-left to reopen preferences anytime */}
      {!showBanner && !showModal && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 h-11 w-11 rounded-full bg-[#11110f]/90 hover:bg-[#1a1a17] text-[#a3a3a3] border border-[#272725] backdrop-blur-md shadow-lg flex items-center justify-center transition-all cursor-pointer group"
          style={{ '--hover-color': 'var(--accent)' } as React.CSSProperties}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--accent-border)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '';
            e.currentTarget.style.borderColor = '';
          }}
          title="Gérer les cookies & vie privée"
          aria-label="Gérer les cookies & vie privée"
        >
          <Cookie className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </>
  );
}
