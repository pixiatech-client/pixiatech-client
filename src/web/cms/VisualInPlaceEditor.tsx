'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Image as ImageIcon, Upload, Check, X, Sparkles, Link as LinkIcon, Loader2 } from 'lucide-react';
import { findSectionKey, getSectionNode, resolveElementKey, setSelectedElement } from './section-registry';

import { FloatingElementToolbar } from './FloatingElementToolbar';
import { applyElementStyle, type ElementStyle } from './useCmsElementStyles';

type MediaKind = 'image' | 'video';

interface ImageEditState {
  element: HTMLElement;
  kind: MediaKind;
  currentSrc: string;
  alt: string;
}

/** Éléments dont le texte est directement éditable dans l'éditeur visuel. */
const EDITABLE_TEXT_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LI', 'BUTTON', 'A'];

const STOCK_LIBRARY_IMAGES = [
  { label: 'Hero 1 — Hall Architectural', src: '/uploads/site/hero-1.jpg' },
  { label: 'Hero 2 — Atrium Immersif', src: '/uploads/site/hero-2.jpg' },
  { label: 'Hero 3 — Mur Courbé Panoramique', src: '/uploads/site/hero-3.jpg' },
  { label: 'Tech — ColdLED', src: '/uploads/site/tech-coldled.jpg' },
  { label: 'Tech — SolidSkin', src: '/uploads/site/tech-solidskin.jpg' },
  { label: 'Tech — ArmorLED', src: '/uploads/site/tech-armorled.jpg' },
  { label: 'Tech — CBSF', src: '/uploads/site/tech-cbsf.jpg' },
  { label: 'Tech — Infinite Colors', src: '/uploads/site/tech-infinite.jpg' },
  { label: 'Marché — Corporate', src: '/uploads/site/market-corporate.jpg' },
  { label: 'Marché — Retail', src: '/uploads/site/market-retail.jpg' },
  { label: 'Marché — DOOH', src: '/uploads/site/market-dooh.jpg' },
  { label: 'Marché — Rental & Events', src: '/uploads/site/market-rental.jpg' },
  { label: 'Marché — XR / VP', src: '/uploads/site/market-xr.jpg' },
  { label: 'Experience Center', src: '/uploads/site/xc-bg.jpg' },
  { label: 'Projet — Shenzhen Stage', src: '/uploads/projects/how-xeron-elevates-shenzhen-happy-valleys-summer-festival-stage.jpg' },
  { label: 'Projet — Auckland Centre', src: '/uploads/projects/university-of-aucklands-hiwa-recreation-and-wellbeing-centre.jpg' },
  { label: 'Projet — UAE Production', src: '/uploads/projects/xeron-powers-up-the-uaes-state-of-the-art-production-studio.jpg' },
  { label: 'Projet — Poor Things Stage', src: '/uploads/projects/led-wall-evokes-early-cinema-effects-for-poor-things.jpg' },
];

export const VisualInPlaceEditor: React.FC = () => {
  const {
  isEditing,
  isAdmin,
  uploadMedia,
  updateSectionField,
  updateElementStyle,
  saveCurrentPage,
  setSelectedBlockId,
} = useCms();

  // State pour la modal d'édition d'image
  const [activeImageTarget, setActiveImageTarget] = useState<ImageEditState | null>(null);
  const [newImageSrc, setNewImageSrc] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'pending' | 'error' } | null>(null);

  // Éléments de survol pour l'inspection
  const hoveredElementRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, tone: 'ok' | 'pending' | 'error' = 'ok') => {
    setToast({ message: msg, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), tone === 'error' ? 6000 : 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /**
   * Persistance réelle : on n'affiche « sauvegardé » qu'après le retour positif
   * de l'API. Avant cette correction, seul l'état React + localStorage étaient
   * modifiés, d'où un message « sauvegardé » mensonger.
   */
  const persist = useCallback(
    async (label: string) => {
      showToast(`Sauvegarde de « ${label} »…`, 'pending');
      const ok = await saveCurrentPage();
      showToast(
        ok ? `✓ ${label} — sauvegardé` : `✕ ${label} — échec de la sauvegarde (serveur)`,
        ok ? 'ok' : 'error'
      );
      return ok;
    },
    [saveCurrentPage, showToast]
  );

  const openImageModalForElement = useCallback((el: HTMLElement) => {
    const kind: MediaKind = el.tagName === 'VIDEO' ? 'video' : 'image';
    setActiveImageTarget({
      element: el,
      kind,
      currentSrc: el.getAttribute('src') || '',
      alt: (el as HTMLImageElement).alt || '',
    });
    setNewImageSrc(el.getAttribute('src') || '');
  }, []);

  useEffect(() => {
    if (!isEditing || !isAdmin) return;

    // La clé de section vient du registre alimenté par EditableWrapper,
    // ou détection sémantique header / footer / data-cms-section.
    const getSectionKey = (el: HTMLElement): string | null => {
      const registered = findSectionKey(el);
      if (registered) return registered;
      if (el.closest('header, nav, #site-header')) return 'header';
      if (el.closest('footer, #site-footer')) return 'footer';
      return null;
    };

    // Style injecté pour le mode inspecteur
    const styleEl = document.createElement('style');
    styleEl.id = 'pixia-visual-editor-styles';
    styleEl.innerHTML = `
      .pixia-editable-text-hover {
        outline: 2px dashed #C3F910 !important;
        outline-offset: 3px !important;
        cursor: text !important;
        position: relative !important;
      }
      .pixia-el-selected {
        outline: 2px solid #C3F910 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(195, 249, 16, 0.15) !important;
      }
      .pixia-el-selected.pixia-el-media {
        outline-color: #00E5FF !important;
        box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.18) !important;
      }
      .pixia-el-selected.pixia-el-anchor {
        cursor: pointer !important;
      }
      .pixia-editable-img-hover {
        outline: 3px dashed #00E5FF !important;
        outline-offset: 3px !important;
        cursor: pointer !important;
        filter: brightness(1.08) !important;
        position: relative !important;
      }
      [contenteditable="true"]:focus {
        outline: 2px solid #C3F910 !important;
        outline-offset: 3px !important;
        background: rgba(195, 249, 16, 0.08) !important;
        box-shadow: 0 0 15px rgba(195, 249, 16, 0.3) !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Helper: Identifier si l'élément fait partie de l'interface d'administration
    const isCmsTarget = (el: HTMLElement | null): boolean => {
      if (!el) return true;
      return Boolean(
        el.closest('#admin-top-bar') ||
        el.closest('#image-edit-modal') ||
        el.closest('#backend-export-modal') ||
        el.closest('[data-cms-ui]') ||
        el.closest('aside')
      );
    };

    // 1. Mouse Over / Out
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isCmsTarget(target)) {
        return;
      }

      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        target.classList.add('pixia-editable-img-hover');
        hoveredElementRef.current = target;
      } else if (EDITABLE_TEXT_TAGS.includes(target.tagName) || target.hasAttribute('data-editable') || target.hasAttribute('data-text-key')) {
        if (target.children.length <= 3) {
          target.classList.add('pixia-editable-text-hover');
          hoveredElementRef.current = target;
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      target.classList.remove('pixia-editable-img-hover');
      target.classList.remove('pixia-editable-text-hover');
    };

    // 2. Click Handler Universel avec interception de navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || isCmsTarget(target)) {
        return;
      }

      // En mode édition : intercepter TOUT clic sur un lien, bouton ou ancre
      // pour éviter la navigation intempestive et permettre la sélection / édition (Point 5).
      const clickableParent = target.closest('a, button, [role="button"]') as HTMLElement | null;
      if (clickableParent) {
        e.preventDefault();
        e.stopPropagation();
      }

      const sectionKey = getSectionKey(target);
      if (!sectionKey) {
        // Même si pas de section officielle, si on a cliqué sur un lien ou bouton,
        // on bloque la navigation pour ne pas perdre le contexte d'édition.
        if (clickableParent) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      const sectionRoot = getSectionNode(sectionKey);
      const elementKey = resolveElementKey(target, sectionRoot);
      const isMediaTarget = target.tagName === 'IMG' || target.tagName === 'VIDEO';

      // Sélection de la section
      setSelectedBlockId(sectionKey);

      // Ancrage visuel : la barre flottante doit pointer sur un élément
      // identifiable. On nettoie l'ancienne sélection puis on marque la nouvelle.
      for (const prev of Array.from(document.querySelectorAll('.pixia-el-selected'))) {
        prev.classList.remove('pixia-el-selected', 'pixia-el-anchor', 'pixia-el-media');
      }
      target.classList.add('pixia-el-selected');
      if (target.closest('a, button, [role="button"]')) target.classList.add('pixia-el-anchor');
      if (isMediaTarget) target.classList.add('pixia-el-media');

      // Sélection de l'élément pour la toolbar flottante
      setSelectedElement({
        el: target,
        sectionKey,
        elementKey,
        kind: isMediaTarget ? 'media' : 'text',
      });

      // Cas 1: Clic sur une image ou vidéo
      if (isMediaTarget) {
        e.preventDefault();
        e.stopPropagation();
        openImageModalForElement(target);
        return;
      }

      // Cas 2: Clic sur un texte / bouton / lien
      if (
        EDITABLE_TEXT_TAGS.includes(target.tagName) ||
        target.hasAttribute('data-editable') ||
        target.hasAttribute('data-text-key')
      ) {
        if (target.isContentEditable) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        target.contentEditable = 'true';
        target.focus();
        target.classList.remove('pixia-editable-text-hover');

        const originalText = target.innerText;

        const onBlur = () => {
          target.contentEditable = 'false';
          target.removeEventListener('blur', onBlur);
          if (!target.isConnected) return;
          const newText = target.innerText;
          if (newText === originalText) return;

          const explicitKey = target.getAttribute('data-text-key');

          if (explicitKey) {
            // Clé réelle : le champ existe dans la section, on l'édite
            // directement (donc traduit par le flux FR/EN existant).
            updateSectionField(sectionKey, explicitKey, newText);
            void persist(`${sectionKey}.${explicitKey}`);
            return;
          }

          // Pas de cle declaree : on n'invente plus `text_<timestamp>`, cle que
          // rien ne relit (l'edition etait donc perdue au refresh), et on ne
          // recycle plus `title`/`description`/`cta`, partages par tous les
          // elements d'une section. Le texte part dans le sac d'elements, via la
          // primitive atomique : la lecture part du miroir synchrone, donc un
          // style deja pose par la barre contextuelle n'est pas ecrase.
          const next = updateElementStyle(sectionKey, elementKey, { text: newText });
          applyElementStyle(target, next as ElementStyle);
          void persist(`${sectionKey}._elements.${elementKey}.text`);
        };

        target.addEventListener('blur', onBlur);
      }
    };

    // 3. Désélection : Échap ou clic sur une zone neutre.
    const handleDeselectKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedElement(null);
    };

    const handleDeselectClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === document.body) setSelectedElement(null);
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleDeselectKey);
    document.addEventListener('click', handleDeselectClick);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleDeselectKey);
      document.removeEventListener('click', handleDeselectClick);
      const el = document.getElementById('pixia-visual-editor-styles');
      if (el) el.remove();
    };
  }, [isEditing, isAdmin, uploadMedia, updateSectionField, setSelectedBlockId, persist, openImageModalForElement]);

  // Appliquer le remplacement de l'image
  const handleApplyImage = async (srcToApply?: string) => {
    const finalSrc = srcToApply || newImageSrc;
    if (!activeImageTarget || !finalSrc) return;

    const el = activeImageTarget.element;
    el.setAttribute('src', finalSrc);
    if (activeImageTarget.kind === 'image') {
      (el as HTMLImageElement).src = finalSrc;
    }

    const sectionKey = findSectionKey(el);
    if (!sectionKey) {
      showToast('✕ Section non reconnue — modification non sauvegardée', 'error');
      return;
    }

    const sectionRoot = getSectionNode(sectionKey);
    const elementKey = resolveElementKey(el, sectionRoot);
    const explicitKey = el.getAttribute('data-image-key') || el.getAttribute('data-media-key');

    if (explicitKey) {
      // Clé déclarée par le composant : le champ existe réellement, on l'écrit.
      updateSectionField(sectionKey, explicitKey, finalSrc);
    } else {
      // Pas de clé déclarée : on n'écrit plus dans `image`/`heroImage`/
      // `primaryImage`/`billboardImage`. Ces champs ne sont lus que par la
      // section hero, donc sur toute autre section l'image était enregistrée
      // dans le vide puis disparaissait au refresh. On passe par le sac
      // d'éléments, réappliqué au chargement par `useCmsElementStyles`.
      const next = updateElementStyle(sectionKey, elementKey, {
        src: finalSrc,
        alt: (el as HTMLImageElement).alt || undefined,
      });
      applyElementStyle(el, next as ElementStyle);
    }
    setSelectedBlockId(sectionKey);

    setIsApplying(true);
    const ok = await persist(explicitKey ? `${sectionKey}.${explicitKey}` : `${sectionKey}._elements.${elementKey}.src`);
    setIsApplying(false);
    if (ok) {
      setActiveImageTarget(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadMedia(file);
      setNewImageSrc(url);
      await handleApplyImage(url);
    } catch (err) {
      console.error('Upload failed:', err);
      showToast('✕ Erreur lors du téléversement', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isEditing || !isAdmin) return null;

  return (
    <>
      {/* Barre contextuelle flottante dynamique liée à l'élément sélectionné */}
      <FloatingElementToolbar onOpenImageModal={openImageModalForElement} />
      {/* Toast Notification — l'état "sauvegardé" n'apparaît qu'après le
          retour positif de l'API. */}
      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[400] px-5 py-2.5 rounded-full font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200 ${
            toast.tone === 'error'
              ? 'bg-[#ff4444] text-white'
              : toast.tone === 'pending'
              ? 'bg-[#0e0e0d] text-[#C3F910] border border-[#C3F910]'
              : 'bg-[#C3F910] text-[#080808]'
          }`}
        >
          {toast.tone === 'pending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Mode Indicator Badge */}
      <div className="fixed bottom-6 right-6 z-[250] bg-[#0E0E0D]/95 backdrop-blur-md border border-[#C3F910] text-[#F5F4F0] px-4 py-2.5 rounded-full font-mono text-xs font-semibold shadow-2xl flex items-center gap-3 select-none pointer-events-auto">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C3F910] animate-pulse" />
        <span>ÉDITEUR DIRECT : CLIQUEZ SUR UN TEXTE OU UNE IMAGE</span>
      </div>

      {/* Modal Remplacer Image */}
      {activeImageTarget && (
        <div
          id="image-edit-modal"
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl bg-[#0e0e0d] border border-[#2b2b28] text-[#f5f4f0] p-6 rounded-2xl shadow-2xl font-sans max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#222220] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C3F910]/15 text-[#C3F910] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">
                    Modifier / Remplacer cette image
                  </h3>
                  <p className="text-[11px] font-mono text-[#7a7a76] m-0">
                    {activeImageTarget.currentSrc.split('/').pop() || 'Image active'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveImageTarget(null)}
                className="text-[#7a7a76] hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current & Preview Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2">
                  Image actuelle
                </label>
                <div className="h-44 rounded-xl overflow-hidden border border-[#222] bg-[#141414] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImageTarget.currentSrc}
                    alt="Actuelle"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2">
                  Nouvelle sélection
                </label>
                <div className="h-44 rounded-xl overflow-hidden border border-[#C3F910]/40 bg-[#141414] flex items-center justify-center">
                  {newImageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={newImageSrc}
                      alt="Nouvelle"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-[#555] font-mono">Aucun aperçu</span>
                  )}
                </div>
              </div>
            </div>

            {/* Input URL Directe */}
            <div className="mb-5">
              <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#C3F910]" />
                <span>URL ou chemin de l&apos;image</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageSrc}
                  onChange={(e) => setNewImageSrc(e.target.value)}
                  placeholder="/uploads/site/... ou https://..."
                  className="flex-1 bg-[#171715] border border-[#2b2b28] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 bg-[#20201d] hover:bg-[#2b2b28] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer border border-[#333]"
                >
                  <Upload className="w-3.5 h-3.5 text-[#C3F910]" />
                  <span>{isUploading ? 'Chargement...' : 'Uploader'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
              </div>
            </div>

            {/* Bibliothèque PixiaTech Sélection Rapide */}
            <div className="mb-6">
              <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C3F910]" />
                <span>Sélectionner depuis la bibliothèque PixiaTech</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-[#141413] rounded-xl border border-[#222]">
                {STOCK_LIBRARY_IMAGES.map((img) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setNewImageSrc(img.src)}
                    className={`relative rounded-lg overflow-hidden h-16 border transition-all cursor-pointer group ${
                      newImageSrc === img.src
                        ? 'border-[#C3F910] ring-2 ring-[#C3F910]/40'
                        : 'border-[#222] hover:border-[#555]'
                    }`}
                    title={img.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222220]">
              <button
                type="button"
                onClick={() => setActiveImageTarget(null)}
                className="px-4 py-2.5 text-xs font-mono text-[#8a8880] hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleApplyImage()}
                disabled={isApplying}
                className="flex items-center gap-2 bg-[#C3F910] hover:bg-[#b0e20e] disabled:opacity-60 text-[#080808] font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(195,249,16,0.25)]"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isApplying ? 'SAUVEGARDE…' : 'APPLIQUER CETTE IMAGE'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
