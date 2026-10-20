'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Globe, Save, Loader2, ShieldCheck, RefreshCw, Info } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';
import { updateSettings } from '@/app/admin/actions';
import type { Settings as AppSettings } from '@/lib/types';
import {
  DEFAULT_SITE_TITLE,
  DEFAULT_SITE_DESCRIPTION,
} from '@/lib/site-identity';
import {
  BACKOFFICE_HEADER,
  BACKOFFICE_BADGE,
  CARD,
  FIELD_LABEL,
  FIELD_INPUT,
  FIELD_TEXTAREA,
  BTN_PRIMARY,
} from '../../contact/_components/ContactAdminTabs';

/**
 * Paramètres généraux du site public, dans l'espace PIXIATECH SITE WEB.
 *
 * UI : langage visuel partagé avec les autres modules site-web (bandeau noir
 * `BACKOFFICE`, cartes blanches, boutons verts `#38E044`, champs `rounded-xl`).
 * Les classes proviennent des constantes partagées (`ContactAdminTabs`), elles
 * mêmes copiées à l'identique du module Produits — aucune nouvelle palette.
 *
 * Fonctionnalité : réutilise STRICTEMENT le mécanisme existant :
 *  - même server action `updateSettings` (doc Firestore `settings/main`, merge) ;
 *  - mêmes champs (`seoTitle`, `seoDescription`) lus par la page d'accueil
 *    marketing (`src/app/web/layout.tsx`) ;
 *  - mêmes règles de repli (champs vides → métadonnées par défaut du site).
 * Aucune deuxième source de vérité n'est créée.
 */

const translatedStringSchema = z.object({
  fr: z.string().optional(),
  en: z.string().optional(),
});

// Valeurs par défaut affichées lorsque les champs SEO sont vides : les champs
// sont PRÉ-REMPLIS avec ces valeurs à l'ouverture (l'admin peut donc éditer
// directement le texte actuellement en ligne), et elles servent aussi de
// `placeholder` après effacement. Source unique : `src/lib/site-identity.ts`,
// également consommée par `src/app/web/layout.tsx`.
const FALLBACK_SEO_TITLE_FR = DEFAULT_SITE_TITLE;
const FALLBACK_SEO_TITLE_EN = DEFAULT_SITE_TITLE;
const FALLBACK_SEO_DESCRIPTION_FR = DEFAULT_SITE_DESCRIPTION;
const FALLBACK_SEO_DESCRIPTION_EN = DEFAULT_SITE_DESCRIPTION;

// Longueurs indicatives recommandées par Google (avertissement, jamais bloquant).
const SEO_TITLE_MAX = 60;
const SEO_TITLE_SOFT = 70;
const SEO_DESCRIPTION_MAX = 160;

const settingsSchema = z.object({
  seoTitle: translatedStringSchema.optional(),
  seoDescription: translatedStringSchema.optional(),
});

type FormValues = z.infer<typeof settingsSchema>;

interface SiteWebSettingsModuleProps {
  initialSettings: AppSettings;
}

/** Barre de compteur de caractères avec seuil visible (vert → ambre → rouge). */
function CharMeter({ value, max, soft }: { value: number; max: number; soft?: number }) {
  const hard = soft ?? max;
  const ratio = Math.min(100, Math.round((value / hard) * 100));
  const tone = value > max ? 'bg-rose-500' : value > hard ? 'bg-amber-500' : 'bg-[#38E044]';
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-neutral-100 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${ratio}%` }} />
      </div>
      <span
        className={`text-[11px] font-mono tabular-nums ${
          value > max
            ? 'text-rose-600 dark:text-rose-400 font-bold'
            : value > hard
              ? 'text-amber-600 dark:text-amber-400 font-semibold'
              : 'text-neutral-400'
        }`}
      >
        {value}/{max}
      </span>
    </div>
  );
}

export function SiteWebSettingsModule({ initialSettings }: SiteWebSettingsModuleProps) {
  const { t } = useAdminT();

  const defaultValues = useMemo<FormValues>(
    () => ({
      // Pré-remplissage : si aucune valeur n'est enregistrée (ou si la valeur
      // enregistrée est vide), on injecte la valeur de repli réellement servie
      // sur le site, pour que l'admin puisse éditer le texte en ligne (au lieu
      // de le voir seulement en gris pâle). `?.trim() ||` couvre le cas d'une
      // chaîne vide déjà stockée (que `??` ne rattraperait pas).
      seoTitle: {
        fr: initialSettings.seoTitle?.fr?.trim() || FALLBACK_SEO_TITLE_FR,
        en: initialSettings.seoTitle?.en?.trim() || FALLBACK_SEO_TITLE_EN,
      },
      seoDescription: {
        fr: initialSettings.seoDescription?.fr?.trim() || FALLBACK_SEO_DESCRIPTION_FR,
        en: initialSettings.seoDescription?.en?.trim() || FALLBACK_SEO_DESCRIPTION_EN,
      },
    }),
    [initialSettings]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  // Si les paramètres serveur changent (rechargement), on resynchronise.
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const [isSaving, setIsSaving] = useState(false);

  const titleFr = form.watch('seoTitle.fr') || '';
  const titleEn = form.watch('seoTitle.en') || '';
  const descFr = form.watch('seoDescription.fr') || '';
  const descEn = form.watch('seoDescription.en') || '';

  // Indicateur « modifications non enregistrées » (feedback clair demandé).
  const isDirty = form.formState.isDirty;

  const handleSave = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error(t('Validation error'), {
        description: t('Please check the form for invalid values.'),
      });
      return;
    }

    const values = form.getValues();
    setIsSaving(true);
    // `updateSettings` fusionne (merge) : les autres clés de `settings/main`
    // sont préservées, seuls les champs SEO sont écrits.
    const result = await updateSettings({
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
    });
    setIsSaving(false);

    if (result.success) {
      form.reset(values);
      toast.success(t('Settings saved'), {
        description: t('The site identity and SEO settings have been updated.'),
      });
    } else {
      toast.error(t('Error'), {
        description: t('An error occurred while saving.'),
      });
    }
  };

  // Aperçu Google bilingue : une vignette FR et une vignette EN, chacune
  // reflétant la version correspondante du site (repli + repli croisé comme
  // dans `src/app/web/layout.tsx` : EN vide → titre/description FR).
  const previewFr = {
    title: titleFr.trim() || FALLBACK_SEO_TITLE_FR,
    description: descFr.trim() || FALLBACK_SEO_DESCRIPTION_FR,
  };
  const previewEn = {
    title: titleEn.trim() || titleFr.trim() || FALLBACK_SEO_TITLE_EN,
    description: descEn.trim() || descFr.trim() || FALLBACK_SEO_DESCRIPTION_EN,
  };

  return (
    <div className="space-y-6">
      {/* Bandeau titre backoffice — même composition que Produits / Contact. */}
      <div className={`bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white ${BACKOFFICE_HEADER}`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{t('General settings')}</h1>
              <span className={BACKOFFICE_BADGE}>BACKOFFICE</span>
              {isDirty && (
                <span className="text-[10px] font-mono font-extrabold bg-amber-400 text-black px-2.5 py-0.5 rounded-full">
                  {t('Unsaved changes')}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1 truncate">
              {t('Identity and SEO of the public site, used on the marketing home page.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => form.reset(defaultValues)}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title={t('Discard changes')}
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38E044]" />
            <span>{t('Cancel')}</span>
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className={BTN_PRIMARY}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? t('Saving...') : t('Save settings')}</span>
          </button>
        </div>
      </div>

      {/* Deux colonnes : champs à gauche, aperçu Google collant à droite. */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-6 min-w-0">
          {/* Carte : Titres */}
          <section className={`${CARD} p-5 sm:p-6`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              {t('Site title')}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {t('Title displayed in the browser tab and Google results.')}
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="seoTitle-fr" className={FIELD_LABEL}>
                  {t('Site title')} · FR
                </label>
                <input
                  id="seoTitle-fr"
                  placeholder={FALLBACK_SEO_TITLE_FR}
                  className={`${FIELD_INPUT} mt-2`}
                  {...form.register('seoTitle.fr')}
                />
                <CharMeter value={titleFr.length} max={SEO_TITLE_SOFT} soft={SEO_TITLE_MAX} />
              </div>
              <div>
                <label htmlFor="seoTitle-en" className={FIELD_LABEL}>
                  {t('Site title')} · EN
                </label>
                <input
                  id="seoTitle-en"
                  placeholder={FALLBACK_SEO_TITLE_EN}
                  className={`${FIELD_INPUT} mt-2`}
                  {...form.register('seoTitle.en')}
                />
                <CharMeter value={titleEn.length} max={SEO_TITLE_SOFT} soft={SEO_TITLE_MAX} />
              </div>
            </div>
          </section>

          {/* Carte : Descriptions */}
          <section className={`${CARD} p-5 sm:p-6`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-white">
              {t('Site description')}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {t('Short description shown under the title in Google results.')}
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="seoDescription-fr" className={FIELD_LABEL}>
                  {t('Site description')} · FR
                </label>
                <textarea
                  id="seoDescription-fr"
                  rows={4}
                  placeholder={FALLBACK_SEO_DESCRIPTION_FR}
                  className={`${FIELD_TEXTAREA} mt-2`}
                  {...form.register('seoDescription.fr')}
                />
                <CharMeter value={descFr.length} max={SEO_DESCRIPTION_MAX} />
              </div>
              <div>
                <label htmlFor="seoDescription-en" className={FIELD_LABEL}>
                  {t('Site description')} · EN
                </label>
                <textarea
                  id="seoDescription-en"
                  rows={4}
                  placeholder={FALLBACK_SEO_DESCRIPTION_EN}
                  className={`${FIELD_TEXTAREA} mt-2`}
                  {...form.register('seoDescription.en')}
                />
                <CharMeter value={descEn.length} max={SEO_DESCRIPTION_MAX} />
              </div>
            </div>
          </section>

          {/* Note de repli + avertissement Google */}
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] p-4">
            <p className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <Info className="w-3.5 h-3.5 mt-0.5 text-neutral-400 flex-shrink-0" />
              <span>
                {t('Empty fields fall back to the current default values.')}
              </span>
            </p>
            <p className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
              <span>
                {t('The display of this text in Google depends on Google and its crawl of the site: changes are not shown instantly.')}
              </span>
            </p>
          </div>
        </div>

        {/* Colonne droite : aperçus Google FR + EN collants, mis à jour en direct. */}
        <aside className="lg:sticky lg:top-6 space-y-3">
          <div className={`${CARD} p-4`}>
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-3">
              {t('Google preview')}
            </p>

            <div className="space-y-3">
              {/* Vignette FR */}
              <div>
                <span className="text-[10px] font-mono font-extrabold bg-neutral-900 dark:bg-white/10 text-white dark:text-neutral-200 px-2 py-0.5 rounded">
                  FR
                </span>
                <div className="mt-2 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-950 p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-neutral-500">
                      P
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate">PixiaTech</p>
                      <p className="text-[11px] text-neutral-400 leading-tight truncate">https://pixiatech.com</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] leading-snug line-clamp-2">
                    {previewFr.title}
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                    {previewFr.description}
                  </p>
                </div>
              </div>

              {/* Vignette EN */}
              <div>
                <span className="text-[10px] font-mono font-extrabold bg-neutral-900 dark:bg-white/10 text-white dark:text-neutral-200 px-2 py-0.5 rounded">
                  EN
                </span>
                <div className="mt-2 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-zinc-950 p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-neutral-500">
                      P
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight truncate">PixiaTech</p>
                      <p className="text-[11px] text-neutral-400 leading-tight truncate">https://pixiatech.com/en</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[16px] font-medium text-[#1a0dab] dark:text-[#8ab4f8] leading-snug line-clamp-2">
                    {previewEn.title}
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
                    {previewEn.description}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-neutral-400">
              {t('Google preview of the French and English versions of the home page.')}
            </p>
          </div>

          {/* Bouton d'enregistrement rappelé sous l'aperçu (zones longues). */}
          <button type="button" onClick={handleSave} disabled={isSaving} className={`${BTN_PRIMARY} w-full justify-center`}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? t('Saving...') : t('Save settings')}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
