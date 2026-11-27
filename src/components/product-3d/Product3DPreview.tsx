'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Product3DModule from './Product3DModule';
import type { Product3DModelId } from './catalog';
import {
  Product3DConfigProvider,
  type Product3DConfigValue,
} from './config-context';
import { product3DModelDisplayName, useProduct3DModelNames } from './model-names';
import './product-3d-preview.css';

interface Product3DPreviewProps {
  modelId: string | null | undefined;
  /** Configuration du produit en cours d'édition (aperçu fidèle du public). */
  config?: Product3DConfigValue | null;
  className?: string;
}

const SIZED_PROPERTIES = ['width', 'height', 'min-height', 'max-height'] as const;

function canvasArea(canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return rect.width * rect.height;
  return Number(canvas.width || 0) * Number(canvas.height || 0);
}

/**
 * Prévisualisation réelle d'un module, SANS ses commandes.
 *
 * Les composants originaux ne sont ni modifiés ni dupliqués : on masque
 * uniquement, dans le conteneur de prévisualisation, tous les éléments qui ne
 * sont pas sur le chemin DOM menant au canvas WebGL. Le rendu 3D, ses
 * matériaux et son animation restent donc ceux du module d'origine.
 *
 * Le cadrage n'est PAS une simple mise à l'échelle CSS : le mount du renderer
 * reçoit les dimensions réelles du panneau en pixels, puis un `resize` est
 * émis. Le `ResizeObserver` interne du module recalcule alors le buffer WebGL,
 * l'aspect de la caméra et le rendu — exactement comme sur la fiche publique.
 */
export function Product3DPreview({ modelId, config, className = '' }: Product3DPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const customNames = useProduct3DModelNames();
  const [resolvedId, setResolvedId] = useState<string | null>(modelId ?? null);

  const configKey = useMemo(() => {
    try {
      return JSON.stringify(config ?? {});
    } catch {
      return '';
    }
  }, [config]);

  const handleModelResolved = useCallback((id: Product3DModelId) => {
    setResolvedId((current) => (current === id ? current : id));
  }, []);

  useEffect(() => {
    setResolvedId(modelId ?? null);
  }, [modelId]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let applying = false;
    let canvas: HTMLCanvasElement | null = null;
    let lastAppliedSize = '';
    const sized = new Map<HTMLElement, Map<string, string>>();

    const restoreStyles = () => {
      sized.forEach((previous, element) => {
        previous.forEach((value, property) => {
          if (value) element.style.setProperty(property, value, 'important');
          else element.style.removeProperty(property);
        });
        delete element.dataset.p3dPreviewSized;
      });
      sized.clear();
    };

    /** Application directe et idempotente : aucun `requestAnimationFrame`.
     *  Les callbacks de ResizeObserver / MutationObserver peuvent être
     *  différés par le navigateur ; attendre une frame ferait perdre un resize
     *  réel. Le garde-fou `applying` absorbe le `resize` que l'on émet nous-
     *  mêmes en fin d'application. */
    function apply() {
      if (disposed || applying || !root) return;
      applying = true;
      try {
        applyNow();
      } finally {
        applying = false;
      }
    }

    function applyNow() {
      const rect = root.getBoundingClientRect();
      const width = Math.round(root.clientWidth || rect.width);
      const height = Math.round(root.clientHeight || rect.height);
      if (width <= 0 || height <= 0) return;

      const canvases = Array.from(root.querySelectorAll('canvas'));
      if (!canvases.length) return;
      const target =
        canvases.find((item) => (item.dataset.engine ?? '').startsWith('three.js')) ??
        canvases.slice().sort((a, b) => canvasArea(b) - canvasArea(a))[0];
      if (canvas !== target) {
        canvas?.removeEventListener('webglcontextlost', onWebglLost);
        canvas = target;
        canvas.addEventListener('webglcontextlost', onWebglLost);
      }
      target.dataset.p3dPreviewCanvas = 'true';
      root.dataset.p3dPreviewWebgl = 'ready';

      const sizeKey = `${width}x${height}`;
      const sizeChanged = sizeKey !== lastAppliedSize;
      lastAppliedSize = sizeKey;

      const keep = new Set<Element>([root, target]);
      let node: Element | null = target;
      while (node && node !== root) {
        node = node.parentElement;
        if (node) keep.add(node);
      }

      root.querySelectorAll<HTMLElement>('*').forEach((element) => {
        if (keep.has(element)) {
          element.style.removeProperty('display');
          delete element.dataset.p3dPreviewHidden;
          return;
        }
        element.dataset.p3dPreviewHidden = 'true';
      });

      // Seuls les ANCÊTRES du canvas et le canvas sont dimensionnés en pixels.
      // Le renderer lit `clientWidth/clientHeight` du mount via son propre
      // ResizeObserver : le buffer WebGL suit donc réellement le panneau.
      const chain: HTMLElement[] = [];
      let ancestor: Element | null = target.parentElement;
      while (ancestor && ancestor !== root) {
        if (ancestor instanceof HTMLElement) chain.push(ancestor);
        ancestor = ancestor.parentElement;
      }
      const nextElements = new Set<HTMLElement>([...chain, target]);

      sized.forEach((previous, element) => {
        if (nextElements.has(element)) return;
        previous.forEach((value, property) => {
          if (value) element.style.setProperty(property, value, 'important');
          else element.style.removeProperty(property);
        });
        delete element.dataset.p3dPreviewSized;
        sized.delete(element);
      });

      nextElements.forEach((element) => {
        let previous = sized.get(element);
        if (!previous) {
          previous = new Map(
            SIZED_PROPERTIES.map((property) => [property, element.style.getPropertyValue(property)])
          );
          sized.set(element, previous);
        }
        element.style.setProperty('width', `${width}px`, 'important');
        element.style.setProperty('height', `${height}px`, 'important');
        element.style.setProperty('min-height', `${height}px`, 'important');
        element.style.setProperty('max-height', `${height}px`, 'important');
        element.dataset.p3dPreviewSized = 'true';
      });

      root.style.setProperty('--p3d-preview-width', `${width}px`);
      root.style.setProperty('--p3d-preview-height', `${height}px`);

      // Filet de sécurité pour les moteurs qui n'écoutent que `window.resize`.
      // Uniquement quand la taille change, pour ne pas boucler sur notre propre
      // écouteur `resize`.
      if (sizeChanged) window.dispatchEvent(new Event('resize'));
    }

    const onWebglLost = () => {
      root.dataset.p3dPreviewWebgl = 'lost';
    };

    const mutationObserver = new MutationObserver(apply);
    mutationObserver.observe(root, { childList: true, subtree: true });

    // Un `ResizeObserver` peut être différé indéfiniment quand l'onglet n'est
    // pas rendu. Observer les ancêtres garantit qu'un changement de `style` ou
    // de `class` du conteneur recadre immédiatement le canvas.
    const layoutObserver = new MutationObserver(apply);
    for (let parent = root.parentElement; parent; parent = parent.parentElement) {
      layoutObserver.observe(parent, { attributes: true, attributeFilter: ['style', 'class'] });
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    resizeObserver?.observe(root);
    window.addEventListener('resize', apply);

    apply();
    // Certains moteurs créent leur canvas après une ou deux frames : une
    // seconde passe couvre ce cas sans observer d'attributs en continu.
    timer = setTimeout(apply, 400);

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      canvas?.removeEventListener('webglcontextlost', onWebglLost);
      mutationObserver.disconnect();
      layoutObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', apply);
      restoreStyles();
    };
  }, [modelId, resolvedId, configKey]);

  const displayName = product3DModelDisplayName(modelId ?? '', customNames);

  return (
    <div
      ref={rootRef}
      data-preview-only="true"
      data-p3d-preview-root="true"
      data-p3d-preview-model={resolvedId ?? ''}
      aria-label={`Prévisualisation 3D — ${displayName}`}
      className={`p3d-admin-preview w-full ${className}`}
    >
      <Product3DConfigProvider value={config}>
        <Product3DModule modelId={modelId} onModelResolved={handleModelResolved} />
      </Product3DConfigProvider>
    </div>
  );
}

export default Product3DPreview;
