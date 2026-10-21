'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { Image as ImageIcon, Upload, Check, X, Sparkles, Link as LinkIcon, Loader2 } from 'lucide-react';
import { findSectionKey, getSectionNode, resolveElementKey, setSelectedElement } from './section-registry';

import { FloatingElementToolbar } from './FloatingElementToolbar';
import { applyElementStyle, elementTextKey, type ElementStyle } from './useCmsElementStyles';
import { normalizeLang } from '@/lib/site-web/cms-i18n';
import { closestExplicitKeyElement, isInsideCmsUi, isMediaElement, isSimpleTextElement } from './section-registry';
import { saveContactField } from './contact-edit';

type MediaKind = 'image' | 'video';

interface ImageEditState {
  element: HTMLElement;
  kind: MediaKind;
  currentSrc: string;
  alt: string;
}

/** Entrée de la bibliothèque d'images réelle (API /api/site-web/media-library). */
interface MediaLibraryItem {
  url: string;
  name: string;
  source: 'static' | 'storage';
}

/**
 * Repli hors-ligne : la bibliothèque réelle est fournie par
 * `/api/site-web/media-library` (démo statiques + uploads Firebase). Si l'API
 * est indisponible, on conserve au minimum les images de démonstration
 * historiques pour que le sélecteur reste utilisable.
 */
const FALLBACK_LIBRARY_IMAGES: MediaLibraryItem[] = [
  { name: 'Hero 1 — Hall Architectural', url: '/uploads/site/hero-1.jpg', source: 'static' },
  { name: 'Hero 2 — Atrium Immersif', url: '/uploads/site/hero-2.jpg', source: 'static' },
  { name: 'Hero 3 — Mur Courbé Panoramique', url: '/uploads/site/hero-3.jpg', source: 'static' },
  { name: 'Tech — ColdLED', url: '/uploads/site/tech-coldled.jpg', source: 'static' },
  { name: 'Tech — SolidSkin', url: '/uploads/site/tech-solidskin.jpg', source: 'static' },
  { name: 'Tech — ArmorLED', url: '/uploads/site/tech-armorled.jpg', source: 'static' },
  { name: 'Tech — CBSF', url: '/uploads/site/tech-cbsf.jpg', source: 'static' },
  { name: 'Tech — Infinite Colors', url: '/uploads/site/tech-infinite.jpg', source: 'static' },
  { name: 'Marché — Corporate', url: '/uploads/site/market-corporate.jpg', source: 'static' },
  { name: 'Marché — Retail', url: '/uploads/site/market-retail.jpg', source: 'static' },
  { name: 'Marché — DOOH', url: '/uploads/site/market-dooh.jpg', source: 'static' },
  { name: 'Marché — Rental & Events', url: '/uploads/site/market-rental.jpg', source: 'static' },
  { name: 'Marché — XR / VP', url: '/uploads/site/market-xr.jpg', source: 'static' },
  { name: 'Experience Center', url: '/uploads/site/xc-bg.jpg', source: 'static' },
  { name: 'Projet — Auckland Centre', url: '/uploads/projects/university-of-aucklands-hiwa-recreation-and-wellbeing-centre.jpg', source: 'static' },
  { name: 'Projet — Poor Things Stage', url: '/uploads/projects/led-wall-evokes-early-cinema-effects-for-poor-things.jpg', source: 'static' },
];

/** Une valeur texte ressemble-t-elle à une URL d'image (pour le filtre « utilisées ») ? */
function looksLikeImageUrl(value: string): boolean {
  if (value.startsWith('data:image')) return true;
  if (value.startsWith('/uploads/')) return true;
  if (value.includes('firebasestorage.googleapis.com')) return true;
  return /^https?:\/\//.test(value) && /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)(\?|#|$)/i.test(value);
}

export const VisualInPlaceEditor: React.FC = () => {
  const {
  isEditing,
  isAdmin,
  currentLang,
  pages,
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

  // Bibliothèque d'images réelle (démo statiques + uploads Firebase), chargée
  // depuis /api/site-web/media-library, avec recherche + filtre « utilisées ».
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState<boolean>(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryQuery, setLibraryQuery] = useState<string>('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'used'>('all');

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

  // Charge la bibliothèque réelle depuis l'API admin (lecture seule). En cas
  // d'échec, on retombe sur les images de démonstration historiques.
  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const res = await fetch('/api/site-web/media-library', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { success?: boolean; items?: MediaLibraryItem[] };
      if (data?.success && Array.isArray(data.items)) {
        setLibraryItems(data.items);
      } else {
        throw new Error('Réponse invalide');
      }
    } catch (err) {
      setLibraryItems(FALLBACK_LIBRARY_IMAGES);
      setLibraryError((err as Error).message || 'Bibliothèque indisponible');
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // Recharge la bibliothèque à chaque ouverture de la modal (une nouvelle image
  // importée depuis l'admin doit apparaître sans recharger la page).
  useEffect(() => {
    if (activeImageTarget) void loadLibrary();
  }, [activeImageTarget, loadLibrary]);

  // Ensemble des URLs d'images déjà utilisées dans les pages CMS (filtre).
  const usedImageUrls = useMemo(() => {
    const set = new Set<string>();
    const visit = (value: unknown): void => {
      if (typeof value === 'string') {
        if (looksLikeImageUrl(value)) set.add(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value && typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach(visit);
      }
    };
    visit(pages);
    return set;
  }, [pages]);

  // Liste affichée : recherche par nom/URL + filtre « toutes / utilisées ».
  const filteredLibrary = useMemo(() => {
    const items = libraryItems || [];
    const q = libraryQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (libraryFilter === 'used' && !usedImageUrls.has(item.url)) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
    });
  }, [libraryItems, libraryQuery, libraryFilter, usedImageUrls]);

  useEffect(() => {
    if (!isEditing || !isAdmin) {
      document.body.classList.remove('cms-editing');
      (window as unknown as Record<string, unknown>).__CMS_IS_EDITING__ = false;
      return;
    }

    document.body.classList.add('cms-editing');
    (window as unknown as Record<string, unknown>).__CMS_IS_EDITING__ = true;

    // La clé de section vient du registre alimenté par EditableWrapper,
    // ou détection sémantique header / footer / data-cms-section, ou fallback page 'main'.
    const getSectionKey = (el: HTMLElement): string | null => {
      const registered = findSectionKey(el);
      if (registered) return registered;
      if (el.closest('header, nav, #site-header')) return 'header';
      if (el.closest('footer, #site-footer')) return 'footer';
      return 'main';
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
      /* En mode édition CMS : tous les éléments de contenu data-reveal doivent être visibles et éditables immédiatement */
      #pixia-web [data-reveal="true"] {
        opacity: 1 !important;
        transform: none !important;
      }
      /* Mode édition CMS : déverrouiller tous les conteneurs et textes du footer pour inspection et édition */
      body.cms-editing #site-footer,
      body.cms-editing #site-footer .wrap,
      body.cms-editing #site-footer .foot-grid,
      body.cms-editing #site-footer [data-element-key],
      body.cms-editing #site-footer div,
      body.cms-editing #site-footer span,
      body.cms-editing #site-footer a,
      body.cms-editing #site-footer button {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Helper: Identifier si l'élément fait partie de l'interface d'administration
    // (Supporte HTMLElement et SVGElement : <svg>, <path>, boutons, inputs, etc.)
    const isCmsTarget = (el: Element | EventTarget | null | undefined): boolean => {
      if (!el || !(el instanceof Element)) return false;
      return isInsideCmsUi(el);
    };

    type PickedTarget = { el: HTMLElement; sectionKey: string; media: boolean };

    /**
     * Cible réellement sous le curseur, indépendamment des overlays
     * `pointer-events:none` (textes posés sur les visuels) et de la liste
     * blanche de balises (les `<div>/<td>…` étaient invisibles pour l'éditeur).
     * `document.elementsFromPoint` renvoie TOUS les éléments au point — y
     * compris ceux en `pointer-events:none` — dans l'ordre de peinture : on
     * prend le premier porteur de texte (ou média) appartenant à une section CMS.
     */
    const pickAtPoint = (x: number, y: number): PickedTarget | null => {
      const stack = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : []) as Element[];
      // Si le point est couvert par l'interface d'administration (barre d'outils
      // flottante, modales, icônes SVG, boutons…), on ne va pas chercher le contenu situé dessous :
      // l'UI reste opaque et ses boutons gardent leur comportement.
      for (const el of stack) {
        if (isCmsTarget(el)) return null;
        if (el instanceof HTMLElement && (getSectionKey(el) || el.getAttribute('data-contact-key'))) {
          break;
        }
      }
      for (const raw of stack) {
        if (!(raw instanceof HTMLElement) || isCmsTarget(raw)) continue;
        const contactKey = raw.getAttribute('data-contact-key');
        const sectionKey = getSectionKey(raw);
        if (!sectionKey && !contactKey) continue;

        if (isMediaElement(raw)) {
          if (sectionKey) return { el: raw, sectionKey, media: true };
          continue;
        }

        const root = sectionKey ? getSectionNode(sectionKey) : null;
        const keyed = closestExplicitKeyElement(raw, root);
        if (keyed) return { el: keyed, sectionKey: sectionKey || '', media: false };

        if (sectionKey && isSimpleTextElement(raw)) {
          return { el: raw, sectionKey, media: false };
        }
      }
      return null;
    };

    // 1. Mouse Over / Out
    const clearHover = () => {
      const prev = hoveredElementRef.current;
      if (prev) {
        prev.classList.remove('pixia-editable-img-hover', 'pixia-editable-text-hover');
        hoveredElementRef.current = null;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      clearHover();
      if (e.target && isCmsTarget(e.target)) return;
      const picked = pickAtPoint(e.clientX, e.clientY);
      if (!picked) return;
      hoveredElementRef.current = picked.el;
      picked.el.classList.add(
        picked.media ? 'pixia-editable-img-hover' : 'pixia-editable-text-hover'
      );
    };

    const handleMouseOut = (e: MouseEvent) => {
      const prev = hoveredElementRef.current;
      const rel = e.relatedTarget as HTMLElement | null;
      if (prev && (!rel || !prev.contains(rel))) {
        prev.classList.remove('pixia-editable-img-hover', 'pixia-editable-text-hover');
        hoveredElementRef.current = null;
      }
    };

    // 2. Click Handler Universel avec interception de navigation
    const handleClick = (e: MouseEvent) => {
      // Origine réelle de l'événement : si le clic provient directement
      // de l'interface CMS (barre d'outils, bouton, icône SVG, input, etc.),
      // on ne doit ni intercepter, ni sélectionner d'élément sous-jacent.
      if (e.target && isCmsTarget(e.target)) {
        return;
      }

      const picked = pickAtPoint(e.clientX, e.clientY);
      if (!picked) {
        // Aucune cible texte/média : on conserve au minimum la sélection de section.
        const fallback = e.target as HTMLElement;
        if (fallback && !isCmsTarget(fallback)) {
          const sk = getSectionKey(fallback);
          if (sk) setSelectedBlockId(sk);
        }
        return;
      }

      const target = picked.el;
      const sectionKey = picked.sectionKey;

      // Cas 0: Édition d'un champ Contact (source Firestore, via l'API
      // existante). Le texte est éditable, la sauvegarde passe par
      // `saveContactField` — aucune écriture dans le JSON du CMS.
      const contactKey = target.getAttribute('data-contact-key');
      if (contactKey) {
        if (target.isContentEditable) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        target.classList.add('pixia-el-selected');
        target.contentEditable = 'true';
        target.focus({ preventScroll: true });

        const originalText = target.innerText;

        const onBlur = () => {
          target.contentEditable = 'false';
          target.removeEventListener('blur', onBlur);
          target.classList.remove('pixia-el-selected');
          if (!target.isConnected) return;
          const newText = target.innerText.replace(/[\n\r]+$/, '');
          if (newText.trim() === originalText.trim()) return;

          showToast('Sauvegarde…', 'pending');
          saveContactField(contactKey, newText)
            .then(() => showToast(`✓ ${contactKey} — sauvegardé`, 'ok'))
            .catch(() => showToast('✕ Échec de la sauvegarde (serveur)', 'error'));
        };

        target.addEventListener('blur', onBlur);
        return;
      }

      if (!sectionKey) return;
      // Déjà en cours d'édition : laisser passer le clic (placement du curseur).
      if (target.isContentEditable) return;

      // En mode édition : intercepter TOUT clic dans une section éditable
      // pour éviter l'exécution d'actions interactives ou de navigations
      // et se consacrer uniquement à la sélection et l'édition CMS.
      e.preventDefault();
      e.stopPropagation();

      const clickableParent =
        (target.closest('a, button, [role="button"]') as HTMLElement | null) ||
        (target.tagName === 'A' || target.tagName === 'BUTTON' ? target : null);

      const sectionRoot = getSectionNode(sectionKey);
      const elementKey = resolveElementKey(target, sectionRoot);
      const clickableElementKey = clickableParent ? resolveElementKey(clickableParent, sectionRoot) : undefined;
      const isMediaTarget = picked.media;

      // Sélection de la section
      setSelectedBlockId(sectionKey);

      // Ancrage visuel : la barre flottante doit pointer sur un élément
      // identifiable. On nettoie l'ancienne sélection puis on marque la nouvelle.
      for (const prev of Array.from(document.querySelectorAll('.pixia-el-selected'))) {
        prev.classList.remove('pixia-el-selected', 'pixia-el-anchor', 'pixia-el-media');
      }
      target.classList.add('pixia-el-selected');
      if (clickableParent) target.classList.add('pixia-el-anchor');
      if (isMediaTarget) target.classList.add('pixia-el-media');

      const resolvedKind: 'text' | 'media' | 'button' | 'link' = isMediaTarget
        ? 'media'
        : clickableParent?.tagName === 'A'
        ? 'link'
        : clickableParent
        ? 'button'
        : 'text';

      // Sélection de l'élément pour la toolbar flottante
      setSelectedElement({
        el: target,
        clickableEl: clickableParent,
        sectionKey,
        elementKey,
        clickableElementKey,
        kind: resolvedKind,
      });

      // Cas 1: Clic sur une image ou vidéo
      if (isMediaTarget) {
        e.preventDefault();
        e.stopPropagation();
        openImageModalForElement(target);
        return;
      }

      // Cas 2: Clic sur un texte — feuille de texte ou élément à clé explicite.
      if (
        !target.hasAttribute('data-text-key') &&
        !target.hasAttribute('data-element-key') &&
        !target.hasAttribute('data-editable') &&
        !isSimpleTextElement(target)
      ) {
        // Sélection seule (barre d'outils), pas d'édition.
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Rendre le pointeur actif même si un overlay `pointer-events:none`
      // rendait ce texte non sélectionnable (sélection souris pendant l'édition).
      const originalPointerEvents = target.style.pointerEvents;
      target.style.pointerEvents = 'auto';
      target.contentEditable = 'true';
      target.focus({ preventScroll: true });
      target.classList.remove('pixia-editable-text-hover');

      const originalText = target.innerText;
      const editLang = normalizeLang(currentLang);

      const handleEditKey = (ev: KeyboardEvent) => {
        ev.stopPropagation();
        if (ev.key === 'Enter') {
          const computedWs = typeof window !== 'undefined' ? window.getComputedStyle(target).whiteSpace : '';
          const isMultiLine =
            target.tagName === 'P' ||
            target.tagName === 'TEXTAREA' ||
            computedWs === 'pre-line' ||
            computedWs === 'pre-wrap' ||
            target.hasAttribute('data-multiline');
          if (!isMultiLine && !ev.shiftKey) {
            ev.preventDefault();
            target.blur();
          }
        }
      };

      const onBlur = () => {
        target.contentEditable = 'false';
        target.style.pointerEvents = originalPointerEvents;
        target.removeEventListener('blur', onBlur);
        target.removeEventListener('keydown', handleEditKey, true);
        if (!target.isConnected) return;

        const newText = target.innerText.replace(/[\n\r]+$/, '');
        if (newText.trim() === originalText.trim()) return;

        // Cible d'écriture : `data-slide-field` (textes par slide, ex.
        // `slider2.title`) prime sur la clé de style `data-text-key`. Sans
        // `data-slide-field`, on garde le comportement historique.
        const slideField = target.getAttribute('data-slide-field');
        const structuredKey = slideField || target.getAttribute('data-text-key');
        if (structuredKey) {
          // Clé réelle : le champ existe dans la section, on l'édite
          // directement (donc traduit par le flux FR/EN existant).
          updateSectionField(sectionKey, structuredKey, newText);
          // Nettoie tout résidu de texte du sac pour ne pas masquer la valeur.
          updateElementStyle(sectionKey, elementKey, {
            text: undefined,
            [elementTextKey('fr')]: undefined,
            [elementTextKey('en')]: undefined,
          });
          void persist(`${sectionKey}.${structuredKey}`);
          return;
        }

        // Pas de clé déclarée : le texte part dans le sac d'éléments,
        // affecté à la langue active (FR et EN restent indépendants).
        const next = updateElementStyle(sectionKey, elementKey, {
          [elementTextKey(editLang)]: newText,
        });
        applyElementStyle(target, next as ElementStyle, editLang);
        void persist(`${sectionKey}._elements.${elementKey}.${elementTextKey(editLang)}`);
      };

      target.addEventListener('keydown', handleEditKey, true);
      target.addEventListener('blur', onBlur);
    };

    // 3. Désélection : Échap ou clic sur une zone neutre.
    const handleDeselectKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedElement(null);
    };

    const handleDeselectClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target && isCmsTarget(target)) return;
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
  }, [isEditing, isAdmin, currentLang, uploadMedia, updateSectionField, updateElementStyle, setSelectedBlockId, persist, openImageModalForElement, showToast]);

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
      // Nettoie tout ancien style dans _elements pour ne pas masquer la nouvelle URL
      updateElementStyle(sectionKey, elementKey, { src: undefined });
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
      applyElementStyle(el, next as ElementStyle, normalizeLang(currentLang));
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
      // La nouvelle image doit être disponible dans la bibliothèque sans
      // rechargement de la page.
      void loadLibrary();
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

            {/* Bibliothèque d'images réelle (démo + uploads admin) */}
            <div className="mb-6">
              <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C3F910]" />
                <span>Bibliothèque d&apos;images du site</span>
                {libraryItems && (
                  <span className="text-[#555] normal-case">
                    ({filteredLibrary.length}
                    {libraryItems.length !== filteredLibrary.length ? `/${libraryItems.length}` : ''})
                  </span>
                )}
              </label>

              {/* Recherche + filtre toutes / utilisées */}
              <div className="flex items-center gap-2 mb-2.5">
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Rechercher une image par nom…"
                  className="flex-1 bg-[#171715] border border-[#2b2b28] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                />
                <div className="flex rounded-lg overflow-hidden border border-[#2b2b28]">
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('all')}
                    className={`px-3 py-2 text-[11px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'all'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    TOUTES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('used')}
                    className={`px-3 py-2 text-[11px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'used'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    UTILISÉES
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 bg-[#141413] rounded-xl border border-[#222]">
                {libraryLoading && (
                  <div className="col-span-3 sm:col-span-6 flex items-center justify-center gap-2 py-8 text-xs text-[#555] font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>CHARGEMENT DE LA BIBLIOTHÈQUE…</span>
                  </div>
                )}

                {!libraryLoading && filteredLibrary.length === 0 && (
                  <div className="col-span-3 sm:col-span-6 flex items-center justify-center py-8 text-xs text-[#555] font-mono text-center px-4">
                    {libraryFilter === 'used'
                      ? 'Aucune image utilisée ne correspond à la recherche.'
                      : 'Aucune image dans la bibliothèque.'}
                  </div>
                )}

                {!libraryLoading &&
                  filteredLibrary.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setNewImageSrc(img.url)}
                      className={`relative rounded-lg overflow-hidden h-16 border transition-all cursor-pointer group ${
                        newImageSrc === img.url
                          ? 'border-[#C3F910] ring-2 ring-[#C3F910]/40'
                          : 'border-[#222] hover:border-[#555]'
                      }`}
                      title={
                        usedImageUrls.has(img.url) ? `${img.name} (utilisée)` : img.name
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {usedImageUrls.has(img.url) && (
                        <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-[#C3F910] shadow" />
                      )}
                    </button>
                  ))}
              </div>

              {libraryError && (
                <p className="mt-2 text-[10.5px] font-mono text-[#ff8a8a]">
                  Bibliothèque serveur indisponible ({libraryError}) — images de démonstration affichées.
                </p>
              )}
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
