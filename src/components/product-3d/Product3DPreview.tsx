'use client';

import { useEffect, useRef } from 'react';

import Product3DModule from './Product3DModule';
import { product3DModelDisplayName, useProduct3DModelNames } from './model-names';
import './product-3d-preview.css';

interface Product3DPreviewProps {
  modelId: string | null | undefined;
  className?: string;
}

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
 */
export function Product3DPreview({ modelId, className = '' }: Product3DPreviewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const customNames = useProduct3DModelNames();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const apply = () => {
      if (disposed) return;
      const canvases = Array.from(root.querySelectorAll('canvas'));
      if (!canvases.length) return;

      const target =
        canvases.find((canvas) => (canvas.dataset.engine ?? '').startsWith('three.js')) ??
        canvases.slice().sort((a, b) => canvasArea(b) - canvasArea(a))[0];
      target.dataset.p3dPreviewCanvas = 'true';

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
    };

    const observer = new MutationObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    });
    observer.observe(root, { childList: true, subtree: true });

    raf = requestAnimationFrame(apply);
    // Certains moteurs créent leur canvas après une ou deux frames : une
    // seconde passe couvre ce cas sans observer d'attributs en continu.
    timer = setTimeout(apply, 400);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [modelId]);

  const displayName = product3DModelDisplayName(modelId ?? '', customNames);

  return (
    <div
      ref={rootRef}
      data-preview-only="true"
      data-p3d-preview-root="true"
      aria-label={`Prévisualisation 3D — ${displayName}`}
      className={`p3d-admin-preview min-h-[320px] w-full border border-black/10 dark:border-white/10 ${className}`}
    >
      <Product3DModule modelId={modelId} />
    </div>
  );
}

export default Product3DPreview;
