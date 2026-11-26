'use client';

import { useCallback, useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { useProducts } from '@/lib/products/products-context';
import { updateProduct } from '@/lib/products/products-service';
import Product3DModule from '@/components/product-3d/Product3DModule';
import {
  PRODUCT_3D_MODELS,
  getProduct3DDefinition,
  isProduct3DModelId,
} from '@/components/product-3d/catalog';

function slugFromPageId(pageId: string | undefined): string | null {
  if (!pageId?.startsWith('product__')) return null;
  return pageId.slice('product__'.length);
}

export const Product3DCmsControls: React.FC = () => {
  const { isEditing, currentPageId } = useCms();
  const { getBySlug, refresh } = useProducts();
  const [saving, setSaving] = useState(false);
  const slug = slugFromPageId(currentPageId);
  const product = slug ? getBySlug(slug) : undefined;

  const selectModel = useCallback(
    async (modelId: string) => {
      if (!product || !isProduct3DModelId(modelId) || saving) return;
      setSaving(true);
      try {
        await updateProduct(product.slug, { '3dModelId': modelId });
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [product, refresh, saving]
  );

  if (!isEditing || !product) return null;

  const modelId = product['3dModelId'] ?? null;
  const definition = getProduct3DDefinition(modelId);

  return (
    <div className="mx-3 mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">
          Conception &amp; Dimensions — Modèle 3D
        </div>
        {saving && <span className="text-[10px] text-amber-200">Enregistrement…</span>}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Sélection du modèle 3D">
        {PRODUCT_3D_MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => void selectModel(model.id)}
            aria-pressed={definition.id === model.id}
            title={model.appearance}
            className={`h-8 min-w-8 rounded-md border px-2 text-xs font-bold transition-colors ${
              definition.id === model.id
                ? 'border-amber-300 bg-amber-300 text-black'
                : 'border-white/20 bg-black/30 text-white hover:bg-white/10'
            }`}
          >
            {model.number}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black">
        <Product3DModule modelId={modelId} className="min-h-[240px]" />
      </div>
      <p className="mt-2 text-[10px] text-white/60">
        Modèle {definition.number} — {definition.label}. La sélection est enregistrée dans le produit.
      </p>
    </div>
  );
};
