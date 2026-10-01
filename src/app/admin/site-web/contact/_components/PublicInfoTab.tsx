'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ContactInfo } from '@/lib/site-web/types';
import {
  BACKOFFICE_HEADER,
  BTN_PRIMARY,
  CARD,
  FIELD_INPUT,
  FIELD_LABEL,
} from './ContactAdminTabs';

/**
 * Onglet « Coordonnées publiques ».
 *
 * SOURCE DE VÉRITÉ : le document Firestore `siteWeb/contactInfo`, déjà exposé par
 * `GET/PUT /api/site-web/contact/info` et déjà consommé par la page publique
 * (`src/web/pixiatech/sections/ContactSections.tsx`). Chaque champ modifiable ici
 * est lu par cette page : aucune valeur n'est dupliquée côté front.
 */

interface PublicInfoTabProps {
  refreshToken: number;
  /** Notifié après une sauvegarde pour rafraîchir l'aperçu du bandeau. */
  onSaved?: () => void;
}

const FIELDS: {
  key: keyof ContactInfo;
  label: string;
  type?: 'text' | 'email' | 'url';
  placeholder?: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'companyName', label: 'Nom de l’entreprise', placeholder: 'PIXIATECH', icon: Building2 },
  {
    key: 'tagline',
    label: 'Spécialisation',
    placeholder: "Solutions d'affichage dynamique, murs d'images LED",
    icon: ShieldCheck,
  },
  { key: 'address', label: 'Adresse', placeholder: '5 Rue la fontaine', icon: MapPin },
  { key: 'postalCode', label: 'Code postal', placeholder: '93400', icon: MapPin },
  { key: 'city', label: 'Ville', placeholder: 'Saint-Ouen-sur-Seine', icon: MapPin },
  { key: 'country', label: 'Pays', placeholder: 'France', icon: Globe },
  {
    key: 'primaryEmail',
    label: 'Email principal',
    type: 'email',
    placeholder: 'contact@pixiatech.com',
    icon: Mail,
  },
  {
    key: 'supportEmail',
    label: 'Email support',
    type: 'email',
    placeholder: 'support@pixiatech.com',
    icon: Mail,
  },
  { key: 'phone1', label: 'Téléphone', placeholder: '+33 7 56 81 66 26', icon: Phone },
  { key: 'phone2', label: 'Téléphone secondaire', placeholder: '+33 7 71 59 31 66', icon: Phone },
  {
    key: 'whatsappNumber',
    label: 'WhatsApp',
    placeholder: '+33756816626',
    hint: 'Indicatif international, avec ou sans « + ».',
    icon: MessageCircle,
  },
  {
    key: 'workingHours',
    label: 'Horaires',
    placeholder: 'Lundi au vendredi : 09:00 - 18:00',
    icon: Clock,
  },
  {
    key: 'responseTimeCommitment',
    label: 'Engagement de réponse',
    placeholder: 'Réponse sous 2 heures ouvrées',
    hint: 'Affiché sur le bandeau du formulaire public.',
    icon: Clock,
  },
  {
    key: 'googleMapsUrl',
    label: 'Lien Google Maps',
    type: 'url',
    placeholder: 'https://www.google.com/maps/search/?api=1&query=…',
    hint: 'Laisser vide pour générer le lien depuis l’adresse ci-dessus.',
    icon: MapPin,
  },
];

export function PublicInfoTab({ refreshToken, onSaved }: PublicInfoTabProps) {
  const [form, setForm] = useState<ContactInfo | null>(null);
  const [saved, setSaved] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/site-web/contact/info', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success || !json.data) {
        setError(json?.error || json?.message || 'Réponse inattendue du serveur.');
        return;
      }
      const data = json.data as ContactInfo;
      setForm(data);
      setSaved(data);
    } catch (err) {
      setError((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const set = (key: keyof ContactInfo, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const hasUnsavedChanges = form && saved && JSON.stringify(form) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-web/contact/info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        toast.error(json?.error || json?.message || 'Erreur lors de l’enregistrement.');
        return;
      }
      const data = (json.data as ContactInfo) ?? form;
      setForm(data);
      setSaved(data);
      toast.success('Coordonnées enregistrées — la page Contact publique est à jour.');
      onSaved?.();
    } catch (err) {
      toast.error((err as Error).message || 'Impossible de joindre le serveur.');
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => {
    if (saved) setForm(saved);
    toast('Modifications abandonnées.', { icon: <Check className="w-3.5 h-3.5" /> });
  };

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

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

      <div className={`bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white ${BACKOFFICE_HEADER}`}>
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight">Coordonnées publiques</h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Ces valeurs sont enregistrées dans <span className="font-mono">siteWeb/contactInfo</span>{' '}
              et lues directement par la page Contact publique. Aucun texte n’est codé en dur côté
              front.
            </p>
          </div>
        </div>
        <a
          href="/web/contact"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#38E044]" />
          <span>Voir la page publique</span>
        </a>
      </div>

      <div className={`${CARD} p-5 sm:p-6 space-y-5`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, type = 'text', placeholder, hint, icon: Icon }) => (
            <div key={key}>
              <label htmlFor={`contact-${key}`} className={`${FIELD_LABEL} flex items-center gap-1.5`}>
                <Icon className="w-3 h-3 text-neutral-400" />
                {label}
              </label>
              <input
                id={`contact-${key}`}
                type={type}
                placeholder={placeholder}
                value={form[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                className={`mt-1.5 ${FIELD_INPUT}`}
              />
              {hint && <p className="mt-1.5 text-[11px] text-neutral-400">{hint}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200/70 dark:border-white/10">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Les valeurs sont appliquées immédiatement sur la page Contact publique après
            enregistrement.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={BTN_PRIMARY}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}