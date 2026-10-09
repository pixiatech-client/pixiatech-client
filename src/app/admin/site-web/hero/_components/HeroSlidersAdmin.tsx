'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, RefreshCw, Loader2, Eye, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCms } from '@/lib/site-web/cms-context';
import type { CmsSectionHero } from '@/lib/site-web/cms-types';

/**
 * Module « Hero principal » du back-office PixiaTech Web.
 *
 * Rend les 3 sliders du Hero du site public modifiables et persistants :
 *  - l'image choisie est téléversée dans Firebase Storage (site/hero/**
 *    via /api/site-web/hero-image, admin uniquement, URL vérifiée) ;
 *  - la référence (URL) est enregistrée dans la section `hero` de la page
 *    `home` du CMS site-web (PUT /api/site-web/pages/home, admin) ;
 *  - chaque slider est indépendant, l'ancienne image reste en place tant
 *    que la nouvelle n'a pas été validée et publiée.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CARD =
  'bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-sm';
const BTN_PRIMARY =
  'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38E044] hover:bg-[#2fcb3c] text-black text-xs font-extrabold transition-all cursor-pointer shadow-[0_0_16px_rgba(56,224,68,0.35)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed';
const BTN_SECONDARY =
  'flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
const BTN_GHOST =
  'flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-bold border border-neutral-200 dark:border-white/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

/** Téléversement vers /api/site-web/hero-image avec progression réelle (XHR). */
function uploadHeroImage(
  file: File,
  slider: number,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/site-web/hero-image');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.responseType = 'json';
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 90));
        }
      };
      xhr.onerror = () => reject(new Error('Échec du téléversement.'));
      xhr.onabort = () => reject(new Error('Téléversement annulé.'));
      xhr.onload = () => {
        const data = xhr.response as { success?: boolean; url?: string; error?: string } | null;
        if (xhr.status >= 200 && xhr.status < 300 && data?.success && data.url) {
          onProgress(100);
          resolve(data.url);
        } else {
          reject(new Error(data?.error || `Échec du téléversement.`));
        }
      };
      xhr.send(JSON.stringify({ image: dataUrl, slider }));
    };
    reader.readAsDataURL(file);
  });
}

interface SliderCardProps {
  index: 1 | 2 | 3;
  title: string;
  currentUrl: string;
  currentRef: string;
  onSave: (slider: number, url: string) => Promise<boolean>;
}

function SliderCard({ index, title, currentUrl, currentRef, onSave }: SliderCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading'>('idle');
  const [progress, setProgress] = useState(0);

  // Révoque l'aperçu temporaire quand on repart.
  useEffect(() => {
    return () => {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    };
  }, [pendingUrl]);

  const pickFile = (selected: File | null) => {
    if (!selected) return;
    if (!ALLOWED_TYPES.has(selected.type)) {
      toast.error('Format non pris en charge. Utilisez un fichier JPG, PNG ou WEBP.');
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast.error('Image trop volumineuse (maximum 5 Mo).');
      return;
    }
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    const url = URL.createObjectURL(selected);
    setFile(selected);
    setPendingUrl(url);
    setProgress(0);
  };

  const cancelPending = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setFile(null);
    setPendingUrl(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const publish = async () => {
    if (!file) return;
    setPhase('uploading');
    setProgress(2);
    try {
      const url = await uploadHeroImage(file, index, setProgress);
      const saved = await onSave(index, url);
      if (!saved) {
        throw new Error("L'image est bien téléversée mais la publication de la référence a échoué. L'ancienne image est conservée.");
      }
      toast.success(`Slider ${index} publié sur le site public.`);
      cancelPending();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Erreur lors de la mise en ligne.');
      setPhase('idle');
    }
  };

  const preview = pendingUrl ?? currentUrl;
  const className = `w-full h-full object-cover ${phase === 'uploading' ? 'opacity-40' : ''}`;

  return (
    <div className={`${CARD} overflow-hidden flex flex-col`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono font-extrabold bg-neutral-900 dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full">
            SLIDER {index}
          </span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">{title}</span>
        </div>
        {pendingUrl && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            aperçu local
          </span>
        )}
      </div>

      {/* Aperçu (16:9, comme le Hero) */}
      <div className="relative aspect-video bg-neutral-950 overflow-hidden">
        <img src={preview} alt={`Slider ${index}`} className={className} />
        {phase === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-xs font-bold">Envoi en cours… {progress}%</p>
            <div className="w-2/3 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-[#38E044] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Référence actuelle */}
      <div className="px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
          Image actuelle
        </p>
        <p className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 break-all leading-relaxed">
          {currentRef}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-wrap items-center gap-2 px-4 py-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
        />
        {pendingUrl ? (
          <>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={publish}
              disabled={phase === 'uploading'}
            >
              <Save className="w-3.5 h-3.5" />
              {phase === 'uploading' ? 'Envoi…' : 'Enregistrer et publier'}
            </button>
            <button
              type="button"
              className={BTN_GHOST}
              onClick={cancelPending}
              disabled={phase === 'uploading'}
            >
              <X className="w-3.5 h-3.5" />
              Annuler
            </button>
          </>
        ) : (
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Modifier la photo
          </button>
        )}
        <button
          type="button"
          className={BTN_GHOST}
          onClick={() => window.open(preview, '_blank', 'noopener,noreferrer')}
          disabled={phase === 'uploading'}
        >
          <Eye className="w-3.5 h-3.5" />
          Prévisualiser
        </button>
      </div>
    </div>
  );
}

export default function HeroSlidersAdmin() {
  const { pages, updateNestedField, saveCurrentPage, saveStatus, restorePageFromServer, isAdmin, adminChecked } = useCms();

  const hero = useMemo<Partial<CmsSectionHero>>(
    () => (pages['home']?.sections as Record<string, CmsSectionHero> | undefined)?.hero ?? {},
    [pages]
  );

  const sliders = useMemo(() => {
    const slide1 = hero.slideImage1 || hero.primaryImage || hero.heroImage || '/uploads/site/hero-1.jpg';
    return [
      { index: 1 as const, title: 'Image de fond principale', currentUrl: slide1, currentRef: hero.slideImage1 || hero.primaryImage || hero.heroImage || '/uploads/site/hero-1.jpg' },
      { index: 2 as const, title: 'Image de fond secondaire', currentUrl: hero.slideImage2 || '/uploads/site/hero-2.jpg', currentRef: hero.slideImage2 || '/uploads/site/hero-2.jpg' },
      { index: 3 as const, title: 'Image de fond tertiaire', currentUrl: hero.slideImage3 || '/uploads/site/hero-3.jpg', currentRef: hero.slideImage3 || '/uploads/site/hero-3.jpg' },
    ];
  }, [hero]);

  const handleSave = useCallback(
    async (slider: number, url: string) => {
      updateNestedField(['hero', `slideImage${slider}`], url);
      return saveCurrentPage();
    },
    [updateNestedField, saveCurrentPage]
  );

  if (adminChecked && !isAdmin) {
    return (
      <div className={`${CARD} rounded-3xl p-8 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400`}>
        Accès réservé aux administrateurs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau titre backoffice — même composition que les autres modules site-web. */}
      <div className="bg-[#0A0D0E] border border-neutral-800 rounded-3xl p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[#141B1E] border border-neutral-700 flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6 text-[#38E044]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono font-extrabold bg-[#38E044] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(56,224,68,0.4)]">
                BACKOFFICE
              </p>
              <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                Contenu du site · Hero principal
              </p>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold mt-1">Sliders du Hero</h1>
            <p className="text-xs text-white/50 mt-1 max-w-2xl">
              Modifiez les trois images de fond du Hero de la page d'accueil. L'image est stockée dans
              Firebase Storage et sa référence est enregistrée dans le CMS du site — l'ancienne image reste
              visible tant que la nouvelle n'est pas publiée.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-white/60">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Enregistrement…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs font-bold text-[#38E044]">Enregistré ✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-xs font-bold text-rose-400">Erreur d'enregistrement</span>
          )}
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            onClick={() => restorePageFromServer()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Cartes slider */}
      {!pages['home'] && (
        <div className={`${CARD} rounded-3xl p-8 flex items-center justify-center gap-3 text-sm text-neutral-500 dark:text-neutral-400`}>
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement du contenu du site…
        </div>
      )}
      {pages['home'] && (
        <div className="grid gap-5 lg:grid-cols-3">
          {sliders.map((slide) => (
            <SliderCard
              key={slide.index}
              index={slide.index}
              title={slide.title}
              currentUrl={slide.currentUrl}
              currentRef={slide.currentRef}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}