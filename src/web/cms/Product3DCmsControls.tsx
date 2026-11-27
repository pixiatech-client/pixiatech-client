'use client';

import { useCallback, useState } from 'react';
import { useCms } from '@/lib/site-web/cms-context';
import { useProducts } from '@/lib/products/products-context';
import { updateProduct } from '@/lib/products/products-service';
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
  const [error, setError] = useState<string | null>(null);
  const [previewModelId, setPreviewModelId] = useState<string | null>(null);

  const slug = slugFromPageId(currentPageId);
  const product = slug ? getBySlug(slug) : undefined;
  const savedModelId = product?.['3dModelId'] ?? null;
  const activeModelId = previewModelId ?? savedModelId;
  const definition = getProduct3DDefinition(activeModelId);

  const selectModel = useCallback(
    async (modelId: string) => {
      if (!product || !isProduct3DModelId(modelId) || saving) return;
      setError(null);
      setPreviewModelId(modelId);
      setSaving(true);
      try {
        await updateProduct(product.slug, { '3dModelId': modelId });
        await refresh();
      } catch {
        setError('Enregistrement impossible. Le modèle affiché reste le modèle sauvegardé.');
      } finally {
        setSaving(false);
        setPreviewModelId(null);
      }
    },
    [product, refresh, saving]
  );

  if (!isEditing) return null;

  return (
    <div className="mx-3 mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3" data-cms-ui="true">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">
          Conception &amp; Dimensions — Modèle 3D
        </div>
        <span className="text-[10px] text-amber-200" aria-live="polite">
          {saving ? 'Enregistrement…' : error ? 'Erreur' : ''}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Sélection du modèle 3D">
        {PRODUCT_3D_MODELS.map((model) => {
          const active = definition.id === model.id;
          return (
            <button
              key={model.id}
              type="button"
              data-testid={`model-button-${model.id}`}
              disabled={!product || saving}
              onClick={() => void selectModel(model.id)}
              aria-pressed={active}
              title={model.appearance}
              className={`h-8 min-w-8 rounded-md border px-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                active
                  ? 'border-amber-300 bg-amber-300 text-black'
                  : 'border-white/20 bg-black/30 text-white hover:bg-white/10'
              }`}
            >
              {`Modèle ${model.number}`}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] leading-snug text-white/60">
        {!product
          ? 'Aucun produit n’est lié à cette page : la sélection sera disponible après création du produit.'
          : `Modèle ${definition.number} — ${definition.label}. Le changement remplace toute la section par le module d’origine et est enregistré dans le produit.`}
      </p>
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </div>
  );
};
