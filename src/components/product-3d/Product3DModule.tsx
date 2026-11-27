'use client';

import { ComponentType, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  DEFAULT_PRODUCT_3D_MODEL,
  PRODUCT_3D_MODELS,
  getProduct3DDefinition,
  isProduct3DModelId,
  type Product3DModelId,
} from './catalog';
import {
  Product3DConfigProvider,
  useProduct3DConfig,
  type Product3DConfigValue,
} from './config-context';

type ModelComponent = ComponentType;

const LOADERS: Record<Product3DModelId, () => Promise<{ default: ModelComponent }>> = {
  'model1-transparent': () => import('./models/model1-transparent/Model3D'),
  'model2-black': () => import('./models/model2-black/Model3D'),
  'model3-curved': () => import('./models/model3-curved/Model3D'),
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
  /** Configuration du PRODUIT courant (jamais de sélection globale partagée). */
  config?: Product3DConfigValue | null;
  onModelResolved?: (modelId: Product3DModelId) => void;
};

/** Un modèle désactivé n'est ni sélectionnable ni rendu sur la fiche publique. */
function resolveModelId(
  modelId: string | null | undefined,
  config: Product3DConfigValue
): Product3DModelId {
  const requested = getProduct3DDefinition(modelId).id;
  const disabled = config.disabledModels ?? [];
  if (!disabled.includes(requested)) return requested;
  const fallback = PRODUCT_3D_MODELS.find((model) => !disabled.includes(model.id));
  return fallback?.id ?? DEFAULT_PRODUCT_3D_MODEL;
}

/** Identifiant de rendu stable : un changement de réglage remonte le module. */
function configFingerprint(config: Product3DConfigValue): string {
  let raw: string;
  try {
    raw = JSON.stringify({
      disabled: config.disabledModels ?? [],
      params: config.modelParams ?? {},
    });
  } catch {
    raw = '';
  }
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

export default function Product3DModule({
  modelId,
  className = '',
  config,
  onModelResolved,
}: Product3DModuleProps) {
  const inheritedConfig = useProduct3DConfig();
  const safeConfig = useMemo<Product3DConfigValue>(
    () => config ?? inheritedConfig ?? {},
    [config, inheritedConfig]
  );
  const resolvedId = useMemo(
    () => resolveModelId(modelId, safeConfig),
    [modelId, safeConfig]
  );
  const definition = getProduct3DDefinition(resolvedId);
  const [renderId, setRenderId] = useState(0);
  const [failed, setFailed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fingerprint = useMemo(() => configFingerprint(safeConfig), [safeConfig]);

  useEffect(() => {
    onModelResolved?.(definition.id);
  }, [definition.id, onModelResolved]);

  useEffect(() => {
    setFailed(false);
  }, [definition.id, renderId, fingerprint]);

  useEffect(() => {
    return () => {
      // Ne libérer QUE les contextes de CE module : un autre produit ou une
      // autre prévisualisation peut afficher son propre canvas en parallèle.
      contentRef.current?.querySelectorAll('canvas[data-engine^="three.js"]').forEach((canvas) => {
        canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: false }));
      });
    };
  }, [definition.id, renderId]);

  const Model = useMemo(() => {
    if (!isProduct3DModelId(resolvedId)) return MODEL_COMPONENTS[definition.id];
    return MODEL_COMPONENTS[resolvedId];
  }, [definition.id, resolvedId]);

  const content = failed ? (
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
  ) : (
    <div ref={contentRef} className={`relative min-h-[320px] w-full ${className}`}>
      <div
        data-product-3d-render={`${definition.id}-${renderId}-${fingerprint}`}
        className="relative h-full w-full"
        key={`${definition.id}-${renderId}-${fingerprint}`}
      >
        <Suspense fallback={<ModelLoading />}>
          <Model />
        </Suspense>
      </div>
    </div>
  );

  return (
    <Product3DConfigProvider value={safeConfig}>
      {content}
    </Product3DConfigProvider>
  );
}
