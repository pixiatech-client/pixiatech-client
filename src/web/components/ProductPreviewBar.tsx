'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ArrowLeft, Pencil } from 'lucide-react';

interface ProductPreviewBarProps {
  slug: string;
}

/**
 * Bandeau « MODE PRÉVISUALISATION — BROUILLON ».
 *
 * Rendue uniquement par la page produit lorsque le serveur a validé une session
 * administrateur ET que le produit n'est pas publié. Un visiteur ne peut pas la
 * faire apparaître : le rendu est décidé dans `page.tsx`, jamais ici.
 *
 * Elle n'écrit rien. Aucune action de publication : c'est une lecture.
 *
 * Mesure sa hauteur réelle et l'expose via `--preview-bar-h` sur `#pixia-web`,
 * exactement comme `AdminTopBar` le fait pour `--admin-bar-h`. Le layout, le
 * header et le hero consomment cette variable, donc la page est décalée sous la
 * barre sans valeur codée en dur. Sans prévisualisation la variable reste à 0.
 */
export const ProductPreviewBar: React.FC<ProductPreviewBarProps> = ({ slug }) => {
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.getElementById('pixia-web') || document.documentElement;
    const apply = () => {
      root.style.setProperty('--preview-bar-h', `${el.getBoundingClientRect().height}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--preview-bar-h', '0px');
    };
  }, []);

  return (
    <aside
      ref={barRef}
      data-product-preview-bar="true"
      aria-label="Prévisualisation administrateur d'un produit brouillon"
      style={{ minHeight: 42, boxSizing: 'border-box', top: 'var(--admin-bar-h, 0px)' }}
      className="fixed left-0 right-0 z-[290] bg-amber-500 text-[#1A1300] px-4 text-xs font-mono select-none shadow-lg flex items-center"
    >
      <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
          <span className="font-bold tracking-wider uppercase truncate">
            Mode prévisualisation — Brouillon
          </span>
          <span className="hidden sm:inline text-[10px] border-l border-black/20 pl-2 text-black/70 truncate">
            Cette page n&apos;est pas publique. Publiez le produit pour la rendre visible.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/admin/site-web/produits?edit=${encodeURIComponent(slug)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-black/15 hover:bg-black/25 border border-black/20 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">Modifier le produit</span>
            <span className="sm:hidden">Modifier</span>
          </a>
          <a
            href="/admin/site-web/produits"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-black text-amber-200 hover:bg-black/85 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
            Retour aux produits
          </a>
        </div>
      </div>
    </aside>
  );
};
