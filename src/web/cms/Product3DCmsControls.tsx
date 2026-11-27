'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { RotateCcw, Save } from 'lucide-react';

import { useCms } from '@/lib/site-web/cms-context';
import { useProducts } from '@/lib/products/products-context';
import { getProductBySlug, updateProduct } from '@/lib/products/products-service';
import type { ProductRecord } from '@/lib/products/types';
import {
  getProduct3DDefinition,
  isProduct3DModelId,
  type Product3DModelId,
} from '@/components/product-3d/catalog';
import {
  getProduct3DModelId,
  product3DModelPatch,
} from '@/components/product-3d/model-field';
import { product3DModelDisplayName, useProduct3DModelNames } from '@/components/product-3d/model-names';
import {
  clearProduct3DPreviewModelId,
  setProduct3DPreviewModelId,
  useRawProduct3DPreviewModelId,
} from '@/components/product-3d/preview-store';
import { Product3DModelPicker } from '@/components/product-3d/Product3DModelPicker';

function slugFromPageId(pageId: string | undefined): string | null {
  if (!pageId?.startsWith('product__')) return null;
  const slug = pageId.slice('product__'.length);
  return slug || null;
}

function slugFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/^\/web\/product\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

/**
 * Écrit le modèle choisi dans le document produit.
 *
 * Le client Firestore est la voie historique. En secours (session admin sans
 * authentification Firebase côté client), le même patch passe par l'API admin
 * déjà protégée par la session serveur.
 */
async function persistProduct3DModel(slug: string, modelId: Product3DModelId) {
  const patch = product3DModelPatch(modelId);
  try {
    await updateProduct(slug, patch);
    return;
  } catch (clientError) {
    const response = await fetch(`/api/site-web/products/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message || (clientError as Error).message || 'Enregistrement impossible.');
    }
  }
}

export const Product3DCmsControls: React.FC = () => {
  const { isEditing, currentPageId } = useCms();
  const { getBySlug, refresh } = useProducts();
  const pathname = usePathname();
  const customNames = useProduct3DModelNames();

  const slug = slugFromPageId(currentPageId) ?? slugFromPath(pathname);
  const contextProduct = slug ? getBySlug(slug) : null;
  const [directProduct, setDirectProduct] = useState<ProductRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const previewModelId = useRawProduct3DPreviewModelId(slug);

  // Le provider produit du shell peut être vide (Firestore encore en charge ou
  // page statique). On interroge directement le document du slug affiché pour
  // ne jamais désactiver les six boutons à tort.
  useEffect(() => {
    if (!isEditing || !slug) {
      setDirectProduct(null);
      return;
    }
    let active = true;
    getProductBySlug(slug)
      .then((product) => {
        if (active) setDirectProduct(product);
      })
      .catch(() => {
        if (active) setDirectProduct(null);
      });
    return () => {
      active = false;
    };
  }, [isEditing, slug]);

  const product = directProduct ?? contextProduct;
  const savedModelId = getProduct3DModelId(product);
  const activeModelId = previewModelId ?? savedModelId;
  const definition = getProduct3DDefinition(activeModelId);
  const activeName = product3DModelDisplayName(activeModelId, customNames);
  const hasPendingChange = Boolean(product && previewModelId && previewModelId !== savedModelId);

  const selectModel = useCallback(
    (modelId: string) => {
      if (!product || !isProduct3DModelId(modelId) || saving) return;
      setError(null);
      setSavedMessage(false);
      setProduct3DPreviewModelId(product.slug, modelId);
    },
    [product, saving]
  );

  const cancelPreview = useCallback(() => {
    if (!slug) return;
    clearProduct3DPreviewModelId(slug);
    setError(null);
    setSavedMessage(false);
  }, [slug]);

  const save = useCallback(async () => {
    if (!product || !previewModelId || !isProduct3DModelId(previewModelId) || saving) return;
    setSaving(true);
    setError(null);
    setSavedMessage(false);
    try {
      await persistProduct3DModel(product.slug, previewModelId);
      await Promise.all([
        refresh(),
        getProductBySlug(product.slug)
          .then((updated) => setDirectProduct(updated))
          .catch(() => undefined),
      ]);
      clearProduct3DPreviewModelId(product.slug);
      setSavedMessage(true);
    } catch (err) {
      // En cas d'échec on restaure le modèle enregistré : la prévisualisation
      // n'est jamais prise pour une sauvegarde réussie.
      clearProduct3DPreviewModelId(product.slug);
      setError((err as Error).message || 'Enregistrement impossible. Le modèle enregistré a été restauré.');
    } finally {
      setSaving(false);
    }
  }, [product, previewModelId, refresh, saving]);

  // Le CMS annule les changements non sauvegardés quand on quitte l'édition ou
  // la section : la prévisualisation reste donc bien temporaire.
  useEffect(() => {
    if (!isEditing) clearProduct3DPreviewModelId(slug);
  }, [isEditing, slug]);

  useEffect(() => () => clearProduct3DPreviewModelId(slug), [slug]);

  if (!isEditing) return null;

  return (
    <div
      className="mx-3 mb-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-white"
      data-cms-ui="true"
      data-testid="cms-3d-controls"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">
          CHOISIR LE MODÈLE DE PRÉSENTATION 3D
        </div>
        <span className="text-[10px] text-amber-200" aria-live="polite">
          {saving
            ? 'Enregistrement…'
            : savedMessage
              ? 'Modèle enregistré'
              : hasPendingChange
                ? 'Modèle sélectionné — non enregistré'
                : error
                  ? 'Erreur'
                  : ''}
        </span>
      </div>

      <Product3DModelPicker
        variant="cms"
        value={activeModelId}
        onChange={selectModel}
        disabled={!product || saving}
        renameDisabled={saving}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="cms-3d-save"
          disabled={!product || !previewModelId || saving}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-300 px-3 py-1.5 text-[11px] font-bold text-black transition-colors hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          Enregistrer
        </button>
        <button
          type="button"
          data-testid="cms-3d-cancel"
          disabled={!previewModelId || saving}
          onClick={cancelPreview}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Annuler
        </button>
        <span className="text-[10px] text-white/60">
          Actif : {activeName} ({definition.id})
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-snug text-white/60">
        {!product
          ? 'Aucun document produit n’est lié à cette page. Le modèle sera disponible dès que le produit existera dans la base.'
          : `Le changement remplace immédiatement toute la section par le module ${definition.number} d’origine. Les autres produits ne sont pas modifiés.`}
      </p>
      {error && (
        <p className="mt-1 text-[10px] font-semibold text-red-300" role="status">
          {error}
        </p>
      )}
    </div>
  );
};

export default Product3DCmsControls;
