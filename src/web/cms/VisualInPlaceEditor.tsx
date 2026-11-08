'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import {
  Image as ImageIcon,
  Film,
  Upload,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Play,
  Lock,
  AlertTriangle,
  Layers,
  Sliders,
  Palette,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ArrowDownRight,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { findSectionKey, getSectionNode, resolveElementKey, setSelectedElement } from './section-registry';

import { FloatingElementToolbar } from './FloatingElementToolbar';
import {
  applyElementStyle,
  elementTextKey,
  computeOverlayBackground,
  hexToRgba,
  makeElementStyledId,
  type ElementStyle,
  type ImageOverlayConfig,
} from './useCmsElementStyles';
import { normalizeLang } from '@/lib/site-web/cms-i18n';
import { closestExplicitKeyElement, isInsideCmsUi, isMediaElement, isSimpleTextElement } from './section-registry';
import { saveContactField } from './contact-edit';
import { isMediaVideo, looksLikeMediaUrl } from './media-utils';

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
  type?: 'image' | 'video';
}

/**
 * Repli hors-ligne : la bibliothèque réelle est fournie par
 * `/api/site-web/media-library` (démo statiques + uploads Firebase). Si l'API
 * est indisponible, on conserve au minimum les images de démonstration
 * historiques pour que le sélecteur reste utilisable.
 */
const FALLBACK_LIBRARY_IMAGES: MediaLibraryItem[] = [
  { name: 'Showreel PixiaTech (Vidéo Démo)', url: '/youtube-video.mp4', source: 'static', type: 'video' },
  { name: 'Cabinet LED WP (Vidéo)', url: '/uploads/products/wp/wp-cabinet.webm', source: 'static', type: 'video' },
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
  return looksLikeMediaUrl(value);
}

export const VisualInPlaceEditor: React.FC = () => {
  const {
    isEditing,
    isAdmin,
    currentLang,
    pages,
    currentPageData,
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

  // Configuration de l'overlay personnalisable (Fonctionnalité 1)
  const [overlayConfig, setOverlayConfig] = useState<ImageOverlayConfig>({
    enabled: false,
    color: '#000000',
    opacity: 45,
    gradientEnabled: false,
    gradientStartColor: '#000000',
    gradientStartOpacity: 45,
    gradientEndColor: '#000000',
    gradientEndOpacity: 85,
    gradientDirection: 'to bottom',
  });

  // Bibliothèque d'images réelle (démo statiques + uploads Firebase), chargée
  // depuis /api/site-web/media-library, avec recherche + filtre « utilisées ».
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[] | null>(null);
  const [libraryLoading, setLibraryLoading] = useState<boolean>(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryQuery, setLibraryQuery] = useState<string>('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'image' | 'video' | 'used'>('all');

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
    const sectionKey = findSectionKey(el);
    const sectionRoot = sectionKey ? getSectionNode(sectionKey) : null;
    const elementKey = sectionKey ? resolveElementKey(el, sectionRoot) : '';
    const sectionData = sectionKey ? ((currentPageData?.sections?.[sectionKey] as Record<string, unknown>) || {}) : {};
    const bag = (sectionData?._elements as Record<string, ElementStyle>) || {};
    const existingStyle = bag[elementKey] || {};
    const existingOverlay = existingStyle.overlay;

    if (existingOverlay) {
      setOverlayConfig({
        enabled: Boolean(existingOverlay.enabled),
        color: existingOverlay.color || '#000000',
        opacity: existingOverlay.opacity ?? 45,
        gradientEnabled: Boolean(existingOverlay.gradientEnabled),
        gradientStartColor: existingOverlay.gradientStartColor || '#000000',
        gradientStartOpacity: existingOverlay.gradientStartOpacity ?? 45,
        gradientEndColor: existingOverlay.gradientEndColor || '#000000',
        gradientEndOpacity: existingOverlay.gradientEndOpacity ?? 85,
        gradientDirection: existingOverlay.gradientDirection || 'to bottom',
      });
    } else {
      setOverlayConfig({
        enabled: false,
        color: '#000000',
        opacity: 45,
        gradientEnabled: false,
        gradientStartColor: '#000000',
        gradientStartOpacity: 45,
        gradientEndColor: '#000000',
        gradientEndOpacity: 85,
        gradientDirection: 'to bottom',
      });
    }

    setActiveImageTarget({
      element: el,
      kind,
      currentSrc: el.getAttribute('src') || '',
      alt: (el as HTMLImageElement).alt || '',
    });
    setNewImageSrc(el.getAttribute('src') || '');
  }, [currentPageData]);

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

  // Suppression de média
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ url: string; name: string } | null>(null);

  // Ensemble normalisé des URLs de médias déjà utilisées dans les pages CMS (images & vidéos)
  const usedMediaUrls = useMemo(() => {
    const rawSet = new Set<string>();
    const normSet = new Set<string>();

    const normalizeUrl = (u: string) => u.split('?')[0].split('#')[0].trim().toLowerCase();

    const visit = (value: unknown): void => {
      if (typeof value === 'string') {
        if (looksLikeImageUrl(value)) {
          rawSet.add(value);
          normSet.add(normalizeUrl(value));
        }
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
    return { rawSet, normSet };
  }, [pages]);

  const isMediaUsed = useCallback((url: string): boolean => {
    if (!url) return false;
    if (usedMediaUrls.rawSet.has(url)) return true;
    const norm = url.split('?')[0].split('#')[0].trim().toLowerCase();
    return usedMediaUrls.normSet.has(norm);
  }, [usedMediaUrls]);

  // Liste affichée : recherche par nom/URL + filtre strict « TOUS / IMAGES / VIDÉOS / UTILISÉS ».
  const filteredLibrary = useMemo(() => {
    const items = libraryItems || [];
    const q = libraryQuery.trim().toLowerCase();
    return items.filter((item) => {
      const isVid = isMediaVideo(item.url) || item.type === 'video';
      if (libraryFilter === 'video' && !isVid) return false;
      if (libraryFilter === 'image' && isVid) return false;
      if (libraryFilter === 'used' && !isMediaUsed(item.url)) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
    });
  }, [libraryItems, libraryQuery, libraryFilter, isMediaUsed]);

  const handleDeleteMedia = async (url: string) => {
    if (isMediaUsed(url)) {
      showToast('Ce média est actuellement utilisé sur le site et ne peut pas être supprimé.', 'error');
      return;
    }
    setDeletingUrl(url);
    try {
      const res = await fetch('/api/site-web/media-library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      showToast('Média supprimé avec succès');
      setConfirmDeleteModal(null);
      if (newImageSrc === url) {
        setNewImageSrc('');
      }
      await loadLibrary();
    } catch (err: unknown) {
      showToast((err as Error).message || 'Échec de la suppression', 'error');
    } finally {
      setDeletingUrl(null);
    }
  };

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
      }
      .pixia-el-selected:not([data-cms-preview-state="hover"]):not([data-cms-preview-state="active"]) {
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

  // Appliquer le remplacement de l'image ou de la vidéo et/ou son overlay
  const handleApplyImage = async (srcToApply?: string) => {
    const finalSrc = srcToApply || newImageSrc;
    if (!activeImageTarget) return;

    const targetEl = activeImageTarget.element;
    const effectiveSrc = finalSrc || activeImageTarget.currentSrc;
    const isTargetVideo = isMediaVideo(effectiveSrc);
    const effectiveEl = targetEl;

    // Mise à jour de l'attribut src si le type de balise correspond déjà (sinon React re-rendra déclarativement)
    if (finalSrc && ((isTargetVideo && targetEl.tagName === 'VIDEO') || (!isTargetVideo && targetEl.tagName === 'IMG'))) {
      effectiveEl.setAttribute('src', finalSrc);
      if (effectiveEl.tagName === 'IMG') {
        (effectiveEl as HTMLImageElement).src = finalSrc;
      } else if (effectiveEl.tagName === 'VIDEO') {
        (effectiveEl as HTMLVideoElement).src = finalSrc;
        try { (effectiveEl as HTMLVideoElement).play().catch(() => {}); } catch {}
      }
    }

    const sectionKey = findSectionKey(effectiveEl);
    if (!sectionKey) {
      showToast('✕ Section non reconnue — modification non sauvegardée', 'error');
      return;
    }

    const sectionRoot = getSectionNode(sectionKey);
    const elementKey = resolveElementKey(effectiveEl, sectionRoot);
    const explicitKey = effectiveEl.getAttribute('data-image-key') || effectiveEl.getAttribute('data-media-key');

    const nextPatch: Partial<ElementStyle> = {
      ...(finalSrc ? { src: finalSrc, mediaType: isTargetVideo ? 'video' : 'image' } : {}),
      overlay: overlayConfig,
    };

    if (explicitKey && finalSrc) {
      // Clé déclarée par le composant : le champ existe réellement, on l'écrit.
      updateSectionField(sectionKey, explicitKey, finalSrc);
    }
    const next = updateElementStyle(sectionKey, elementKey, nextPatch as Record<string, unknown>);
    applyElementStyle(effectiveEl, next as ElementStyle, normalizeLang(currentLang), makeElementStyledId(sectionKey, elementKey));

    setSelectedBlockId(sectionKey);

    setIsApplying(true);
    const ok = await persist(explicitKey ? `${sectionKey}.${explicitKey}` : `${sectionKey}._elements.${elementKey}`);
    setIsApplying(false);
    if (ok) {
      setActiveImageTarget(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(file.name);
    try {
      setIsUploading(true);
      showToast(isVid ? 'Téléversement de la vidéo en cours…' : 'Téléversement de l\’image en cours…', 'pending');
      const url = await uploadMedia(file);
      setNewImageSrc(url);
      await handleApplyImage(url);
      void loadLibrary();
      showToast(isVid ? '✓ Vidéo insérée et sauvegardée' : '✓ Image insérée et sauvegardée', 'ok');
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
                  {isMediaVideo(newImageSrc || activeImageTarget.currentSrc) ? (
                    <Film className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0 flex items-center gap-2">
                    <span>Modifier / Remplacer ce média</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C3F910]/20 text-[#C3F910]">
                      {isMediaVideo(newImageSrc || activeImageTarget.currentSrc) ? 'VIDÉO' : 'IMAGE'}
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-[#7a7a76] m-0">
                    Sélectionnez un média dans la bibliothèque ou téléversez un nouveau fichier.
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

            {/* Current & Preview Side by Side avec couche d'overlay en temps réel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2 flex items-center justify-between">
                  <span>Média actuel</span>
                  <span className="text-[10px] font-mono text-[#666]">
                    {isMediaVideo(activeImageTarget.currentSrc) ? 'Vidéo' : 'Image'}
                  </span>
                </label>
                <div className="relative h-44 rounded-xl overflow-hidden border border-[#222] bg-[#141414] flex items-center justify-center">
                  {isMediaVideo(activeImageTarget.currentSrc) ? (
                    <video
                      src={activeImageTarget.currentSrc}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeImageTarget.currentSrc}
                      alt="Actuelle"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {/* Couche d'aperçu d'overlay en direct sur le média actuel */}
                  {overlayConfig.enabled && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{ background: computeOverlayBackground(overlayConfig), zIndex: 10 }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2 flex items-center justify-between">
                  <span>Nouvelle sélection</span>
                  {newImageSrc && (
                    <span className="text-[10px] font-mono text-[#C3F910]">
                      {isMediaVideo(newImageSrc) ? 'Vidéo détectée' : 'Image détectée'}
                    </span>
                  )}
                </label>
                <div className="relative h-44 rounded-xl overflow-hidden border border-[#C3F910]/40 bg-[#141414] flex items-center justify-center">
                  {newImageSrc ? (
                    isMediaVideo(newImageSrc) ? (
                      <video
                        src={newImageSrc}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={newImageSrc}
                        alt="Nouvelle"
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <span className="text-xs text-[#555] font-mono">Aucun aperçu</span>
                  )}
                  {/* Couche d'aperçu d'overlay en direct sur la nouvelle sélection */}
                  {overlayConfig.enabled && newImageSrc && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{ background: computeOverlayBackground(overlayConfig), zIndex: 10 }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ── NOUVELLE SECTION : OVERLAY / SUPERPOSITION (FONCTIONNALITÉ 1) ── */}
            <div className="mb-6 bg-[#141412] border border-[#262624] rounded-2xl p-4 shadow-sm">
              {/* En-tête de section avec Interrupteur ON/OFF */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222220] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#C3F910]/15 text-[#C3F910] flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider block">
                      Overlay / Superposition
                    </span>
                    <span className="text-[10px] font-mono text-[#7a7a76]">
                      Superposition colorée ou dégradé non-destructif sur ce média
                    </span>
                  </div>
                </div>

                {/* Interrupteur ON/OFF */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={overlayConfig.enabled}
                    onChange={(e) => setOverlayConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#222220] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#333] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C3F910]" />
                  <span className="ml-2.5 font-mono text-xs font-bold text-[#f5f4f0]">
                    {overlayConfig.enabled ? (
                      <span className="text-[#C3F910]">ACTIVÉ</span>
                    ) : (
                      <span className="text-[#666]">DÉSACTIVÉ</span>
                    )}
                  </span>
                </label>
              </div>

              {overlayConfig.enabled ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  {/* Switch Dégradé ON/OFF */}
                  <div className="flex items-center justify-between bg-[#191917] p-2.5 rounded-xl border border-[#2b2b28]">
                    <span className="font-mono text-xs text-[#ddd] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#C3F910]" />
                      <span>Mode Dégradé (Gradient)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setOverlayConfig((prev) => ({ ...prev, gradientEnabled: !prev.gradientEnabled }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        overlayConfig.gradientEnabled
                          ? 'bg-[#C3F910] text-[#080808] shadow-sm'
                          : 'bg-[#222220] text-[#888] hover:text-white'
                      }`}
                    >
                      {overlayConfig.gradientEnabled ? 'DÉGRADÉ ACTIF' : 'COULEUR UNIE'}
                    </button>
                  </div>

                  {!overlayConfig.gradientEnabled ? (
                    /* CAS 1 : COULEUR UNIE */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#191917] p-3.5 rounded-xl border border-[#2b2b28]">
                      {/* Couleur unie */}
                      <div>
                        <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2">
                          Couleur de superposition
                        </label>
                        <div className="flex items-center gap-2">
                          <label
                            className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#444] cursor-pointer shrink-0 shadow-inner flex items-center justify-center"
                            style={{ background: overlayConfig.color || '#000000' }}
                          >
                            <input
                              type="color"
                              value={overlayConfig.color || '#000000'}
                              onChange={(e) =>
                                setOverlayConfig((prev) => ({ ...prev, color: e.target.value }))
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </label>
                          <input
                            type="text"
                            value={overlayConfig.color || '#000000'}
                            onChange={(e) =>
                              setOverlayConfig((prev) => ({ ...prev, color: e.target.value }))
                            }
                            placeholder="#000000"
                            className="flex-1 bg-[#141412] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:border-[#C3F910] focus:outline-none"
                          />
                        </div>

                        {/* Presets rapides de couleur */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <span className="text-[10px] font-mono text-[#666]">Presets :</span>
                          {[
                            { hex: '#000000', label: 'Noir' },
                            { hex: '#080808', label: 'Dark' },
                            { hex: '#111110', label: 'Anthracite' },
                            { hex: '#ffffff', label: 'Blanc' },
                            { hex: '#C3F910', label: 'Lime' },
                          ].map((p) => (
                            <button
                              key={p.hex}
                              type="button"
                              onClick={() => setOverlayConfig((prev) => ({ ...prev, color: p.hex }))}
                              className="w-4 h-4 rounded border border-[#444] hover:scale-110 transition-transform cursor-pointer"
                              style={{ background: p.hex }}
                              title={`${p.label} (${p.hex})`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Opacité unie */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-mono text-[#8a8880] uppercase">
                            Opacité
                          </label>
                          <span className="font-mono text-xs font-bold text-[#C3F910]">
                            {overlayConfig.opacity ?? 45} %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={overlayConfig.opacity ?? 45}
                          onChange={(e) =>
                            setOverlayConfig((prev) => ({ ...prev, opacity: Number(e.target.value) }))
                          }
                          className="w-full h-1.5 bg-[#262624] rounded-lg appearance-none cursor-pointer accent-[#C3F910]"
                        />
                        {/* Paliers rapides d'opacité */}
                        <div className="flex items-center justify-between mt-2.5 text-[10px] font-mono text-[#777]">
                          {[0, 25, 45, 65, 100].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setOverlayConfig((prev) => ({ ...prev, opacity: step }))}
                              className={`px-1.5 py-0.5 rounded hover:text-white transition-colors cursor-pointer ${
                                overlayConfig.opacity === step ? 'text-[#C3F910] font-bold bg-[#C3F910]/15' : ''
                              }`}
                            >
                              {step}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CAS 2 : SYSTÈME DE DÉGRADÉ (GRADIENT) */
                    <div className="flex flex-col gap-3.5 bg-[#191917] p-3.5 rounded-xl border border-[#2b2b28]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Couleur & Opacité de départ */}
                        <div className="bg-[#141412] p-2.5 rounded-lg border border-[#262624]">
                          <span className="block text-[10.5px] font-mono text-[#8a8880] uppercase mb-2">
                            1. Couleur de Départ
                          </span>
                          <div className="flex items-center gap-2 mb-2">
                            <label
                              className="relative w-7 h-7 rounded-lg overflow-hidden border border-[#444] cursor-pointer shrink-0"
                              style={{ background: overlayConfig.gradientStartColor || '#000000' }}
                            >
                              <input
                                type="color"
                                value={overlayConfig.gradientStartColor || '#000000'}
                                onChange={(e) =>
                                  setOverlayConfig((prev) => ({ ...prev, gradientStartColor: e.target.value }))
                                }
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </label>
                            <input
                              type="text"
                              value={overlayConfig.gradientStartColor || '#000000'}
                              onChange={(e) =>
                                setOverlayConfig((prev) => ({ ...prev, gradientStartColor: e.target.value }))
                              }
                              className="flex-1 bg-[#1a1a18] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono uppercase focus:border-[#C3F910] focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10.5px] font-mono text-[#aaa] mb-1">
                            <span>Opacité départ</span>
                            <span className="text-[#C3F910] font-bold">{overlayConfig.gradientStartOpacity ?? 45} %</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={overlayConfig.gradientStartOpacity ?? 45}
                            onChange={(e) =>
                              setOverlayConfig((prev) => ({
                                ...prev,
                                gradientStartOpacity: Number(e.target.value),
                              }))
                            }
                            className="w-full h-1.5 bg-[#262624] rounded-lg appearance-none cursor-pointer accent-[#C3F910]"
                          />
                        </div>

                        {/* Couleur & Opacité d'arrivée */}
                        <div className="bg-[#141412] p-2.5 rounded-lg border border-[#262624]">
                          <span className="block text-[10.5px] font-mono text-[#8a8880] uppercase mb-2">
                            2. Couleur d&apos;Arrivée
                          </span>
                          <div className="flex items-center gap-2 mb-2">
                            <label
                              className="relative w-7 h-7 rounded-lg overflow-hidden border border-[#444] cursor-pointer shrink-0"
                              style={{ background: overlayConfig.gradientEndColor || '#000000' }}
                            >
                              <input
                                type="color"
                                value={overlayConfig.gradientEndColor || '#000000'}
                                onChange={(e) =>
                                  setOverlayConfig((prev) => ({ ...prev, gradientEndColor: e.target.value }))
                                }
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </label>
                            <input
                              type="text"
                              value={overlayConfig.gradientEndColor || '#000000'}
                              onChange={(e) =>
                                setOverlayConfig((prev) => ({ ...prev, gradientEndColor: e.target.value }))
                              }
                              className="flex-1 bg-[#1a1a18] border border-[#333] rounded px-2 py-1 text-xs text-white font-mono uppercase focus:border-[#C3F910] focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10.5px] font-mono text-[#aaa] mb-1">
                            <span>Opacité arrivée</span>
                            <span className="text-[#C3F910] font-bold">{overlayConfig.gradientEndOpacity ?? 85} %</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={overlayConfig.gradientEndOpacity ?? 85}
                            onChange={(e) =>
                              setOverlayConfig((prev) => ({
                                ...prev,
                                gradientEndOpacity: Number(e.target.value),
                              }))
                            }
                            className="w-full h-1.5 bg-[#262624] rounded-lg appearance-none cursor-pointer accent-[#C3F910]"
                          />
                        </div>
                      </div>

                      {/* Direction du dégradé */}
                      <div>
                        <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2">
                          Direction du dégradé
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                          {[
                            { dir: 'to bottom', label: 'Haut → Bas', icon: ArrowDown },
                            { dir: 'to top', label: 'Bas → Haut', icon: ArrowUp },
                            { dir: 'to right', label: 'Gauche → Droite', icon: ArrowRight },
                            { dir: 'to left', label: 'Droite → Gauche', icon: ArrowLeft },
                            { dir: 'to bottom right', label: 'Diagonal', icon: ArrowDownRight },
                          ].map(({ dir, label, icon: Icon }) => (
                            <button
                              key={dir}
                              type="button"
                              onClick={() =>
                                setOverlayConfig((prev) => ({
                                  ...prev,
                                  gradientDirection: dir as ImageOverlayConfig['gradientDirection'],
                                }))
                              }
                              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer border ${
                                (overlayConfig.gradientDirection || 'to bottom') === dir
                                  ? 'bg-[#C3F910] text-[#080808] font-bold border-[#C3F910] shadow-sm'
                                  : 'bg-[#141412] text-[#8a8880] hover:text-white border-[#262624]'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs font-mono text-[#666] py-1">
                  <span>Aucun filtre appliqué — L&apos;image est affichée à l&apos;état original.</span>
                  <button
                    type="button"
                    onClick={() => setOverlayConfig((prev) => ({ ...prev, enabled: true }))}
                    className="text-[#C3F910] hover:underline cursor-pointer font-bold text-[11px]"
                  >
                    + Activer l&apos;overlay
                  </button>
                </div>
              )}
            </div>

            {/* Input URL Directe */}
            <div className="mb-5">
              <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#C3F910]" />
                <span>URL ou chemin du média (Image ou Vidéo)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageSrc}
                  onChange={(e) => setNewImageSrc(e.target.value)}
                  placeholder="/uploads/... ou /youtube-video.mp4 ou https://..."
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
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
              </div>
              <p className="text-[10.5px] font-mono text-[#666] mt-1.5 mb-0">
                Formats acceptés : Images (PNG, JPG, WebP, SVG) ou Vidéos (MP4, WebM, MOV jusqu’à 512 Mo).
              </p>
            </div>

            {/* Bibliothèque de médias réelle (démo + uploads admin) */}
            <div className="mb-6">
              <label className="block text-[11px] font-mono text-[#8a8880] uppercase mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C3F910]" />
                <span>Bibliothèque de médias du site</span>
                {libraryItems && (
                  <span className="text-[#555] normal-case">
                    ({filteredLibrary.length}
                    {libraryItems.length !== filteredLibrary.length ? `/${libraryItems.length}` : ''})
                  </span>
                )}
              </label>

              {/* Recherche + filtres (Toutes / Images / Vidéos / Utilisées) */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <input
                  type="text"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Rechercher par nom ou extension…"
                  className="flex-1 min-w-[200px] bg-[#171715] border border-[#2b2b28] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-[#C3F910] focus:outline-none"
                />
                <div className="flex rounded-lg overflow-hidden border border-[#2b2b28]">
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('all')}
                    className={`px-2.5 py-2 text-[10.5px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'all'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    TOUS
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('image')}
                    className={`px-2.5 py-2 text-[10.5px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'image'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    IMAGES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('video')}
                    className={`px-2.5 py-2 text-[10.5px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'video'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    VIDÉOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setLibraryFilter('used')}
                    className={`px-2.5 py-2 text-[10.5px] font-mono cursor-pointer transition-colors ${
                      libraryFilter === 'used'
                        ? 'bg-[#C3F910] text-[#080808] font-bold'
                        : 'bg-[#171715] text-[#8a8880] hover:text-white'
                    }`}
                  >
                    UTILISÉS
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
                      ? 'Aucun média utilisé ne correspond à la recherche.'
                      : libraryFilter === 'video'
                      ? 'Aucune vidéo ne correspond au filtre.'
                      : 'Aucun média dans la bibliothèque.'}
                  </div>
                )}

                {!libraryLoading &&
                  filteredLibrary.map((img) => {
                    const isVid = isMediaVideo(img.url) || img.type === 'video';
                    const used = isMediaUsed(img.url);
                    return (
                      <div
                        key={img.url}
                        onClick={() => setNewImageSrc(img.url)}
                        className={`relative rounded-xl overflow-hidden h-20 border transition-all cursor-pointer group bg-[#111] select-none ${
                          newImageSrc === img.url
                            ? 'border-[#C3F910] ring-2 ring-[#C3F910]/50'
                            : 'border-[#222] hover:border-[#444]'
                        }`}
                        title={used ? 'Média actuellement utilisé sur le site' : 'Média disponible (non utilisé)'}
                      >
                        {isVid ? (
                          <div className="relative w-full h-full bg-[#0a0a09] overflow-hidden flex items-center justify-center">
                            <video
                              src={`${img.url}#t=0.5`}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Overlay sombre discret + icône play */}
                            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                              <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/90 shadow">
                                <Play className="w-2.5 h-2.5 fill-current ml-0.5 text-[#C3F910]" />
                              </div>
                            </div>
                            {/* Badge VIDÉO discret en haut à droite */}
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-[#C3F910]/40 text-[#C3F910] text-[7.5px] font-mono font-bold tracking-wider">
                              VIDÉO
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        {/* Indicateur de statut : UTILISÉ ou NON UTILISÉ */}
                        {used ? (
                          <div
                            className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-emerald-500/50 text-emerald-400 text-[8px] font-mono font-bold shadow z-10"
                            title="Ce média est utilisé sur le site (suppression protégée)"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>UTILISÉ</span>
                          </div>
                        ) : (
                          <div
                            className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-zinc-400 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Média non référencé sur le site"
                          >
                            <span>LIBRE</span>
                          </div>
                        )}

                        {/* Corbeille pour supprimer le fichier (avec protection si utilisé) */}
                        {used ? (
                          <div
                            className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/80 backdrop-blur-sm text-zinc-500 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-not-allowed"
                            title="Média actuellement utilisé sur le site : suppression protégée"
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast('Ce média est utilisé dans une section. Remplacez-le avant de pouvoir le supprimer.', 'error');
                            }}
                          >
                            <Lock className="w-3 h-3 text-zinc-400" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteModal({ url: img.url, name: img.name });
                            }}
                            className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/80 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/50 opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer shadow"
                            title="Supprimer définitivement ce fichier"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {libraryError && (
                <p className="mt-2 text-[10.5px] font-mono text-[#ff8a8a]">
                  Bibliothèque serveur indisponible ({libraryError}) — médias de démonstration affichés.
                </p>
              )}
            </div>

            {/* Dialogue de confirmation de suppression */}
            {confirmDeleteModal && (
              <div
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[#141413] border border-[#2b2b28] rounded-xl p-5 max-w-sm w-full text-white shadow-2xl font-mono text-xs">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Confirmer la suppression</span>
                  </div>
                  <p className="text-[#a0a09a] mb-4 leading-relaxed">
                    Voulez-vous supprimer définitivement ce média du stockage ? Cette action est irréversible.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteModal(null)}
                      className="px-3 py-1.5 rounded-lg border border-[#333] hover:bg-[#222] text-[#888] hover:text-white transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(confirmDeleteModal.url)}
                      disabled={deletingUrl === confirmDeleteModal.url}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {deletingUrl === confirmDeleteModal.url ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                <span>
                  {isApplying
                    ? 'SAUVEGARDE…'
                    : isMediaVideo(newImageSrc)
                    ? 'APPLIQUER CETTE VIDÉO'
                    : 'APPLIQUER CE MÉDIA'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
