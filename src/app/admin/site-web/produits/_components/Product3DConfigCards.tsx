'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  PRODUCT_3D_MODELS,
  isProduct3DModelId,
  type Product3DModelId,
} from '@/components/product-3d/catalog';
import type { Product3DModelNames } from '@/components/product-3d/model-names';
import { Switch } from '@/components/ui/switch';
import {
  PRESENTATION_3D_META,
  presentation3DName,
} from './presentation-3d-meta';

interface Product3DConfigCardsProps {
  selectedModelId: string;
  names: Product3DModelNames;
  onModelChange: (id: Product3DModelId) => void;
}

/**
 * Lignes compactes de la carte « Modèle de présentation 3D » : index, nom,
 * dimensions, état ON/OFF et interrupteur partagé. Les identifiants, la
 * sélection exclusive et la sauvegarde restent ceux de PIXIATECH.
 */
export function Product3DConfigCards({
  selectedModelId,
  names,
  onModelChange,
}: Product3DConfigCardsProps) {
  const [activationPulses, setActivationPulses] = useState<
    Partial<Record<Product3DModelId, number>>
  >({});
  const previousSelection = useRef(selectedModelId);

  useEffect(() => {
    if (selectedModelId === previousSelection.current) return;
    previousSelection.current = selectedModelId;
    if (!isProduct3DModelId(selectedModelId)) return;
    setActivationPulses((current) => ({
      ...current,
      [selectedModelId]: (current[selectedModelId] ?? 0) + 1,
    }));
  }, [selectedModelId]);

  return (
    <>
      {PRODUCT_3D_MODELS.map((model, index) => {
        const active = selectedModelId === model.id;
        const meta = PRESENTATION_3D_META[model.id];
        const name = presentation3DName(model.id, names);
        const staggerStyle = { '--wave-delay': `${index * 70}ms` } as CSSProperties;

        return (
          <li
            key={model.id}
            data-model-id={model.id}
            data-active={active ? 'true' : 'false'}
            data-testid="admin-3d-row"
            className="relative overflow-hidden border-b border-white/[0.06] last:border-b-0"
          >
            <div
              style={staggerStyle}
              className={`pixia-admin-row-settle group relative flex min-h-[54px] w-full items-center justify-between gap-2.5 px-3 py-2.5 transition-colors duration-200 sm:gap-3 sm:px-4 ${
                active
                  ? 'bg-gradient-to-r from-amber-500/[0.11] via-amber-400/[0.04] to-transparent'
                  : 'bg-transparent hover:bg-white/[0.03]'
              }`}
            >
              <span
                aria-hidden="true"
                style={staggerStyle}
                className="pixia-admin-wave-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-amber-300/[0.14] to-transparent"
              />

              {active && (activationPulses[model.id] ?? 0) > 0 && (
                <span
                  key={activationPulses[model.id]}
                  aria-hidden="true"
                  className="pixia-admin-wave-activate pointer-events-none absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-transparent via-amber-400/[0.22] to-transparent"
                />
              )}

              <div className="relative z-10 flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span
                  className={`shrink-0 font-mono text-xs tabular-nums transition-colors duration-150 ${
                    active
                      ? 'font-semibold text-amber-400'
                      : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
                  {meta.indexLabel}
                </span>

                <div className="min-w-0">
                  <div
                    className={`truncate text-sm font-semibold tracking-[-0.01em] transition-colors duration-150 ${
                      active ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    }`}
                    title={name}
                  >
                    {name}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {meta.dimensions}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
                <span
                  data-testid="admin-3d-on-off-indicator"
                  data-state={active ? 'on' : 'off'}
                  aria-label={`${name} : ${active ? 'ON' : 'OFF'}`}
                  title={`${name} : ${active ? 'ON' : 'OFF'}`}
                  className={`w-7 text-right font-mono text-[11px] font-semibold tracking-wider tabular-nums transition-colors duration-150 ${
                    active ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {active ? 'ON' : 'OFF'}
                </span>

                <Switch
                  checked={active}
                  onCheckedChange={(next) => {
                    if (next && !active) onModelChange(model.id);
                  }}
                  size="sm"
                  sound={!active}
                  aria-label={active ? `${name} est le modèle actif` : `Activer ${name}`}
                  className="shrink-0 after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-['']"
                />
              </div>
            </div>
          </li>
        );
      })}
    </>
  );
}
