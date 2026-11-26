'use client';

import { ComponentType, Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  getProduct3DDefinition,
  isProduct3DModelId,
  type Product3DModelId,
} from './catalog';

type ModelComponent = ComponentType;

const LOADERS: Record<Product3DModelId, () => Promise<{ default: ModelComponent }>> = {
  'model1-transparent': () => import('./models/model1-transparent/Model3D'),
  'model2-black': () => import('./models/model2-black/Model3D'),
  'model3-curved': () => import('./models/model3-curved/Model3D'),
  'model4-wall': () => import('./models/model4-wall/Model3D'),
  'model5-simple': () => import('./models/model5-simple/Model3D'),
  'model6-kinetic': () => import('./models/model6-kinetic/Model3D'),
};

const MODEL_COMPONENTS = Object.fromEntries(
  Object.entries(LOADERS).map(([id, loader]) => [
    id,
    dynamic(loader, {
      ssr: false,
      loading: () => <ModelLoading />,
    }),
  ]),
) as Record<Product3DModelId, ModelComponent>;

function ModelLoading() {
  return (
    <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 rounded-xl bg-[#090A0C] text-sm text-white/70">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span>Chargement de la visualisation 3D…</span>
    </div>
  );
}

export type Product3DModuleProps = {
  modelId?: string | null;
  className?: string;
  onModelResolved?: (modelId: Product3DModelId) => void;
};

export default function Product3DModule({
  modelId,
  className = '',
  onModelResolved,
}: Product3DModuleProps) {
  const definition = getProduct3DDefinition(modelId);
  const [renderId, setRenderId] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onModelResolved?.(definition.id);
  }, [definition.id, onModelResolved]);

  useEffect(() => {
    setFailed(false);
  }, [definition.id, renderId]);

  useEffect(() => {
    return () => {
      document.querySelectorAll('canvas[data-engine="three.js r187"]').forEach((canvas) => {
        canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: false }));
      });
    };
  }, [definition.id, renderId]);

  const Model = useMemo(() => {
    if (!isProduct3DModelId(modelId)) return MODEL_COMPONENTS[definition.id];
    return MODEL_COMPONENTS[modelId];
  }, [definition.id, modelId]);

  if (failed) {
    return (
      <div className={`flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#090A0C] p-6 text-center ${className}`}>
        <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden />
        <p className="text-sm text-white/80">
          La visualisation 3D « {definition.label} » n’a pas pu être chargée.
        </p>
        <button
          type="button"
          onClick={() => setRenderId((value) => value + 1)}
          className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[320px] w-full ${className}`} key={`${definition.id}-${renderId}`}>
      <Suspense fallback={<ModelLoading />}>
        <Model />
      </Suspense>
    </div>
  );
}
