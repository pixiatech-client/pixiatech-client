'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  Eye,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AutoResponderConfig } from '@/lib/site-web/types';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_TEXTAREA,
} from './ContactAdminTabs';

const DEFAULT_FORM: AutoResponderConfig = {
  enabled: false,
  subject: 'Nous avons bien reçu votre demande – Pixiatech',
  template: `Bonjour {{client_name}},

Nous vous remercions d'avoir contacté Pixiatech.

Nous avons bien reçu votre demande et nous vous confirmons sa bonne réception.

Un conseiller de notre équipe prendra contact avec vous dans un délai maximum de 48 heures ouvrées.

Nous vous remercions pour votre confiance.

Cordialement,

L'équipe Pixiatech`,
};

interface AutoResponderTabProps {
  refreshToken: number;
}

export function AutoResponderTab({ refreshToken }: AutoResponderTabProps) {
  const [form, setForm] = useState<AutoResponderConfig>(DEFAULT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/site-web/contact/autoresponder', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success || !json.data) {
        setError(json?.error || json?.message || 'Impossible de charger la configuration.');
        return;
      }
      setForm({
        enabled: Boolean(json.data.enabled),
        subject: json.data.subject || DEFAULT_FORM.subject,
        template: json.data.template || DEFAULT_FORM.template,
        updatedAt: json.data.updatedAt,
      });
    } catch (err) {
      setError((err as Error).message || 'Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessSaved(false);

    try {
      const res = await fetch('/api/site-web/contact/autoresponder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error || json?.message || 'Erreur lors de la sauvegarde.');
        toast.error('Erreur lors de la sauvegarde.');
        return;
      }

      setSuccessSaved(true);
      toast.success('Répondeur automatique enregistré.');
      setTimeout(() => setSuccessSaved(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Erreur de communication avec le serveur.');
      toast.error('Erreur de communication.');
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setForm((prev) => ({
      ...prev,
      template: prev.template + variable,
    }));
  };

  // Aperçu dynamique simulé
  const previewSubject = (form.subject || '')
    .replace(/\{\{\s*client_name\s*\}\}/gi, 'Jean Dupont')
    .replace(/\{\{\s*client_email\s*\}\}/gi, 'jean.dupont@entreprise.fr')
    .replace(/\{\{\s*subject\s*\}\}/gi, 'Devis Écran Vitrine');

  const previewBody = (form.template || '')
    .replace(/\{\{\s*client_name\s*\}\}/gi, 'Jean Dupont')
    .replace(/\{\{\s*client_email\s*\}\}/gi, 'jean.dupont@entreprise.fr')
    .replace(/\{\{\s*subject\s*\}\}/gi, 'Devis Écran Vitrine');

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={load}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulaire de configuration */}
          <div className={`${CARD} lg:col-span-7 p-5 sm:p-6 space-y-6`}>
            {/* Entête avec switch d'activation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--ui-accent-rgb),0.1)] border border-[rgba(var(--ui-accent-rgb),0.2)] flex items-center justify-center text-[color:var(--ui-accent)] shrink-0 mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    Accusé de réception automatique
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Envoie un email immédiat au client dès qu&apos;il valide le formulaire de contact.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, enabled: !p.enabled }))}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  form.enabled
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500'
                }`}
              >
                {form.enabled ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                    <span>Répondeur Activé</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-neutral-400" />
                    <span>Répondeur Désactivé</span>
                  </>
                )}
              </button>
            </div>

            {/* Objet du mail */}
            <div className="space-y-1.5">
              <label className={FIELD_LABEL}>Objet du mail automatique</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className={FIELD_INPUT}
                placeholder="Nous avons bien reçu votre demande – Pixiatech"
              />
              <p className="text-[11px] text-neutral-400">
                Vous pouvez inclure des variables dynamiques comme {'{{subject}}'} ou {'{{client_name}}'}.
              </p>
            </div>

            {/* Modèle de message */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className={FIELD_LABEL}>Modèle du message</label>

                {/* Variables dynamiques cliquables */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-400 font-semibold mr-1">Variables :</span>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{client_name}}')}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[rgba(var(--ui-accent-rgb),0.1)] hover:bg-[rgba(var(--ui-accent-rgb),0.2)] text-[color:var(--ui-accent)] border border-[rgba(var(--ui-accent-rgb),0.3)] transition-colors cursor-pointer"
                    title="Insère le nom complet du client"
                  >
                    + {'{{client_name}}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{client_email}}')}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors cursor-pointer"
                    title="Insère l'adresse email du client"
                  >
                    + {'{{client_email}}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{{subject}}')}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-colors cursor-pointer"
                    title="Insère l'objet saisi par le client"
                  >
                    + {'{{subject}}'}
                  </button>
                </div>
              </div>

              <textarea
                value={form.template}
                onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))}
                rows={12}
                className={FIELD_TEXTAREA}
                placeholder="Rédigez le message envoyé au client…"
              />
            </div>

            {/* Pied de formulaire avec bouton enregistrer */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-white/10">
              <div className="text-[11px] text-neutral-400">
                {form.updatedAt ? (
                  <span>Dernière mise à jour le {new Date(form.updatedAt).toLocaleString('fr-FR')}</span>
                ) : (
                  <span>Configuration prête à enregistrer</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className={BTN_PRIMARY}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enregistrement…</span>
                  </>
                ) : successSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prévisualisation en direct */}
          <div className={`${CARD} lg:col-span-5 p-5 sm:p-6 space-y-4`}>
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
              <Eye className="w-4 h-4 text-[color:var(--ui-accent)]" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Aperçu client en direct
              </h3>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Voici exactement l&apos;email que recevra votre client dans sa boîte de réception avec
              les variables simulées :
            </p>

            {/* Mock client inbox preview */}
            <div className="rounded-xl bg-[#0c0d12] border border-[#1e293b] p-4 text-white space-y-3 shadow-lg">
              <div className="border-b border-[#1e293b] pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[rgba(var(--ui-accent-rgb),0.1)] text-[color:var(--ui-accent)] px-2 py-0.5 rounded border border-[rgba(var(--ui-accent-rgb),0.3)]">
                    PIXIATECH
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">À l&apos;instant</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2 leading-tight">
                  {previewSubject || 'Sans objet'}
                </h4>
                <p className="text-[10px] text-neutral-400 mt-1">
                  À : <span className="font-mono text-neutral-300">jean.dupont@entreprise.fr</span>
                </p>
              </div>

              <div className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed py-2 min-h-[160px]">
                {previewBody || 'Aucun message rédigé.'}
              </div>

              <div className="border-t border-[#1e293b] pt-3 text-[10px] text-neutral-500 text-center">
                PIXIATECH — Solutions d&apos;affichage dynamique & murs LED • pixiatech.com
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[color:var(--ui-accent)] shrink-0 mt-0.5" />
              <span>
                Cet accusé de réception rassure immédiatement vos prospects avant que votre équipe ne
                prenne le relais.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
