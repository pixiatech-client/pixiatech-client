'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, RotateCcw, X } from 'lucide-react';

import { PRODUCT_3D_MODELS, type Product3DModelId } from './catalog';
import {
  defaultProduct3DModelName,
  hydrateProduct3DModelNames,
  product3DModelDisplayName,
  resetProduct3DModelName,
  setProduct3DModelName,
  useProduct3DModelNames,
} from './model-names';

export type Product3DModelPickerVariant = 'cms' | 'admin';

interface Product3DModelPickerProps {
  value: string | null | undefined;
  onChange: (modelId: Product3DModelId) => void;
  variant?: Product3DModelPickerVariant;
  /** Désactive la sélection du modèle (ex. : produit pas encore chargé). */
  disabled?: boolean;
  /** Désactive seulement le renommage global ; par défaut, suit `disabled`. */
  renameDisabled?: boolean;
  className?: string;
}

/**
 * Sélecteur réutilisable des six modules d'origine.
 *
 * Le clic sur la tuile change le modèle ; le crayon renomme le modèle au niveau
 * GLOBAL (document `settings/product_3d_model_names`), sans toucher à
 * l'identifiant technique ni au produit en cours d'édition.
 */
export function Product3DModelPicker({
  value,
  onChange,
  variant = 'admin',
  disabled = false,
  renameDisabled,
  className = '',
}: Product3DModelPickerProps) {
  const customNames = useProduct3DModelNames();
  const [editingId, setEditingId] = useState<Product3DModelId | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savingNameId, setSavingNameId] = useState<Product3DModelId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateProduct3DModelNames();
  }, []);

  const isCms = variant === 'cms';
  const namingDisabled = renameDisabled ?? disabled;

  const startEditing = (modelId: Product3DModelId) => {
    setError(null);
    setEditingId(modelId);
    setDraftName(customNames[modelId] ?? defaultProduct3DModelName(modelId));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName('');
    setError(null);
  };

  const saveName = async (modelId: Product3DModelId) => {
    if (savingNameId) return;
    setSavingNameId(modelId);
    setError(null);
    try {
      const clean = draftName.trim().slice(0, 80);
      await setProduct3DModelName(modelId, clean || null);
      cancelEditing();
    } catch {
      setError('Le nom n’a pas pu être enregistré. Réessayez.');
    } finally {
      setSavingNameId(null);
    }
  };

  const restoreName = async (modelId: Product3DModelId) => {
    if (savingNameId) return;
    setSavingNameId(modelId);
    setError(null);
    try {
      await resetProduct3DModelName(modelId);
      if (editingId === modelId) cancelEditing();
    } catch {
      setError('Le nom par défaut n’a pas pu être restauré. Réessayez.');
    } finally {
      setSavingNameId(null);
    }
  };

  return (
    <div
      role="group"
      aria-label="Choisir le modèle de présentation 3D"
      data-cms-ui={isCms ? 'true' : undefined}
      className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`}
    >
      {PRODUCT_3D_MODELS.map((model) => {
        const active = value === model.id;
        const displayName = product3DModelDisplayName(model.id, customNames);
        const hasCustomName = Boolean(customNames[model.id]?.trim());
        const editing = editingId === model.id;

        return (
          <div
            key={model.id}
            data-model-id={model.id}
            className={`relative min-w-0 rounded-lg border transition-colors ${
              active
                ? isCms
                  ? 'border-amber-300 bg-amber-300/15'
                  : 'border-[color:var(--ui-accent)] bg-emerald-500/10 ring-2 ring-[color:rgba(var(--ui-accent-rgb),0.25)]'
                : isCms
                  ? 'border-white/15 bg-black/30 hover:border-white/35'
                  : 'border-neutral-200 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/30'
            }`}
          >
            <button
              type="button"
              data-testid={`model-button-${model.id}`}
              data-product-3d-model={model.id}
              disabled={disabled}
              aria-pressed={active}
              title={`${model.id} — ${model.sourceFolder} — ${model.appearance}`}
              onClick={() => onChange(model.id)}
              className={`block w-full min-w-0 rounded-lg px-2 pb-8 pt-2 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
                isCms ? 'text-white' : 'text-neutral-900 dark:text-white'
              }`}
            >
              <span
                className={`mb-1 inline-flex rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                  active
                    ? 'bg-amber-300 text-black'
                    : isCms
                      ? 'bg-white/10 text-amber-200'
                      : 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300'
                }`}
              >
                {String(model.number).padStart(2, '0')}
              </span>
              <span
                className={`block truncate text-[11px] font-bold ${isCms ? 'uppercase tracking-wide' : ''}`}
              >
                {displayName}
              </span>
              <span
                className={`mt-0.5 block truncate font-mono text-[9px] leading-tight ${
                  isCms ? 'text-white/50' : 'text-neutral-500 dark:text-neutral-400'
                }`}
                title={model.sourceFolder}
              >
                {model.sourceFolder}
              </span>
            </button>

            {active && (
              <span
                className={`pointer-events-none absolute bottom-1.5 left-2 text-[9px] font-bold uppercase tracking-wider ${
                  isCms ? 'text-amber-300' : 'text-[color:var(--ui-accent)]'
                }`}
              >
                Actif
              </span>
            )}

            {!editing && (
              <span className="absolute right-1 top-1 flex items-center gap-0.5">
                {hasCustomName && (
                  <button
                    type="button"
                    aria-label={`Restaurer le nom par défaut de ${displayName}`}
                    title="Restaurer le nom par défaut"
                    disabled={namingDisabled || savingNameId === model.id}
                    onClick={() => void restoreName(model.id)}
                    className={`grid h-5 w-5 place-items-center rounded transition-colors disabled:opacity-40 ${
                      isCms ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-neutral-400 hover:bg-black/5 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Renommer ${displayName}`}
                  title="Renommer ce modèle"
                  disabled={namingDisabled || savingNameId === model.id}
                  onClick={() => startEditing(model.id)}
                  className={`grid h-5 w-5 place-items-center rounded transition-colors disabled:opacity-40 ${
                    isCms ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-neutral-400 hover:bg-black/5 hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  <Pencil className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}

            {editing && (
              <div className="absolute inset-x-1 bottom-1 top-1 z-10 flex items-center gap-1 rounded-md bg-black/85 p-1">
                <input
                  autoFocus
                  type="text"
                  maxLength={80}
                  value={draftName}
                  aria-label={`Nouveau nom pour ${model.id}`}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void saveName(model.id);
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelEditing();
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-white/20 bg-white/10 px-1.5 py-1 text-[11px] font-bold text-white outline-none focus:border-amber-300"
                />
                <button
                  type="button"
                  aria-label="Enregistrer le nom"
                  disabled={savingNameId === model.id}
                  onClick={() => void saveName(model.id)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded bg-amber-300 text-black disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Annuler le renommage"
                  disabled={savingNameId === model.id}
                  onClick={cancelEditing}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded bg-white/10 text-white disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            )}
          </div>
        );
      })}
      {error && (
        <p className="col-span-full text-[10px] font-semibold text-red-400" role="status">
          {error}
        </p>
      )}
    </div>
  );
}

export default Product3DModelPicker;
