import { useEffect, useState } from 'react';
import { PRESENTATION_MODELS, type ModelActivationMap, type PresentationModelId } from '../types/models';
import {
  countActiveModels,
  deserializeModelState,
  getActiveModel,
  MODEL_STATE_STORAGE_KEY,
  serializeModelState,
  toggleModelById,
} from '../utils/modelState';
import { ModelSwitchRow } from './ModelSwitchRow';
import { ModelViewer3D } from './ModelViewer3D';

function readInitialPersistedState(): ModelActivationMap {
  if (typeof window === 'undefined') {
    return deserializeModelState(null);
  }
  try {
    return deserializeModelState(window.localStorage.getItem(MODEL_STATE_STORAGE_KEY));
  } catch {
    return deserializeModelState(null);
  }
}

export function Presentation3DSection() {
  const [modelStates, setModelStates] = useState<ModelActivationMap>(readInitialPersistedState);
  const [pulseCounters, setPulseCounters] = useState<Record<PresentationModelId, number>>({
    holographique: 0,
    'smd-50x50': 0,
    'smd-50x100': 0,
    'dalle-sample': 0,
    transparent: 0,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(MODEL_STATE_STORAGE_KEY, serializeModelState(modelStates));
    } catch {
      // Ignore storage quota errors in restricted contexts
    }
  }, [modelStates]);

  const activeModel = getActiveModel(modelStates);
  const activeCount = countActiveModels(modelStates);

  const handleToggleModel = (id: PresentationModelId) => {
    setModelStates((prev) => {
      const next = toggleModelById(prev, id);
      if (next[id]) {
        setPulseCounters((counts) => ({ ...counts, [id]: counts[id] + 1 }));
      }
      return next;
    });
  };

  return (
    <section
      aria-labelledby="presentation-3d-heading"
      className="relative w-full rounded-2xl bg-[#0C0F16] text-slate-100 border border-slate-800/80 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.42)] overflow-hidden"
    >
      {/* Subtle overhead studio illumination across the unified card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/3 h-56 w-2/3 -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.09),rgba(59,130,246,0.04)_50%,transparent_75%)]"
      />

      {/* Global Card Header */}
      <header className="relative z-10 px-5 sm:px-7 py-5 border-b border-white/[0.07] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1
            id="presentation-3d-heading"
            className="font-display text-base sm:text-lg font-semibold tracking-tight text-white [text-wrap:balance]"
          >
            Modèle de présentation 3D
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-slate-400">
            {activeCount === 1
              ? 'Un modèle actif · Cinq modèles disponibles'
              : 'Aucun modèle actif · Cinq modèles disponibles'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400 shrink-0">
          <span className="text-slate-300">5 modèles</span>
          <span aria-hidden="true">·</span>
          <span className={activeModel ? 'text-amber-400' : 'text-slate-500'}>
            {activeModel ? `Actif : ${activeModel.displayLabel}` : 'En veille'}
          </span>
        </div>
      </header>

      {/* Single Global Card Body: 55% Commands (Left) / 45% 3D Viewer (Right) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)] items-stretch">
        {/* Left Column — Compact 3D Model Commands */}
        <div className="p-5 sm:p-6 lg:p-7 border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
              <h2 className="font-display text-xs font-semibold text-slate-300">
                Commandes
              </h2>
              <span className="text-xs text-slate-400 tabular-nums truncate">
                Sélection exclusive
              </span>
            </div>

            <ul className="divide-y divide-white/[0.06] mt-1" aria-label="Liste des modèles 3D">
              {PRESENTATION_MODELS.map((model, index) => (
                <ModelSwitchRow
                  key={model.id}
                  model={model}
                  index={index}
                  isActive={Boolean(modelStates[model.id])}
                  activationPulseCount={pulseCounters[model.id]}
                  onToggle={handleToggleModel}
                />
              ))}
            </ul>
          </div>

          <p className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between gap-3">
            <span className="truncate">État enregistré</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
              {activeModel ? activeModel.category : 'En veille'}
            </span>
          </p>
        </div>

        {/* Right Column — Dedicated Interactive 3D Viewer */}
        <div className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 pb-3">
              <h2 className="font-display text-xs font-semibold text-slate-300">
                Prévisualisation 3D
              </h2>
              <span className="font-display text-xs font-semibold text-white truncate">
                {activeModel ? activeModel.displayLabel : 'Inactif'}
              </span>
            </div>

            <div className="w-full h-[290px] sm:h-[340px] lg:h-[360px]">
              <ModelViewer3D activeModel={activeModel} />
            </div>
          </div>

          <p className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between gap-3">
            <span className="truncate">Glisser pour pivoter · Molette pour zoomer</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
              Temps réel 3D
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
