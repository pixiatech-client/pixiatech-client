'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Send,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SmtpConfig } from '@/lib/site-web/types';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  FIELD_INPUT,
  FIELD_LABEL,
} from './ContactAdminTabs';

/**
 * Onglet « SMTP & envoi ».
 *
 * Refonte d'interface uniquement : la logique métier est celle déjà en place
 * (`GET/PUT /api/site-web/contact/settings` et `POST /api/site-web/contact/test-smtp`),
 * le transporteur reste `src/lib/site-web/transport.ts` et la source de vérité
 * reste le document Firestore `siteWeb/smtp`.
 */

const SMTP_PRESETS = [
  { name: 'PixiaTech Mail (Port 465 SSL)', host: 'mail.pixiatech.com', port: 465, secure: true },
  { name: 'PixiaTech LWS Panel (Port 465 SSL)', host: 'mail89.lwspanel.com', port: 465, secure: true },
  { name: 'PixiaTech Port 587 (STARTTLS)', host: 'mail.pixiatech.com', port: 587, secure: false },
  { name: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
  { name: 'Microsoft 365', host: 'smtp.office365.com', port: 587, secure: false },
  { name: 'OVH Telecom', host: 'ssl0.ovh.net', port: 587, secure: false },
];

/** Valeur de repli : jamais de secret en dur dans le bundle navigateur. */
const EMPTY_FORM: SmtpConfig = {
  host: '',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  fromEmail: '',
  recipientEmail: '',
  enabled: true,
};

interface SmtpTabProps {
  /** Incrémenté par le bouton « Actualiser » du bandeau. */
  refreshToken: number;
}

export function SmtpTab({ refreshToken }: SmtpTabProps) {
  const [form, setForm] = useState<SmtpConfig>(EMPTY_FORM);
  const [saved, setSaved] = useState<SmtpConfig>(EMPTY_FORM);
  const [hasStoredPassword, setHasStoredPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [testRecipient, setTestRecipient] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/site-web/contact/settings', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success || !json.data) {
        setLoadError(json?.error || json?.message || 'Réponse inattendue du serveur.');
        return;
      }
      const data = json.data as SmtpConfig & { hasPassword?: boolean };
      // `pass` n'est JAMAIS renvoyé par l'API : le champ reste vide et
      // l'indicateur `hasPassword` signale qu'un mot de passe est déjà stocké.
      const next: SmtpConfig = {
        host: data.host ?? '',
        port: data.port ?? 465,
        secure: Boolean(data.secure),
        user: data.user ?? '',
        pass: '',
        fromEmail: data.fromEmail ?? '',
        recipientEmail: data.recipientEmail ?? '',
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      };
      setForm(next);
      setSaved(next);
      setHasStoredPassword(Boolean(data.hasPassword));
    } catch (err) {
      setLoadError((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const hasUnsavedChanges =
    JSON.stringify(form) !== JSON.stringify(saved) || (form.pass !== '' && form.pass !== saved.pass);

  const set = <K extends keyof SmtpConfig>(key: K, value: SmtpConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-web/contact/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Un `pass` vide ne doit pas écraser le mot de passe déjà stocké :
        // `setSmtpConfig` le gère déjà côté serveur.
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.error || json?.message || 'Erreur lors de l’enregistrement SMTP.');
        return;
      }
      const data = json.data as SmtpConfig & { hasPassword?: boolean };
      const next: SmtpConfig = { ...form, pass: '' };
      setForm(next);
      setSaved(next);
      setHasStoredPassword(Boolean(data.hasPassword) || Boolean(form.pass));
      setTestResult(null);
      toast.success('Configuration SMTP enregistrée.');
      // Le transporteur est reconstruit à chaque envoi : on relit simplement
      // la valeur canonique pour réaligner le formulaire.
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/site-web/contact/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient: testRecipient.trim() || form.recipientEmail,
          customConfig: form.pass ? form : undefined,
        }),
      });
      const json = await res.json();
      setTestResult({
        success: Boolean(json?.success),
        message: json?.message || (json?.success ? 'Connexion SMTP réussie.' : 'Échec du test SMTP.'),
      });
    } catch (err) {
      setTestResult({ success: false, message: (err as Error).message || 'Erreur réseau.' });
    } finally {
      setIsTesting(false);
    }
  };

  const applyPreset = (preset: (typeof SMTP_PRESETS)[number]) => {
    setForm((prev) => ({ ...prev, host: preset.host, port: preset.port, secure: preset.secure }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className={`${CARD} p-5 sm:p-6 space-y-5`}>
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30">
          <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
              Passerelle d’envoi utilisée par le formulaire public
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-sky-800/80 dark:text-sky-300/80">
              Ces paramètres pilotent uniquement l’envoi des demandes envoyées depuis la page
              Contact du site. Ils sont stockés dans Firestore et reconstruits à chaque envoi.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/[0.06] cursor-pointer">
          <input
            id="smtp-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => set('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 accent-[#38E044]"
          />
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Activer l’envoi SMTP des demandes reçues
          </span>
          <span className="text-[11px] text-neutral-400">
            (Sinon les messages restent consultables dans « Boîte de réception »)
          </span>
        </label>

        <div>
          <p className={`${FIELD_LABEL} mb-2`}>Pré-configurations rapides</p>
          <div className="flex flex-wrap gap-2">
            {SMTP_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-[#38E044]/60 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all cursor-pointer active:scale-95"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="smtp-host" className={FIELD_LABEL}>
              Serveur SMTP (hôte)
            </label>
            <input
              id="smtp-host"
              type="text"
              placeholder="mail.pixiatech.com"
              value={form.host}
              onChange={(e) => set('host', e.target.value)}
              className={`mt-1.5 ${FIELD_INPUT}`}
            />
          </div>
          <div>
            <label htmlFor="smtp-port" className={FIELD_LABEL}>
              Port
            </label>
            <input
              id="smtp-port"
              type="number"
              min={1}
              max={65535}
              value={form.port}
              onChange={(e) => set('port', parseInt(e.target.value, 10) || 587)}
              className={`mt-1.5 ${FIELD_INPUT}`}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            id="smtp-secure"
            type="checkbox"
            checked={form.secure}
            onChange={(e) => set('secure', e.target.checked)}
            className="h-4 w-4 mt-0.5 rounded border-neutral-300 dark:border-white/20 accent-[#38E044]"
          />
          <span className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Connexion sécurisée directe (SSL/TLS, port 465). Décochez pour STARTTLS (port 587).
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="smtp-user" className={FIELD_LABEL}>
              Identifiant SMTP
            </label>
            <input
              id="smtp-user"
              type="text"
              placeholder="contact@pixiatech.com"
              value={form.user}
              onChange={(e) => set('user', e.target.value)}
              className={`mt-1.5 ${FIELD_INPUT}`}
            />
          </div>
          <div>
            <label htmlFor="smtp-pass" className={FIELD_LABEL}>
              Mot de passe
            </label>
            <div className="relative mt-1.5">
              <input
                id="smtp-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder={hasStoredPassword ? '•••••••• (déjà enregistré)' : 'Mot de passe SMTP'}
                value={form.pass ?? ''}
                onChange={(e) => set('pass', e.target.value)}
                autoComplete="new-password"
                className={`${FIELD_INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {hasStoredPassword && !form.pass && (
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Laissez vide pour conserver le mot de passe actuellement enregistré.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="smtp-from" className={FIELD_LABEL}>
              Adresse d’expédition
            </label>
            <input
              id="smtp-from"
              type="text"
              placeholder="PIXIATECH &lt;contact@pixiatech.com&gt;"
              value={form.fromEmail}
              onChange={(e) => set('fromEmail', e.target.value)}
              className={`mt-1.5 ${FIELD_INPUT}`}
            />
          </div>
          <div>
            <label htmlFor="smtp-recipient" className={FIELD_LABEL}>
              Destinataire des formulaires
            </label>
            <input
              id="smtp-recipient"
              type="email"
              placeholder="contact@pixiatech.com"
              value={form.recipientEmail}
              onChange={(e) => set('recipientEmail', e.target.value)}
              className={`mt-1.5 ${FIELD_INPUT}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-200/70 dark:border-white/10">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={BTN_PRIMARY}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Destinataire du test (optionnel)"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className={`w-56 ${FIELD_INPUT} !py-2 !text-xs`}
            />
            <button type="button" onClick={handleTest} disabled={isTesting} className={BTN_SECONDARY}>
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38E044]" />
              ) : (
                <Send className="w-3.5 h-3.5 text-[#38E044]" />
              )}
              <span>Tester l’envoi</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-xs ${
              testResult.success
                ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                : 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {testResult.success ? 'Envoi de test réussi' : 'Échec de l’envoi de test'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`${CARD} px-5 py-4 flex items-center gap-3`}>
        <Sliders className="w-4 h-4 text-neutral-400 shrink-0" />
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Les modifications ne prennent effet qu’à l’enregistrement. Un mot de passe laissé vide
          conserve la valeur déjà enregistrée côté serveur.
        </p>
        {hasUnsavedChanges && (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
            <Check className="w-3 h-3" />
            Modifications non enregistrées
          </span>
        )}
      </div>
    </div>
  );
}